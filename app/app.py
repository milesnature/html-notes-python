import os
from app import app
from flask import Flask, request, render_template, send_from_directory
# from flask_httpauth import HTTPBasicAuth
# from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# basicAuth = HTTPBasicAuth()

# users = {
#     "maitaipan": generate_password_hash("Repaint!Gigahertz!Crook")
# }

# @basicAuth.verify_password
# def verify_password(username, password):
#     if username in users and \
#             check_password_hash(users.get(username), password):
#         return username


# def verify_password(username, password):
#     if username in users:
#         return check_password_hash(users.get(username), password)
#     return False


@app.route('/')
# @basicAuth.login_required
def notes_document():
    return render_template('index.html')

#
# @app.route('/static/notes/<path:subpath>')
# @basicAuth.login_required
# def protect_notes(subpath=None):
#     return send_file(request.path)


@app.route('/service-worker.js', methods=['GET'])
def service_worker():
    return app.send_static_file('service-worker.js')


@app.route('/manifest.json', methods=['GET'])
def manifest():
    return app.send_static_file('manifest.json')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/apple-touch-icon.png', methods=['GET'])
def apple_touch_icon():
    return app.send_static_file('apple-touch-icon.png')


@app.route('/save-note', methods=['POST'])
# @basicAuth.login_required
def save_note():
    if request.method == 'POST':
        url = request.form.get('url')
        content = request.form.get('content')
        app.logger.info(f"'url: '{url}, 'content: '{content}")
        with open('app/'+url, "w") as note:
            note.write(content)
            return 'Save note successful.'


if __name__ == '__main__':
    app.debug = True
    app.run()
