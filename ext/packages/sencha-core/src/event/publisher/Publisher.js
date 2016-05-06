/**
 * Abstract base class for event publishers
 * @private
 */
Ext.define('Ext.event.publisher.Publisher', {

    /**
     * @property {Array} handledEvents
     * An array of events that this publisher handles.
     */
    handledEvents: [],

    statics: {
        /**
         * @property {Object} publishers
         * A map of all publisher singleton instances.  Publishers register themselves
         * in this map as soon as they are constructed.
         */
        publishers: {},

        /**
         * @property publishersByEvent
         * A map of handled event names to the publisher that handles each event.
         * Provides a convenient way for looking up the publisher that handles any given
         * event, for example:
         *
         *     // get the publisher that  handles click:
         *     var publisher = Ext.event.publisher.Publisher.publishersByEvent.click;
         */
        publishersByEvent: {}
    },

    constructor: function() {
        var me = this,
            type = me.type;

        /**
         * @property {Object} handles
         * @private
         * A map for conveniently checking if this publisher handles a given event
         */
        me.handles = {};

        //<debug>
        if (!type) {
            Ext.Error.raise("Event publisher '" + me.$className + "' defined without a 'type' property.");
        }
        if (me.self.instance) {
            Ext.Error.raise("Cannot create multiple instances of '" + me.$className + "'. " +
                "Use '" + me.$className + ".instance' to retrieve the singleton instance.");
        }
        //</debug>

        me.registerEvents();

        Ext.event.publisher.Publisher.publishers[type] = me;
    },

    /**
     * Registers all {@link #handledEvents} in the
     * {@link Ext.event.publisher.Publisher#publishersByEvent} map.
     * @param {String[]} [events] optional events to register instead of handledEvents.
     * @protected
     */
    registerEvents: function(events) {
       var me = this,
           publishersByEvent = Ext.event.publisher.Publisher.publishersByEvent,
           handledEvents = events || me.handledEvents,
           ln = handledEvents.length,
           eventName, i;

        for (i = 0; i < ln; i++) {
            eventName = handledEvents[i];
            me.handles[eventName] = 1;
            publishersByEvent[eventName] = me;
        }
    },

    fire: function(element, eventName, args) {
        var event;

        if (element.hasListeners[eventName]) {
            event = element.events[eventName];

            if (event) {
                event.fire.apply(event, args);
            }
        }
    },

    //<debug>
    subscribe: function() {
        Ext.Error.raise("Ext.event.publisher.Publisher subclass '" + this.$className + '" has no subscribe method.');
    },

    unsubscribe: function() {
        Ext.Error.raise("Ext.event.publisher.Publisher subclass '" + this.$className + '" has no unsubscribe method.');
    },
    //</debug>

    destroy: Ext.emptyFn
});
