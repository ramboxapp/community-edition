/**
 * A selection model that renders a column of checkboxes that can be toggled to
 * select or deselect rows. The default mode for this selection model is MULTI.
 *
 *       @example
 *       var store = Ext.create('Ext.data.Store', {
 *           fields: ['name', 'email', 'phone'],
 *           data: [{
 *               name: 'Lisa',
 *               email: 'lisa@simpsons.com',
 *               phone: '555-111-1224'
 *           }, {
 *               name: 'Bart',
 *               email: 'bart@simpsons.com',
 *               phone: '555-222-1234'
 *           }, {
 *               name: 'Homer',
 *               email: 'homer@simpsons.com',
 *               phone: '555-222-1244'
 *           }, {
 *               name: 'Marge',
 *               email: 'marge@simpsons.com',
 *               phone: '555-222-1254'
 *           }]
 *       });
 *
 *       Ext.create('Ext.grid.Panel', {
 *           title: 'Simpsons',
 *           store: store,
 *           columns: [{
 *               text: 'Name',
 *               dataIndex: 'name'
 *           }, {
 *               text: 'Email',
 *               dataIndex: 'email',
 *               flex: 1
 *           }, {
 *               text: 'Phone',
 *               dataIndex: 'phone'
 *           }],
 *           height: 200,
 *           width: 400,
 *           renderTo: Ext.getBody(),
 *           selModel: {
 *               selType: 'checkboxmodel'
 *           }
 *       });
 *
 * The selection model will inject a header for the checkboxes in the first view
 * and according to the {@link #injectCheckbox} configuration.
 */
