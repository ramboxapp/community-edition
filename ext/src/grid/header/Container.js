/**
 * Headercontainer is a docked container (_`top` or `bottom` only_) that holds the
 * headers ({@link Ext.grid.column.Column grid columns}) of a
 * {@link Ext.grid.Panel grid} or {@link Ext.tree.Panel tree}.  The headercontainer
 * handles resizing, moving, and hiding columns.  As columns are hidden, moved or
 * resized, the headercontainer triggers changes within the grid or tree's
 * {@link Ext.view.Table view}.  You will not generally need to instantiate this class
 * directly.
 *
 * You may use the
 * {@link Ext.panel.Table#method-getHeaderContainer getHeaderContainer()}
 * accessor method to access the tree or grid's headercontainer.
 *
 * Grids and trees also have an alias to the two more useful headercontainer methods:
 *
 *  - **{@link Ext.panel.Table#method-getColumns getColumns}** - aliases
 * {@link Ext.grid.header.Container#getGridColumns}
 *  - **{@link Ext.panel.Table#method-getVisibleColumns getVisibleColumns}** - aliases
 * {@link Ext.grid.header.Container#getVisibleGridColumns}
 */
Ext.define('Ext.grid.header.Container', {
    extend: 'Ext.container.Container',
    requires: [
        'Ext.grid.ColumnLayout',
        'Ext.grid.plugin.HeaderResizer',
        'Ext.grid.plugin.HeaderReorderer',
        'Ext.util.KeyNav'
    ],
    uses: [
        'Ext.grid.column.Column',
        'Ext.grid.ColumnManager',
        'Ext.menu.Menu',
        'Ext.menu.CheckItem',
        'Ext.menu.Separator'
    ],

    mixins: [
        'Ext.util.FocusableContainer'
    ],

    border: true,

    alias: 'widget.headercontainer',

    baseCls: Ext.baseCSSPrefix + 'grid-header-ct',

    dock: 'top',

    /**
     * @cfg {Number} weight
     * HeaderContainer overrides the default weight of 0 for all docked items to 100.
     * This is so that it has more priority over things like toolbars.
     */
    weight: 100,

    defaultType: 'gridcolumn',

    detachOnRemove: false,

    /**
     * @cfg {Number} defaultWidth
     * Width of the header if no width or flex is specified.
     */
    defaultWidth: 100,

    /**
     * @cfg {Boolean} [sealed=false]
     * Specify as `true` to constrain column dragging so that a column cannot be dragged into or out of this column.
     *
     * **Note that this config is only valid for column headers which contain child column headers, eg:**
     *     {
     *         sealed: true
     *         text: 'ExtJS',
     *         columns: [{
     *             text: '3.0.4',
     *             dataIndex: 'ext304'
     *         }, {
     *             text: '4.1.0',
     *             dataIndex: 'ext410'
     *         }
     *     }
     *
     */

    //<locale>
    sortAscText: 'Sort Ascending',
    //</locale>
    //<locale>
    sortDescText: 'Sort Descending',
    //</locale>
    //<locale>
    sortClearText: 'Clear Sort',
    //</locale>
    //<locale>
    columnsText: 'Columns',
    //</locale>

    headerOpenCls: Ext.baseCSSPrefix + 'column-header-open',

    menuSortAscCls: Ext.baseCSSPrefix + 'hmenu-sort-asc',

    menuSortDescCls: Ext.baseCSSPrefix + 'hmenu-sort-desc',

    menuColsIcon: Ext.baseCSSPrefix + 'cols-icon',

    ddLock: false,

    dragging: false,

    // May be set to false by a SptreadSheetSelectionModel
    sortOnClick: true,
    
    // Disable FocusableContainer behavior by default, since we only want it
    // to be enabled for the root header container (we'll set the flag in initComponent)
    enableFocusableContainer: false,

    childHideCount: 0,

    /**
     * @property {Boolean} isGroupHeader
     * True if this HeaderContainer is in fact a group header which contains sub headers.
     */

    /**
     * @cfg {Boolean} sortable
     * Provides the default sortable state for all Headers within this HeaderContainer.
     * Also turns on or off the menus in the HeaderContainer. Note that the menu is
     * shared across every header and therefore turning it off will remove the menu
     * items for every header.
     */
    sortable: true,

    /**
     * @cfg {Boolean} [enableColumnHide=true]
     * False to disable column hiding within this grid.
     */
    enableColumnHide: true,

    /**
     * @event columnresize
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {Number} width
     */

    /**
     * @event headerclick
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {Ext.event.Event} e
     * @param {HTMLElement} t
     */

    /**
     * @event headercontextmenu
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {Ext.event.Event} e
     * @param {HTMLElement} t
     */

    /**
     * @event headertriggerclick
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {Ext.event.Event} e
     * @param {HTMLElement} t
     */

    /**
     * @event columnmove
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {Number} fromIdx
     * @param {Number} toIdx
     */

    /**
     * @event columnhide
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     */

    /**
     * @event columnshow
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     */

    /**
     * @event columnschanged
     * Fired after the columns change in any way, when a column has been hidden or shown, or when a column
     * is added to or removed from this header container.
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     */

    /**
     * @event sortchange
     * @param {Ext.grid.header.Container} ct The grid's header Container which encapsulates all column headers.
     * @param {Ext.grid.column.Column} column The Column header Component which provides the column definition
     * @param {String} direction
     */

    /**
     * @event menucreate
     * Fired immediately after the column header menu is created.
     * @param {Ext.grid.header.Container} ct This instance
     * @param {Ext.menu.Menu} menu The Menu that was created
     */

    initComponent: function() {
        var me = this;

        me.headerCounter = 0;
        me.plugins = me.plugins || [];
        me.defaults = me.defaults || {};

        // TODO: Pass in configurations to turn on/off dynamic
        //       resizing and disable resizing all together

        // Only set up a Resizer and Reorderer for the topmost HeaderContainer.
        // Nested Group Headers are themselves HeaderContainers
        if (!me.isColumn) {
            if (me.enableColumnResize) {
                me.resizer = new Ext.grid.plugin.HeaderResizer();
                me.plugins.push(me.resizer);
            }
            if (me.enableColumnMove) {
                me.reorderer = new Ext.grid.plugin.HeaderReorderer();
                me.plugins.push(me.reorderer);
            }
        }

        // If this is a leaf column header, and is NOT functioning as a container,
        // use Container layout with a no-op calculate method.
        if (me.isColumn && !me.isGroupHeader) {
            if (!me.items || me.items.length === 0) {
                me.isContainer = me.isFocusableContainer = false;
                me.focusable = true;
                me.layout = {
                    type: 'container',
                    calculate: Ext.emptyFn
                };
            }
        }
        // HeaderContainer and Group header needs a gridcolumn layout.
        else {
            me.layout = Ext.apply({
                type: 'gridcolumn',
                align: 'stretch'
            }, me.initialConfig.layout);

            // All HeaderContainers need to know this so that leaf Columns can adjust for cell border width if using content box model
            me.defaults.columnLines = me.columnLines;

            // If the header isn't a column ([isColumn] or [isGroupHeader]), then it's the root header.
            if (!me.isGroupHeader) {
                me.isRootHeader = true;

                // The root header is a focusableContainer if it's not carrying hidden headers.
                if (!me.hiddenHeaders) {
                    me.enableFocusableContainer = true;
                    me.ariaRole = 'row';
                }

                // Create column managers for the root header.
                me.columnManager = new Ext.grid.ColumnManager(false, me);
                me.visibleColumnManager = new Ext.grid.ColumnManager(true, me);

                // In the grid config, if grid.columns is a header container instance and not a columns
                // config, then it currently has no knowledge of a containing grid. Create the column
                // manager now and bind it to the grid later in Ext.panel.Table:initComponent().
                //
                // In most cases, though, grid.columns will be a config, so the grid is already known
                // and the column manager can be bound to it.
                if (me.grid) {
                    me.grid.columnManager = me.columnManager;
                    me.grid.visibleColumnManager = me.visibleColumnManager;
                }
            } else {
                // Is a group header, also create column managers.
                me.visibleColumnManager = new Ext.grid.ColumnManager(true, me);
                me.columnManager = new Ext.grid.ColumnManager(false, me);
            }
        }

        me.menuTask = new Ext.util.DelayedTask(me.updateMenuDisabledState, me);
        me.callParent();
    },

    insertNestedHeader: function (moveHeader) {
        var me = this,
            fromCt = moveHeader.ownerCt,
            toCt = me.ownerCt,
            layoutOwner = toCt.layout.owner,
            toIndex;

        if (fromCt) {
            if (me.isGroupHeader && !toCt.isNestedParent) {
                toIndex = layoutOwner.items.indexOf(me);
            }

            fromCt.remove(moveHeader, false);
        }

        if (toIndex === undefined) {
            toIndex = layoutOwner.items.indexOf(me);
        }

        layoutOwner.insert(toIndex, moveHeader);
    },

    isNested: function () {
        return !!this.getRootHeaderCt().down('[isNestedParent]');
    },

    isNestedGroupHeader: function () {
        // The owner only has one item that isn't hidden and it's me; hide the owner.
        var header = this,
            items = header.getRefOwner().query('>:not([hidden])');

        return (items.length === 1 && items[0] === header);
    },

    maybeShowNestedGroupHeader: function () {
        // Group headers are special in that they are auto-hidden when their subheaders are all
        // hidden and auto-shown when the first subheader is reshown. They are the only headers
        // that should now be auto-shown or -hidden.
        //
        // It follows that since group headers are dictated by some automation depending upon the
        // state of their child items that all group headers should be shown if anyone in the
        // hierarchy is shown since these special group headers only contain one child, which is
        // the next group header in the stack.
        // This only should apply to the following grouped header scenario:
        //
        //           +-----------------------------------+
        //           |               Group 1             |
        //           |-----------------------------------|
        //           |               Group 2             |
        //   other   |-----------------------------------|   other
        //  headers  |               Group 3             |  headers
        //           |-----------------------------------|
        //           | Field3 | Field4 | Field5 | Field6 |
        //           |===================================|
        //           |               view                |
        //           +-----------------------------------+
        //
        var items = this.items,
            item;

        if (items && items.length === 1 && (item = items.getAt(0)) && item.hidden) {
            item.show();
        }
    },

    setNestedParent: function (target) {
        // Here we need to prevent the removal of ancestor group headers from occuring if a flag is set. This
        // is needed when there are stacked group headers and only the deepest nested group header has leaf items
        // in its collection. In this specific scenario, the group headers above it only have 1 item, which is its
        // child nested group header.
        //
        // If we don't set this flag, then all of the grouped headers will be recursively removed all the way up to
        // the root container b/c Ext.grid.header.Container#onRemove will remove all containers that don't contain
        // any items.
        //
        // Note that if an ownerCt only has one item, then we know that this item is the group header that we're
        // currently dragging.
        //
        // Also, note that we mark the owner as the target header because everything up to that should be removed.
        //
        // We have to reset any previous headers that may have been target.ownerCts!
        target.isNestedParent = false;
        target.ownerCt.isNestedParent = !!(this.ownerCt.items.length === 1 && target.ownerCt.items.length === 1);
    },

    initEvents: function() {
        var me = this,
            onHeaderCtEvent,
            listeners;

        me.callParent();

        // If this is top level, listen for events to delegate to descendant headers.
        if (!me.isColumn && !me.isGroupHeader) {
            onHeaderCtEvent = me.onHeaderCtEvent;
            listeners = {
                click: onHeaderCtEvent,
                dblclick: onHeaderCtEvent,
                contextmenu: onHeaderCtEvent,
                mouseover: me.onHeaderCtMouseOver,
                mouseout: me.onHeaderCtMouseOut,
                scope: me
            };

            if (Ext.supports.Touch) {
                listeners.longpress = me.onHeaderCtLongPress;
            }
            me.mon(me.el, listeners);
        }
    },

    onHeaderCtEvent: function(e, t) {
        var me = this,
            headerEl = me.getHeaderElByEvent(e),
            header,
            targetEl,
            activeHeader;

        if (me.longPressFired) {
            // if we just showed the menu as a result of a longpress, do not process
            // the click event and sort the column.
            me.longPressFired = false;
            return;
        }

        if (headerEl && !me.ddLock) {
            header = Ext.getCmp(headerEl.id);
            if (header) {
                targetEl = header[header.clickTargetName];
                // If there's no possibility that the mouseEvent was on child header items,
                // or it was definitely in our titleEl, then process it
                if ((!header.isGroupHeader && !header.isContainer) || e.within(targetEl)) {
                    if (e.type === 'click' || e.type === 'tap') {
                        // The header decides which header to activate on click
                        // on Touch, anywhere in the splitter zone activates
                        // the left header.
                        activeHeader = header.onTitleElClick(e, targetEl, me.sortOnClick);
                        if (activeHeader) {
                            me.onHeaderTriggerClick(activeHeader, e, Ext.supports.Touch ? activeHeader.el : activeHeader.triggerEl);
                        } else {
                            me.onHeaderClick(header, e, t);
                        }
                    }
                    else if (e.type === 'contextmenu') {
                        me.onHeaderContextMenu(header, e, t);
                    } else if (e.type === 'dblclick' && header.resizable) {
                        header.onTitleElDblClick(e, targetEl.dom);
                    }
                }
            }
        }
    },

    onHeaderCtMouseOver: function(e, t) {
        var headerEl,
            header,
            targetEl;

        // Only proces the mouse entering this HeaderContainer.
        // From header to header, and exiting this HeaderContainer we track using mouseout events.
        if (!e.within(this.el, true)) {
            headerEl = e.getTarget('.' + Ext.grid.column.Column.prototype.baseCls);
            header = headerEl && Ext.getCmp(headerEl.id);
            if (header) {
                targetEl = header[header.clickTargetName];
                if (e.within(targetEl)) {
                    header.onTitleMouseOver(e, targetEl.dom);
                }
            }
        }
    },

    onHeaderCtMouseOut: function(e, t) {
        var headerSelector = '.' + Ext.grid.column.Column.prototype.baseCls,
            outHeaderEl = e.getTarget(headerSelector),
            inHeaderEl = e.getRelatedTarget(headerSelector),
            header,
            targetEl;

        // It's a mouseenter/leave, not an internal element change within a Header
        if (outHeaderEl !== inHeaderEl) {
            if (outHeaderEl) {
                header = Ext.getCmp(outHeaderEl.id);
                if (header) {
                    targetEl = header[header.clickTargetName];
                    header.onTitleMouseOut(e, targetEl.dom);
                }
            }
            if (inHeaderEl) {
                header = Ext.getCmp(inHeaderEl.id);
                if (header) {
                    targetEl = header[header.clickTargetName];
                    header.onTitleMouseOver(e, targetEl.dom);
                }
            }
        }
    },

    onHeaderCtLongPress: function(e) {
        var me = this,
            headerEl = me.getHeaderElByEvent(e),
            header = Ext.getCmp(headerEl.id);

        if (!header.menuDisabled) {
            me.longPressFired = true;
            me.showMenuBy(e, headerEl, header);
        }
    },

    getHeaderElByEvent: function(e) {
        return e.getTarget('.' + Ext.grid.column.Column.prototype.baseCls);
    },

    isLayoutRoot: function(){
        // Since we're docked, the width is always calculated
        // If we're hidden, the height is explicitly 0, which
        // means we'll be considered a layout root. However, we
        // still need the view to layout to update the underlying
        // table to match the size.
        if (this.hiddenHeaders) {
            return false;
        }
        return this.callParent();
    },

    // Find the topmost HeaderContainer
    getRootHeaderCt: function() {
        var me = this;
        return me.isRootHeader ? me : me.up('[isRootHeader]');
    },

    onDestroy: function() {
        var me = this;

        if (me.menu) {
            me.menu.un('hide', me.onMenuHide, me);
        }
        me.menuTask.cancel();
        me.callParent();
        Ext.destroy(me.visibleColumnManager, me.columnManager, me.menu);
        me.columnManager = me.visibleColumnManager = null;
    },

    applyColumnsState: function(columns) {
        if (!columns || !columns.length) {
            return;
        }

        var me     = this,
            items  = me.items.items,
            count  = items.length,
            i      = 0,
            length = columns.length,
            c, col, columnState, index,
            moved = false,
            newOrder = [],
            stateHash = {},
            newCols = [];

        // Create state lookup hash
        // {
        //      col_name: {
        //          index: 0,
        //          width: 100
        //      },
        //      col_email: {
        //          index: 1,
        //          width: 100
        //      }
        // }
        for (c = 0; c < length; c++) {
            columnState = columns[c];
            columnState.index = c;
            stateHash[columnState.id] = columnState;
        }

        for (i = 0; i < count; i++) {
            col = items[i];
            columnState = stateHash[col.getStateId()];

            // There's a column state for this column.
            // Add it to the newOrder array at the specified index
            if (columnState) {
                index = columnState.index;
                newOrder[index] = col;
                if (i !== index) {
                    moved = true;
                }

                if (col.applyColumnState) {
                    col.applyColumnState(columnState);
                }
            }
            // A new column.
            // It must be inserted at this index after state restoration,
            else {
                newCols.push({
                    index: i,
                    column: col
                });
            }
        }

        // If any saved columns were missing, close the gaps where they were
        newOrder = Ext.Array.clean(newOrder);

        // New column encountered.
        // Insert them into the newOrder at their configured position
        length = newCols.length;
        if (length) {
            for (i = 0; i < length; i++) {
                columnState = newCols[i];
                index = columnState.index;
                if (index < newOrder.length) {
                    moved = true;
                    Ext.Array.splice(newOrder, index, 0, columnState.column);
                } else {
                    newOrder.push(columnState.column);
                }
            }
        }

        if (moved) {
            me.removeAll(false);
            me.add(newOrder);
            me.purgeCache();
        }
    },

    getColumnsState: function () {
        var me = this,
            columns = [],
            state;

        me.items.each(function (col) {
            state = col.getColumnState && col.getColumnState();
            if (state) {
                columns.push(state);
            }
        });

        return columns;
    },

    // Invalidate column cache on add
    // We cannot refresh the View on every add because this method is called
    // when the HeaderDropZone moves Headers around, that will also refresh the view
    onAdd: function(c) {
        var me = this;

        if (!c.headerId) {
            c.headerId = c.initialConfig.id || Ext.id(null, 'header-');
        }
        if (c.sortable === undefined) {
            c.sortable = me.sortable;
        }

        // Only generate a stateId if it really needs one - ie, it cannot yield a stateId
        if (!c.getStateId()) {
            // This was the headerId generated in 4.0, so to preserve saved state, we now
            // assign a default stateId in that same manner. The stateId's of a column are
            // not global at the stateProvider, but are local to the grid state data. The
            // headerId should still follow our standard naming convention.
            c.stateId = c.initialConfig.id || ('h' + (++me.headerCounter));
        }

        //<debug>
        if (!me._usedIDs) {
            me._usedIDs = {};
        }
        if (me._usedIDs[c.headerId]) {
            Ext.log.warn(this.$className + ' attempted to reuse an existing id: ' + c.headerId);
        }
        me._usedIDs[c.headerId] = true;
        //</debug>

        me.callParent(arguments);

        me.onHeadersChanged(c, me.isDDMoveInGrid);
    },

    move: function(fromIdx, toIdx) {
        var me = this,
            items = me.items,
            headerToMove;

        if (fromIdx.isComponent) {
            headerToMove = fromIdx;
            fromIdx = items.indexOf(headerToMove);
        } else {
            headerToMove = items.getAt(fromIdx);
        }

        // Take real grid column index of column being moved
        headerToMove.visibleFromIdx = me.getRootHeaderCt().visibleColumnManager.indexOf(headerToMove);

        me.callParent(arguments);
    },

    onMove: function(headerToMove, fromIdx, toIdx) {
        var me = this,
            gridHeaderCt = me.getRootHeaderCt(),
            gridVisibleColumnManager = gridHeaderCt.visibleColumnManager,
            numColsToMove = 1,
            visibleToIdx;

        // Purges cache so that indexOf returns new position of header
        me.onHeadersChanged(headerToMove, true);

        visibleToIdx = gridVisibleColumnManager.indexOf(headerToMove);
        if (visibleToIdx >= headerToMove.visibleFromIdx) {
            visibleToIdx++;
        }

        me.callParent(arguments);

        // If what is being moved is a group header, then pass the correct column count
        if (headerToMove.isGroupHeader) {
            numColsToMove = headerToMove.visibleColumnManager.getColumns().length;
        }

        gridHeaderCt.onHeaderMoved(headerToMove, numColsToMove, headerToMove.visibleFromIdx, visibleToIdx);
    },

    // Invalidate column cache on remove
    // We cannot refresh the View on every remove because this method is called
    // when the HeaderDropZone moves Headers around, that will also refresh the view
    onRemove: function(c) {
        var me = this,
            ownerCt = me.ownerCt;

        me.callParent(arguments);

        //<debug>
        if (!me._usedIDs) {
            me._usedIDs = {};
        }
        delete me._usedIDs[c.headerId];
        //</debug>

        if (!me.destroying) {
            // isDDMoveInGrid flag set by Ext.grid.header.DropZone when moving into another container *within the same grid*.
            // This stops header change processing from being executed twice, once on remove and then on the subsequent add.
            if (!me.isDDMoveInGrid) {
                me.onHeadersChanged(c, false);
            }

            // Note that if the column is a group header and is the current target of a drag, we don't want to remove it
            // if it since it could be one of any number of (empty) nested group headers.
            // See #isNested.
            if (me.isGroupHeader && !me.isNestedParent && ownerCt && !me.items.getCount()) {
                // Detach the header from the DOM here. Since we're removing and destroying the container,
                // the inner DOM may get overwritten, since Container::deatchOnRemove gets processed after
                // onRemove.
                if (c.rendered) {
                    me.detachComponent(c);
                }
                // If we don't have any items left and we're a group, remove ourselves.
                // This will cascade up if necessary
                Ext.suspendLayouts();
                ownerCt.remove(me);
                Ext.resumeLayouts(true);
            }
        }
    },

    // Private
    // Called to clear all caches of columns whenever columns are added, removed to just moved.
    // We need to be informed if it's just a move operation so that we don't call the heavier
    // grid.onHeadersChanged which refreshes the view.
    // The onMove handler ensures that grid.inHeaderMove is called which just swaps cells.
    onHeadersChanged: function(c, isMove) {
        var gridPanel,
            gridHeaderCt = this.getRootHeaderCt();

        // Each HeaderContainer up the chain must have its cache purged so that its getGridColumns method will return correct results.
        this.purgeHeaderCtCache(this);

        if (gridHeaderCt) {
            gridHeaderCt.onColumnsChanged();
            if (!c.isGroupHeader) {
                gridPanel = gridHeaderCt.ownerCt;

                // If it an add or remove operation causing this header change call, then inform the grid which refreshes.
                // Moving calls the onHeaderMoved method of the grid which just swaps cells.
                if (gridPanel && !isMove) {
                    gridPanel.onHeadersChanged(gridHeaderCt, c);
                }
            }
        }
    },

    // Private
    onHeaderMoved: function(header, colsToMove, fromIdx, toIdx) {
        var me = this,
            gridSection = me.ownerCt;

        if (me.rendered) {
            if (gridSection && gridSection.onHeaderMove) {
                gridSection.onHeaderMove(me, header, colsToMove, fromIdx, toIdx);
            }
            me.fireEvent('columnmove', me, header, fromIdx, toIdx);
        }
    },

    // Private
    // Only called on the grid's headerCt.
    // Called whenever a column is added or removed or moved at any level below.
    // Ensures that the gridColumns caches are cleared.
    onColumnsChanged: function() {
        var me = this,
            menu = me.menu,
            columnItemSeparator,
            columnItem;

        if (me.rendered) {
            me.fireEvent('columnschanged', me);

            // Column item (and its associated menu) menu has to be destroyed (if it exits) when columns are changed.
            // It will be recreated just before the main container menu is next shown.
            if (menu && (columnItemSeparator = menu.child('#columnItemSeparator'))) {
                columnItem = menu.child('#columnItem');

                // Destroy the column visibility items
                // They will be recreated before the next show
                columnItemSeparator.destroy();
                columnItem.destroy();
            }
        }
    },
    
    // @private
    lookupComponent: function(comp) {
        var result = this.callParent(arguments);

        // Apply default width unless it's a group header (in which case it must be left to shrinkwrap), or it's flexed.
        // Test whether width is undefined so that width: null can be used to have the header shrinkwrap its text.
        if (!result.isGroupHeader && result.width === undefined && !result.flex) {
            result.width = this.defaultWidth;
        }
        return result;
    },

    // Private
    // Synchronize column UI visible sort state with Store's sorters.
    setSortState: function() {
        var store   = this.up('[store]').store,
            columns = this.visibleColumnManager.getColumns(),
            len = columns.length, i,
            header, sorter;

        for (i = 0; i < len; i++) {
            header = columns[i];
            sorter = store.getSorters().get(header.getSortParam());

            // Important: A null sorter for this column will *clear* the UI sort indicator.
            header.setSortState(sorter);
        }
    },

    getHeaderMenu: function(){
        var menu = this.getMenu(),
            item;

        if (menu) {
            item = menu.child('#columnItem');
            if (item) {
                return item.menu;
            }
        }
        return null;
    },

    onHeaderVisibilityChange: function(header, visible){
        var me = this,
            menu = me.getHeaderMenu(),
            item;

        // Invalidate column collections upon column hide/show
        me.purgeHeaderCtCache(header.ownerCt);

        if (menu) {
            // If the header was hidden programmatically, sync the Menu state
            item = me.getMenuItemForHeader(menu, header);
            if (item) {
                item.setChecked(visible, true);
            }
            // delay this since the headers may fire a number of times if we're hiding/showing groups
            if (menu.isVisible()) {
                me.menuTask.delay(50);
            }
        }
    },

    updateMenuDisabledState: function(menu) {
        var me = this,
            columns = me.query(':not([hidden])'),
            i,
            len = columns.length,
            item,
            checkItem,
            method;

        // If called from menu creation, it will be passed to avoid infinite recursion
        if (!menu) {
            menu = me.getMenu();
        }

        for (i = 0; i < len; ++i) {
            item = columns[i];
            checkItem = me.getMenuItemForHeader(menu, item);
            if (checkItem) {
                method = item.isHideable() ? 'enable' : 'disable';
                if (checkItem.menu) {
                    method += 'CheckChange';
                }
                checkItem[method]();
            }
        }
    },

    getMenuItemForHeader: function(menu, header) {
        return header ? menu.down('menucheckitem[headerId=' + header.id + ']') : null;
    },

    onHeaderShow: function (header) {
        var me = this,
            ownerCt = me.ownerCt;

        if (!ownerCt) {
            return;
        }

        if (me.forceFit) {
            delete me.flex;
        }

        me.onHeaderVisibilityChange(header, true);
        ownerCt.onHeaderShow(me, header);

        me.fireEvent('columnshow', me, header);
        me.fireEvent('columnschanged', this);
    },

    onHeaderHide: function (header) {
        var me = this,
            ownerCt = me.ownerCt;

        if (!ownerCt) {
            return;
        }

        me.onHeaderVisibilityChange(header, false);
        ownerCt.onHeaderHide(me, header);

        me.fireEvent('columnhide', me, header);
        me.fireEvent('columnschanged', this);
    },

    onHeaderResize: function(header, w) {
        var me = this,
            gridSection = me.ownerCt;

        if (gridSection) {
            gridSection.onHeaderResize(me, header, w);
        }
        me.fireEvent('columnresize', me, header, w);
    },

    onHeaderClick: function(header, e, t) {
        var me = this,
            selModel = header.getView().getSelectionModel();

        header.fireEvent('headerclick', me, header, e, t);
        if (me.fireEvent('headerclick', me, header, e, t) !== false) {
            if (selModel.onHeaderClick) {
                selModel.onHeaderClick(me, header, e);
            }
        }
    },

    onHeaderContextMenu: function(header, e, t) {
        header.fireEvent('headercontextmenu', this, header, e, t);
        this.fireEvent('headercontextmenu', this, header, e, t);
    },

    onHeaderTriggerClick: function(header, e, t) {
        var me = this;
        if (header.fireEvent('headertriggerclick', me, header, e, t) !== false && me.fireEvent('headertriggerclick', me, header, e, t) !== false) {

            // If menu is already active...
            if (header.activeMenu) {
                // Click/tap toggles the menu visibility.
                if (e.pointerType) {
                    header.activeMenu.hide();
                } else {
                    header.activeMenu.focus();
                }
            }
            else { 
                me.showMenuBy(e, t, header);
            }
        }
    },

    /**
     * @private
     *
     * Shows the column menu under the target element passed. This method is used when the trigger element on the column
     * header is clicked on and rarely should be used otherwise.
     *
     * @param {Ext.event.Event} [event] The event which triggered the current handler. If omitted
     * or a key event, the menu autofocuses its first item.
     * @param {HTMLElement/Ext.dom.Element} t The target to show the menu by
     * @param {Ext.grid.header.Container} header The header container that the trigger was clicked on.
     */
    showMenuBy: function(clickEvent, t, header) {
        var menu = this.getMenu(),
            ascItem  = menu.down('#ascItem'),
            descItem = menu.down('#descItem'),
            sortableMth;

        // Use ownerCmp as the upward link. Menus *must have no ownerCt* - they are global floaters.
        // Upward navigation is done using the up() method.
        menu.activeHeader = menu.ownerCmp = header;
        header.setMenuActive(menu);

        // enable or disable asc & desc menu items based on header being sortable
        sortableMth = header.sortable ? 'enable' : 'disable';
        if (ascItem) {
            ascItem[sortableMth]();
        }
        if (descItem) {
            descItem[sortableMth]();
        }

        // Pointer-invoked menus do not auto focus, key invoked ones do.
        menu.autoFocus = !clickEvent || !clickEvent.pointerType;
        menu.showBy(t, 'tl-bl?');

        // Menu show was vetoed by event handler - clear context
        if (!menu.isVisible()) {
            this.onMenuHide(menu);
        }
    },

    hideMenu: function() {
        if (this.menu) {
            this.menu.hide();
        }
    },

    // remove the trigger open class when the menu is hidden
    onMenuHide: function(menu) {
        menu.activeHeader.setMenuActive(false);
    },

    purgeHeaderCtCache: function (headerCt) {
        while (headerCt) {
            headerCt.purgeCache();
            if (headerCt.isRootHeader) {
                return;
            }
            headerCt = headerCt.ownerCt;
        }
    },

    purgeCache: function() {
        var me = this,
            visibleColumnManager = me.visibleColumnManager,
            columnManager = me.columnManager;

        // Delete column cache - column order has changed.
        me.gridVisibleColumns = me.gridDataColumns = me.hideableColumns = null;

        // ColumnManager. Only the top
        if (visibleColumnManager) {
            visibleColumnManager.invalidate();
            columnManager.invalidate();
        }
    },

    /**
     * Gets the menu (and will create it if it doesn't already exist)
     * @private
     */
    getMenu: function() {
        var me = this;

        if (!me.menu) {
            me.menu = new Ext.menu.Menu({
                hideOnParentHide: false,  // Persists when owning ColumnHeader is hidden
                items: me.getMenuItems(),
                listeners: {
                    beforeshow: me.beforeMenuShow,
                    hide: me.onMenuHide,
                    scope: me
                }
            });
            me.fireEvent('menucreate', me, me.menu);
        }
        return me.menu;
    },

    // Render our menus to the first enclosing scrolling element so that they scroll with the grid
    beforeMenuShow: function(menu) {
        var me = this,
            columnItem = menu.child('#columnItem'),
            hideableColumns,
            insertPoint;

        // If a change of column structure caused destruction of the column menu item
        // or the main menu was created without the column menu item because it began with no hideable headers
        // Then create it and its menu now.
        if (!columnItem) {
            hideableColumns = me.enableColumnHide ? me.getColumnMenu(me) : null;

            // Insert after the "Sort Ascending", "Sort Descending" menu items if they are present.
            insertPoint = me.sortable ? 2 : 0;

            if (hideableColumns && hideableColumns.length) {
                menu.insert(insertPoint, [{
                    itemId: 'columnItemSeparator',
                    xtype: 'menuseparator'
                }, {
                    itemId: 'columnItem',
                    text: me.columnsText,
                    iconCls: me.menuColsIcon,
                    menu: {
                        items: hideableColumns
                    },
                    hideOnClick: false
                }]);
            }
        }

        me.updateMenuDisabledState(me.menu);
        // TODO: rendering the menu to the nearest overlfowing ancestor has been disabled
        // since DomQuery is no longer available by default in 5.0
//        if (!menu.rendered) {
//            menu.render(this.el.up('{overflow=auto}') || document.body);
//        }
    },

    /**
     * Returns an array of menu items to be placed into the shared menu
     * across all headers in this header container.
     * @return {Array} menuItems
     */
    getMenuItems: function() {
        var me = this,
            menuItems = [],
            hideableColumns = me.enableColumnHide ? me.getColumnMenu(me) : null;

        if (me.sortable) {
            menuItems = [{
                itemId: 'ascItem',
                text: me.sortAscText,
                iconCls: me.menuSortAscCls,
                handler: me.onSortAscClick,
                scope: me
            },{
                itemId: 'descItem',
                text: me.sortDescText,
                iconCls: me.menuSortDescCls,
                handler: me.onSortDescClick,
                scope: me
            }];
        }
        if (hideableColumns && hideableColumns.length) {
            if (me.sortable) {
                menuItems.push({
                    itemId: 'columnItemSeparator',
                    xtype: 'menuseparator'
                });
            }
            menuItems.push({
                itemId: 'columnItem',
                text: me.columnsText,
                iconCls: me.menuColsIcon,
                menu: hideableColumns,
                hideOnClick: false
            });
        }
        return menuItems;
    },

    // sort asc when clicking on item in menu
    onSortAscClick: function() {
        var menu = this.getMenu(),
            activeHeader = menu.activeHeader;

        activeHeader.sort('ASC');
    },

    // sort desc when clicking on item in menu
    onSortDescClick: function() {
        var menu = this.getMenu(),
            activeHeader = menu.activeHeader;

        activeHeader.sort('DESC');
    },

    /**
     * Returns an array of menu CheckItems corresponding to all immediate children
     * of the passed Container which have been configured as hideable.
     */
    getColumnMenu: function(headerContainer) {
        var menuItems = [],
            i = 0,
            item,
            items = headerContainer.query('>gridcolumn[hideable]'),
            itemsLn = items.length,
            menuItem;

        for (; i < itemsLn; i++) {
            item = items[i];
            menuItem = new Ext.menu.CheckItem({
                text: item.menuText || item.text,
                checked: !item.hidden,
                hideOnClick: false,
                headerId: item.id,
                menu: item.isGroupHeader ? this.getColumnMenu(item) : undefined,
                checkHandler: this.onColumnCheckChange,
                scope: this
            });
            menuItems.push(menuItem);
        }
        // Prevent creating a submenu if we have no items
        return menuItems.length ? menuItems : null;
    },

    onColumnCheckChange: function(checkItem, checked) {
        var header = Ext.getCmp(checkItem.headerId),
            headerId;

        if (header.rendered) {
            header[checked ? 'show' : 'hide']();
            headerId = header.lastCheckedHeaderId;

            // If there's a headerId then we know we need to restore the checked status of the last check item that was deselected
            // (and therefore the group was hidden).
            if (checked && headerId) {
                header.getRootHeaderCt().getMenu().down('[headerId=' + headerId + ']').setChecked(true);
                header.lastCheckedHeaderId = null;
            }
        } else {
            header.hidden = !checked;
        }
    },

    /**
     * Returns the number of <b>grid columns</b> descended from this HeaderContainer.
     * Group Columns are HeaderContainers. All grid columns are returned, including hidden ones.
     */
    getColumnCount: function() {
        return this.getGridColumns().length;
    },

    /**
     * Gets the full width of all columns that are visible for setting width of tables.
     */
    getTableWidth: function() {
        var fullWidth = 0,
            headers = this.getVisibleGridColumns(),
            headersLn = headers.length,
            i;

        for (i = 0; i < headersLn; i++) {
            fullWidth += headers[i].getCellWidth() || 0;
        }
        return fullWidth;
    },

    /**
     * Returns an array of the **visible** columns in the grid. This goes down to the
     * lowest column header level, and does not return **grouped** headers which contain
     * sub headers.
     *
     * See also {@link Ext.grid.header.Container#getGridColumns}
     * @return {Ext.grid.column.Column[]} columns An array of visible columns.  Returns
     * an empty array if no visible columns are found.
     */
    getVisibleGridColumns: function() {
        var me = this,
            allColumns, rootHeader,
            result, len, i, column;

        if (me.gridVisibleColumns) {
            return me.gridVisibleColumns;
        }

        allColumns = me.getGridColumns();
        rootHeader = me.getRootHeaderCt();
        result = [];
        len = allColumns.length;

        // Use an inline check instead of ComponentQuery filtering for better performance for
        // repeated grid row rendering - as in buffered rendering.
        for (i = 0; i < len; i++) {
            column = allColumns[i];

            if (!column.hidden && !column.isColumnHidden(rootHeader)) {
                result[result.length] = column;
            }
        }

        me.gridVisibleColumns = result;

        return result;
    },

    isColumnHidden: function(rootHeader) {
        var owner = this.getRefOwner();
        while (owner && owner !== rootHeader) {
            if (owner.hidden) {
                return true;
            }
            owner = owner.getRefOwner();
        }
        return false;
    },

    /**
     * @method getGridColumns
     * Returns an array of all columns which exist in the grid's View, visible or not.
     * This goes down to the leaf column header level, and does not return **grouped**
     * headers which contain sub headers.
     *
     * It includes hidden headers even though they are not rendered. This is for
     * collection of menu items for the column hide/show menu.
     *
     * Headers which have a hidden ancestor have a `hiddenAncestor: true` property
     * injected so that descendants are known to be hidden without interrogating that
     * header's ownerCt axis for a hidden ancestor.
     *
     * See also {@link Ext.grid.header.Container#getVisibleGridColumns}
     * @return {Ext.grid.column.Column[]} columns An array of columns.  Returns an
     * empty array if no columns are found.
     */
    /** @ignore */
    getGridColumns: function(/* private - used in recursion*/inResult, hiddenAncestor) {
        if (!inResult && this.gridDataColumns) {
            return this.gridDataColumns;
        }

        var me = this,
            result = inResult || [],
            items, i, len, item,
            lastVisibleColumn;

        hiddenAncestor = hiddenAncestor || me.hidden;
        if (me.items) {
            items = me.items.items;

            // An ActionColumn (Columns extend HeaderContainer) may have an items *array* being the action items that it renders.
            if (items) {
                for (i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    if (item.isGroupHeader) {
                        // Group headers will need a visibleIndex for if/when they're removed from their owner.
                        // See Ext.layout.container.Container#moveItemBefore.
                        item.visibleIndex = result.length;
                        item.getGridColumns(result, hiddenAncestor);
                    } else {
                        item.hiddenAncestor = hiddenAncestor;
                        result.push(item);
                    }
                }
            }
        }
        if (!inResult) {
            me.gridDataColumns = result;
        }

        // If top level, correct first and last visible column flags
        if (!inResult && len) {
            // Set firstVisible and lastVisible flags
            for (i = 0, len = result.length; i < len; i++) {
                item = result[i];

                // The column index within all (visible AND hidden) leaf level columns.
                // Used as the cellIndex in TableView's cell renderer call
                item.fullColumnIndex = i;
                item.isFirstVisible = item.isLastVisible = false;
                if (!(item.hidden || item.hiddenAncestor)) {
                    if (!lastVisibleColumn) {
                        item.isFirstVisible = true;
                    }
                    lastVisibleColumn = item;
                }
            }
            // If we haven't hidden all columns, tag the last visible one encountered
            if (lastVisibleColumn) {
                lastVisibleColumn.isLastVisible = true;
            }
        }

        return result;
    },

    /**
     * @private
     * For use by column headers in determining whether there are any hideable columns when deciding whether or not
     * the header menu should be disabled.
     */
    getHideableColumns: function() {
        var me = this,
            result = me.hideableColumns;

        if (!result) {
            result = me.hideableColumns = me.query('[hideable]');
        }
        return result;
    },

    /**
     * Returns the index of a leaf level header regardless of what the nesting
     * structure is.
     *
     * If a group header is passed, the index of the first leaf level header within it is returned.
     *
     * @param {Ext.grid.column.Column} header The header to find the index of
     * @return {Number} The index of the specified column header
     */
    getHeaderIndex: function (header) {
        // Binding the columnManager to a column makes it backwards-compatible with versions
        // that only bind the columnManager to a root header.
        if (!this.columnManager) {
            this.columnManager = this.getRootHeaderCt().columnManager;
        }

        return this.columnManager.getHeaderIndex(header);
    },

    /**
     * Get a leaf level header by index regardless of what the nesting
     * structure is.
     *
     * @param {Number} index The column index for which to retrieve the column.
     */
    getHeaderAtIndex: function (index) {
        // Binding the columnManager to a column makes it backwards-compatible with versions
        // that only bind the columnManager to a root header.
        if (!this.columnManager) {
            this.columnManager = this.getRootHeaderCt().columnManager;
        }

        return this.columnManager.getHeaderAtIndex(index);
    },

    /**
     * When passed a column index, returns the closet *visible* column to that. If the column at the passed index is visible,
     * that is returned. If it is hidden, either the next visible, or the previous visible column is returned.
     *
     * @param {Number} index Position at which to find the closest visible column.
     */
    getVisibleHeaderClosestToIndex: function (index) {
        // Binding the columnManager to a column makes it backwards-compatible with versions
        // that only bind the columnManager to a root header.
        if (!this.visibleColumnManager) {
            this.visibleColumnManager = this.getRootHeaderCt().visibleColumnManager;
        }

        return this.visibleColumnManager.getVisibleHeaderClosestToIndex(index);
    },

    applyForceFit: function (header) {
        var me = this,
            view = me.view,
            minWidth = Ext.grid.plugin.HeaderResizer.prototype.minColWidth,
            // Used when a column's max contents are larger than the available view width.
            useMinWidthForFlex = false,
            defaultWidth = Ext.grid.header.Container.prototype.defaultWidth,
            availFlex = me.el.dom.clientWidth - (view.el.dom.scrollHeight > view.el.dom.clientHeight ? Ext.getScrollbarSize().width : 0),
            totalFlex = 0,
            items = me.getVisibleGridColumns(),
            hidden = header.hidden,
            len, i,
            item,
            maxAvailFlexOneColumn,
            myWidth;

        function getTotalFlex() {
            for (i = 0, len = items.length; i < len; i++) {
                item = items[i];

                // Skip the current header.
                if (item === header) {
                    continue;
                }

                item.flex = item.flex || item.width || item.getWidth();
                totalFlex += item.flex;
                item.width = null;
            }
        }

        function applyWidth() {
            // The currently-sized column (whether resized or reshown) will already
            // have a width, so all other columns will need to be flexed.
            var isCurrentHeader;

            for (i = 0, len = items.length; i < len; i++) {
                item = items[i];
                isCurrentHeader = (item === header);

                if (useMinWidthForFlex && !isCurrentHeader) {
                    // The selected column is extremely large so set all the others as flex minWidth.
                    item.flex = minWidth;
                    item.width = null;
                } else if (!isCurrentHeader) {
                    // Note that any widths MUST be converted to flex. Imagine that all but one columns
                    // are hidden.  The widths of each column very easily could be greater than the total
                    // available width (think about the how visible header widths increase as sibling
                    // columns are hidden), so they cannot be reliably used to size the header, and the only
                    // safe approach is to convert any all widths to flex (except for the current header).
                    myWidth = item.flex || defaultWidth;
                    item.flex = Math.max(Math.ceil((myWidth / totalFlex) * availFlex), minWidth);
                    item.width = null;
                }

                item.setWidth(item.width || item.flex);
            }
        }

        Ext.suspendLayouts();

        // Determine the max amount of flex that a single column can have.
        maxAvailFlexOneColumn = (availFlex - ((items.length + 1) * minWidth));

        // First, remove the header's flex as it should always receive a set width
        // since it is the header being operated on.
        header.flex = null;

        if (hidden) {
            myWidth = header.width || header.savedWidth;
            header.savedWidth = null;
        } else {
            myWidth = view.getMaxContentWidth(header);
        }

        // We need to know if the max content width of the selected column would blow out the
        // grid. If so, all the other visible columns will be flexed to minWidth.
        if (myWidth >  maxAvailFlexOneColumn) {
            header.width = maxAvailFlexOneColumn;
            useMinWidthForFlex = true;
        } else {
            header.width = myWidth;

            // Substract the current header's width from the available flex + some padding
            // to ensure that the last column doesn't get nudged out of the view.
            availFlex -= myWidth + defaultWidth;
            getTotalFlex();
        }

        applyWidth();

        Ext.resumeLayouts(true);
    },

    autoSizeColumn: function (header) {
        var view = this.view;

        if (view) {
            view.autoSizeColumn(header);
            if (this.forceFit) {
                this.applyForceFit(header);
            }
        }
    },

    privates: {
        beginChildHide: function() {
            ++this.childHideCount;
        },

        endChildHide: function() {
            --this.childHideCount;
        },

        getFocusables: function() {
            return this.isRootHeader ?
                this.getVisibleGridColumns() :
                this.items.items;
        },

        createFocusableContainerKeyNav: function(el) {
            var me = this;

            return new Ext.util.KeyNav(el, {
                scope: me,

                down: me.showHeaderMenu,
                left: me.onFocusableContainerLeftKey,
                right: me.onFocusableContainerRightKey,

                space: me.onHeaderActivate,
                enter: me.onHeaderActivate
            });
        },

        showHeaderMenu: function(e) {
            var column = this.getFocusableFromEvent(e);

            // DownArrow event must be from a column, not a Component within the column (eg filter fields)
            if (column && column.isColumn && column.triggerEl) {
                this.onHeaderTriggerClick(column, e, column.triggerEl);
            }
        },

        onHeaderActivate: function(e) {
            var column = this.getFocusableFromEvent(e),
                view,
                lastFocused;

            // Remember that not every descendant of a headerCt is a column! It could be a child component of a column.
            if (column && column.isColumn) {
                view = column.getView();

                // Sort the column is configured that way.
                // sortOnClick may be set to false by SpreadsheelSelectionModel to allow click to select a column.
                if (column.sortable && this.sortOnClick) {
                    lastFocused = view.getNavigationModel().getLastFocused();
                    column.toggleSortState();

                    // After keyboard sort, bring last focused record into view
                    if (lastFocused) {
                        view.ownerCt.ensureVisible(lastFocused.record);
                    }
                }
                // onHeaderClick is a necessary part of accessibility processing, sortable or not.
                this.onHeaderClick(column, e, column.el);
            }
        },

        onFocusableContainerMousedown: function(e, target) {
            var targetCmp = Ext.Component.fromElement(target);

            if (targetCmp === this) {
                e.preventDefault();
            } else {
                // The DDManager (Header Containers are draggable) prevents mousedown default
                // So we must explicitly focus the header
                targetCmp.focus();
            }
        }
    }
});
