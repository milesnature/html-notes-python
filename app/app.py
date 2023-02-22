from flask import Flask, request
import os
import json

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))


@app.route('/')
def notes_document():
    return app.send_static_file('index.html')


@app.route('/service-worker.js', methods=['GET'])
def service_worker():
    return app.send_static_file('service-worker.js')


@app.route('/manifest.json', methods=['GET'])
def manifest():
    return app.send_static_file('manifest.json')


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')


@app.route('/apple-touch-icon.png', methods=['GET'])
def apple_touch_icon():
    return app.send_static_file('apple-touch-icon.png')


@app.route('/get-dir', methods=['GET'])
def get_dir():
    if request.method == 'GET':
        directory = []
        try:
            mypath = os.path.join(basedir, 'static/notes/')
            if os.path.exists(mypath):
                for root, dirs, files in os.walk(mypath):
                    for file in files:
                        if file.endswith('.html') or file.endswith('.txt'):
                            directory.append('/' + os.path.join(root.replace(mypath, ''), file))
                if len(directory) > 0:
                    directory.sort()
                    return json.dumps(directory)
                else:
                    return {"Error": "This directory does not contain any html or txt files.", "Files": directory}, 404
            else:
                return {"Error": "This directory does not exist.", "Directory": mypath}, 404
        except Exception as e:
            return {"Error": e}, 500


@app.route('/save-note', methods=['POST'])
def save_note():
    if request.method == 'POST':
        try:
            url = request.form.get('url')
            content = request.form.get('content')
            app.logger.info(f"'url: '{url}, 'content: '{content}")
            if url is not None and content is not None:
                file = os.path.join(basedir, url)
                if os.path.exists(file):
                    with open(file, "w") as note:
                        note.write(content)
                        return 'Your note was saved!'
                else:
                    return {"Error": "File does not exist.", "file": url}, 400
            else:
                return {"Error": "One or more form values are missing.", "url": url, "content": content}, 400
        except Exception as e:
            return {"Error": e}, 500


if __name__ == '__main__':
    app.debug = True
    app.run()
