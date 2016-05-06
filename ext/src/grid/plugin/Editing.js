/**
 * This class provides an abstract grid editing plugin on selected {@link Ext.grid.column.Column columns}.
 * The editable columns are specified by providing an {@link Ext.grid.column.Column#editor editor}
 * in the {@link Ext.grid.column.Column column configuration}.
 *
 * **Note:** This class should not be used directly. See {@link Ext.grid.plugin.CellEditing} and
 * {@link Ext.grid.plugin.RowEditing}.
 */
Ext.define('Ext.grid.plugin.Editing', {
    extend: 'Ext.plugin.Abstract',
    alias: 'editing.editing',

    requires: [
        'Ext.grid.column.Column',
        'Ext.util.KeyNav',
        // Requiring Ext.form.field.Base and Ext.view.Table ensures that grid editor sass
        // variables can derive from both form field vars and grid vars in the neutral theme
        'Ext.form.field.Base',
        'Ext.view.Table'
    ],

    mixins: {
        observable: 'Ext.util.Observable'
    },

    /**
     * @cfg {Number} clicksToEdit
     * The number of clicks on a grid required to display the editor.
     * The only accepted values are **1** and **2**.
     */
    clicksToEdit: 2,

    /**
     * @cfg {String} triggerEvent
     * The event which triggers editing. Supersedes the {@link #clicksToEdit} configuration. May be one of:
     *
     *  * cellclick
     *  * celldblclick
     *  * cellfocus
     *  * rowfocus
     */
    triggerEvent: undefined,

    /**
     * @property {Boolean} editing
     * Set to `true` while the editing plugin is active and an Editor is visible.
     */

    relayedEvents: [
        'beforeedit',
        'edit',
        'validateedit',
        'canceledit'
    ],

    /**
     * @cfg {String} default UI for editor fields
     */
    defaultFieldUI: 'default',

    // @private
    defaultFieldXType: 'textfield',

    // cell, row, form
    editStyle: '',

    /**
     * @event beforeedit
     * Fires before editing is triggered. Return false from event handler to stop the editing.
     *
     * @param {Ext.grid.plugin.Editing} editor
     * @param {Object} context The editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The Column being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     *  @param {Boolean}                context.cancel Set this to `true` to cancel the edit or return false from your handler.
     *  @param {Mixed}                  context.originalValue Alias for value (only when using {@link Ext.grid.plugin.CellEditing CellEditing}).
     */

    /**
     * @event edit
     * Fires after editing. Usage example:
     *
     *     grid.on('edit', function(editor, e) {
     *         // commit the changes right after editing finished
     *         e.record.commit();
     *     });
     *
     * @param {Ext.grid.plugin.Editing} editor
     * @param {Object} context The editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The Column being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     */

    /**
     * @event validateedit
     * Fires after editing, but before the value is set in the record. Return false from event handler to
     * cancel the change.
     *
     * Usage example showing how to remove the red triangle (dirty record indicator) from some records (not all). By
     * observing the grid's validateedit event, it can be cancelled if the edit occurs on a targeted row (for example)
     * and then setting the field's new value in the Record directly:
     *
     *     grid.on('validateedit', function (editor, context) {
             *         var myTargetRow = 6;
             *
             *         if (context.rowIdx === myTargetRow) {
             *             context.record.data[context.field] = context.value;
             *         }
             *     });
     *
     * @param {Ext.grid.plugin.Editing} editor
     * @param {Object} context The editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The Column being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     */

    /**
     * @event canceledit
     * Fires when the user started editing but then cancelled the edit.
     * @param {Ext.grid.plugin.Editing} editor
     * @param {Object} context The editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The Column being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     */

    constructor: function(config) {
        var me = this;

        me.callParent([config]);
        me.mixins.observable.constructor.call(me);
        // TODO: Deprecated, remove in 5.0
        me.on("edit", function(editor, e) {
            me.fireEvent("afteredit", editor, e);
        });
    },

    // @private
    init: function(grid) {
        var me = this;

        me.grid = grid;
        me.view = grid.view;
        me.initEvents();

        // Set up fields at render and reconfigure time
        if (grid.rendered) {
            me.setup();
        } else {
            me.mon(grid, {
                beforereconfigure: me.onBeforeReconfigure,
                reconfigure: me.onReconfigure,
                scope: me,
                beforerender: {
                    fn: me.onBeforeRender,
                    single: true,
                    scope: me
                }
            });
        }

        grid.relayEvents(me, me.relayedEvents);

        // If the editable grid is owned by a lockable, relay up another level.
        if (me.grid.ownerLockable) {
            me.grid.ownerLockable.relayEvents(me, me.relayedEvents);
        }
        // Marks the grid as editable, so that the SelectionModel
        // can make appropriate decisions during navigation
        grid.isEditable = true;
        grid.editingPlugin = grid.view.editingPlugin = me;
    },

    onBeforeReconfigure: function() {
        this.reconfiguring = true;
    },

    /**
     * Fires after the grid is reconfigured
     * @protected
     */
    onReconfigure: function() {
        this.setup();
        delete this.reconfiguring;
    },

    onBeforeRender: function() {
        this.setup();
    },

    setup: function() {
        // In a Lockable assembly, the owner's view aggregates all grid columns across both sides.
        // We grab all columns here.
        this.initFieldAccessors(this.grid.getTopLevelColumnManager().getColumns());
    },

    /**
     * @private
     * Component calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        var me = this,
            grid = me.grid;

        Ext.destroy(me.keyNav);
        // Clear all listeners from all our events, clear all managed listeners we added to other Observables
        me.clearListeners();

        if (grid) {
            grid.editingPlugin = grid.view.editingPlugin = me.grid = me.view = me.editor = me.keyNav = null;
        }
    },

    // @private
    getEditStyle: function() {
        return this.editStyle;
    },

    // @private
    initFieldAccessors: function(columns) {
        // If we have been passed a group header, process its leaf headers
        if (columns.isGroupHeader) {
            columns = columns.getGridColumns();
        }

        // Ensure we are processing an array
        else if (!Ext.isArray(columns)) {
            columns = [columns];
        }

        var me = this,
            c,
            cLen = columns.length,
            getEditor = function(record, defaultField) {
                return me.getColumnField(this, defaultField);
            },
            hasEditor = function() {
                return me.hasColumnField(this);
            },
            setEditor = function(field) {
                me.setColumnField(this, field);
            },
            column;

        for (c = 0; c < cLen; c++) {
            column = columns[c];

            if (!column.getEditor) {
                column.getEditor = getEditor;
            }
            if (!column.hasEditor) {
                column.hasEditor = hasEditor;
            }
            if (!column.setEditor) {
                column.setEditor = setEditor;
            }
        }
    },

    // @private
    removeFieldAccessors: function(columns) {
        // If we have been passed a group header, process its leaf headers
        if (columns.isGroupHeader) {
            columns = columns.getGridColumns();
        }

        // Ensure we are processing an array
        else if (!Ext.isArray(columns)) {
            columns = [columns];
        }

        var c,
            cLen = columns.length,
            column;

        for (c = 0; c < cLen; c++) {
            column = columns[c];
            column.getEditor = column.hasEditor = column.setEditor = column.field = column.editor = null;
        }
    },

    // @private
    // remaps to the public API of Ext.grid.column.Column.getEditor
    getColumnField: function(columnHeader, defaultField) {
        var me = this,
            field = columnHeader.field;

        if (!(field && field.isFormField)) {
            field = columnHeader.field = me.createColumnField(columnHeader, defaultField);
        }

        if (field && field.ui === 'default' && !field.hasOwnProperty('ui')) {
            field.ui = me.defaultFieldUI;
        }
        return field;
    },

    // @private
    // remaps to the public API of Ext.grid.column.Column.hasEditor
    hasColumnField: function(columnHeader) {
        return !!(columnHeader.field && columnHeader.field.isComponent);
    },

    // @private
    // remaps to the public API of Ext.grid.column.Column.setEditor
    setColumnField: function(columnHeader, field) {
        columnHeader.field = field;
        columnHeader.field = this.createColumnField(columnHeader);
    },

    createColumnField: function (column, defaultField) {
        var field = column.field,
            dataIndex;

        if (!field && column.editor) {
            field = column.editor;
            column.editor = null;
        }

        if (!field && defaultField) {
            field = defaultField;
        }

        if (field) {
            dataIndex = column.dataIndex;

            if (field.isComponent) {
                field.column = column;
            } else {
                if (Ext.isString(field)) {
                    field = {
                        name: dataIndex,
                        xtype: field,
                        column: column
                    };
                } else {
                    field = Ext.apply({
                        name: dataIndex,
                        column: column
                    }, field);
                }
                field = Ext.ComponentManager.create(field, this.defaultFieldXType);
            }

            // Stamp on the dataIndex which will serve as a reliable lookup regardless
            // of how the editor was defined (as a config or as an existing component).
            // See EXTJSIV-11650.
            field.dataIndex = dataIndex;

            field.isEditorComponent = true;
            column.field = field;
        }
        return field;
    },

    // @private
    initEvents: function() {
        var me = this;
        me.initEditTriggers();
        me.initCancelTriggers();
    },

    // @abstract
    initCancelTriggers: Ext.emptyFn,

    // @private
    initEditTriggers: function() {
        var me = this,
            view = me.view;

        // Listen for the edit trigger event.
        if (me.triggerEvent === 'cellfocus') {
            me.mon(view, 'cellfocus', me.onCellFocus, me);
        } else if (me.triggerEvent === 'rowfocus') {
            me.mon(view, 'rowfocus', me.onRowFocus, me);
        } else {

            // Prevent the View from processing when the SelectionModel focuses.
            // This is because the SelectionModel processes the mousedown event, and
            // focusing causes a scroll which means that the subsequent mouseup might
            // take place at a different document XY position, and will therefore
            // not trigger a click.
            // This Editor must call the View's focusCell method directly when we recieve a request to edit
            if (view.getSelectionModel().isCellModel) {
                view.onCellFocus = me.beforeViewCellFocus.bind(me);
            }

            // Listen for whichever click event we are configured to use
            me.mon(view, me.triggerEvent || ('cell' + (me.clicksToEdit === 1 ? 'click' : 'dblclick')), me.onCellClick, me);
        }

        // add/remove header event listeners need to be added immediately because
        // columns can be added/removed before render
        me.initAddRemoveHeaderEvents();

        // Attach new bindings to the View's NavigationModel which processes cellkeydown events.
        me.view.getNavigationModel().addKeyBindings({
            enter: me.onEnterKey,
            esc: me.onEscKey,
            scope: me
        });
    },

    // Override of View's method so that we can pre-empt the View's processing if the view is being triggered by a mousedown
    beforeViewCellFocus: function(position) {
        // Pass call on to view if the navigation is from the keyboard, or we are not going to edit this cell.
        if (this.view.selModel.keyNavigation || !this.editing || !this.isCellEditable || !this.isCellEditable(position.row, position.columnHeader)) {
            this.view.focusCell.apply(this.view, arguments);
        }
    },

    // @private Used if we are triggered by the rowfocus event
    onRowFocus: function(record, row, rowIdx) {
        this.startEdit(row, 0);
    },

    // @private Used if we are triggered by the cellfocus event
    onCellFocus: function(record, cell, position) {
        this.startEdit(position.row, position.column);
    },

    // @private Used if we are triggered by a cellclick event
    // *IMPORTANT* Due to V4.0.0 history, the colIdx here is the index within ALL columns, including hidden.
    onCellClick: function(view, cell, colIdx, record, row, rowIdx, e) {
        // Make sure that the column has an editor.  In the case of CheckboxModel,
        // calling startEdit doesn't make sense when the checkbox is clicked.
        // Also, cancel editing if the element that was clicked was a tree expander.
        var expanderSelector = view.expanderSelector,
            // Use getColumnManager() in this context because colIdx includes hidden columns.
            columnHeader = view.ownerCt.getColumnManager().getHeaderAtIndex(colIdx),
            editor = columnHeader.getEditor(record);

        if (this.shouldStartEdit(editor) && (!expanderSelector || !e.getTarget(expanderSelector))) {
            this.startEdit(record, columnHeader);
        }
    },

    initAddRemoveHeaderEvents: function(){
        var me = this,
            headerCt = me.grid.headerCt;

        me.mon(headerCt, {
            scope: me,
            add: me.onColumnAdd,
            columnmove: me.onColumnMove,
            beforedestroy: me.beforeGridHeaderDestroy
        });
    },

    // @private
    onColumnAdd: function(ct, column) {
        this.initFieldAccessors(column);
    },

    // Template method which may be implemented in subclasses (RowEditing and CellEditing)
    onColumnMove: Ext.emptyFn,

    // @private
    onEnterKey: function(e) {
        var me = this,
            grid = me.grid,
            navModel,
            record,
            pos,
            column,
            targetComponent;

        if (me.editing) {
            targetComponent = Ext.getCmp(e.getTarget().getAttribute('componentId'));

            // ENTER when a picker is expanded does not complete the edit
            if (!(targetComponent && targetComponent.isPickerField && targetComponent.isExpanded)) {
                me.completeEdit();
            }
        }
        else if (e.view === me.view) {
            navModel = grid.getView().getNavigationModel();

            // Calculate editing start position from NavigationModel
            pos = navModel.getPosition();
            if (pos) {
                record = pos.record;
                column = pos.column;
            }

            // If there was a selection to provide a starting context...
            if (record && column) {
                me.startEdit(record, column);
            }
        }
    },

    // @private
    onEscKey: function(e) {
        if (this.editing) {
            var targetComponent = Ext.getCmp(e.getTarget().getAttribute('componentId'));

            // ESCAPE when a picker is expanded does not cancel the edit
            if (!(targetComponent && targetComponent.isPickerField && targetComponent.isExpanded)) {
                return this.cancelEdit();
            }
        }
    },

    /**
     * @private
     * @template
     * Template method called before editing begins.
     * @param {Object} context The current editing context
     * @return {Boolean} Return false to cancel the editing process
     */
    beforeEdit: Ext.emptyFn,

    shouldStartEdit: function(editor) {
        return !!editor;
    },

    /**
     * Starts editing the specified record, using the specified Column definition to define which field is being edited.
     * @param {Ext.data.Model/Number} record The Store data record which backs the row to be edited, or index of the record in Store.
     * @param {Ext.grid.column.Column/Number} columnHeader The Column object defining the column to be edited, or index of the column.
     */
    startEdit: function(record, columnHeader) {
        var me = this,
            context,
            layoutView = me.grid.lockable ? me.grid : me.view;

        // The view must have had a layout to show the editor correctly, defer until that time.
        // In case a grid's startup code invokes editing immediately.
        if (!layoutView.componentLayoutCounter) {
            layoutView.on({
                boxready: Ext.Function.bind(me.startEdit, me, [record, columnHeader]),
                single: true
            });
            return false;
        }

        // If disabled or grid collapsed, or view not truly visible, don't even calculate a context - we cannot edit
        if (me.disabled || me.grid.collapsed || !me.grid.view.isVisible(true)) {
            return false;
        }

        context = me.getEditingContext(record, columnHeader);
        if (context == null) {
            return false;
        }
        if (!me.preventBeforeCheck) {
            if (me.beforeEdit(context) === false || me.fireEvent('beforeedit', me, context) === false || context.cancel) {
                return false;
            }
        }

        return context;
    },

    /**
     * @private
     * Collects all information necessary for any subclasses to perform their editing functions.
     * @param {Ext.data.Model/Number} record The record or record index to edit.
     * @param {Ext.grid.column.Column/Number} columnHeader The column of column index to edit.
     * @return {Ext.grid.CellContext/undefined} The editing context based upon the passed record and column
     */
    getEditingContext: function(record, columnHeader) {
        var me = this,
            grid = me.grid,
            colMgr = grid.visibleColumnManager,
            view,
            gridRow,
            rowIdx, colIdx,
            result;

        // They've asked to edit by column number.
        // Note that in a locked grid, the columns are enumerated in a unified set for this purpose.
        if (Ext.isNumber(columnHeader)) {
            columnHeader = colMgr.getHeaderAtIndex(columnHeader);
        }

        // No corresponding column. Possible if all columns have been moved to the other side of a lockable grid pair
        if (!columnHeader) {
            return;
        }

        // Coerce the column to the closest visible column
        if (columnHeader.hidden) {
            columnHeader = columnHeader.next(':not([hidden])') || columnHeader.prev(':not([hidden])');
        }

        // Navigate to the view which the column header relates to.
        view = columnHeader.getRootHeaderCt().view;

        gridRow = view.getRow(record);

        // An intervening listener may have deleted the Record.
        if (!gridRow) {
            return;
        }

        colIdx = colMgr.getHeaderIndex(columnHeader);

        if (Ext.isNumber(record)) {
            // look up record if numeric row index was passed
            rowIdx = record;
            record = view.getRecord(gridRow);
        } else {
            rowIdx = view.indexOf(gridRow);
        }

        // The record may be removed from the store but the view
        // not yet updated, so check it exists
        if (!record) {
            return;
        }

        // Create a new CellContext
        result = new Ext.grid.CellContext(view).setAll(view, rowIdx, colIdx, record, columnHeader);

        // Add extra Editing information
        result.grid = grid;
        result.store = view.dataSource;
        result.field = columnHeader.dataIndex;
        result.value = result.originalValue = record.get(columnHeader.dataIndex);
        result.row = gridRow;
        result.node = view.getNode(record);
        
        return result;
    },

    /**
     * Cancels any active edit that is in progress.
     */
    cancelEdit: function() {
        var me = this;

        me.editing = false;
        me.fireEvent('canceledit', me, me.context);
    },

    /**
     * Completes the edit if there is an active edit in progress.
     */
    completeEdit: function() {
        var me = this;

        if (me.editing && me.validateEdit()) {
            me.fireEvent('edit', me, me.context);
        }

        me.context = null;
        me.editing = false;
    },

    // @abstract
    validateEdit: function() {
        var me = this,
            context = me.context;

        return me.fireEvent('validateedit', me, context) !== false && !context.cancel;
    }
});
