#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import (JWTManager,
                                create_access_token,
                                create_refresh_token )
import sp_api
import sp_database
from passlib.context import CryptContext
myctx = CryptContext(schemes="sha256_crypt",
                     sha256_crypt__min_rounds=131072)
#test data

class Auth_route(unittest.TestCase):
    try:
        sp_database.spantry.bind('sqlite', ':memory:', create_db=True)
        sp_database.spantry.generate_mapping(create_tables=True)
    except pony.orm.core.BindingError:
        print("\n[INFO]: control_service_test says database already bound \n")
    def setUp(self):

        sp_database.spantry.create_tables()
        with db_session:
            sp_database.spantry.Users(username="test",
                                    pwHash=myctx.hash("test"),
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
        self.route = '/v1/auth'

    def tearDown(self):
        sp_database.spantry.drop_all_tables(with_all_data=True)

    def test_post_empty_or_missing_field_returns_error(self):
        data = json.dumps(dict())
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.post(self.route, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( #username="honey",
                                password="cups"))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( username="honey"
                                #password="cups"
                                ))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_post_returns_created_and_creates(self):
        data = json.dumps(dict(username="test",
                               password="test"))
        rv = self.client.post(self.route, data=data, headers=self.rH)
        self.assertEqual(200, rv.status_code)
        self.assertTrue( 'access_token' in rv.json )

class Auth_refresh_route(unittest.TestCase):
    try:
        sp_database.spantry.bind('sqlite', ':memory:', create_db=True)
        sp_database.spantry.generate_mapping(create_tables=True)
    except pony.orm.core.BindingError:
        print("\n[INFO]: control_service_test says database already bound \n")
    def setUp(self):
        sp_database.spantry.create_tables()
        with db_session:
            sp_database.spantry.Users(username="test",
                                    pwHash=myctx.hash("test"),
                                    is_authenticated=False,
                                    is_active=False,
                                    is_anonymous=False)
        sp_api.testing = True
        self.app = sp_api.app_factory()
        self.app.debug = True
        self.JWT = JWTManager(self.app)
        with self.app.app_context():
            self.access_token = create_access_token(identity='test')
            self.refresh_token = create_refresh_token(identity='test')
        sp_database.spantry.create_tables()
        self.client = self.app.test_client()
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.refresh_token)}
        self.route = '/v1/auth/refresh'

    def tearDown(self):
        sp_database.spantry.drop_all_tables(with_all_data=True)

    def test_post_empty_or_missing_field_returns_error(self):
        # Check what happens when we don't set a good jwt_refresh_token
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        rv = self.client.post(self.route, headers=self.rH)
        self.assertEqual(422, rv.status_code)

    def test_post_returns_created_and_creates(self):
        rv = self.client.post(self.route, headers=self.rH)
        self.assertEqual(200, rv.status_code)
        self.assertTrue( 'access_token' in rv.json )
