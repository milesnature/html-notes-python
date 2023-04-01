from flask import Flask, request
import os
import shutil
import json
import re

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
notesdir = 'static/notes/'


def get_message(status='success', code='200', message='', data=''):
    return {'status': status, 'code': code, 'message': message, 'data': data}


def get_notes_directories():
    notes_directories = []
    mypath = os.path.join(basedir, notesdir)
    if os.path.exists(mypath):
        for root, dirs, files in os.walk(mypath):
            for file in files:
                if is_valid_file_type(file):
                    notes_directories.append('/' + os.path.join(root.replace(mypath, ''), file))
    notes_directories.sort()
    return tuple(notes_directories)


def get_all_names(paths):
    all_names = []
    for path in paths:
        path = remove_preceding_slash(path)
        names = path.split('.')[0].split('/')
        for name in names:
            all_names.append(name)
    return tuple(all_names)


def get_absolute_url(url):
    absolute_url = os.path.join(basedir, notesdir + url)
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
        app.logger.info('valid_url ' + str(e))
    return valid


def remove_preceding_slash(url):
    updated_url = url
    try:
        if url[0] == '/':
            updated_url = url[1:]
    except Exception as e:
        app.logger.info('remove_preceding_slash ' + str(e))
    return updated_url


def get_directory_only(url):
    dirlist = url.split('/')
    directory_only = os.path.join(basedir, notesdir + '/'.join(map(str, dirlist[:-1])))
    return directory_only


def get_filename(url):
    filename = url
    try:
        has_directories = url.count('/') > 0
        if has_directories:
            filename = url.split('/')[-1]
    except Exception as e:
        app.logger.info('get_filename ' + str(e))
    return filename.split('.')[0]


def get_file_extension(file):
    ext = ''
    try:
        has_period = file.count('.') == 1
        if has_period:
            ext = file.split('.')[1]
    except Exception as e:
        app.logger.info('get_file_extension ' + str(e))
    return ext


def is_valid_file_type(url):
    valid_file_type = False
    try:
        filename = get_filename(url)
        ext = get_file_extension(url)
        if filename and ext:
            valid_file_type = ext == 'html' or ext == 'txt'
    except Exception as e:
        app.logger.info('is_valid_file_type ' + str(e))
    return valid_file_type


def has_duplicate(url, directory_only):

    names = get_all_names(get_notes_directories())
    user_file = url.split('.')[0].split('/')[-1]
    user_directory = url.split('.')[0].split('/') if not os.path.exists(directory_only) else []

    # Check url against itself
    duplicates = [name for name in user_directory if user_directory.count(name) > 1]
    if len(duplicates) > 0:
        app.logger.info(duplicates)
        return True

    # Files are always checked against all current directory and file names.
    if user_file:
        for name in names:
            if name == user_file:
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
                for name in names:
                    if name == directory:
                        return True
    return False


def is_missing(data):
    return data is None


ERROR_INVALID_FILE_TYPE = 'Invalid file type. Only html and txt files are permitted.'
ERROR_INVALID_URL = 'Invalid character. Please use letters, numbers, underscores, dashes, periods, and forward slashes only.'
ERROR_INPUT_IS_MISSING = 'Please enter a relative path and file name.'
ERROR_DELETE_INPUT_IS_MISSING = 'Please enter a relative path to a file or folder.'
ERROR_DELETE_ENTIRE_NOTES_FOLDER = 'This would delete the entire notes folder.'
ERROR_NOTES_FOLDER_EMPTY = 'This notes folder is missing, empty, or contains the wrong file types.'
ERROR_FILE_DOES_NOT_EXIST = 'File does not exist.'
ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST = 'The file or folder does not exist.'
ERROR_DUPLICATE_FILES_NOT_PERMITTED = 'Duplicate. All file and folder names must be unique.'
ERROR_STRING_IS_OUT_OF_RANGE = 'string index out of range'
ERROR_UNKNOWN = 'Unknown error.'

SUCCESS_GET_DIRECTORIES = 'The notes folders and files were successfully retrieved.'
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
            if not any([url, content]):
                return get_message('error', '500', ERROR_INPUT_IS_MISSING, str(url)), 500
            if not is_valid_file_type(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            file = os.path.join(basedir, url)
            if os.path.exists(file):
                with open(file, 'w') as note:
                    note.write(content)
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
            if not len(url) > 0:
                return get_message('error', '500', ERROR_INPUT_IS_MISSING, str(url)), 500
            if not valid_url(url):
                return get_message('error', '400', ERROR_INVALID_URL, str(url)), 415
            url = remove_preceding_slash(url)
            absolute_url = get_absolute_url(url)
            directory_only = get_directory_only(url)
            if not is_valid_file_type(url):
                return get_message('error', '400', ERROR_INVALID_FILE_TYPE, str(url)), 415
            if has_duplicate(url, directory_only):
                return get_message('error', '400', ERROR_DUPLICATE_FILES_NOT_PERMITTED, str(url)), 400
            if not os.path.exists(directory_only):
                os.makedirs(directory_only)
            if not os.path.exists(absolute_url):
                with open(absolute_url, 'w') as f:
                    f.write('<section class="bkm__section">\n  <ul>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n    <li><a href="" target="_blank" rel="noreferrer"></a></li>\n  </ul>\n</section>\n<section class="note__section">\n  <h3></h3>\n    <ul>\n      <li></li>\n      <li></li>\n      <li></li>\n    </ul>\n</section>')
                    return get_message('success', '200', SUCCESS_NOTE_CREATED), 200
        except Exception as e:
            return get_message('error', '500', ERROR_UNKNOWN, str(e)), 500


@app.route('/delete-note', methods=['POST'])
def delete_note():
    if request.method == 'POST':
        try:
            url = str(request.form.get('url'))
            if not len(url) > 0:
                return get_message('error', '500', ERROR_DELETE_INPUT_IS_MISSING, str(url)), 500
            url = remove_preceding_slash(url)
            if len(url) > 0:
                absolute_url = get_absolute_url(url)
                if os.path.exists(absolute_url) and os.path.isdir(absolute_url):
                    shutil.rmtree(absolute_url)
                    return get_message('success', '200', SUCCESS_DIRECTORY_AND_NOTES_DELETED), 200
                elif os.path.exists(absolute_url) and os.path.isfile(absolute_url) and is_valid_file_type(absolute_url):
                    os.remove(absolute_url)
                    return get_message('success', '200', SUCCESS_NOTE_DELETED), 200
                else:
                    return get_message('error', '400', ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST, f'{url}, {absolute_url}'), 415
            else:
                return get_message('error', '500', ERROR_DELETE_ENTIRE_NOTES_FOLDER, str(url)), 500
        except Exception as e:
            return get_message('error', '500', ERROR_UNKNOWN, str(e)), 500


if __name__ == '__main__':
    app.debug = True
    app.run()
