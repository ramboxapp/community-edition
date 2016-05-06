/**
 * This class implements the global event domain. This domain represents event fired from
 * {@link Ext.GlobalEvents} Observable instance. No selectors are supported for this domain.
 * 
 * @private
 */
Ext.define('Ext.app.domain.Global', {
    extend: 'Ext.app.EventDomain',
    requires: ['Ext.GlobalEvents'],
    singleton: true,

    type: 'global',

    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.GlobalEvents);
    },

    /**
     * This method adds listeners on behalf of a controller. Since Global domain does not
     * support selectors, we skip this layer and just accept an object keyed by events.
     * For example:
     *
     *      domain.listen({
     *          idle: function() { ... },
     *          afterlayout: {
     *              fn: function() { ... },
     *              delay: 10
     *          }
     *      });
     *
     * @param {Object} listeners Config object containing listeners.
     * @param {Object} controller A controller to force execution scope on
     *
     * @private
     */              
    listen: function(listeners, controller) {
        this.callParent([{ global: listeners }, controller]);
    },

    match: Ext.returnTrue
});
