/** */
Ext.define('Ext.aria.view.BoundListKeyNav', {
    override: 'Ext.view.BoundListKeyNav',
    
    requires: [
        'Ext.aria.view.View'
    ],

    focusItem: function(item) {
        var me = this,
            boundList = me.view;

        if (typeof item === 'number') {
            item = boundList.all.item(item);
        }

        if (item) {
            boundList.ariaUpdate({
                'aria-activedescendant': Ext.id(item, me.id + '-')
            });
            me.callParent([item]);
        }
    }
});
