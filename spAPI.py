#!/usr/bin/python
from flask_jwt_extended import (JWTManager,
                                jwt_required,
                                get_jwt_identity,
                                unset_jwt_cookies,
                                set_access_cookies,
                                set_refresh_cookies,
                                create_access_token,
                                create_refresh_token,
                                jwt_refresh_token_required)
from flask_limiter.util import get_remote_address
from itsdangerous import URLSafeTimedSerializer
from werkzeug.utils import secure_filename
from passlib.context import CryptContext
from flask import (Flask,
                   abort,
                   flash,
                   session,
                   request,
                   jsonify,
                   url_for,
                   Blueprint,
                   make_response,
                   render_template)
from flask import current_app as app
from flask_limiter import Limiter
from fractions import Fraction
import pyzbar.pyzbar as pyzbar
from flask_images import Images, resized_img_src
from flask_mail import Mail, Message
from pony.orm import *
from PIL import Image
import configparser
from spDatabase import SPDB
import filetype
import requests
import datetime
import uuid
import re
import os

myctx = CryptContext(schemes="sha256_crypt",
                     sha256_crypt__min_rounds=131072)
limiter = Limiter(key_func=get_remote_address,
                  default_limits=[])   # "200 per day", "50 per hour"])
mail = Mail()
bp = Blueprint('main', __name__)

@db_session
def authenticate(username, password):
    user = SPDB.Users.get(lambda u: u.username == username)
    if user is not None:
        valid, newHash = myctx.verify_and_update(password, user.pwHash)
        if valid:
            if newHash:
                user.pwHash = newHash
            return user
        return None
    return None


@db_session
def identify(username):
    user = SPDB.Users.get(lambda u: u.username == username)
    if user and not user.isAuthenticated:
        return None
    return user


def singular(name):
    # prevent multiple word names from being worked on here. (slices bacon)
    if ' ' in name:
        return name
    noPlural = r'(\w+?)s\b'
    sName = re.match(noPlural, name)
    if sName:
        name = sName.group(1)
    return name

# measurement conversions
convert = {
 "pinch": 0.03,
 "pinche": 0.03,
 "teaspoon": 0.25,
 "tablespoon": 0.5,
 "ounce": 1.0,
 "cup": 8.0,
 "pint": 16.0,
 "pound": 16.0,
 "quart": 128.0,
 "liter": 256.0,
 "gallon": 512.0}


@bp.route('/v1/recipes/parse', methods=['POST'])
@jwt_required
@db_session
def parseRecipe():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    recipe = request.json.get('recipe')
    if recipe is None:
        return jsonify({"Missing attribute: recipe": 400}), 400
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    data = {}
    data['input'] = recipe
    titleOrName = re.search(r'(.+)(\r\n|\r|\n)', recipe).group(1)
    if len(titleOrName) > 255:
        return jsonify({"Bad Request":
                        "Title of recipe too long! 255 character limit"}), 400
    data['isDuplicate'] = False
    if titleOrName:
        data['name'] = titleOrName
        isDuplicate = SPDB.Recipes.get(lambda r: r.tid == user.team and
                                       r.name == data['name'])
        if isDuplicate:
            data['isDuplicate'] = True
    data['ingredients'] = []
    data['instructions'] = []

    start = False
    stop = False
    counter = 0
    tokenStart = r'[Ii]ngredients'
    tokenStop = r'[Mm]ake [Ii]t|[Ii]nstructions|[Dd]irections'
    # split on returns of all kinds!
    for line in re.split(r'\r\n|\r|\n', recipe):
        # The start and stop for ingredient parsing
        if re.search(tokenStart, line):
            start = True
            continue
        if re.search(tokenStop, line):
            stop = True
            continue

        # The ingredient parsing section.
        if start and not stop:
            ing = ingredientLineParse(line.lower())
            if ing is None:
                # this ingredient is not parsable, we got little out of it.
                # display it anyhow
                if re.search(r'\w+', line.lower()):
                    ing = {
                        # strips whitespace from before and after line.
                        "uid": user.id,
                        "name": line.strip(),
                        "amount": 0,  # in oz always!!!!
                        "amountPkg": 0,
                        "keepStocked": False}
                else:
                    # This sir... is nothing of interest.
                    continue
            # counter because I need to be able to address between session AND
            # html.
            counter += 1
            ing['id'] = counter
            discoverByName = []
            perfectMatch = []

            # if we have a name then go ahead and try to pull info for that.
            if ing.get('name'):
                discoverByName = ingredientSearch(ing['name'], user)
                perfectMatch = [m for m in discoverByName
                                if m.get('perfectMatch')]
                if perfectMatch:
                    ing['isMatching'] = 'perfect'
                    ing['pantry'] = perfectMatch
                elif discoverByName:
                    ing['isMatching'] = 'some'
                    ing['pantry'] = discoverByName
                else:
                    ing['isMatching'] = 'no'
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
                ing['name'] = ing['amountMeasure']
            data['ingredients'].append(ing)
        if stop is True:
            if re.search(r'.+', line):
                data['instructions'].append(line)
    if len(data['ingredients']) < 1:
        return jsonify({"Bad Request":
                        "No ingredients found, \
                        did you use the correct format?"}), 400
    if len(data['instructions']) < 1:
        return jsonify({"Bad Request":
                        "No instructions found, \
                        did you use the correct format?"}), 400
    return jsonify({"recipe": data}), 200


def ingredientSearch(name, user):
    with db_session:
        ings = select(ing for ing in SPDB.Ingredients
                      if ing.tid == user.team)[:]
        # look for a perfect match with a previous ingredient
        for ing in ings:
            if singular(ing.name) == singular(name):
                item = ing.to_dict()
                item['perfectMatch'] = True
                return (item,)
        # score ingredients on word association and offer suggestions
        scores = {}
        words = re.split('\W', name)
        for word in words:
            for ing in ings:
                for ingNameWrd in re.split('\W', ing.name):
                    # case insensitive scrore match
                    if word and word in ingNameWrd:
                        if not scores.get(ing.name):
                            scores[ing.name] = 1
                        else:
                            scores[ing.name] += 1
        sortedByValue = sorted(scores.items(), key=lambda kv: kv[1])
        topThree = dict(sortedByValue[0:2]).keys()
        topThreeMatches = []
        for ing in ings:
            if ing.name in topThree:
                item = ing.to_dict()
                item['name'] = ing.name
                topThreeMatches.append(item)
        return topThreeMatches


