#!/usr/bin/env python
from flask_jwt_extended import ( JWTManager,
                                 jwt_required,
                                 get_jwt_identity,
                                 create_access_token,
                                 create_refresh_token,
                                 jwt_refresh_token_required)
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from passlib.context import CryptContext
from flask import ( Flask,
                    abort,
                    flash,
                    session,
                    request,
                    jsonify,
                    Blueprint,
                    render_template)
from flask import current_app as app
from flask_limiter import Limiter
from fractions import Fraction
import pyzbar.pyzbar as pyzbar
from flask_images import Images
from pony.orm import *
from PIL import Image
import configparser
import sp_database
import requests
import datetime
import re
import os

myctx = CryptContext(schemes="sha256_crypt",
                     sha256_crypt__min_rounds=131072)

bp = Blueprint( 'main', __name__ )

# def add_cors_headers(response):
#     #response.headers['Access-Control-Allow-Origin'] = '*'
#     response.headers['Access-Control-Allow-Origin'] = 'http://rancher:5000/uploader'
#     if request.method == 'OPTIONS':
#         #response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT'
#         response.headers['Access-Control-Allow-Methods'] = 'POST'
#         headers = request.headers.get('Access-Control-Request-Headers')
#         if headers:
#             response.headers['Access-Control-Allow-Headers'] = headers
#     return response

@db_session
def authenticate(username, password):
    user = sp_database.Users.get(lambda u: u.username == username)
    if user is not None:
        valid, new_hash = myctx.verify_and_update(password, user.pwHash)
        if valid:
            if new_hash:
                user.pwHash = hash
            return user
        return None
    return None

@db_session
def identify(username):
    user = sp_database.Users.get(lambda u: u.username == username)
    return user

def singular(name):
    no_plural = r'(\w+?)s\b'
    s_name = re.match(no_plural, name)
    if s_name:
        name = s_name.group(1)
    return name

convert = {
 "pinch" : 0.03,
 "pinche" : 0.03,
 "teaspoon" : 0.25,
 "tablespoon" : 0.5,
 "ounce" : 1.0,
 "slice" : 1.0,
 "strip": 1.0,
 "cup" : 8.0,
 "pint" : 16.0,
 "pound": 16.0,
 "quart" : 128.0,
 "liter" : 256.0,
 "gallon" : 512.0}

@bp.route('/v1/recipes/parse', methods=['POST'])
@jwt_required
@db_session
def parse_recipe():
    if not request.json:
        return jsonify({ "Must use json and set json header": 400 }), 400
    recipe = request.json.get('recipe')
    if recipe is None:
        return jsonify({ "Missing attribute: recipe": 400 }), 400
    username = get_jwt_identity()
    user = identify(username)
    data = {}
    data['input'] = recipe
    title_or_name = re.search(r'(\W*[\w ]+)(\r\n|\r|\n)', recipe)
    data['is_duplicate'] = False
    if title_or_name:
        data['name'] = title_or_name.group(1)
        is_duplicate = sp_database.Recipes.get(lambda r: r.uid == user and
                                                         r.name == data['name'] )
        if is_duplicate:
            data['is_duplicate'] = True
    data['ingredients'] = []
    data['instructions'] = []

    start = False
    stop = False
    counter = 0
    token_start = r'[Ii]ngredients'
    token_stop = r'[Mm]ake [Ii]t|[Ii]nstructions|[Dd]irections'
    # split on returns of all kinds!
    for line in re.split(r'\r\n|\r|\n', recipe):
        # The start and stop for ingredient parsing
        if re.search(token_start, line):
            start = True
            continue
        if re.search(token_stop, line):
            stop = True
            continue

        # The ingredient parsing section.
        if start and not stop:
            ing = ingredient_line_parse(line.lower())
            if ing is None:
                # this ingredient is not parsable, we got little out of it.
                # display it anyhow
                if re.search(r'\w+',line.lower()):
                    ing = {
                        # strips whitespace from before and after line.
                        "uid": user.id,
                        "name": line.strip(),
                        "amount": 0, # in oz always!!!!
                        "amount_pkg": 0,
                        "keepStocked": False}
                else:
                    # This sir... is nothing of interest.
                    continue
            # counter because I need to be able to address between session AND
            # html.
            counter += 1
            ing['id'] = counter
            discover_by_name = []
            perfect_match = []

            # if we have a name then go ahead and try to pull info for that.
            if ing.get('name'):
                discover_by_name = ingredient_search(ing['name'], user.id)
                perfect_match = [ m for m in discover_by_name if m.get('perfect_match')]
                if perfect_match:
                    ing['is_matching'] = 'perfect'
                    ing['pantry'] = perfect_match
                elif discover_by_name:
                    ing['is_matching'] = 'some'
                    ing['pantry'] = discover_by_name
                else:
                    ing['is_matching'] = 'no'
                    ing['pantry'] = []

            # adjust id's and id pantry items as well.
            for item in ing['pantry']:
                counter += 1
                item['id'] = counter

            # just to make sure it has a name, it may not have one yet.
            # print("name {}".format(len(ing['name'])))
            # look for word characters
            if not re.search(r'\w+', ing['name']):
                # print("not named")
                ing['name'] = ing['amount_measure']
            data['ingredients'].append(ing)
        if stop == True:
            if re.search(r'.+',line):
                data['instructions'].append(line)
    if len(data['ingredients']) < 1:
        return jsonify({ "Bad Request": "No ingredients found, did you use the correct format?" }), 400
    if len(data['instructions']) < 1:
        return jsonify({ "Bad Request": "No instructions found, did you use the correct format?" }), 400
    return jsonify({ "recipe": data }), 200

