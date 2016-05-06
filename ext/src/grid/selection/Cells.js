/**
 * A class which encapsulates a range of cells defining a selection in a grid.
 *
 * Note that when range start and end points are represented by an array, the
 * order is traditional `x, y` order, that is column index followed by row index.
 * @since 5.1.0
 */
Ext.define('Ext.grid.selection.Cells', {
    extend: 'Ext.grid.selection.Selection',

    type: 'cells',

    /**
     * @property {Boolean} isCells
     * This property indicates the this selection represents selected cells.
     * @readonly
     */
    isCells: true,

    //-------------------------------------------------------------------------
    // Base Selection API

    clone: function() {
        var me = this,
            result = new me.self(me.view);

        if (me.startCell) {
            result.startCell = me.startCell.clone();
            result.endCell = me.endCell.clone();
        }
        return result;
    },

    /**
     * Returns `true` if the passed {@link Ext.grid.CellContext cell context} is selected.
     * @param {Ext.grid.CellContext} cellContext The cell context to test.
     * @return {Boolean} `true` if the passed {@link Ext.grid.CellContext cell context} is selected.
     */
    contains: function(cellContext) {
        var range;

        if (!cellContext || !cellContext.isCellContext) {
            return false;
        }

        if (this.startCell) {
            // get start and end rows in the range
            range = this.getRowRange();

            if (cellContext.rowIdx >= range[0] && cellContext.rowIdx <= range[1]) {
                // get start and end columns in the range
                range = this.getColumnRange();
                return (cellContext.colIdx >= range[0] && cellContext.colIdx <= range[1]);
            }
        }

        return false;
    },

    eachRow: function(fn, scope) {
        var me = this,
            rowRange = me.getRowRange(),
            context = new Ext.grid.CellContext(me.view),
            rowIdx;

        for (rowIdx = rowRange[0]; rowIdx <= rowRange[1]; rowIdx++) {
            context.setRow(rowIdx);
            if (fn.call(scope || me, context.record) === false) {
                return;
            }
        }
    },

    eachColumn: function(fn, scope) {
        var me = this,
            colRange = me.getColumnRange(),
            context = new Ext.grid.CellContext(me.view),
            colIdx;

        for (colIdx = colRange[0]; colIdx <= colRange[1]; colIdx++) {
            context.setColumn(colIdx);
            if (fn.call(scope || me, context.column, colIdx) === false) {
                return;
            }
        }
    },

    eachCell: function(fn, scope) {
        var me = this,
            rowRange = me.getRowRange(),
            colRange = me.getColumnRange(),
            context = new Ext.grid.CellContext(me.view),
            rowIdx, colIdx;

        for (rowIdx = rowRange[0]; rowIdx <= rowRange[1]; rowIdx++) {
            context.setRow(rowIdx);
            for (colIdx = colRange[0]; colIdx <= colRange[1]; colIdx++) {
                context.setColumn(colIdx);
                if (fn.call(scope || me, context, colIdx, rowIdx) === false) {
                    return;
                }
            }
        }
    },

    /**
     * @return {Number} The row index of the first row in the range or zero if no range.
     */
    getFirstRowIndex: function() {
        return this.startCell ? Math.min(this.startCell.rowIdx, this.endCell.rowIdx) : 0;
    },

    /**
     * @return {Number} The row index of the last row in the range or -1 if no range.
     */
    getLastRowIndex: function() {
        return this.startCell ? Math.max(this.startCell.rowIdx, this.endCell.rowIdx) : -1;
    },

    /**
     * @return {Number} The column index of the first column in the range or zero if no range.
     */
    getFirstColumnIndex: function() {
        return this.startCell ? Math.min(this.startCell.colIdx, this.endCell.colIdx) : 0;
    },

    /**
     * @return {Number} The column index of the last column in the range or -1 if no range.
     */
    getLastColumnIndex: function() {
        return this.startCell ? Math.max(this.startCell.colIdx, this.endCell.colIdx) : -1;
    },

    //-------------------------------------------------------------------------

    privates: {
        /**
         * @private
         */
        clear: function() {
            var me = this,
                view = me.view;

            me.eachCell(function(cellContext) {
                view.onCellDeselect(cellContext);
            });
            me.startCell = me.endCell = null;
        },

        /**
         * Used during drag/shift+downarrow range selection on start.
         * @param {Ext.grid.CellContext} startCell The start cell of the cell drag selection.
         * @private
         */
        setRangeStart: function (startCell) {
            // Must clone them. Users might use one instance and reconfigure it to navigate.
            this.startCell = (this.endCell = startCell.clone()).clone();
            this.view.onCellSelect(startCell);
        },

        /**
         * Used during drag/shift+downarrow range selection on drag.
         * @param {Ext.grid.CellContext} endCell The end cell of the cell drag selection.
         * @private
         */
        setRangeEnd: function (endCell) {
            var me = this,
                range,
                lastRange,
                rowStart,
                rowEnd,
                colStart,
                colEnd,
                rowIdx,
                colIdx,
                view = me.view,
                rows = view.all,
                cell = new Ext.grid.CellContext(view),
                maxColIdx = view.getVisibleColumnManager().getColumns().length - 1;

            me.endCell = endCell.clone();
            range = me.getRange();
            lastRange = me.lastRange || range;

            rowStart = Math.max(Math.min(range[0][1], lastRange[0][1]), rows.startIndex);
            rowEnd   = Math.min(Math.max(range[1][1], lastRange[1][1]), rows.endIndex);

            colStart = Math.min(range[0][0], lastRange[0][0]);
            colEnd   = Math.min(Math.max(range[1][0], lastRange[1][0]), maxColIdx);

            // Loop through the union of last range and current range
            for (rowIdx = rowStart; rowIdx <= rowEnd; rowIdx++) {
                for (colIdx = colStart; colIdx <= colEnd; colIdx++) {
                    cell.setPosition(rowIdx, colIdx);

                    // If we are outside the current range, deselect
                    if (rowIdx < range[0][1] || rowIdx > range[1][1] || colIdx < range[0][0] || colIdx > range[1][0]) {
                        view.onCellDeselect(cell);
                    } else {
                        view.onCellSelect(cell);
                    }
                }
            }
            me.lastRange = range;
        },

        /**
         * Returns the `[[x, y],[x,y]]` coordinates in top-left to bottom-right order
         * of the current selection.
         *
         * If no selection, returns [[0, 0],[-1, -1]] so that an incrementing iteration
         * will not execute.
         *
         * @return {Number[][]}
         * @private
         */
        getRange: function() {
            return [[this.getFirstColumnIndex(), this.getFirstRowIndex()], [this.getLastColumnIndex(), this.getLastRowIndex()]];
        },

        /**
         * Returns the size of the selection rectangle.
         * @return {Number}
         * @private
         */
        getRangeSize: function() {
            return this.getCount();
        },

        /**
         * Returns the number of cells selected.
         * @return {Number} The nuimber of cells selected
         * @private
         */
        getCount: function() {
            var range = this.getRange();

            return (range[1][0] - range[0][0] + 1) * (range[1][1] - range[0][1] + 1);
        },

        /**
         * @private
         */
        selectAll: function() {
            var me = this,
                view = me.view;

            me.clear();
            me.setRangeStart(new Ext.grid.CellContext(view).setPosition(0, 0));
            me.setRangeEnd(new Ext.grid.CellContext(view).setPosition(view.dataSource.getCount() - 1, view.getVisibleColumnManager().getColumns().length - 1));
        },

        /**
         * @return {Boolean}
         * @private
         */
        isAllSelected: function() {
            var start = this.rangeStart,
                end = this.rangeEnd;

            // All selected only if we encompass the entire store and every visible column
            if (start) {
                if (!start.colIdx && !start.rowIdx) {
                    return end.colIdx === end.view.getVisibleColumnManager().getColumns().length - 1 && end.rowIdx === end.view.dataSource.getCount - 1;
                }
            }
            return false;
        },

        /**
         * @return {Number[]} The column range which encapsulates the range.
         * @private
         */
        getColumnRange: function() {
            return [this.getFirstColumnIndex(), this.getLastColumnIndex()];
        },

        /**
         * Returns the row range which encapsulates the range - the view range that needs
         * updating.
         * @return {Number[]}
         * @private
         */
        getRowRange: function() {
            return [this.getFirstRowIndex(), this.getLastRowIndex()];
        }
    }
});
