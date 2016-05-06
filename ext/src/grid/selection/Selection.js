/**
 * Base class for selections which may be of three subtypes:
 *
 * - {@link Ext.grid.selection.Cells Cells} A rectangular range of cells defined by a start
 *   record/column and an end record/column.
 * - {@link Ext.grid.selection.Rows Rows} An array of records.
 * - {@link Ext.grid.selection.Columns Columns} An array of columns in which all records
 *   are included.
 *
 * @since 5.1.0
 */
Ext.define('Ext.grid.selection.Selection', {

    constructor: function(view) {
        //<debug>
        if (!view || !(view.isTableView || view.isLockingView)) {
            Ext.Error.raise('Selection must be created for a given TableView or LockingView');
        }
        //</debug>
        // We use the topmost (possible Ext.locking.View) view
        this.view = view.ownerGrid.view;
    }

    /**
     * Clones this selection object.
     * @return {Ext.grid.selection.Selection} A clone of this instance.
     * @method clone
     */

    /**
     * Clears the selection represented by this selection object.
     * @private
     * @method clear
     */

    /**
     * Calls the passed function for each selected {@link Ext.data.Model record}.
     *
     * @param {Function} fn The function to call. If this returns `false`, the iteration is
     * halted with no further calls.
     * @param {Ext.data.Model} fn.record The current record.
     * @param {Object} [scope] The context (`this` reference) in which the function is executed.
     * Defaults to this Selection object.
     * @method eachRow
     */

    /**
     * Calls the passed function for each selected cell from top left to bottom right
     * iterating over columns within each row.
     *
     * @param {Function} fn The function to call. If this returns `false`, the iteration is
     * halted with no further calls.
     * @param {Ext.grid.CellContext} fn.context The CellContext representing the current cell.
     * @param {Number} fn.columnIndex The column index of the current cell.
     * @param {Number} fn.rowIndex The row index of the current cell.
     * @param {Object} [scope] The context (`this` reference) in which `fn` is executed.
     * Defaults to this Selection object.
     * @method eachCell
     */

    /**
     * Calls the passed function for each selected column from left to right.
     *
     * @param {Function} fn The function to call. If this returns false, the iteration is
     * halted with no further calls.
     * @param {Ext.grid.column.Column} fn.column The current column.
     * @param {Number} fn.columnIndex The index of the current column. *Note that in a
     * locked grid, this is relative to the outermost grid encompassing both sides*.
     * @param {Object} [scope] The context (`this` reference) in which `fn` is executed.
     * Defaults to this Selection object.
     * @method eachColumn
     */
});
