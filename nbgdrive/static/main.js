define([
    'jquery',
    'base/js/utils',
    'base/js/namespace'
], function (
    $, utils, Jupyter
) {
    /*
     *  Updates the Jupyter notebook display to handle the initial Drive authentication.
     */
    function createDisplayDiv() {
        $("#nbgdrive-display").remove()
        $("#nbgdrive-link").remove()

        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbgdrive-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<input>').attr('id', 'nbgdrive-authentication')
                           .attr('type', 'text')
            ).append(
                $('<button>').attr('id', 'nbgdrive-button')
                             .text('Submit')
                             .click(function() {
                                var gdrive_auth_id = $("#nbgdrive-authentication").val();
                                $.post(utils.get_body_data('baseUrl') + 'gresponse', {message: gdrive_auth_id}, function(response) {
                                    if (response.includes("User")) {
                                        // If we authenticate properly, create the sync directory and set up 
                                        // the autosync handler. 
                                        $("#nbgdrive-display").remove();
                                        $("#nbgdrive-link").remove();
                                        $("#nbgdrive-button").remove();

                                        $.getJSON(utils.get_body_data('baseUrl') + 'gdrive', function(data) {
                                            var display = String(data['status']);
                                        });
                                        setInterval(checkAutosyncTime, 1000 * 60);
                                    }
                                });
                             })
            )
        );
    }

    /* 
     *  Makes a GET request to trigger the manual sync of the current directory 
     *  to a pre-established Google Drive Sync Directory. 
     */
    var syncDriveFiles = function () {
        $.getJSON(utils.get_body_data('baseUrl') + 'gsync', function(data) {
            var display = String(data['status']);
            console.log ("Current text: " + display);
        });
    }

    /* 
     *  Periodically checks the system clock, syncing files at 3 AM. 
     */
    var checkAutosyncTime = function () {
        var date = new Date();
        if (date.getHours() === 3  && date.getMinutes() === 0) {
            syncDriveFiles();
        }
    }

    /* 
     *  Takes in a string URL and opens it in a new tab
     */
    var openAuthenticationInNewTab = function (url) {
        var win = window.open(url, '_blank');
        win.focus();
    }

    var load_ipython_extension = function () {
        $.getJSON(utils.get_body_data('baseUrl') + 'gresponse', function(data) {
            var display = String(data['authentication'])

            if (display !== "authenticated") {
                $('#maintoolbar-container').append(
                        $('<div>').attr('id', 'nbgdrive-display')
                                  .addClass('btn-group')
                                  .addClass('pull-right')
                        .append(
                            $('<button>').attr('id', 'nbgdrive-link')
                                         .text('Verify Drive')
                                         .click(function() {
                                            openAuthenticationInNewTab(display);
                                            createDisplayDiv()
                                         })
                        )
                    );
            }
        });

        var action = {
            icon: 'fa-cloud', // a font-awesome class used on buttons, etc
            help    : 'Manually syncs the home directory with Google Drive',
            help_index : 'zz',
            handler : syncDriveFiles
        }

        var prefix = 'gsync_extension';
        var action_name = 'show-alert';

        var full_action_name = Jupyter.actions.register(action, name, prefix); // returns 'my_extension:show-alert'
        Jupyter.toolbar.add_buttons_group([full_action_name]);        
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
