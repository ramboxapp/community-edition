/** */
Ext.define('Ext.aria.view.Table', {
    override: 'Ext.view.Table',
    
    requires: [
        'Ext.aria.view.View'
    ],

    ariaGetRenderAttributes: function() {
        var me = this,
            plugins = me.plugins,
            readOnly = true,
            attrs, i, len;
        
        attrs = me.callParent();
        
        if (plugins) {
            for (i = 0, len = plugins.length; i < len; i++) {
                // Both CellEditor and RowEditor have 'editing' property
                if ('editing' in plugins[i]) {
                    readOnly = false;
                    break;
                }
            }
        }
        
        attrs['aria-readonly'] = readOnly;
        
        return attrs;
    },
    
    // Table Views are rendered from templates that are rarely overridden,
    // so we can render ARIA attributes in the templates instead of applying
    // them after the fact.
    ariaItemAdd: Ext.emptyFn,
    ariaItemRemove: Ext.emptyFn,
    ariaInitViewItems: Ext.emptyFn,
    
    ariaFindNode: function(selModel, record, row, column) {
        var me = this,
            node;
        
        if (selModel.isCellModel) {
            // When column is hidden, its index will be -1
            if (column > -1) {
                node = me.getCellByPosition({ row: row, column: column });
            }
            else {
                node = me.getCellByPosition({ row: row, column: 0 });
            }
        }
        else {
            node = Ext.fly(me.getNode(record));
        }
        
        return node;
    },

    ariaSelect: function(selModel, record, row, column) {
        var me = this,
            node;
        
        node = me.ariaFindNode(selModel, record, row, column);

        if (node) {
            node.set({ 'aria-selected': true });
            me.ariaUpdate({ 'aria-activedescendant': node.id });
        }
    },

    ariaDeselect: function(selModel, record, row, column) {
        var me = this,
            node;
        
        node = me.ariaFindNode(selModel, record, row, column);

        if (node) {
            node.set({ 'aria-selected': undefined });
            me.ariaUpdate({ 'aria-activedescendant': undefined });
        }
    },

    renderRow: function(record, rowIdx, out) {
        var me = this,
            rowValues = me.rowValues;
        
        rowValues.ariaRowAttr = 'role="row"';
        
        return me.callParent(arguments);
    },
    
    renderCell: function(column, record, recordIndex, rowIndex, columnIndex, out) {
        var me = this,
            cellValues = me.cellValues;
        
        cellValues.ariaCellAttr = 'role="gridcell"';
        cellValues.ariaCellInnerAttr = '';
        
        return me.callParent(arguments);
    },
    
    collectData: function(records, startIndex) {
        var me = this,
            data;
        
        data = me.callParent(arguments);
        
        Ext.applyIf(data, {
            ariaTableAttr: 'role="presentation"',
            ariaTbodyAttr: 'role="rowgroup"'
        });
        
        return data;
    }
});
