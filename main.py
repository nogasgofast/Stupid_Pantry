from spAPI import *

config = getConfig()
dbSetup(config)
app = appFactory()
app = appSetup(app, config)
mail.init_app(app)
jwt = JWTManager(app)
images = Images(app)
#limiter = Limiter(app,
#                  key_func=get_remote_address,
#                  default_limits=[])#"200 per day",
                                  #"50 per hour"])
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=6000)
