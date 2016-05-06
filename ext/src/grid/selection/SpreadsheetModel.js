/**
 * A selection model for {@link Ext.grid.Panel grids} which allows you to select data in
 * a spreadsheet-like manner.
 *
 * Supported features:
 *
 *  - Single / Range / Multiple individual row selection.
 *  - Single / Range cell selection.
 *  - Column selection by click selecting column headers.
 *  - Select / deselect all by clicking in the top-left, header.
 *  - Adds row number column to enable row selection.
 *  - Optionally you can enable row selection using checkboxes
 *
 * # Example usage
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
 *         columns: [
 *             { text: 'Name', dataIndex: 'name' },
 *             { text: 'Email', dataIndex: 'email', flex: 1 },
 *             { text: 'Phone', dataIndex: 'phone' }
 *         ],
 *         selModel: {
 *            type: 'spreadsheet'
 *         }
 *     });
 *
 * @since 5.1.0
 */
Ext.define('Ext.grid.selection.SpreadsheetModel', {
    extend: 'Ext.selection.Model',
    requires: [
        'Ext.grid.selection.Selection',
        'Ext.grid.selection.Cells',
        'Ext.grid.selection.Rows',
        'Ext.grid.selection.Columns'
    ],

    alias: 'selection.spreadsheet',

    isSpreadsheetModel: true,

    config: {
        /**
         * @cfg {Boolean} [columnSelect=false]
         * Set to `true` to enable selection of columns.
         *
         * **NOTE**: This will remove sorting on header click and instead provide column
         * selection and deselection. Sorting is still available via column header menu.
         */
        columnSelect: {
            $value: false,
            lazy: true
        },

        /**
         * @cfg {Boolean} [cellSelect=true]
         * Set to `true` to enable selection of individual cells or a single rectangular
         * range of cells. This will provide cell range selection using click, and
         * potentially drag to select a rectangular range. You can also use "SHIFT + arrow"
         * key navigation to select a range of cells.
         */
        cellSelect: {
            $value: true,
            lazy: true
        },

        /**
         * @cfg {Boolean} [rowSelect=true]
         * Set to `true` to enable selection of rows by clicking on a row number column.
         *
         * *Note*: This feature will add the row number as the first column.
         */
        rowSelect: {
            $value: true,
            lazy: true
        },

        /**
        * @cfg {Boolean} [dragSelect=true]
        * Set to `true` to enables cell range selection by cell dragging.
        */
        dragSelect: {
            $value: true,
            lazy: true
        },

        /**
        * @cfg {Ext.grid.selection.Selection} [selected]
        * Pass an instance of one of the subclasses of {@link Ext.grid.selection.Selection}.
        */
        selected: null
    },

    /**
     * @event selectionchange
     * Fired *by the grid* after the selection changes.
     * @param {Ext.grid.Panel} grid The grid whose selection has changed.
     * @param {Ext.grid.selection.Selection} selection A subclass of
     * {@link Ext.grid.selection.Selection} describing the new selection.
     */

    /**
     * @cfg {Boolean} checkboxSelect [checkboxSelect=false]
     * Enables selection of the row via clicking on checkbox. Note: this feature will add
     * new column at position specified by {@link #checkboxColumnIndex}.
     */
    checkboxSelect: false,

    /**
     * @cfg {Number/String} [checkboxColumnIndex=0]
     * The index at which to insert the checkbox column.
     * Supported values are a numeric index, and the strings 'first' and 'last'. Only valid when set
     * *before* render.
     */
    checkboxColumnIndex: 0,

    /**
     * @cfg {Boolean} [showHeaderCheckbox=true]
     * Configure as `false` to not display the header checkbox at the top of the checkbox column
     * when {@link #checkboxSelect} is set.
     */
    showHeaderCheckbox: true,

    /**
     * @cfg {Number/String} [checkboxHeaderWidth=24]
     * Width of checkbox column.
     */
    checkboxHeaderWidth: 24,

    /**
     * @cfg {Number/String} [rowNumbererHeaderWidth=46]
     * Width of row numbering column.
     */
    rowNumbererHeaderWidth: 46,

    columnSelectCls: Ext.baseCSSPrefix + 'ssm-column-select',
    rowNumbererHeaderCls: Ext.baseCSSPrefix + 'ssm-row-numberer-hd',
    rowNumbererTdCls: Ext.grid.column.RowNumberer.prototype.tdCls + ' ' + Ext.baseCSSPrefix + 'ssm-row-numberer-cell',

    // private
    checkerOnCls: Ext.baseCSSPrefix + 'grid-hd-checker-on',

    tdCls: Ext.baseCSSPrefix + 'grid-cell-special ' + Ext.baseCSSPrefix + 'grid-cell-row-checker',

    /**
     * @method getCount
     * This method is not supported by SpreadsheetModel.
     *
     * To interrogate the selection use {@link #getSelected} which will return an instance of one
     * of the three selection types, or `null` if no selection.
     *
     * The three selection types are:
     *
     *    * {@link Ext.grid.selection.Rows}
     *    * {@link Ext.grid.selection.Columns}
     *    * {@link Ext.grid.selection.Cells}
     */

    /**
     * @method getSelectionMode
     * This method is not supported by SpreadsheetModel.
     */

    /**
     * @method setSelectionMode
     * This method is not supported by SpreadsheetModel.
     */

    /**
     * @method setLocked
     * This method is not currently supported by SpreadsheetModel.
     */

    /**
     * @method isLocked
     * This method is not currently supported by SpreadsheetModel.
     */

    /**
     * @method isRangeSelected
     * This method is not supported by SpreadsheetModel.
     *
     * To interrogate the selection use {@link #getSelected} which will return an instance of one
     * of the three selection types, or `null` if no selection.
     *
     * The three selection types are:
     *
     *    * {@link Ext.grid.selection.Rows}
     *    * {@link Ext.grid.selection.Columns}
     *    * {@link Ext.grid.selection.Cells}
     */

    /**
     * @private
     */
    bindComponent: function(view) {
        var me = this,
            viewListeners,
            lockedGrid;

        if (me.view !== view) {
            if (me.view) {
                me.navigationModel = null;
                Ext.destroy(me.viewListeners, me.navigationListeners);
            }
            me.view = view;
            if (view) {
                // We need to realize our lazy configs now that we have the view...
                me.getCellSelect();

                lockedGrid = view.ownerGrid.lockedGrid;
                // If there is a locked grid, process it now
                if (lockedGrid) {
                    me.hasLockedHeader = true;
                    me.onViewCreated(lockedGrid, lockedGrid.getView());
                } 
                // Otherwise, get back to us when the view is fully created so that we can tweak its headerCt
                else {
                    view.grid.on({
                        viewcreated: me.onViewCreated,
                        scope: me,
                        single: true
                    });
                }
                me.gridListeners = view.ownerGrid.on({
                    columnschanged: me.onColumnsChanged,
                    scope: me,
                    destroyable: true
                });

                viewListeners = me.getViewListeners();
                viewListeners.scope = me;
                viewListeners.destroyable = true;
                me.viewListeners = view.on(viewListeners);
                me.navigationModel = view.getNavigationModel();
                me.navigationListeners = me.navigationModel.on({
                    navigate: me.onNavigate,
                    scope: me,
                    destroyable: true
                });

                // Add class to add special cursor pointer to column headers
                if (me.getColumnSelect()) {
                    view.ownerGrid.addCls(me.columnSelectCls);
                }
            }
        }
    },

    /**
     * Retrieve a configuration to be used in a HeaderContainer.
     * This should be used when checkboxSelect is set to false.
     * @protected
     */
    getCheckboxHeaderConfig: function() {
        var me = this,
            showCheck = me.showHeaderCheckbox !== false;

        return {
            isCheckerHd: showCheck,
            text : '&#160;',
            clickTargetName: 'el',
            width: me.checkboxHeaderWidth,
            sortable: false,
            draggable: false,
            resizable: false,
            hideable: false,
            menuDisabled: true,
            dataIndex: '',
            tdCls: me.tdCls,
            cls: showCheck ? Ext.baseCSSPrefix + 'column-header-checkbox ' : '',
            defaultRenderer: me.checkboxRenderer.bind(me),
            editRenderer:  '&#160;',
            locked: me.hasLockedHeader
        };
    },

    /**
     * Generates the HTML to be rendered in the injected checkbox column for each row.
     * Creates the standard checkbox markup by default; can be overridden to provide custom rendering.
     * See {@link Ext.grid.column.Column#renderer} for description of allowed parameters.
     * @private
     */
    checkboxRenderer: function () {
        return '<div class="' + Ext.baseCSSPrefix + 'grid-row-checker" role="presentation">&#160;</div>';
    },

    /**
     * @private
     */
    onHeaderClick: function(headerCt, header, e) {
    // Template method. See base class
        var me = this,
            sel = me.selected;

        if (header === me.numbererColumn || header === me.checkColumn) {
            e.stopEvent();
            // Not all selected, select all
            if (!sel || !sel.isAllSelected()) {
                me.selectAll(headerCt.view);
            } else {
                me.deselectAll();
            }
            me.updateHeaderState();
        } else if (me.columnSelect) {
            if (me.isColumnSelected(header)) {
                me.deselectColumn(header);
            } else {
                me.selectColumn(header, e.ctrlKey);
            }
        }
    },

    /**
     * @private
     */
    updateHeaderState: function() {
        // check to see if all records are selected
        var me = this,
            store = me.view.dataSource,
            storeCount = store.getCount(),
            views = me.views,
            sel = me.selected,
            isChecked = sel && sel.isRows && !store.isBufferedStore && storeCount > 0 && (storeCount === sel.getCount()),
            checkHd  = me.checkColumn,
            cls = me.checkerOnCls;

        if (views && views.length) {
            if (checkHd) {
                if (isChecked) {
                    checkHd.addCls(cls);
                } else {
                    checkHd.removeCls(cls);
                }
            }
        }
    },

    /**
     * Handles the grid's reconfigure event.  Adds the checkbox header if the columns have been reconfigured.
     * @param {Ext.panel.Table} grid
     * @param {Ext.data.Store} store
     * @param {Object[]} columns
     * @private
     */
    onReconfigure: function(grid, store, columns) {
        if (columns) {
            this.addCheckbox(this.views[0]);
        }
    },

    /**
     * This is a helper method to create a cell context which encapsulates one cell in a grid view.
     *
     * It will contain the following properties:
     *  colIdx - column index
     *  rowIdx - row index
     *  column - {@link Ext.grid.column.Column Column} under which the cell is located.
     *  record - {@link Ext.data.Model} Record from which the cell derives its data.
     *  view - The view. If this selection model is for a locking grid, this will be the outermost view, the {@link Ext.grid.locking.View}
     *  which encapsulates the sub grids. Column indices are relative to the outermost view's visible column set.
     *
     * @param {Number} record Record for which to select the cell, or row index.
     * @param {Number} column Grid column header, or column index.
     * @return {Ext.grid.CellContext} A context object describing the cell. Note that the `rowidx` and `colIdx` properties are only valid
     * at the time the context object is created. Column movement, sorting or filtering might changed where the cell is.
     * @private
     */
    getCellContext: function(record, column) {
        return new Ext.grid.CellContext(this.view.ownerGrid.getView()).setPosition(record, column);
    },

    select: function(records, keepExisting, suppressEvent) {
        // API docs re inherited
        var me = this,
            sel = me.selected,
            view = me.view,
            store = view.dataSource,
            len,
            i,
            record,
            changed = false;

        // Ensure selection object is of the correct type
        if (!sel || !sel.isRows || sel.view !== view) {
            me.resetSelection(true);
            sel = me.selected = new Ext.grid.selection.Rows(view);
        } else if (!keepExisting) {
            sel.clear();
        }
        
        if (!Ext.isArray(records)) {
            records = [records];
        }
        len = records.length;
        for (i = 0; i < len; i++) {
            record = records[i];
            if (typeof record === 'number') {
                record = store.getAt(record);
            }
            if (!sel.contains(record)) {
                sel.add(record);
                changed = true;
            }
        }
        if (changed) {
            me.updateHeaderState();
            if (suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    deselect: function(records, suppressEvent) {
        // API docs are inherited
        var me = this,
            sel = me.selected,
            store = me.view.dataSource,
            len,
            i,
            record,
            changed = false;

        if (sel && sel.isRows) {
            if (!Ext.isArray(records)) {
                records = [records];
            }
            len = records.length;
            for (i = 0; i < len; i++) {
                record = records[i];
                if (typeof record === 'number') {
                    record = store.getAt(record);
                }
                changed = changed || sel.remove(record);
            }
        }
        if (changed) {
            me.updateHeaderState();
            if (!suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    /**
     * This method allows programmatic selection of the cell range.
     *
     *     @example
     *     var store = Ext.create('Ext.data.Store', {
     *         fields  : ['name', 'email', 'phone'],
     *         data    : {
     *             items : [
     *                 { name : 'Lisa',  email : 'lisa@simpsons.com',  phone : '555-111-1224' },
     *                 { name : 'Bart',  email : 'bart@simpsons.com',  phone : '555-222-1234' },
     *                 { name : 'Homer', email : 'homer@simpsons.com', phone : '555-222-1244' },
     *                 { name : 'Marge', email : 'marge@simpsons.com', phone : '555-222-1254' }
     *             ]
     *         },
     *         proxy   : {
     *             type   : 'memory',
     *             reader : {
     *                 type : 'json',
     *                 root : 'items'
     *             }
     *         }
     *     });
     *
     *     var grid = Ext.create('Ext.grid.Panel', {
     *         title    : 'Simpsons',
     *         store    : store,
     *         width    : 400,
     *         renderTo : Ext.getBody(),
     *         columns  : [
     *            columns: [
     *               { text: 'Name',  dataIndex: 'name' },
     *               { text: 'Email', dataIndex: 'email', flex: 1 },
     *               { text: 'Phone', dataIndex: 'phone', width:120 },
     *               {
     *                   text:'Combined', dataIndex: 'name', width : 300,
     *                   renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
     *                       console.log(arguments);
     *                       return value + ' has email: ' + record.get('email');
     *                   }
     *               }
     *           ],
     *         ],
     *         selType: 'spreadsheet'
     *     });
     *
     *     var model = grid.getSelectionModel();  // get selection model
     *
     *     // We will create range of 4 cells.
     *
     *     // Now set the range  and prevent rangeselect event from being fired.
     *     // We can use a simple array when we have no locked columns.
     *     model.selectCells([0, 0], [1, 1], true);
     *
     * @param rangeStart {Ext.grid.CellContext/Number[]} Range starting position. Can be either Cell context or a `[rowIndex, columnIndex]` numeric array.
     *
     * Note that when a numeric array is used in a locking grid, the column indices are relative to the outermost grid, encompassing locked *and* normal sides.
     * @param rangeEnd {Ext.grid.CellContext/Number[]} Range end position. Can be either Cell context or a `[rowIndex, columnIndex]` numeric array.
     *
     * Note that when a numeric array is used in a locking grid, the column indices are relative to the outermost grid, encompassing locked *and* normal sides.
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    selectCells: function(rangeStart, rangeEnd, suppressEvent) {
        var me = this,
            view = me.view.ownerGrid.view,
            sel;

        rangeStart = rangeStart.isCellContext ? rangeStart.clone() : new Ext.grid.CellContext(view).setPosition(rangeStart);
        rangeEnd   = rangeEnd.isCellContext   ? rangeEnd.clone()   : new Ext.grid.CellContext(view).setPosition(rangeEnd);

        me.resetSelection(true);

        me.selected = sel = new Ext.grid.selection.Cells(rangeStart.view);
        sel.setRangeStart(rangeStart);
        sel.setRangeEnd(rangeEnd);

        if (!suppressEvent) {
            me.fireSelectionChange();
        }
    },

    /**
     * Select all the data if possible.
     *
     * If {@link #rowSelect} is `true`, then all *records* will be selected.
     *
     * If {@link #cellSelect} is `true`, then all *rendered cells* will be selected.
     *
     * If {@link #columnSelect} is `true`, then all *columns* will be selected.
     *
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    selectAll: function (suppressEvent) {
        var me = this,
            sel = me.selected,
            doSelect,
            view = me.view;

        if (me.rowSelect) {
            if (!sel || !sel.isRows) {
                me.resetSelection(true);
                me.selected = sel = new Ext.grid.selection.Rows(view);
            }
            doSelect = true;
        }
        else if (me.cellSelect) {
            if (!sel || !sel.isCells) {
                me.resetSelection(true);
                me.selected = sel = new Ext.grid.selection.Cells(view);
            }
            doSelect = true;
        }
        else if (me.columnSelect) {
            if (!sel || !sel.isColumns) {
                me.resetSelection(true);
                me.selected = sel = new Ext.grid.selection.Columns(view);
            }
            doSelect = true;
        }

        if (doSelect) {
            sel.selectAll();
            me.updateHeaderState();
            if (!suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    /**
     * Clears the selection.
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    deselectAll: function (suppressEvent) {
        var sel = this.selected;
        
        if (sel && sel.getCount()) {
            sel.clear();
            if (!suppressEvent) {
                this.fireSelectionChange();
            }
        }
    },

    /**
     * Select one or more rows.
     * @param rows {Ext.data.Model[]} Records to select.
     * @param {Boolean} [keepSelection=false] Pass `true` to keep previous selection.
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    selectRows: function(rows, keepSelection, suppressEvent) {
        var me = this,
            sel = me.selected,
            isSelectingRows = sel && !sel.isRows,
            len = rows.length,
            i;

        if (!keepSelection || isSelectingRows) {
            me.resetSelection(true);
        }
        if (!isSelectingRows) {
            me.selected = sel = new Ext.grid.selection.Rows(me.view);
        }

        for (i = 0; i < len; i++) {
            sel.add(rows[i]);
        }

        if (!suppressEvent) {
            me.fireSelectionChange();
        }
    },

    isSelected: function(record) {
        // API docs are inherited.
        return this.isRowSelected(record);
    },

    /**
     * Selects a column.
     * @param {Ext.grid.column.Column} column Column to select.
     * @param {Boolean} [keepSelection=false] Pass `true` to keep previous selection.
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    selectColumn: function(column, keepSelection, suppressEvent) {
        var me = this,
            selData = me.selected,
            view = column.getView();

        // Clear other selection types
        if (!selData || !selData.isColumns || selData.view !== view.ownerGrid.view) {
            me.resetSelection(true);
            me.selected = selData = new Ext.grid.selection.Columns(view);
        }

        if (!selData.contains(column)) {
            if (!keepSelection) {
                selData.clear();
            }
            selData.add(column);

            me.updateHeaderState();
            if (!suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    /**
     * Deselects a column.
     * @param {Ext.grid.column.Column} column Column to deselect.
     * @param {Boolean} [suppressEvent] Pass `true` to prevent firing the
     * `{@link #selectionchange}` event.
     */
    deselectColumn: function(column, suppressEvent) {
        var me = this,
            selData = me.getSelected();

        if (selData && selData.isColumns && selData.contains(column)) {
            selData.remove(column);
            me.updateHeaderState();
            if (!suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    getSelection: function() {
        // API docs are inherited.
        // Superclass returns array of selected records
        var selData = this.selected;

        if (selData && selData.isRows) {
            return selData.getRecords();
        }
        return [];
    },

    destroy: function() {
        var me = this,
            scrollEls = me.scrollEls;

        Ext.destroy(me.gridListeners, me.viewListeners, me.selected, me.navigationListeners);
        if (scrollEls) {
            Ext.dd.ScrollManager.unregister(scrollEls);
        }
        me.selected = me.gridListeners = me.viewListeners = me.selectionData = me.navigationListeners = me.scrollEls = null;
        me.callParent();
    },

    //-------------------------------------------------------------------------

    privates: {
        /**
         * @return {Object}
         * @private
         */
        getViewListeners: function() {
            return {
                beforerefresh: this.onBeforeViewRefresh,
                keyup: {
                    element: 'el',
                    fn: this.onViewKeyUp,
                    scope: this
                }
            };
        },

        /**
         * @private
         */
        onViewKeyUp: function(e) {
            var sel = this.selected;

            // Released the shift key, terminate a keyboard based range selection
            if (e.keyCode === e.SHIFT && sel && sel.isRows && sel.getRangeSize()) {
                // Copy the drag range into the selected records collection
                sel.addRange();
            }
        },

        /**
         * @private
         */
        onColumnsChanged: function() {
            var selData = this.selected,
                rowRange,
                colCount,
                colIdx,
                rowIdx,
                view,
                context;

            // When columns have changed, we have to deselect *every* cell in the row range because we do not know where the
            // columns have gone to.
            if (selData && selData.isCells) {
                view = selData.view;
                context = new Ext.grid.CellContext(view);
                rowRange = selData.getRowRange();
                colCount = view.getVisibleColumnManager().getColumns().length;
                for (rowIdx = rowRange[0]; rowIdx <= rowRange[1]; rowIdx++) {
                    context.setRow(rowIdx);
                    for (colIdx = 0; colIdx < colCount; colIdx++) {
                        context.setColumn(colIdx);
                        view.onCellDeselect(context);
                    }
                }
            }
        },

        /**
         * @private
         */
        onBeforeViewRefresh: function(view) {
            var selData = this.selected;

            // Allow cell preselection to survive, but not cell selection from a prior refresh
            if (view.refreshCounter) {
                if (selData && selData.isCells) {
                    this.resetSelection();
                }
            }
        },

        /**
         * @private
         */
        resetSelection: function(suppressEvent) {
            var sel = this.selected;

            if (sel) {
                sel.clear();
                if (!suppressEvent) {
                    this.fireSelectionChange();
                }
            }
        },

        onViewCreated: function(grid, view) {
            var me = this,
                ownerGrid = view.ownerGrid,
                headerCt = view.headerCt,
                shrinkwrapLocked = ownerGrid.shrinkWrapLocked;

            // Only add columns to the locked view, or only view if there is no twin
            if (!ownerGrid.lockable || view.isLockedView) {
                // if there is no row number column and we ask for it, then it should be added here
                if (me.getRowSelect() && !headerCt.down('rownumberer')) {
                    // Add rownumber column
                    me.numbererColumn = headerCt.add(0, {
                        xtype: 'rownumberer',
                        width: me.rowNumbererHeaderWidth,
                        editRenderer:  '&#160;',
                        tdCls: me.rowNumbererTdCls,
                        cls: me.rowNumbererHeaderCls,
                        locked: me.hasLockedHeader
                    });
                    if (shrinkwrapLocked) {
                        grid.width += me.numbererColumn.width;
                    }
                }

                if (me.checkboxSelect) {
                    me.addCheckbox(view, true);
                    me.mon(view.ownerGrid, 'reconfigure', me.onReconfigure, me);
                    if (shrinkwrapLocked) {
                        grid.width += me.checkColumn.width;
                    }
                }
            }

            // Disable sortOnClick if we're columnSelecting
            headerCt.sortOnClick = !me.getColumnSelect();

            if (me.getDragSelect()) {
                view.on('render', me.onViewRender, me, {
                    single: true
                });
            }
        },

        /**
         * Initialize drag selection support
         * @private
         */
        onViewRender: function(view) {
            var me = this,
                el = view.getEl();

            el.ddScrollConfig = {
                vthresh: 50,
                hthresh: 50,
                frequency: 300,
                increment: 100
            };
            Ext.dd.ScrollManager.register(el);

            // Possible two child views to register as scrollable on drag
            (me.scrollEls || (me.scrollEls = [])).push(el);

            view.on('cellmousedown', me.handleMouseDown, me);

            // In a locking situation, we need a mousedown listener on both sides.
            if (view.lockingPartner) {
                view.lockingPartner.on('cellmousedown', me.handleMouseDown, me);
            }
        },

        /**
         * Plumbing for drag selection of cell range
         * @private
         */
        handleMouseDown: function(view, td, cellIndex, record, tr, rowIdx, e) {
            var me = this,
                sel = me.selected,
                header = e.position.column,
                isCheckClick,
                startDragSelect;

            // Ignore right click and shit and alt modifiers.
            // Also ignore touchstart. We cannot drag select using touches.
            if (e.button || e.shiftKey || e.altKey || e.pointerType ==='touch') {
                return;
            }

            if (header) {
                isCheckClick = header === me.checkColumn;

                // Differentiate between row and cell selections.
                if (header === me.numbererColumn || isCheckClick || !me.cellSelect) {
                    // Enforce rowSelect setting
                    if (me.rowSelect) {
                        if (sel && sel.isRows) {
                            if (!e.ctrlKey && !isCheckClick) {
                                sel.clear();
                            }
                        } else {
                            if (sel) {
                                sel.clear();
                            }
                            sel = me.selected = new Ext.grid.selection.Rows(view);
                        }
                        startDragSelect = true;
                    }
                } else {
                    if (sel) {
                        sel.clear();
                    }
                    if (!sel || !sel.isCells) {
                        sel = me.selected = new Ext.grid.selection.Cells(view);
                    }
                    startDragSelect = true;
                }

                me.lastOverRecord = me.lastOverColumn = null;

                // Add the listener after the view has potentially been corrected
                Ext.getBody().on('mouseup', me.onMouseUp, me, { single: true, view: sel.view });

                // Only begin the drag process if configured to select what they asked for
                if (startDragSelect) {
                    sel.view.el.on('mousemove', me.onMouseMove, me, {view: sel.view});
                }
            }
        },

        /**
         * Selects range based on mouse movements
         * @param e
         * @param cell
         * @param opts
         * @private
         */
        onMouseMove: function(e, target, opts) {
            var me = this,
                view = opts.view,
                record,
                rowIdx,
                cell = e.getTarget(view.cellSelector),
                header = opts.view.getHeaderByCell(cell),
                selData = me.selected,
                pos,
                recChange,
                colChange;

            if (header) {
                record = view.getRecord(cell.parentNode);
                rowIdx = me.store.indexOf(record);
                recChange = record !== me.lastOverRecord;
                colChange = header !== me.lastOverColumn;

                if (recChange || colChange) {
                    pos = me.getCellContext(record, header);
                }

                // Initial mousedown was in rownumberer or checkbox column
                if (selData.isRows) {
                    // Only react if we've changed row
                    if (recChange) {
                        if (me.lastOverRecord) {
                            selData.setRangeEnd(rowIdx);
                        } else {
                            selData.setRangeStart(rowIdx);
                        }
                    }
                }
                // Selecting cells
                else {
                    // Only react if we've changed row or column
                    if (recChange || colChange) {
                        if (me.lastOverRecord) {
                            selData.setRangeEnd(pos);
                        } else {
                            selData.setRangeStart(pos);
                        }
                    }
                }

                // Focus MUST follow the mouse.
                // Otherwise the focus may scroll out of the rendered range and revert to document
                if (recChange || colChange) {
                    // We MUST pass local view into NavigationModel, not the potentially outermost locking view.
                    // TODO: When that's fixed, use setPosition(pos).
                    view.getNavigationModel().setPosition(new Ext.grid.CellContext(header.getView()).setPosition(record, header));
                }
                me.lastOverColumn = header;
                me.lastOverRecord = record;
            }
        },

        /**
         * Clean up mousemove event
         * @param e
         * @param target
         * @param opts
         * @private
         */
        onMouseUp: function(e, target, opts) {
            var me = this,
                view = opts.view;

            if (view && !view.isDestroyed) {
                view.el.un('mousemove', me.onMouseMove, me);

                // Copy the records encompassed by the drag range into the record collection
                if (me.selected.isRows) {
                    me.selected.addRange();
                }
                me.fireSelectionChange();
            }
        },

        /**
         * Add the header checkbox to the header row
         * @param view
         * @param {Boolean} initial True if we're binding for the first time.
         * @private
         */
        addCheckbox: function(view, initial) {
            var me = this,
                checkbox = me.checkboxColumnIndex,
                headerCt = view.headerCt;

            // Preserve behaviour of false, but not clear why that would ever be done.
            if (checkbox !== false) {
                if (checkbox === 'first') {
                    checkbox = 0;
                } else if (checkbox === 'last') {
                    checkbox = headerCt.getColumnCount();
                }
                me.checkColumn = headerCt.add(checkbox, me.getCheckboxHeaderConfig());
            }

            if (initial !== true) {
                view.refresh();
            }
        },

        /**
         * Called when the grid's Navigation model detects navigation events (`mousedown`, `click` and certain `keydown` events).
         * @param {Ext.event.Event} navigateEvent The event which caused navigation.
         * @private
         */
        onNavigate: function(navigateEvent) {
            var me = this,
                // Use outermost view. May be lockable
                view = navigateEvent.view.ownerGrid.view,
                record = navigateEvent.record,
                sel = me.selected,

                // Create a new Context based upon the outermost View.
                // NavigationModel works on local views. TODO: remove this step when NavModel is fixed to use outermost view in locked grid.
                // At that point, we can use navigateEvent.position
                pos = new Ext.grid.CellContext(view).setPosition(record, navigateEvent.column),
                keyEvent = navigateEvent.keyEvent,
                keyCode = keyEvent.getKey(),
                selectionChanged;

            // CTRL/Arrow just navigates, does not select
            if (keyEvent.ctrlKey && (keyCode === keyEvent.UP || keyCode === keyEvent.LEFT || keyCode === keyEvent.RIGHT || keyCode === keyEvent.DOWN)) {
                return;
            }

            // Click is the mouseup at the end of a multi-cell select swipe; reject.
            if (sel && sel.isCells && sel.getCount() > 1 && keyEvent.type === 'click') {
                return;
            }

            // If all selection types are disabled, or it's not a selecting event, return
            if (!(me.cellSelect || me.columnSelect || me.rowSelect) || !navigateEvent.record || keyEvent.type === 'mousedown') {
                return;
            }

            // Ctrl/A key - Deselect current selection, or select all if no selection
            if (keyEvent.ctrlKey && keyEvent.keyCode === keyEvent.A ) {
                // No selection, or only one, select all
                if (!sel || sel.getCount() < 2) {
                    me.selectAll();
                } else {
                    me.deselectAll();
                }
                me.updateHeaderState();
                return;
            }

            if (keyEvent.shiftKey) {
                // If the event is in one of the row selecting cells, or cell selecting is turned off
                if (pos.column === me.numbererColumn || pos.column === me.checkColumn || !me.cellSelect || (sel && sel.isRows)) {
                    if (me.rowSelect) {
                        // Ensure selection object is of the correct type
                        if (!sel || !sel.isRows || sel.view !== view) {
                            me.resetSelection(true);
                            sel = me.selected = new Ext.grid.selection.Rows(view);
                        }
                        // First shift
                        if (!sel.getRangeSize()) {
                            sel.setRangeStart(navigateEvent.previousRecordIndex || 0);
                        }
                        sel.setRangeEnd(navigateEvent.recordIndex);
                        selectionChanged = true;
                    }
                }
                // Navigate event in a normal cell
                else {
                    if (me.cellSelect) {
                        // Ensure selection object is of the correct type
                        if (!sel || !sel.isCells || sel.view !== view) {
                            me.resetSelection(true);
                            sel = me.selected = new Ext.grid.selection.Cells(view);
                        }
                        // First shift
                        if (!sel.getRangeSize()) {
                            sel.setRangeStart(navigateEvent.previousPosition || me.getCellContext(0, 0));
                        }
                        sel.setRangeEnd(pos);
                        selectionChanged = true;
                    }
                }
            } else {
                // If the event is in one of the row selecting cells, or cell selecting is turned off
                if (pos.column === me.numbererColumn || pos.column === me.checkColumn || !me.cellSelect) {
                    if (me.rowSelect) {
                        // Ensure selection object is of the correct type
                        if (!sel || !sel.isRows || sel.view !== view) {
                            me.resetSelection(true);
                            sel = me.selected = new Ext.grid.selection.Rows(view);
                        }

                        if (keyEvent.ctrlKey ||  pos.column === me.checkColumn) {
                            if (sel.contains(record)) {
                                sel.remove(record);
                            } else {
                                sel.add(record);
                            }
                        } else {
                            sel.clear();
                            sel.add(record);
                        }
                        selectionChanged = true;
                    }
                }
                // Navigate event in a normal cell
                else {
                    if (me.cellSelect) {
                        // Ensure selection object is of the correct type
                        if (!sel || !sel.isCells || sel.view !== view) {
                            me.resetSelection(true);
                            me.selected = sel = new Ext.grid.selection.Cells(view);
                        } else {
                            sel.clear();
                        }
                        sel.setRangeStart(pos);
                        selectionChanged = true;
                    }
                }
            }

            // If our configuration allowed selection changes, update check header and fire event
            if (selectionChanged) {
                if (sel.isRows) {
                    me.updateHeaderState();
                }
                me.fireSelectionChange();
            }
        },

        /**
         * Check if given record is currently selected.
         *
         * Used in {@link Ext.view.Table view} rendering to decide upon cell UI treatment.
         * @param {Ext.data.Model} record
         * @return {Boolean}
         * @private
         */
        isRowSelected: function(record) {
            var me = this,
                sel = me.selected;

            if (sel && sel.isRows) {
                record = Ext.isNumber(record) ? me.store.getAt(record) : record;
                return sel.contains(record);
            } else {
                return false;
            }
        },

        /**
         * Check if given column is currently selected.
         *
         * @param {Ext.grid.column.Column} column
         * @return {Boolean}
         * @private
         */
        isColumnSelected: function(column) {
            var me = this,
                sel = me.selected;

            if (sel && sel.isColumns) {
                return sel.contains(column);
            } else {
                return false;
            }
        },

        /**
         * Returns true if specified cell within specified view is selected
         *
         * Used in {@link Ext.view.Table view} rendering to decide upon row UI treatment.
         * @param {Ext.grid.View} view - impactful when locked columns are used
         * @param {Number} row - row index
         * @param {Number} column - column index, within the current view
         *
         * @return {Boolean}
         * @private
         */
        isCellSelected: function(view, row, column) {
            var me = this,
                testPos,
                sel = me.selected;

            // view MUST be outermost (possible locking) view
            view = view.ownerGrid.view;
            if (sel) {
                if (sel.isColumns) {
                    if (typeof column === 'number') {
                        column = view.getVisibleColumnManager().getColumns()[column];
                    }
                    return sel.contains(column);
                }

                if (sel.isCells) {
                    testPos = new Ext.grid.CellContext(view).setPosition({
                        row: row,
                        // IMPORTANT: The historic API for columns has been to include hidden columns
                        // in the index. So we must index into the "all" ColumnManager.
                        column: column
                    });

                    return sel.contains(testPos);
                }
            }

            return false;
        },

        /**
         * @private
         */
        applySelected: function(selected) {
            // Must override base class's applier which creates a Collection
            //<debug>
            if (selected && !(selected.isRows || selected.isCells || selected.isColumns)) {
                Ext.error.raise('SpreadsheelModel#setSelected must be passed an instance of Ext.grid.selection.Selection');
            }
            //</debug>
            return selected;
        },

        /**
         * @private
         */
        updateSelected: function(selected, oldSelected) {
            var view,
                columns,
                len,
                i,
                cell;

            // Clear old selection.
            if (oldSelected) {
                oldSelected.clear();
            }

            // Update the UI to match the new selection
            if (selected && selected.getCount()) {
                view = selected.view;

                // Rows; update each selected row
                if (selected.isRows) {
                    selected.eachRow(view.onRowSelect, view);
                }
                // Columns; update the selected columns for all rows
                else if (selected.isColumns) {
                    columns = selected.getColumns();
                    len = columns.length;

                    if (len) {
                        cell = new Ext.grid.CelContext(view);
                        view.store.each(function(rec) {
                            cell.setRow(rec);
                            for (i = 0; i < len; i++) {
                                cell.setColumn(columns[i]);
                                view.onCellSelect(cell);
                            }
                        });
                    }
                }
                // Cells; update each selected cell
                else if (selected.isCells) {
                    selected.eachCell(view.onCellSelect, view);
                }
            }
        },

        /**
         * Show/hide the extra column headers depending upon rowSelection.
         * @private
         */
        updateRowSelect: function(rowSelect) {
            var me = this,
                sel = me.selected,
                view = me.view;

            if (view && view.rendered) {
                // Always put row selection columns in the locked side if there is one.
                if (view.isNormalView) {
                    view = view.lockingPartner;
                }

                if (rowSelect) {
                    if (me.checkColumn) {
                        me.checkColumn.show();
                    }
                    if (me.numbererColumn) {
                        me.numbererColumn.show();
                    } else {
                        me.numbererColumn = view.headerCt.add(0, {
                            xtype: 'rownumberer',
                            width: me.rowNumbererHeaderWidth,
                            editRenderer:  '&#160;',
                            tdCls: me.rowNumbererTdCls,
                            cls: me.rowNumbererHeaderCls,
                            locked: me.hasLockedHeader
                        });
                    }
                } else {
                    if (me.checkColumn) {
                        me.checkColumn.hide();
                    }
                    if (me.numbererColumn) {
                        me.numbererColumn.hide();
                    }
                }
                if (!rowSelect && sel && sel.isRows) {
                    sel.clear();
                    me.fireSelectionChange();
                }
            }
        },

        /**
         * Enable/disable the HeaderContainer's sortOnClick in line with column select on
         * column click.
         * @private
         */
        updateColumnSelect: function(columnSelect) {
            var me = this,
                sel = me.selected,
                views = me.views,
                len = views ? views.length : 0,
                i;

            for (i = 0; i < len; i++) {
                views[i].headerCt.sortOnClick = !columnSelect;
            }
            if (!columnSelect && sel && sel.isColumns) {
                sel.clear();
                me.fireSelectionChange();
            }
            if (columnSelect) {
                me.view.ownerGrid.addCls(me.columnSelectCls);
            } else {
                me.view.ownerGrid.removeCls(me.columnSelectCls);
            }
        },

        /**
         * @private
         */
        updateCellSelect: function(cellSelect) {
            var me = this,
                sel = me.selected;

            if (!cellSelect && sel && sel.isCells) {
                sel.clear();
                me.fireSelectionChange();
            }
        },

        /**
         * @private
         */
        fireSelectionChange: function () {
            var grid = this.view.ownerGrid;
            grid.fireEvent('selectionchange', grid, this.selected);
        },

        /**
         * @private
         */
        onIdChanged: function(store, rec, oldId, newId) {
            var sel = this.selected;

            if (sel && sel.isRows && sel.selectedRecords) {
                sel.selectedRecords.updateKey(rec, oldId);
            }
        },

        /**
         * Called when a page is added to BufferedStore.
         * @private
         */
        onPageAdd: function(pageMap, pageNumber, records) {
            var sel = this.selected,
                len = records.length,
                i,
                record,
                selected = sel && sel.selectedRecords;

            // Check for return of already selected records.
            if (selected && sel.isRows) {
                for (i = 0; i < len; i++) {
                    record = records[i];
                    if (selected.get(record.id)) {
                        selected.replace(record);
                    }
                }
            }
        },

        /**
         * @private
         */
        refresh: function() {
            var sel = this.getSelected();

            // Refreshing the selected record Collection based upon a possible
            // store mutation is only valid if we are selecting records.
            if (sel && sel.isRows) {
                this.callParent();
            }
        },

        /**
         * @private
         */
        onStoreAdd: function() {
            var sel = this.getSelected();

            // Updating on store mutation is only valid if we are selecting records.
            if (sel && sel.isRows) {
                this.callParent(arguments);
                this.updateHeaderState();
            }
        },

        /**
         * @private
         */
        onStoreClear: function() {
            this.resetSelection();
        },

        /**
         * @private
         */
        onStoreLoad: function() {
            var sel = this.getSelected();

            // Updating on store mutation is only valid if we are selecting records.
            if (sel && sel.isRows) {
                this.callParent(arguments);
                this.updateHeaderState();
            }
        },

        /**
         * @private
         */
        onStoreRefresh: function() {
            var sel = this.selected;

            // Ensure that records which are no longer in the new store are pruned if configured to do so.
            // Ensure that selected records in the collection are the correct instance.
            if (sel && sel.isRows && sel.selectedRecords) {
                this.updateSelectedInstances(sel.selectedRecords);
            }
            this.updateHeaderState();
        },

        /**
         * @private
         */
        onStoreRemove: function() {
            var sel = this.getSelected();

            // Updating on store mutation is only valid if we are selecting records.
            if (sel && sel.isRows) {
                this.callParent(arguments);
            }
        }
    }
});
