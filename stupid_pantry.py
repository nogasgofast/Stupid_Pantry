#!/bin/python3

from flask import Flask, session, redirect, url_for, escape, request
from flask import render_template, flash, abort, Blueprint
from pony.orm import *
import os
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
                else:
                    usr.is_authenticated = True
                    return redirect(url_for('main.home'))
    return render_template('login.html', error=error)

@bp.route('/logout')
def logout():
    # remove the username from the session if it's there
    session.pop('username', None)
    return redirect(url_for('index'))

@bp.route('/')
def home():
    if not session.get('logged_in'):
        data = {}
        return render_template('home.html', data=data)
    else:
        return "Hello Boss!"

@bp.route('/cookbook')
def pantry():
    return render_template('cookbook.html')

@bp.route('/random')
def suggestions():
    return render_template('random.html')

@bp.route('/tomb')
def tomb():
    return render_template('tomb.html')

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
    app.secret_key = os.urandom(24)
    app.register_blueprint(bp)
    return app

if __name__ == "__main__":
    config = get_config()
    db_setup(config)
    host, port = get_socket(config)
    app = app_factory()
    app.run(host, port)
