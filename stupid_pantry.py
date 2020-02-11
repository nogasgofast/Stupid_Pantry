#!/bin/python3

from flask import Flask, session, redirect, url_for, escape, request, jsonify
from flask import render_template, flash, abort, Blueprint
from fractions import Fraction
import re
import configparser
from passlib.apps import custom_app_context as pwd_context
import sp_database

bp = Blueprint( 'main', __name__ )

class User:
    @db_session
    def hash_password(self, password):
        self.db.pwHash = pwd_context.encrypt(password)
        commit()

@db_session
def verify_password(username, password):
    user = sp_database.User.get(lambda u: u.name == username)
    if user and pwd_context.verify(password, user.pwHash):
        return user

@db_session
def idtentity(payload):
    user_id = payload['identity']
    user = sp_database.User.get(lambda u: u.id == user_id)
    return user

def singular(name):
    no_plural = r'(\w+?)s\b'
    s_name = re.match(no_plural, name)
    if s_name:
        name = s_name.group(1)
    return name

def parse_recipe(recipe, uid):
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
                        "uid": uid,
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
                discover_by_name = ingredient_search(ing['name'], uid)
                perfect_match = [ m for m in discover_by_name if m.get('perfect_match')]
                if perfect_match:
                    ing['perfect match'] = perfect_match
                if discover_by_name:
                    ing['pantry'] = discover_by_name
                else:
                    ing['pantry'] = []
                    ing['no match'] = True

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
                ing['uid'] = uid
            # if not ing.get('applet'):
            #     ing['applet'] = 'recipe'
            data['ingredients'].append(ing)
        if stop == True:
            if re.search(r'.+',line):
                data['instructions'].append(line)
    return data

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
             if ing.uid.id == uid and ing.name in top_three:
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
    app.secret_key = b'\xfc\xef\x91EQ\xcb.N\x89\xc8\x97\xbb^\xd3\x863'
    return app


# Route for handling the login page logic
@bp.route('/v1/user', methods=['POST'])
@db_session
def auth_post():
    username = request.json.get('username')
    password = request.json.get('password')
    if username is None or password is None:
        abort(400) # missing arguments
    # attempt to query for this user.
    user = sp_database.User.get(lambda u: u.name == username)
    if user:
        abort(409) # existing user Conflict
    user = sp_database.User(name=username,
                            pwHash=pwd_context.encrypt(password))
    return jsonify({'username': user.name }), 201

@bp.route('/v1/user', methods=['DELETE'])
@auth.login_required
def auth_delete():
    ans = session.get('uid')
    if ans:
        session['logged_in'] = False
        usr = User(session.get('uid'))
        usr.logout()
        return redirect(url_for('main.home'))


@bp.route('/v1/user', methods=['GET'])
@jwt_required
@db_session
def login():
    if name:
        usr = get( u for u in sp_database.User if u.name == name )
        if not usr or md5shhh != usr.password:
            error = 'Invalid Credentials. Please try again.'
            print(error)
        else:
            session['uid'] = usr.id
            session['logged_in'] = True
            return redirect(url_for('main.home'))

@bp.route('/v1/user', method=['EXPIRE'])
@jwt_required
def logout():
    session['logged_in'] = False
    return redirect(url_for('main.home'))


@bp.route('/')
def home():
    if not session.get('logged_in'):
        return render_template('login.html')
    data = {}
    data['PAN'] = []
    data['CKB'] = []
    with db_session:
        uid = session.get('uid')
        pantry = select(ing for ing in sp_database.Ingredients if ing.uid.id == uid)[:]
        cookbook = select(reci for reci in sp_database.Recipies if reci.uid.id == uid)[:]
        # {{ row.ingredient_link }}">{{ row.ingredient_name }}
        # {{ row.ingredient_amount }} of {{ row.ingredient_amount_max }}
        # {{ row.ingredient_measure }}
        for item in pantry:
            data['PAN'].append({
            'link' : "/pantry/{}".format(item.id),
            'id'   : item.id,
            'name' : item.name,
            'amount' : item.amount,
            'amount_pkg' : item.amount_pkg,
            'amount_measure' : item.amount_measure})
        for reci in cookbook:
            ingredients = []
            for requirement in reci.requirements:
                item = requirement.ingredient
                if item.amount - requirement.amount < 0:
                    low_stock=True
                else:
                    low_stock=False
                ingredients.append({
                'link' : "/pantry/{}".format(item.id),
                'id'   : item.id,
                'name' : item.name,
                'amount' : to_display(requirement.amount),
                'amount_pkg' : item.amount_pkg,
                'measure' : item.amount_measure,
                'low_stock': low_stock})

            data['CKB'].append({
            'meal_name' : reci.name,
            'ingredients' : ingredients,
            'instructions' : reci.instructions,
            'meal_count' : meal_count(reci.requirements)})
        return render_template('home.html', data=data)

@bp.route('/v1/ingredients')
def api_ingredients():
    # Create
    # Read
    # Update
    # Delete
    pass

@bp.route('/v1/recipies')
@bp.route('/v1/recipies/requirements')
def api_recipies():
    # Create
    # Read
    # Update
    # Delete
    pass

