/**
 * Ext.direct.Provider is an abstract class meant to be extended.
 *
 * For example Ext JS implements the following subclasses:
 *
 *     Provider
 *     |
 *     +---{@link Ext.direct.JsonProvider JsonProvider}
 *         |
 *         +---{@link Ext.direct.PollingProvider PollingProvider}
 *         |
 *         +---{@link Ext.direct.RemotingProvider RemotingProvider}
 *
 * @abstract
 */
Ext.define('Ext.direct.Provider', {
   alias: 'direct.provider',

    mixins: [
        'Ext.util.Observable'
    ],
    
    requires: [
        'Ext.direct.Manager'
    ],
    
    isProvider: true,

   /**
     * @cfg {String} id
     * The unique id of the provider (defaults to an {@link Ext#id auto-assigned id}).
     * You should assign an id if you need to be able to access the provider later and you do
     * not have an object reference available, for example:
     *
     *      Ext.direct.Manager.addProvider({
     *          type: 'polling',
     *          url:  'php/poll.php',
     *          id:   'poll-provider'
     *      });
     *      var p = {@link Ext.direct.Manager}.{@link Ext.direct.Manager#getProvider getProvider}('poll-provider');
     *     p.disconnect();
     *
     */
    
    /**
     * @cfg {String[]} relayedEvents
     * List of Provider events that should be relayed by {@link Ext.direct.Manager}.
     * 'data' event is always relayed.
     */
    
    /**
     * @event connect
     * Fires when the Provider connects to the server-side
     *
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}.
     */

    /**
     * @event disconnect
     * Fires when the Provider disconnects from the server-side
     *
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}.
     */

    /**
     * @event data
     * Fires when the Provider receives data from the server-side
     *
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}.
     * @param {Ext.direct.Event} e The Ext.direct.Event type that occurred.
     */

    /**
     * @event exception
     * Fires when the Provider receives an exception from the server-side
     */
    
    subscribers: 0,

    constructor: function(config) {
        var me = this;
        
        Ext.apply(me, config);
        
        Ext.applyIf(me, {
            id: Ext.id(null, 'provider-')
        });

        me.mixins.observable.constructor.call(me, config);
    },
    
    destroy: function() {
        var me = this;
        
        me.disconnect(true);
        me.mixins.observable.destroy.call(me);
    },
    
    /**
     * Returns whether or not the server-side is currently connected.
     */
    isConnected: function() {
        return this.subscribers > 0;
    },

    /**
     * Connect the provider and start its service.
     * Provider will fire `connect` event upon successful connection.
     */
    connect: function() {
        var me = this;
        
        if (me.subscribers === 0) {
            me.doConnect();
            me.fireEventArgs('connect', [me]);
        }
        
        me.subscribers++;
    },
    
    /**
     * Do connection setup. This is a template method.
     * @template
     * @protected
     */
    doConnect: Ext.emptyFn,

    /**
     * Disconnect the provider and stop its service.
     * Provider will fire `disconnect` event upon successful disconnect.
     */
    disconnect: function(/* */ force) {
        var me = this;
        
        if (me.subscribers > 0) {
            if (force) {
                me.subscribers = 0;
            }
            else {
                me.subscribers--;
            }
            
            if (me.subscribers === 0) {
                me.doDisconnect();
                me.fireEventArgs('disconnect', [me]);
            }
        }
    },
    
    /**
     * Do connection teardown. This is a template method.
     * @template
     * @protected
     */
    doDisconnect: Ext.emptyFn,
    
    inheritableStatics: {
        /**
         * Check if the passed configuration object contains enough
         * information to construct a Provider.
         *
         * @param {Object} config
         *
         * @return {Boolean} `true` if config is sufficient, `false` otherwise.
         */
        checkConfig: Ext.returnFalse
    },
    
    onClassExtended: function(cls, data, hooks) {
        if (data.type) {
            Ext.direct.Manager.addProviderClass(data.type, cls);
        }
    }
});
