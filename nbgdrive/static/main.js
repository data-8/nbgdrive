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
        /* Remove the link elements. */
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
                             .text('Submit Drive Key')
                             .click(function() {
                                var gdrive_auth_id = $("#nbgdrive-authentication").val();
                                $.post(utils.get_body_data('baseUrl') + 'gresponse', {message: gdrive_auth_id}, function(response) {

                                    $("#nbgdrive-display").remove();
                                    $("#nbgdrive-link").remove();
                                    $("#nbgdrive-button").remove(); 

                                    /* The key was valid and we have authenticated properly. */
                                    if (response.includes("User")) {

                                        $('#maintoolbar-container').append(
                                            $('<div>').attr('id', 'nbgdrive-display')
                                                    .addClass('btn-group')
                                                    .addClass('pull-right')
                                            .append(
                                                $('<strong>').attr('id', 'ngdrive-authenticated-result')
                                                             .text('User authenticated!')
                                            )
                                        );

                                        /* Alert user that they've successfully authenticated. */
                                        $( "#ngdrive-authenticated-result").fadeOut(4000);

                                        /* Add a button to allow to manually sync their Drive files. */
                                        createManualSyncButton();

                                        /* GET Request to alert Server to create a sync directory. */
                                        $.getJSON(utils.get_body_data('baseUrl') + 'gdrive', function(data) {
                                            var display = String(data['status']);
                                        });

                                        /* Start autosync function to background sync Google Drive. */
                                        setInterval(checkAutosyncTime, 1000 * 60);
                                    } else {
                                        $('#maintoolbar-container').append(
                                            $('<div>').attr('id', 'nbgdrive-display')
                                                    .addClass('btn-group')
                                                    .addClass('pull-right')
                                            .append(
                                                $('<strong>').attr('id', 'ngdrive-authenticated-result')
                                                             .text('Your key was incorrect. Please try again!')
                                            )
                                        );

                                        $("#ngdrive-authenticated-result").fadeOut(4000);
                                        setTimeout(displayDriveVerificationLink, 5000);
                                    }
                                });
                             })
            )
        );

        $('nbgdrive-authentication').after("      ");
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

    /* 
     *  Creates the button to manually sync Google Drive.
     */
    var createManualSyncButton = function () {
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
    }

    /* 
     *  Retrieves Drive verification link and displays it to the user.
     */
    var displayDriveVerificationLink = function () {
        $("#nbgdrive-display").remove();
        $("#nggdrive-authenticated-result").remove();

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
            } else {
                createManualSyncButton();
            }
        }); 
    }

    var load_ipython_extension = function () {
        displayDriveVerificationLink();      
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
