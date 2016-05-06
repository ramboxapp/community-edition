/**
 * This class implements the data store event domain. All classes extending from 
 * {@link Ext.data.AbstractStore} are included in this domain. The selectors are simply
 * store id, alias or the wildcard "*" to match any store.
 *
 * @private
 */

Ext.define('Ext.app.domain.Store', {
    extend: 'Ext.app.EventDomain',
    singleton: true,
    
    requires: [
        'Ext.data.AbstractStore'
    ],
    
    type: 'store',
    prefix: 'store.',
    idMatchRe: /^\#/,
    
    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.data.AbstractStore);
    },

    match: function(target, selector) {
        var result = false,
            alias = target.alias;
        
        if (selector === '*') {
            result = true;
        } else if (this.idMatchRe.test(selector)) {
            result = target.getStoreId() === selector.substring(1);
        } else if (alias) {
            result = Ext.Array.indexOf(alias, this.prefix + selector) > -1;
        }
        return result;
    }
});
