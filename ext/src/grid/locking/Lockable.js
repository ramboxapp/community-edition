/**
 * @private
 *
 * Lockable is a private mixin which injects lockable behavior into any
 * TablePanel subclass such as GridPanel or TreePanel. TablePanel will
 * automatically inject the Ext.grid.locking.Lockable mixin in when one of the
 * these conditions are met:
 *
 *  - The TablePanel has the lockable configuration set to true
 *  - One of the columns in the TablePanel has locked set to true/false
 *
 * Each TablePanel subclass must register an alias. It should have an array
 * of configurations to copy to the 2 separate tablepanels that will be generated
 * to note what configurations should be copied. These are named normalCfgCopy and
 * lockedCfgCopy respectively.
 *
 * Configurations which are specified in this class will be available on any grid or
 * tree which is using the lockable functionality.
 *
 * By default the two grids, "locked" and "normal" will be arranged using an {@link Ext.layout.container.HBox hbox}
 * layout. If the lockable grid is configured with `{@link #split split:true}`, a vertical splitter
 * will be placed between the two grids to resize them.
 *
 * It is possible to override the layout of the lockable grid, or example, you may wish to
 * use a border layout and have one of the grids collapsible.
 */
Ext.define('Ext.grid.locking.Lockable', {
    alternateClassName: 'Ext.grid.Lockable',

    requires: [
        'Ext.grid.locking.View',
        'Ext.grid.header.Container',
        'Ext.grid.locking.HeaderContainer',
        'Ext.view.Table'
    ],

    /**
     * @cfg {Boolean} syncRowHeight Synchronize rowHeight between the normal and
     * locked grid view. This is turned on by default. If your grid is guaranteed
     * to have rows of all the same height, you should set this to false to
     * optimize performance.
     */
    syncRowHeight: true,

    /**
     * @cfg {String} subGridXType The xtype of the subgrid to specify. If this is
     * not specified lockable will determine the subgrid xtype to create by the
     * following rule. Use the superclasses xtype if the superclass is NOT
     * tablepanel, otherwise use the xtype itself.
     */

    /**
     * @cfg {Object} lockedViewConfig A view configuration to be applied to the
     * locked side of the grid. Any conflicting configurations between lockedViewConfig
     * and viewConfig will be overwritten by the lockedViewConfig.
     */

    /**
     * @cfg {Object} normalViewConfig A view configuration to be applied to the
     * normal/unlocked side of the grid. Any conflicting configurations between normalViewConfig
     * and viewConfig will be overwritten by the normalViewConfig.
     */

    headerCounter: 0,

    /**
     * @cfg {Number} scrollDelta
     * Number of pixels to scroll when scrolling the locked section with mousewheel.
     */
    scrollDelta: 40,

    /**
     * @cfg {Object} lockedGridConfig
     * Any special configuration options for the locked part of the grid
     */

    /**
     * @cfg {Object} normalGridConfig
     * Any special configuration options for the normal part of the grid
     */

    /**
     * @cfg {Boolean} [split=false]
     * Configure as true to place a resizing {@link Ext.resizer.Splitter splitter} between the locked
     * and unlocked columns.
     */

    /**
     * @cfg {Object} [layout]
     * By default, a lockable grid uses an {@link Ext.layout.container.HBox HBox} layout to arrange
     * the two grids (possibly separated by a splitter).
     *
     * Using this config it is possible to specify a different layout to arrange the two grids.
     */

    lockedGridCls: Ext.baseCSSPrefix + 'grid-inner-locked',
    normalGridCls: Ext.baseCSSPrefix + 'grid-inner-normal',

    // i8n text
    //<locale>
    unlockText: 'Unlock',
    //</locale>
    //<locale>
    lockText: 'Lock',
    //</locale>

    // Required for the Lockable Mixin. These are the configurations which will be copied to the
    // normal and locked sub tablepanels
    bothCfgCopy: [
        'invalidateScrollerOnRefresh',
        'hideHeaders',
        'enableColumnHide',
        'enableColumnMove',
        'enableColumnResize',
        'sortableColumns',
        'multiColumnSort',
        'columnLines',
        'rowLines',
        'variableRowHeight',
        'numFromEdge',
        'trailingBufferZone',
        'leadingBufferZone',
        'scrollToLoadBuffer'
    ],
    normalCfgCopy: [
        'verticalScroller',
        'verticalScrollDock',
        'verticalScrollerType',
        'scroll'
    ],
    lockedCfgCopy: [],

    /**
     * @event processcolumns
     * Fires when the configured (or **reconfigured**) column set is split into two depending on the {@link Ext.grid.column.Column#locked locked} flag.
     * @param {Ext.grid.column.Column[]} lockedColumns The locked columns.
     * @param {Ext.grid.column.Column[]} normalColumns The normal columns.
     */

    /**
     * @event lockcolumn
     * Fires when a column is locked.
     * @param {Ext.grid.Panel} this The gridpanel.
     * @param {Ext.grid.column.Column} column The column being locked.
     */

    /**
     * @event unlockcolumn
     * Fires when a column is unlocked.
     * @param {Ext.grid.Panel} this The gridpanel.
     * @param {Ext.grid.column.Column} column The column being unlocked.
     */

    determineXTypeToCreate: function(lockedSide) {
        var me = this,
            typeToCreate,
            xtypes, xtypesLn, xtype, superxtype;

        if (me.subGridXType) {
            typeToCreate = me.subGridXType;
        } else {
            // Treeness only moves down into the locked side.
            // The normal side is always just a grid
            if (!lockedSide) {
                return 'gridpanel';
            }
            xtypes     = this.getXTypes().split('/');
            xtypesLn   = xtypes.length;
            xtype      = xtypes[xtypesLn - 1];
            superxtype = xtypes[xtypesLn - 2];

            if (superxtype !== 'tablepanel') {
                typeToCreate = superxtype;
            } else {
                typeToCreate = xtype;
            }
        }

        return typeToCreate;
    },

    // injectLockable will be invoked before initComponent's parent class implementation
    // is called, so throughout this method this. are configurations
    injectLockable: function() {
        // The child grids are focusable, not this one
        this.focusable = false;

        // ensure lockable is set to true in the TablePanel
        this.lockable = true;
        // Instruct the TablePanel it already has a view and not to create one.
        // We are going to aggregate 2 copies of whatever TablePanel we are using
        this.hasView = true;

        var me = this,
            scrollbarSize = Ext.getScrollbarSize(),
            scrollbarWidth = scrollbarSize.width,
            store = me.store = Ext.StoreManager.lookup(me.store),
            lockedViewConfig = me.lockedViewConfig,
            normalViewConfig = me.normalViewConfig,
            Obj = Ext.Object,

            // Hash of {lockedFeatures:[],normalFeatures:[]}
            allFeatures,

            // Hash of {topPlugins:[],lockedPlugins:[],normalPlugins:[]}
            allPlugins,

            lockedGrid,
            normalGrid,
            i,
            columns,
            lockedHeaderCt,
            normalHeaderCt,
            listeners,
            viewConfig = me.viewConfig,
            // When setting the loadMask value, the viewConfig wins if it is defined.
            loadMaskCfg = viewConfig && viewConfig.loadMask,
            loadMask = (loadMaskCfg !== undefined) ? loadMaskCfg : me.loadMask,
            bufferedRenderer = me.bufferedRenderer,
            clipVertLockedScrollbar = scrollbarWidth > 0 && Ext.supports.touchScroll !== 2;

        allFeatures = me.constructLockableFeatures();

        // This is just a "shell" Panel which acts as a Container for the two grids and must not use the features
        me.features = null;

        // Distribute plugins to whichever Component needs them
        allPlugins = me.constructLockablePlugins();
        me.plugins = allPlugins.topPlugins;

        lockedGrid = {
            id: me.id + '-locked',
            isLocked: true,
            bufferedRenderer: bufferedRenderer,
            ownerGrid: me,
            ownerLockable: me,
            xtype: me.determineXTypeToCreate(true),
            store: store,
            // if the browser's scrollbars take up space we always reserve space for the
            // vertical scrollbar on the locked side.  This allows us to hide the vertical
            // scrollbar by clipping it using the locked grid's body element.
            reserveScrollbar: clipVertLockedScrollbar,
            scrollable: {
                indicators: {
                    x: true,
                    y: false
                }
            },
            scrollerOwner: false,
            // Lockable does NOT support animations for Tree
            // Because the right side is just a grid, and the grid view doen't animate bulk insertions/removals
            animate: false,
            border: false,
            cls: me.lockedGridCls,

            // Usually a layout in one side necessitates the laying out of the other side even if each is fully
            // managed in both dimensions, and is therefore a layout root.
            // The only situation that we do *not* want layouts to escape into the owning lockable assembly
            // is when using a border layout and any of the border regions is floated from a collapsed state.
            isLayoutRoot: function() {
                return this.floatedFromCollapse || me.normalGrid.floatedFromCollapse;
            },
            features: allFeatures.lockedFeatures,
            plugins: allPlugins.lockedPlugins
        };

        normalGrid = {
            id: me.id + '-normal',
            isLocked: false,
            bufferedRenderer: bufferedRenderer,
            ownerGrid: me,
            ownerLockable: me,
            xtype: me.determineXTypeToCreate(),
            store: store,
            // Pass down our reserveScrollbar to the normal side:
            reserveScrollbar: me.reserveScrollbar,
            scrollerOwner: false,
            border: false,
            cls: me.normalGridCls,

            // As described above, isolate layouts when floated out from a collapsed border region.
            isLayoutRoot: function() {
                return this.floatedFromCollapse || me.lockedGrid.floatedFromCollapse;
            },
            features: allFeatures.normalFeatures,
            plugins: allPlugins.normalPlugins
        };

        me.addCls(Ext.baseCSSPrefix + 'grid-locked');

        // Copy appropriate configurations to the respective aggregated tablepanel instances.
        // Pass 4th param true to NOT exclude those settings on our prototype.
        // Delete them from the master tablepanel.
        Ext.copyTo(normalGrid, me, me.bothCfgCopy, true);
        Ext.copyTo(lockedGrid, me, me.bothCfgCopy, true);
        Ext.copyTo(normalGrid, me, me.normalCfgCopy, true);
        Ext.copyTo(lockedGrid, me, me.lockedCfgCopy, true);

        Ext.apply(normalGrid, me.normalGridConfig);
        Ext.apply(lockedGrid, me.lockedGridConfig);

        for (i = 0; i < me.normalCfgCopy.length; i++) {
            delete me[me.normalCfgCopy[i]];
        }

        for (i = 0; i < me.lockedCfgCopy.length; i++) {
            delete me[me.lockedCfgCopy[i]];
        }

        me.addStateEvents(['lockcolumn', 'unlockcolumn']);

        columns = me.processColumns(me.columns || [], lockedGrid);

        lockedGrid.columns = columns.locked;

        // If no locked columns, hide the locked grid
        if (!lockedGrid.columns.items.length) {
            lockedGrid.hidden = true;
        }
        normalGrid.columns = columns.normal;

        if (!normalGrid.columns.items.length) {
            normalGrid.hidden = true;
        }

        // normal grid should flex the rest of the width
        normalGrid.flex = 1;
        // Chain view configs to avoid mutating user's config
        lockedGrid.viewConfig = lockedViewConfig = (lockedViewConfig ? Obj.chain(lockedViewConfig) : {});
        normalGrid.viewConfig = normalViewConfig = (normalViewConfig ? Obj.chain(normalViewConfig) : {});
        lockedViewConfig.loadingUseMsg = false;
        lockedViewConfig.loadMask = false;
        if (clipVertLockedScrollbar) {
            lockedViewConfig.margin = '0 -' + scrollbarWidth + ' 0 0';
        }

        normalViewConfig.loadMask = false;

        //<debug>
        if (viewConfig && viewConfig.id) {
            Ext.log.warn('id specified on Lockable viewConfig, it will be shared between both views: "' + viewConfig.id + '"');
        }
        //</debug>

        Ext.applyIf(lockedViewConfig, viewConfig);
        Ext.applyIf(normalViewConfig, viewConfig);

        // Allow developer to configure the layout.
        // Instantiate the layout so its type can be ascertained.
        if (!me.initialConfig.layout) {
            me.layout = {
                type: 'hbox',
                align: 'stretch'
            };
        }
        me.getLayout();

        // Sanity check the split config.
        // Only allowed to insert a splitter between the two grids if it's a box layout
        if (me.layout.type === 'border') {
            if (me.split) {
                lockedGrid.split = true;
            }
            if (!lockedGrid.region) {
                lockedGrid.region = 'west';
            }
            if (!normalGrid.region) {
                normalGrid.region = 'center';
            }
            me.addCls(Ext.baseCSSPrefix + 'grid-locked-split');
        }
        if (!(me.layout instanceof Ext.layout.container.Box)) {
            me.split = false;
        }

        // The LockingView is a pseudo view which owns the two grids.
        // It listens for store events and relays the calls into each view bracketed by a layout suspension.
        me.view = new Ext.grid.locking.View({
            loadMask: loadMask,
            locked: lockedGrid,
            normal: normalGrid,
            ownerGrid: me
        });

        // after creating the locking view we now have Grid instances for both locked and
        // unlocked sides
        lockedGrid = me.lockedGrid;
        normalGrid = me.normalGrid;

        // make the locked/unlocked sides mirror each other's vertical scroll positions.
        normalGrid.getView().getScrollable().addPartner(lockedGrid.getView().getScrollable(), 'y');

        // Extract the instantiated views from the locking View.
        // The locking View injects lockingGrid and normalGrid into this lockable panel.
        // This is because during constraction, it must be possible for descendant components
        // to navigate up to the owning lockable panel and then down into either side.

        // If there are system scrollbars, we have to monitor the mousewheel and fake a scroll
        // Also we need to postprocess the border width because of inline border setting styles.
        // The locked grid needs a bottom border to match with any scrollbar present in the normal grid .
        // Keep locked section's bottom border width synched
        if (scrollbarSize.height && Ext.supports.touchScroll !== 2) {
            lockedGrid.on({
                afterlayout: me.afterLockedViewLayout,
                scope: me
            });

            // Ensure the overflow flags have been calculated from the various overflow configs
            lockedGrid.getView().getOverflowStyle();
        }

        lockedHeaderCt = lockedGrid.headerCt;
        normalHeaderCt = normalGrid.headerCt;

        if (clipVertLockedScrollbar) {
            // if we are clipping the locked vertical scrollbar, we do not want the
            // headerCt to reserve room for one
            lockedHeaderCt.reserveScrollbar = false;
        }

        // The top grid, and the LockingView both need to have a headerCt which is usable.
        // It is part of their private API that framework code uses when dealing with a grid or grid view
        me.headerCt = me.view.headerCt = new Ext.grid.locking.HeaderContainer(me);

        lockedHeaderCt.lockedCt = true;
        lockedHeaderCt.lockableInjected = true;
        normalHeaderCt.lockableInjected = true;

        lockedHeaderCt.on({
            add: me.delaySyncLockedWidth,
            remove: me.delaySyncLockedWidth,
            columnshow: me.delaySyncLockedWidth,
            columnhide: me.delaySyncLockedWidth,
            sortchange: me.onLockedHeaderSortChange,
            columnresize: me.delaySyncLockedWidth,
            scope: me
        });

        normalHeaderCt.on({
            add: me.delaySyncLockedWidth,
            remove: me.delaySyncLockedWidth,
            columnshow: me.delaySyncLockedWidth,
            columnhide: me.delaySyncLockedWidth,
            sortchange: me.onNormalHeaderSortChange,
            scope: me
        });

        me.modifyHeaderCt();
        me.items = [lockedGrid];
        if (me.split) {
            me.addCls(Ext.baseCSSPrefix + 'grid-locked-split');
            me.items[1] = {
                xtype: 'splitter'
            };
        }
        me.items.push(normalGrid);

        me.relayHeaderCtEvents(lockedHeaderCt);
        me.relayHeaderCtEvents(normalHeaderCt);

        // The top level Lockable container does not get bound to the store, so we need to programatically add the relayer so that
        // The filterchange state event is fired.
        me.storeRelayers = me.relayEvents(store, [
            /**
             * @event filterchange
             * @inheritdoc Ext.data.Store#filterchange
             */
            'filterchange',
            /**
             * @event groupchange
             * @inheritdoc Ext.data.Store#groupchange
             */
            'groupchange'
        ]);

        // Only need to relay from the normalGrid. Since it's created after the lockedGrid,
        // we can be confident to only listen to it.
        me.gridRelayers = me.relayEvents(normalGrid, [
            /**
             * @event viewready
             * @inheritdoc Ext.panel.Table#viewready
             */
            'viewready'
        ]);
    },

    getLockingViewConfig: function(){
        return {
            xclass: 'Ext.grid.locking.View',
            locked: this.lockedGrid,
            normal: this.normalGrid,
            panel: this
        };
    },

    processColumns: function(columns, lockedGrid) {
        // split apart normal and locked
        var me = this,
            i,
            len,
            column,
            cp = new Ext.grid.header.Container(),
            lockedHeaders = [],
            normalHeaders = [],
            lockedHeaderCt = {
                itemId: 'lockedHeaderCt',
                stretchMaxPartner: '^^>>#normalHeaderCt',
                items: lockedHeaders
            },
            normalHeaderCt = {
                itemId: 'normalHeaderCt',
                stretchMaxPartner: '^^>>#lockedHeaderCt',
                items: normalHeaders
            },
            result = {
                lockedWidth: lockedGrid.width || 0,
                locked: lockedHeaderCt,
                normal: normalHeaderCt
            },
            shrinkWrapLocked = !(lockedGrid.width || lockedGrid.flex),
            copy;

        // Only save the initial configuration, since a width will be stamped on
        // after we sync the width.
        if (!me.hasOwnProperty('shrinkWrapLocked')) {
            me.shrinkWrapLocked = shrinkWrapLocked;
        }

        // In case they specified a config object with items...
        if (Ext.isObject(columns)) {
            Ext.applyIf(lockedHeaderCt, columns);
            Ext.applyIf(normalHeaderCt, columns);
            copy = Ext.apply({}, columns);
            delete copy.items;
            Ext.apply(cp, copy);
            columns = columns.items;
        }

        // Treat the column header as though we're just creating an instance, since this
        // doesn't follow the normal column creation pattern
        cp.constructing = true;
        for (i = 0, len = columns.length; i < len; ++i) {
            column = columns[i];

            // Use the HeaderContainer object to correctly configure and create the column.
            // MUST instantiate now because the locked or autoLock config which we read here might be in the prototype.
            // MUST use a Container instance so that defaults from an object columns config get applied.
            if (!column.isComponent) {
                column = cp.applyDefaults(column);
                column.initOwnerCt = cp;
                column = cp.lookupComponent(column);
                delete column.initOwnerCt;
            }

            // mark the column as processed so that the locked attribute does not
            // trigger the locked subgrid to try to become a split lockable grid itself.
            column.processed = true;
            if (column.locked || column.autoLock) {
                // If the locked grid has not been configured with a width, we must
                // Calculate a width from the total width of locked columns
                if (shrinkWrapLocked && !column.hidden) {
                    result.lockedWidth += me.getColumnWidth(column) || cp.defaultWidth;
                }
                lockedHeaders.push(column);
            } else {
                normalHeaders.push(column);
            }
            if (!column.headerId) {
                column.headerId = (column.initialConfig || column).id || ('h' + (++me.headerCounter));
            }
        }
        me.fireEvent('processcolumns', me, lockedHeaders, normalHeaders);
        cp.destroy();

        // If grid has not been configured with a width it must shrinkwrap columns with no horiontal scroll
        // TODO: Use shrinkWrapDock on the locked grid when it works.
        if (shrinkWrapLocked) {
            lockedGrid.width = result.lockedWidth;
        }
        return result;
    },

    // Used when calculating total locked column width in processColumns
    // Use shrinkwrapping of child columns if no top level width.
    getColumnWidth: function(column) {
        var result = column.width || 0,
            subcols, len, i;

        // <debug>
        if (column.flex) {
            Ext.Error.raise("Locked columns in an unsized locked side do NOT support a flex width. You must set a width on the " + column.text + "column.");
        }
        // </debug>
        if (!result && column.isGroupHeader) {
            subcols = column.items.items;
            len = subcols.length;
            for (i = 0; i < len; i++) {
                result += this.getColumnWidth(subcols[i]);
            }
        }
        return result;
    },

    // Due to automatic component border setting using inline style, to create the scrollbar-replacing
    // bottom border, we have to postprocess the locked view *after* render.
    // A tall bottom border takes the place of a horiz scrollbar if the opposite side has a  horiz scrollbar.
    // When we can use overflow-x: scroll to create a matching scrollbar, we do this instead.
    afterLockedViewLayout: function() {
        var me = this,
            lockedGrid = me.lockedGrid,
            normalGrid = me.normalGrid,
            lockedView = lockedGrid.getView(),
            normalView = normalGrid.getView(),
            spacerHeight = Ext.getScrollbarSize().height,
            lockedViewHorizScrollBar = (lockedView.scrollFlags.x && lockedGrid.headerCt.tooNarrow ? spacerHeight : 0),
            normalViewHorizScrollBar = (normalView.scrollFlags.x && normalGrid.headerCt.tooNarrow ? spacerHeight : 0),
            normalScroller = normalView.getScrollable(),
            lockedScroller = lockedView.getScrollable();

        if (lockedViewHorizScrollBar !== normalViewHorizScrollBar) {
            if (lockedViewHorizScrollBar) {
                normalScroller.setX('scroll');
                lockedScroller.setX(true);
            } else {
                lockedScroller.setX('scroll');
                normalScroller.setX(true);
            }
        } else {
            lockedScroller.setX(normalViewHorizScrollBar ? 'scroll' : true);
            normalScroller.setX(true);
        }

    },

    ensureLockedVisible: function() {
        this.lockedGrid.ensureVisible.apply(this.lockedGrid, arguments);
        this.normalGrid.ensureVisible.apply(this.normalGrid, arguments);
    },

    onLockedViewMouseWheel: function(e) {
        var me = this,
            deltaY = -me.scrollDelta * e.getWheelDeltas().y,
            lockedView = me.lockedGrid.getView(),
            lockedViewElDom = lockedView.el.dom,
            scrollTop, verticalCanScrollDown, verticalCanScrollUp;

        if (!me.ignoreMousewheel) {
            if (lockedViewElDom) {
                scrollTop = lockedView.getScrollY();
                verticalCanScrollDown = scrollTop !== lockedViewElDom.scrollHeight - lockedViewElDom.clientHeight;
                verticalCanScrollUp   = scrollTop !== 0;
            }

            if ((deltaY < 0 && verticalCanScrollUp) || (deltaY > 0 && verticalCanScrollDown)) {
                e.stopEvent();

                // Inhibit processing of any scroll events we *may* cause here.
                // Some OSs do not fire a scroll event when we set the scrollTop of an overflow:hidden element,
                // so we invoke the scroll handler programatically below.
                scrollTop += deltaY;
                lockedView.setScrollY(scrollTop);
                me.normalGrid.getView().setScrollY(scrollTop);

                // Invoke the scroll event handler programatically to sync everything.
                me.onNormalViewScroll();
            }
        }
    },

    onLockedViewScroll: function() {
        var me = this,
            lockedView = me.lockedGrid.getView(),
            normalView = me.normalGrid.getView(),
            lockedScrollTop = lockedView.getScrollY(),
            normalScrollTop = normalView.getScrollY(),
            normalTable,
            lockedTable;

        if (normalScrollTop !== lockedScrollTop) {
            normalView.setScrollY(lockedScrollTop);

            // For buffered views, the absolute position is important as well as scrollTop
            if (normalView.bufferedRenderer) {
                lockedTable = lockedView.body.dom;
                normalTable = normalView.body.dom;
                normalTable.style.position = 'absolute';
                normalTable.style.top = lockedTable.style.top;
            }
        }
    },

    onNormalViewScroll: function() {
        var me = this,
            lockedView = me.lockedGrid.getView(),
            normalView = me.normalGrid.getView(),
            lockedScrollTop = lockedView.getScrollY(),
            normalScrollTop = normalView.getScrollY(),
            lockedRowContainer;

        if (normalScrollTop !== lockedScrollTop) {
            lockedView.setScrollY(normalScrollTop);

            // For buffered views, the absolute position is important as well as scrollTop
            if (normalView.bufferedRenderer) {
                lockedRowContainer = lockedView.body;

                // If we have attached the Fly to a DOM (will not have happened if all locked columns are hidden)
                if (lockedRowContainer.dom) {
                    lockedRowContainer.dom.style.position = 'absolute';
                    lockedRowContainer.translate(null, normalView.bufferedRenderer.bodyTop);
                }
            }
        }
    },
    /**
     * Synchronizes the row heights between the locked and non locked portion of the grid for each
     * row. If one row is smaller than the other, the height will be increased to match the larger one.
     */
    syncRowHeights: function() {
        // This is now called on animationFrame. It may have been destroyed in the interval.
        if (!this.isDestroyed) {
            var me = this,
                normalView = me.normalGrid.getView(),
                lockedView = me.lockedGrid.getView(),
                // These will reset any forced height styles from the last sync
                normalSync = normalView.syncRowHeightBegin(),
                lockedSync = lockedView.syncRowHeightBegin(),
                scrollTop;

            // Now bulk measure everything
            normalView.syncRowHeightMeasure(normalSync);
            lockedView.syncRowHeightMeasure(lockedSync);

            // Now write out all the explicit heights we need to sync up
            normalView.syncRowHeightFinish(normalSync, lockedSync);
            lockedView.syncRowHeightFinish(lockedSync, normalSync);

            // Synchronize the scrollTop positions of the two views
            scrollTop = normalView.getScrollY();
            lockedView.setScrollY(scrollTop);
        }
    },

    // inject Lock and Unlock text
    // Hide/show Lock/Unlock options
    modifyHeaderCt: function() {
        var me = this;
        me.lockedGrid.headerCt.getMenuItems = me.getMenuItems(me.lockedGrid.headerCt.getMenuItems, true);
        me.normalGrid.headerCt.getMenuItems = me.getMenuItems(me.normalGrid.headerCt.getMenuItems, false);
        me.lockedGrid.headerCt.showMenuBy = Ext.Function.createInterceptor(me.lockedGrid.headerCt.showMenuBy, me.showMenuBy);
        me.normalGrid.headerCt.showMenuBy = Ext.Function.createInterceptor(me.normalGrid.headerCt.showMenuBy, me.showMenuBy);
    },

    onUnlockMenuClick: function() {
        this.unlock();
    },

    onLockMenuClick: function() {
        this.lock();
    },

    showMenuBy: function(clickEvent, t, header) {
        var menu = this.getMenu(),
            unlockItem  = menu.down('#unlockItem'),
            lockItem = menu.down('#lockItem'),
            sep = unlockItem.prev();

        if (header.lockable === false) {
            sep.hide();
            unlockItem.hide();
            lockItem.hide();
        } else {
            sep.show();
            unlockItem.show();
            lockItem.show();
            if (!unlockItem.initialConfig.disabled) {
                unlockItem.setDisabled(header.lockable === false);
            }
            if (!lockItem.initialConfig.disabled) {
                lockItem.setDisabled(!header.isLockable());
            }
        }
    },

    getMenuItems: function(getMenuItems, locked) {
        var me            = this,
            unlockText    = me.unlockText,
            lockText      = me.lockText,
            unlockCls     = Ext.baseCSSPrefix + 'hmenu-unlock',
            lockCls       = Ext.baseCSSPrefix + 'hmenu-lock',
            unlockHandler = me.onUnlockMenuClick.bind(me),
            lockHandler   = me.onLockMenuClick.bind(me);

        // runs in the scope of headerCt
        return function() {

            // We cannot use the method from HeaderContainer's prototype here
            // because other plugins or features may already have injected an implementation
            var o = getMenuItems.call(this);
            o.push('-', {
                itemId: 'unlockItem',
                iconCls: unlockCls,
                text: unlockText,
                handler: unlockHandler,
                disabled: !locked
            });
            o.push({
                itemId: 'lockItem',
                iconCls: lockCls,
                text: lockText,
                handler: lockHandler,
                disabled: locked
            });
            return o;
        };
    },

    //<debug>
    syncTaskDelay: 1,
    //</debug>

    delaySyncLockedWidth: function() {
        var me = this,
            task = me.syncLockedWidthTask;

        if (!task) {
            task = me.syncLockedWidthTask = new Ext.util.DelayedTask(me.syncLockedWidth, me);
        }

        // Only useful for unit testing so we don't have to mess around with timers
        //<debug>
        if (me.syncTaskDelay === 0) {
            me.syncLockedWidth();
        } else {
            //</debug>
            task.delay(1);
            //<debug>
        }
        //</debug>
    },

    /**
     * @private
     * Updates the overall view after columns have been resized, or moved from
     * the locked to unlocked side or vice-versa.
     *
     * If all columns are removed from either side, that side must be hidden, and the
     * sole remaining column owning grid then becomes *the* grid. It must flex to occupy the
     * whole of the locking view. And it must also allow scrolling.
     *
     * If columns are shared between the two sides, the *locked* grid shrinkwraps the
     * width of the visible locked columns while the normal grid flexes in what space remains.
     *
     * @return {Boolean} `true` if there are visible locked columns which need refreshing.
     *
     */
    syncLockedWidth: function() {
        var me = this,
            rendered = me.rendered,
            locked = me.lockedGrid,
            lockedView = locked.view,
            normal = me.normalGrid,
            lockedColCount = locked.getVisibleColumnManager().getColumns().length,
            normalColCount = normal.getVisibleColumnManager().getColumns().length,
            task = me.syncLockedWidthTask;

        // If we are called directly, veto any existing task.
        if (task) {
            task.cancel();
        }

        Ext.suspendLayouts();

        // If there are still visible normal columns, then the normal grid will flex
        // while we effectively shrinkwrap the width of the locked columns
        if (normalColCount) {
            normal.show();
            if (lockedColCount) {

                // The locked grid shrinkwraps the total column width while the normal grid flexes in what remains
                // UNLESS it has been set to forceFit
                if (rendered && me.shrinkWrapLocked && !locked.headerCt.forceFit) {
                    delete locked.flex;
                    // Don't pass the purge flag here
                    locked.setWidth(locked.headerCt.getTableWidth() + locked.el.getBorderWidth('lr'));
                }
                locked.addCls(me.lockedGridCls);
                locked.show();
                if (me.split) {
                    me.child('splitter').show();
                }
            } else {
                // No visible locked columns: hide the locked grid
                // We also need to trigger a clearViewEl to clear out any
                // old dom nodes
                if (rendered) {
                    locked.getView().clearViewEl(true);
                }
                locked.hide();
                if (me.split) {
                    me.child('splitter').hide();
                }
            }

            // Only if there is going to be an upcoming layout to correct the horizontal scrollbar setting.
            if (Ext.supports.touchScroll !== 2 && Ext.Component.pendingLayouts) {
                // We may have previously set horizontal placeholder scrollbar on the locked
                // view to match the unlocked side.  Undo this before continuing, so that
                // the horizontal scrollbar does not affect the layout of the columns by
                // possibly triggering a vertical scrollbar as well
                lockedView.getScrollable().setX(true);
            }

            // Ignore mousewheel events if the view is configured to scroll vertically
            if (rendered) {
                me.ignoreMousewheel = lockedView.scrollFlags.y;
            }
        }

        // There are no normal grid columns. The "locked" grid has to be *the*
        // grid, and cannot have a shrinkwrapped width, but must flex the entire width.
        else {
            normal.hide();

            // When the normal grid is hidden, we no longer need the bottom border "scrollbar replacement"
            if (rendered) {
                lockedView.getEl().setStyle('border-bottom-width', '0');
            }

            // The locked now becomes *the* grid and has to flex to occupy the full view width
            locked.flex = 1;
            delete locked.width;
            locked.removeCls(me.lockedGridCls);
            locked.show();

            me.ignoreMousewheel = true;
        }
        Ext.resumeLayouts(true);
        return [lockedColCount, normalColCount];
    },

    onLockedHeaderSortChange: Ext.emptyFn,

    onNormalHeaderSortChange: Ext.emptyFn,

    // going from unlocked section to locked
    /**
     * Locks the activeHeader as determined by which menu is open OR a header
     * as specified.
     * @param {Ext.grid.column.Column} [header] Header to unlock from the locked section.
     * Defaults to the header which has the menu open currently.
     * @param {Number} [toIdx] The index to move the unlocked header to.
     * Defaults to appending as the last item.
     * @private
     */
    lock: function(activeHd, toIdx, toCt) {
        var me         = this,
            normalGrid = me.normalGrid,
            lockedGrid = me.lockedGrid,
            normalView = normalGrid.view,
            lockedView = lockedGrid.view,
            normalHCt  = normalGrid.headerCt,
            refreshFlags,
            ownerCt,
            hadFocus;

        activeHd = activeHd || normalHCt.getMenu().activeHeader;
        hadFocus = activeHd.hasFocus;
        toCt = toCt || lockedGrid.headerCt;
        ownerCt = activeHd.ownerCt;

        // isLockable will test for making the locked side too wide
        if (!activeHd.isLockable()) {
            return;
        }

        // if column was previously flexed, get/set current width
        // and remove the flex
        if (activeHd.flex) {
            activeHd.width = activeHd.getWidth();
            activeHd.flex = null;
        }

        Ext.suspendLayouts();

        // If hidden, we need to show it now or the locked headerCt's .gridVisibleColumns may be out of sync as
        // headers are only added to a visible manager if they are not explicity hidden or hierarchically hidden.
        if (lockedGrid.hidden) {
            lockedGrid.show();
        }

        // We decide which views to refresh. Do not let the grids do it in response to column changes
        normalView.blockRefresh = lockedView.blockRefresh = true;
        ownerCt.remove(activeHd, false);
        activeHd.locked = true;

        // Flag to the locked column add listener to do nothing
        if (Ext.isDefined(toIdx)) {
            toCt.insert(toIdx, activeHd);
        } else {
            toCt.add(activeHd);
        }
        normalView.blockRefresh = lockedView.blockRefresh = false;

        refreshFlags = me.syncLockedWidth();
        if (refreshFlags[0]) {
            lockedGrid.getView().refreshView();
        }
        if (refreshFlags[1]) {
            normalGrid.getView().refreshView();
        }
        Ext.resumeLayouts(true);

        if (hadFocus) {
            activeHd.focus();
        }
        me.fireEvent('lockcolumn', me, activeHd);
    },

    // going from locked section to unlocked
    /**
     * Unlocks the activeHeader as determined by which menu is open OR a header
     * as specified.
     * @param {Ext.grid.column.Column} [header] Header to unlock from the locked section.
     * Defaults to the header which has the menu open currently.
     * @param {Number} [toIdx=0] The index to move the unlocked header to.
     * @private
     */
    unlock: function(activeHd, toIdx, toCt) {
        var me         = this,
            normalGrid = me.normalGrid,
            lockedGrid = me.lockedGrid,
            normalView = normalGrid.view,
            lockedView = lockedGrid.view,
            lockedHCt  = lockedGrid.headerCt,
            refreshFlags,
            hadFocus;

        // Unlocking; user expectation is that the unlocked column is inserted at the beginning.
        if (!Ext.isDefined(toIdx)) {
            toIdx = 0;
        }
        activeHd = activeHd || lockedHCt.getMenu().activeHeader;
        hadFocus = activeHd.hasFocus;
        toCt = toCt || normalGrid.headerCt;

        Ext.suspendLayouts();

        // We decide which views to refresh. Do not let the grids do it in response to column changes
        normalView.blockRefresh = lockedView.blockRefresh = true;
        activeHd.ownerCt.remove(activeHd, false);
        activeHd.locked = false;
        toCt.insert(toIdx, activeHd);
        normalView.blockRefresh = lockedView.blockRefresh = false;

        // syncLockedWidth returns visible column counts for both grids.
        // only refresh what needs refreshing
        refreshFlags = me.syncLockedWidth();

        if (refreshFlags[0]) {
            lockedGrid.getView().refreshView();
        }
        if (refreshFlags[1]) {
            normalGrid.getView().refreshView();
        }
        Ext.resumeLayouts(true);

        if (hadFocus) {
            activeHd.focus();
        }
        me.fireEvent('unlockcolumn', me, activeHd);
    },

    // we want to totally override the reconfigure behaviour here, since we're creating 2 sub-grids
    reconfigureLockable: function(store, columns) {
        var me = this,
            oldStore = me.store,
            lockedGrid = me.lockedGrid,
            normalGrid = me.normalGrid,
            view;

        // Note that we need to process the store first in case one or more passed columns (if there are any)
        // have active gridfilters with values which would filter the currently-bound store.
        if (store && store !== oldStore) {
            store = Ext.data.StoreManager.lookup(store);
            me.store = store;
            lockedGrid.view.blockRefresh = normalGrid.view.blockRefresh = true;

            lockedGrid.bindStore(store);

            // Subsidiary views have their bindStore changed because they must not
            // bind listeners themselves. This view listens and relays calls to each view.
            // BUT the dataSource and store properties must be set
            view = lockedGrid.view;
            view.store = store;

            // If the dataSource being used by the View is *not* a FeatureStore
            // (a modified view of the base Store injected by a Feature)
            // Then we promote the store to be the dataSource.
            // If it was a FeatureStore, then it must not be changed. A FeatureStore is mutated
            // by the Feature to respond to changes in the underlying Store.
            if (!view.dataSource.isFeatureStore) {
                view.dataSource = store;
            }
            if (view.bufferedRenderer) {
                view.bufferedRenderer.bindStore(store);
            }

            normalGrid.bindStore(store);
            view = normalGrid.view;
            view.store = store;

            // If the dataSource being used by the View is *not* a FeatureStore
            // (a modified view of the base Store injected by a Feature)
            // Then we promote the store to be the dataSource.
            // If it was a FeatureStore, then it must not be changed. A FeatureStore is mutated
            // by the Feature to respond to changes in the underlying Store.
            if (!view.dataSource.isFeatureStore) {
                view.dataSource = store;
            }
            if (view.bufferedRenderer) {
                view.bufferedRenderer.bindStore(store);
            }
            me.view.store = store;
            me.view.bindStore(normalGrid.view.dataSource, false, 'dataSource');
            lockedGrid.view.blockRefresh = normalGrid.view.blockRefresh = false;
        }

        if (columns) {
            // Both grids must not react to the headers being changed (See panel/Table#onHeadersChanged)
            lockedGrid.reconfiguring = normalGrid.reconfiguring = true;
            lockedGrid.headerCt.removeAll();
            normalGrid.headerCt.removeAll();

            columns = me.processColumns(columns, lockedGrid);

            // Flag to the locked column add listener to do nothing
            lockedGrid.headerCt.add(columns.locked.items);
            normalGrid.headerCt.add(columns.normal.items);

            lockedGrid.reconfiguring = normalGrid.reconfiguring = false;

            // Ensure locked grid is set up correctly with correct width and bottom border,
            // and that both grids' visibility and scrollability status is correct
            me.syncLockedWidth();
        }

        me.refreshCounter = lockedGrid.view.refreshCounter;
    },

    afterReconfigureLockable: function() {
        var lockedView = this.lockedGrid.getView();

        // If the counter hasn't changed since where we saved it previously, we haven't refreshed,
        // so kick it off now.
        if (this.refreshCounter === lockedView.refreshCounter) {
            this.view.refresh();
        }
    },

    constructLockableFeatures: function() {
        var features = this.features,
            feature,
            featureClone,
            lockedFeatures,
            normalFeatures,
            i = 0, len;

        if (features) {
            if (!Ext.isArray(features)) {
                features = [ features ];
            }
            lockedFeatures = [];
            normalFeatures = [];
            len = features.length;
            for (; i < len; i++) {
                feature = features[i];
                if (!feature.isFeature) {
                    feature = Ext.create('feature.' + feature.ftype, feature);
                }
                switch (feature.lockableScope) {
                    case 'locked':
                        lockedFeatures.push(feature);
                        break;
                    case 'normal':
                        normalFeatures.push(feature);
                        break;
                    default:
                        feature.lockableScope = 'both';
                        lockedFeatures.push(feature);
                        normalFeatures.push(featureClone = feature.clone());

                        // When cloned to either side, each gets a "lockingPartner" reference to the other
                        featureClone.lockingPartner = feature;
                        feature.lockingPartner = featureClone;
                }
            }
        }
        return {
            normalFeatures: normalFeatures,
            lockedFeatures: lockedFeatures
        };
    },

    constructLockablePlugins: function() {
        var plugins = this.plugins,
            plugin,
            normalPlugin,
            lockedPlugin,
            topPlugins,
            lockedPlugins,
            normalPlugins,
            i = 0, len,
            lockableScope,
            pluginCls;

        if (plugins) {
            if (!Ext.isArray(plugins)) {
                plugins = [ plugins ];
            }
            topPlugins = [];
            lockedPlugins = [];
            normalPlugins = [];
            len = plugins.length;
            for (; i < len; i++) {

                plugin = plugins[i];

                // Plugin will most likely already have been instantiated by the Component constructor
                if (plugin.init) {
                    lockableScope = plugin.lockableScope;
                }
                // If not, it's because of late addition through a subclass's initComponent implementation, so we
                // must ascertain the lockableScope directly from the class.
                else {
                    pluginCls = plugin.ptype ? Ext.ClassManager.getByAlias(('plugin.' + plugin.ptype)) : Ext.ClassManager.get(plugin.xclass);
                    lockableScope = pluginCls.prototype.lockableScope;
                }

                switch (lockableScope) {
                    case 'both':
                        lockedPlugins.push(lockedPlugin = plugin.clonePlugin());
                        normalPlugins.push(normalPlugin = plugin.clonePlugin());

                        // When cloned to both sides, each gets a "lockingPartner" reference to the other
                        lockedPlugin.lockingPartner = normalPlugin;
                        normalPlugin.lockingPartner = lockedPlugin;

                        // If the plugin has to be propagated down to both, a new plugin config object must be given to that side
                        // and this plugin must be destroyed.
                        Ext.destroy(plugin);
                        break;
                    case 'locked':
                        lockedPlugins.push(plugin);
                        break;
                    case 'normal':
                        normalPlugins.push(plugin);
                        break;
                    default:
                        topPlugins.push(plugin);
                }
            }
        }
        return {
            topPlugins:    topPlugins,
            normalPlugins: normalPlugins,
            lockedPlugins: lockedPlugins
        };
    },

    destroyLockable: function(){
        // The locking view isn't a "real" view, so we need to destroy it manually
        var me = this,
            task = me.syncLockedWidthTask;

        if (task) {
            task.cancel();
            me.syncLockedWidthTask = null;
        }
        Ext.destroy(me.view, me.headerCt);
    }
}, function() {
    this.borrow(Ext.Component, ['constructPlugin']);
});