@bp.route('/pantry', methods=['POST'])
@bp.route('/pantry/<int:id>', methods=['POST'])
def pantry_post(id=None):
    if not session.get('logged_in'):
        return render_template('login.html')
    if request.method == 'POST':
        name = request.form.get('name')
        if name:
            amount = request.form.get('amount')
            amount = assert_int_value(amount)
            amount_pkg = request.form.get('amount_pkg')
            amount_pkg = assert_int_value(amount_pkg)
            keep_stocked = bool(request.form.get('keep_stocked'))
            print("keep stocked: {}".format(keep_stocked))

            meteric = request.form.get('meteric')
            meteric = meteric.strip()
            if not meteric:
                meteric = name
                # Try to find what the type is here with a
                # secondary lookup if possible
                # otherwise just put an s after the name and
                # get on with your life. bannanas = 3 bannanas
                if not re.search('s$', meteric):
                    meteric = meteric + "s"

            with db_session:
                # if id exists we are trying to replace a thing
                if id:
                    # print('id found')
                    ing = sp_database.Ingredients.get(id=id)
                    # print("amount pkg is {}".format(amount_pkg))
                    if ing:
                        print('ingredient rewrite')
                        ing.name = name
                        ing.amount = amount
                        ing.amount_pkg = amount_pkg
                        ing.amount_measure = meteric
                        ing.keep_stocked = keep_stocked
                        commit()
                    else:
                        # print('no ingredient rewrite')
                        # creating entry from nothin.
                        ing = sp_database.Ingredients(
                            uid            = session['uid'],
                            name           = name,
                            amount         = amount,
                            amount_pkg     = amount_pkg,
                            amount_measure = meteric,
                            keep_stocked   = keep_stocked)
                # we are just making a new item.
                else:
                    print('id not found')
                    ing = sp_database.Ingredients(
                        uid            = session['uid'],
                        name           = name,
                        amount         = amount,
                        amount_pkg     = amount_pkg,
                        amount_measure = meteric,
                        keep_stocked   = keep_stocked)
            return redirect(url_for('main.home'))
        else:
            flash("Name not Input, you need at least that!")
            return redirect(url_for('main.pantry_form'))


@bp.route('/pantry/<int:id>', methods=['GET', 'DELETE'])
@bp.route('/pantry/<int:id>/<action>/<int:amount>', methods=['PUT'])
def pantry(id=None,action=None,amount=0):
    if not session.get('logged_in'):
        return render_template('login.html')

    if request.method == 'GET':
        if id:
            with db_session:
                ing = sp_database.Ingredients.get(id=id)
                ingredient = ing.to_dict()
                ingredient['amount_measure'] = ing.amount_measure
                print("delievering {}".format(ing.keep_stocked))
                if ing:
                    return render_template('pantry_form.html', data=ingredient)
                else:
                    flash("Not Found")
                    return "Not Found", 404

    if request.method == 'DELETE':
        if id:
            with db_session:
                ing = sp_database.Ingredients.get(id=id)
                if ing:
                    ing.delete()
                    return "OK", 200
                else:
                    flash("Not Found")
                    return "Not Found", 404

    # This only exists for adding and subtracting buttons.
    if request.method == 'PUT':
        if id:
            with db_session:
                ing = sp_database.Ingredients.get(id=id)
                if ing:
                    if action == 'add':
                        ing.amount = assert_int_value(amount + ing.amount)
                    if action == 'remove':
                        ing.amount = assert_int_value(ing.amount - amount)
                    ingredient = ing.to_dict()
                    # Measure objects are not serializable and one level too deep
                    # for a regular to_dict() call.
                    ingredient['amount_measure'] = ing.amount_measure
                    return jsonify(ingredient), 200
                else:
                    return "Not Found", 404

@bp.route('/pantry/form')
def pantry_form():
    if not session.get('logged_in'):
        return render_template('login.html')
    return render_template('pantry_form.html', data=None)

@bp.route('/cookbook/form', methods=['GET', 'POST'])
@bp.route('/cookbook/<int:id>', methods=['PUT'])
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
            recipie = request.form.get('recipe')
            if recipie:
                data = parse_recipe(recipie, uid)
            session['recipe'] = data
            return render_template('cookbook_form.html', data=data)
        elif request.form.get('save'):
            # the structure in the session is accurate so we use that.
            data = session['recipe']
            # open connection to db
            with db_session:
                # start to create one recipie
                recipe = sp_database.Recipies(
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
                                                      recipie=recipe)
                        continue
                    # this is what to do if item directly matches pantry item.
                    if ing.get('perfect match'):
                        ing.pop('perfect match', None)
                        ing.pop('pantry', None)
                        # print(sp_database.Ingredients.get(lambda i: i.name == ing['name']))
                        ing = sp_database.Ingredients.get(lambda i: i.name == ing['name'])
                        req = sp_database.Requirements(ingredient=ing,
                                                      amount=amount,
                                                      recipie=recipe)
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
                                                          recipie=recipe)
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
    jwt = JWT(app, authenticate, identity)
    app.debug = True
    app.run(host, port)
