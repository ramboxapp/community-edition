Ext.define('Ext.rtl.view.NavigationModel', {
    override: 'Ext.view.NavigationModel',

    initKeyNav: function(view) {
        var me = this,
            proto = me.self.prototype;

        if (view.getInherited().rtl) {
            me.onKeyLeft = proto.onKeyRight;
            me.onKeyRight = proto.onKeyLeft;
        }
        me.callParent([view]);
    }
});