def ingredient_search(name, uid):
    with db_session:
        ings = select(ing for ing in sp_database.Ingredients if ing.uid.id == uid)[:]
        # look for a perfect match with a previous ingredient
        for ing in ings:
            # print("test singular:'{}'='{}'".format(singular(ing.name.lower()),singular(name.lower())))
            if singular(ing.name) == singular(name):
                item = ing.to_dict()
                item['perfect_match'] = True
                return (item, )
        # score ingredients on word association and offer suggestions
        scores = {}
        form_words = re.split('\W', name)
        for form_wrd in form_words:
            for ing in ings:
                for ing_name_wrd in re.split('\W', ing.name):
                    # case insensitive scrore match
                    if form_wrd and form_wrd in ing_name_wrd:
                        # print("{} in {}".format(form_wrd.lower(), ing_name_wrd.lower()))
                        if not scores.get(ing.name):
                            scores[ing.name] = 1
                        else:
                            scores[ing.name] += 1
        sorted_by_value = sorted(scores.items(), key=lambda kv: kv[1])
        top_three = dict(sorted_by_value[0:2]).keys()
        top_three_matches = []
        for ing in ings:
             if ing.name in top_three:
                 item= ing.to_dict()
                 item['name'] = ing.name
                 top_three_matches.append(item)
        return top_three_matches

def ingredient_line_parse(line):
    amount, measure = (None, None)
    #### pattern building ####
    # match preference 1 2/3 | 1/2 | 1 | 1.2
    num = r'(\d+\s\d+[^\d]\d+|\d+[^\d]\d+|\d+|\d+\.\d+)'
    # match a word
    word = r'(\w+)'
    # matches any phrases that might be a description don't be greedy though.
    desc = r'((\w-? ?){2}(\w-? ?)*)'
    # number, w-spaces, a word.
    num_wrd = num + r'\s*' + word
    # number, w-spaces, a word, w-space, desc
    num_wrd_desc = num + r'\s+' + word + r'\s+' + desc
    # desc, w-spaces, number, w-spaces, a word
    desc_num_wrd = desc + r'\s*' + num + r'\s*' + word
    #### end patterns ####

    #clean up space before and after
    line = line.strip(' ')
    # Capture data in parens, this can only handle one set in a line.
    prensCheck = r'\(([^)]*)\)'
    perens = re.search(prensCheck, line)
    if perens:
        ''' check for parens and strip that section out
            writing any good looking data to amount, measure '''
        # print("format3:{}".format(perens.group(1),))
        # format0 = re.search(num_wrd, perens.group(1))
        # amount, measure = format0.group(1), singular(format0.group(2))
        line = re.sub(prensCheck,'', line)

    format1 = re.search(num_wrd_desc, line)
    format2 = re.search(desc_num_wrd, line)
    format3 = re.search(num_wrd, line)
    if format1 and not perens:
        # print("format1 not perens:{}".format(format1.group(3)))
        if not convert.get(singular(format1.group(2))):
            name = format1.group(2) + " " + format1.group(3)
        else:
            name = format1.group(3)
        return {"name":  name,
                "amount": float(to_math(format1.group(1))),
                "amount_pkg": 0,
                "keepStocked": False,
                "amount_measure": singular(format1.group(2))}
    if format1 and perens:
        # print("format1 with perens:{}".format(format1.group(3)))
        return  {"name": format1.group(3),
                "amount": float(to_math(format1.group(1))),
                "amount_pkg": 0,
                "keepStocked": False,
                "amount_measure": singular(format1.group(2)),
                "conversion": "({} {})".format(amount,measure)}
    if format2 and not perens:
        # print("format2 not perens:{}".format(format2.group(3)))
        return  {"name": format2.group(1),
                "amount": float(to_math(format2.group(2))),
                "amount_pkg": 0,
                "keepStocked": False,
                "amount_measure": singular(format2.group(3))}
    if format2 and perens:
        # print("format2 with perens:{}".format(format2.group(3)))
        return  {"name": format2.group(1),
                "amount": float(to_math(format2.group(2))),
                "amount_pkg": 0,
                "keepStocked": False,
                "amount_measure": singular(format2.group(3)),
                "conversion": "({} {})".format(amount,measure)}
    if format3 and not perens:
        # print("format3 not perens:{}".format(format3.group(2)))
        return {"name": format3.group(2),
                "amount": float(to_math(format3.group(1))),
                "amount_pkg": 0,
                "amount_measure": "",
                "keepStocked": False}
    if format3 and perens:
        # print("format3 with perens:{}".format(format3.group(2)))
        return {"name": format3.group(2),
                "amount": float(to_math(format3.group(1))),
                "amount_pkg": 0,
                "keepStocked": False,
                "amount_measure": "",
                "conversion": "({} {})".format(amount,measure)}
    # This is not a parsable ingredient!
    # print("not an ingredient: {}".format(line))
    return None

def to_display(aNumber):
    wholeNum = 0
    while aNumber >= 1:
        aNumber -= 1
        wholeNum += 1
    if wholeNum < 1:
        wholeNum = ''
    if aNumber == 0:
        aNumber = ''
    else:
        aNumber = Fraction(aNumber)
    return ' '.join([str(wholeNum), str(aNumber)]).strip()

def to_math(aString):
    aString = str(aString)
    m = re.split(' ', aString)
    if len(m) == 2:
        wholeNum, fraction = m
        wholeNum = int(wholeNum)
        fraction = Fraction(fraction)
        return fraction + wholeNum
    try:
        num = Fraction(m[0])
    except ValueError:
        num = None
    return num

