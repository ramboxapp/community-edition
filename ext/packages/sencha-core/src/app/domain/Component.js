/**
 * This class implements the component event domain. All classes extending from
 * {@link Ext.Component} are included in this domain. The matching criteria uses
 * {@link Ext.ComponentQuery}.
 * 
 * @private
 */
Ext.define('Ext.app.domain.Component', {
    extend: 'Ext.app.EventDomain',
    singleton: true,

    requires: [
        'Ext.Widget'
    ],

    type: 'component',

    constructor: function() {
        this.callParent();

        this.monitor(Ext.Widget);
    },
    
    dispatch: function(target, ev, args) {
        var controller = target.lookupController(false), // don't skip target
            domain, view;
           
         
        while (controller) {
            domain = controller.compDomain;
            if (domain) {
                if (domain.dispatch(target, ev, args) === false) {
                    return false;
                }
            }
            view = controller.getView();
            controller = view ? view.lookupController(true) : null;
        }
        return this.callParent(arguments);    
    },

    match: function(target, selector) {
        return target.is(selector);
    }
});
