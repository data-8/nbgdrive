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
    function randomTest() {
         createManualSyncButton();
         createManualPullButton();
         createLogoutButton();
         createManualSyncButton();
         createManualPullButton();
         createLogoutButton();
         createManualSyncButton();
         createManualPullButton();
         createLogoutButton();
    }

    function createDisplayDiv() {
        /* Remove the link elements. */
        $("#nbgdrive-display").remove()
        $("#nbgdrive-link").remove()

        $('#notebook_toolbar').append(
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

                                        $('#notebook_toolbar').append(
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

                                        createButtonGroup();

                                        /* Add a button to allow to manually sync their Drive files. */
                                        createManualSyncButton();

                                        /* Add a button to allow pulling from gdrive. */
                                        createManualPullButton();

                                        /* Add a button to allow to logout from gdrive. */
                                        createLogoutButton();

                                        /* GET Request to alert Server to create a sync directory. */
                                        $.getJSON(utils.get_body_data('baseUrl') + 'createDrive', function(data) {
                                            var display = String(data['status']);
                                        });

                                    } else {
                                        $('#notebook_toolbar').append(
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
        $('#notebook_toolbar').append(
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
        console.log("Created sync button");

        $('#nbgdrive-button-group').prepend(
             $('<div>').addClass('btn-group').prepend(
                  '<button class="btn btn-xs btn-default" title="Sync with GDrive"><i class="fa-cloud fa"></i></button>'
             ).click(
                  syncDriveFiles
             )
        );
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
       console.log("Created logout button");

       $('#nbgdrive-button-group').prepend(
            $('<div>').addClass('btn-group').prepend(
                 '<button class="btn btn-xs btn-default" title="Logout from GDrive"><i class="fa-sign-out fa"></i></button>'
            ).click(
                 gdriveLogout
            )
       );
   }

   var gDrivePull = function() {
        $("#nbgdrive-display").remove()

        $('#notebook_toolbar').append(
            $('<div>').attr('id', 'nbgdrive-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<input>').attr('id', 'nbgdrive-pull-id')
                           .attr('type', 'text')
            ).append(
                $('<button>').attr('id', 'nbgdrive-pull-button')
                             .text('Download from GDrive Path')
                             .click(function() {
                                  var gdrive_pull_path = $("#nbgdrive-pull-id").val();
                                  var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");
                                  $.post(utils.get_body_data('baseUrl') + 'gdrivePull',
                                      {
                                          message: gdrive_pull_path,
                                          _xsrf: r ? r[1] : undefined
                                      },
                                      function(response) {
                                          console.log(response);
                                          if (response.includes("User")) {
                                               $('#notebook_toolbar').append(
                                                   $('<div>').attr('id', 'nbgdrive-display')
                                                           .addClass('btn-group')
                                                           .addClass('pull-right')
                                                   .append(
                                                      $('<strong>').attr('id', 'nbgdrive-pull-result')
                                                                   .text('Pulled from GDrive successfully!')
                                                   )
                                               );

                                               /* Alert user that they've successfully authenticated. */
                                               $("#nbgdrive-pull-result").fadeOut(4000);
                                          } else {
                                              $('#notebook_toolbar').append(
                                                  $('<div>').attr('id', 'nbgdrive-display')
                                                          .addClass('btn-group')
                                                          .addClass('pull-right')
                                                  .append(
                                                      $('<strong>').attr('id', 'nbgdrive-pull-result')
                                                                   .text('Your inputed path was incorrect. Please try again!')
                                                  )
                                              );

                                              $("#nbgdrive-pull-result").fadeOut(4000);
                                          }
                                      });
                             })
                        )
            );
   }

   var createManualPullButton = function () {
       console.log("Created gdrive pull button");

       $('#nbgdrive-button-group').prepend(
            $('<div>').addClass('btn-group').prepend(
                 '<button class="btn btn-xs btn-default" title="Pull from GDrive"><i class="fa-cloud-download fa"></i></button>'
            ).click(
                 gDrivePull
            )
       );
   }

   var createButtonGroup = function() {
        console.log("Created button group");

        $('#notebook_toolbar .pull-right').prepend($('<span>')).attr('id', 'nbgdrive-button-group');
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
                $('#notebook_toolbar').append(
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
                createButtonGroup();
                createManualSyncButton();
                createManualPullButton();
                createLogoutButton();
            }
        });
    }

    var load_ipython_extension = function () {
        displayDriveVerificationLink();
        // randomTest();
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
