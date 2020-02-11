#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import sp_api
import sp_database
#test data

class View_catagories_route(unittest.TestCase):
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
        self.route = '/v1/views/catagories'

    def tearDown(self):
        sp_database.spantry.drop_all_tables(with_all_data=True)

    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertTrue(rv.json.get('ingredients') is 0)
        self.assertTrue(rv.json.get('recipes')     is 0)
        self.assertTrue(rv.json.get('shopping')    is 0)

    @db_session
    def test_get_empty_get_request_responds_one_item(self):
        user = sp_api.identify('test')
        item = sp_database.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amount_pkg=10,
                                             amount_measure="cups",
                                             keep_stocked=True)
        item = sp_database.spantry.Recipes(uid=user,
                                             name="hot dogs",
                                             instructions="put it togeather",
                                             )
        commit()
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertTrue(rv.json.get('ingredients') is 1)
        self.assertTrue(rv.json.get('recipes')     is 1)
        self.assertTrue(rv.json.get('shopping')    is 1)

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
                                         amount=100,
                                         amount_pkg=1000,
                                         amount_measure="pinch",
                                         keep_stocked=True)
        sp_database.spantry.Recipes(uid=user,
                                    name="hot dogs",
                                    instructions="put it togeather",
                                    )
        sp_database.spantry.Recipes(uid=user,
                                    name="cold dogs",
                                    instructions="put it togeather",
                                    )
        commit()
        rv = self.client.get(self.route,data='{}',  headers=self.rH)
        self.assertTrue(rv.json.get('ingredients') is 2)
        self.assertTrue(rv.json.get('recipes')     is 2)
        self.assertTrue(rv.json.get('shopping')    is 2)
