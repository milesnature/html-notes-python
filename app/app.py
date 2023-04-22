from flask import Flask, request, render_template, make_response
import os
import shutil
import json
from app.config import config
from app.return_messaging import *
import app.utilities as utility
import app.validation as validation

app = Flask(__name__)
base_dir = utility.get_base_dir()

# ROUTES


@app.route('/')
def notes_document():
    return app.send_static_file('index.html')


@app.route('/config.js')
def notes_config():
    r = make_response(render_template('config.js', notes_dir=config['notes_dir'], is_demo=json.dumps(config['is_demo']), use_encryption=json.dumps(config['use_encryption'])))
    r.headers.set('content-type', 'application/javascript')
    return r


@app.route('/service-worker.js', methods=['GET'])
def service_worker():
    return app.send_static_file('service-worker.js')


@app.route('/manifest.json', methods=['GET'])
def manifest():
    return app.send_static_file('manifest.json')


@app.route('/get-dir', methods=['GET'])
def get_dir():
    if request.method == 'GET':
        try:
            notes_directories = utility.get_notes_directories()
            if len(notes_directories) > 0:
                return get_message("success", "200", SUCCESS_GET_DIRECTORIES, json.dumps(notes_directories)), 200
            else:
                return get_message('error', '404', ERROR_NOTES_FOLDER_EMPTY, str(notes_directories)), 404
        except Exception as e:
            return get_message('error', '500', 'get_dir', str(e)), 500


@app.route('/save-note', methods=['POST'])
def save_note():
    if request.method == 'POST':
        try:
            url = request.form.get('url')
            content = request.form.get('content')
            app.logger.debug(f'save_note() → {{ url: "{url}", content: "{content}" }}')
            if not any([url, content]):
                return get_message('error', '500', ERROR_INPUT_IS_MISSING, str(url)), 500
            if not validation.is_valid_file(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            file = os.path.join(base_dir, url)
            if os.path.exists(file):
                if not config['is_demo']:
                    with open(file, 'w') as note:
                        note.write(content)
                        return get_message('success', '200', SUCCESS_SAVED), 200
                else:
                    return get_message('success', '200', SUCCESS_SAVED), 200
            else:
                return get_message('error', '400', ERROR_FILE_DOES_NOT_EXIST, str(url)), 400
        except Exception as e:
            return get_message('error', '500', ERROR_UNKNOWN, str(e)), 500


@app.route('/create-note', methods=['POST'])
def create_note():
    if request.method == 'POST':
        try:
            url = str(request.form.get('url'))
            app.logger.debug(f'create-note() → {{ url: "{url}", len(url): "{len(url)}" }}')
            if not len(url) > 0:
                return get_message('error', '500', ERROR_INPUT_IS_MISSING, str(url)), 500
            if not validation.is_valid_url(url):
                return get_message('error', '400', ERROR_INVALID_URL, str(url)), 415
            if not validation.has_valid_names(url):
                return get_message('error', '400', ERROR_INVALID_NAME, str(url)), 415
            url = utility.remove_preceding_slash(url)
            absolute_url = utility.get_absolute_url(url)
            directory_only = utility.get_directory_only(url)
            if not validation.is_valid_file(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            if validation.has_duplicate(url, directory_only):
                return get_message('error', '400', ERROR_DUPLICATE_FILES_NOT_PERMITTED, str(url)), 400
            if not config['is_demo']:
                if not os.path.exists(directory_only):
                    os.makedirs(directory_only)
                if not os.path.exists(absolute_url):
                    with open(absolute_url, 'w') as f:
                        f.write('<section class="bkm__section">\n  <ul>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n  </ul>\n</section>\n<section class="note__section">\n  <h3></h3>\n    <ul>\n      <li></li>\n      <li></li>\n      <li></li>\n    </ul>\n</section>')
                        return get_message('success', '200', SUCCESS_NOTE_CREATED), 200
            else:
                return get_message('success', '200', SUCCESS_NOTE_CREATED), 200
        except Exception as e:
            return get_message('error', '500', ERROR_UNKNOWN, str(e)), 500


@app.route('/delete-note', methods=['POST'])
def delete_note():
    if request.method == 'POST':
        try:
            url = str(request.form.get('url'))
            app.logger.debug(f'delete_note() → {{ url: "{url}", len(url): "{len(url)}" }}')
            if not len(url) > 0:
                return get_message('error', '500', ERROR_DELETE_INPUT_IS_MISSING, str(url)), 500
            url = utility.remove_preceding_slash(url)
            if not validation.is_valid_url(url):
                return get_message('error', '400', ERROR_INVALID_URL, str(url)), 415
            if not validation.has_valid_names(url):
                return get_message('error', '400', ERROR_INVALID_NAME, str(url)), 415
            if len(url) > 0:
                if not config['is_demo']:
                    absolute_url = utility.get_absolute_url(url)
                    if os.path.exists(absolute_url) and os.path.isdir(absolute_url):
                        shutil.rmtree(absolute_url)
                        return get_message('success', '200', SUCCESS_DIRECTORY_AND_NOTES_DELETED), 200
                    elif os.path.exists(absolute_url) and os.path.isfile(absolute_url) and validation.is_valid_file(absolute_url):
                        os.remove(absolute_url)
                        return get_message('success', '200', SUCCESS_NOTE_DELETED), 200
                    else:
                        return get_message('error', '400', ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST, f'{url}, {absolute_url}'), 415
                else:
                    return get_message('success', '200', SUCCESS_NOTE_DELETED), 200
            else:
                return get_message('error', '500', ERROR_DELETE_ENTIRE_NOTES_FOLDER, str(url)), 500
        except Exception as e:
            return get_message('error', '500', ERROR_UNKNOWN, str(e)), 500


if __name__ == '__main__':
    app.debug = True
    app.run()
