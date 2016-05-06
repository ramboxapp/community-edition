/**
 * A class which encapsulates a range of rows defining a selection in a grid.
 * @since 5.1.0
 */
Ext.define('Ext.grid.selection.Rows', {
    extend: 'Ext.grid.selection.Selection',

    requires: [
        'Ext.util.Collection'
    ],

    type: 'rows',

    /**
     * @property {Boolean} isRows
     * This property indicates the this selection represents selected rows.
     * @readonly
     */
    isRows: true,

    //-------------------------------------------------------------------------
    // Base Selection API

    clone: function() {
        var me = this,
            result = new me.self(me.view);

        // Clone our record collection
        if (me.selectedRecords) {
            result.selectedRecords = me.selectedRecords.clone();
        }
        // Clone the current drag range
        if (me.rangeStart) {
            result.setRangeStart(me.rangeStart);
            result.setRangeEnd(me.rangeEnd);
        }
        return result;
    },

    //-------------------------------------------------------------------------
    // Methods unique to this type of Selection

    add: function(record) {
        //<debug>
        if (!(record.isModel)) {
            Ext.Error.raise('Row selection must be passed a record');
        }
        //</debug>

        var selection = this.selectedRecords || (this.selectedRecords = this.createRecordCollection());

        if (!selection.byInternalId.get(record.internalId)) {
            selection.add(record);
            this.view.onRowSelect(record);
        }
    },

    remove: function(record) {
        //<debug>
        if (!(record.isModel)) {
            Ext.Error.raise('Row selection must be passed a record');
        }
        //</debug>

        var me = this;

        if (me.selectedRecords && me.selectedRecords.byInternalId.get(record.internalId)) {
            me.selectedRecords.remove(record);
            me.view.onRowDeselect(record);

            // Flag when selectAll called.
            // While this is set, a call to contains will add the record to the collection and return true
            me.allSelected = false;
            
            return true;
        }
    },

    /**
     * Returns `true` if the passed {@link Ext.data.Model record} is selected.
     * @param {Ext.data.Model} record The record to test.
     * @return {Boolean} `true` if the passed {@link Ext.data.Model record} is selected.
     */
    contains: function (record) {
        if (!record || !record.isModel) {
            return false;
        }

        var me = this,
            result = false,
            selectedRecords = me.selectedRecords,
            recIndex,
            dragRange;

        // Flag set when selectAll is called in th selModel.
        // This allows buffered stores to treat all *rendered* records
        // as selected, so that the selection model will always encompass
        // What the user *sees* as selected
        if (me.allSelected) {
            me.add(record);
            return true;
        }

        // First check if the record is in our collection
        if (selectedRecords) {
            result = !!selectedRecords.byInternalId.get(record.internalId);
        }

        // If not, check if it is within our drag range if we are in the middle of a drag select
        if (!result && me.rangeStart != null) {
            dragRange = me.getRange();
            recIndex = me.view.dataSource.indexOf(record);
            result = recIndex >= dragRange[0] && recIndex <= dragRange[1];
        }

        return result;
    },

    /**
     * Returns the number of records selected
     * @return {Number} The number of records selected.
     */
    getCount: function() {
        var me = this,
            selectedRecords = me.selectedRecords,
            result = selectedRecords ? selectedRecords.getCount() : 0,
            range = me.getRange(),
            i,
            store = me.view.dataSource;

        // If dragging, add all records in the drag that are *not* in the collection
        for (i = range[0]; i <= range[1]; i++) {
            if (!selectedRecords || !selectedRecords.byInternalId.get(store.getAt(i).internalId)) {
                result++;
            }
        }
        return result;
    },

    /**
     * Returns the records selected.
     * @return {Ext.data.Model[]} The records selected.
     */
    getRecords: function() {
        var selectedRecords = this.selectedRecords;
        return selectedRecords ? selectedRecords.getRange() : [];
    },

    selectAll: function() {
        var me = this;

        me.clear();
        me.setRangeStart(0);
        me.setRangeEnd(me.view.dataSource.getCount() - 1);

        // Adds the records to the collection
        me.addRange();

        // While this is set, a call to contains will add the record to the collection and return true.
        // This is so that buffer rendered stores can utulize row based selectAll
        me.allSelected = true;
    },

    eachRow: function(fn, scope) {
        var selectedRecords = this.selectedRecords;

        if (selectedRecords) {
            selectedRecords.each(fn, scope || this);
        }
    },

    eachColumn: function(fn, scope) {
        var columns = this.view.getVisibleColumnManager().getColumns(),
            len = columns.length,
            i;

        // If we have any records selected, then all visible columns are selected.
        if (this.selectedRecords) {
            for (i = 0; i < len; i++) {
                if (fn.call(this || scope, columns[i], i) === false) {
                    return;
                }
            }
        }
    },

    eachCell: function(fn, scope) {
        var me = this,
            selection = me.selectedRecords,
            view = me.view,
            columns = view.ownerGrid.getVisibleColumnManager().getColumns(),
            colCount,
            i,
            j,
            context,
            range,
            recCount,
            abort = false;

        if (columns) {
            colCount = columns.length;
            context = new Ext.grid.CellContext(view);

            // Use Collection#each instead of copying the entire dataset into an array and iterating that.
            if (selection) {
                selection.each(function(record) {
                    context.setRow(record);
                    for (i = 0; i < colCount; i++) {
                        context.setColumn(columns[i]);
                        if (fn.call(scope || me, context, context.colIdx, context.rowIdx) === false) {
                            abort = true;
                            return false;
                        }
                    }
                });
            }
            
            // If called during a drag select, or SHIFT+arrow select, include the drag range
            if (!abort && me.rangeStart != null) {
                range = me.getRange();
                me.view.dataSource.getRange(range[0], range[1], {
                    callback: function(records) {
                        recCount = records.length;
                        for (i = 0; !abort && i < recCount; i++) {
                            context.setRow(records[i]);
                            for (j = 0; !abort && j < colCount; j++) {
                                context.setColumn(columns[j]);
                                if (fn.call(scope || me, context, context.colIdx, context.rowIdx) === false) {
                                    abort = true;
                                }
                            }
                        }
                    }
                });
            }
        }
    },

    /**
     * This method is called to indicate the start of multiple changes to the selected row set.
     *
     * Internally this method increments a counter that is decremented by `{@link #endUpdate}`. It
     * is important, therefore, that if you call `beginUpdate` directly you match that
     * call with a call to `endUpdate` or you will prevent the collection from updating
     * properly.
     */
    beginUpdate: function() {
        var selectedRecords = this.selectedRecords;
        
        if (selectedRecords) {
            selectedRecords.beginUpdate();
        }
    },

    /**
     * This method is called after modifications are complete on a selected row set. For details
     * see `{@link #beginUpdate}`.
     */
    endUpdate: function() {
        var selectedRecords = this.selectedRecords;
        
        if (selectedRecords) {
            selectedRecords.endUpdate();
        }
    },

    destroy: function() {
        this.selectedRecords = Ext.destroy(this.selectedRecords);
    },

    //-------------------------------------------------------------------------

    privates: {
        /**
         * @private
         */
        clear: function() {
            var me = this,
                view = me.view;

            // Flag when selectAll called.
            // While this is set, a call to contains will add the record to the collection and return true
            me.allSelected = false;

            if (me.selectedRecords) {
                me.eachRow(function(record) {
                    view.onRowDeselect(record);
                });
                me.selectedRecords.clear();
            }
        },

        /**
         * @return {Boolean}
         * @private
         */
        isAllSelected: function() {
            // This branch has a flag because it encompasses a possibly buffered store,
            // where the full dataset might not be present, so a flag indicates that all
            // records are selected even as they flow into or out of the buffered page cache.
            return !!this.allSelected;
        },

        /**
         * Used during drag/shift+downarrow range selection on start.
         * @param {Number} The start row index of the row drag selection.
         * @private
         */
        setRangeStart: function(start) {

            // Flag when selectAll called.
            // While this is set, a call to contains will add the record to the collection and return true
            this.allSelected = false;

            this.rangeStart = this.rangeEnd = start;
            this.view.onRowSelect(start);
        },

        /**
         * Used during drag/shift+downarrow range selection on change of row.
         * @param {Number} The end row index of the row drag selection.
         * @private
         */
        setRangeEnd: function(end) {
            var me = this,
                range,
                lastRange,
                rowIdx,
                row,
                view = me.view,
                store = view.dataSource,
                rows = view.all,
                selected = me.selectedRecords,
                rec;

            // Update the range as requested, then calculate the
            // range in lowest index first form
            me.rangeEnd = end;
            range = me.getRange();
            lastRange = me.lastRange || range;

            // Loop through the union of last range and current range
            for (rowIdx = Math.max(Math.min(range[0], lastRange[0]), rows.startIndex),
                end = Math.min(Math.max(range[1], lastRange[1]), rows.endIndex); rowIdx <= end; rowIdx++) {
                row = rows.item(rowIdx);

                // If we are outside the current range, deselect
                if (rowIdx < range[0] || rowIdx > range[1]) {
                    // If we are deselecting, also remove from collection
                    if (selected && (rec = selected.byInternalId.get(store.getAt(rowIdx).internalId))) {
                        selected.remove(rec);
                    }
                    view.onRowDeselect(rowIdx);
                } else {
                    view.onRowSelect(rowIdx);
                }
            }

            me.lastRange = range;
        },

        /**
         * @return {Number[]}
         * @private
         */
        getRange: function() {
            var start = this.rangeStart,
                end = this.rangeEnd;

            if (start == null) {
                return [0, -1];
            } else if (start <= end ){
                return [start, end];
            }
            return [end, start];
        },

        /**
         * Returns the size of the mousedown+drag, or SHIFT+arrow selection range.
         * @return {Number}
         * @private
         */
        getRangeSize: function() {
            var range = this.getRange();
            return range[1] - range[0] + 1;
        },

        /**
         * @return {Ext.util.Collection}
         * @private
         */
        createRecordCollection: function() {
            var result = new Ext.util.Collection({
                    rootProperty: 'data',
                    extraKeys: {
                        byInternalId: {
                            rootProperty: false,
                            property: 'internalId'
                        }
                    }
                });

            return result;
        },

        /**
         * Called at the end of a drag, or shift+downarrow row range select.
         * The record range delineated by the start and end row indices is added to the selected Collection.
         * @private
         */
        addRange: function() {
            var me = this,
                range,
                selection;

            if (me.rangeStart != null) {
                range = me.getRange();
                selection = me.selectedRecords || (me.selectedRecords = me.createRecordCollection());
                me.view.dataSource.getRange(range[0], range[1], {
                    callback: function(range) {
                        selection.add.apply(selection, range);
                    }
                });

                // Clear the drag range
                me.setRangeStart(me.lastRange = null);
            }
        }
    }
});
