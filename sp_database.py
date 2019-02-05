#!/bin/python3
from pony.orm import *

spantry = Database()

class Ingredients(spantry.Entity):
    uid = Required('User')
    applet = Required(str)
    name = Required(str)
    quantity = Required(str)
    recipies = Optional('Recipies')

class Recipies(spantry.Entity):
    uid = Required('User')
    applet = Required(str)
    name = Required(str)
    amounts = Required(str)
    ingredients = Set('Ingredients')

class User(spantry.Entity):
    name = Required(str)
    ingredients = Set('Ingredients')
    recipies = Set('Recipies')
    password = Required(str)
    is_authenticated = Required(bool)
    is_active = Required(bool)
    is_anonymous = Required(bool)

if __name__ == 'MAIN':
    spantry.bind(provider='sqlite', filename=':memory:', create_db=True)
    spantry.generate_mapping(create_tables=True)
