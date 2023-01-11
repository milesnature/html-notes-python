import os
from flask import Flask, request, render_template, send_from_directory

app = Flask(__name__)


@app.route('/')
def notes_document():
    return render_template('index.html')


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