def ingredientLineParse(line):
    amount, measure = (None, None)
    # pattern building
    # a simple space
    space = r'\s*'
    # possible leading characters that could foul things up.
    leadingChars = space + r'[-*.]*'
    # match preference 1 2/3 | 1/2 | 1 | 1.2
    num = space + r'(\d+\s\d+[^\d]\d+|\d+[^\d]\d+|\d+|\d+\.\d+)'
    # match a word
    word = space + r'(\w+)'
    # matches any phrases that might be a description don't be greedy though.
    desc = space + r'((\w+\s?)+)'
    # number, w-spaces, a word, the end.
    numWord = '^' + leadingChars + num + word + '$'
    # number, w-spaces, a word, w-space, desc
    numWordDesc = '^' + leadingChars + num + word + desc + '$'
    # desc, w-spaces, number, w-spaces, a word
    descNumWord = '^' + leadingChars + desc + num + word + '$'
    # end patterns

    # clean up space before and after
    line = line.strip(' ')
    line = line.replace(',', '')
    # Capture data in parens, this can only handle one set in a line.
    prensCheck = r'\(([^)]*)\)'
    perens = re.search(prensCheck, line)
    if perens:
        ''' check for parens and strip that section out
            writing any good looking data to amount, measure '''
        # print("format1:{}".format(perens.group(1),))
        # format0 = re.search(num_wrd, perens.group(1))
        # amount, measure = format0.group(1), singular(format0.group(2))
        line = re.sub(prensCheck, '', line)

    format1 = re.search(numWord, line)
    format2 = re.search(descNumWord, line)
    format3 = re.search(numWordDesc, line)

    if format1 and not perens:
        # print("format1 not perens:{}".format(format1.group(2)))
        return {"name": format1.group(2),
                "amount": float(toMath(format1.group(1))),
                "amountPkg": 0,
                "amountMeasure": "",
                "keepStocked": False}
    if format1 and perens:
        # print("format1 with perens:{}".format(format1.group(2)))
        return {"name": format1.group(2),
                "amount": float(toMath(format1.group(1))),
                "amountPkg": 0,
                "keepStocked": False,
                "amountMeasure": "",
                "conversion": "({} {})".format(amount, measure)}
    if format2 and not perens:
        # print("format2 not perens:{}".format(format2.group(3)))
        return {"name": format2.group(1),
                "amount": float(toMath(format2.group(2))),
                "amountPkg": 0,
                "keepStocked": False,
                "amountMeasure": singular(format2.group(3))}
    if format2 and perens:
        # print("format2 with perens:{}".format(format2.group(3)))
        return {"name": format2.group(1),
                "amount": float(toMath(format2.group(2))),
                "amountPkg": 0,
                "keepStocked": False,
                "amountMeasure": singular(format2.group(3)),
                "conversion": "({} {})".format(amount, measure)}
    if format3 and not perens:
        # print("format3 not perens:{}-{}-{}".format(format3.group(1),
        #                                            format3.group(2),
        #                                            format3.group(3)))
        if not convert.get(singular(format3.group(2))):
            name = format3.group(2) + " " + format3.group(3)
        else:
            name = format3.group(3)
        return {"name":  name,
                "amount": float(toMath(format3.group(1))),
                "amountPkg": 0,
                "keepStocked": False,
                "amountMeasure": singular(format3.group(2))}
    if format3 and perens:
        # print("format3 with perens:{}".format(format3.group(3)))
        return {"name": format3.group(3),
                "amount": float(toMath(format3.group(1))),
                "amountPkg": 0,
                "keepStocked": False,
                "amountMeasure": singular(format3.group(2)),
                "conversion": "({} {})".format(amount, measure)}
    # This is not a parsable ingredient!
    # print("not an ingredient: {}".format(line))
    return None


def toDisplay(aNumber):
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


def toMath(aString):
    'converts a string number to a nice integer/fraction representation'
    aString = str(aString)
    m = re.split(' ', aString)
    if len(m) == 2:
        wholeNum, fraction = m
        wholeNum = int(wholeNum)
        if wholeNum < 0:
            wholeNum = wholeNum * -1
        try:
            fraction = Fraction(fraction)
        except ValueError:
            fraction = Fraction(0)
        return fraction + wholeNum
    try:
        num = Fraction(m[0])
    except ValueError:
        num = None
    return num


def getConfig():
    config = configparser.ConfigParser(interpolation = None)
    config.read('stupidPantry.conf')
    return config


def getSocket(config=False):
    host = '0.0.0.0'
    port = 5001
    sect = config.has_section('control')
    if sect:
        host = sect.get('host', host)
        port = sect.getint('port', port)
    return (host, port)


def dbSetup(config=False):
    dbtype=None
    if config.has_section('database'):
        dbtype = config.get('database', 'DB_TYPE',
                            fallback=os.getenv('DB_TYPE'))
    if dbtype is None:
        dbtype = os.getenv('DB_TYPE')
    if dbtype in ['galera', 'mysql']:
        dbconfig = {
            'host': config.get('database', 'DB_HOST',
                               fallback=os.getenv('DB_HOST')),
            'user': config.get('database', 'DB_USER',
                               fallback=os.getenv('DB_USER')),
            'passwd': config.get('database', 'DB_PASSWD',
                                 fallback=os.getenv('DB_PASSWD')),
            'db': config.get('database', 'DB_NAME',
                             fallback=os.getenv('DB_NAME')),
            'port': int(3306)}
        SPDB.bind(provider='mysql', **dbconfig)
    else:
        SPDB.bind('sqlite', filename='sp.sqlite', create_db=True)
    SPDB.generate_mapping(create_tables=True)


def appSetup(app, config=False):
    app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/v1'
    app.config['JWT_REFRESH_COOKIE_PATH'] = '/v1/auth/refresh'
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    # going to leave this off for now, extra work to enable
    # flask-jwt-extended.readthedocs.io/en/stable/tokens_in_cookies/
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    app.config['UPLOAD_FOLDER'] = r'static/images'
    app.config['IMAGES_PATH'] = ['static/images']
    # app.config['SERVER_NAME'] = 'localhost'
    # used to build external urls to this website
    # debug setting for testing refresh token functions.
    # app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 10
    requiredArgsStr=[
          'SERVER_NAME',
          'SECRET_KEY',
          'OCR_SERVICE',
          'JWT_SECRET_KEY',
          'JWT_COOKIE_SECURE',
          'SECURITY_PASSWORD_SALT',
          'MAIL_SERVER',
          'MAIL_DEFAULT_SENDER',
          'MAIL_USERNAME',
          'MAIL_PASSWORD']
    requiredArgsInt=[
          'MAIL_PORT']
    requiredArgsBool=[
          'MAIL_USE_TLS',
          'MAIL_USE_SSL']
    results=dict()

    if config.has_section('app'):
        print('get regular env')
        for arg in requiredArgsStr:
            results[arg] = config.get('app', arg,
                                      fallback=os.getenv(arg))
            print(arg, results[arg])
        print('get int env')
        for arg in requiredArgsInt:
            results[arg] = config.getint('app', arg,
                                         fallback=os.getenv(arg))
            print(arg, results[arg])
        print('get boolean env')
        for arg in requiredArgsBool:
            results[arg] = config.getboolean('app', arg,
                                             fallback=os.getenv(arg))
            print(arg, results[arg])
    else:
        # just put them into results as string or None
        for arg in requiredArgsStr:
            results[arg] = os.getenv(arg)
        for arg in requiredArgsInt:
            results[arg] = os.getenv(arg)
        for arg in requiredArgsBool:
            results[arg] = os.getenv(arg)
        # now make them the correct type if they exist
        for key in results.keys():
            if results[key] is not None:
                for arg in requiredArgsInt:
                    results[key] = os.getenv(arg)
                for arg in requiredArgsBool:
                    results[key] = os.getenv(arg)
    if results.get('SECRET_KEY') is not None:
        app.secret_key = results.pop('SECRET_KEY', None)
    else:
        raise Exception('config needs a SECRET_KEY value')

    for key in results.keys():
        if results.get(key) is not None:
            app.config[key] = results[key]
        else:
            raise Exception('config needs a {} value'.format(key))
    return app


