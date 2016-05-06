/**
 * @private
 */
Ext.define('Ext.event.publisher.ElementSize', {

    extend: 'Ext.event.publisher.Publisher',

    requires: [
        'Ext.util.SizeMonitor'
    ],

    type: 'size',

    handledEvents: ['resize'],

    constructor: function() {
        this.monitors = {};
        this.subscribers = {};

        this.callParent(arguments);
    },

    subscribe: function(element) {
        var id = element.id,
            subscribers = this.subscribers,
            monitors = this.monitors;

        if (subscribers[id]) {
            ++subscribers[id];
        } else {
            subscribers[id] = 1;

            monitors[id] = new Ext.util.SizeMonitor({
                element: element,
                callback: this.onElementResize,
                scope: this,
                args: [element]
            });
        }

        element.on('painted', 'forceRefresh', monitors[id]);

        return true;
    },

    unsubscribe: function(element) {
        var id = element.id,
            subscribers = this.subscribers,
            monitors = this.monitors,
            sizeMonitor;

        if (subscribers[id] && !--subscribers[id]) {
            delete subscribers[id];
            sizeMonitor = monitors[id];
            element.un('painted', 'forceRefresh', sizeMonitor);
            sizeMonitor.destroy();
            delete monitors[id];
        }
    },

    onElementResize: function(element, info) {
        Ext.TaskQueue.requestRead('fire', this, [element, 'resize', [element, info]]);
    }
}, function(ElementSize) {
    ElementSize.instance = new ElementSize();
});
