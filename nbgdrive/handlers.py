import json, sys
from subprocess import Popen, PIPE
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

DRIVE_MAX_SIZE = 1000
SYNC_DIRECTORY = "/home/jovyan"
DEFAULT_SYNC_NAME = "Jupyter/Nbgdrive"

def create_sync_directory():
    """
     Creates a gdrive sync directory in Google Drive and initializes the syncing process by performing the first sync.
     The first sync is different compared to every subsequent sync given that the gdrive directory ID must be retrieved.
     TODO: Give feedback that during this step it is already syncing and/or prevent user from syncing manually
     TODO: Try to abstract away the idea of the first sync being different from the others
    """
    create_dir_status = 'Could not create Sync Directory'

    if _user_is_authenticated():
        command = 'SYNC_DIR_FILE=".syncdirectory.txt"; \
                    if [ -e  "$SYNC_DIR_FILE" ]; then \
                    STORED_DIR=$(<.syncdirectory.txt); \
                    else STORED_DIR={}; \
                    fi; \
                    echo "Creating Google Drive Directory named $STORED_DIR."; \
                    (RESULT=$(gdrive mkdir $STORED_DIR) && ID="$(echo $RESULT | cut -d " " -f 2)" && gdrive sync upload {} $ID) || echo "Directory already exists.";' \
                    .format(DEFAULT_SYNC_NAME, SYNC_DIRECTORY)
        p = Popen(command, stdout=PIPE, shell=True)
        output, err = p.communicate()
        create_dir_status = 'Successfully created Drive directory!' if not err else create_dir_status

    return {
        'status': create_dir_status
    }


def logout_from_gdrive():
    """Revoke gdrive permissions"""
    logout_status = 'Unable to log out from Jupyter Google Drive Sync'
    command = 'SYNC_DIR_FILE=".syncdirectory.txt"; \
                if [ -e  "$SYNC_DIR_FILE" ]; then \
                find .syncdirectory.txt -delete; \
                else echo "No .syncdirectory file to delete"; \
                fi; \
              find ~/.gdrive -name \*.json -delete'
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    logout_status = 'Success' if not err else logout_status

    return {
        'status': logout_status
    }


def check_gdrive_authenticated():
    """Returns gdrive authentication status"""
    drive_authentication_url = "authenticated" if _user_is_authenticated() else _get_gdrive_auth_url()

    return {
        'authentication': drive_authentication_url
    }


