from flask import Flask
import re
import os
import app.utilities as utility

app = Flask(__name__)


def is_valid_url(url):
    valid = True
    try:
        find_invalid_chars = re.compile(r'[^a-zA-Z0-9_./-]')
        invalid_characters = find_invalid_chars.finditer(url)
        for match in invalid_characters:
            if match:
                valid = False
    except Exception as e:
        app.logger.error('is_valid_url ' + str(e))
    app.logger.debug(f'is_valid_url() → {{ url: "{url}", valid: "{str(valid)}" }}')
    return valid


def is_valid_file(url):
    valid_file = False
    try:
        filename = utility.get_filename(url)
        ext = utility.get_file_extension(url)
        if filename and ext:
            valid_file = ext == 'html' or ext == 'txt'
    except Exception as e:
        app.logger.error('is_valid_file ' + str(e))
        return valid_file
    app.logger.debug(f'is_valid_file() → {{ url: "{url}", valid_file: "{str(valid_file)}" }}')
    return valid_file


def has_valid_names(url):
    valid_names = True
    app.logger.debug(f'has_valid_names(1) → {{ url: "{url}" }}')
    user_directory_names = utility.get_user_directory_names(url)
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
    names = utility.get_all_names(utility.get_notes_directories())
    user_file_name = url.split('/')[-1].split('.')[0]
    app.logger.debug(f'has_duplicate(1) → {{ url: "{url}", directory_only: "{directory_only}", names: "{str(names)}", user_file_name: "{user_file_name}" }}')
    user_directory_names = utility.get_user_directory_names(url) if not os.path.exists(directory_only) else []
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
        placeholder = utility.get_absolute_url('')[0:-1]
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
