from flask import Flask
import os
from app.config import config
import app.validation as validation

app = Flask(__name__)
base_dir = str(os.path.abspath(os.path.dirname(__file__)))


def get_base_dir():
    app.logger.debug(f'get_base_dir() → {{ base_dir: "{base_dir}" }}')
    return base_dir


def get_filename(url):
    filename = url
    app.logger.debug(f'get_filename(1) → {{ url: "{url}", filename: "{filename}" }}')
    try:
        has_directories = url.count('/') > 0
        if has_directories:
            filename = url.split('/')[-1]
    except Exception as e:
        app.logger.error('get_filename ' + str(e))
    filename = filename.split('.')[0:len(filename)-1]
    app.logger.debug(f'get_filename(2) → {{ url: "{url}", filename: "{filename}" }}')
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


def get_notes_directories():
    notes_directories = []
    my_path = os.path.join(base_dir, config['notes_dir'])
    app.logger.debug(f'get_notes_directories(1) → {{ my_path: "{my_path}", base_dir: "{str(base_dir)}" }}')
    if os.path.exists(my_path):
        for root, dirs, files in os.walk(my_path):
            for file in files:
                if validation.is_valid_file(file):
                    notes_directories.append('/' + os.path.join(root.replace(my_path, ''), file))
    notes_directories.sort()
    app.logger.debug(f'get_notes_directories(2) → {{ notes_directories: "{str(notes_directories)}" }}')
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
    absolute_url = os.path.join(base_dir, config['notes_dir'] + url)
    app.logger.debug(f'get_absolute_url() → {{ url: "{url}", absolute_url: "{absolute_url}" }}')
    return absolute_url


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
    directory_only = os.path.join(base_dir, config['notes_dir'] + '/'.join(map(str, dirlist[:-1])))
    app.logger.debug(f'get_directory_only() → {{ url: "{url}", directory_only: "{directory_only}" }}')
    return directory_only


def get_user_directory_names(url):
    names = url.split('/')
    index_of_file_name = len(names) - 1
    app.logger.debug(f'get_user_directory_names(1) → {{ url: "{url}", names[0]: "{str(names[0])}", index_of_file_name: "{str(index_of_file_name)}" }}')
    file_name = names[index_of_file_name].split('.')[0]
    app.logger.debug(f'get_user_directory_names(2) → {{ file_name: "{file_name}" }}')
    names[index_of_file_name] = file_name
    app.logger.debug(f'get_user_directory_names(3) → {{ names[index_of_file_name]: "{str(names[index_of_file_name])}", names: "{str(names)}" }}')
    return names
