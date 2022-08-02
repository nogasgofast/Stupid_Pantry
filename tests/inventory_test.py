#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import spAPI
import spDatabase

#test data

class Inventory_route(unittest.TestCase):
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
        with self.app.app_context():
            self.access_token = create_access_token(identity='test')
        SPDB.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        self.route = '/v1/inventory'

    def tearDown(self):
        SPDB.spantry.drop_all_tables(with_all_data=True)

    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(0, len(rv.json))

    @db_session
    def test_get_empty_get_request_responds_one_item(self):
        user = sp_api.identify('test')
        item = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        commit()
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)

    @db_session
    def test_get_request_for_item_by_name(self):
        user = sp_api.identify('test')
        SPDB.spantry.Ingredients(uid=user,
                                     name="honey",
                                     amount=1,
                                     amountPkg=10,
                                     amountMeasure="cups",
                                     keepStocked=True)
        commit()
        req = json.dumps(dict(name = 'honey'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = rv.json
        self.assertEqual(item["name"], "honey")

    @db_session
    def test_get_empty_request_responds_two_items(self):
        user = sp_api.identify('test')
        SPDB.spantry.Ingredients(uid=user,
                                         name="honey",
                                         amount=1,
                                         amountPkg=10,
                                         amountMeasure="cups",
                                         keepStocked=True)
        SPDB.spantry.Ingredients(uid=user,
                                         name="salt",
                                         amount=1,
                                         amountPkg=1000,
                                         amountMeasure="pinch",
                                         keepStocked=True)
        commit()
        rv = self.client.get(self.route,data='{}',  headers=self.rH)
        item = rv.json
        self.assertEqual(2, len(item))

    def test_get_responds_404(self):
        user = sp_api.identify('test')
        req = json.dumps(dict(name = 'testing'))
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

    def test_post_returns_created_and_creates(self):
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amountPkg=10,
                               amountMeasure='cups',
                               keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(201, rv.status_code)

    def test_post_duplicate_returns_409(self):
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amountPkg=10,
                               amountMeasure='cups',
                               keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amountPkg=10,
                               amountMeasure='cups',
                               keepStocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(409, rv.status_code)

    def test_put_empty_or_missing_request(self):
        rv = self.client.put(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict())
        rv = self.client.put(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_put_missing_target_in_db_responds_404(self):
        data = json.dumps(dict(name="honey"))
        rv = self.client.put(self.route, data=data, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    @db_session
    def test_put_all_fileds_can_modify_attributes(self):
        user = sp_api.identify('test')
        SPDB.spantry.Ingredients(uid=user,
                                        name="honey",
                                        amount=1,
                                        amountPkg=10,
                                        amountMeasure="cups",
                                        keepStocked=True)
        commit()
        data = json.dumps(dict(name="honey",
                               amount=2,
                               amountPkg=20,
                               amountMeasure='sinks',
                               keepStocked=False))
        rv = self.client.put(self.route, data=data, headers=self.rH)
        item = SPDB.spantry.Ingredients.get(name="honey")
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(2, item.amount)
        self.assertEqual(20, item.amountPkg)
        self.assertEqual('sinks', item.amountMeasure)
        self.assertEqual(False, item.keepStocked)

    def test_delete_missing_target(self):
        data = json.dumps(dict())
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.delete(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_delete_responds_404(self):
        data = json.dumps(dict(name="honey"))
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    @db_session
    def test_delete_actually_removes_things(self):
        user = sp_api.identify('test')
        SPDB.spantry.Ingredients(uid=user,
                                        name="honey",
                                        amount=1,
                                        amountPkg=10,
                                        amountMeasure="cups",
                                        keepStocked=True)
        commit()
        data = json.dumps(dict(name="honey"))
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = SPDB.spantry.Ingredients.get(name="honey")
        self.assertTrue( item is None )