@jwt_required
def deleteUser(username):
    # TODO-later: IT would be nice if user accounts could be active/inactive.
    currentUser = get_jwt_identity()
    username = request.json.get('username')
    if currentUser == username:
        user = SPDB.Users.get(lambda u: u.username == username)
        if user is None:
            return jsonify({"not found": 404}), 404
        user.delete()
        return jsonify({"DELETED": 200}), 200
    else:
        return jsonify({"forbidden": 403}), 403


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
            return jsonify({"Missing username or password": 400}), 400
        if len(password) < 20 or len(password) > 254:
            return jsonify({"Password length out of scope": 400}), 400
        email = request.json.get('email')
        if email is None:
            return jsonify({"missing email": 400}), 400
        # attempt to query for this user.
        user = SPDB.Users.get(lambda u: u.username == username)
        if user:
            return jsonify({"response":
                            "conflicts with previous user",
                            "status": 409}), 409
        pwHash = myctx.hash(password)
        team = SPDB.Teams()
        role = SPDB.Roles(team=team)
        user = SPDB.Users(username=username,
                          pwHash=pwHash,
                          email=email,
                          team=team,
                          role=role,
                          isAuthenticated=False,
                          isActive=False,
                          isAnonymous=False)
        msg = Message("Smart Pantry: E-mail Verification",
                      sender="nogasgofast@nogasgofast.net",
                      recipients=[user.email])
        token = generate_confirmation_token(user.email)
        if app.config['SERVER_NAME']:
            server_name = app.config['SERVER_NAME']
            link = f'https://{server_name}/verify/{token}'
        else:
            link = f'https://localhost:5001/verify/{token}'
        #msg.body = render_template('email_verify.html', link=link)
        msg.html = render_template('email_verify.html', link=link)
        mail.send(msg)
        return jsonify({'username': user.username}), 201
    if request.method == 'DELETE':
        return deleteUser(get_jwt_identity())


def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    return serializer.dumps(email, salt=app.config['SECURITY_PASSWORD_SALT'])


def confirm_token(token, expiration=3600):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token,
                                 salt=app.config['SECURITY_PASSWORD_SALT'],
                                 max_age=expiration)
    except itsdangerous:
        return None
    return email


@bp.route('/v1/users/confirm', methods=['POST'])
@db_session
def userConfirm():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    token = request.json.get('token')
    if not token:
        return jsonify({"Missing attribute: token": 400}), 400
    username = request.json.get('username')
    if not username:
        return jsonify({"Missing attribute: username": 400}), 400
    try:
        email = confirm_token(token)
    except itsdangerous:
        return jsonify({"The confirmation link is invalid or has expired.":
                        400}), 400
    user = SPDB.Users.get(lambda u: u.email == email and u.username == username)
    if user.isAuthenticated:
        return jsonify({"Account already confirmed. Please login.": 400}), 400
    else:
        user.isAuthenticated = True
        accessToken = create_access_token(identity=user.username)
        refreshToken = create_refresh_token(identity=user.username)
        resp = jsonify({"You have confirmed your account. Thanks!": 200})
        set_access_cookies(resp, accessToken)
        set_refresh_cookies(resp, refreshToken)
        return resp, 200


@bp.route('/v1/users/reset', methods=['POST'])
@db_session
@limiter.limit('10 per hour')
def userReset():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    password = request.json.get('password')
    if len(password) < 20 or len(password) > 254:
        return jsonify({"Password length out of scope": 400}), 400
    token = request.json.get('token')
    print(token)
    email = confirm_token(token)
    if email is None:
        return jsonify({"The confirmation link is invalid or has expired.":
                        400}), 400
    user = SPDB.Users.get(lambda u: u.email == email)
    print(user.username)
    if user:
        pwHash = myctx.hash(password)
        user.pwHash = pwHash
        accessToken = create_access_token(identity=user.username)
        refreshToken = create_refresh_token(identity=user.username)
        resp = jsonify({})
        set_access_cookies(resp, accessToken)
        set_refresh_cookies(resp, refreshToken)
        # establish auth-tokens, move user to /home
        return resp, 200
    else:
        return jsonify({"Unable to find user": 400}), 400


@bp.route('/v1/users/recover', methods=['POST'])
@db_session
@limiter.limit('30 per hour')
def userRecover():
    if not request.json:
        return jsonify({"Must use json and set json header": 400}), 400
    username = request.json.get('username')
    if username is None:
        return jsonify({"Missing attribute: username": 400}), 400
    email = request.json.get('email')
    if email is None:
        return jsonify({"Missing attribute: email": 400}), 400
    user = SPDB.Users.get(lambda u:
                          u.username == username and u.email == email)
    if user is not None:
        msg = Message("Smart Pantry: Password Recovery",
                      sender="nogasgofast@nogasgofast.net",
                      recipients=[user.email])
        token = generate_confirmation_token(user.email)
        if app.config['SERVER_NAME']:
            server_name = app.config['SERVER_NAME']
            link = f'https://{server_name}/pwreset/{token}'
        else:
            link = f'https://localhost:5001/pwreset/{token}'
        msg.html = render_template('email_recovery.html', link=link)
        mail.send(msg)
        return jsonify({"OK": 200}), 200
    else:
        return jsonify({"Not found": 404}), 404


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
    accessToken = create_access_token(identity=username)
    refreshToken = create_refresh_token(identity=username)
    resp = jsonify({})
    set_access_cookies(resp, accessToken)
    set_refresh_cookies(resp, refreshToken)
    return resp, 200


@bp.route('/v1/auth/logout', methods=['POST'])
def authOut():
    resp = jsonify({'logout': True})
    unset_jwt_cookies(resp)
    return resp, 200


@bp.route('/v1/auth/refresh', methods=['POST'])
@jwt_refresh_token_required
def authRefresh():
    user = get_jwt_identity()
    access_token = create_access_token(identity=user)
    resp = jsonify({"OK": 200})
    set_access_cookies(resp, access_token)
    return resp, 200


