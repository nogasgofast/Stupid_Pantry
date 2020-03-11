from spAPI import *

config = getConfig()
dbSetup(config)
app = appFactory()
app.debug = True
app.config['OCR_SERVICE'] = 'http://ocr:5000/uploader'
app.config['ASSETS_DEBUG'] = True
app.config['UPLOAD_FOLDER'] = r'static/images'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
jwt = JWTManager(app)
images = Images(app)
app.config['IMAGES_PATH'] = ['static/images']
limiter = Limiter(app,
                  key_func=get_remote_address,
                  default_limits=[])#"200 per day",
                                  #"50 per hour"])
if __name__ == "__main__":
    app.run()
