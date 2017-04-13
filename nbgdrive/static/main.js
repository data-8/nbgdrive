

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
                                                $('<strong>').attr('id', 'nbgdrive-authenticated-result')
                                                             .text('User authenticated!')
                                            )
                                        );

                                        /* Alert user that they've successfully authenticated. */
                                        $("#nbgdrive-authenticated-result").fadeOut(4000);

                                        /* Add a button to allow to manually sync their Drive files. */
                                        createManualSyncButton();

                                        /* Add a button to allow to logout from gdrive. */
                                        createLogoutButton();

                                        /* GET Request to alert Server to create a sync directory. */
                                        var path = 'data9/micah'
                                        var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");

                                        $.post(utils.get_body_data('baseUrl') + 'setGDriveFolder',
                                            {
                                            message: path,
                                            _xsrf: r ? r[1] : undefined
                                            },
                                            function(response) {});

                                        $.getJSON(utils.get_body_data('baseUrl') + 'createDrive', function(data) {
                                            var display = String(data['status']);
                                        });

                                    } else {
                                        $('#maintoolbar-container').append(
                                            $('<div>').attr('id', 'nbgdrive-display')
                                                    .addClass('btn-group')
                                                    .addClass('pull-right')
                                            .append(
                                                $('<strong>').attr('id', 'nbgdrive-authenticated-result')
                                                             .text('Your key was incorrect. Please try again!')
                                            )
                                        );

                                        $("#nbgdrive-authenticated-result").fadeOut(4000);
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
        $("#nbgdrive-display").remove();

        // Let user know that their sync has started
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbgdrive-display')
                    .addClass('btn-group')
                    .addClass('pull-right')
            .append(
                $('<strong>').attr('id', 'nbgdrive-authenticated-result')
                             .text('Syncing to Google Drive...')
            )
        );

        $.getJSON(utils.get_body_data('baseUrl') + 'syncDrive', function(data) {
            var display = String(data['status']);
            console.log ("Sync status: " + display);

            // Alert user if their sync was successful or not when result received
            if (display.includes("Successfully")) {
                display = "Sync successful!";
            } else {
                display = "Sync unsuccessful: Please try reauthenticating!";
            }

            $('#nbgdrive-authenticated-result').text(display);
            $("#nbgdrive-authenticated-result").fadeOut(4000);
        });
    }

    /*
     *  Check if it is time to sync files by comparing the current time to the time
     *  our files were synced and syncing if it has been more than 24 hours.
     */
    var checkIfReadyToSync = function () {
        $.getJSON(utils.get_body_data('baseUrl') + 'lastSyncTime', function(data) {
            var date = new Date();
            var lastSyncTime = String(data['lastSyncTime']);
            var date_components = [date.getFullYear().toString(), "-", (date.getMonth() + 1).toString(), "-", date.getDate().toString()]

            // Add a 0 in front of single digit months to match the date string
            if (date.getMonth() < 10) {
                date_components.splice(2, 0, "0");
            }

            var currentDate = date_components.join("");

            if (currentDate !== lastSyncTime) {
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

    var gdriveLogout = function () {

        $.getJSON(utils.get_body_data('baseUrl') + 'gdriveLogout', function(data) {
            var display = String(data['status']);

            // Alert user if their sync was successful or not when result received
            if (display.includes("success")) {
                display = "Logout successful!";
            } else {
                display = "Logout unsuccessful";
            }

            $('#nbgdrive-authenticated-result').text(display);
            $("#nbgdrive-authenticated-result").fadeOut(4000);
            location.reload();
        });
    }

    var createLogoutButton = function () {
        var action = {
            icon: 'fa-sign-out', // a font-awesome class used on buttons, etc
            help    : 'Logout from Google Drive Sync',
            help_index : 'zz',
            handler : gdriveLogout
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
                checkIfReadyToSync();
                createManualSyncButton();
                createLogoutButton();
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
