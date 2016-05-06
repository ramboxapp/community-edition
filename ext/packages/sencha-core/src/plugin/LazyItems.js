/**
 * This plugin defers the execution cost of the instantiation and initialization of child components of unrendered items.
 *
 * For example, in a {@link Ext.tab.Panel#deferredRender deferredRender} {@link Ext.tab.Panel TabPanel}, the unrendered tabs
 * do not have to incur the cost of instantiating and initializing their descendant components until render.
 *
 * This plugin allows that.
 *
 * Add the items to the plugin:
 *
 *     {
 *         xtype: 'tabpanel',
 *         items: [{
 *             title: 'Tab One',
 *             plugins: {
 *                 ptype: 'lazyitems',
 *                 items: [... tab's child items...]
 *             }
 *         }, {
 *             title: 'Tab One',
 *             plugins: {
 *                 ptype: 'lazyitems',
 *                 items: [... tab's child items...]
 *             }
 *         }]
 *     }
 */
Ext.define('Ext.plugin.LazyItems', {
    extend: 'Ext.plugin.Abstract',
 
     alias: 'plugin.lazyitems',
 
    init: function(comp) {
        this.callParent(arguments);
 
        if (this.items) {
            // Eager instantiation means create the child items now
            if (this.eagerInstantiation) {
                this.items = comp.prepareItems(this.items);
            }
        }
 
        // We need to jump in right before the beforeRender call
        comp.beforeRender = Ext.Function.createInterceptor(comp.beforeRender, this.beforeComponentRender, this);
    },
 
    // Add the child items at the last possible moment.
    beforeComponentRender: function() {
        this.cmp.add(this.items);
 
        // Remove the interceptor
        delete this.cmp.beforeComponentRender;
    }
});