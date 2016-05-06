/**
 * Internal utility class that provides a unique cell context.
 * @private
 */
Ext.define('Ext.grid.CellContext', {

    /**
     * @property {Boolean} isCellContext
     * @readonly
     * `true` in this class to identify an object as an instantiated CellContext, or subclass thereof.
     */
    isCellContext: true,
    
    constructor: function(view) {
        this.view = view;
    },
    
    isEqual: function(other) {
        if (other) {
            return this.record === other.record && this.column === other.column;
        }
        return false;
    },
    
    // Selection row/record & column/columnHeader
    setPosition: function(row, col) {
        var me = this;

        // We were passed {row: 1, column: 2, view: myView} or [2, 1]
        if (arguments.length === 1) {
            // A [column, row] array passed
            if (row.length) {
                col = row[0];
                col = row[1];
            }
            // An object containing {row: r, column: c}
            else {
                if (row.view) {
                    me.view = row.view;
                }
                col = row.column;
                row = row.row;
            }
        }

        me.setRow(row);
        me.setColumn(col);
        return me;
    },

    setAll: function(view, recordIndex, columnIndex, record, columnHeader) {
        var me = this;

        me.view = view;
        me.rowIdx = recordIndex;
        me.colIdx = columnIndex;
        me.record = record;
        me.column = columnHeader;
        return me;
    },

    setRow: function(row) {
        var me = this,
            dataSource = me.view.dataSource;
        
        if (row !== undefined) {
            // Row index passed
            if (typeof row === 'number') {
                me.rowIdx = Math.max(Math.min(row, dataSource.getCount() - 1), 0);
                me.record = dataSource.getAt(row);
            }
            // row is a Record
            else if (row.isModel) {
                me.record = row;
                me.rowIdx = dataSource.indexOf(row);
            }
            // row is a grid row
            else if (row.tagName) {
                me.record = me.view.getRecord(row);
                me.rowIdx = dataSource.indexOf(me.record);
            }
        }
    },
    
    setColumn: function(col) {
        var me = this,
                colMgr = me.view.getVisibleColumnManager();

        // Maintainer:
        // We MUST NOT update the context view with the column's view because this context
        // may be for an Ext.locking.View which spans two grid views, and a column references
        // its local grid view.
        if (col !== undefined) {
            if (typeof col === 'number') {
                me.colIdx = col;
                me.column = colMgr.getHeaderAtIndex(col);
            } else if (col.isHeader) {
                me.column = col;
                // Must use the Manager's indexOf because view may be a locking view
                // And Column#getVisibleIndex returns the index of the column within its own header.
                me.colIdx = colMgr.indexOf(col);
            }
        }
    },

    next: function() {
        var me = this,
            mgr = me.view.getVisibleColumnManager();

        me.colIdx++;
        if (me.colIdx === mgr.getColumns().length) {
            me.setPosition(Math.min(me.rowIdx + 1, me.view.dataSource.getCount() - 1), me.colIdx);
        } else {
            me.setColumn(me.colIdx);
        }
    },

    equal: function(other) {
        return (other && other.isCellContext && other.view === this.view && other.record === this.record && other.column === this.column);
    },

    clone: function() {
        var me = this,
            result = new me.self(me.view);

        result.rowIdx = me.rowIdx;
        result.colIdx = me.colIdx;
        result.record = me.record;
        result.column = me.column;
        return result;
    }
});