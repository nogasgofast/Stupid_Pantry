#!/usr/bin/env python
from flask_jwt_extended import ( JWTManager,
                                 jwt_required,
                                 create_access_token,
                                 get_jwt_identity,
                                 jwt_refresh_token_required,
                                 create_refresh_token)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pony.orm import *
from flask import (Flask,
                   flash,
                   session,
                   request,
                   abort,
                   Blueprint,
                   jsonify,
                   render_template)
import configparser
import sp_database
from passlib.context import CryptContext
import requests
import re

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

@bp.route('/v1/recipes/parse', methods=['POST'])
@jwt_required
@db_session
def parse_recipe():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    recipe = request.json.get('recipe')
    if recipe is None:
        return jsonify({"Missing attribute: recipe": 400}), 400
    username = get_jwt_identity()
    user = identify(username)
    data = {}
    data['input'] = recipe
    title_or_name = re.search(r'\W*[\w ]+(\r\n|\r|\n)', recipe)
    if title_or_name:
        data['name'] = title_or_name.group()
    data['ingredients'] = []
    data['instructions'] = []

    start = False
    stop = False
    counter = 0
    token_start = r'[Ii]ngredients'
    token_stop = r'[Mm]ake [Ii]t|[Ii]nstructions|[Dd]irections'
    # split on returns of all kinds!
    for line in re.split(r'\r\n|\r|\n',recipe):
        # The start and stop for ingredient parsing
        if re.search(token_start, line):
            start = True
            continue
        if re.search(token_stop, line):
            stop = True
            continue

        # The ingredient parsing section.
        if start and not stop:
            ing = ingredient_line_parse(line)
            if ing is None:
                # this ingredient is not parsable, we got little out of it.
                # display it anyhow
                if re.search(r'\w+',line):
                    ing = {
                        # strips whitespace from before and after line.
                        "uid": user.id,
                        "name": line.strip(),
                        "amount": 0,
                        "amount_measure": "?",
                        "keep_stocked": True}
                else:
                    # This sir... is nothing of interest.
                    continue
            # counter because I need to be able to address between session AND
            # html.
            counter += 1
            ing['id'] = counter
            discover_by_name = []
            discover_by_measure = []
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

            # if that didn't work at all go ahead and search by the word
            # that came after the first number in the ingredient
            #if not discover_by_name:
            #    discover_by_measure = ingredient_search(amount_measure, uid)
            #    perfect_match = [ m for m in discover_by_measure if m.get('perfect_match')]
            #    if perfect_match:
            #        ing['perfect match'] = perfect_match


            # adjust id's and id pantry items as well.
            for item in ing['pantry']:
                counter += 1
                item['id'] = counter

            # just to make sure it has a name, it may not have one yet.
            print("name {}".format(len(ing['name'])))
            # look for word characters
            if not re.search(r'\w+', ing['name']):
                print("not named")
                ing['name'] = ing['amount_measure']
            # And findally ensure you always have a uid
            if not ing.get('uid'):
                ing['uid'] = user.id
            # if not ing.get('applet'):
            #     ing['applet'] = 'recipe'
            data['ingredients'].append(ing)
        if stop == True:
            if re.search(r'.+',line):
                data['instructions'].append(line)
    return jsonify({"recipe": data }), 200

