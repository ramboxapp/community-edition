/**
 * The Ext.grid.plugin.CellEditing plugin injects editing at a cell level for a Grid. Only a single
 * cell will be editable at a time. The field that will be used for the editor is defined at the
 * {@link Ext.grid.column.Column#editor editor}. The editor can be a field instance or a field configuration.
 *
 * If an editor is not specified for a particular column then that cell will not be editable and it will
 * be skipped when activated via the mouse or the keyboard.
 *
 * The editor may be shared for each column in the grid, or a different one may be specified for each column.
 * An appropriate field type should be chosen to match the data structure that it will be editing. For example,
 * to edit a date, it would be useful to specify {@link Ext.form.field.Date} as the editor.
 *
 * ## Example
 *
 * A grid with editor for the name and the email columns:
 *
 *     @example
 *     Ext.create('Ext.data.Store', {
 *         storeId: 'simpsonsStore',
 *         fields:[ 'name', 'email', 'phone'],
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
 *         store: Ext.data.StoreManager.lookup('simpsonsStore'),
 *         columns: [
 *             {header: 'Name', dataIndex: 'name', editor: 'textfield'},
 *             {header: 'Email', dataIndex: 'email', flex:1,
 *                 editor: {
 *                     xtype: 'textfield',
 *                     allowBlank: false
 *                 }
 *             },
 *             {header: 'Phone', dataIndex: 'phone'}
 *         ],
 *         selModel: 'cellmodel',
 *         plugins: {
 *             ptype: 'cellediting',
 *             clicksToEdit: 1
 *         },
 *         height: 200,
 *         width: 400,
 *         renderTo: Ext.getBody()
 *     });
 *
 * This requires a little explanation. We're passing in `store` and `columns` as normal, but
 * we also specify a {@link Ext.grid.column.Column#field field} on two of our columns. For the
 * Name column we just want a default textfield to edit the value, so we specify 'textfield'.
 * For the Email column we customized the editor slightly by passing allowBlank: false, which
 * will provide inline validation.
 *
 * To support cell editing, we also specified that the grid should use the 'cellmodel'
 * {@link Ext.grid.Panel#selModel selModel}, and created an instance of the CellEditing plugin,
 * which we configured to activate each editor after a single click.
 *
 */
