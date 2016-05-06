Ext.define('Ext.rtl.grid.NavigationModel', {
    override: 'Ext.grid.NavigationModel',

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