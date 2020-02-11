#!/bin/python3

import json
import unittest
from pony.orm import *
from flask_jwt_extended import JWTManager, create_access_token
import sp_api
import sp_database
#test data

class User_route(unittest.TestCase):
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

    def tearDown(self):
        sp_database.spantry.drop_all_tables(with_all_data=True)

    def test_post_empty_or_missing_field_returns_error(self):
        data = json.dumps(dict())
        rv = self.client.post('/v1/users', data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.post('/v1/users', headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( #username="honey",
                                password='cups'
                                ))
        rv = self.client.post('/v1/users', data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        data = json.dumps(dict( username="honey"
                                #password='cups',
                                ))
        rv = self.client.post('/v1/inventory', data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)

    def test_post_returns_created_and_creates(self):
        data = json.dumps(dict(username="honey",
                               password='cups'))
        rv = self.client.post('/v1/users', data=data, headers=self.rH)
        self.assertEqual(201, rv.status_code)

    def test_post_duplicate_sends_409(self):
        data = json.dumps(dict(username="honey",
                               password='cups'))
        rv = self.client.post('/v1/users', data=data, headers=self.rH)
        data = json.dumps(dict(username="honey",
                               password='cups'))
        rv = self.client.post('/v1/users', data=data, headers=self.rH)
        self.assertEqual(409, rv.status_code)

    def test_delete_missing_target(self):
        data = json.dumps(dict())
        rv = self.client.delete('/v1/users', data=data, headers=self.rH)
        self.assertEqual(400, rv.status_code)
        rv = self.client.delete('/v1/users', headers=self.rH)
        self.assertEqual(400, rv.status_code)

    @db_session
    def test_delete_responds_404(self):
        sp_database.Users(username = "honey",
                            pwHash = "cats",
                            is_authenticated = False,
                            is_active = False,
                            is_anonymous = False)
        # This is a bit strange but I want to do the test on the recently
        # created user for this test and not the setUp fixture.
        # That requires I get an access token for this user and use it.
        with self.app.app_context():
            self.access_token = create_access_token(identity='honey')
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        # strangeness over
        data = json.dumps(dict(username="honey"))
        rv = self.client.delete('/v1/users', data=data, headers=self.rH)
        rv = self.client.delete('/v1/users', data=data, headers=self.rH)
        self.assertEqual(404, rv.status_code)

    @db_session
    def test_delete_actually_removes_things(self):
        sp_database.Users(username = "honey",
                            pwHash = "cats",
                            is_authenticated = False,
                            is_active = False,
                            is_anonymous = False)
        # This is a bit strange but I want to do the test on the recently
        # created user for this test and not the setUp fixture.
        # That requires I get an access token for this user and use it.
        with self.app.app_context():
            self.access_token = create_access_token(identity='honey')
        self.rH = {'Content-Type': 'application/json',
                   'Authorization': 'Bearer {}'.format(self.access_token)}
        # strangeness over
        data = json.dumps(dict(username="honey"))
        rv = self.client.delete('/v1/users', data=data, headers=self.rH)
        self.assertTrue(rv.status_code is 200)
        item = sp_database.spantry.Users.get(username="honey")
        self.assertTrue( item is None )
