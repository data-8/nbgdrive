define([
    'jquery',
    'base/js/utils',
    'base/js/namespace'
], function (
    $, utils, Jupyter
) {
    function createDisplayDiv() {
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbgdrive-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('Creating Google Drive Directory: ')
            ).append(
                $('<span>').attr('id', 'nbgdrive-status')
                           .attr('title', 'Latest action performed by GDrive Extension')
            ).append(
                $('<button>').attr('id', 'nbgdrive-button')
                             .text('Submit')
                             .click(function() {
                                alert ("Handler for nbdgdrive-button clicked!");
                             })
            )
        );
    }

    var autosync_gdrive_files = function () {
        $.getJSON(utils.get_body_data('baseUrl') + 'gsync', function(data) {
            var display = String(data['status']);
            console.log ("Current text: " + display);
            $('#nbgdrive-status').text(display);
        });
    }

    var check_autosync_time = function () {
        console.log ("Checking the time for autosync.");
        var date = new Date();
        if (date.getHours() === 3  && date.getMinutes() === 0) {
            autosync_gdrive_files();
        }
    }

    /* For the Google Authentication

    * 1. Create an input text field and a button
    * 2. Button takes the text from the field and needs to call a gdrive function
    * 3. Not really sure how to pass in the field from form into gdrive function
        seems like they all have to be stateless? 
    * 4. Assuming information is passed in, can verify now.

    1. Create a server side function that will run gdrive about and store the string
    as JSON somewhere (we will cut the result to get the URL to visit)
    2. Extract the URL to visit on the client side and alert it to the user
    3. Create input field w/ button, assume user will post the correct input and 
    send that as JSON to the server
    4. Server then extracts the JSON and echoes that into gdrive about in order to authorize.

    QUESTION 1: Post data with JS and extract it properly on the server side
    QUESTION 2: Print statements work on server side to console?
    QUESTION 3: Get data on the server side with Requests library */


    var load_ipython_extension = function () {
        /* Creates an extra field for the Jupyter notebook. */
        createDisplayDiv();
        
        /* Triggers the directory to be created a single time. */
        $.getJSON(utils.get_body_data('baseUrl') + 'gdrive', function(data) {
            var display = String(data['status']);
            $('#nbgdrive-status').text(display);
        });

        /* Create a function that checks the time every minute, autosyncs when 3 AM
         * TODO: EXTREMELY HACKY. */
        setInterval(check_autosync_time, 1000 * 60);

        /* The below is correct. */
        $.post(utils.get_body_data('baseUrl') + 'gresponse', {message: "Hello world!"}, function(data) {
            console.log(data);
        });

        /* Registers a new button with the notebook. */
        var manual_sync_handler = function () {
            /* Make a put request to gresponse URL with entry. */

            $.getJSON(utils.get_body_data('baseUrl') + 'gsync', function(data) {
                // FIXME: Proper setups for MB and GB. MB should have 0 things
                // after the ., but GB should have 2.
                var display = String(data['status']);
                console.log ("Current text: " + display);
                $('#nbgdrive-status').text(display);
            });
        }

        var action = {
            icon: 'fa-cloud', // a font-awesome class used on buttons, etc
            help    : 'Manually syncs the home directory with Google Drive',
            help_index : 'zz',
            handler : manual_sync_handler
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
