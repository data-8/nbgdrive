import os
import json
import requests
import urllib2
import tornado.httpclient
from notebook.utils import url_path_join 
from notebook.base.handlers import IPythonHandler

# This nbextension makes a few assumptions that may need to be handled at a later time.
# They are stated below:

# 1. When running on each singleuser, there is a config variable called JPY_USER with their unique identification
# 2. Users have pre-authenticated drive on that node
# 3. We will allow this extension to create a sync directory from the single user's home directory to data8/$JPY_USER
# 4. File deletes locally are not syncable to the sync directory, this is a bug we must fix

def make_gdrive_directory():
    os.system('STORED_DIR="data8/$JPY_USER" \
        && echo "Creating Google Drive Directory named $STORED_DIR." \
        && DIR_EXISTS="$(gdrive list | grep -i $STORED_DIR | wc -l)" \
        && [ $DIR_EXISTS -lt 1 ] && (RESULT=$(gdrive mkdir $STORED_DIR) && ID="$(echo $RESULT | cut -d " " -f 2)" && gdrive sync upload /home $ID) || echo "Directory already exists." \
        && LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)" \
        && gdrive sync upload /home $LOAD_DIRECTORY')

    return {
        # Placeholder until $.ajax can be used
        'status' : 'Creating Directory'
    }

def handle_response (response):
    if response.error:
        print "Error:", response.error
    else:
        print response.body

def sync_gdrive_directory():
    # os.system('STORED_DIR="data8/$JPY_USER" \
    #     && LOAD_DIRECTORY="$(gdrive list | grep -i $STORED_DIR | cut -c 1-28 | head -n 1)" \
    #     && gdrive sync upload /home $LOAD_DIRECTORY \
    #     && echo "Syncing directory now."')

    try:
        url = "http://localhost:8888/gresponse"
        req = tornado.httpclient.HTTPRequest(url, 'GET')
        client = tornado.httpclient.AsyncHTTPClient()
        res = client.fetch(req, handle_response)
    except:
        print "errored during request"

    return {
        'status' : 'Syncing'
    }

def read_argument (argument):
    print argument

class SyncHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(sync_gdrive_directory()))

class DriveHandler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(make_gdrive_directory()))

class ResponseHandler(IPythonHandler):

    def get(self):
        self.finish(json.dumps({'omg' : 'wtf'}))

    def post(self):
        # self.set_header("Content-Type", "text/plain")
        # self.write("This is not working")
        print self.get_body_argument("message")
        read_argument (self.get_body_argument("message"))
        self.finish("You wrote " + self.get_body_argument("message"))

def setup_handlers(web_app):
    dir_route_pattern = url_path_join(web_app.settings['base_url'], '/gdrive')
    sync_route_pattern = url_path_join(web_app.settings['base_url'], '/gsync')
    response_route_pattern = url_path_join(web_app.settings['base_url'], '/gresponse')

    web_app.add_handlers('.*', [
        (dir_route_pattern, DriveHandler),
        (sync_route_pattern, SyncHandler),
        (response_route_pattern, ResponseHandler)
    ])