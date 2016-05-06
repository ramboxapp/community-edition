// @tag core
/**
 * A static {@link Ext.util.TaskRunner} instance that can be used to start and stop
 * arbitrary tasks. See {@link Ext.util.TaskRunner} for supported methods and task
 * config properties.
 *
 *     @example
 *     var task, clock;
 *     
 *     clock = Ext.getBody().appendChild({
 *         id: 'clock'
 *     });
 *     
 *     // Start a simple clock task that updates a div once per second 
 *     task = {
 *         run: function() {
 *             clock.setHtml(Ext.Date.format(new Date(), 'g:i:s A'));
 *         },
 *         interval: 1000
 *     };
 *     
 *     Ext.TaskManager.start(task);
 *
 * See the {@link #start} method for details about how to configure a task object.
 */
Ext.define('Ext.util.TaskManager', {
    extend: 'Ext.util.TaskRunner',

    alternateClassName: [
        'Ext.TaskManager'
    ],

    singleton: true
});
