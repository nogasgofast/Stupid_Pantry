#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import spAPI
import spDatabase
#test data

class View_catagories_route(unittest.TestCase):
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
        self.app = spAPI.app_factory()
        self.app.debug = True
        self.JWT = JWTManager(self.app)
        with self.app.app_context():
            self.access_token = create_access_token(identity='test')
        SPDB.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        self.route = '/v1/views/catagories'

    def tearDown(self):
        SPDB.spantry.drop_all_tables(with_all_data=True)

    def test_get_empty_request_responds_when_empty(self):
        rv = self.client.get(self.route, data='{}', headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        self.assertTrue(rv.json.get('ingredients') is 0)
        self.assertTrue(rv.json.get('recipes')     is 0)
        self.assertTrue(rv.json.get('shopping')    is 0)

    @db_session
    def test_get_empty_get_request_responds_one_item(self):
        user = sp_api.identify('test')
        item = SPDB.spantry.Ingredients(uid=user,
                                             name="honey",
                                             amount=1,
                                             amountPkg=10,
                                             amountMeasure="cups",
                                             keepStocked=True)
        item = SPDB.spantry.Recipes(uid=user,
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
        SPDB.spantry.Ingredients(uid=user,
                                         name="honey",
                                         amount=1,
                                         amountPkg=10,
                                         amountMeasure="cups",
                                         keepStocked=True)
        SPDB.spantry.Ingredients(uid=user,
                                         name="salt",
                                         amount=100,
                                         amountPkg=1000,
                                         amountMeasure="pinch",
                                         keepStocked=True)
        SPDB.spantry.Recipes(uid=user,
                                    name="hot dogs",
                                    instructions="put it togeather",
                                    )
        SPDB.spantry.Recipes(uid=user,
                                    name="cold dogs",
                                    instructions="put it togeather",
                                    )
        commit()
        rv = self.client.get(self.route,data='{}',  headers=self.rH)
        self.assertTrue(rv.json.get('ingredients') is 2)
        self.assertTrue(rv.json.get('recipes')     is 2)
        self.assertTrue(rv.json.get('shopping')    is 2)
