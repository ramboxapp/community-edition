/** */
Ext.define('Ext.aria.grid.column.Column', {
    override: 'Ext.grid.column.Column',
    
    ariaSortStates: {
        ASC: 'ascending',
        DESC: 'descending'
    },
    
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            sortState = me.sortState,
            states = me.ariaSortStates,
            attr;
        
        attr = me.callParent();
        
        attr['aria-sort'] = states[sortState];
        
        return attr;
    },
    
    setSortState: function(sorter) {
        var me = this,
            states = me.ariaSortStates,
            oldSortState = me.sortState,
            newSortState;
        
        me.callParent(arguments);
        
        newSortState = me.sortState;
        
        if (oldSortState !== newSortState) {
            me.ariaUpdate({ 'aria-sort': states[newSortState] });
        }
    }
});