def authenticate_gdrive_user(auth_code):
    """Authenticates gdrive user"""
    p = Popen(['gdrive', 'about'], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = p.communicate(auth_code)
    return output


def check_gdrive_last_sync_time():
    """Returns the time of the last sync"""
    lastSyncTime = ''

    command = 'SYNC_DIR_FILE=".syncdirectory.txt"; \
                if [ -e  "$SYNC_DIR_FILE" ]; then \
                STORED_DIR=$(<.syncdirectory.txt); \
                else STORED_DIR={}; \
                fi; \
                LOAD_DIRECTORY="$(gdrive list -m {} | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
                gdrive info $LOAD_DIRECTORY | grep "Modified" | cut -c 11-20'.format(DEFAULT_SYNC_NAME, DRIVE_MAX_SIZE)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()

    try:
        lastSyncTime = str(output, 'utf-8').split('\n')[0]
    except Exception:
        pass

    return {
        'lastSyncTime': lastSyncTime
    }

def sync_gdrive_directory():
    """Syncs local files to Google Drive sync folder"""
    sync_status = 'Could not sync data to Google Drive'

    if not _remote_sync_directory_exists():
        create_sync_directory()

    command = 'SYNC_DIR_FILE=".syncdirectory.txt"; \
                if [ -e  "$SYNC_DIR_FILE" ]; then \
                STORED_DIR=$(<.syncdirectory.txt); \
                else STORED_DIR={}; \
                fi; \
                LOAD_DIRECTORY="$(gdrive list -m {} | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
                gdrive sync upload {} $LOAD_DIRECTORY; \
                echo "Syncing directory now."'.format(DEFAULT_SYNC_NAME, DRIVE_MAX_SIZE, SYNC_DIRECTORY)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    sync_status = 'Successfully synced data to Google Drive' if not err else sync_status

    return {
        'status': sync_status
    }


def set_sync_folder(param):
    """Creates hidden file that contains id of Google Drive sync folder"""
    param = "_".join(param.split())  # Substitutes whitespace with underscores
    command = 'echo {} > .syncdirectory.txt'.format(param)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()

    return {
        'status': 'success'
    }


def _remote_sync_directory_exists():
    """Checks to make sure remote sync drive folder exists"""
    command = 'SYNC_DIR_FILE=".syncdirectory.txt"; \
                if [ -e  "$SYNC_DIR_FILE" ]; then \
                STORED_DIR=$(<.syncdirectory.txt); \
                else STORED_DIR={}; \
                fi; \
                LOAD_DIRECTORY="$(gdrive list -m {} | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
                if [ -z "$LOAD_DIRECTORY" ]; \
                    then echo "Remote directory not found"; \
                else echo "Found remote directory"; \
                fi'.format(DEFAULT_SYNC_NAME, DRIVE_MAX_SIZE)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    return True if "Found remote directory" in output.decode("utf-8") else False


def _get_gdrive_auth_url():
    """Returns the URL for the user to authenticate iff user needs to authenticate"""
    auth_url_or_status = ''
    p = Popen(['gdrive', 'about'], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = p.communicate('')

    # This is the only part of the response we are interested in
    try:
        auth_url_or_status = str(output, 'utf-8').split('\n')[2]
    except Exception:
        pass

    return auth_url_or_status


def _user_is_authenticated():
    """Checks if user is authenticated"""
    return False if 'http' in _get_gdrive_auth_url() else True


def pull_from_gdrive(pull_id):
    """Pulls the directory associated with the path from user's gdrive"""
    try:
        gdrive_folders = pull_id.split('/')
        dir_ids = _gdrive_puller(gdrive_folders, "root")
        if dir_ids[0] == 'error':
            return {
                'status': 'error',
                'message': 'directory does not exist'
            }
        for d in dir_ids:
            command = 'gdrive download -r ' + d
            p = Popen(command, stdout=PIPE, shell=True)
            output, err = p.communicate()
        return {
            'status': 'success'
        }
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        return {
            'status': 'error',
            'message': str(e) + str(exc_tb.tb_lineno)
        }


def _gdrive_puller(pull_folders, parent):
    gdrive_name = pull_folders[0]
    command = "gdrive list -m {} -q 'trashed = false and \
            mimeType = \"application/vnd.google-apps.folder\" \
            and name = \"" + gdrive_name + "\" and \
            \"" + parent + "\" in parents' | sed -n '2,$p' | awk '{print $1}'".format(DRIVE_MAX_SIZE)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    folders = str(output, 'utf-8').splitlines()

    if len(folders) == 0:
        return ['error']
    elif len(pull_folders) == 1:
        ids = []
        for f in folders:
            ids.append(f)
        return ids
    else:
        results = []
        for f in folders:
            pulled_dir = _gdrive_puller(pull_folders[1:], f)
            for d in pulled_dir:
                results.append(d)
        if all([x == 'error' for x in results]):
            return ['error']
        else:
            return [x for x in results if x != 'error']


class SyncHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(sync_gdrive_directory()))


class DriveHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(create_sync_directory()))


class ResponseHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(check_gdrive_authenticated()))

    def post(self):
        success = authenticate_gdrive_user(self.get_body_argument("message").encode('utf-8'))
        self.finish(success)


class LastSyncHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(check_gdrive_last_sync_time()))


class LogoutHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(logout_from_gdrive()))


class PullHandler(IPythonHandler):
    def post(self):
        success = pull_from_gdrive(self.get_body_argument("message"))
        self.finish(json.dumps(success))


class SetFolderHandler(IPythonHandler):
    def post(self):
        success = set_sync_folder(self.get_body_argument("message"))
        self.finish(success)


def setup_handlers(web_app):
    dir_route_pattern = url_path_join(web_app.settings['base_url'], '/createDrive')
    sync_route_pattern = url_path_join(web_app.settings['base_url'], '/syncDrive')
    response_route_pattern = url_path_join(web_app.settings['base_url'], '/authenticateDrive')
    last_sync_route_pattern = url_path_join(web_app.settings['base_url'], '/lastSyncTime')
    logout_route_pattern = url_path_join(web_app.settings['base_url'], '/gdriveLogout')
    pull_route_pattern = url_path_join(web_app.settings['base_url'], '/gdrivePull')
    set_folder_pattern = url_path_join(web_app.settings['base_url'], '/setGDriveFolder')

    web_app.add_handlers('.*', [
        (dir_route_pattern, DriveHandler),
        (sync_route_pattern, SyncHandler),
        (response_route_pattern, ResponseHandler),
        (last_sync_route_pattern, LastSyncHandler),
        (pull_route_pattern, PullHandler),
        (logout_route_pattern, LogoutHandler),
        (set_folder_pattern, SetFolderHandler)
    ])
