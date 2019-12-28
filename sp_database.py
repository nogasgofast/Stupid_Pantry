#!/bin/python3
from pony.orm import *

spantry = Database()

class Ingredients(spantry.Entity):
    uid = Required('Users')
    name = Required(str)
    amount = Required(int, default=0)
    amount_pkg = Required(int, default=1)
    keepStocked = Required(bool, default=False)
    required_by = Set('Requirements')
    PrimaryKey(uid, name)

class Requirements(spantry.Entity):
    uid = Required('Users')
    ingredient = Required('Ingredients')
    amount = Required(float)
    amount_measure = Optional(str)
    recipe = Required('Recipes')
    PrimaryKey(uid, recipe, ingredient)

class Recipes(spantry.Entity):
    uid = Required('Users')
    name = Required(str)
    instructions = Required(str)
    requirements = Set('Requirements')
    public = Optional(bool, default=False)
    keepStocked = Required(bool, default=False)
    PrimaryKey(uid, name)

class Users(spantry.Entity):
    username = Required(str)
    pwHash = Required(str)
    ingredients = Set('Ingredients')
    recipes = Set('Recipes')
    requirements = Set('Requirements')
    is_authenticated = Required(bool, default=False)
    is_active = Required(bool, default=False)
    is_anonymous = Required(bool, default=False)

if __name__ == 'MAIN':
    spantry.bind(provider='sqlite', filename=':memory:', create_db=True)
    spantry.generate_mapping(create_tables=True)
