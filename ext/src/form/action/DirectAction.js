/**
 * @class Ext.form.action.DirectAction
 * A mixin that contains methods specific to Ext.Direct actions shared
 * by DirectLoad and DirectSubmit.
 * @private
 */
Ext.define('Ext.form.action.DirectAction', {
    extend: 'Ext.Mixin',
    
    mixinConfig: {
        id: 'directaction'
    },
    
    resolveMethod: function(type) {
        var me = this,
            form = me.form,
            api = form.api,
            fn;
        
        //<debug>
        if (!api) {
            Ext.Error.raise("Cannot resolve Ext.Direct API method for " + type +
                            " action; form " + form.id + " has no api object defined");
        }
        //</debug>
        
        fn = api[type];
        
        if (typeof fn !== 'function') {
            //<debug>
            var fnName = fn;
            //</debug>
            
            api[type] = fn = Ext.direct.Manager.parseMethod(fn);
            
            //<debug>
            if (!Ext.isFunction(fn)) {
                Ext.Error.raise("Cannot resolve Ext.Direct API method " + fnName +
                                " for " + type + " action");
            }
            //</debug>
        }
        
        return fn;
    }
});
