import json
from subprocess import Popen, PIPE
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

# This nbextension makes a few assumptions that may need to be handled at a later time.
# They are stated below:

# 1. When running on each singleuser, there is a non-empty config variable called JPY_USER with their unique identification
# 2. We will allow this extension to create a sync directory from the single user's home directory to data8/$JPY_USER
# 3. File deleted locally are not syncable to the sync directory, this is a bug we must fix
# 4. The /home directory contains just one folder, called `jovyan`, which is the standard student working directory

SYNC_DIRECTORY = "/home/jovyan"


def create_sync_directory():
    """
     Creates a gdrive sync directory in Google Drive and initializes the syncing process by performing the first sync.
     The first sync is different compared to every subsequent sync given that the gdrive directory ID must be retrieved.

     TODO: Give feedback that during this step it is already syncing and/or prevent user from syncing manually
     TODO: Try to abstract away the idea of the first sync being different from the others
    """
    sync_status = 'Could not create sync Directory.'

    if _user_is_authenticated():
        command = 'STORED_DIR="data8/$JPY_USER"; \
                    echo "Creating Google Drive Directory named $STORED_DIR."; \
                    (RESULT=$(gdrive mkdir $STORED_DIR) && ID="$(echo $RESULT | cut -d " " -f 2)" && gdrive sync upload {} $ID) || echo "Directory already exists.";'\
                    .format(SYNC_DIRECTORY)
        p = Popen(command, stdout=PIPE, shell=True)
        output, err = p.communicate()
        sync_status = 'Successfully created Sync Directory'

    return {
        'status': sync_status
    }


def sync_gdrive_directory():
    """Syncs local files to Google Drive sync folder"""
    sync_status = 'Could not sync data to Google Drive'

    if not _remote_sync_directory_exists():
        create_sync_directory()

    command = 'STORED_DIR="data8/$JPY_USER"; \
                LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
                gdrive sync upload {} $LOAD_DIRECTORY; \
                echo "Syncing directory now."'.format(SYNC_DIRECTORY)
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    sync_status = 'Successfully synced data to Google Drive'

    return {
        'status': sync_status
    }

def logout_from_gdrive():
    """Revoke gdrive permissions"""
    command = 'find ~/.gdrive -name \*.json -delete'
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()

    return {
        'status': 'success'
    }

def check_gdrive_authenticated():
    """Returns gdrive authentication status"""
    if _user_is_authenticated():
        drive_authentication_url = "authenticated"
    else:
        drive_authentication_url = _get_gdrive_auth_url()

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
    lastSyncTime = "Drive has never been synced"

    command = 'STORED_DIR="data8/$JPY_USER"; \
               LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
               gdrive info $LOAD_DIRECTORY | grep "Modified" | cut -c 11-20'
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    lastSyncTime = str(output, 'utf-8').split('\n')[0]

    return {
        'lastSyncTime': lastSyncTime
    }


def _remote_sync_directory_exists():
    """Checks to make sure remote sync drive folder exists"""
    command = 'STORED_DIR="data8/$JPY_USER"; \
                LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)"; \
                if [ -z "$LOAD_DIRECTORY" ]; \
                then echo "Remote directory not found"; \
                else echo "Found remote directory"; \
                fi'
    p = Popen(command, stdout=PIPE, shell=True)
    output, err = p.communicate()
    return True if "Found remote directory" in output.decode("utf-8") else False


def _user_is_authenticated():
    """Checks if user is authenticated"""
    cleaned_response = _get_gdrive_auth_url()

    # If there is a URL in the response, the user still has to authenticate
    return False if 'http' in cleaned_response else True


def _get_gdrive_auth_url():
    """Returns the URL for the user to authenticate iff user needs to authenticate"""
    p = Popen(['gdrive', 'about'], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = p.communicate('')

    # This is the only part of the response we are interested in
    cleaned_response = str(output, 'utf-8').split('\n')[2]
    return cleaned_response


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


def setup_handlers(web_app):
    dir_route_pattern = url_path_join(web_app.settings['base_url'], '/createDrive')
    sync_route_pattern = url_path_join(web_app.settings['base_url'], '/syncDrive')
    response_route_pattern = url_path_join(web_app.settings['base_url'], '/authenticateDrive')
    last_sync_route_pattern = url_path_join(web_app.settings['base_url'], '/lastSyncTime')
    logout_route_pattern = url_path_join(web_app.settings['base_url'], '/gdriveLogout')

    web_app.add_handlers('.*', [
        (dir_route_pattern, DriveHandler),
        (sync_route_pattern, SyncHandler),
        (response_route_pattern, ResponseHandler),
        (last_sync_route_pattern, LastSyncHandler),
        (logout_route_pattern, LogoutHandler)
    ])
