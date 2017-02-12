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
                                var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");
                                $.post(utils.get_body_data('baseUrl') + 'authenticateDrive',
                                    {
                                        message: gdrive_auth_id,
                                        _xsrf: r ? r[1] : undefined
                                    },
                                    function(response) {

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
                                        $.getJSON(utils.get_body_data('baseUrl') + 'createDrive', function(data) {
                                            var display = String(data['status']);
                                        });

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
        $.getJSON(utils.get_body_data('baseUrl') + 'syncDrive', function(data) {
            var display = String(data['status']);
            console.log ("Current text: " + display);
        });
    }

    /*
     *  Check if it is time to sync files by comparing the current time to the time 
     *  our files were synced and syncing if it has been more than 24 hours.
     */
    var checkIfReadyToSync = function () {
        var date = new Date();
        $.getJSON(utils.get_body_data('baseUrl') + 'checkLastSyncTime', function(data) {
            var lastSyncTime = String(data['last_sync_date']);
            var currentDate = date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString() + "-" + date.getDate().toString();
            console.log(lastSyncTime);
            console.log(currentDate);
            if (currentDate !== lastSyncTime) {
                // Time to sync
                console.log("Synced");
                syncDriveFiles();
            }
        });
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

        $.getJSON(utils.get_body_data('baseUrl') + 'authenticateDrive', function(data) {
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
                // The user has authenticated, check to see if it is time to sync
                checkIfReadyToSync();
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
