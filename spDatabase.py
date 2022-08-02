#!/bin/python3
from datetime import datetime
from pony.orm import (Database, Set,
                      Required, Optional,
                      LongStr, PrimaryKey)


SPDB = Database()


class Ingredients(SPDB.Entity):
    uid = Required('Users')
    tid = Required('Teams')
    name = Required(str)
    amount = Required(float, default=0)
    amountPkg = Required(int, default=1)
    # measured by weight or count
    byWeight = Optional(bool, default=True)
    barcode = Optional(str)
    lastBuyDate = Optional(datetime)
    # number of weeks the items stays fresh
    freshFor = Optional(int, default=0)
    keepStocked = Required(bool, default=False)
    imagePath = Optional(str)
    used = Required(int, default=0)
    lastUsed = Required(datetime, default=datetime.now())
    requiredBy = Set('Requirements', cascade_delete=False)
    PrimaryKey(tid, name)



class Requirements(SPDB.Entity):
    uid = Required('Users')
    tid = Required('Teams')
    alias = Optional(str)
    ingredient = Required('Ingredients', reverse="requiredBy")
    amount = Required(float)
    dispAmount = Optional(str)
    conversion = Optional(float)
    amountMeasure = Optional(str)
    recipe = Required('Recipes')


class MealPlans(SPDB.Entity):
    uid = Required('Users')
    tid = Required('Teams')
    recipe = Required('Recipes')
    date = Required(datetime)
    # day of week,month
    stepType = Optional(str, default='dow')
    step = Required(int, default=0)
    keepStocked = Required(bool, default=False)


class Recipes(SPDB.Entity):
    uid = Required('Users')
    tid = Required('Teams')
    name = Required(str)
    instructions = Required(LongStr)
    requirements = Set('Requirements')
    mealplans = Set('MealPlans')
    public = Optional(bool, default=False)
    copied = Optional(int, default=0)
    imagePath = Optional(str)
    keepStocked = Required(bool, default=False)
    used = Required(int, default=0)
    lastUsed = Required(datetime, default=datetime.now())


class Users(SPDB.Entity):
    username = Required(str)
    email = Required(str)
    team = Required('Teams')
    role = Required('Roles')
    pwHash = Required(str)
    ingredients = Set('Ingredients')
    recipes = Set('Recipes')
    requirements = Set('Requirements')
    mealplans = Set('MealPlans')
    invoices = Set('Invoices')
    createDate = Required(datetime, default=datetime.now())
    lastLogin = Required(datetime, default=datetime.now())
    isAuthenticated = Required(bool, default=False)
    isActive = Required(bool, default=False)
    isAnonymous = Required(bool, default=False)


class Teams(SPDB.Entity):
    name = Optional(str, default='chef')
    ingredients = Set('Ingredients')
    recipes = Set('Recipes')
    requirements = Set('Requirements')
    mealplans = Set('MealPlans')
    users = Set('Users', cascade_delete=False)
    roles = Set('Roles', cascade_delete=False)
    invoices = Set('Invoices')
    contribToDate = Optional(float)
    contribLast = Optional(float)
    renewedLast = Required(datetime, default=datetime.now())


class Invoices(SPDB.Entity):
    user = Required('Users')
    team = Required('Teams')
    amountRequested = Required(float)
    requestDate = Required(datetime, default=datetime.now())
    paid = Required(bool, default=False)
    paidDate = Optional(datetime, default=datetime.now())
    amountOver = Optional(float)


class Roles(SPDB.Entity):
    users = Set('Users')
    team = Required('Teams')
    name = Required(str, default='TeamLeader')
    access = Required(int, default=1)



if __name__ == 'MAIN':
    SPDB.bind(provider='sqlite', filename=':memory:', create_db=True)
    SPDB.generate_mapping(create_tables=True)
