You can save the unnecessary space in your repo and still deploy to a new server in a single command: virtualenv --no-site-packages --distribute .env && source .env/bin/activate && pip install -r requirements.txt