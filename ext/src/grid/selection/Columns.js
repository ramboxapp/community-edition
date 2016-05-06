/**
 * A class which encapsulates a range of columns defining a selection in a grid.
 * @since 5.1.0
 */
Ext.define('Ext.grid.selection.Columns', {
    extend: 'Ext.grid.selection.Selection',

    type: 'columns',

    /**
     * @property {Boolean} isColumns
     * This property indicates the this selection represents selected columns.
     * @readonly
     */
    isColumns: true,

    //-------------------------------------------------------------------------
    // Base Selection API

    clone: function() {
        var me = this,
            result = new me.self(me.view),
            columns = me.selectedColumns;

        if (columns) {
            result.selectedColumns = Ext.Array.slice(columns);
        }
        return result;
    },

    eachRow: function (fn, scope) {
        var columns = this.selectedColumns;

        if (columns && columns.length) {
            this.view.dataSource.each(fn, scope || this);
        }
    },

    eachColumn: function (fn, scope) {
        var me = this,
            view = me.view,
            columns = me.selectedColumns,
            len,
            i,
            context = new Ext.grid.CellContext(view);

        if (columns) {
            len = columns.length;
            for (i = 0; i < len; i++) {
                context.setColumn(columns[i]);
                if (fn.call(scope || me, context.column, context.colIdx) === false) {
                    return false;
                }
            }
        }
    },

    eachCell: function (fn, scope) {
        var me = this,
            view = me.view,
            columns = me.selectedColumns,
            len,
            i,
            context = new Ext.grid.CellContext(view);

        if (columns) {
            len = columns.length;

            // Use Store#each instead of copying the entire dataset into an array and iterating that.
            view.dataSource.each(function(record) {
                context.setRow(record);
                for (i = 0; i < len; i++) {
                    context.setColumn(columns[i]);
                    if (fn.call(scope || me, context, context.colIdx, context.rowIdx) === false) {
                        return false;
                    }
                }
            });
        }
    },

    //-------------------------------------------------------------------------
    // Methods unique to this type of Selection

    /**
     * Returns `true` if the passed {@link Ext.grid.column.Column column} is selected.
     * @param {Ext.grid.column.Column} column The column to test.
     * @return {Boolean} `true` if the passed {@link Ext.grid.column.Column column} is selected.
     */
    contains: function(column) {
        var selectedColumns = this.selectedColumns;

        if (column && column.isColumn && selectedColumns && selectedColumns.length) {
            return Ext.Array.contains(selectedColumns, column);
        }

        return false;
    },

    /**
     * Returns the number of columns selected.
     * @return {Number} The number of columns selected.
     */
    getCount: function() {
        var selectedColumns = this.selectedColumns;
        return selectedColumns ? selectedColumns.length : 0;
    },

    /**
     * Returns the columns selected.
     * @return {Ext.grid.column.Column[]} The columns selected.
     */
    getColumns: function() {
        return this.selectedColumns || [];
    },

    //-------------------------------------------------------------------------

    privates: {
        /**
         * Adds the passed Column to the selection.
         * @param {Ext.grid.column.Column} column
         * @private
         */
        add: function(column) {
            //<debug>
            if (!column.isColumn) {
                Ext.Error.raise('Column selection must be passed a grid Column header object');
            }
            //</debug>

            Ext.Array.include((this.selectedColumns || (this.selectedColumns = [])), column);
            this.refreshColumns(column);
        },

        /**
         * @private
         */
        clear: function() {
            var me = this,
                prevSelection = me.selectedColumns;

            if (prevSelection && prevSelection.length) {
                me.selectedColumns = [];
                me.refreshColumns.apply(me, prevSelection);
            }
        },

        /**
         * @return {Boolean}
         * @private
         */
        isAllSelected: function() {
            var selectedColumns = this.selectedColumns;

            // All selected means all columns, across both views if we are in a locking assembly.
            return selectedColumns && selectedColumns.length === this.view.ownerGrid.getVisibleColumnManager().getColumns().length;
        },

        /**
         * @private
         */
        refreshColumns: function(column) {
            var me = this,
                view = me.view,
                rows = view.all,
                rowIdx,
                columns = arguments,
                len = columns.length,
                colIdx,
                cellContext = new Ext.grid.CellContext(view),
                selected = [];

            if (view.rendered) {
                for (colIdx = 0; colIdx < len; colIdx++) {
                    selected[colIdx] = me.contains(columns[colIdx]);
                }

                for (rowIdx = rows.startIndex; rowIdx <= rows.endIndex; rowIdx++) {
                    cellContext.setRow(rowIdx);
                    for (colIdx = 0; colIdx < len; colIdx++) {
                        // Note colIdx is not the column's visible index. setColumn must be passed the column object
                        cellContext.setColumn(columns[colIdx]);
                        if (selected[colIdx]) {
                            view.onCellSelect(cellContext);
                        } else {
                            view.onCellDeselect(cellContext);
                        }
                    }
                }
            }
        },

        /**
         * Removes the passed Column from the selection.
         * @param {Ext.grid.column.Column} column
         * @private
         */
        remove: function(column) {
            //<debug>
            if (!column.isColumn) {
                Ext.Error.raise('Column selection must be passed a grid Column header object');
            }
            //</debug>

            if (this.selectedColumns) {
                Ext.Array.remove(this.selectedColumns, column);
                this.refreshColumns(column);
            }
        },

        /**
         * @private
         */
        selectAll: function () {
            var me = this;

            me.clear();
            me.selectedColumns = me.view.getVisibleColumnManager().getColumns();
            me.refreshColumns.apply(me, me.selectedColumns);
        }
    }
});