def ingredient_search(name, uid):
    with db_session:
        ings = select(ing for ing in sp_database.Ingredients if ing.uid.id == uid)[:]
        # look for a perfect match with a previous ingredient
        for ing in ings:
            print("test singular:{}={}".format(singular(ing.name.lower()),singular(name.lower())))
            if singular(ing.name.lower()) == singular(name.lower()):
                item = ing.to_dict()
                item['perfect_match'] = True
                item['amount_measure'] = ing.amount_measure
                return (item, )
        # score ingredients on word association and offer suggestions
        scores = {}
        form_words = re.split('\W', name)
        for form_wrd in form_words:
            for ing in ings:
                for ing_name_wrd in re.split('\W', ing.name):
                    # case insensitive scrore match
                    if form_wrd.lower() and form_wrd.lower() in ing_name_wrd.lower():
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
                 item['amount_measure'] = ing.amount_measure
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
    desc = r'(.+)'
    # number, w-spaces, a word.
    num_wrd = num + r'\s*' + word
    # number, w-spaces, a word, w-space, desc
    num_wrd_desc = num + r'\s+' + word + r'\s+' + desc
    # desc, w-spaces, number, w-spaces, a word
    desc_num_wrd = desc + r'\s*' + num + r'\s*' + word
    #### end patterns ####

    # Capture data in parens, this can only handle one set in a line.
    prensCheck = r'\(([^()]+)\)'
    perens = re.search(prensCheck, line)
    if perens:
        ''' check for parens and strip that section out
            writing any good looking data to amount, measure '''
        print("format3:{}".format(perens.group(1),))
        format0 = re.search(num_wrd, perens.group(1))
        amount, measure = format0.group(1), format0.group(2)
        line = re.sub(prensCheck,'', line)

    format1 = re.search(num_wrd_desc, line)
    format2 = re.search(desc_num_wrd, line)
    format3 = re.search(num_wrd, line)
    if format1 and not perens:
        print("format1 not perens:{}".format(format1.group(3)))
        return {"name": format1.group(3),
                "amount": format1.group(1),
                "amount_measure": format1.group(2)}
    if format1 and perens:
        print("format1 with perens:{}".format(format1.group(3)))
        return  {"name": format1.group(3),
                "amount": format1.group(1),
                "amount_measure": format1.group(2),
                "conversion": "({} {})".format(amount,measure)}
    if format2 and not perens:
        print("format2 not perens:{}".format(format2.group(3)))
        return  {"name": format2.group(1),
                "amount": format2.group(2),
                "amount_measure": format2.group(3)}
    if format2 and perens:
        print("format2 with perens:{}".format(format2.group(3)))
        return  {"name": format2.group(1),
                "amount": format2.group(2),
                "amount_measure": format2.group(3),
                "conversion": "({} {})".format(amount,measure)}
    if format3 and not perens:
        print("format3 not perens:{}".format(format3.group(2)))
        return {"name": format3.group(2),
                "amount": format3.group(1)}
    if format3 and perens:
        print("format3 with perens:{}".format(format3.group(2)))
        return {"name": format3.group(2),
                "amount": format3.group(1),
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
    return ' '.join([str(wholeNum), str(aNumber)])

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
        sect = config['control']
    except:
        sect = False
    if sect:
        dbtype = sect.get('dbtype')
        if dbtype:
            dbconfig = [
                sect.get('dbhost'),
                sect.get('dbuser'),
                sect.get('dbpasswd'),
                sect.get('dbname')
            ]
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
            return jsonify({"not found": 404}), 404
        user.delete()
        return jsonify({"DELETED": 200 }), 200
    else:
        return jsonify({ "forbidden" : 403 }), 403

# Route for handling the login page logic
@bp.route('/v1/users', methods=['POST', 'DELETE'])
@db_session
def users():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    username = request.json.get('username')
    if username is None:
        return jsonify({"Missing attribute: username": 400}), 400
    if request.method == 'POST':
        password = request.json.get('password')
        if username is None or password is None:
            return jsonify({"missing username or password": 400}), 400
        # attempt to query for this user.
        user = sp_database.Users.get(lambda u: u.username == username)
        if user:
            return jsonify({"response": "conflicts with previous user", "status": 409}), 409
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
        return jsonify({"Must use json and set json header": 400}), 400
    username = request.json.get('username')
    if username is None:
        return jsonify({"Missing attribute: username": 400}), 400
    password = request.json.get('password')
    if password is None:
        return jsonify({"missing attribute: password": 400}), 400
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

@bp.route('/v1/inventory', methods=['GET','POST','PUT','DELETE'])
@jwt_required
@db_session
def inventory():
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        ret = None
        if not request.json:
            ret = sp_database.Ingredients.select(lambda i: i.uid == user)[:]
            all = [i.to_dict(exclude=['uid','required_by']) for i in ret]
            return jsonify(all), 200
        else:
            name = request.json.get('name')
            ret = sp_database.Ingredients.get(name=name, uid=user.id)
        if ret:
            return jsonify(ret.to_dict(exclude=['uid','required_by']))
        else:
            return jsonify({"not found": 404}), 404
    if request.method == 'POST':
        if not request.json:
            return jsonify({"Must use json and set json header": 400}), 400
        name = request.json.get('name')
        if name is None:
            return jsonify({"Missing attribute: name": 400}), 400
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({"Missing attribute: amount": 400}), 400
        amount_pkg = request.json.get('amount_pkg')
        if amount_pkg is None:
            return jsonify({"Missing attribute: amount_pkg": 400}), 400
        meteric = request.json.get('amount_measure')
        if meteric is None:
            return jsonify({"Missing attribute: meteric": 400}), 400
        keep_stocked = request.json.get('keep_stocked')
        if keep_stocked is None or (keep_stocked is not True and keep_stocked is not False):
            return jsonify({"Missing or Not Bool type attribute: keep_stocked": 400}), 400
        meteric = meteric.strip()
        # verify the primary key is not taken before submit.
        if not sp_database.Ingredients.get(uid=user.id, name=name):
            ing = sp_database.Ingredients(
                uid            = user.id,
                name           = name,
                amount         = assert_int_value(amount),
                amount_pkg     = assert_int_value(amount_pkg),
                amount_measure = meteric,
                keep_stocked   = bool(request.json.get('keep_stocked')))
        else:
            return jsonify({"Conflict: Duplicate Ingredient Name": 409}), 409
        return jsonify({ "Created": 201 }), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        name = request.json.get('name')
        item = sp_database.Ingredients.get(uid=user.id, name=name)
        if item is None:
            return jsonify({"Not Found": 404}), 404
        amount = request.json.get('amount')
        if amount is not None:
            item.amount = assert_int_value(amount)
        amount_pkg = request.json.get('amount_pkg')
        if amount_pkg is not None:
            item.amount_pkg = assert_int_value(amount_pkg)
        amount_measure = request.json.get('amount_measure')
        if amount_measure is not None:
            item.amount_measure = str(amount_measure).strip()
        keep_stocked = request.json.get('keep_stocked')
        if keep_stocked is not None:
            item.keep_stocked = bool(keep_stocked)
        return jsonify({ "OK": 200 }), 200
    if request.method == 'DELETE':
        name = request.json.get('name')
        if name is None:
            return jsonify({"Missing attribute: Name": 400}), 400
        item = sp_database.Ingredients.get(uid=user.id, name=name)
        if item:
            item.delete()
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
    print(request.mimetype)
    print( request.files )
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

@bp.route('/v1/test', methods=['POST'])
def testing():
    print(request.mimetype)
    print( request.files )
    if 'file' not in request.files:
        return jsonify({ "Error": 400,
                         "response": 'No file part' }), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({ "Error": 400,
                         "response": 'No selected file' }), 400
    return jsonify({ "text": request.files['file'].filename }), 200

@bp.route('/v1/recipes', methods=['GET','POST','PUT','DELETE'])
@jwt_required
@db_session
def recipes():
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        if not request.json:
            ret = sp_database.Recipes.select(lambda r: r.uid == user)[:]
            all = [r.to_dict(exclude=['uid','requirements']) for r in ret]
            return jsonify(all), 200
        name = request.json.get('name')
        ret = None
        ret = sp_database.Recipes.get(name=name, uid=user.id)
        if ret is not None:
            return jsonify(ret.to_dict(exclude=['uid','requirements']))
        else:
            return jsonify({"not found": 404}), 404
    if request.method == 'POST':
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        name = request.json.get('name')
        if name is None:
            return jsonify({"Missing attribute name": 400}), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({"Missing attribute instructions": 400}), 400
        if not sp_database.Recipes.get(uid=user.id, name=name):
            ing = sp_database.Recipes(
                uid            = user.id,
                name           = name,
                instructions   = instructions)
        else:
            return jsonify({"Conflict: Duplicate Ingredient Name": 409}), 409
        return jsonify({ "created": 201 }), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        name = request.json.get('name')
        if name is None:
            return jsonify({"Missing attribute name": 400}), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({"Missing attribute instructions": 400}), 400
        item = sp_database.Recipes.get(uid=user.id, name=name)
        if item is not None:
            item.instructions = str(instructions)
            return jsonify({ "OK": 200 }), 200
        return jsonify({ "not found": 404 }), 404
    if request.method == 'DELETE':
        name = request.json.get('name')
        if name is None:
            return jsonify({"Missing attribute name": 400}), 400
        item = sp_database.Recipes.get(uid=user.id, name=name)
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
        return jsonify({"Missing attribute ingredient or recipe": 400}), 400
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


@bp.route('/v1/requirements', methods=['GET','POST','PUT','DELETE'])
@jwt_required
@db_session
def requirements():
    username = get_jwt_identity()
    user = identify(username)

    if request.method == 'GET':
        ret = None
        if not request.json:
            # TODO use lambda's instead of keywords
            ret = sp_database.Requirements.select(lambda r: r.uid == user)[:]
            all = [r.to_dict(exclude = ['uid']) for r in ret]
            return jsonify(all), 200
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
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
            return jsonify({"not found": 404}), 404
        if ret is not None:
            return jsonify(ret.to_dict(exclude = ['uid']))
        else:
            return jsonify({"not found": 404}), 404

    if request.method == 'POST':
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({"Missing attribute amount": 400}), 400
        iname = request.json.get('ingredient')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        rname = request.json.get('recipe')
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
        if not sp_database.Requirements.get(uid = user.id,
                                            recipe = recipe,
                                            ingredient = ingredient):
            ing = sp_database.Requirements(uid = user.id,
                                           recipe = recipe,
                                           ingredient = ingredient,
                                           amount = amount)
        else:
            return jsonify({"Conflict: Duplicate requirement": 409}), 409
        return jsonify({ "created": 201 }), 201

    if request.method == 'PUT':
        ingredient = None
        recipe = None
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        amount = request.json.get('amount')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        if amount is None:
            return jsonify({"Missing attribute amount": 400}), 400
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
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
            return jsonify({"Missing attribute ingredient": 400}), 400
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        ingredient = None
        recipe = None
        ingredient = sp_database.Ingredients.get(uid = user.id, name = iname)
        recipe = sp_database.Recipes.get(uid = user.id, name = rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
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
        keepStocked = lambda i: (i.uid == user and
                                 i.keep_stocked and
                                 (float(i.amount) / i.amount_pkg) >= 0.1)
        shopping = sp_database.Ingredients.select(keepStocked).count()
        #Other
        return jsonify({ "recipes": recipes,
                         "ingredients": ingredients,
                         "shopping": shopping}), 200

@bp.route('/v1/views/pantry', methods=['GET'])
@jwt_required
@db_session
def pantryView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        shopping = sp_database.Ingredients.select(allUserItems)[:]
        #Other
        return jsonify({ "list": [ i.to_dict() for i in shopping ] }), 200

@bp.route('/v1/views/shopping', methods=['GET'])
@jwt_required
@db_session
def shoppingView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        keepStocked = lambda i: (i.uid == user and
                                i.keep_stocked and
                                ((float(i.amount) / i.amount_pkg) >= 0.1))
        shopping = sp_database.Ingredients.select(keepStocked)[:]
        #Other
        return jsonify({ "list": [ i.to_dict() for i in shopping ] }), 200

@bp.route('/v1/views/recipes', methods=['GET'])
@jwt_required
@db_session
def recipesView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        shopping = sp_database.Recipes.select(allUserItems)[:]
        #Other
        return jsonify({ "list": [ i.to_dict() for i in shopping ] }), 200


    # data = {}
    # data['PAN'] = []
    # data['CKB'] = []
    # with db_session:
    #     uid = session.get('uid')
    #     pantry = sp_database.Ingredients.select(lambda i: i.uid.id == uid)[:]
    #     cookbook = sp_database.Recipes.select(lambda r: r.uid.id == uid)[:]
    #     # {{ row.ingredient_link }}">{{ row.ingredient_name }}
    #     # {{ row.ingredient_amount }} of {{ row.ingredient_amount_max }}
    #     # {{ row.ingredient_measure }}
    #     for item in pantry:
    #         data['PAN'].append({
    #         'link' : "/pantry/{}".format(item.id),
    #         'id'   : item.id,
    #         'name' : item.name,
    #         'amount' : item.amount,
    #         'amount_pkg' : item.amount_pkg,
    #         'amount_measure' : item.amount_measure})
    #     for reci in cookbook:
    #         ingredients = []
    #         for requirement in reci.requirements:
    #             item = requirement.ingredient
    #             if item.amount - requirement.amount < 0:
    #                 low_stock=True
    #             else:
    #                 low_stock=False
    #             ingredients.append({
    #             'link' : "/pantry/{}".format(item.id),
    #             'id'   : item.id,
    #             'name' : item.name,
    #             'amount' : to_display(requirement.amount),
    #             'amount_pkg' : item.amount_pkg,
    #             'measure' : item.amount_measure,
    #             'low_stock': low_stock})
    #
    #         data['CKB'].append({
    #         'meal_name' : reci.name,
    #         'ingredients' : ingredients,
    #         'instructions' : reci.instructions,
    #         'meal_count' : meal_count(reci.requirements)})
    #     return render_template('home.html', data=data)


    # # This only exists for adding and subtracting buttons.
    # if request.method == 'PUT':
    #     if id:
    #         with db_session:
    #             ing = sp_database.Ingredients.get(id=id)
    #             if ing:
    #                 if action == 'add':
    #                     ing.amount = assert_int_value(amount + ing.amount)
    #                 if action == 'remove':
    #                     ing.amount = assert_int_value(ing.amount - amount)
    #                 ingredient = ing.to_dict()
    #                 # Measure objects are not serializable and one level too deep
    #                 # for a regular to_dict() call.
    #                 ingredient['amount_measure'] = ing.amount_measure
    #                 return jsonify(ingredient), 200
    #             else:
    #                 return "Not Found", 404

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
                            print("clear set to {}".format(clear))
                            if clear == True:
                                print('entered clear true')
                                ing['pantry'] = [ item for item in ing['pantry']
                                              if item['id'] == int(id) ]
                                print('pantry {}'.format(ing['pantry'], ))
                                if ing['pantry'] == []:
                                    ing['no match'] = True
                                print(ing)
                                break
            session['recipe'] = data
            return render_template('cookbook_form.html', data=data)



if __name__ == "__main__":
    config = get_config()
    db_setup(config)
    host, port = get_socket(config)
    app = app_factory()
    app.debug = True
    app.config['ASSETS_DEBUG'] = True
    jwt = JWTManager(app)
    limiter = Limiter(app,
                      key_func=get_remote_address,
                      default_limits=[])#"200 per day",
                                      #"50 per hour"])
    app.run(host, port)
