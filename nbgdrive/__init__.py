from nbgdrive.handlers import setup_handlers
# Jupyter Extension points
def _jupyter_server_extension_paths():
    return [{
        'module': 'nbgdrive',
    }]

def _jupyter_nbextension_paths():
    return [{
        "section": "notebook",
        "dest": "nbgdrive/main.js",
        "src": "static/main.js",
        "require": "nbgdrive/main"
    },
    {
        "section":"tree",
        "src":"static/tree.js",
        "dest":"nbgdrive/tree.js",
        "require":"nbgdrive/tree"
    }]

def load_jupyter_server_extension(nbapp):
    setup_handlers(nbapp.web_app)
