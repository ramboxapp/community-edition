/**
 * RowModel Selection Model implements row based navigation for
 * {@link Ext.grid.Panel grid panels} via user input. RowModel is the default grid selection
 * model and, generally, will not need to be specified.
 *
 * By utilizing the selModel config as an object, you may also set configurations for:
 *
 * + {@link #mode} - Specifies whether user may select multiple rows or single rows
 * + {@link #allowDeselect} - Specifies whether user may deselect records when in SINGLE mode
 * + {@link #ignoreRightMouseSelection} - Specifies whether user may ignore right clicks
 * for selection purposes
 *
 * In the example below, we've enabled MULTI mode. This means that multiple rows can be selected.
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields: ['name', 'email', 'phone'],
 *         data: [
 *             { name: 'Lisa', email: 'lisa@simpsons.com', phone: '555-111-1224' },
 *             { name: 'Bart', email: 'bart@simpsons.com', phone: '555-222-1234' },
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
 *         selModel: {
 *            selType: 'rowmodel', // rowmodel is the default selection model
 *            mode: 'MULTI' // Allows selection of multiple rows
 *         },
 *         columns: [
 *             { text: 'Name',  dataIndex: 'name'  },
 *             { text: 'Email', dataIndex: 'email', flex: 1 },
 *             { text: 'Phone', dataIndex: 'phone' }
 *         ]
 *     });
 */
Ext.define('Ext.selection.RowModel', {
    extend: 'Ext.selection.DataViewModel',
    alias: 'selection.rowmodel',
    requires: [
        'Ext.grid.CellContext'
    ],


    /**
     * @cfg {Boolean} enableKeyNav
     *
     * Turns on/off keyboard navigation within the grid.
     */
    enableKeyNav: true,

    /**
     * @event beforedeselect
     * Fired before a record is deselected. If any listener returns false, the
     * deselection is cancelled.
     * @param {Ext.selection.RowModel} this
     * @param {Ext.data.Model} record The deselected record
     * @param {Number} index The row index deselected
     */

    /**
     * @event beforeselect
     * Fired before a record is selected. If any listener returns false, the
     * selection is cancelled.
     * @param {Ext.selection.RowModel} this
     * @param {Ext.data.Model} record The selected record
     * @param {Number} index The row index selected
     */

    /**
     * @event deselect
     * Fired after a record is deselected
     * @param {Ext.selection.RowModel} this
     * @param {Ext.data.Model} record The deselected record
     * @param {Number} index The row index deselected
     */

    /**
     * @event select
     * Fired after a record is selected
     * @param {Ext.selection.RowModel} this
     * @param {Ext.data.Model} record The selected record
     * @param {Number} index The row index selected
     */

    isRowModel: true,

    /**
     * @inheritdoc
     */
    deselectOnContainerClick: false,

    onUpdate: function(record) {
        var me = this,
            view = me.view,
            index;

        if (view && me.isSelected(record)) {
            index = view.indexOf(record);
            view.onRowSelect(index);
            if (record === me.lastFocused) {
                view.onRowFocus(index, true);
            }
        }
    },

    // Allow the GridView to update the UI by
    // adding/removing a CSS class from the row.
    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
        var me      = this,
            views   = me.views || [me.view],
            viewsLn = views.length,
            recordIndex = me.store.indexOf(record),
            eventName = isSelected ? 'select' : 'deselect',
            i, view;

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record, recordIndex)) !== false &&
                commitFn() !== false) {

            // Selection models can handle more than one view
            for (i = 0; i < viewsLn; i++) {
                view = views[i];
                recordIndex  = view.indexOf(record);

                // The record might not be rendered due to either buffered rendering,
                // or removal/hiding of all columns (eg empty locked side).
                if (view.indexOf(record) !== -1) {
                    if (isSelected) {
                        view.onRowSelect(recordIndex, suppressEvent);
                    } else {
                        view.onRowDeselect(recordIndex, suppressEvent);
                    }
                }
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record, recordIndex);
            }
        }
    },

    onEditorTab: function(editingPlugin, e) {
        var me = this,
            view = editingPlugin.context.view,
            record = editingPlugin.getActiveRecord(),
            position = editingPlugin.context,
            direction = e.shiftKey ? 'left' : 'right',
            lastPos;

        // We want to continue looping while:
        // 1) We have a valid position
        // 2) There is no editor at that position
        // 3) There is an editor, but editing has been cancelled (veto event)

        do {
            lastPos = position;
            position  = view.walkCells(position, direction, e, me.preventWrap);
            if (lastPos && lastPos.isEqual(position)) {
                // If we end up with the same result twice, it means that we weren't able to progress
                // via walkCells, for example if the remaining records are non-record rows, so gracefully
                // fall out here.
                return;
            }
        } while (position && (!position.column.getEditor(record) || !editingPlugin.startEditByPosition(position)));
    },

    /**
     * Returns position of the first selected cell in the selection in the format {row: row, column: column}
     * @deprecated 5.0.1 Use the {@link Ext.view.Table#getNavigationModel NavigationModel} instead.
     */
    getCurrentPosition: function() {
        var firstSelection = this.selected.getAt(0);
        if (firstSelection) {
            return new Ext.grid.CellContext(this.view).setPosition(this.store.indexOf(firstSelection), 0);
        }
    },

    selectByPosition: function (position, keepExisting) {
        if (!position.isCellContext) {
            position = new Ext.grid.CellContext(this.view).setPosition(position.row, position.column);
        }
        this.select(position.record, keepExisting);
    },

    /**
     * Selects the record immediately following the currently selected record.
     * @param {Boolean} [keepExisting] True to retain existing selections
     * @param {Boolean} [suppressEvent] Set to false to not fire a select event
     * @return {Boolean} `true` if there is a next record, else `false`
     */
    selectNext: function(keepExisting, suppressEvent) {
        var me = this,
            store = me.store,
            selection = me.getSelection(),
            record = selection[selection.length - 1],
            index = me.view.indexOf(record) + 1,
            success;

        if (index === store.getCount() || index === 0) {
            success = false;
        } else {
            me.doSelect(index, keepExisting, suppressEvent);
            success = true;
        }
        return success;
    },

    /**
     * Selects the record that precedes the currently selected record.
     * @param {Boolean} [keepExisting] True to retain existing selections
     * @param {Boolean} [suppressEvent] Set to false to not fire a select event
     * @return {Boolean} `true` if there is a previous record, else `false`
     */
    selectPrevious: function(keepExisting, suppressEvent) {
        var me = this,
            selection = me.getSelection(),
            record = selection[0],
            index = me.view.indexOf(record) - 1,
            success;

        if (index < 0) {
            success = false;
        } else {
            me.doSelect(index, keepExisting, suppressEvent);
            success = true;
        }
        return success;
    },

    isRowSelected: function(record) {
        return this.isSelected(record);
    },

    isCellSelected: function(view, record, columnHeader) {
        return this.isSelected(record);
    } 
});
