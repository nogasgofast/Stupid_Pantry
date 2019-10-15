#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import sp_api
import sp_database
#test data

class Inventory_route(unittest.TestCase):
    try:
        sp_database.spantry.bind('sqlite', ':memory:', create_db=True)
        sp_database.spantry.generate_mapping(create_tables=True)
    except pony.orm.core.BindingError:
        print("\n[INFO]: control_service_test says database already bound \n")

    def setUp(self):
        sp_database.spantry.create_tables()
        with db_session:
            sp_database.spantry.Users(username="test",
                                        pwHash="test",
                                        is_authenticated=False,
                                        is_active=False,
                                        is_anonymous=False)
        sp_api.testing = True
        self.app = sp_api.app_factory()
        self.app.debug = True
        self.JWT = JWTManager(self.app)
        with self.app.app_context():
            self.access_token = create_access_token(identity='test')
        sp_database.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        self.route = '/v1/inventory'

    def tearDown(self):
        sp_database.spantry.drop_all_tables(with_all_data=True)

    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(0, len(rv.json))

    @db_session
    def test_get_empty_get_request_responds_one_item(self):
        user = sp_api.identify('test')
        item = sp_database.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amount_pkg=10,
                                             amount_measure="cups",
                                             keep_stocked=True)
        commit()
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)

    @db_session
    def test_get_request_for_item_by_name(self):
        user = sp_api.identify('test')
        sp_database.spantry.Ingredients(uid=user,
                                     name="honey",
                                     amount=1,
                                     amount_pkg=10,
                                     amount_measure="cups",
                                     keep_stocked=True)
        commit()
        req = json.dumps(dict(name = 'honey'))
        rv = self.client.get(self.route,data=req, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = rv.json
        self.assertEqual(item["name"], "honey")

    @db_session
    def test_get_empty_request_responds_two_items(self):
        user = sp_api.identify('test')
        sp_database.spantry.Ingredients(uid=user,
                                         name="honey",
                                         amount=1,
                                         amount_pkg=10,
                                         amount_measure="cups",
                                         keep_stocked=True)
        sp_database.spantry.Ingredients(uid=user,
                                         name="salt",
                                         amount=1,
                                         amount_pkg=1000,
                                         amount_measure="pinch",
                                         keep_stocked=True)
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
                                amount_pkg=10,
                                amount_measure='cups',
                                keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                #amount=1,
                                amount_pkg=10,
                                amount_measure='cups',
                                keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                #amount_pkg=10,
                                amount_measure='cups',
                                keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                amount_pkg=10,
                                #amount_measure='cups',
                                keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( name="honey",
                                amount=1,
                                amount_pkg=10,
                                amount_measure='cups',
                                #keep_stocked=True
                                ))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_post_returns_created_and_creates(self):
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amount_pkg=10,
                               amount_measure='cups',
                               keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(201, rv.status_code)

    def test_post_duplicate_returns_409(self):
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amount_pkg=10,
                               amount_measure='cups',
                               keep_stocked=True))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        data = json.dumps(dict(name="honey",
                               amount=1,
                               amount_pkg=10,
                               amount_measure='cups',
                               keep_stocked=True))
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
        sp_database.spantry.Ingredients(uid=user,
                                        name="honey",
                                        amount=1,
                                        amount_pkg=10,
                                        amount_measure="cups",
                                        keep_stocked=True)
        commit()
        data = json.dumps(dict(name="honey",
                               amount=2,
                               amount_pkg=20,
                               amount_measure='sinks',
                               keep_stocked=False))
        rv = self.client.put(self.route, data=data, headers=self.rH)
        item = sp_database.spantry.Ingredients.get(name="honey")
        self.assertTrue(rv.status_code is 200)
        self.assertEqual(2, item.amount)
        self.assertEqual(20, item.amount_pkg)
        self.assertEqual('sinks', item.amount_measure)
        self.assertEqual(False, item.keep_stocked)

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
        sp_database.spantry.Ingredients(uid=user,
                                        name="honey",
                                        amount=1,
                                        amount_pkg=10,
                                        amount_measure="cups",
                                        keep_stocked=True)
        commit()
        data = json.dumps(dict(name="honey"))
        rv = self.client.delete(self.route, data=data, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = sp_database.spantry.Ingredients.get(name="honey")
        self.assertTrue( item is None )
