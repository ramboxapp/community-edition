Ext.define('Ext.rtl.grid.column.Column', {
    override: 'Ext.grid.column.Column',

    isAtStartEdge: function(e, margin) {
        var me = this;
        return (!me.getInherited().rtl !== !Ext.rootInheritedState.rtl) ? // jshint ignore:line
            (me.getX() + me.getWidth() - e.getXY()[0] <= me.handleWidth) :
            me.callParent([e, margin]);
    },

    isAtEndEdge: function(e, margin) {
        var me = this;
        return (!me.getInherited().rtl !== !Ext.rootInheritedState.rtl) ? // jshint ignore:line
            (e.getXY()[0] - me.getX() <= me.handleWidth) : me.callParent([e, margin]);
    }

});