def meal_count(requirements):
    ''' Given requirement objects, describes how many times this set is
       satisfied up to 1000'''
    with db_session:
        running = 1000
        for req in requirements:
            if not req.amount:
                continue
            else:
                current = int(req.ingredient.amount // req.amount)
            if current == 0:
                return 0
            if current < running:
                running = current
        return running

def assert_int_value(thing):
    # print("before assert {}".format(thing))
    if not thing:
        thing = 0
        return thing
    thing = int(thing)
    if thing > 1000:
        thing = 1000
    if thing < 0:
        thing = 0
    return thing

def get_config():
    config = configparser.ConfigParser()
    config.read('/etc/stupid_pantry.conf')
    return config

def get_socket(config=False):
    host = '0.0.0.0'
    host = '192.168.1.70'
    host = '0.0.0.0'
    port = 5001

    try:
        sect = config['control']
    except:
        sect = False
    if sect:
        host = sect.get('host', host)
        port = sect.getint('port', port)
    return (host, port)

def db_setup(config=False):
    try:
        sect = config['database']
    except:
        sect = False
    if sect:
        dbtype = sect.get('dbtype', os.getenv('DB_TYPE'))
        if dbtype:
            dbconfig = (
                sect.get('dbhost', os.getenv('DB_HOST')),
                sect.get('dbuser', os.getenv('DB_USER')),
                sect.get('dbpasswd', os.getenv('DB_PASSWD')),
                sect.get('dbname', os.getenv('DB_NAME')),
                sect.get('dbport', os.getenv('DB_PORT'))
            )
            sp_database.spantry.bind('mysql', *dbconfig)
        else:
            sp_database.spantry.bind('sqlite',filename='sp.sqlite', create_db=True)
    else:
        sp_database.spantry.bind('sqlite',filename='sp.sqlite', create_db=True)
    sp_database.spantry.generate_mapping(create_tables=True)

def app_factory():
    app = Flask(__name__)
    app.register_blueprint(bp)
    # app.after_request(add_cors_headers)
    app.secret_key = b'\xfc\xef\x91EQ\xcb.N\x89\xc8\x97\xbb^\xd3\x863'
    return app

@jwt_required
def delete_user(username):
    # TODO-later: IT would be nice if user accounts could be active/inactive.
    current_user = get_jwt_identity()
    username = request.json.get('username')
    if current_user == username:
        user = sp_database.Users.get(lambda u: u.username == username)
        if user is None:
            return jsonify({ "not found": 404 }), 404
        user.delete()
        return jsonify({ "DELETED": 200 }), 200
    else:
        return jsonify({ "forbidden" : 403 }), 403

# Route for handling the login page logic
@bp.route('/v1/users', methods=['POST', 'DELETE'])
@db_session
def users():
    if not request.json:
        return jsonify({ "Must use json and set json header": 400 }), 400
    username = request.json.get('username')
    if username is None:
        return jsonify({ "Missing attribute: username": 400 }), 400
    if request.method == 'POST':
        password = request.json.get('password')
        if username is None or password is None:
            return jsonify({ "missing username or password": 400 }), 400
        # attempt to query for this user.
        user = sp_database.Users.get(lambda u: u.username == username)
        if user:
            return jsonify({ "response": "conflicts with previous user", "status": 409 }), 409
        pwHash = myctx.hash(password)
        user = sp_database.Users(username = username,
                                pwHash = pwHash,
                                is_authenticated = False,
                                is_active = False,
                                is_anonymous = False)
        return jsonify({'username': user.username}), 201
    if request.method == 'DELETE':
        return delete_user(get_jwt_identity())

@bp.route('/v1/auth', methods=['POST'])
def auth():
    if not request.json:
        return jsonify({ "Must use json and set json header": 400 }), 400
    username = request.json.get('username')
    if username is None:
        return jsonify({ "Missing attribute: username": 400 }), 400
    password = request.json.get('password')
    if password is None:
        return jsonify({ "missing attribute: password": 400 }), 400
    # attempt to query for this user.
    user = authenticate(username, password)
    if user is None:
        abort(401)
    # Identity can be any data that is json serializable.
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    return jsonify({ "access_token": access_token,
                     "refresh_token": refresh_token }), 200
# TODO: delete implementation with token expires

@bp.route('/v1/auth/refresh', methods=['POST'])
@jwt_refresh_token_required
def auth_refresh():
    user = get_jwt_identity()
    ret = { 'access_token': create_access_token(identity=user)}
    return jsonify(ret), 200

@bp.route('/v1/inventory/use/<recipeName>', methods=['PUT'])
@jwt_required
@db_session
def inventory_use(recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    recipe = sp_database.Recipes.get(name=recipeName, uid=user.id)
    if not recipe:
        return jsonify({ "not found": 404 }), 404
    else:
        allRequirements = recipe.requirements
        for req in allRequirements:
            useAmount = meteric2oz(req.amount, req.amount_measure)
            ing = req.ingredient
            ing.amount = max(ing.amount - useAmount, 0)
        return jsonify({ "OK": 200 }), 200

@bp.route('/v1/inventory/image/<ingredientName>', methods=['POST'])
@bp.route('/v1/recipe/image/<recipeName>', methods=['POST'])
@jwt_required
@db_session
def image_add(ingredientName=None, recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if ingredientName:
        obj = sp_database.Ingredients.get(uid=user.id, name=ingredientName)
    if recipeName:
        obj = sp_database.Recipes.get(uid=user.id, name=recipeName)
    if obj is None:
        return jsonify({ "not found": 404 }), 404
    if 'file' not in request.files:
        return jsonify({ "Error": 400,
                         "response": 'No file part' }), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({ "Error": 400,
                         "response": 'No selected file' }), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        year  = datetime.date.today().strftime('%y')
        path = os.path.join(app.config['UPLOAD_FOLDER'], str(user.id))
        try:
            os.mkdir(path)
        except:
            pass
        path = os.path.join(app.config['UPLOAD_FOLDER'], str(user.id), year)
        try:
            os.mkdir(path)
        except:
            pass
        path = os.path.join(app.config['UPLOAD_FOLDER'], str(user.id), year, filename)
        file.save(path)
        obj.imagePath = os.path.join(str(user.id), year, filename)
        return jsonify({ "OK": 200 }), 200
    return jsonify({ "incorrect file type": 400 }), 400

@bp.route('/v1/inventory/image/<ingredientName>', methods=['DELETE'])
@bp.route('/v1/recipe/image/<recipeName>', methods=['DELETE'])
@jwt_required
@db_session
def image_remove(ingredientName=None, recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    print(recipeName)
    if ingredientName:
        obj = sp_database.Ingredients.get(uid=user.id, name=ingredientName)
    if recipeName:
        obj = sp_database.Recipes.get(uid=user.id, name=recipeName)
    if obj is None:
        return jsonify({ "not found": 404 }), 404
    path = os.path.join(app.config['UPLOAD_FOLDER'], obj.imagePath)
    os.unlink(path)
    obj.imagePath = ''
    return jsonify({ "OK": 200 }), 200

@bp.route('/v1/inventory', methods=['GET'])
@bp.route('/v1/inventory/<ingredientName>', methods=['GET','POST','PUT','DELETE'])
@jwt_required
@db_session
def inventory(ingredientName=None):
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        ret = None
        if not request.json:
            if ingredientName:
                ret = sp_database.Ingredients.get(name=ingredientName, uid=user.id)
            else:
                ret = sp_database.Ingredients.select(lambda i: i.uid == user)[:]
                all = [i.to_dict(exclude=['uid','required_by']) for i in ret]
                return jsonify(all), 200
        if ret:
            ing = ret.to_dict(exclude=['uid','required_by'])
            ing['required_by'] = [ v.to_dict(exclude=['uid','requirements']) for v in
            ret.required_by.recipe ]
            for item in ing['required_by']:
                if item.get('imagePath'):
                    item['imagePath'] = get_thubnail(item['imagePath'])
            # get the most often used measure
            is_measured = False
            for k in ret.required_by.amount_measure:
                if convert.get(k) and convert[k] != 1:
                    is_measured = True
            if is_measured:
                ing['measured'] = True
            if ing.get('imagePath'):
                ing['imagePath'] = get_thubnail(ing['imagePath'])
            return jsonify(ing)
        else:
            return jsonify({ "not found": 404 }), 404
    if request.method == 'POST':
        if not request.json:
            return jsonify({ "Must use json and set json header": 400 }), 400
        name = ingredientName
        if name is None:
            return jsonify({ "Missing attribute: name": 400 }), 400
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({ "Missing attribute: amount": 400 }), 400
        amount_pkg = request.json.get('amount_pkg')
        if amount_pkg is None:
            return jsonify({ "Missing attribute: amount_pkg": 400 }), 400
        meteric = request.json.get('measure')
        if meteric is None:
            return jsonify({ "Missing attribute: meteric": 400 }), 400
        keep_stocked = request.json.get('keep_stocked')
        if keep_stocked is None or (keep_stocked is not True and keep_stocked is not False):
            return jsonify({ "Missing or Not Bool type attribute: keep_stocked": 400 }), 400
        meteric = meteric.strip()
        # verify the primary key is not taken before submit.
        if not sp_database.Ingredients.get(uid=user.id, name=name):
            ing = sp_database.Ingredients(
                uid            = user.id,
                name           = name,
                amount         = int(to_math(amount)),
                amount_pkg     = int(to_math(amount_pkg)),
                keep_stocked   = bool(request.json.get('keep_stocked')))
        else:
            return jsonify({ "Conflict: Duplicate Ingredient Name": 409 }), 409
        return jsonify({ "Created": 201 }), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({ "Must set json or json header": 400 }), 400
        previous_name = ingredientName
        item = sp_database.Ingredients.get(uid=user.id, name=previous_name)
        if item is None:
            return jsonify({ "Not Found": 404 }), 404
        name = request.json.get('name')
        if name is not None:
            item.name = str(name)
        amount = request.json.get('amount')
        if amount is not None:
            item.amount = int(to_math(amount))
        amount_pkg = request.json.get('amount_pkg')
        if amount_pkg is not None:
            item.amount_pkg = int(to_math(amount_pkg))
        keep_stocked = request.json.get('keepStocked')
        if keep_stocked is not None:
            item.keepStocked = bool(keep_stocked)
        return jsonify({ "OK": 200 }), 200
    if request.method == 'DELETE':
        name = ingredientName
        if name is None:
            return jsonify({ "Missing attribute: Name": 400 }), 400
        item = sp_database.Ingredients.get(uid=user.id, name=name)
        if item:
            try:
                item.delete()
            except pony.orm.core.ConstraintError:
                return jsonify({ "A Recipe uses this.": 409 }), 409
            return jsonify({ "DELETED": 200 }), 200
        else:
            return jsonify({ "Not Found": 404 }), 404

def allowed_file(filename):
    ALLOWED_EXTENSIONS = { 'png', 'jpg', 'jpeg', 'gif' }
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/v1/recipes/ocr', methods=['POST'])
@jwt_required
def ocr_request():
    username = get_jwt_identity()
    user = identify(username)
    # print(request.mimetype)
    # print( request.files )
    if 'file' not in request.files:
        return jsonify({ "Error": 400,
                         "response": 'No file part' }), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({ "Error": 400,
                         "response": 'No selected file' }), 400
    if file and allowed_file(file.filename):
        myfile = {'file': file.read() }
        response = requests.post('http://rancher:5000/uploader', files=myfile)
        #response = requests.post('http://192.168.1.70:5001/v1/test',
                                # files=myfile)
        if response.status_code == 200:
            return jsonify({"text": response.text }), 200
        else:
            return jsonify({ "Error": response.status_code,
                             "response": "response.content" }), 502

@bp.route('/v1/inventory/barcode/<ingName>', methods=['POST','DELETE'])
@jwt_required
@db_session
def barcode(ingName=None):
    username = get_jwt_identity()
    user = identify(username)
    ing = sp_database.Ingredients.get(name=ingName, uid=user.id)
    if not ing:
        return jsonify({ "not found": 404 }), 404
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({ "Error": 400,
                             "response": 'No file part' }), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({ "Error": 400,
                             "response": 'No selected file' }), 400
        if file and allowed_file(file.filename):
            data = ''
            bcObjects = pyzbar.decode(Image.open(file))
            for code in bcObjects:
                data = code.data.decode('utf-8')
            ing.barcode = data
            return jsonify({ "text": data }), 200
        return jsonify({ "Error": 400,
                         "response": 'File Type not allowed' }), 400
    if request.method == 'DELETE':
        ing.barcode = ''
        return jsonify({ "DELETED": 200 }), 200

@bp.route('/v1/test', methods=['GET','PUT','POST','DELETE'])
def testing():
    print(request.method)
    print(request.content_type)
    print(request.data)
    print(request.json)
    if request.json:
        return jsonify({ "text": request.json["name"] }), 200
    else:
        return jsonify({ "text": "Nope" }), 200

def apply_ingredients(user, recipe, ingredients):
    in_pantry = []
    for item in ingredients:
        name = item.get('name')
        if name is None:
            return jsonify({ "Missing attribute: name": 400 }), 400
        amount = item.get('amount')
        if amount is None:
            amount = 1
        if amount is 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        meteric = item.get('amount_measure')
        if meteric is None:
            meteric = ''
        # verify the primary key is not taken before submit.
        ing = sp_database.Ingredients.get(uid=user.id, name=name)
        if ing is None:
            ing = sp_database.Ingredients(
                uid            = user.id,
                name           = name)
            #print("preped: " + str(ing.to_dict()))
        if ing is None:
            return jsonify({ "Missing attribute ingredient during linking": 404 }), 404
        if recipe is None:
            return jsonify({ "Missing attribute recipe during linking": 404 }), 404
        req = sp_database.Requirements.get(uid = user.id,
                                           recipe = recipe,
                                           ingredient = ing)
        if req is None:
            req = sp_database.Requirements(uid = user.id,
                                           recipe = recipe,
                                           ingredient = ing,
                                           amount = to_math(amount),
                                           amount_measure = singular(meteric))
            #print("req: " + str(req.to_dict()) )
        else:
            return jsonify({ "Conflict: Duplicating requirement": 409 }), 409

@bp.route('/v1/recipes', methods=['GET','POST'])
@bp.route('/v1/recipes/<recipeName>', methods=['GET','PUT','DELETE'])
@jwt_required
@db_session
def recipes(recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        if recipeName is None:
            ret = sp_database.Recipes.select(lambda r: r.uid == user)[:]
            all = [r.to_dict(exclude=['uid','requirements']) for r in ret]
            return jsonify(all), 200
        recipe = sp_database.Recipes.get(name=recipeName, uid=user.id)
        if recipe is not None:
            ingredients = []
            for r in recipe.requirements:
                req = dict()
                req['viewAmount'] = max( r.ingredient.amount /
                                      meteric2oz(r.amount, r.amount_measure), 0.05)
                req['amount'] = to_display(r.amount)
                req['amount_measure'] = r.amount_measure
                req['name'] = r.ingredient.name
                if r.amount > 1:
                    if r.amount_measure:
                        req['amount_measure'] = singular(r.amount_measure) + 's'
                    else:
                        req['name'] = singular(r.ingredient.name) + 's'
                else:
                    if r.amount_measure:
                        req['amount_measure'] = singular(r.amount_measure)
                ingredients.append(req)
            if recipe.imagePath:
                path = get_thubnail(recipe.imagePath)
            else:
                path = recipe.imagePath
            return jsonify({ "name": recipe.name,
                             "value": recipe_count(recipe),
                             "keepStocked": recipe.keepStocked,
                             "ingredients": ingredients,
                             "instructions": recipe.instructions,
                             "imagePath": path})
        else:
            return jsonify({ "not found": 404 }), 404
    if request.method == 'POST':
        # Test for missing fields
        if not request.json:
            return jsonify({ "Must set json or json header": 400 }), 400
        recipe_name = request.json.get('recipe_name')
        if recipe_name is None:
            return jsonify({ "Missing attribute recipe_name": 400 }), 400
        ingredients = request.json.get('ingredients')
        if ingredients is None:
            return jsonify({ "Missing attribute ingredients": 400 }), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({ "Missing attribute instructions": 400 }), 400
        if not sp_database.Recipes.get(uid=user.id, name=recipe_name):
            recipe = sp_database.Recipes(
                        uid            = user.id,
                        name           = recipe_name,
                        instructions   = '\n'.join(instructions))
        else:
            return jsonify({ "Conflict: Duplicate recipe Name": 409 }), 409
        # TODO start transaction ?
        # TODO validate/create individual ingredients for this logged in session.
        #        if not request.json:
        apply_ingredients(user, recipe, ingredients)
        return jsonify({ "created": 201 }), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({ "Must set json or json header": 400 }), 400
        if recipeName is None:
            return jsonify({ "Missing attribute name on url": 400 }), 400
        new_name = request.json.get('new_name')
        if new_name is None:
            return jsonify({ "Missing attribute new_name (in json)": 400 }), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({ "Missing attribute instructions": 400 }), 400
        ingredients = request.json.get('ingredients')
        if ingredients is None:
            return jsonify({ "Missing attribute ingredients": 400 }), 400
        recipe = sp_database.Recipes.get(uid=user.id, name=new_name)
        if recipe is None:
            recipe = sp_database.Recipes(
                        uid            = user.id,
                        name           = new_name,
                        instructions   = '\n'.join(instructions))
            apply_ingredients(user, recipe, ingredients)
            # When creating an item with a new name it gets all new record
            # make sure to delete the old record.
            old_recipe = sp_database.Recipes.get(uid=user.id, name=recipeName)
            if old_recipe:
                old_recipe.delete()
            return jsonify({ "created": 201 }), 201
        if recipe.name == recipeName:
            recipe.requirements.clear()
            flush()
            apply_ingredients(user, recipe, ingredients)
            recipe.instructions = '\n'.join(instructions)
            return jsonify({ "Modified": 200 }), 200
        else:
            return jsonify({ "not found": 404 }), 404
    if request.method == 'DELETE':
        if recipeName is None:
            return jsonify({ "Missing attribute name": 400 }), 400
        item = sp_database.Recipes.get(uid=user.id, name=recipeName)
        if item:
            item.delete()
            return jsonify({ "DELETED": 200 }), 200
        else:
            return jsonify({ "Not Found": 404 }), 404

#####
@bp.route('/v1/requirements/search', methods=['GET'])
@jwt_required
@db_session
def requirements_search():
    username = get_jwt_identity()
    user = identify(username)
    ret = None
    if not request.json:
        # TODO use lambda's instead of keywords
        ret = sp_database.Requirements.select(lambda r: r.uid == user)[:]
        all = [r.to_dict(exclude = ['uid']) for r in ret]
        return jsonify(all), 200
    iname = request.json.get('ingredient')
    rname = request.json.get('recipe')
    ingredient = None
    recipe = None
    if iname is None and rname is None:
        return jsonify({ "Missing attribute ingredient or recipe": 400 }), 400
    if iname is not None:
        ingredient = sp_database.Ingredients.get(uid=user,
                                                 name=iname)
    if rname is not None:
        recipe = sp_database.Recipes.get(uid = user, name = rname)
    if ingredient is not None and recipe is not None:
        ret = sp_database.Requirements.select(lambda r: r.uid == user and
                                              r.recipe == recipe,
                                              r.ingredient == ingredient)[:]
    elif recipe is not None:
        ret = sp_database.Requirements.select(lambda r: r.uid == user and
                                              r.recipe == recipe)[:]
    elif ingredient is not None:
        ret = sp_database.Requirements.select(lambda r: r.uid == user and
                                              r.ingredient == ingredient)[:]
    if ret is not None:
        return jsonify([r.to_dict(exclude = ['uid']) for r in ret])
    else:
        return jsonify({"not found": 404}), 404

@bp.route('/v1/requirements/<recipeName>', methods=['PUT'])
@jwt_required
@db_session
def toggleKeepStocked(recipeName=None):
    # print("hello")
    username = get_jwt_identity()
    user = identify(username)
    # print(recipeName)
    getMyRecipe = lambda x: x.uid == user and x.name == recipeName
    recipe = sp_database.Recipes.get(getMyRecipe)
    # print(recipe)
    if recipe is None:
        return jsonify({ "not found": 404 }), 404
    else:
        recipe.keepStocked = not recipe.keepStocked
        return jsonify({ "Ok": 200 }), 200

@bp.route('/v1/mealplans/<int:id>', methods=['GET','PUT','DELETE'])
@bp.route('/v1/mealplans', methods=['POST'])
@jwt_required
@db_session
def mealplans(id=None):
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'POST':
        rname = request.json.get('recipe')
        if rname is None:
            return jsonify({ "Missing attribute recipe": 400 }), 400
        myRecipe = lambda i: (i.uid == user and i.name == rname)
        recipe = sp_database.Recipes.get(myRecipe)
        if recipe is None:
            return jsonify({ "Recipe not found": 404 }), 404
        date = request.json.get('date')
        if date is None:
            return jsonify({ "Missing attribute date": 400 }), 400
        date = datetime.datetime.strptime(date,'%a, %b %d %Y')
        step_type = request.json.get('step_type')
        if step_type is None:
            step_type = ''
        step = request.json.get('step')
        if step is None:
            step = 0
        plan = sp_database.MealPlans(
                                    uid = user,
                                    recipe = recipe,
                                    date = date,
                                    step_type = step_type,
                                    step = step )
        commit()
        return jsonify({ "Created": 201, "id": plan.id }), 201
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = sp_database.Mealplans.get(allUserItems)
        if plan is None:
            return jsonify({ "not found": 404 }), 404
        return jsonify({ "mealplan": plan.to_dict() }), 200
    if request.method == 'PUT':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = sp_database.MealPlans.get(allUserItems)
        if plan is None:
            return jsonify({ "not found": 404 }), 404
        step = request.json.get('step')
        step_type = request.json.get('step_type')
        if step or step == 0:
            plan.step = step
        if step_type or step_type == '':
            plan.step_type = step_type
        keepStocked = request.json.get('keepStocked')
        if keepStocked or keepStocked is False:
            plan.keepStocked = keepStocked
        return jsonify({ "Modified": 200, "id": plan.id }), 200
    if request.method == 'DELETE':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = sp_database.MealPlans.get(allUserItems)
        if plan is None:
            return jsonify({ "not found": 404 }), 404
        plan.delete()
        return jsonify({ "DELETED": 200 }), 200


@bp.route('/v1/requirements/<int:id>', methods=['GET'])
@bp.route('/v1/requirements', methods=['GET','POST','PUT','DELETE'])
@jwt_required
@db_session
def requirements(id=None):
    username = get_jwt_identity()
    user = identify(username)

    if request.method == 'GET':
        ret = None
        if not request.json and id is None:
            ret = sp_database.Requirements.select(lambda r: r.uid == user)[:]
            all = [r.to_dict(exclude = ['uid']) for r in ret]
            return jsonify(all), 200
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        if iname is None:
            return jsonify({ "Missing attribute ingredient": 400 }), 400
        if rname is None:
            return jsonify({ "Missing attribute recipe": 400 }), 400
        if iname is not None:
            ingredient = sp_database.Ingredients.get(uid = user.id,
                                                     name = iname)
        if rname is not None:
            recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is not None and recipe is not None:
            ret = sp_database.Requirements.get(lambda r: r.uid == user and
                                                  r.recipe == recipe and
                                                  r.ingredient == ingredient)
        else:
            return jsonify({ "not found": 404 }), 404
        if ret is not None:
            return jsonify(ret.to_dict(exclude = ['uid']))
        else:
            return jsonify({ "not found": 404 }), 404

    if request.method == 'POST':
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({ "Missing attribute amount": 400 }), 400
        if amount == 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        iname = request.json.get('ingredient')
        if iname is None:
            return jsonify({ "Missing attribute ingredient": 400 }), 400
        rname = request.json.get('recipe')
        if rname is None:
            return jsonify({ "Missing attribute recipe": 400 }), 400
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({ "ingredient Not Found": 404 }), 404
        if recipe is None:
            return jsonify({ "recipe Not Found": 404 }), 404
        if not sp_database.Requirements.get(uid = user.id,
                                            recipe = recipe,
                                            ingredient = ingredient):
            ing = sp_database.Requirements(uid = user.id,
                                           recipe = recipe,
                                           ingredient = ingredient,
                                           amount = amount)
        else:
            return jsonify({ "Conflict: Duplicate requirement": 409 }), 409
        return jsonify({ "created": 201 }), 201

    if request.method == 'PUT':
        ingredient = None
        recipe = None
        if not request.json:
            return jsonify({ "Must set json or json header": 400 }), 400
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        amount = request.json.get('amount')
        if iname is None:
            return jsonify({ "Missing attribute ingredient": 400 }), 400
        if rname is None:
            return jsonify({ "Missing attribute recipe": 400 }), 400
        if amount is None:
            return jsonify({ "Missing attribute amount": 400 }), 400
        if amount == 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({ "ingredient Not Found": 404 }), 404
        if recipe is None:
            return jsonify({ "recipe Not Found": 404 }), 404
        item = sp_database.Requirements.get(uid = user.id,
                                            recipe = recipe,
                                            ingredient = ingredient)
        if item is not None:
            item.amount = float(amount)
            return jsonify({ "OK": 200 }), 200
        else:
            return jsonify({ "Not Found": 404 }), 404

    if request.method == 'DELETE':
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        if iname is None:
            return jsonify({ "Missing attribute ingredient": 400 }), 400
        if rname is None:
            return jsonify({ "Missing attribute recipe": 400 }), 400
        ingredient = None
        recipe = None
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({ "ingredient Not Found": 404 }), 404
        if recipe is None:
            return jsonify({ "recipe Not Found": 404 }), 404
        item = sp_database.Requirements.get(uid = user.id,
                                            recipe = recipe,
                                            ingredient = ingredient)
        if item is not None:
            item.delete()
            return jsonify({ "OK": 200 }), 200
        else:
            return jsonify({ "Not Found": 404 }), 404
####



### The old website stuff and grody api ###
@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def home(path):
    return render_template('app.html')

@bp.route('/v1/views/catagories', methods=['GET'])
@jwt_required
@db_session
def catagoriesView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        recipes = sp_database.Recipes.select(lambda r: r.uid == user).count()
        ingredients = sp_database.Ingredients.select(lambda r: r.uid == user).count()
        mealplans = sp_database.MealPlans.select(lambda r: r.uid == user).count()
        shopping = []
        keepStocked = lambda i: (i.uid == user and
                                i.keepStocked)
        recips = sp_database.Recipes.select(keepStocked)
        for recipe in recips:
            recipe.requirements.load()
            for r in recipe.requirements:
                measure = singular(r.amount_measure)
                is_metered = convert.get(measure)
                if is_metered:
                    if r.ingredient.amount < meteric2oz(r.amount, measure):
                        shopping.append(r.ingredient.name)
                else:
                    if r.ingredient.amount < r.amount:
                        shopping.append(r.ingredient.name)
        ings = sp_database.Ingredients.select(keepStocked)
        for i in ings:
            if i.amount < (.25 * i.amount_pkg):
                shopping.append(i.name)
        response = len(shopping)
        return jsonify({ "recipes": recipes,
                         "mealplan": mealplans,
                         "ingredients": ingredients,
                         "shopping": response}), 200

@bp.route('/v1/views/pantry', methods=['GET'])
@jwt_required
@db_session
def pantryView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        allItems = sp_database.Ingredients.select(allUserItems)
        pantry = [ i.to_dict() for i in allItems ]
        for i in pantry:
            i['viewAmount'] = getViewAmount(i)
            if i.get('imagePath'):
                i['imagePath'] = get_thubnail(i['imagePath'])
        return jsonify({ "list": pantry }), 200

def getApperentDates(startDate, step_type, step, viewLengthDays):
    today = datetime.datetime.today()
    lastDay = today + datetime.timedelta(viewLengthDays)
    returnDates = []
    # the date starts after the view window
    if startDate >= lastDay:
        return returnDates
    # There was no repeating feature active.
    if not step_type or step_type == '':
        returnDates.append(startDate)
        return returnDates
    # feature "day of the week meal" active
    elif step_type == 'dow':
        print('feature day of the week active')
        currentDate = startDate
        while currentDate <= lastDay:
            returnDates.append(currentDate)
            #advance to next time we have the right day of the week.
            for i in range(7):
                currentDate += datetime.timedelta(1)
                if currentDate.weekday() == step:
                    break
    # feature "day of the month" meal active
    elif step_type == 'dom' and startDate >= today:
        print('feature divisable by number active')
        while currentDate <= lastDay:
            if (not currentDate.day % step) or currentDate.day == 1:
                returnDates.append(currentDate)
            # skip down to next day
            for i in range(31):
                currentDate += datetime.timedelta(1)
                if currentDate.day == step:
                    break
    print('end of getApperentDates()')
    return returnDates

@bp.route('/v1/views/mealplans', methods=['GET'])
@bp.route('/v1/views/mealplans/<int:viewLengthDays>', methods=['GET'])
@jwt_required
@db_session
def mealPlansView(viewLengthDays=None):
    username = get_jwt_identity()
    user = identify(username)
    if not viewLengthDays:
        viewLengthDays = 14
    allUserItems = lambda i: (i.uid == user)
    allItems = sp_database.MealPlans.select(allUserItems)
    mealplans = []
    for plan in allItems:
        itemDates = getApperentDates(plan.date,
                                     plan.step_type,
                                     plan.step,
                                     viewLengthDays)
        for date in itemDates:
            mealplans.append({
                'id': plan.id,
                'date': date.strftime("%a, %b %d %Y"),
                'recipe': plan.recipe.name,
                'keepStocked': plan.keepStocked,
                'step_type': plan.step_type,
                'step': plan.step })
    dates = []
    today = datetime.datetime.today()
    for i in range(viewLengthDays):
        later = today + datetime.timedelta(i)
        dates.append(later.strftime("%a, %b %d %Y"))
    return jsonify({ "dates": dates, "mealplans": mealplans }), 200

def getViewAmount(ing, needs=None):
    if needs is None:
        needs = ing['amount_pkg']
    amount = float(ing['amount'] / needs)
    amount = max(amount, 0.05)
    amount = min(amount, 1)
    return amount

def collectRequirement(shopping, needs, ing):
    name = ing['name']
    if shopping.get(name):
        shopping[name]['needs'] += needs
        shopping[name]['viewAmount'] = getViewAmount(shopping[name],
                                                     shopping[name]['needs'])
    else:
        ing['needs'] = needs
        ing['viewAmount'] = getViewAmount(ing, needs)
        if ing.get('imagePath'):
            ing['imagePath'] = get_thubnail(ing['imagePath'])
        shopping[name] = ing

@bp.route('/v1/views/shopping', methods=['GET'])
@jwt_required
@db_session
def shoppingView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        shopping = dict()
        keepStocked = lambda i: (i.uid == user and
                                i.keepStocked)
        recipes = sp_database.Recipes.select(keepStocked)
        for recipe in recipes:
            recipe.requirements.load()
            for r in recipe.requirements:
                measure = singular(r.amount_measure)
                is_metered = convert.get(measure)
                ing = r.ingredient.to_dict()
                if is_metered:
                    needs = meteric2oz(r.amount, measure)
                    collectRequirement(shopping, needs, ing)
                else:
                    needs = r.amount
                    collectRequirement(shopping, needs, ing)
        ingredients = sp_database.Ingredients.select(keepStocked)
        for i in ingredients:
            ing = i.to_dict()
            needs = ing['amount_pkg']
            collectRequirement(shopping, needs, ing)
        ret = [ v for v in shopping.values() if v['amount'] < v['needs']  ]
        return jsonify({ "list": ret }), 200

def oz2meteric(oz, meteric):
    meteric = singular(meteric)
    if convert.get(meteric) is None:
        conversion = oz / 1
    else:
        conversion = oz / convert[meteric]
    return conversion

def meteric2oz(numb, meteric):
    meteric = singular(meteric)
    if convert.get(meteric) is None:
        oz = numb / 1
    else:
        oz = numb * convert[meteric]
    return oz

def recipe_count(recipe):
    last_value = None
    for req in recipe.requirements:
        amount_on_hand = oz2meteric(req.ingredient.amount,
                                    req.amount_measure)
        this_value = amount_on_hand / req.amount
        if last_value is None:
            last_value = this_value
        if this_value < last_value:
            last_value = this_value
    return int(last_value)

def get_thubnail(imgPath):
    return resized_img_src(os.path.normpath(imgPath), hegiht=300, crop=True)

@bp.route('/v1/views/recipes', methods=['GET'])
@jwt_required
@db_session
def recipesView():
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        Recipes = sp_database.Recipes.select(allUserItems)
        data = []
        for recipe in Recipes:
            # go to each requirement and find out how many of this recipe i can make.
            r = recipe.to_dict()
            r["value"] = recipe_count(recipe)
            if r.get('imagePath'):
                r['imagePath'] = get_thubnail(r['imagePath'])
            data.append(r)
        return jsonify({ "list": data }), 200

def pantry_form():
    if not session.get('logged_in'):
        return render_template('login.html')
    return render_template('pantry_form.html', data=None)

def cookbook_form():
    if not session.get('logged_in'):
        return render_template('login.html')

    data = {}
    recipe = request.form.get('recipe')

    if request.method == 'GET':
        # got nothing so just return the blank form.
        return render_template('cookbook_form.html', data=data)
    if request.method == 'POST':
        # 1 check if the check input button was used.
        # 2 there are many buttons that could have
        # been pressed but the main two are below.
        uid = session.get('uid')
        data = session.get('recipe')
        if request.form.get('CheckInput'):
            # Check Input button parses the text field and replaces data.
            recipe = request.form.get('recipe')
            if recipe:
                data = parse_recipe(recipe, uid)
            session['recipe'] = data
            return render_template('cookbook_form.html', data=data)
        elif request.form.get('save'):
            # the structure in the session is accurate so we use that.
            data = session['recipe']
            # open connection to db
            with db_session:
                # start to create one recipe
                recipe = sp_database.Recipes(
                    uid = uid,
                    name = data['name'],
                    instructions = ''.join(data['instructions']))
                # FOR EACH ING
                # fiddle with the ingredient data to enter requirements in
                # to the database for this recipe.
                for ing in data['ingredients']:
                    # amount is not needed in ing to create a ingredient AND
                    # having it here makes the below code pretty-er
                    amount = ing.pop('amount', None)
                    amount = float(to_math(amount))
                    # TODO only stock items if the customer say so on the
                    # cookbook form
                    ing['keep_stocked'] = True
                    # this is what to do if ing matches nothing in pantry
                    if ing.get('no match'):
                        ing.pop('no match', None)
                        ing.pop('pantry', None)
                        ing.pop('conversion', None)
                        ing.pop('id', None)
                        # the ingredient needs to exist before the requirement
                        ing = sp_database.Ingredients(**ing)
                        req = sp_database.Requirements(ingredient=ing,
                                                      amount=amount,
                                                      recipe=recipe)
                        continue
                    # this is what to do if item directly matches pantry item.
                    if ing.get('perfect match'):
                        ing.pop('perfect match', None)
                        ing.pop('pantry', None)
                        # print(sp_database.Ingredients.get(lambda i: i.name == ing['name']))
                        ing = sp_database.Ingredients.get(lambda i: i.name == ing['name'])
                        req = sp_database.Requirements(ingredient=ing,
                                                      amount=amount,
                                                      recipe=recipe)
                        continue
                    # one or more suggestions (in pantry items) seemed correct
                    # to the user, so adding those as requirements here.
                    for item in ing.get('pantry'):
                        print("saposed item {}".format(item))
                        print(sp_database.Ingredients.get(lambda i: i.name == ing['name']))
                        ing = sp_database.Ingredients.get(lambda i: i.name == ing['name'])
                        if ing:
                            req = sp_database.Requirements(ingredient=ing,
                                                          amount=amount,
                                                          recipe=recipe)
            return redirect(url_for('main.pantry_form'))
        else:
            # BUTTON PRESSES not expressly defined earlier.
            for key in request.form.keys():
                m = re.match('([cr])(\d+)', key)
                if m:
                    type = m.group(1)
                    id = m.group(2)
                    if type == 'r':
                        # remove identified ingredient from ingredients list
                        # or remove linkage to items in pantry.
                        data['ingredients'] = [ ing for ing in data['ingredients']
                                               if ing['id'] != int(id) ]
                        for ing in data['ingredients']:
                            ing['pantry'] = [ item for item in ing['pantry']
                                              if item['id'] != int(id) ]
                            if ing['pantry'] == []:
                                ing['no match'] = True
                    elif type == 'c':
                        # clear out all other links to pantry except for this
                        # one item we want. This is just incase the pantry
                        # happens to link bonkers to this list, too many
                        # items to delete one by one.
                        clear = False
                        for ing in data['ingredients']:
                            for item in ing['pantry']:
                                if item['id'] == int(id):
                                    clear = True
                            #print("clear set to {}".format(clear))
                            if clear == True:
                                #print('entered clear true')
                                ing['pantry'] = [ item for item in ing['pantry']
                                              if item['id'] == int(id) ]
                                #print('pantry {}'.format(ing['pantry'], ))
                                if ing['pantry'] == []:
                                    ing['no match'] = True
                                #print(ing)
                                break
            session['recipe'] = data
            return render_template('cookbook_form.html', data=data)



if __name__ == "__main__":
    config = get_config()
    db_setup(config)
    host, port = get_socket(config)
    app = app_factory()
    app.debug = False
    app.config['ASSETS_DEBUG'] = False
    app.config['UPLOAD_FOLDER'] = r'static/images'
    app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
    jwt = JWTManager(app)
    images = Images(app)
    app.config['IMAGES_PATH'] = ['static/images']
    limiter = Limiter(app,
                      key_func=get_remote_address,
                      default_limits=[])#"200 per day",
                                      #"50 per hour"])
    app.run(host, port)
