/**
 * A selection model for {@link Ext.grid.Panel grid panels} which allows selection of a single cell at a time.
 *
 * Implements cell based navigation via keyboard.
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields: ['name', 'email', 'phone'],
 *         data: [
 *             { name: 'Lisa', email: 'lisa@simpsons.com',  phone: '555-111-1224' },
 *             { name: 'Bart', email: 'bart@simpsons.com',  phone: '555-222-1234' },
 *             { name: 'Homer', email: 'homer@simpsons.com', phone: '555-222-1244' },
 *             { name: 'Marge', email: 'marge@simpsons.com', phone: '555-222-1254' }
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Simpsons',
 *         store: store,
 *         width: 400,
 *         renderTo: Ext.getBody(),
 *         columns: [
 *             { text: 'Name',  dataIndex: 'name' },
 *             { text: 'Email', dataIndex: 'email', flex: 1 },
 *             { text: 'Phone', dataIndex: 'phone' }
 *         ],
 *         selModel: 'cellmodel'
 *     });
 */
Ext.define('Ext.selection.CellModel', {
    extend: 'Ext.selection.DataViewModel',
    alias: 'selection.cellmodel',
    requires: [
        'Ext.grid.CellContext'
    ],

    /**
     * @cfg {"SINGLE"} mode
     * Mode of selection.  Valid values are:
     *
     * - **"SINGLE"** - Only allows selecting one item at a time. This is the default.
     */


    isCellModel: true,

    /**
     * @inheritdoc
     */
    deselectOnContainerClick: false,

    /**
     * @cfg {Boolean} enableKeyNav
     * Turns on/off keyboard navigation within the grid.
     */
    enableKeyNav: true,

    /**
     * @cfg {Boolean} preventWrap
     * Set this configuration to true to prevent wrapping around of selection as
     * a user navigates to the first or last column.
     */
    preventWrap: false,

    /**
     * @event deselect
     * Fired after a cell is deselected
     * @param {Ext.selection.CellModel} this
     * @param {Ext.data.Model} record The record of the deselected cell
     * @param {Number} row The row index deselected
     * @param {Number} column The column index deselected
     */

    /**
     * @event select
     * Fired after a cell is selected
     * @param {Ext.selection.CellModel} this
     * @param {Ext.data.Model} record The record of the selected cell
     * @param {Number} row The row index selected
     * @param {Number} column The column index selected
     */

    bindComponent: function(view) {
        var me = this,
            grid;

        // Unbind from a view
        if (me.view && me.gridListeners) {
            me.gridListeners.destroy();
        }

        // DataViewModel's bindComponent
        me.callParent([view]);

        if (view) {
            // view.grid is present during View construction, before the view has been
            // added as a child of the Panel, and an upward link it still needed.
            grid = view.grid || view.ownerCt;

            if (grid.optimizedColumnMove !== false) {
                me.gridListeners = grid.on({
                    columnmove: me.onColumnMove,
                    scope: me,
                    destroyable: true
                });
            }
        }
    },

    getViewListeners: function() {
        var result = this.callParent();
        result.refresh = this.onViewRefresh;
        return result;
    },

    getHeaderCt: function() {
        var selection = this.navigationModel.getPosition(),
            view = selection ? selection.view : this.primaryView;

        return view.headerCt;
    },

    // Selection blindly follows focus. For now.
    onNavigate: function(e) {
        // It was a navigate out event.
        if (!e.record) {
            return;
        }

        this.setPosition(e.position);
    },

    selectWithEvent: function(record, e) {
        this.select(record);
    },
    /** 
     * Selects a cell by row / column.
     *
     *     var grid = Ext.create('Ext.grid.Panel', {
     *         title: 'Simpsons',
     *         store: {
     *             fields: ['name', 'email', 'phone'],
     *             data: [{
     *                 name: "Lisa",
     *                 email: "lisa@simpsons.com",
     *                 phone: "555-111-1224"
     *             }]
     *         },
     *         columns: [{
     *             text: 'Name',
     *             dataIndex: 'name'
     *         }, {
     *             text: 'Email',
     *             dataIndex: 'email',
     *             hidden: true
     *         }, {
     *             text: 'Phone',
     *             dataIndex: 'phone',
     *             flex: 1
     *         }],
     *         height: 200,
     *         width: 400,
     *         renderTo: Ext.getBody(),
     *         selType: 'cellmodel',
     *         tbar: [{
     *             text: 'Select position Object',
     *             handler: function() {
     *                 grid.getSelectionModel().select({
     *                     row: grid.getStore().getAt(0),
     *                     column: grid.down('gridcolumn[dataIndex=name]')
     *                 });
     *             }
     *         }, {
     *             text: 'Select position by Number',
     *             handler: function() {
     *                 grid.getSelectionModel().select({
     *                     row: 0,
     *                     column: 1
     *                 });
     *             }
     *         }]
     *     });
     *
     * @param {Object} pos An object with row and column properties
     * @param {Ext.data.Model/Number} pos.row
     *   A record or index of the record (starting at 0)
     * @param {Ext.grid.column.Column/Number} pos.column
     *   A column or index of the column (starting at 0).  Includes visible columns only.
     */
    select: function(pos, /* private */ keepExisting, suppressEvent) {
        var me = this,
            row,
            oldPos = me.getPosition(),
            store = me.view.store;

        if (pos || pos === 0) {
            if (pos.isModel) {
                row = store.indexOf(pos);
                if (row !== -1) {
                    pos = {
                        row: row,
                        column: oldPos ? oldPos.column : 0
                    };
                } else {
                    pos = null;
                } 
            } else if (typeof pos === 'number') {
                pos = {
                    row: pos,
                    column: 0
                };
            }
        } 

        if (pos) {
            me.selectByPosition(pos, suppressEvent);   
        } else {
            me.deselect();
        }
    },

    /**
     * Returns the current position in the format {row: row, column: column}
     * @deprecated 5.0.1 This API uses column indices which include hidden columns in the count. Use {@link #getPosition} instead.
     */
    getCurrentPosition: function() {
        // If it's during a select, return nextSelection since we buffer
        // the real selection until after the event fires
        var position = this.selecting ? this.nextSelection : this.selection;

        // This is the previous Format of the private CellContext class which was used here.
        // Do not return a CellContext so that if this object is passed into setCurrentPosition, it will be
        // read in the legacy (including hidden columns) way.
        return position ? {
            view: position.view,
            record: position.record,
            row: position.rowIdx,
            columnHeader: position.column,
            // IMPORTANT: The historic API for columns has been to include hidden columns
            // in the index. So we must report the index of the column in the "all" ColumnManager.
            column: position.view.getColumnManager().indexOf(position.column)
        } : position;
    },

    /**
     * Returns the current position in the format {row: row, column: column}
     * @return {Ext.grid.CellContext} A CellContext object describing the current cell.
     */
    getPosition: function() {
        return (this.selecting ? this.nextSelection : this.selection) || null;
    },

    /**
     * Sets the current position.
     * @deprecated 5.0.1 This API uses column indices which include hidden columns in the count. Use {@link #setPosition} instead.
     * @param {Ext.grid.CellContext/Object} position The position to set. May be an object of the form `{row:1, column:2}`
     * @param {Boolean} suppressEvent True to suppress selection events
     */
    setCurrentPosition: function(pos, suppressEvent, /* private */ preventCheck) {
        if (pos && !pos.isCellContext) {
            pos = new Ext.grid.CellContext(this.view).setPosition({
                row: pos.row,
                // IMPORTANT: The historic API for columns has been to include hidden columns
                // in the index. So we must index into the "all" ColumnManager.
                column: typeof pos.column === 'number' ? this.view.getColumnManager().getColumns()[pos.column] : pos.column
            });
        }
        return this.setPosition(pos, suppressEvent, preventCheck);
    },

    /**
     * Sets the current position.
     *
     * Note that if passing a column index, it is the index within the *visible* column set.
     *
     * @param {Ext.grid.CellContext/Object} position The position to set. May be an object of the form `{row:1, column:2}`
     * @param {Boolean} suppressEvent True to suppress selection events
     */
    setPosition: function(pos, suppressEvent, /* private */ preventCheck) {
        var me = this,
            last = me.selection;

        // Normalize it into an Ext.grid.CellContext if necessary
        if (pos) {
            pos = pos.isCellContext ? pos.clone() : new Ext.grid.CellContext(me.view).setPosition(pos);
        }
        if (!preventCheck && last) {
            // If the position is the same, jump out & don't fire the event
            if (pos && (pos.record === last.record && pos.column === last.column && pos.view === last.view)) {
                pos = null;
            } else {
                me.onCellDeselect(me.selection, suppressEvent);
            }
        }

        if (pos) {
            me.nextSelection = pos;
            // set this flag here so we know to use nextSelection
            // if the node is updated during a select
            me.selecting = true;
            me.onCellSelect(me.nextSelection, suppressEvent);
            me.selecting = false;
            // Deselect triggered by new selection will kill the selection property, so restore it here.
            return (me.selection = pos);
        }
        // <debug>
        // Enforce code correctness in unbuilt source.
        return null;
        // </debug>
    },

    isCellSelected: function(view, row, column) {
        var me = this,
            testPos,
            pos = me.getPosition();

        if (pos && pos.view === view) {
            testPos = new Ext.grid.CellContext(view).setPosition({
                row: row,
                // IMPORTANT: The historic API for columns has been to include hidden columns
                // in the index. So we must index into the "all" ColumnManager.
                column: typeof column === 'number' ? view.getColumnManager().getColumns()[column] : column
            });
            return (testPos.record === pos.record) && (testPos.column === pos.column);
        }
    },

    // Keep selection model in consistent state upon record deletion.
    onStoreRemove: function(store, records, indices) {
        var me = this,
            pos = me.getPosition();

        me.callParent(arguments);
        if (pos && store.isMoving(pos.record)) {
            return;
        }
        
        if (pos && store.getCount() && store.indexOf(pos.record) !== -1) {
            pos.setRow(pos.record);
        } else {
            me.selection = null;
        }
    },
    
    onStoreClear: function() {
        this.callParent(arguments);
        this.selection = null;
    },
    
    onStoreAdd: function() {
        var me = this,
            pos = me.getPosition();

        me.callParent(arguments);
        if (pos) {
            pos.setRow(pos.record);
        } else {
            me.selection = null;
        }
    },

    /**
     * Set the current position based on where the user clicks.
     * @private
     * IMPORTANT* Due to V4.0.0 history, the cellIndex here is the index within ALL columns, including hidden.
     */
    onCellClick: function(view, cell, cellIndex, record, row, recordIndex, e) {
        // Record index will be -1 if the clicked record is a metadata record and not selectable
        if (recordIndex !== -1) {
            this.setPosition(e.position);
        }
    },

    // notify the view that the cell has been selected to update the ui
    // appropriately and bring the cell into focus
    onCellSelect: function(position, supressEvent) {
        if (position && position.rowIdx !== undefined && position.rowIdx > -1) {
            this.doSelect(position.record, /*keepExisting*/false, supressEvent);
        }
    },

    // notify view that the cell has been deselected to update the ui
    // appropriately
    onCellDeselect: function(position, supressEvent) {
        if (position && position.rowIdx !== undefined) {
            this.doDeselect(position.record, supressEvent);
        }
    },

    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
        var me = this,
            pos, eventName, view;

        if (isSelected) {
            pos = me.nextSelection;
            eventName = 'select';
        } else {
            pos = me.selection;
            eventName = 'deselect';
        }

        // CellModel may be shared between two sides of a Lockable.
        // The position must include a reference to the view in which the selection is current.
        // Ensure we use the view specified by the position.
        view = pos.view || me.primaryView;

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record, pos.rowIdx, pos.colIdx)) !== false &&
                commitFn() !== false) {

            if (isSelected) {
                view.onCellSelect(pos);
            } else {
                view.onCellDeselect(pos);
                delete me.selection;
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record, pos.rowIdx, pos.colIdx);
            }
        }
    },

    onEditorTab: function(editingPlugin, e) {
        var me = this,
            direction = e.shiftKey ? 'left' : 'right',
            pos = e.position,
            position  = pos.view.walkCells(pos, direction, e, me.preventWrap);

        // Navigation had somewhere to go.... not hit the buffers.
        if (position) {
            // If we were able to begin editing clear the wasEditing flag. It gets set during navigation off an active edit.
            if (editingPlugin.startEdit(position.record, position.column)) {
                me.wasEditing = false;
            }
            // If we could not continue editing...
            // bring the cell into view.
            // Set a flag that we should go back into editing mode upon next onKeyTab call
            else {
                position.view.getNavigationModel().setPosition(position, null, e);
                me.wasEditing = true;
            }
        }
    },

    refresh: function() {
        var pos = this.getPosition(),
            selRowIdx;

        // Synchronize the current position's row with the row of the last selected record.
        if (pos && (selRowIdx = this.store.indexOf(this.selected.last())) !== -1) {
            pos.rowIdx = selRowIdx;
        }
    },

    /**
     * @private
     * When grid uses {@link Ext.panel.Table#optimizedColumnMove optimizedColumnMove} (the default), this is added as a
     * {@link Ext.panel.Table#columnmove columnmove} handler to correctly maintain the
     * selected column using the same column header.
     * 
     * If optimizedColumnMove === false, (which some grid Features set) then the view is refreshed,
     * so this is not added as a handler because the selected column.
     */
    onColumnMove: function(headerCt, header, fromIdx, toIdx) {
        var grid = headerCt.up('tablepanel');
        if (grid) {
            this.onViewRefresh(grid.view);
        }
    },
    
    onUpdate: function(record) {
        var me = this,
            pos;
            
        if (me.isSelected(record)) {
            pos = me.selecting ? me.nextSelection : me.selection; 
            me.view.onCellSelect(pos);
        }
    },

    onViewRefresh: function(view) {
        var me = this,
            pos = me.getPosition(),
            newPos,
            headerCt = view.headerCt,
            record, column;

        // Re-establish selection of the same cell coordinate.
        // DO NOT fire events because the selected 
        if (pos && pos.view === view) {
            record = pos.record;
            column = pos.column;

            // After a refresh, recreate the selection using the same record and grid column as before
            if (!column.isDescendantOf(headerCt)) {
                // column header is not a child of the header container
                // this happens when the grid is reconfigured with new columns
                // make a best effor to select something by matching on id, then text, then dataIndex
                column = headerCt.queryById(column.id) || 
                               headerCt.down('[text="' + column.text + '"]') ||
                               headerCt.down('[dataIndex="' + column.dataIndex + '"]');
            }

            // If we have a columnHeader (either the column header that already exists in
            // the headerCt, or a suitable match that was found after reconfiguration)
            // AND the record still exists in the store (or a record matching the id of
            // the previously selected record) We are ok to go ahead and set the selection
            if (pos.record) {
                if (column && (view.store.indexOfId(record.getId()) !== -1)) {
                    newPos = new Ext.grid.CellContext(view).setPosition({
                        row: record,
                        column: column
                    });
                    me.setPosition(newPos);
                }
            } else {
                me.selection = null;
            }
        }
    },

    // @private. Used internally by CellEditing
    selectByPosition: function(position, suppressEvent) {
        this.setPosition(position, suppressEvent);
    }
});
