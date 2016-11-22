import os
import json
from notebook.utils import url_path_join 
from notebook.base.handlers import IPythonHandler

def make_gdrive_directory():
    os.system('STORED_DIR="data8/$JPY_USER" \
        && echo "Creating Google Drive Directory named $STORED_DIR." \
        && DIR_EXISTS="$(gdrive list | grep -i $STORED_DIR | wc -l)" \
        && [ $DIR_EXISTS -lt 1 ] && (RESULT=$(gdrive mkdir $STORED_DIR) && ID="$(echo $RESULT | cut -d " " -f 2)" && gdrive sync upload /home $ID) || echo "Directory already exists." \
        && LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)" \
        && gdrive sync upload /home $LOAD_DIRECTORY')

    return {
        # Placeholder until $.ajax can be used
        'status' : 'Done'
    }

def sync_gdrive_directory():
    os.system('STORED_DIR="data8/$JPY_USER" \
        && LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)" \
        && gdrive sync upload /home $LOAD_DIRECTORY \
        && echo "Syncing directory now."')

    return {
        'status' : 'Syncing'
    }

class SyncHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(sync_gdrive_directory()))

class DriveHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(make_gdrive_directory()))

def setup_handlers(web_app):
    dir_route_pattern = url_path_join(web_app.settings['base_url'], '/gdrive')
    sync_route_pattern = url_path_join(web_app.settings['base_url'], '/gsync')

    web_app.add_handlers('.*', [(dir_route_pattern, DriveHandler)])
    web_app.add_handlers('.*', [(dir_route_pattern, SyncHandler)])