@bp.route('/v1/inventory/use/<recipeName>', methods=['PUT'])
@jwt_required
@db_session
def inventoryUse(recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    recipe = SPDB.Recipes.get(name=recipeName, tid=user.team)
    if not recipe:
        return jsonify({"not found": 404}), 404
    else:
        recipe.lastUsed = datetime.datetime.now()
        recipe.used += 1
        allRequirements = recipe.requirements
        for req in allRequirements:
            useAmount = meteric2oz(req.amount, req.amountMeasure)
            ing = req.ingredient
            ing.amount = max(ing.amount - useAmount, 0)
            ing.lastUsed = datetime.datetime.now()
            ing.used += 1
        return jsonify({"OK": 200}), 200


@bp.route('/v1/inventory/image/<ingredientName>', methods=['POST'])
@bp.route('/v1/recipe/image/<recipeName>', methods=['POST'])
@jwt_required
@db_session
def imageAdd(ingredientName=None, recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if ingredientName:
        obj = SPDB.Ingredients.get(tid=user.team, name=ingredientName)
    if recipeName:
        obj = SPDB.Recipes.get(tid=user.team, name=recipeName)
    if obj is None:
        return jsonify({"not found": 404}), 404
    # clean-up the old image before adding a new one.
    if obj.imagePath:
        path = os.path.join(app.config['UPLOAD_FOLDER'], obj.imagePath)
        os.unlink(path)
        obj.imagePath = ''
    if 'file' not in request.files:
        return jsonify({"Error": 400,
                        "response": 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"Error": 400,
                        "response": 'No selected file'}), 400
    if file and allowedFile(file.read(265)):
        file.seek(0)
        '''remove possibility of duplicate image name uploads
         and prevents (some) attacks'''
        filename = uuid.uuid4().hex + secure_filename(file.filename)[-5:]
        year = datetime.date.today().strftime('%y')
        path = os.path.join(app.config['UPLOAD_FOLDER'], str(user.team))
        try:
            os.mkdir(path)
        except FileExistsError:
            pass
        path = os.path.join(app.config['UPLOAD_FOLDER'], str(user.team), year)
        try:
            os.mkdir(path)
        except FileExistsError:
            pass
        path = os.path.join(app.config['UPLOAD_FOLDER'],
                            str(user.team), year, filename)
        file.save(path)
        obj.imagePath = os.path.join(str(user.team), year, filename)
        return jsonify({"OK": 200}), 200
    return jsonify({"incorrect file type": 400}), 400


@bp.route('/v1/inventory/image/<ingredientName>', methods=['DELETE'])
@bp.route('/v1/recipe/image/<recipeName>', methods=['DELETE'])
@jwt_required
@db_session
def imageRemove(ingredientName=None, recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    print(recipeName)
    if ingredientName:
        obj = SPDB.Ingredients.get(tid=user.team, name=ingredientName)
    if recipeName:
        obj = SPDB.Recipes.get(tid=user.team, name=recipeName)
    if obj is None:
        return jsonify({"not found": 404}), 404
    path = os.path.join(app.config['UPLOAD_FOLDER'], obj.imagePath)
    os.unlink(path)
    obj.imagePath = ''
    return jsonify({"OK": 200}), 200


@bp.route('/v1/inventory', methods=['GET'])
@bp.route('/v1/inventory/<ingredientName>', methods=['GET', 'POST',
                                                     'PUT', 'DELETE'])
@jwt_required
@db_session
def inventory(ingredientName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        ret = None
        if not request.json:
            if ingredientName:
                ret = SPDB.Ingredients.get(name=ingredientName, tid=user.team)
            else:
                ret = SPDB.Ingredients.select(lambda i: i.tid == user.team)[:]
                all = [i.to_dict(exclude=['uid',
                                          'tid',
                                          'requiredBy']) for i in ret]
                return jsonify(all), 200
        if not ret:
            return jsonify({"not found": 404}), 404
        ing = ret.to_dict(exclude=['uid', 'requiredBy'])
        ing['requiredBy'] = [v.to_dict(exclude=['uid',
                                                'requirements']) for v in
                             ret.requiredBy.recipe]
        for r in ing['requiredBy']:
            r['hasContent'] = True
            r['path'] = '/recipes/view/'
        for item in ing['requiredBy']:
            if item.get('imagePath'):
                item['imagePath'] = getThubnail(item['imagePath'])
            (item['viewAmount'], _) = viewAmountAndIngMissing(
                                        SPDB.Recipes.get(id=item['id']))
        # get the most often used measure
        isMeasured = False
        for k in ret.requiredBy.amountMeasure:
            if convert.get(k) and convert[k] != 1:
                isMeasured = True
        if isMeasured:
            ing['measured'] = True
        if ing.get('imagePath'):
            ing['imagePath'] = getThubnail(ing['imagePath'])
        if ing.get('lastBuyDate'):
            ing['lastBuyDate'] = ing.get('lastBuyDate').strftime('%b %d %Y')
        return jsonify(ing)

    if request.method == 'POST':
        if not request.json:
            return jsonify({"Must use json and set json header": 400}), 400
        name = ingredientName
        if name is None:
            return jsonify({"Missing attribute: name": 400}), 400
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({"Missing attribute: amount": 400}), 400
        amountPkg = request.json.get('amountPkg')
        if amountPkg is None:
            return jsonify({"Missing attribute: amountPkg": 400}), 400
        meteric = request.json.get('measure')
        if meteric is None:
            return jsonify({"Missing attribute: meteric": 400}), 400
        keepStocked = request.json.get('keepStocked')
        if keepStocked is None or (keepStocked is not True and
                                   keepStocked is not False):
            return jsonify({"Missing or Not Bool type attribute: keepStocked":
                            400}), 400
        meteric = meteric.strip()
        # verify the primary key is not taken before submit.
        if not SPDB.Ingredients.get(tid=user.team, name=name):
            ing = SPDB.Ingredients(
                uid=user.id,
                tid=user.team,
                name=name,
                amount=int(toMath(amount)),
                amountPkg=int(toMath(amountPkg)),
                keepStocked=bool(request.json.get('keepStocked')))
        else:
            return jsonify({"Conflict: Duplicate Ingredient Name": 409}), 409
        return jsonify({"Created": 201}), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        previousName = ingredientName
        item = SPDB.Ingredients.get(tid=user.team, name=previousName)
        if item is None:
            return jsonify({"Not Found": 404}), 404
        name = request.json.get('name')
        if name is not None:
            item.name = str(name)
        amount = request.json.get('amount')
        if amount is not None:
            item.amount = int(toMath(amount))
        amountPkg = request.json.get('amountPkg')
        if amountPkg is not None:
            item.amountPkg = int(toMath(amountPkg))
        lastBuyDate = request.json.get('lastBuyDate')
        if lastBuyDate is not None and lastBuyDate is not '':
            lastBuyDate = datetime.datetime.strptime(lastBuyDate, '%b %d %Y')
            item.lastBuyDate = lastBuyDate
        freshFor = request.json.get('freshFor')
        if freshFor is not None:
            item.freshFor = freshFor
        keepStocked = request.json.get('keepStocked')
        if keepStocked is not None:
            item.keepStocked = bool(keepStocked)
        return jsonify({"OK": 200}), 200
    if request.method == 'DELETE':
        name = ingredientName
        if name is None:
            return jsonify({"Missing attribute: Name": 400}), 400
        item = SPDB.Ingredients.get(tid=user.team, name=name)
        if item:
            try:
                item.delete()
            except pony.orm.core.ConstraintError:
                return jsonify({"A Recipe uses this.": 409}), 409
            return jsonify({"DELETED": 200}), 200
        else:
            return jsonify({"Not Found": 404}), 404


def allowedFile(file):
    allowedMimeTypes = ('image/png', 'image/jpg', 'image/jpeg', 'image/gif')
    kind = filetype.guess(file)
    if kind is None:
        return False
    if kind.mime in allowedMimeTypes:
        return True
    return False


@bp.route('/v1/recipes/ocr', methods=['POST'])
@jwt_required
def ocrRequest():
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    # print(request.mimetype)
    # print(request.files)
    if 'file' not in request.files:
        return jsonify({"Error": 400,
                        "response": 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"Error": 400,
                        "response": 'No selected file'}), 400
    if file and allowedFile(file.read(265)):
        file.seek(0)
        myfile = {'file': file.read()}
        response = requests.post(app.config['OCR_SERVICE'], files=myfile)
        # response = requests.post('http://192.168.1.70:5001/v1/test',
        # files=myfile)
        if response.status_code == 200:
            return jsonify({"text": response.text}), 200
        else:
            return jsonify({"Error": response.status_code,
                            "response": response.text}), 502


@bp.route('/v1/inventory/barcode/<ingName>', methods=['POST', 'DELETE'])
@bp.route('/v1/inventory/barcode', methods=['POST'])
@jwt_required
@db_session
def barcode(ingName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401

    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"Error": 400,
                            "response": 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"Error": 400,
                            "response": 'No selected file'}), 400
        if file and allowedFile(file.read(265)):
            # print("err hum?")
            file.seek(0)
            data = ''
            bcObjects = pyzbar.decode(Image.open(file))
            if len(bcObjects) == 0:
                return jsonify({"response": "Could not decode barcode" }), 404
            for code in bcObjects:
                data = code.data.decode('utf-8')
            if request.files.get('check'):
                print("working")
                ing = SPDB.Ingredients.get(barcode=data, tid=user.team)
                if ing is None:
                    return jsonify({"response": "You have no items with this barcode assigned."}), 404
                return jsonify({"response": ing.to_dict()}), 200
            else:
                print("wrong route")
                ing = SPDB.Ingredients.get(name=ingName, tid=user.team)
                if ing is None:
                    return jsonify({"not found": 404}), 404
                ing.barcode = data
                return jsonify({"text": data}), 200
        # print("WAT!")
        return jsonify({"Error": 400,
                        "response": 'File Type not allowed'}), 400
    if request.method == 'DELETE':
        ing = SPDB.Ingredients.get(name=ingName, tid=user.team)
        if ing is None:
            return jsonify({"not found": 404}), 404
        ing.barcode = ''
        return jsonify({"DELETED": 200}), 200


@bp.route('/v1/test', methods=['GET', 'PUT', 'POST', 'DELETE'])
def testing():
    print(request.method)
    print(request.content_type)
    print(request.data)
    print(request.json)
    if request.json:
        return jsonify({"text": request.json["name"]}), 200
    else:
        return jsonify({"text": "Nope"}), 200


def applyIngredients(user, recipe, ingredients):
    inPantry = []
    for item in ingredients:
        name = item.get('name')
        if name is None:
            return jsonify({"Missing attribute: name": 400}), 400
        amount = item.get('amount')
        if amount is None:
            amount = 1
        if amount is 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        meteric = item.get('amountMeasure')
        # byWeight is a UI hint on if an ingredient is measured by weight
        # or by count.
        if meteric is None or convert.get(singular(meteric)) is None:
            byWeight = False
            meteric = ''
        else:
            byWeight = True
        # verify the primary key is not taken before submit.
        ing = SPDB.Ingredients.get(tid=user.team, name=name)
        if ing is None:
            ing = SPDB.Ingredients(uid=user.id,
                                   tid=user.team,
                                   name=name,
                                   byWeight=byWeight)
            # print("preped: " + str(ing.to_dict()))
        if ing is None:
            return jsonify({"Missing attribute ingredient during linking":
                            404}), 404
        if recipe is None:
            return jsonify({"Missing attribute recipe during linking":
                            404}), 404
        req = SPDB.Requirements.get(tid=user.team,
                                    recipe=recipe,
                                    ingredient=ing)
        if req is None:
            req = SPDB.Requirements(uid=user.id,
                                    tid=user.team,
                                    recipe=recipe,
                                    ingredient=ing,
                                    amount=toMath(amount),
                                    amountMeasure=singular(meteric))
            # print("req: " + str(req.to_dict()))
        else:
            return jsonify({"Conflict: Duplicating requirement": 409}), 409

@bp.route('/v1/recipes/togglePublic/<recipeName>', methods=['POST'])
@jwt_required
@db_session
def recipesTogglePublic(recipeName=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    recipe = SPDB.Recipes.get(name=recipeName, tid=user.team)
    if recipe is None:
        return jsonify({"not found": 404}), 404
    else:
        recipe.public = not recipe.public
    return jsonify({"public": recipe.public }), 200


@bp.route('/v1/recipes', methods=['GET', 'POST'])
@bp.route('/v1/recipes/<recipeName>', methods=['GET', 'PUT', 'DELETE'])
@bp.route('/v1/<public>/recipes/<recipeName>/<int:id>')
@jwt_required
@db_session
def recipes(recipeName=None, public=False, id=-1):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        if recipeName is None:
            ret = SPDB.Recipes.select(lambda r: r.tid == user.team)[:]
            all = [r.to_dict(exclude=['uid',
                                      'tid',
                                      'requirements']) for r in ret]
            return jsonify(all), 200
        if public is False:
            recipe = SPDB.Recipes.get(name=recipeName, tid=user.team)
        else:
            recipe = SPDB.Recipes.get(name=recipeName, id=id, public=True)
        if recipe is not None:
            ingredients = []
            for r in recipe.requirements:
                req = dict()
                ozs = meteric2oz(r.amount, r.amountMeasure)
                req['viewAmount'] = max(r.ingredient.amount / ozs, 0.05)
                req['amount'] = toDisplay(r.amount)
                req['amountMeasure'] = r.amountMeasure
                req['name'] = r.ingredient.name
                # forcing pluralness
                if r.amount > 1:
                    # This is empty in most casses but is sometimes used.
                    if r.amountMeasure:
                        req['amountMeasure'] = singular(r.amountMeasure) + 's'
                    else:
                        # prevent the addition of a s on
                        # multiple word names here (slices bacon)
                        if ' ' in r.ingredient.name:
                            req['name'] = r.ingredient.name
                        else:
                            req['name'] = singular(r.ingredient.name) + 's'
                else:
                    if r.amountMeasure:
                        req['amountMeasure'] = singular(r.amountMeasure)
                ingredients.append(req)
            if recipe.imagePath:
                path = getThubnail(recipe.imagePath)
            else:
                path = recipe.imagePath
            return jsonify({"name": recipe.name,
                            "public": recipe.public,
                            "value": recipeCount(recipe),
                            "keepStocked": recipe.keepStocked,
                            "ingredients": ingredients,
                            "instructions": recipe.instructions,
                            "imagePath": path})
        else:
            return jsonify({"not found": 404}), 404
    if request.method == 'POST':
        # Test for missing fields
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        recipeName = request.json.get('recipeName')
        if recipeName is None:
            return jsonify({"Missing attribute recipeName": 400}), 400
        ingredients = request.json.get('ingredients')
        if ingredients is None:
            return jsonify({"Missing attribute ingredients": 400}), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({"Missing attribute instructions": 400}), 400
        if not SPDB.Recipes.get(uid=user.id, name=recipeName):
            recipe = SPDB.Recipes(uid=user.id,
                                  tid=user.team,
                                  name=recipeName,
                                  instructions='\n'.join(instructions))
        else:
            return jsonify({"Conflict: Duplicate recipe Name": 409}), 409
        # TODO start transaction ?
        # TODO validate/create individual ingredients for
        # this logged in session.
        #        if not request.json:
        applyIngredients(user, recipe, ingredients)
        return jsonify({"created": 201}), 201
    if request.method == 'PUT':
        if not request.json:
            return jsonify({"Must set json or json header": 400}), 400
        if recipeName is None:
            return jsonify({"Missing attribute name on url": 400}), 400
        newName = request.json.get('newName')
        if newName is None:
            return jsonify({"Missing attribute newName (in json)": 400}), 400
        instructions = request.json.get('instructions')
        if instructions is None:
            return jsonify({"Missing attribute instructions": 400}), 400
        ingredients = request.json.get('ingredients')
        if ingredients is None:
            return jsonify({"Missing attribute ingredients": 400}), 400
        recipe = SPDB.Recipes.get(uid=user.id, name=newName)
        if recipe is None:
            recipe = SPDB.Recipes(uid=user.id,
                                  name=newName,
                                  instructions='\n'.join(instructions))
            applyIngredients(user, recipe, ingredients)
            # When creating an item with a new name it gets all new record
            # make sure to delete the old record.
            oldRecipe = SPDB.Recipes.get(uid=user.id, name=recipeName)
            if oldRecipe:
                oldRecipe.delete()
            return jsonify({"created": 201}), 201
        if recipe.name == recipeName:
            recipe.requirements.clear()
            flush()
            applyIngredients(user, recipe, ingredients)
            recipe.instructions = '\n'.join(instructions)
            return jsonify({"Modified": 200}), 200
        else:
            return jsonify({"not found": 404}), 404
    if request.method == 'DELETE':
        if recipeName is None:
            return jsonify({"Missing attribute name": 400}), 400
        item = SPDB.Recipes.get(uid=user.id, name=recipeName)
        if item:
            item.delete()
            return jsonify({"DELETED": 200}), 200
        else:
            return jsonify({"Not Found": 404}), 404


@bp.route('/v1/requirements/search', methods=['GET'])
@jwt_required
@db_session
def requirementsSearch():
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    ret = None
    if not request.json:
        # TODO use lambda's instead of keywords
        ret = SPDB.Requirements.select(lambda r: r.uid == user)[:]
        all = [r.to_dict(exclude=['uid']) for r in ret]
        return jsonify(all), 200
    iname = request.json.get('ingredient')
    rname = request.json.get('recipe')
    ingredient = None
    recipe = None
    if iname is None and rname is None:
        return jsonify({"Missing attribute ingredient or recipe": 400}), 400
    if iname is not None:
        ingredient = SPDB.Ingredients.get(uid=user,
                                          name=iname)
    if rname is not None:
        recipe = SPDB.Recipes.get(uid=user, name=rname)
    if ingredient is not None and recipe is not None:
        ret = SPDB.Requirements.select(lambda r: r.uid == user and
                                       r.recipe == recipe,
                                       r.ingredient == ingredient)[:]
    elif recipe is not None:
        ret = SPDB.Requirements.select(lambda r: r.uid == user and
                                       r.recipe == recipe)[:]
    elif ingredient is not None:
        ret = SPDB.Requirements.select(lambda r: r.uid == user and
                                       r.ingredient == ingredient)[:]
    if ret is not None:
        return jsonify([r.to_dict(exclude=['uid']) for r in ret])
    else:
        return jsonify({"not found": 404}), 404


@bp.route('/v1/requirements/<recipeName>', methods=['PUT'])
@jwt_required
@db_session
def toggleKeepStocked(recipeName=None):
    # print("hello")
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    # print(recipeName)
    getMyRecipe = lambda x: x.uid == user and x.name == recipeName
    recipe = SPDB.Recipes.get(getMyRecipe)
    # print(recipe)
    if recipe is None:
        return jsonify({"not found": 404}), 404
    else:
        recipe.keepStocked = not recipe.keepStocked
        return jsonify({"Ok": 200}), 200


@bp.route('/v1/mealplans/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@bp.route('/v1/mealplans', methods=['POST'])
@jwt_required
@db_session
def mealplans(id=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'POST':
        rname = request.json.get('recipe')
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        myRecipe = lambda i: (i.uid == user and i.name == rname)
        recipe = SPDB.Recipes.get(myRecipe)
        if recipe is None:
            return jsonify({"Recipe not found": 404}), 404
        date = request.json.get('date')
        if date is None:
            return jsonify({"Missing attribute date": 400}), 400
        date = datetime.datetime.strptime(date, '%a, %b %d %Y')
        stepType = request.json.get('stepType')
        if stepType is None:
            stepType = ''
        step = request.json.get('step')
        if step is None:
            step = 0
        plan = SPDB.MealPlans(uid=user,
                              tid=user.team,
                              recipe=recipe,
                              date=date,
                              stepType=stepType,
                              step=step)
        commit()
        return jsonify({"Created": 201, "id": plan.id}), 201
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = SPDB.Mealplans.get(allUserItems)
        if plan is None:
            return jsonify({"not found": 404}), 404
        return jsonify({"mealplan": plan.to_dict()}), 200
    if request.method == 'PUT':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = SPDB.MealPlans.get(allUserItems)
        if plan is None:
            return jsonify({"not found": 404}), 404
        step = request.json.get('step')
        stepType = request.json.get('stepType')
        if step or step == 0:
            plan.step = step
        if stepType or stepType == '':
            plan.stepType = stepType
        keepStocked = request.json.get('keepStocked')
        if keepStocked or keepStocked is False:
            plan.keepStocked = keepStocked
        return jsonify({"Modified": 200, "id": plan.id}), 200
    if request.method == 'DELETE':
        allUserItems = lambda i: (i.uid == user and i.id == id)
        plan = SPDB.MealPlans.get(allUserItems)
        if plan is None:
            return jsonify({"not found": 404}), 404
        plan.delete()
        return jsonify({"DELETED": 200}), 200


@bp.route('/v1/requirements/<int:id>', methods=['GET'])
@bp.route('/v1/requirements', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required
@db_session
def requirements(id=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        ret = None
        if not request.json and id is None:
            ret = SPDB.Requirements.select(lambda r: r.uid == user)[:]
            all = [r.to_dict(exclude=['uid']) for r in ret]
            return jsonify(all), 200
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        if iname is not None:
            ingredient = SPDB.Ingredients.get(uid=user.id,
                                              name=iname)
        if rname is not None:
            recipe = SPDB.Recipes.get(uid=user.id, name=rname)
        if ingredient is not None and recipe is not None:
            ret = SPDB.Requirements.get(lambda r: r.uid == user and
                                        r.recipe == recipe and
                                        r.ingredient == ingredient)
        else:
            return jsonify({"not found": 404}), 404
        if ret is not None:
            return jsonify(ret.to_dict(exclude=['uid']))
        else:
            return jsonify({"not found": 404}), 404

    if request.method == 'POST':
        amount = request.json.get('amount')
        if amount is None:
            return jsonify({"Missing attribute amount": 400}), 400
        if amount == 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        iname = request.json.get('ingredient')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        rname = request.json.get('recipe')
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        ingredient = SPDB.Ingredients.get(uid=user.id, name=iname)
        recipe = SPDB.Recipes.get(uid=user.id, name=rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
        if not SPDB.Requirements.get(uid=user.id,
                                     recipe=recipe,
                                     ingredient=ingredient):
            ing = SPDB.Requirements(uid=user.id,
                                    recipe=recipe,
                                    ingredient=ingredient,
                                    amount=amount)
        else:
            return jsonify({"Conflict: Duplicate requirement": 409}), 409
        return jsonify({"created": 201}), 201

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
        if amount == 0:
            amount = 1
        if amount < 0:
            amount = amount * -1
        ingredient = SPDB.Ingredients.get(uid=user.id, name=iname)
        recipe = SPDB.Recipes.get(uid=user.id, name=rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
        item = SPDB.Requirements.get(uid=user.id,
                                     recipe=recipe,
                                     ingredient=ingredient)
        if item is not None:
            item.amount = float(amount)
            return jsonify({"OK": 200}), 200
        else:
            return jsonify({"Not Found": 404}), 404

    if request.method == 'DELETE':
        iname = request.json.get('ingredient')
        rname = request.json.get('recipe')
        if iname is None:
            return jsonify({"Missing attribute ingredient": 400}), 400
        if rname is None:
            return jsonify({"Missing attribute recipe": 400}), 400
        ingredient = None
        recipe = None
        ingredient = SPDB.Ingredients.get(uid=user.id, name=iname)
        recipe = SPDB.Recipes.get(uid=user.id, name=rname)
        if ingredient is None:
            return jsonify({"ingredient Not Found": 404}), 404
        if recipe is None:
            return jsonify({"recipe Not Found": 404}), 404
        item = SPDB.Requirements.get(uid=user.id,
                                     recipe=recipe,
                                     ingredient=ingredient)
        if item is not None:
            item.delete()
            return jsonify({"OK": 200}), 200
        else:
            return jsonify({"Not Found": 404}), 404


# The old website stuff and grody api
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
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        recipes = SPDB.Recipes.select(lambda r: r.uid == user).count()
        ingredients = SPDB.Ingredients.select(lambda r: r.uid == user).count()
        mealplans = SPDB.MealPlans.select(lambda r: r.uid == user).count()
        shopping = []
        keepStocked = lambda i: (i.uid == user and
                                 i.keepStocked)
        recips = SPDB.Recipes.select(keepStocked)
        for recipe in recips:
            recipe.requirements.load()
            for r in recipe.requirements:
                measure = singular(r.amountMeasure)
                isMetered = convert.get(measure)
                if isMetered:
                    if r.ingredient.amount < meteric2oz(r.amount, measure):
                        shopping.append(r.ingredient.name)
                else:
                    if r.ingredient.amount < r.amount:
                        shopping.append(r.ingredient.name)
        ings = SPDB.Ingredients.select(keepStocked)
        for i in ings:
            if i.amount < (.25 * i.amountPkg):
                shopping.append(i.name)
        response = len(shopping)
        return jsonify({"recipes": recipes,
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
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        allItems = SPDB.Ingredients.select(allUserItems)
        pantry = [i.to_dict() for i in allItems]
        for i in pantry:
            i['viewAmount'] = getViewAmount(i)
            i['hasContent'] = True
            i['path'] = '/pantry/'
            if i.get('imagePath'):
                i['imagePath'] = getThubnail(i['imagePath'])
        return jsonify({"list": pantry}), 200


def getApperentDates(startDate, stepType, step, viewLengthDays):
    startDate = datetime.datetime.date(startDate)
    today = datetime.datetime.date(datetime.datetime.today())
    # print(today)
    lastDay = today + datetime.timedelta(viewLengthDays)
    returnDates = []
    # the date starts after the view window
    if startDate >= lastDay:
        return returnDates
    # There was no repeating feature active.
    if not stepType or stepType == '':
        # make sure it's in the window right?
        # print(f"{startDate} {today} {lastDay}" )
        if startDate >= today and startDate <= lastDay:
            returnDates.append(startDate)
        return returnDates
    # feature "day of the week meal" active
    elif stepType == 'dow':
        # print('feature :day of the week: active')
        currentDate = startDate
        while currentDate <= lastDay:
            returnDates.append(currentDate)
            # advance to next time we have the right day of the week.
            for i in range(7):
                currentDate += datetime.timedelta(1)
                if currentDate.weekday() == step:
                    break
    # feature "day of the month" meal active
    elif stepType == 'dom' and startDate >= today:
        # print('feature divisable by number active')
        while currentDate <= lastDay:
            if (not currentDate.day % step) or currentDate.day == 1:
                returnDates.append(currentDate)
            # skip down to next day
            for i in range(31):
                currentDate += datetime.timedelta(1)
                if currentDate.day == step:
                    break
    # print(returnDates)
    # print('end of getApperentDates()')
    return returnDates


@db_session
def viewAmountAndIngMissing(recipe):
    total = 0
    satisfied = 0
    ingDict = dict()
    recipe.requirements.load()
    for r in recipe.requirements:
        total += 1
        measure = singular(r.amountMeasure)
        isMetered = convert.get(measure)
        ing = r.ingredient.to_dict()
        if isMetered:
            needs = meteric2oz(r.amount, measure)
        else:
            needs = r.amount
        if checkRequirement(needs, ing):
            satisfied += 1
        collectRequirement(ingDict, needs, ing)
    missing = [i for i in ingDict.values() if i['amount'] < i['needs']]
    if total == 0:
        return (0, 0)
    return (satisfied / total, len(missing))


@db_session
def todayMeals(user):
    'this grabs meals for just today.'
    todayMeals = []
    viewLengthDays = 1
    allTeamItems = lambda i: (i.tid == user.team)
    allMealPlans = SPDB.MealPlans.select(allTeamItems)
    for plan in allMealPlans:
        itemDates = getApperentDates(plan.date,
                                     plan.stepType,
                                     plan.step,
                                     viewLengthDays)
        date = datetime.datetime.date(datetime.datetime.today())
        if date in itemDates:
            p = plan.recipe.to_dict()
            p['path'] = '/recipes/view/'
            (p['viewAmount'], _) = viewAmountAndIngMissing(plan.recipe)
            todayMeals.append(p)
    return todayMeals


@db_session
def readyMeals(user):
    'only meals that can be made'
    allTeamItems = lambda i: (i.tid == user.team)
    readyMeals = []
    recipes = SPDB.Recipes.select(allTeamItems)
    for recipe in recipes:
        (_, missing) = viewAmountAndIngMissing(recipe)
        if not missing:
            r = recipe.to_dict()
            r['path'] = '/recipes/view/'
            readyMeals.append(r)
    return readyMeals


@db_session
def thriftyMeals(user):
    'only meals missing less then 2 items'
    allTeamItems = lambda i: (i.tid == user.team)
    thriftyMeals = []
    recipes = SPDB.Recipes.select(allTeamItems)
    for recipe in recipes:
        (viewAmount, missing) = viewAmountAndIngMissing(recipe)
        if missing > 0 and missing <= 3:
            r = recipe.to_dict()
            r['viewAmount'] = viewAmount
            r['path'] = '/recipes/view/'
            thriftyMeals.append(r)
    return thriftyMeals


@db_session
def featuredMeals(user):
    'External Meals you might enjoy (random 3)'
    myRecipNames = select(r.name for r in SPDB.Recipes if r.tid == user.team)
    External = lambda r: (r.public is True and
                          r.tid != user.team and
                          r.name not in myRecipNames)
    featuredMeals = []
    recipes = SPDB.Recipes.select(External)
    for r in recipes.random(3):
        recipe = r.to_dict()
        recipe['path'] = '/public/recipes/{}/{}?a='.format(r.name, r.id)
        featuredMeals.append(recipe)
    return featuredMeals


@db_session
def ingToCheck(user):
    'Ingredients that expire this week or after.'
    MyIngredients = lambda i: (i.tid == user.team)
    ingToCheck = []
    ingredients = SPDB.Ingredients.select(MyIngredients)
    for i in ingredients:
        # lastBuyDate the 10th + fresh for = when the item will expire
        # today + 7 days = look ahead 7 days into the future. has anything expired?
        if i.lastBuyDate and ((i.lastBuyDate + datetime.timedelta(i.freshFor)) <=
           (datetime.datetime.today() + datetime.timedelta(7))):
            ing = i.to_dict()
            ing['path'] = '/pantry/'
            ing['viewAmount'] = getViewAmount(ing)
            ingToCheck.append(ing)
    return ingToCheck


@bp.route('/v1/views/home', methods=['GET'])
@jwt_required
def viewMealPlanList():
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    tM = todayMeals(user)
    rM = readyMeals(user)
    thrM = thriftyMeals(user)
    fM = featuredMeals(user)
    iC = ingToCheck(user)
    return jsonify({"todayMeals": tM,
                    "readyMeals": rM,
                    "thriftyMeals": thrM,
                    "featuredMeals": fM,
                    "ingToCheck": iC}), 200


@bp.route('/v1/views/search', methods=['POST'])
@jwt_required
@db_session
def searchView():
    username = get_jwt_identity()
    user = identify(username)
    viewLengthDays = 14
    if request.is_json is False:
        return jsonify({"Must use json and set json header": 400}), 301
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    catagory = request.json.get('catagory')
    if catagory is None:
        return jsonify({"Missing attribute catagory": 400}), 400
    orderBy = request.json.get('orderBy')
    if orderBy is None:
        return jsonify({"Missing attribute orderBy": 400}), 400
    res = []
    allTeamItems = lambda i: i.tid == user.team
    if catagory == 'recipes':
        allItems = SPDB.Recipes.select(allTeamItems)[:]
        for recipe in allItems:
            (viewAmount, missing) = viewAmountAndIngMissing(recipe)
            r = recipe.to_dict()
            r['viewAmount'] = viewAmount
            r['path'] = '/recipes/view/'
            res.append(r)
        if orderBy == 'Ready':
            res.sort(key=lambda x: x.get('viewAmount', 0), reverse=True)
        elif orderBy == 'Not Ready':
            res.sort(key=lambda x: x.get('viewAmount', 0))
        elif orderBy == 'Most Used':
            res.sort(key=lambda x: x.get('used', 0), reverse=True)
        elif orderBy == 'Least Used':
            res.sort(key=lambda x: x.get('used', 0))
        elif orderBy == 'Recently Used':
            res.sort(key=lambda x: x.get('lastUsed'), reverse=True)
        elif orderBy == 'Not Used Since':
            res.sort(key=lambda x: x.get('lastUsed'))
        elif orderBy == 'Public':
            res = []
            myRecipNames = select(r.name for r in SPDB.Recipes if r.tid == user.team)
            External = lambda r: (r.public is True and
                                  r.tid != user.team and
                                  r.name not in myRecipNames)
            allItems = SPDB.Recipes.select(External)
            for recipe in allItems.random(50):
                r = recipe.to_dict()
                r['path'] = '/public/recipes/{}/{}?a='.format(r['name'], r['id'])
                res.append(r)
        else:
            return jsonify({"Not a valid search order": 400}), 400
        return jsonify(res), 200
    elif catagory == 'pantry':
        allItems = SPDB.Ingredients.select(allTeamItems)
        for ing in allItems:
            i = ing.to_dict()
            i['path'] = '/pantry/'
            res.append(i)
        if orderBy == 'Check Soon':
            res = [ {'checkDate': r['lastBuyDate'] + datetime.timedelta(r['freshFor']), **r} for r in res
                    if r.get('lastBuyDate') is not None and
                       r.get('freshFor') is not None and
                       r.get('freshFor') is not 0 ]
            res.sort(key=lambda x: x['checkDate'])
        elif orderBy == 'Check Later':
            res = [ {'checkDate': r['lastBuyDate'] + datetime.timedelta(r['freshFor']), **r} for r in res
                    if r.get('lastBuyDate') is not None and
                       r.get('freshFor') is not None and
                       r.get('freshFor') is not 0 ]
            res.sort(key=lambda x: x['checkDate'], reverse=True)
        elif orderBy == 'Largest Amount':
            res.sort(key=lambda x: x.get('amount', 0), reverse=True)
        elif orderBy == 'Smallest Amount':
            res.sort(key=lambda x: x.get('amount', 0))
        elif orderBy == 'Most Used':
            res.sort(key=lambda x: x.get('used'), reverse=True)
        elif orderBy == 'Least Used':
            res.sort(key=lambda x: x.get('used'))
        elif orderBy == 'Recently Used':
            res.sort(key=lambda x: x.get('lastUsed'), reverse=True)
        elif orderBy == 'Not Used Since':
            res.sort(key=lambda x: x.get('lastUsed'))
        else:
            return jsonify({"Not a valid search order": 400}), 400
        return jsonify(res), 200
    elif catagory == 'mealPlans':
        allPlans = SPDB.MealPlans.select(allTeamItems)
        for plan in allPlans:
            itemDates = getApperentDates(plan.date,
                                         plan.stepType,
                                         plan.step,
                                         viewLengthDays)
            for date in itemDates:
                res.append({
                    'id': plan.id,
                    'path': '/mealplans/edit/' + date.strftime("%a, %b %d %Y") + '?a=',
                    'date': date.strftime("%a, %b %d %Y"),
                    'name': date.strftime("%a, %b %d %Y") + " " + plan.recipe.name,
                    'recipe': plan.recipe.name,
                    'keepStocked': plan.keepStocked,
                    'stepType': plan.stepType,
                    'step': plan.step})
        if orderBy == 'Present -> Future':
            res.sort(key=lambda m: m.get('date') or datetime.datetime.today(), reverse=True)
        elif orderBy == 'Future -> Present':
            res.sort(key=lambda m: m.get('date') or datetime.datetime.today())
        else:
            return jsonify({"Not a valid search order": 400}), 400
        return jsonify(res), 200
    else:
        return jsonify({"Not a valid search catagory": 400}), 400
    return jsonify({"OK": 200}), 200

@bp.route('/v1/views/mealplans', methods=['GET'])
@bp.route('/v1/views/mealplans/<int:viewLengthDays>', methods=['GET'])
@jwt_required
@db_session
def mealPlansView(viewLengthDays=None):
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if not viewLengthDays:
        viewLengthDays = 14
    allUserItems = lambda i: (i.tid == user.team)
    allItems = SPDB.MealPlans.select(allUserItems)
    mealplans = []
    for plan in allItems:
        itemDates = getApperentDates(plan.date,
                                     plan.stepType,
                                     plan.step,
                                     viewLengthDays)
        for date in itemDates:
            mealplans.append({
                'id': plan.id,
                'date': date.strftime("%a, %b %d %Y"),
                'recipe': plan.recipe.name,
                'keepStocked': plan.keepStocked,
                'stepType': plan.stepType,
                'step': plan.step})
    dates = []
    today = datetime.datetime.today()
    for i in range(viewLengthDays):
        later = today + datetime.timedelta(i)
        dates.append(later.strftime("%a, %b %d %Y"))
    return jsonify({"dates": dates, "mealplans": mealplans}), 200


def getViewAmount(ing, needs=None):
    if needs is None:
        needs = ing['amountPkg']
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
            ing['imagePath'] = getThubnail(ing['imagePath'])
        shopping[name] = ing


def checkRequirement(needs, ing):
    if getViewAmount(ing, needs) >= 1:
        return True
    else:
        return False


@bp.route('/v1/views/shopping', methods=['GET'])
@jwt_required
@db_session
def shoppingView():
    data = {}
    username = get_jwt_identity()
    user = identify(username)
    recipes_wanting = []
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        shopping = dict()
        keepStocked = lambda i: (i.uid == user and
                                 i.keepStocked)
        recipes = SPDB.Recipes.select(keepStocked)
        for recipe in recipes:
            recipe.requirements.load()
            for r in recipe.requirements:
                measure = singular(r.amountMeasure)
                isMetered = convert.get(measure)
                ing = r.ingredient.to_dict()
                ing['path'] = '/pantry/'
                ing['hasContent'] = True
                if isMetered:
                    needs = meteric2oz(r.amount, measure)
                    collectRequirement(shopping, needs, ing)
                else:
                    needs = r.amount
                    collectRequirement(shopping, needs, ing)
                if ing['amount'] < needs:
                    (viewAmount, missing) = viewAmountAndIngMissing(recipe)
                    r = recipe.to_dict()
                    r['hasContent'] = True
                    r['path'] = '/recipes/view/'
                    r['viewAmount'] = viewAmount
                    recipes_wanting.append(r)

        # dedupe some of the recipe names
        recipes_filtered = []
        for r in recipes_wanting:
            if r not in recipes_filtered:
                recipes_filtered.append(r)

        ret = [v for v in shopping.values() if v['amount'] < v['needs']]

        ingredients = SPDB.Ingredients.select(keepStocked)
        # ret has a list of all meal requred items, this part adds items in the
        # pantry which are low on supplies.
        for i in ingredients:
            if i.amount < (i.amountPkg * .25):
                if i.name not in [ i['name'] for i in ret ]:
                    ing = i.to_dict()
                    ing['hasContent'] = True
                    ing['path'] = '/pantry/'
                    ing['viewAmount'] = getViewAmount(ing, None)
                    ret.append(ing)
        return jsonify({"recipes": recipes_filtered, "ingredients": ret}), 200


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


def recipeCount(recipe):
    lastValue = None
    for req in recipe.requirements:
        amountOnHand = oz2meteric(req.ingredient.amount,
                                  req.amountMeasure)
        thisValue = amountOnHand / req.amount
        if lastValue is None:
            lastValue = thisValue
        if thisValue < lastValue:
            lastValue = thisValue
    return int(lastValue)


def getThubnail(imgPath):
    return resized_img_src(os.path.normpath(imgPath), hegiht=300, crop=True)


@bp.route('/v1/views/recipes', methods=['GET'])
@jwt_required
@db_session
def recipesView():
    username = get_jwt_identity()
    user = identify(username)
    if user is None:
        return jsonify({'please verify your e-mail': 401}), 401
    if request.method == 'GET':
        allUserItems = lambda i: (i.uid == user)
        Recipes = SPDB.Recipes.select(allUserItems)
        data = []
        for recipe in Recipes:
            # go to each requirement and find out how many of
            # this recipe i can make.
            r = recipe.to_dict()
            r["value"] = recipeCount(recipe)
            if r.get('imagePath'):
                r['imagePath'] = getThubnail(r['imagePath'])
            data.append(r)
        return jsonify({"list": data}), 200


def appFactory():
    app = Flask(__name__)
    app.register_blueprint(bp)
    limiter.init_app(app)
    return app


if __name__ == "__main__":
    config = getConfig()
    dbSetup(config)
    host, port = getSocket(config)
    app = appFactory()
    app = appSetup(app, config)
    mail.init_app(app)
    jwt = JWTManager(app)
    images = Images(app)
    app.debug = False
    app.run(host, port)
