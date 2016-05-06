/**
 * @private
 */
Ext.define('Ext.event.publisher.ElementPaint', {

    extend: 'Ext.event.publisher.Publisher',

    requires: [
        'Ext.util.PaintMonitor',
        'Ext.TaskQueue'
    ],

    type: 'paint',

    handledEvents: ['painted'],

    constructor: function() {
        this.monitors = {};
        this.subscribers = {};

        this.callParent(arguments);
    },

    subscribe: function(element) {
        var id = element.id,
            subscribers = this.subscribers;

        if (subscribers[id]) {
            ++subscribers[id];
        } else {
            subscribers[id] = 1;

            this.monitors[id] = new Ext.util.PaintMonitor({
                element: element,
                callback: this.onElementPainted,
                scope: this,
                args: [element]
            });
        }
    },

    unsubscribe: function(element) {
        var id = element.id,
            subscribers = this.subscribers,
            monitors = this.monitors;

        if (subscribers[id] && !--subscribers[id]) {
            delete subscribers[id];
            monitors[id].destroy();
            delete monitors[id];
        }
    },

    onElementPainted: function(element) {
        Ext.TaskQueue.requestRead('fire', this, [element, 'painted', [element]]);
    }
}, function(ElementPaint) {
    ElementPaint.instance = new ElementPaint();
});
