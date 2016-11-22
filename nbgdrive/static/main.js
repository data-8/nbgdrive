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

        /* Registers a new button with the notebook. */
        var handler = function () {
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
            handler : handler
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
