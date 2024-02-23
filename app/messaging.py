def get_message(status='success', code='200', message='', data=''):
    return {'status': status, 'code': code, 'message': message, 'data': data}


ERROR_INVALID_FILE_TYPE = 'Only .html and .txt files are permitted.'
ERROR_INVALID_NAME = 'File and folder names must start with a letter.'
ERROR_INVALID_URL = 'Valid characters include <br>( <strong>A-Z a-z 0-9 . _ -</strong> ).'
ERROR_INPUT_IS_MISSING = 'Please enter a relative path and file name.'
ERROR_DELETE_INPUT_IS_MISSING = 'Please enter a relative path to a file or folder.'
ERROR_DELETE_ENTIRE_NOTES_FOLDER = 'This would delete the entire notes folder.'
ERROR_NOTES_FOLDER_EMPTY = 'This notes folder is missing, empty, or contains the wrong file types.'
ERROR_FILE_DOES_NOT_EXIST = 'File does not exist.'
ERROR_FILE_OR_DIRECTORY_DOES_NOT_EXIST = 'The file or folder does not exist.'
ERROR_DUPLICATE_FILES_NOT_PERMITTED = 'Duplicate. All file and folder names must be unique.'
ERROR_STRING_IS_OUT_OF_RANGE = 'string index out of range'
ERROR_UNKNOWN = 'Unknown error.'
ERROR_FILE_NOT_IN_REQUEST_FILES = 'File not in request files.'
ERROR_NO_FILE_SELECTED = 'No file selected.'
SUCCESS_GET_DIRECTORIES = 'The notes folders and files were successfully retrieved.'
SUCCESS_SAVED = 'Your note was saved.'
SUCCESS_NOTE_CREATED = 'Your note was created.'
SUCCESS_NOTE_DELETED = 'Your note was deleted.'
SUCCESS_DIRECTORY_AND_NOTES_DELETED = 'Your folder and all of its contents were deleted.'
SUCCESS_FILE_UPLOADED = 'Your file was uploaded.'
