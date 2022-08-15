from spAPI import *
from werkzeug.middleware.proxy_fix import ProxyFix


config = getConfig()
dbSetup(config)
app = appFactory()
app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)
app = appSetup(app, config)
mail.init_app(app)
jwt = JWTManager(app)
images = Images(app)

#limiter = Limiter(app,
#                  key_func=get_remote_address,
#                  default_limits=[])#"200 per day",
                                  #"50 per hour"])
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
