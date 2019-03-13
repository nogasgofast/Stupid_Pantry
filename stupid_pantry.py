#!/bin/python3

from flask import Flask, session, redirect, url_for, escape, request, jsonify
from flask import render_template, flash, abort, Blueprint
from pony.orm import *
import os
import re
import configparser
import hashlib
import sp_database


bp = Blueprint( 'main', __name__ )

# Route for handling the login page logic
@bp.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        name = request.form.get('username')
        pwshhh = request.form.get('password')
        md5shhh = hashlib.md5(pwshhh.encode('utf8')).hexdigest()
        if name:
            with db_session:
                usr = get( u for u in sp_database.User if u.name == name )
                if not usr or md5shhh != usr.password:
                    usr = sp_database.User(name=name, password=md5shhh,
                        is_authenticated=False,is_active=False,is_anonymous=False)
                    usr.is_authenticated = True
                    return redirect(url_for('main.home'))
                else:
                    error = 'User already exists Sorry. Try another.'
    return render_template('register.html', error=error)

# Route for handling the login page logic
@bp.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        name = request.form.get('username')
        pwshhh = request.form.get('password')
        md5shhh = hashlib.md5(pwshhh.encode('utf8')).hexdigest()
        if name:
            with db_session:
                usr = get( u for u in sp_database.User if u.name == name )
                if not usr or md5shhh != usr.password:
                    error = 'Invalid Credentials. Please try again.'
                    print(error)
                else:
                    session['uid'] = usr.id
                    session['logged_in'] = True
                    return redirect(url_for('main.home'))
    return render_template('login.html', error=error)

@bp.route('/logout')
def logout():
    # remove the username from the session if it's there
    session['logged_in'] = False
    return redirect(url_for('main.home'))

@bp.route('/')
def home():
    if not session.get('logged_in'):
        return render_template('login.html')
    data = {}
    data['PAN'] = []
    with db_session:
        uid = session.get('uid')
        pantry = select(ing for ing in sp_database.Ingredients if ing.uid.id == uid)[:]
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
            'measure' : item.amount_measure.name})
        return render_template('home.html', data=data)

@bp.route('/pantry', methods=['GET','POST'])
@bp.route('/pantry/<id>', methods=['GET', 'DELETE'])
@bp.route('/pantry/<id>/<action>/<int:amount>', methods=['PUT'])
def pantry(id=None,action=None,amount=0):
    if not session.get('logged_in'):
        return render_template('login.html')
    if request.method == 'POST':
        name = request.form.get('name')

        if name:
            amount = request.form.get('amount')
            amount = assert_int_value(amount)
            amount_pkg = request.form.get('pkg_amount')
            amount_pkg = assert_int_value(amount_pkg)

            meteric = request.form.get('meteric', 1)
            meteric = meteric.strip()
            if not meteric:
                meteric = name
                # Try to find what the type is here with a
                # secondary lookup if possible
                # otherwise just put an s after the name and
                # get one with your life. bannanas = 3 bannanas
                if not re.search('s$', meteric):
                    meteric = meteric + "s"

            with db_session:
                measure = get(m for m in sp_database.Measures if m.name == meteric)
                if not measure:
                    measure = sp_database.Measures(name=meteric)
                    commit()
                ing = sp_database.Ingredients(
                    uid            = session['uid'],
                    applet         = 'pantry',
                    name           = name,
                    amount         = amount,
                    amount_pkg     = amount_pkg,
                    amount_measure = measure)
            return redirect(url_for('main.home'))
        else:
            flash("Name not Input, you need at least that!")
            return redirect(url_for('main.pantry_form'))
    if request.method == 'PUT':
        if id:
            with db_session:
                ing = sp_database.Ingredients.get(id=id)
                if ing:
                    if action == 'add':
                        ing.amount += amount
                    if action == 'remove':
                        ing.amount -= amount
                        if ing.amount < 0:
                            ing.amount = 0;
                    ingredient = ing.to_dict()
                    # Measure objects are not serializable and one level too deep
                    # for a regular to_dict() call.
                    ingredient['amount_measure'] = ing.amount_measure.name
                    return jsonify(ingredient), 200
                else:
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

@bp.route('/pantry/form')
def pantry_form():
    if not session.get('logged_in'):
        return render_template('login.html')
    return render_template('pantry_form.html')

@bp.route('/cookbook/form')
def cookbook_form():
    if not session.get('logged_in'):
        return render_template('login.html')
    return render_template('cookbook_form.html')


def get_config():
    config = configparser.ConfigParser()
    config.read('/etc/stupid_pantry.conf')
    return config

def assert_int_value(thing):
    if not thing:
        thing = 1
    if thing != int(thing):
        thing = int(thing)
    if thing > 1000:
        thing = 1000
    if thing < 0:
        thing = 0
    return thing


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
    app.secret_key = os.urandom(24)
    app.register_blueprint(bp)
    return app

if __name__ == "__main__":
    config = get_config()
    db_setup(config)
    host, port = get_socket(config)
    app = app_factory()
    app.debug = True
    app.run(host, port)