Ext.define('Ext.grid.plugin.CellEditing', {
    alias: 'plugin.cellediting',
    extend: 'Ext.grid.plugin.Editing',
    requires: ['Ext.grid.CellEditor', 'Ext.util.DelayedTask'],
    lockableScope: 'both',

    /**
     * @event beforeedit
     * Fires before cell editing is triggered. Return false from event handler to stop the editing.
     *
     * @param {Ext.grid.plugin.CellEditing} editor
     * @param {Object} context An editing context event with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The {@link Ext.grid.column.Column} Column} being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     *  @param {Boolean}                context.cancel Set this to `true` to cancel the edit or return false from your handler.
     */
    /**
     * @event edit
     * Fires after a cell is edited. Usage example:
     *
     *     grid.on('edit', function(editor, e) {
     *         // commit the changes right after editing finished
     *         e.record.commit();
     *     });
     *
     * @param {Ext.grid.plugin.CellEditing} editor
     * @param {Object} context An editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The {@link Ext.grid.column.Column} Column} being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     *  @param {Mixed}                  context.originalValue The original value before being edited.
     */
    /**
     * @event validateedit
     * Fires after a cell is edited, but before the value is set in the record. Return false from event handler to
     * cancel the change.
     *
     * Usage example showing how to remove the red triangle (dirty record indicator) from some records (not all). By
     * observing the grid's validateedit event, it can be cancelled if the edit occurs on a targeted row (for
     * example) and then setting the field's new value in the Record directly:
     *
     *     grid.on('validateedit', function(editor, e) {
     *       var myTargetRow = 6;
     *
     *       if (e.row == myTargetRow) {
     *         e.cancel = true;
     *         e.record.data[e.field] = e.value;
     *       }
     *     });
     *
     * @param {Ext.grid.plugin.CellEditing} editor
     * @param {Object} context An editing context with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The {@link Ext.grid.column.Column} Column} being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     *  @param {Mixed}                  context.originalValue The original value before being edited.
     *  @param {Boolean}                context.cancel Set this to `true` to cancel the edit or return false from your handler.
     */
    /**
     * @event canceledit
     * Fires when the user started editing a cell but then cancelled the edit.
     * @param {Ext.grid.plugin.CellEditing} editor
     * @param {Object} context An edit event with the following properties:
     *  @param {Ext.grid.Panel}         context.grid The owning grid Panel.
     *  @param {Ext.data.Model}         context.record The record being edited.
     *  @param {String}                 context.field The name of the field being edited.
     *  @param {Mixed}                  context.value The field's current value.
     *  @param {HTMLElement}            context.row The grid row element.
     *  @param {Ext.grid.column.Column} context.column The {@link Ext.grid.column.Column} Column} being edited.
     *  @param {Number}                 context.rowIdx The index of the row being edited.
     *  @param {Number}                 context.colIdx The index of the column being edited.
     *  @param {Mixed}                  context.originalValue The original value before being edited.
     */

    init: function(grid) {
        var me = this,
            lockingPartner = me.lockingPartner;

        me.callParent(arguments);

        // Share editor apparatus with lockingPartner because columns may move from side to side
        if (lockingPartner) {
            if (lockingPartner.editors) {
                me.editors = lockingPartner.editors;
            } else {
                me.editors = lockingPartner.editors = new Ext.util.MixedCollection(false, function(editor) {
                    return editor.editorId;
                });
            }
        } else {
            me.editors = new Ext.util.MixedCollection(false, function(editor) {
                return editor.editorId;
            });
        }
    },

    // Ensure editors are cleaned up.
    beforeGridHeaderDestroy: function(headerCt) {
        var me = this,
            columns = me.grid.getColumnManager().getColumns(),
            len = columns.length,
            i,
            column,
            editor;

        for (i = 0; i < len; i++) {
            column = columns[i];

            // Try to get the CellEditor which contains the field to destroy the whole assembly
            editor = me.editors.getByKey(column.getItemId());

            // Failing that, the field has not yet been accessed to add to the CellEditor, but must still be destroyed
            if (!editor) {
                // If we have an editor, it will wrap the field which will be destroyed.
                editor = column.editor || column.field;
            }

            // Destroy the CellEditor or field
            Ext.destroy(editor);
            me.removeFieldAccessors(column);
        }
    },

    onReconfigure: function(grid, store, columns){
        // Only reconfigure editors if passed a new set of columns
        if (columns) {
            this.editors.clear();
        }
        this.callParent();    
    },

    /**
     * @private
     * Component calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        var me = this;
        if (me.editors) {
            me.editors.each(Ext.destroy, Ext);
            me.editors.clear();
        }
        me.callParent(arguments);
    },

    // @private
    // Template method called from base class's initEvents
    initCancelTriggers: function() {
        var me   = this,
            grid = me.grid;

        me.mon(grid, {
            columnresize: me.cancelEdit,
            columnmove: me.cancelEdit,
            scope: me
        });
    },

    isCellEditable: function(record, columnHeader) {
        var me = this,
            context = me.getEditingContext(record, columnHeader);

        if (me.grid.view.isVisible(true) && context) {
            columnHeader = context.column;
            record = context.record;
            if (columnHeader && me.getEditor(record, columnHeader)) {
                return true;
            }
        }
    },

    /**
     * Starts editing the specified record, using the specified Column definition to define which field is being edited.
     * @param {Ext.data.Model/Number} record The Store data record which backs the row to be edited, or index of the record.
     * @param {Ext.grid.column.Column/Number} columnHeader The Column object defining the column to be edited, or index of the column.
     * @return {Boolean} `true` if editing was started, `false` otherwise.
     */
    startEdit: function(record, columnHeader, /* private */ context) {
        var me = this,
            useCurrentActiveEditor,
            isFieldEditable,
            currentActiveEditor,
            newEditor;

        if (!context) {
            me.preventBeforeCheck = true;
            context = me.callParent(arguments);
            delete me.preventBeforeCheck;
            if (context === false) {
                return false;
            }
        }

        // Cancel editing if EditingContext could not be found (possibly because record has been deleted by an intervening listener),
        // or if the grid view is not currently visible
        if (context && context.view.isVisible(true)) {

            record = context.record;
            columnHeader = context.column;

            // If there is an editor for this column,
            // allow vetoing, or setting a new editor *before* we call getEditor
            isFieldEditable = (columnHeader && columnHeader.getEditor(record)) && !(me.beforeEdit(context) === false || me.fireEvent('beforeedit', me, context) === false || context.cancel);

            if (isFieldEditable) {
                currentActiveEditor = me.getActiveEditor();
                newEditor = me.getEditor(record, columnHeader);

                // Complete any outstanding edit now. The editor will remain visible if there is a new editor to take its place.
                // We will hide it only *after* the next editor has acquired focus so as to retain focus within the Panel.
                if (currentActiveEditor) {
                    useCurrentActiveEditor = newEditor === currentActiveEditor;
                    me.completeEdit(!!newEditor);

                    // We'll know if the edit has been aborted (such as in a beforecomplete listener on the editor) by the fact that `editing` is still true.
                    // In this case, we need to exit early before the current context is swapped out for the next context.
                    // See EXTJS-10378.
                    if (me.editing) {
                        return false;
                    }
                }
            } else {
                return false;
            }

            // Switch to new context *after* completing the current edit
            me.context = context;

            // Whether we are going to edit or not, ensure the edit cell is scrolled into view
            context.view.scrollCellIntoView(context.view.getCell(record, columnHeader));
            if (newEditor) {
                if (useCurrentActiveEditor) {

                    // We have left the editor visible. The editing flag is still set.
                    // Clear the flag now so that when its startEdit calls completeEdit, it does not repeat a cycle of completion on the basis that it thinks
                    // it is still editing. 
                    newEditor.editing = false;
                    if (Ext.isIE) {
                        // If the editor was already in use on another cell when we began editing,
                        // as is the case when editing a single-column grid and using the tab
                        // key to move the editor, we need to set a flag that tells the editor
                        // not to cancel editing in its blur handler (see Ext.Editor#onFieldBlur).
                        // This is needed because in IE the blur event fires AFTER the new
                        // editor has already been shown.  See EXTJSIV-9878
                        newEditor.selectSameEditor = true;
                    }
                }
                me.showEditor(newEditor, context, context.value);

                // Hide the last editor *after* focusing the new one so that focus doesn't fly out of the encapsulating Panel
                if (currentActiveEditor && !useCurrentActiveEditor) {
                    currentActiveEditor.hide();
                }
                return true;
            }
            return false;
        }
    },

    showEditor: function(ed, context, value) {
        var me = this,
            record = context.record,
            view = context.view,
            columnHeader = context.column,
            sm = view.getSelectionModel(),
            selectMode;

        // Context is for another view.
        // This can happen in a lockable grid where there are two grids, each with a separate Editing plugin
        if (!columnHeader.up(me.view.ownerCt)) {
            return me.lockingPartner.showEditor(ed, me.lockingPartner.getEditingContext(record, columnHeader), value);
        }

        me.setEditingContext(context);

        // We focus the cell before beginning the edit.
        // In 99% of cases, this will be a no-op because editing will have been triggered
        // by ENTER when a cell is focused, or by clicking a cell which will focus it.
        // But programmatic startEdit calls MUST first focus the Panel, otherwise,
        // the focusenter event caused by focusing the editor field will attempt
        // to delegate focus to a descendant cell, and that will terminate editing.
        // Keep existing records (see EXTJSIV-7897)!
        selectMode = sm.getSelectionMode();
        if (!sm.isCellSelected(view, record, columnHeader) && (selectMode !== 'MULTI' || !sm.getSelection().length || (sm.getSelection().length === 1 && sm.isSelected(record)))) {
            sm.selectByPosition({
                row: record,
                column: columnHeader,
                view: view
            }, selectMode === 'MULTI');
        }

        // We must ensure the lastFocused is consistent in the View.
        if (!view.cellFocused) {
            view.getNavigationModel().setPosition(context, null, null, null, true);
        }

        // The lastFocused position will be set above,
        // Now we must temporarily clear the current focus position during the edit.
        // Otherwise a refresh during edit will kill the editor by restoring focus.
        view.getNavigationModel().setPosition();
        ed.startEdit(view.getCell(record, columnHeader), value, context);

        // Set contextual information if we began editing (can be vetoed by events)
        if (ed.editing) {
            me.setActiveEditor(ed);
            me.setActiveRecord(record);
            me.setActiveColumn(columnHeader);
            me.editing = true;
            me.scroll = view.el.getScroll();
        }
        // Restore focus if we did not begin editing
        else {
            view.getNavigationModel().setPosition(context, null, null, null, true);
        }
    },

    completeEdit: function(remainVisible) {
        var activeEd = this.getActiveEditor();
        if (activeEd) {
            activeEd.completeEdit(remainVisible);
        }
    },

    // internal getters/setters
    setEditingContext: function(context) {
        this.context = context;
        if (this.lockingPartner) {
            this.lockingPartner.context = context;
        }
    },

    setActiveEditor: function(ed) {
        this.activeEditor = ed;
        if (this.lockingPartner) {
            this.lockingPartner.activeEditor = ed;
        }
    },

    getActiveEditor: function() {
        return this.activeEditor;
    },

    setActiveColumn: function(column) {
        this.activeColumn = column;
        if (this.lockingPartner) {
            this.lockingPartner.activeColumn = column;
        }
    },

    getActiveColumn: function() {
        return this.activeColumn;
    },

    setActiveRecord: function(record) {
        this.activeRecord = record;
        if (this.lockingPartner) {
            this.lockingPartner.activeRecord = record;
        }
    },

    getActiveRecord: function() {
        return this.activeRecord;
    },

    getEditor: function(record, column) {
        var me = this,
            editors = me.editors,
            editorId = column.getItemId(),
            editor = editors.getByKey(editorId),
            // Add to top level grid if we are editing one side of a locking system
            editorOwner = me.grid.ownerLockable || me.grid;

        if (!editor) {
            editor = column.getEditor(record);
            if (!editor) {
                return false;
            }

            // Allow them to specify a CellEditor in the Column
            if (editor instanceof Ext.grid.CellEditor) {
                editor.floating = true;
            }
            // But if it's just a Field, wrap it.
            else {
                editor = new Ext.grid.CellEditor({
                    floating: true,
                    editorId: editorId,
                    field: editor
                });
            }
            // Add the Editor as a floating child of the grid
            // Prevent this field from being included in an Ext.form.Basic
            // collection, if the grid happens to be used inside a form
            editor.field.excludeForm = true;

            // If the editor is new to this grid, then add it to the grid, and ensure it tells us about its life cycle.
            if (editor.ownerCt !== editorOwner) {
                editorOwner.add(editor);
                editor.on({
                    scope: me,
                    specialkey: me.onSpecialKey,
                    complete: me.onEditComplete,
                    canceledit: me.cancelEdit
                });
                column.on('removed', me.onColumnRemoved, me);
            }
            editors.add(editor);
        }

        if (column.isTreeColumn) {
            editor.isForTree = column.isTreeColumn;
            editor.addCls(Ext.baseCSSPrefix + 'tree-cell-editor');
        }

        // Set the owning grid.
        // This needs to be kept up to date because in a Lockable assembly, an editor
        // needs to swap sides if the column is moved across.
        editor.setGrid(me.grid);

        // Keep upward pointer correct for each use - editors are shared between locking sides
        editor.editingPlugin = me;
        return editor;
    },

    onColumnRemoved: function(column) {
        var me = this,
            context = me.context,
            editor,
            // Editor is owned by top level grid if we are editing one side of a locking system
            editorOwner = me.grid.ownerLockable || me.grid;

        // If the column was being edited, when plucked out of the grid, cancel the edit.
        if (context && context.column === column) {
            me.cancelEdit();
        }   

        // Remove the CellEditor of that column from the grid, and no longer listen for events from it.
        column.un('removed', me.onColumnRemoved, me);
        if (column.getEditor && (editor = column.getEditor()) && editor.ownerCt === editorOwner) {
            editorOwner.remove(editor);
            editor.un({
                scope: me,
                specialkey: me.onSpecialKey,
                complete: me.onEditComplete,
                canceledit: me.cancelEdit
            });
        }
    },

    // inherit docs
    setColumnField: function(column, field) {
        var ed = this.editors.getByKey(column.getItemId());
        Ext.destroy(ed, column.field);
        this.editors.removeAtKey(column.getItemId());
        this.callParent(arguments);
    },

    /**
     * Gets the cell (td) for a particular record and column.
     * @param {Ext.data.Model} record
     * @param {Ext.grid.column.Column} column
     * @private
     */
    getCell: function(record, column) {
        return this.grid.getView().getCell(record, column);
    },

    /**
     * Called from the specialkey event of an active editor when a control key is pressed
     * @param {Ext.form.field.Field} ed The Editor
     * @param {HTMLElement} field The Editor's input field
     * @param {Ext.event.Event} e the key event.
     * 
     */
    onSpecialKey: function(ed, field, e) {
        var sm;
 
        if (e.getKey() === e.TAB) {
            e.stopEvent();
            e.position = this.context;

            if (ed) {
                // Allow the field to act on tabs before onEditorTab, which ends
                // up calling completeEdit. This is useful for picker type fields.
                ed.onEditorTab(e);
            }

            sm = ed.getRefOwner().getSelectionModel();
            return sm.onEditorTab(ed.editingPlugin, e);
        }
    },

    onEditComplete : function(ed, value, startValue) {
        var me = this,
            activeColumn = me.getActiveColumn(),
            context = me.context,
            view, record;

        if (activeColumn) {
            view = context.view;
            record = context.record;

            me.setActiveEditor(null);
            me.setActiveColumn(null);
            me.setActiveRecord(null);

            context.value = value;
            if (!me.validateEdit()) {
                me.editing = false;
                return;
            }

            // Only update the record if the new value is different than the
            // startValue. When the view refreshes its el will gain focus
            if (!record.isEqual(value, startValue)) {
                record.set(activeColumn.dataIndex, value);
                // Changing the record may impact the position
                context.rowIdx = view.indexOf(record);
            }

            me.fireEvent('edit', me, context);
            me.editing = false;
        }
    },

    /**
     * Cancels any active editing.
     */
    cancelEdit: function() {
        var me = this,
            context = me.context,
            view,
            sm,
            record,
            preserveCurrentSelection,
            activeEd = me.getActiveEditor();

        if (activeEd) {
            me.setActiveEditor(null);
            me.setActiveColumn(null);
            me.setActiveRecord(null);

            view = context.view;
            sm = view.getSelectionModel();
            preserveCurrentSelection = sm.getSelectionMode() === 'MULTI' && (sm.getSelection().length > 1 || !sm.isSelected(record));
            if (activeEd.field) {
                me.context.value = ('editedValue' in activeEd) ? activeEd.editedValue : activeEd.getValue();
                activeEd.cancelEdit();
            }

            // Restore focus back to the view.
            // Use delay so that if other operations cause some other focus call, we can cancel the focus task
            // deferSetPosition uses the Component's singleton focusTask so is cancelable by any other focus request.
            // Pass final parameter true so as NOT to inform the SelectionModel. This is just a focus.
            context.view.getNavigationModel().deferSetPosition(100, context, null, null, null, preserveCurrentSelection);

            // Editing flag cleared in superclass
            me.callParent(arguments);
            return;
        }
        // If we aren't editing, return true to allow the event to bubble
        return true;
    },

    /**
     * Starts editing by position (row/column)
     * @param {Object} position A position with keys of row and column.
     * Example usage:
     * 
     *     cellEditing.startEditByPosition({
     *         row: 3,
     *         column: 2
     *     });
     */
    startEditByPosition: function(position) {
        var me = this,
            cm = me.grid.getColumnManager(),
            index;
            
        // If a raw {row:0, column:0} object passed.
        // The historic API is that column indices INCLUDE hidden columns, so use getColumnManager.
        if (!position.isCellContext) {
            position.column = me.grid.getColumnManager().getColumns()[position.column];
            position.record = me.view.dataSource.getAt(position.row);
        }
        
        // Coerce the edit column to the closest visible column. This typically
        // only needs to be done when called programmatically, since the position
        // is handled by walkCells, which is called before this is invoked.
        index = cm.getHeaderIndex(position.column);
        position.column = cm.getVisibleHeaderClosestToIndex(index);

        return me.startEdit(position.record, position.column);
    }
});