Ext.define('Ext.selection.CheckboxModel', {
    alias: 'selection.checkboxmodel',
    extend: 'Ext.selection.RowModel',

    /**
     * @cfg {"SINGLE"/"SIMPLE"/"MULTI"} mode
     * Modes of selection.
     * Valid values are `"SINGLE"`, `"SIMPLE"`, and `"MULTI"`.
     */
    mode: 'MULTI',

    /**
     * @cfg {Number/String} [injectCheckbox=0]
     * The index at which to insert the checkbox column.
     * Supported values are a numeric index, and the strings 'first' and 'last'.
     */
    injectCheckbox: 0,

    /**
     * @cfg {Boolean} checkOnly
     * True if rows can only be selected by clicking on the checkbox column, not by clicking
     * on the row itself. Note that this only refers to selection via the UI, programmatic
     * selection will still occur regardless.
     */
    checkOnly: false,
    
    /**
     * @cfg {Boolean} showHeaderCheckbox
     * Configure as `false` to not display the header checkbox at the top of the column.
     * When the store is a {@link Ext.data.BufferedStore BufferedStore}, this configuration will
     * not be available because the buffered data set does not always contain all data. 
     */
    showHeaderCheckbox: undefined,
    
    /**
     * @cfg {String} [checkSelector="x-grid-row-checker"]
     * The selector for determining whether the checkbox element is clicked. This may be changed to
     * allow for a wider area to be clicked, for example, the whole cell for the selector.
     */
    checkSelector: '.' + Ext.baseCSSPrefix + 'grid-row-checker',
    
    allowDeselect: true,

    headerWidth: 24,

    // private
    checkerOnCls: Ext.baseCSSPrefix + 'grid-hd-checker-on',
    
    tdCls: Ext.baseCSSPrefix + 'grid-cell-special ' + Ext.baseCSSPrefix + 'grid-cell-row-checker',
    
    constructor: function() {
        var me = this;
        me.callParent(arguments);   
        
        // If mode is single and showHeaderCheck isn't explicity set to
        // true, hide it.
        if (me.mode === 'SINGLE' && me.showHeaderCheckbox !== true) {
            me.showHeaderCheckbox = false;
        } 
    },

    beforeViewRender: function(view) {
        var me = this,
            owner;

        me.callParent(arguments);

        // if we have a locked header, only hook up to the first
        if (!me.hasLockedHeader() || view.headerCt.lockedCt) {
            me.addCheckbox(view, true);
            owner = view.ownerCt;
            // Listen to the outermost reconfigure event
            if (view.headerCt.lockedCt) {
                owner = owner.ownerCt;
            }
            me.mon(owner, 'reconfigure', me.onReconfigure, me);
        }
    },

    bindComponent: function(view) {
        this.sortable = false;
        this.callParent(arguments);
    },

    hasLockedHeader: function(){
        var views     = this.views,
            vLen      = views.length,
            v;

        for (v = 0; v < vLen; v++) {
            if (views[v].headerCt.lockedCt) {
                return true;
            }
        }
        return false;
    },

    /**
     * Add the header checkbox to the header row
     * @private
     * @param {Boolean} initial True if we're binding for the first time.
     */
    addCheckbox: function(view, initial){
        var me = this,
            checkbox = me.injectCheckbox,
            headerCt = view.headerCt;

        // Preserve behaviour of false, but not clear why that would ever be done.
        if (checkbox !== false) {
            if (checkbox === 'first') {
                checkbox = 0;
            } else if (checkbox === 'last') {
                checkbox = headerCt.getColumnCount();
            }
            Ext.suspendLayouts();
            if (view.getStore().isBufferedStore) {
                me.showHeaderCheckbox = false;
            }
            me.column = headerCt.add(checkbox,  me.getHeaderConfig());
            Ext.resumeLayouts();
        }

        if (initial !== true) {
            view.refresh();
        }
    },

    /**
     * Handles the grid's reconfigure event.  Adds the checkbox header if the columns have been reconfigured.
     * @private
     * @param {Ext.panel.Table} grid
     * @param {Ext.data.Store} store
     * @param {Object[]} columns
     */
    onReconfigure: function(grid, store, columns) {
        if (columns) {
            this.addCheckbox(this.views[0]);
        }
    },

    /**
     * Toggle the ui header between checked and unchecked state.
     * @param {Boolean} isChecked
     * @private
     */
    toggleUiHeader: function(isChecked) {
        var view     = this.views[0],
            headerCt = view.headerCt,
            checkHd  = headerCt.child('gridcolumn[isCheckerHd]'),
            cls = this.checkerOnCls;

        if (checkHd) {
            if (isChecked) {
                checkHd.addCls(cls);
            } else {
                checkHd.removeCls(cls);
            }
        }
    },

    /**
     * Toggle between selecting all and deselecting all when clicking on
     * a checkbox header.
     */
    onHeaderClick: function(headerCt, header, e) {
        if (header === this.column) {
            e.stopEvent();
            var me = this,
                isChecked = header.el.hasCls(Ext.baseCSSPrefix + 'grid-hd-checker-on');

            if (isChecked) {
                me.deselectAll();
            } else {
                me.selectAll();
            }
        }
    },

    /**
     * Retrieve a configuration to be used in a HeaderContainer.
     * This should be used when injectCheckbox is set to false.
     */
    getHeaderConfig: function() {
        var me = this,
            showCheck = me.showHeaderCheckbox !== false;     

        return {
            xtype: 'gridcolumn',
            isCheckerHd: showCheck,
            text : '&#160;',
            clickTargetName: 'el',
            width: me.headerWidth,
            sortable: false,
            draggable: false,
            resizable: false,
            hideable: false,
            menuDisabled: true,
            dataIndex: '',
            tdCls: me.tdCls,
            cls: showCheck ? Ext.baseCSSPrefix + 'column-header-checkbox ' : '',
            defaultRenderer: me.renderer.bind(me),
            editRenderer: me.editRenderer || me.renderEmpty,
            locked: me.hasLockedHeader()
        };
    },

    renderEmpty: function() {
        return '&#160;';
    },

    // After refresh, ensure that the header checkbox state matches
    refresh: function() {
        this.callParent(arguments);
        this.updateHeaderState();
    },

    /**
     * Generates the HTML to be rendered in the injected checkbox column for each row.
     * Creates the standard checkbox markup by default; can be overridden to provide custom rendering.
     * See {@link Ext.grid.column.Column#renderer} for description of allowed parameters.
     */
    renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
        return '<div class="' + Ext.baseCSSPrefix + 'grid-row-checker" role="presentation">&#160;</div>';
    },
   
    selectByPosition: function (position, keepExisting) {
        if (!position.isCellContext) {
            position = new Ext.grid.CellContext(this.view).setPosition(position.row, position.column);
        }

        // Do not select if checkOnly, and the requested position is not the check column
        if (!this.checkOnly || position.column !== this.column) {
            this.callParent([position, keepExisting]);
        }
    },

    /**
     * Synchronize header checker value as selection changes.
     * @private
     */
    onSelectChange: function() {
        this.callParent(arguments);
        if (!this.suspendChange) {
            this.updateHeaderState();
        }
    },

    /**
     * @private
     */
    onStoreLoad: function() {
        this.callParent(arguments);
        this.updateHeaderState();
    },

    onStoreAdd: function() {
        this.callParent(arguments);
        this.updateHeaderState();
    },

    onStoreRemove: function() {
        this.callParent(arguments);
        this.updateHeaderState();
    },
    
    onStoreRefresh: function(){
        this.callParent(arguments);    
        this.updateHeaderState();
    },
    
    maybeFireSelectionChange: function(fireEvent) {
        if (fireEvent && !this.suspendChange) {
            this.updateHeaderState();
        }
        this.callParent(arguments);
    },
    
    resumeChanges: function(){
        this.callParent();
        if (!this.suspendChange) {
            this.updateHeaderState();
        }
    },

    /**
     * @private
     */
    updateHeaderState: function() {
        // check to see if all records are selected
        var me = this,
            store = me.store,
            storeCount = store.getCount(),
            views = me.views,
            hdSelectStatus = false,
            selectedCount = 0,
            selected, len, i;
            
        if (!store.isBufferedStore && storeCount > 0) {
            selected = me.selected;
            hdSelectStatus = true;
            for (i = 0, len = selected.getCount(); i < len; ++i) {
                if (store.indexOfId(selected.getAt(i).id) === -1) {
                    break;
                }
                ++selectedCount;
            }
            hdSelectStatus = storeCount === selectedCount;
        }
            
        if (views && views.length) {
            me.toggleUiHeader(hdSelectStatus);
        }
    },

    vetoSelection: function(e) {
        var me = this,
            column = me.column,
            veto, isClick, isSpace;

        if (me.checkOnly) {
            isClick = e.type === 'click' && e.getTarget(me.checkSelector);
            isSpace = e.getKey() === e.SPACE && e.position.column === column;
            veto = !(isClick || isSpace);
        }
        return veto || me.callParent([e]);
    },

    destroy: function() {
        this.column = null;
        this.callParent();
    },

    privates: {
        onBeforeNavigate: function(metaEvent) {
            var e = metaEvent.keyEvent;
            if (this.selectionMode !== 'SINGLE') {
                metaEvent.ctrlKey = metaEvent.ctrlKey || e.ctrlKey || (e.type === 'click' && !e.shiftKey) || e.getKey() === e.SPACE;
            }
        },

        selectWithEventMulti: function(record, e, isSelected) {
            var me = this;

            if (!e.shiftKey && !e.ctrlKey && e.getTarget(me.checkSelector)) {
                if (isSelected) {
                    me.doDeselect(record);
                } else {
                    me.doSelect(record, true);
                }
            } else {
                me.callParent([record, e, isSelected]);
            }
        }
    }
});
