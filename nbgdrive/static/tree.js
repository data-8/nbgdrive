define([
    'jquery',
    'base/js/utils',
    'base/js/namespace'
], function (
    $, utils, Jupyter
) {
    /*
     *  Makes a GET request to trigger the manual sync of the current directory
     *  to a pre-established Google Drive Sync Directory.
     */
    var syncDriveFiles = function () {
        $('#nbgdrive-button-group').prepend(
          $('<div>').addClass('btn-group').prepend(
              $('<strong>').attr('id', 'nbgdrive-authenticated-result')
                .css('margin-right', '15px').text('Syncing to Drive...')
          )
        );

        $.getJSON(utils.get_body_data('baseUrl') + 'syncDrive', function(data) {
            var display = String(data['status']);
            console.log ("Sync status: " + display);

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
                  '<button class="btn btn-xs btn-default" title="Sync to Google Drive"><i class="fa-cloud fa"></i></button>'
             ).click(
                  syncDriveFiles
             )
        );
    }

   var gdriveLogout = function () {
       $.getJSON(utils.get_body_data('baseUrl') + 'gdriveLogout', function(data) {
           var display = String(data['status']);

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
                 '<button class="btn btn-xs btn-default" title="Logout from Google Drive"><i class="fa-sign-out fa"></i></button>'
            ).click(
                 gdriveLogout
            )
       );
    }

    var gDrivePull = function() {
        $('#nbgdrive-pull-button').remove();

        $('#nbgdrive-button-group').prepend(
            $('<div>').addClass('btn-group').attr('id', 'nbgdrive-pull-submission-button').prepend(
              '<button class="btn btn-xs btn-default" title="Submit Google Drive Pull Path"><i class="fa fa-sign-in"></i></button>'
            ).click(function () {
                  var gdrive_pull_path = $("#nbgdrive-pull-id").val();
                  var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");
                  $.post(utils.get_body_data('baseUrl') + 'gdrivePull',
                      {
                          message: gdrive_pull_path,
                          _xsrf: r ? r[1] : undefined
                      },
                      function(response) {
                          $("#nbgdrive-pull-id").remove()
                          $("#nbgdrive-pull-submission-button").remove()

                          createManualPullButton();

                          console.log(JSON.stringify(response));
                          if (!response.includes('error')) {
                              $('#nbgdrive-button-group').prepend(
                                  $('<div>').addClass('btn-group').prepend(
                                     $('<strong>').attr('id', 'nbgdrive-pull-result')
                                        .text('Pulled from Google Drive Successfully!').css('margin-right', '15px')
                                  )
                              );
                          } else {
                              $('#nbgdrive-button-group').prepend(
                                  $('<div>').addClass('btn-group').prepend(
                                     $('<strong>').attr('id', 'nbgdrive-pull-result')
                                        .text('Your input path was incorrect - please try again!').css('margin-right', '15px')
                                  )
                              );
                          }

                          $("#nbgdrive-pull-result").fadeOut(4000);
                      });
            })
        );
    
        $('#nbgdrive-button-group').prepend(
          $('<div>').addClass('btn-group').prepend(
              $('<input>').attr('id', 'nbgdrive-pull-id').attr('type', 'text').css('margin-right', '5px')
          )
        );
    }

    var createManualPullButton = function () {
       console.log("Created gdrive pull button");
       $('#nbgdrive-button-group').prepend(
            $('<div>').addClass('btn-group').prepend(
                 '<button class="btn btn-xs btn-default" title="Pull from Google Drive" id="nbgdrive-pull-button"><i class="fa-cloud-download fa"></i></button>'
            ).click(
                 gDrivePull
            )
       );
    }

    var createButtonGroup = function() {
        console.log("Created button group");
        $('#notebook_toolbar .pull-right').prepend($('<span>')).attr('id', 'nbgdrive-button-group');
    }

    var createSubmissionDisplay = function() {
      $('#nbgdrive-link').remove();

      $('#nbgdrive-button-group').prepend(
          $('<div>').addClass('btn-group').attr('id', 'nbgdrive-button').prepend(
              '<button class="btn btn-xs btn-default" title="Submit Google Drive Authentication Code"><i class="fa fa-sign-in"></i></button>'
          ).click(function() {
              var gdrive_auth_id = $("#nbgdrive-authentication").val();
              var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");
              $.post(utils.get_body_data('baseUrl') + 'authenticateDrive',
                  {
                    message: gdrive_auth_id,
                    _xsrf: r ? r[1] : undefined
                  },
                  function(response) {
                      $("#nbgdrive-authentication").remove();
                      $("#nbgdrive-button").remove();

                      console.log("Response is: " + response);

                      if (response.includes("Free:") && !response.includes("Failed")) {
                          $('#nbgdrive-button-group').prepend(
                              $('<div>').addClass('btn-group').attr('id', 'nbgdrive-button').prepend(
                                  '<button class="btn btn-xs btn-default" title="Submit Google Drive Folder Path"><i class="fa fa-sign-in"></i></button>'
                              ).click(function () {
                                  var folderPath = $("#nbgdrive-folder-path").val();
                                  var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");

                                  $.post(utils.get_body_data('baseUrl') + 'setGDriveFolder',
                                      {
                                          message: folderPath,
                                          _xsrf: r ? r[1] : undefined
                                      },
                                  function(response) {
                                      $("#nbgdrive-folder-path").remove();
                                      $("#nbgdrive-button").remove();
                                      createManualSyncButton();
                                      createLogoutButton();
                                      createManualPullButton();

                                      $('#nbgdrive-button-group').prepend(
                                          $('<div>').addClass('btn-group').prepend(
                                              $('<strong>').attr('id', 'nbgdrive-syncdir-status').text("Creating Drive Directory...").css('margin-right', '15px')
                                          )
                                      );
                                  });

                                  $.getJSON(utils.get_body_data('baseUrl') + 'createDrive', function(data) {

                                      var display = String(data['status']);
                                      $("#nbgdrive-syncdir-status").text(display);
                                      $("#nbgdrive-syncdir-status").fadeOut(4000);
                                  });
                              })
                          );

                          $('#nbgdrive-button-group').prepend(
                              $('<div>').addClass('btn-group').prepend(
                                  $('<input>').attr('id', 'nbgdrive-folder-path').attr('type', 'text')
                                      .attr('placeholder', 'Drive Folder Name').css('margin-right', '5px')
                              )
                          );

                          $('#nbgdrive-button-group').prepend(
                              $('<div>').addClass('btn-group').prepend(
                                  $('<strong>').attr('id', 'nbgdrive-authenticated-result').text('User Authenticated!').css('margin-right', '15px')
                              )
                          );

                          $("#nbgdrive-authenticated-result").fadeOut(4000);

                      } else {
                          $('#nbgdrive-button-group').prepend(
                              $('<div>').addClass('btn-group').prepend(
                                   $('<strong>').attr('id', 'nbgdrive-authenticated-result').text('Authentication Failed!').css('margin-right', '15px')
                              )
                          );

                          $("#nbgdrive-authenticated-result").fadeOut(4000);
                          setTimeout(displayDriveVerificationLink, 5000);
                      }
                  }
              );
          })
      );

      $('#nbgdrive-button-group').prepend(
          $('<div>').addClass('btn-group').prepend(
              $('<input>').attr('id', 'nbgdrive-authentication').attr('type', 'text')
                  .attr('placeholder', 'Authentication Key').css('margin-right', '5px')
          )
      );
    }

    /*
     *  Retrieves Drive verification link and displays it to the user.
     */
    var displayDriveVerificationLink = function () {
        $("#nbgdrive-authenticated-result").remove();
        createButtonGroup();

        $.getJSON(utils.get_body_data('baseUrl') + 'authenticateDrive', function(data) {
            var display = String(data['authentication'])

            if (display !== "authenticated") {
                $('#nbgdrive-button-group').prepend(
                    $('<div>').addClass('btn-group').attr('id', 'nbgdrive-link').prepend(
                         '<button class="btn btn-xs btn-default" title="Authenticate Google Drive"><i class="fa-cloud fa"></i></button>'
                    ).click(function() {
                      openAuthenticationInNewTab(display);
                      createSubmissionDisplay();
                    })
                );
            } else {
                createManualSyncButton();
                createLogoutButton();
                createManualPullButton();
                checkIfReadyToSync();
            }
        });
    }

    var load_ipython_extension = function () {
        $(".col-sm-8.no-padding").attr('class', 'col-sm-4 no-padding');
        $(".col-sm-4.no-padding.tree-buttons").attr('class', 'col-sm-8 no-padding tree-buttons');
        displayDriveVerificationLink();
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };

  });
