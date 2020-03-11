#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import spAPI
import spDatabase

#test data
class Requirements_route(unittest.TestCase):
    try:
        SPDB.spantry.bind('sqlite', ':memory:', create_db=True)
        SPDB.spantry.generate_mapping(create_tables=True)
    except pony.orm.core.BindingError:
        print("\n[INFO]: control_service_test says database already bound \n")
    def setUp(self):
        SPDB.spantry.create_tables()
        with db_session:
            SPDB.spantry.Users(username="test",
                                        pwHash="test",
                                        isAuthenticated=False,
                                        isActive=False,
                                        isAnonymous=False)
        sp_api.testing = True
        self.app = sp_api.appFactory()
        self.app.debug = True
        self.JWT = JWTManager(self.app)
        with self.app.appContext():
            self.access_token = create_access_token(identity='test')
        SPDB.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        self.route = '/v1/requirements'

    def tearDown(self):
        SPDB.spantry.drop_all_tables(with_all_data=True)

    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(0, len(rv.json))

    def test_get_missing_fields_returns_error(self):
        data = json.dumps(dict(ingredient="honey"))
        rv = self.client.get(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict(recipe="hot dogs"))
        rv = self.client.get(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    @db_session
    def test_get_empty_responds_one_item(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        commit()
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)

    @db_session
    def test_get_empty_request_responds_two_items(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        ing2 = SPDB.spantry.Ingredients(uid=user,
                                             name="salt",
                                             amount=5,
                                             amountPkg=5,
                                             amountMeasure="pinches",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing2,
                                         amount=1,
                                         recipe=recipe)
        commit()
        rv = self.client.get(self.route,data='{}',  headers=self.rH)
        item = rv.json
        self.assertEqual(2, len(item))

    @db_session
    def test_get_request_for_item_by_name(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        commit()
        # Get honey requirement for hot dogs
        req = json.dumps(dict(ingredient = 'honey',
                              recipe = 'hot dogs'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = rv.json
        self.assertEqual(item["ingredient"][1], "honey")

    def test_get_responds_404(self):
        user = sp_api.identify('test')
        req = json.dumps(dict(ingredient = 'testing',
                              recipe = 'testing' ))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    def test_post_empty_or_missing_field_returns_error(self):
        data = json.dumps(dict())
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.post(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( #name="honey",
                                amount=1,
                                amountPkg=10,
                                amountMeasure='cups',
                                keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                #amount=1,
                                amountPkg=10,
                                amountMeasure='cups',
                                keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                #amountPkg=10,
                                amountMeasure='cups',
                                keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                amountPkg=10,
                                #amountMeasure='cups',
                                keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                amountPkg=10,
                                amountMeasure='cups',
                                #keepStocked=True
                                ))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    @db_session
    def test_post_returns_created_and_creates(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        commit()
        data = json.dumps(dict(ingredient="honey",
                            recipe="hot dogs",
                            amount=1))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(201, rv.status_code)

    @db_session
    def test_post_duplicate_returns_409(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        data = json.dumps(dict(ingredient="honey",
                                recipe="hot dogs",
                                amount=1))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        data = json.dumps(dict(ingredient="honey",
                                recipe="hot dogs",
                                amount=1))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(409, rv.status_code)

    def test_put_empty_or_missing_request(self):
        data = json.dumps(dict())
        rv = self.client.put(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.put(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_put_missing_target_in_db_responds_404(self):
        data = json.dumps(dict(ingredient="honey",
                               recipe="hot dogs",
                               amount=2))
        rv = self.client.put(self.route, data=data, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    @db_session
    def test_put_all_fileds_can_modify_attributes(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        commit()
        data = json.dumps(dict(ingredient="honey",
                                amount=2,
                                recipe="hot dogs"))
        rv = self.client.put(self.route, data=data, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = SPDB.spantry.Requirements.get(ingredient=ing)
        self.assertEqual(2, item.amount)

    def test_delete_missing_target(self):
        data = json.dumps(dict())
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.delete(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_delete_responds_404(self):
        data = json.dumps(dict(ingredient="honey",
                               recipe="hot dogs"))
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    @db_session
    def test_delete_actually_removes_things(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                     name="hot dogs",
                                     instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        commit()
        data = json.dumps(dict(ingredient="honey",
                               recipe="hot dogs"))
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = SPDB.spantry.Requirements.get(ingredient=ing,
                                                    recipe=recipe)
        self.assertTrue( item is None )


class Requirements_search_route(unittest.TestCase):
    try:
        SPDB.spantry.bind('sqlite', ':memory:', create_db=True)
        SPDB.spantry.generate_mapping(create_tables=True)
    except pony.orm.core.BindingError:
        print("\n[INFO]: control_service_test says database already bound \n")

    def setUp(self):
        SPDB.spantry.create_tables()
        with db_session:
            SPDB.spantry.Users(username="test",
                                        pwHash="test",
                                        isAuthenticated=False,
                                        isActive=False,
                                        isAnonymous=False)
        sp_api.testing = True
        self.app = sp_api.app_factory()
        self.app.debug = True
        self.JWT = JWTManager(self.app)
        with self.app.app_context():
            self.access_token = create_access_token(identity='test')
        SPDB.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        self.route = '/v1/requirements/search'

    def tearDown(self):
        SPDB.spantry.drop_all_tables(with_all_data=True)


    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(0, len(rv.json))

    @db_session
    def test_get_empty_responds_one_item(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        commit()
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)

    @db_session
    def test_get_empty_request_responds_two_items(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        ing2 = SPDB.spantry.Ingredients(uid=user,
                                             name="salt",
                                             amount=5,
                                             amountPkg=5,
                                             amountMeasure="pinches",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing2,
                                         amount=1,
                                         recipe=recipe)
        commit()
        rv = self.client.get(self.route,data='{}',  headers=self.rH)
        self.assertEqual(2, len(rv.json))

    @db_session
    def test_get_request_for_item_by_name(self):
        user = sp_api.identify('test')
        ing = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        ing2 = SPDB.spantry.Ingredients(uid=user,
                                             name="salt",
                                             amount=5,
                                             amountPkg=5,
                                             amountMeasure="pinches",
                                             keepStocked=True)
        recipe = SPDB.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather")
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing,
                                         amount=1,
                                         recipe=recipe)
        SPDB.spantry.Requirements(uid=user,
                                         ingredient=ing2,
                                         amount=1,
                                         recipe=recipe)
        commit()
        # Get honey requirement for hot dogs
        req = json.dumps(dict(ingredient = 'honey'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(rv.json[0]["ingredient"][1], "honey")
        # Get all requirements for hot dogs
        req = json.dumps(dict(recipe = 'hot dogs'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(2, len(rv.json))



    def test_get_responds_404(self):
        user = sp_api.identify('test')
        req = json.dumps(dict(ingredient = 'testing'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertEqual(404, rv.status_code)
