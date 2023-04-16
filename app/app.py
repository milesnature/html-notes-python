from flask import Flask, request, render_template, make_response
import os
import shutil
import json
import re
from app.py.config import config
from app.py.return_messaging import *

app = Flask(__name__)
basedir = str(os.path.abspath(os.path.dirname(__file__)))

# METHODS


def get_notes_directories():
    notes_directories = []
    my_path = os.path.join(basedir, config['notes_dir'])
    if os.path.exists(my_path):
        for root, dirs, files in os.walk(my_path):
            for file in files:
                if is_valid_file(file):
                    notes_directories.append('/' + os.path.join(root.replace(my_path, ''), file))
    notes_directories.sort()
    app.logger.debug(f'get_notes_directories() → {{ notes_directories: "{str(notes_directories)}" }}')
    return tuple(notes_directories)


def get_all_names(paths):
    all_names = []
    for path in paths:
        path = remove_preceding_slash(path)
        names = path.split('.')[0].split('/')
        for name in names:
            all_names.append(name)
    app.logger.debug(f'get_all_names() → {{ all_names: "{str(all_names)}" }}')
    return tuple(all_names)


def get_absolute_url(url):
    absolute_url = os.path.join(basedir, config['notes_dir'] + url)
    app.logger.debug(f'get_absolute_url() → {{ url: "{url}", absolute_url: "{absolute_url}" }}')
    return absolute_url


def valid_url(url):
    valid = True
    try:
        find_invalid_chars = re.compile(r'[^a-zA-Z0-9_./-]')
        invalid_characters = find_invalid_chars.finditer(url)
        for match in invalid_characters:
            if match:
                valid = False
    except Exception as e:
        app.logger.error('valid_url ' + str(e))
    app.logger.debug(f'valid_url() → {{ url: "{url}", valid: "{str(valid)}" }}')
    return valid


def remove_preceding_slash(url):
    updated_url = url
    try:
        if url[0] == '/':
            updated_url = url[1:]
    except Exception as e:
        app.logger.error('remove_preceding_slash ' + str(e))
    app.logger.debug(f'remove_preceding_slash() → {{ url: "{url}", updated_url: "{updated_url}" }}')
    return updated_url


def get_directory_only(url):
    dirlist = url.split('/')
    directory_only = os.path.join(basedir, config['notes_dir'] + '/'.join(map(str, dirlist[:-1])))
    app.logger.debug(f'get_directory_only() → {{ url: "{url}", directory_only: "{directory_only}" }}')
    return directory_only


def get_filename(url):
    filename = url
    try:
        has_directories = url.count('/') > 0
        if has_directories:
            filename = url.split('/')[-1]
    except Exception as e:
        app.logger.error('get_filename ' + str(e))
    filename = filename.split('.')[0:len(filename)-1]
    app.logger.debug(f'get_filename() → {{ url: "{url}", filename: "{filename}" }}')
    return filename


def get_file_extension(file):
    ext = ''
    try:
        has_period = file.count('.') > 0
        if has_period:
            ext = file.split('.')[-1]
    except Exception as e:
        app.logger.error('get_file_extension ' + str(e))
    app.logger.debug(f'get_file_extension() → {{ file: "{file}", ext: "{ext}" }}')
    return ext


def is_valid_file(url):
    valid_file = False
    try:
        filename = get_filename(url)
        ext = get_file_extension(url)
        if filename and ext:
            valid_file = ext == 'html' or ext == 'txt'
    except Exception as e:
        app.logger.error('is_valid_file ' + str(e))
    app.logger.debug(f'is_valid_file() → {{ url: "{url}", valid_file: "{str(valid_file)}" }}')
    return valid_file


def get_user_directory_names(url):
    names = url.split('/')
    index_of_file_name = len(names) - 1
    app.logger.debug(f'get_user_directory_names(1) → {{ url: "{url}", names[0]: "{str(names[0])}", index_of_file_name: "{str(index_of_file_name)}" }}')
    file_name = names[index_of_file_name].split('.')[0]
    app.logger.debug(f'get_user_directory_names(2) → {{ file_name: "{file_name}" }}')
    names[index_of_file_name] = file_name
    app.logger.debug(f'get_user_directory_names(3) → {{ names[index_of_file_name]: "{str(names[index_of_file_name])}", names: "{str(names)}" }}')
    return names


