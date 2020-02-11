#!/bin/python3
import datetime
from pony.orm import *

spantry = Database()

class Ingredients(spantry.Entity):
    uid = Required('Users')
    name = Required(str)
    amount = Required(float, default = 0)
    amount_pkg = Required(int, default = 1)
    barcode = Optional(str)
    keepStocked = Required(bool, default = False)
    imagePath = Optional(str)
    required_by = Set('Requirements', cascade_delete = False)

class Requirements(spantry.Entity):
    uid = Required('Users')
    ingredient = Required('Ingredients')
    amount = Required(float)
    amount_measure = Optional(str)
    recipe = Required('Recipes')

class MealPlans(spantry.Entity):
    uid = Required('Users')
    recipe = Required('Recipes')
    date = Required(datetime.datetime)
    step_type = Optional(str, default = 'dow') #day of week,month
    step = Required(int, default = 0)
    keepStocked = Required(bool, default = False)

class Recipes(spantry.Entity):
    uid = Required('Users')
    name = Required(str)
    instructions = Required(str)
    requirements = Set('Requirements')
    mealplans = Set('MealPlans')
    public = Optional(bool, default = False)
    imagePath = Optional(str)
    keepStocked = Required(bool, default = False)

class Users(spantry.Entity):
    username = Required(str)
    pwHash = Required(str)
    ingredients = Set('Ingredients')
    recipes = Set('Recipes')
    requirements = Set('Requirements')
    mealplans = Set('MealPlans')
    is_authenticated = Required(bool, default = False)
    is_active = Required(bool, default = False)
    is_anonymous = Required(bool, default = False)

if __name__ == 'MAIN':
    spantry.bind(provider='sqlite', filename = ':memory:', create_db = True)
    spantry.generate_mapping(create_tables = True)
