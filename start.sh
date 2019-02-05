#!/bin/bash

export FLASK_APP=stupid_pantry.py
export FLASK_ENV=development
export FLASK_DEBUG=true

flask run


# look into this
# virtualenv --no-site-packages --distribute .env && source .env/bin/activate && pip install -r requirements.tx