def has_valid_names(url):
    valid_names = True
    app.logger.debug(f'has_valid_names(1) → {{ url: "{url}" }}')
    user_directory_names = get_user_directory_names(url)
    app.logger.debug(f'has_valid_names(2) → {{ user_directory_names: "{str(user_directory_names)}", len(user_directory_names): "{str(len(user_directory_names))}" }}')
    if len(user_directory_names) > 0:
        for name in user_directory_names:
            if not name == '':
                if not name[0].isalpha():
                    app.logger.debug(f'has_valid_names(3) → {{ name[0]: "{name[0]}", isalpha: "{name[0].isalpha()}" }}')
                    valid_names = False
            else:
                valid_names = False
    else:
        valid_names = False
    app.logger.debug(f'has_valid_names(4) → {{ valid_names: "{str(valid_names)}" }}')
    return valid_names


def has_duplicate(url, directory_only):
    names = get_all_names(get_notes_directories())
    user_file_name = url.split('/')[-1].split('.')[0]
    app.logger.debug(f'has_duplicate(1) → {{ url: "{url}", directory_only: "{directory_only}", names: "{str(names)}", user_file_name: "{user_file_name}" }}')
    user_directory_names = get_user_directory_names(url) if not os.path.exists(directory_only) else []
    # Check url against itself
    duplicates = [name for name in user_directory_names if user_directory_names.count(name) > 1]
    if len(duplicates) > 0:
        app.logger.debug(f'has_duplicate(2) → {{ duplicates: "{str(duplicates)}" }}')
        return True
    # Files are always checked against all current directory and file names.
    if user_file_name:
        for name in names:
            if name == user_file_name:
                app.logger.debug(f'has_duplicate(3) → {{ name: "{name}", user_file_name: "{user_file_name}" }}')
                return True
    # Check for duplicate directories.
    if len(user_directory_names) > 1:
        new_user_directory_names = user_directory_names[0:-1]
        placeholder = get_absolute_url('')[0:-1]
        # Incrementally reconstruct the url, starting from the base, from left to right.
        for directory in new_user_directory_names:
            placeholder = placeholder + '/' + directory
            # Test the existence of each directory.
            if not os.path.exists(placeholder):
                # New directories are checked against all directory and file names.
                for name in names:
                    if name == directory:
                        app.logger.debug(f'has_duplicate(4) → {{ name: "{name}", user_file_name: "{directory}" }}')
                        return True
    app.logger.debug(f'has_duplicate(5) → False')
    return False


def is_missing(data):
    return data is None


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
            notes_directories = get_notes_directories()
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
            if not is_valid_file(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            file = os.path.join(basedir, url)
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
            if not valid_url(url):
                return get_message('error', '400', ERROR_INVALID_URL, str(url)), 415
            if not has_valid_names(url):
                return get_message('error', '400', ERROR_INVALID_NAME, str(url)), 415
            url = remove_preceding_slash(url)
            absolute_url = get_absolute_url(url)
            directory_only = get_directory_only(url)
            if not is_valid_file(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            if has_duplicate(url, directory_only):
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
            url = remove_preceding_slash(url)
            if not valid_url(url):
                return get_message('error', '400', ERROR_INVALID_URL, str(url)), 415
            if not has_valid_names(url):
                return get_message('error', '400', ERROR_INVALID_NAME, str(url)), 415
            if len(url) > 0:
                if not config['is_demo']:
                    absolute_url = get_absolute_url(url)
                    if os.path.exists(absolute_url) and os.path.isdir(absolute_url):
                        shutil.rmtree(absolute_url)
                        return get_message('success', '200', SUCCESS_DIRECTORY_AND_NOTES_DELETED), 200
                    elif os.path.exists(absolute_url) and os.path.isfile(absolute_url) and is_valid_file(absolute_url):
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
