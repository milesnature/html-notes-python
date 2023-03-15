from flask import Flask, request
import os
import shutil
import json
import re

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))


def get_response(status='success', code='200', message='', data=''):
    return '{"status": "' + status + '", "code": "' + code + '", "message": "' + message + '", "data": "' + data + '"}'


def get_notes_directories():
    notes_directories = []
    mypath = os.path.join(basedir, 'static/notes/')
    if os.path.exists(mypath):
        for root, dirs, files in os.walk(mypath):
            for file in files:
                if is_valid_file_type(file):
                    notes_directories.append('/' + os.path.join(root.replace(mypath, ''), file))
    return notes_directories


def get_absolute_url(url):
    absolute_url = os.path.join(basedir, 'static/notes/' + url)
    return absolute_url


def sanitize_url(url):
    # This check is for the first character. It's just the tip of the iceberg.
    cleanurl = url if re.sub(r'[\W_]+', '', url[0]) else url[1:]
    return cleanurl


def get_directory_only(url):
    dirlist = url.split('/')
    directory_only = os.path.join(basedir, 'static/notes/' + '/'.join(map(str, dirlist[:-1])))
    return directory_only


def is_valid_file_type(file):
    return file.endswith('.html') or file.endswith('.txt')


def has_duplicate(url, directory_only):

    notes = get_notes_directories()
    user_file = url.split('.')[0].split('/')[-1]
    user_directory = url.split('.')[0].split('/') if not os.path.exists(directory_only) else []

    # Files are always checked against all current directory and file names.
    for note in notes:
        note = sanitize_url(note)
        note_components = note.split('.')[0].split('/')
        for note_component in note_components:
            app.logger.info(note_component + ' | ' + user_file)
            if note_component == user_file:
                return True

    # Check for duplicate directories.
    if len(user_directory) > 1:
        new_user_directory = user_directory[0:-1]
        placeholder = get_absolute_url('')[0:-1]
        # Incrementally reconstruct the url, starting from the base, from left to right.
        for directory in new_user_directory:
            placeholder = placeholder + '/' + directory
            # Test the existence of each directory.
            if not os.path.exists(placeholder):
                # New directories are checked against all directory and file names.
                for note in notes:
                    note = sanitize_url(note)
                    note_components = note.split('.')[0].split('/')
                    for note_component in note_components:
                        if note_component == directory:
                            return True

    return False


def is_missing(data):
    return data is None


ERROR_INVALID_FILE_TYPE = 'Invalid file type. Only html and txt files are permitted.'
ERROR_INPUT_IS_MISSING = 'Please enter a relative path and file name.'
ERROR_DELETE_INPUT_IS_MISSING = 'Please enter a relative path to a file or folder.'
ERROR_NOTES_FOLDER_EMPTY = 'This notes folder is empty or missing.'
ERROR_FILE_DOES_NOT_EXIST = 'File does not exist.'
ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST = 'The file or folder does not exist.'
ERROR_DUPLICATE_FILES_NOT_PERMITTED = 'Duplicate. All file and folder names must be unique.'
ERROR_STRING_IS_OUT_OF_RANGE = 'string index out of range'
ERROR_UNKNOWN = 'Unknown error.'

SUCCESS_SAVED = 'Your note was saved.'
SUCCESS_NOTE_CREATED = 'Your note was created.'
SUCCESS_NOTE_DELETED = 'Your note was deleted.'
SUCCESS_DIRECTORY_AND_NOTES_DELETED = 'Your folder and all of its contents were deleted.'


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
        try:
            notes_directories = get_notes_directories()
            if len(notes_directories) > 0:
                notes_directories.sort()
                return json.dumps(notes_directories)
            else:
                return get_response('error', '404', ERROR_NOTES_FOLDER_EMPTY, str(notes_directories)), 404
        except Exception as e:
            return get_response('error', '500', 'get_dir', str(e)), 500


@app.route('/save-note', methods=['POST'])
def save_note():
    if request.method == 'POST':
        try:
            url = request.form.get('url')
            content = request.form.get('content')
            if not is_valid_file_type(url):
                return get_response('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            file = os.path.join(basedir, url)
            if os.path.exists(file):
                with open(file, 'w') as note:
                    note.write(content)
                    return get_response('success', '200', SUCCESS_SAVED), 200
            else:
                return get_response('error', '400', ERROR_FILE_DOES_NOT_EXIST, str(url)), 400
        except Exception as e:
            message = ERROR_INPUT_IS_MISSING if str(e) == ERROR_STRING_IS_OUT_OF_RANGE else ERROR_UNKNOWN
            return get_response('error', '500', message, str(e)), 500


@app.route('/create-note', methods=['POST'])
def create_note():
    if request.method == 'POST':
        try:
            url = str(request.form.get('url'))
            url = sanitize_url(url)
            absolute_url = get_absolute_url(url)
            directory_only = get_directory_only(url)
            if not is_valid_file_type(url):
                return get_response('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            if has_duplicate(url, directory_only):
                return get_response('error', '400', ERROR_DUPLICATE_FILES_NOT_PERMITTED, str(url)), 400
            if not os.path.exists(directory_only):
                os.makedirs(directory_only)
            if not os.path.exists(absolute_url):
                with open(absolute_url, 'w') as f:
                    f.write('<section class="bkm__section">\n  <ul>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n  </ul>\n</section>\n<section class="note__section">\n  <h3></h3>\n    <ul>\n      <li></li>\n      <li></li>\n      <li></li>\n    </ul>\n</section>')
                    return get_response('success', '200', SUCCESS_NOTE_CREATED ), 200
        except Exception as e:
            message = ERROR_INPUT_IS_MISSING if str(e) == ERROR_STRING_IS_OUT_OF_RANGE else ERROR_UNKNOWN
            return get_response('error', '500', message, str(e)), 500


@app.route('/delete-note', methods=['POST'])
def delete_note():
    if request.method == 'POST':
        try:
            url = str(request.form.get('url'))
            url = sanitize_url(url)
            absolute_url = get_absolute_url(url)
            if os.path.exists(absolute_url) and os.path.isdir(absolute_url):
                shutil.rmtree(absolute_url)
                return get_response('success', '200', SUCCESS_DIRECTORY_AND_NOTES_DELETED), 200
            elif os.path.exists(absolute_url) and os.path.isfile(absolute_url) and is_valid_file_type(absolute_url):
                os.remove(absolute_url)
                return get_response('success', '200', SUCCESS_NOTE_DELETED), 200
            else:
                return get_response('error', '400', ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST, f'{url}, {absolute_url}'), 415
        except Exception as e:
            message = ERROR_DELETE_INPUT_IS_MISSING if str(e) == ERROR_STRING_IS_OUT_OF_RANGE else ERROR_UNKNOWN
            return get_response('error', '500', message, str(e)), 500


if __name__ == '__main__':
    app.debug = True
    app.run()
