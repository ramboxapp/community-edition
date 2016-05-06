/**
 * @private
 * Implements buffered rendering of a grid, allowing users to scroll
 * through thousands of records without the performance penalties of
 * rendering all the records into the DOM at once.
 *
 * The number of rows rendered outside the visible area can be controlled by configuring the plugin.
 *
 * Users should not instantiate this class. It is instantiated automatically
 * and applied to all grids.
 *
 * ## Implementation notes
 *
 * This class monitors scrolling of the {@link Ext.view.Table
 * TableView} within a {@link Ext.grid.Panel GridPanel} to render a small section of
 * the dataset.
 *
 */
Ext.define('Ext.grid.plugin.BufferedRenderer', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.bufferedrenderer',

    /**
     * @property {Boolean} isBufferedRenderer
     * `true` in this class to identify an object as an instantiated BufferedRenderer, or subclass thereof.
     */
    isBufferedRenderer: true,

    lockableScope: 'both',

    /**
     * @cfg {Number}
     * The zone which causes new rows to be appended to the view. As soon as the edge
     * of the rendered grid is this number of rows from the edge of the viewport, the view is moved.
     */
    numFromEdge: 2,

    /**
     * @cfg {Number}
     * The number of extra rows to render on the trailing side of scrolling
     * **outside the {@link #numFromEdge}** buffer as scrolling proceeds.
     */
    trailingBufferZone: 10,

    /**
     * @cfg {Number}
     * The number of extra rows to render on the leading side of scrolling
     * **outside the {@link #numFromEdge}** buffer as scrolling proceeds.
     */
    leadingBufferZone: 20,

    /**
     * @cfg {Boolean} [synchronousRender=true]
     * By default, on detection of a scroll event which brings the end of the rendered table within
     * `{@link #numFromEdge}` rows of the grid viewport, if the required rows are available in the Store,
     * the BufferedRenderer will render rows from the Store *immediately* before returning from the event handler.
     * This setting helps avoid the impression of whitespace appearing during scrolling.
     *
     * Set this to `false` to defer the render until the scroll event handler exits. This allows for faster
     * scrolling, but also allows whitespace to be more easily scrolled into view.
     *
     */
    synchronousRender: true,

    /**
     * @cfg {Number}
     * This is the time in milliseconds to buffer load requests when the store is a {@link Ext.data.BufferedStore buffered store}
     * and a page required for rendering is not present in the store's cache and needs loading.
     */
    scrollToLoadBuffer: 200,

    // private. Initial value of 100.
    viewSize: 100,
    // private. Start at default value
    rowHeight: 21,
    /**
     * @property {Number} position
     * Current pixel scroll position of the associated {@link Ext.view.Table View}.
     */
    position: 0,
    lastScrollDirection: 1,
    bodyTop: 0,
    scrollHeight: 0,
    loadId: 0,

    // Initialize this as a plugin
    init: function(grid) {
        var me = this,
            view = grid.view,
            viewListeners = {
                scroll: me.onViewScroll,
                resize: me.onViewResize,
                refresh: me.onViewRefresh,
                columnschanged: me.checkVariableRowHeight,
                boxready: me.onViewBoxReady,
                scope: me,
                destroyable: true
            },
            initialConfig = view.initialConfig;

        // If we are going to be handling a NodeStore then it's driven by node addition and removal, *not* refreshing.
        // The view overrides required above change the view's onAdd and onRemove behaviour to call onDataRefresh when necessary.
        if (grid.isTree || (grid.ownerLockable && grid.ownerLockable.isTree)) {
            view.blockRefresh = false;

            // Set a load mask if undefined in the view config.
            if (initialConfig && initialConfig.loadMask === undefined) {
                view.loadMask = true;
            }
        }

        if (view.positionBody) {
            viewListeners.refresh = me.onViewRefresh;
        }

        me.grid = grid;
        me.view = view;
        me.isRTL = view.getInherited().rtl;
        view.bufferedRenderer = me;
        view.preserveScrollOnRefresh = true;
        view.animate = false;

        me.bindStore(view.dataSource);

        // Use a configured rowHeight in the view
        if (view.hasOwnProperty('rowHeight')) {
            me.rowHeight = view.rowHeight;
        }

        me.position = 0;

        me.gridListeners = grid.on({
            reconfigure: 'onReconfigure',
            scope: me,
            destroyable: true
        });
        me.viewListeners = view.on(viewListeners);
    },

    // Keep the variableRowHeight and any Lockable's syncRowHeight property correct WRT variable row heights being possible.
    checkVariableRowHeight: function() {
        var me = this,
            grid = me.grid;

        me.variableRowHeight = me.view.hasVariableRowHeight();
        if (grid.ownerLockable) {
            grid.ownerLockable.syncRowHeight = me.variableRowHeight;
        }
    },

    bindStore: function (store) {
        var me = this,
            view = me.view,
            dataSource = view.dataSource,
            hasFeatureStore = dataSource && dataSource.isFeatureStore;

        // Don't bind the new store if it's not the same type of store as what the plugin was initialized with.
        // For example, the plugin is initialized with a GroupStore if it has a grouping feature. Then,
        // grid.reconfigure() is called, passing in a new data store here. This would be a problem, so if the
        // store to bind isn't the same type as the currently bound store, then don't allow it.
        //
        // Note that the feature should have a reconfigure listener that will bind and process the new store so
        // skipping this doesn't mean that the new store isn't processed, it just happens elsewhere.
        if (hasFeatureStore === store.isFeatureStore) {
            if (me.store) {
                me.unbindStore();
            }
            me.storeListeners = store.on({
                scope: me,
                groupchange: me.onStoreGroupChange,
                clear: me.onStoreClear,
                beforeload: me.onBeforeStoreLoad,
                load: me.onStoreLoad,
                destroyable: true
            });
            me.store = store;
        }

        // If the view has acquired a size, calculate a new view size and scroll range when the store changes.
        if (me.view.componentLayout.layoutCount) {
            // Delete whatever our last viewSize might have been, and fall back to the prototype's default.
            delete me.viewSize;
            if (store.isBufferedStore) {
                store.setViewSize(me.viewSize);
            }
            me.onViewResize(me.view, 0, me.view.getHeight());
        }
    },

    onReconfigure: function(grid, store){
        if (store && store !== this.store) {
            this.bindStore(store);
        }
    },

    unbindStore: function() {
        this.storeListeners.destroy();
        this.store = null;
    },

    // Disallow mouse interactions, and disable handling of scroll events until the load is finished
    onBeforeStoreLoad: function() {
        var view = this.view;
        if (view && view.rendered) {
            view.el.dom.style.pointerEvents = 'none';
        }
        this.disable();
    },

    // Re-enable mouse interactions and scroll event handling on load.
    onStoreLoad: function() {
        var view = this.view;
        if (view && view.rendered) {
            view.el.dom.style.pointerEvents = '';
        }
        this.enable();
    },

    onStoreClear: function() {
        var me = this,
            view = me.view;

        // Do not do anything if view is not rendered, or if the reason for cache clearing is store destruction
        if (view.rendered && !me.store.isDestroyed) {

            if (me.scrollTop !== 0) {
                // Zero position tracker so that next scroll event will not trigger any action
                me.bodyTop = me.scrollTop = me.position = me.scrollHeight = 0;
                me.view.setScrollY(0);
            }

            me.lastScrollDirection = me.scrollOffset = null;

            // MUST delete, not null out because the calculation checks hasOwnProperty.
            // Unless we have a configured rowHeight
            if (!view.hasOwnProperty('rowHeight')) {
                delete me.rowHeight;
            }
        }
    },

    // If the store is not grouped, we can switch to fixed row height mode
    onStoreGroupChange: function(store) {
        this.refreshSize();
    },

    onViewBoxReady: function(view) {
        this.refreshScroller(view, this.scrollHeight);
    },

    onViewRefresh: function(view, records) {
        var me = this,
            rows = view.all,
            height;

        // Recheck the variability of row height in the view.
        me.checkVariableRowHeight();

        // The first refresh on the leading edge of the initial layout will mean that the
        // View has not had the sizes of flexed columns calculated and flushed yet.
        // So measurement of DOM height for calculation of an approximation of the variableRowHeight would be premature.
        // And measurement of the body width would be premature because of uncalculated flexes.
        if (!view.componentLayoutCounter && (view.headerCt.down('{flex}') || me.variableRowHeight)) {
            view.on({
                boxready: Ext.Function.pass(me.onViewRefresh, [view, records], me),
                single: true
            });
            return;
        }

        // View passes in its rowHeight property. If it nos not got one, delete any previously calculated
        // rowHeight property to trigger a recalculation when scrollRange is calculated.
        if (!view.hasOwnProperty('rowHeight') && rows.getCount()) {
            // We need to calculate the table size based upon the new viewport size and current row height
            // It tests hasOwnProperty so must delete the property to make it recalculate.
            delete me.rowHeight;
        }

        me.refreshSize();

        // If we are instigating the refresh, we must only update the stretcher.
        if (me.refreshing) {
            return;
        }

        if (me.scrollTop !== view.getScrollY()) {
            // The view may have refreshed and scrolled to the top, for example
            // on a sort. If so, it's as if we scrolled to the top, so we'll simulate
            // it here.
            me.onViewScroll();
        } else {
            if (!me.hasOwnProperty('bodyTop')) {
                me.bodyTop = rows.startIndex * me.rowHeight;
                view.setScrollY(me.bodyTop);
            }
            me.setBodyTop(me.bodyTop);

            // With new data, the height may have changed, so recalculate the rowHeight and viewSize.
            // This will either add or remove some rows.
            height = view.getHeight();
            if (rows.getCount() && height > 0) {
                me.onViewResize(view, null, height);

                // If we repaired the view by adding or removing records, then keep the records array
                // consistent with what is there for subsequent listeners.
                // For example the WidgetColumn listener which post-processes all rows: https://sencha.jira.com/browse/EXTJS-13942
                if (records && (rows.getCount() !== records.length)) {
                    records.length = 0;
                    records.push.apply(records, me.store.getRange(rows.startIndex, rows.endIndex));
                }
            }
        }
    },

    refreshSize: function() {
        var me = this,
            view = me.view,
            nodeCache = view.all,
            // Calculates scroll range.
            // Also calculates rowHeight if we do not have an own rowHeight property.
            newScrollHeight = me.getScrollHeight();

        // We are displaying the last row, ensure the scroll range finishes exactly at the bottom of the view body.
        if (nodeCache.count && nodeCache.endIndex === (me.store.getCount()) - 1) {
            newScrollHeight = me.scrollHeight = me.bodyTop + view.body.dom.offsetHeight;
        }
        // Stretch the scroll range according to calculated data height.
        else if (newScrollHeight !== me.scrollHeight) {
            me.scrollHeight = newScrollHeight;
        }

        me.stretchView(view, newScrollHeight);
    },

    onViewResize: function(view, width, height, oldWidth, oldHeight) {
        var me = this,
            newViewSize;

        // Only process first layout (the boxready event) or height resizes.
        if (!oldHeight || height !== oldHeight) {

            // Recalculate the view size in rows now that the grid view has changed height
            newViewSize = Math.ceil(height / me.rowHeight) + me.trailingBufferZone + me.leadingBufferZone;
            me.viewSize = me.setViewSize(newViewSize);
            me.viewClientHeight = view.el.dom.clientHeight;
        }

        // TouchScroller needs to know about its viewport size.
        if (view.touchScroll === 2) {
            view.getScrollable().setElementSize(null);
        }
    },

    onWrappedColumnWidthChange: function(oldWidth, newWidth) {
        var me = this,
            view = me.view;

        // If we are part way down the dataset, then 
        if (me.store.getCount() && me.bodyTop) {

            // Ensure the scroll range stretcher is updated to reflect new data height
            me.refreshSize();

            // Calculate new viewSize - number of rows to render.
            me.setViewSize (Math.ceil(view.getHeight() / me.rowHeight) + me.trailingBufferZone + me.leadingBufferZone);

            // ViewSize now encompasses all data; move to the top
            if (me.viewSize >= me.store.getCount()) {
                me.setBodyTop(0);
            }

            // Column got wider causing scroll range to shrink, leaving the view stranded past the end of the scroll range, position it back
            else if (newWidth > oldWidth && me.bodyTop + view.body.dom.offsetHeight - 1 > me.scrollHeight) {
                me.setBodyTop(Math.max(0, me.scrollHeight - view.body.dom.offsetHeight));
            }

            // The bodyTop calculated by renderRange left the body outside the viewport; center it on the viewport.
            else if (me.bodyTop > me.scrollTop || me.bodyTop + view.body.dom.offsetHeight < me.scrollTop + view.getHeight(true)) {
                me.setBodyTop(me.scrollTop - me.trailingBufferZone * me.rowHeight);
            }
        }
    },

    stretchView: function(view, scrollRange) {
        var me = this,
            recordCount = me.store.getCount(),
            el,
            stretcherSpec;

        // Ensure that both the scroll range AND the positioned view body are in the viewable area.
        if (me.scrollTop > scrollRange) {
            me.position = me.scrollTop = scrollRange - view.body.dom.offsetHeight;
            view.setScrollY(me.scrollTop);
        }
        if (me.bodyTop > scrollRange) {
            view.body.translate(null, me.bodyTop = me.position);
        }

        // Touch scrolling: tell the scroller what the scroll size is.
        // This can be called before the view has had its Scroller attached.
        // If that is the case, update the scroller on boxready
        if (view.touchScroll) {
            if (view.getScrollable()) {
                me.refreshScroller(view, scrollRange);
            } else if (!me.pendingScrollerRefresh) {
                view.on({
                    boxready: function() {
                        me.refreshScroller(view, scrollRange);
                        me.pendingScrollerRefresh = false;
                    },
                    single: true
                });
                me.pendingScrollerRefresh = true;
            }
        }

        // If this system shows scrollbars, create a stretcher element
        if (!Ext.supports.touchScroll || Ext.supports.touchScroll === 1) {
            if (!me.stretcher) {
                el = view.getTargetEl();

                // If the view has already been refreshed by the time we get here (eg, the grid, has undergone a reconfigure operation - which performs a refresh),
                // keep it informed of fixed nodes which it must leave alone on refresh.
                if (view.refreshCounter) {
                    view.fixedNodes++;
                }
                stretcherSpec = {
                    role: 'presentation',
                    style: {
                        width: '1px',
                        height: '1px',
                        'marginTop': (scrollRange - 1) + 'px',
                        position: 'absolute'
                    }
                };
                stretcherSpec.style[me.isRTL ? 'right' : 'left'] = 0;
                me.stretcher = el.createChild(stretcherSpec, el.dom.firstChild);

            }

            // If the view size has been set on this instance, and the rendered view size does not exceed it, hide the stretcher
            if (me.hasOwnProperty('viewSize') && recordCount <= me.viewSize) {
                me.stretcher.dom.style.display = 'none';
            } else {
                me.stretcher.dom.style.marginTop = (scrollRange - 1) + 'px';
                me.stretcher.dom.style.display = '';
            }
        }
    },

    refreshScroller: function(view, scrollRange) {
        var scroller = view.getScrollable();

        if (scroller) {
            scroller.setSize({
                x: view.headerCt.getTableWidth(),
                y: scrollRange
            });
        }
    },

    setViewSize: function(viewSize, fromLockingPartner) {
        var me = this,
            store = me.store,
            view = me.view,
            rows = view.all,
            elCount = rows.getCount(),
            start, end,
            lockingPartner = me.view.lockingPartner && me.view.lockingPartner.bufferedRenderer,
            diff = elCount - viewSize,
            i, j,
            records,
            oldRows,
            newRows,
            storeCount;

        // Exchange largest view size as long as the partner has been laid out (and thereby calculated a true view size)
        if (lockingPartner && !fromLockingPartner && lockingPartner.view.componentLayoutCounter) {
            if (lockingPartner.viewSize > viewSize) {
                viewSize = lockingPartner.viewSize;
            }
            else {
                lockingPartner.setViewSize(viewSize, true);
            }
        }

        diff = elCount - viewSize;
        if (diff) {

            // Must be set for getFirstVisibleRowIndex to work
            me.scrollTop = view.getScrollY();

            me.viewSize = viewSize;
            if (store.isBufferedStore) {
                store.setViewSize(viewSize);
            }

            // If a store loads before we have calculated a viewSize, it loads me.defaultViewSize records.
            // This may be larger or smaller than the final viewSize so the store needs adjusting when the view size is calculated.
            if (elCount) {
                storeCount = store.getCount();
                start = rows.startIndex;
                    end = Math.min(start + viewSize - 1, storeCount - 1);

                // Only do expensive adding or removal if range is not already correct
                if (!(start === rows.startIndex && end === rows.endIndex)) {
                    // While changing our visible range, the locking partner must not sync
                    if (lockingPartner) {
                        lockingPartner.disable();
                    }

                    // View must expand: add rows at end if possible
                    if (diff < 0) {

                        // If it's *possible* to add rows to the end...
                        if (storeCount > elCount) {

                            // Store's getRange API always has been inclusive of endIndex.
                            store.getRange(rows.endIndex + 1, end, {
                                callback: function(records, start) {
                                    newRows = view.doAdd(records, start);
                                    view.fireEvent('itemadd', records, start, newRows);
                                }
                            });
                        }
                    }

                    // View is shrinking: remove rows from end
                    else {
                        // Remove the DOM rows
                        start = rows.endIndex - (diff - 1);
                        end = rows.endIndex;
                        oldRows = rows.slice(start, end + 1);
                        rows.removeRange(start, end, true);

                        if (view.hasListeners.itemremove) {
                            records = store.getRange(start, end);
                            for (i = end, j = records.length - 1; j >= 0; --i, --j) {
                                view.fireEvent('itemremove', records[j], i, oldRows[j]);
                            }
                        }
                    }
                    if (lockingPartner) {
                        lockingPartner.enable();
                    }
                }
            }
        }
        return viewSize;
    },

    // @private
    // TableView's getViewRange delegates the operation to this method if buffered rendering is present.
    getViewRange: function() {
        var me = this,
            rows = me.view.all,
            store = me.store,
            startIndex = 0;

        // If there already is a view range, then the startIndex from that
        if (rows.getCount()) {
            startIndex = rows.startIndex;
        }
        // Otherwise use start index of current page.
        // https://sencha.jira.com/browse/EXTJSIV-10724
        // Buffered store may be primed with loadPage(n) call rather than autoLoad which starts at index 0.
        else if (store.isBufferedStore) {
            if (!store.currentPage) {
                store.currentPage = 1;
            }
            startIndex = rows.startIndex = (store.currentPage - 1) * (store.pageSize || 1);

            // The RowNumberer uses the current page to offset the record index, so when buffered, it must always be on page 1
            store.currentPage = 1;
        }

        if (store.data.getCount()) {
            return store.getRange(startIndex, startIndex + (me.viewSize || store.defaultViewSize) - 1);
        } else {
            return [];
        }
    },

    /**
     * @private
     * Handles the Store replace event, producing a correct buffered view after the replace operation.
     */
    onReplace: function(store, startIndex, oldRecords, newRecords) {
        var me = this,
            view = me.view,
            rows = view.all,
            oldStartIndex,
            renderedSize = rows.getCount(),
            lastAffectedIndex = startIndex + oldRecords.length - 1,
            recordIncrement = newRecords.length - oldRecords.length,
            scrollIncrement = recordIncrement * me.rowHeight;

        // All replacement activity is past the end of a full-sized rendered block; do nothing except update scroll range
        if (startIndex >= rows.startIndex + me.viewSize) {
            me.refreshSize();
            return;
        }

        // If the change is all above the rendered block, update the scroll range and
        // ensure the buffer zone above is filled if possible.
        if (renderedSize && lastAffectedIndex < rows.startIndex) {

            // Move the index-based NodeCache up or down depending on whether it's a net adding or removal above.
            rows.moveBlock(recordIncrement);
            me.refreshSize();

            // If the change above us was an addition, pretend that we just scrolled upwards
            // which will ensure that there is at least this.numFromEdge rows above the fold.
            oldStartIndex = rows.startIndex;
            if (recordIncrement > 0) {

                // Do not allow this operation to mirror to the partner side.
                me.doNotMirror = true;
                me.handleViewScroll(-1);
                me.doNotMirror = false;
            }

            // If the handleViewScroll did nothing, we just have to ensure the rendered block is the correct
            // amount down the scroll range, and then readjust the top of the rendered block to keep the visuals the same.
            if (rows.startIndex === oldStartIndex) {
                // If inserting or removing invisible records above the start of the rendered block, the visible
                // block must then be moved up or down the scroll range.
                if (rows.startIndex) {
                    me.setBodyTop(me.bodyTop += scrollIncrement);
                    view.suspendEvent('scroll');
                    view.scrollBy(0, scrollIncrement);
                    view.resumeEvent('scroll');
                    me.position = me.scrollTop = view.getScrollY();
                }
            }
            // The handleViewScroll added rows, so we must scroll to keep the visuals the same;
            else {
                view.suspendEvent('scroll');
                view.scrollBy(0, (oldStartIndex  - rows.startIndex) * me.rowHeight);
                view.resumeEvent('scroll');
            }
            view.refreshSize(rows.getCount() !== renderedSize);

            return;
        }

        // If the change is all below the rendered block, update the scroll range
        // and ensure the buffer zone below us is filled if possible.
        if (renderedSize && startIndex > rows.endIndex) {
            me.refreshSize();

            // If the change below us was an addition, ask for <viewSize>
            // rows to be rendered starting from the current startIndex.
            // If more rows need to be scrolled onto the bottom of the rendered
            // block to achieve this, that will do it.
            if (recordIncrement > 0) {
                me.onRangeFetched(null, rows.startIndex, Math.min(store.getCount(), rows.startIndex + me.viewSize) - 1, null, true);
            }
            view.refreshSize(rows.getCount() !== renderedSize);

            return;
        }

        // Cut into rendered block from above
        if (startIndex < rows.startIndex && lastAffectedIndex < rows.endIndex) {
            me.refreshView(rows.startIndex - oldRecords.length + newRecords.length);
            return;
        }

        if (startIndex < rows.startIndex && lastAffectedIndex <= rows.endIndex && scrollIncrement) {
            view.suspendEvent('scroll');
            view.setScrollY(me.position = me.scrollTop += scrollIncrement);
            view.resumeEvent('scroll');
        }

        // Only need to change display if the view is currently empty, or
        // change intersects the rendered view.
        me.refreshView();
    },

    /**
     * @private
     * Scrolls to and optionally selects the specified row index **in the total dataset**.
     *
     * This is a private method for internal usage by the framework.
     *
     * Use the grid's {@link Ext.panel.Table#ensureVisible ensureVisible} method to scroll a particular
     * record or record index into view.
     *
     * @param {Number/Ext.data.Model} record The record, or the zero-based position in the dataset to scroll to.
     * @param {Object}          [options] An object containing options to modify the operation.
     * @param {Boolean}         [options.animate] Pass `true` to animate the row into view.
     * @param {Boolean}         [options.highlight] Pass `true` to highlight the row with a glow animation when it is in view.
     * @param {Boolean}         [options.select] Pass as `true` to select the specified row.
     * @param {Boolean}         [options.focus] Pass as `true` to focus the specified row.
     * @param {Function}        [options.callback] A function to call when the row has been scrolled to.
     * @param {Number}          options.callback.recordIdx The resulting record index (may have changed if the passed index was outside the valid range).
     * @param {Ext.data.Model}  options.callback.record The resulting record from the store.
     * @param {HTMLElement}     options.callback.node The resulting view row element.
     * @param {Object}          [options.scope] The scope (`this` reference) in which to execute the callback. Defaults to this BufferedRenderer.
     *
     */
    scrollTo: function(recordIdx, options) {
        var args = arguments,
            me = this,
            view = me.view,
            lockingPartner = view.lockingPartner && view.lockingPartner.grid.isVisible() && view.lockingPartner.bufferedRenderer,
            viewDom = view.el.dom,
            store = me.store,
            total = store.getCount(),
            startIdx, endIdx,
            targetRow,
            tableTop,
            groupingFeature,
            metaGroup,
            record,
            direction,
            scrollDecrement = 0,
            doSelect,
            doFocus,
            animate,
            highlight,
            callback,
            scope;

        // New option object API
        if (options && typeof options === 'object') {
            doSelect = options.select;
            doFocus = options.focus;
            highlight = options.highlight;
            animate = options.animate;
            callback = options.callback;
            scope = options.scope;
        }
        // Old multi argument API
        else {
            doSelect = args[1];
            callback = args[2];
            scope = args[3];
        }

        // If we have a grouping summary feature rendering the view in groups,
        // first, ensure that the record's group is expanded,
        // then work out which record in the groupStore the record is at.
        if ((groupingFeature = view.dataSource.groupingFeature) && (groupingFeature.collapsible)) {
            if (recordIdx.isEntity) {
                record = recordIdx;
            } else {
                record = view.store.getAt(Math.min(Math.max(recordIdx, 0), view.store.getCount() - 1));
            }

            metaGroup = groupingFeature.getMetaGroup(record);

            if (metaGroup && metaGroup.isCollapsed) {
                groupingFeature.expand(groupingFeature.getGroup(record).getGroupKey());
                total = store.getCount();
            }

            // Get the index in the GroupStore
            recordIdx = groupingFeature.indexOf(record);

        } else {

            if (recordIdx.isEntity) {
                record = recordIdx;
                recordIdx = store.indexOf(record);

                // Currently loaded pages do not contain the passed record, we cannot proceed.
                if (recordIdx === -1) {
                    //<debug>
                    Ext.Error.raise('Unknown record passed to BufferedRenderer#scrollTo');
                    //</debug>
                    return;
                }
            } else {
                // Sanitize the requested record index
                recordIdx = Math.min(Math.max(recordIdx, 0), total - 1);
                record = store.getAt(recordIdx);
            }
        }

        // See if the required row for that record happens to be within the rendered range.
        if (record && (targetRow = view.getNode(record))) {
            view.getScrollable().scrollIntoView(targetRow, null, animate, highlight);

            // Keep the view immediately replenished when we scroll an existing element into view.
            // DOM scroll events fire asynchronously, and we must not leave subsequent code without a valid buffered row block.
            me.onViewScroll();

            if (doSelect) {
                view.selModel.select(record);
            }
            if (doFocus) {
                view.getNavigationModel().setPosition(record, 0);
            }
            if (callback) {
                callback.call(scope||me, recordIdx, record, targetRow);
            }
            return;
        }

        // Calculate view start index.
        // If the required record is above the fold...
        if (recordIdx < view.all.startIndex) {
            // The startIndex of the new rendered range is a little less than the target record index.
            direction = -1;
            startIdx = Math.max(Math.min(recordIdx - (Math.floor((me.leadingBufferZone + me.trailingBufferZone) / 2)), total - me.viewSize + 1), 0);
            endIdx = Math.min(startIdx + me.viewSize - 1, total - 1);
        }
        // If the required record is below the fold...
        else {
            // The endIndex of the new rendered range is a little greater than the target record index.
            direction = 1;
            endIdx = Math.min(recordIdx + (Math.floor((me.leadingBufferZone + me.trailingBufferZone) / 2)), total - 1);
            startIdx = Math.max(endIdx - (me.viewSize - 1), 0);
        }
        tableTop = Math.max(startIdx * me.rowHeight, 0);

        store.getRange(startIdx, endIdx, {
            callback: function(range, start, end) {
                var scroller = view.getScrollable();

                // Render the range.
                // Pass synchronous flag so that it does it inline, not on a timer.
                // Pass fromLockingPartner flag so that it does not inform the lockingPartner.
                me.renderRange(start, end, true, true);
                record = store.data.getRange(recordIdx, recordIdx + 1)[0];
                targetRow = view.getNode(record);

                // bodyTop property must track the translated position of the body
                view.body.translate(null, me.bodyTop = tableTop);

                // Ensure the scroller knows about the range if we're going down
                if (direction === 1) {
                    me.refreshSize();
                }

                // Locking partner must render the same range
                if (lockingPartner) {
                    lockingPartner.renderRange(start, end, true, true);

                    // Sync all row heights
                    me.syncRowHeights();

                    // bodyTop property must track the translated position of the body
                    lockingPartner.view.body.translate(null, lockingPartner.bodyTop = tableTop);

                    // Ensure the scroller knows about the range if we're going down
                    if (direction === 1) {
                        lockingPartner.refreshSize();
                    }
                }

                // The target does not map to a view node.
                // Cannot scroll to it.
                if (!targetRow) {
                    return;
                }

                if (direction === 1) {
                    scrollDecrement = viewDom.clientHeight - targetRow.offsetHeight;
                }
                me.position = me.scrollTop = Math.min(Math.max(0, tableTop - view.body.getOffsetsTo(targetRow)[1]) - scrollDecrement, scroller.getSize().y - viewDom.clientHeight);
                if (lockingPartner) {
                    lockingPartner.position = lockingPartner.scrollTop = me.scrollTop;
                }

                scroller.scrollIntoView(targetRow, null, animate, highlight);

                if (doSelect) {
                    view.selModel.select(record);
                }
                if (doFocus) {
                    view.getNavigationModel().setPosition(record, 0);
                }
                if (callback) {
                    callback.call(scope||me, recordIdx, record, targetRow);
                }
            }
        });
    },

    onViewScroll: function() {
        var me = this,
            store = me.store,
            totalCount = (store.getCount()),
            vscrollDistance,
            scrollDirection,
            scrollTop = me.scrollTop = me.view.getScrollY();

        // Only check for nearing the edge if we are enabled, and if there is overflow beyond our view bounds.
        // If there is no paging to be done (Store's dataset is all in memory) we will be disabled.
        if (!(me.disabled || totalCount < me.viewSize)) {

            vscrollDistance = scrollTop - me.position;
            scrollDirection = vscrollDistance > 0 ? 1 : -1;

            // Moved at least 20 pixels, or changed direction, so test whether the numFromEdge is triggered
            if (Math.abs(vscrollDistance) >= 20 || (scrollDirection !== me.lastScrollDirection)) {
                me.lastScrollDirection = scrollDirection;
                me.handleViewScroll(me.lastScrollDirection);
            }
        }
    },

    handleViewScroll: function(direction) {
        var me              = this,
            rows            = me.view.all,
            store           = me.store,
            viewSize        = me.viewSize,
            lastItemIndex   = (store.getCount()) - 1,
            requestStart,
            requestEnd;

        // We're scrolling up
        if (direction === -1) {

            // If table starts at record zero, we have nothing to do
            if (rows.startIndex) {
                if (me.topOfViewCloseToEdge()) {
                    requestStart = Math.max(0, me.getLastVisibleRowIndex() + me.trailingBufferZone - viewSize);
                }
            }
        }
        // We're scrolling down
        else {

            // If table ends at last record, we have nothing to do
            if (rows.endIndex < lastItemIndex) {
                if (me.bottomOfViewCloseToEdge()) {
                    requestStart = Math.max(0, me.getFirstVisibleRowIndex() - me.trailingBufferZone);
                }
            }
        }

        // View is OK at this scroll. Advance loadId so that any load requests in flight do not
        // result in rendering upon their return.
        if (requestStart == null) {
            me.loadId++;
        }
        // We scrolled close to the edge and the Store needs reloading
        else {
            requestEnd = Math.min(requestStart + viewSize - 1, lastItemIndex);

            // viewSize was calculated too small due to small sample row count with some skewed
            // item height in there such as a tall group header item. Extend the view size in this case.
            if (me.variableRowHeight && requestEnd === rows.endIndex && requestEnd < lastItemIndex) {
                requestEnd++;

                // Do NOT call setViewSize - that re-renders the view at the new size,
                // and we are just about to scroll it to correct it.
                me.viewSize = viewSize++;
                if (store.isBufferedStore) {
                    store.setViewSize(me.viewSize);
                }
            }

            // If calculated view range has moved, then render it and return the fact that the scroll was handled.
            if (requestStart !== rows.startIndex || requestEnd !== rows.endIndex) {
                me.renderRange(requestStart, requestEnd);
                return true;
            }
        }
    },

    bottomOfViewCloseToEdge: function() {
        var me = this;

        if (me.variableRowHeight) {
            return me.bodyTop + me.view.body.dom.offsetHeight < me.scrollTop + me.view.lastBox.height + (me.numFromEdge * me.rowHeight);
        } else {
            return (me.view.all.endIndex - me.getLastVisibleRowIndex()) < me.numFromEdge;
        }
    },

    topOfViewCloseToEdge: function() {
        var me = this;

        if (me.variableRowHeight) {
            // The body top position is within the numFromEdge zone
            return me.bodyTop > me.scrollTop - (me.numFromEdge * me.rowHeight);
        } else {
            return (me.getFirstVisibleRowIndex() - me.view.all.startIndex) < me.numFromEdge;
        }
    },

    /**
     * @private
     * Refreshes the current rendered range if possible.
     * Optionally refreshes starting at the specified index.
     */
    refreshView: function(startIndex) {
        var me = this,
            viewSize = me.viewSize,
            rows = me.view.all,
            store = me.store,
            storeCount = store.getCount(),
            maxIndex = storeCount - 1,
            endIndex;

        // Rare case that the store doesn't fill the required view size. Simple start/end calcs.
        if (storeCount < viewSize) {
            startIndex = 0;
            endIndex = maxIndex;
        } else {

            // New start index should be current start index unless that's now too close to the end of the store
            // to yield a full view, in which case work back from the end of the store. If working back from the end, the leading buffer zone
            // cannot be rendered, so subtract it from the view size.
            // Ensure we don't go negative.
            startIndex = Math.max(0, Math.min(startIndex == null ? rows.startIndex : startIndex, maxIndex - (viewSize - me.leadingBufferZone) + 1));

            // New end index works forward from the new start index ensuring we don't walk off the end    
            endIndex = Math.min(startIndex + viewSize - 1, maxIndex);

            if (endIndex - startIndex + 1 > viewSize) {
                startIndex = endIndex - viewSize + 1;
            }
        }

        store.getRange(startIndex, endIndex, {
            callback: me.doRefreshView,
            scope: me
        });
    },

    doRefreshView: function(range, startIndex, endIndex, options) {
        var me = this,
            view = me.view,
            navModel = view.getNavigationModel(),
            focusPosition = navModel.getPosition(),
            rows = view.all,
            previousStartIndex = rows.startIndex,
            previousEndIndex = rows.endIndex,
            previousFirstItem,
            previousLastItem,
            prevRowCount = rows.getCount(),
            newNodes,
            viewMoved = startIndex !== rows.startIndex,
            calculatedTop,
            scrollIncrement;

        if (view.refreshCounter) {

            // Clone position to restore to (if position was in this view - locking!)
            // because the blur caused by refresh will null the NavModel's position object.	
            if (focusPosition && focusPosition.view === view) {
                // If we are refreshing in a completely different record zone, we cannot restore focus because
                // NavigationModel would scroll back to where it last focused which is not desirable
                // if a user has grabbed the scrollbar, scrolled and then triggered a refresh in some way.
                if (focusPosition.rowIdx < startIndex || focusPosition.rowIdx > endIndex) {
                    focusPosition = null;
                } else {
                    focusPosition = focusPosition.clone();
                }
                navModel.setPosition();
            } else {
                focusPosition = null;
            }

            // So that listeners to the itemremove events know that its because of a refresh.
            // And so that this class's refresh listener knows to ignore it.
            view.refreshing = me.refreshing = true;

            view.clearViewEl(true);
            view.refreshCounter++;
            if (range.length) {
                newNodes = view.doAdd(range, startIndex);

                if (viewMoved) {
                    // Try to find overlap between newly rendered block and old block
                    previousFirstItem = rows.item(previousStartIndex, true);
                    previousLastItem = rows.item(previousEndIndex, true);

                    // Work out where to move the view top if there is overlap
                    if (previousFirstItem) {
                        scrollIncrement = -previousFirstItem.offsetTop;
                    } else if (previousLastItem) {
                        scrollIncrement = previousLastItem.offsetTop + previousLastItem.offsetHeight;
                    }

                    // If there was an overlap, we know exactly where to move the view
                    if (scrollIncrement) {
                        me.setBodyTop(me.bodyTop += scrollIncrement);
                        view.suspendEvent('scroll');
                        view.setScrollY(me.position = me.scrollTop = me.bodyTop ? me.scrollTop + scrollIncrement : 0);
                        view.resumeEvent('scroll');
                    }
                    // No overlap: calculate the a new body top and scrollTop.
                    else {
                        // To position rows, remove table's top border
                        me.setBodyTop(me.bodyTop  = calculatedTop = startIndex * me.rowHeight);
                        view.suspendEvent('scroll');
                        view.setScrollY(me.position = me.scrollTop = Math.max(calculatedTop - me.rowHeight * (calculatedTop < me.bodyTop ? me.leadingBufferZone : me.trailingBufferZone, 0)));
                        view.resumeEvent('scroll');
                    }
                }
            } else {
                view.addEmptyText();
            }
            // Correct scroll range
            me.refreshSize();
            view.refreshSize(rows.getCount() !== prevRowCount);
            view.fireEvent('refresh', view, range);

            // If the grid contained focus before the refresh, it will have been lost to the document body		
            // Restore focus to the last focused position after refresh.
            // Pass "preventNavigation" as true so that that does not cause selection.
            if (focusPosition) {
                view.cellFocused = true;
                navModel.setPosition(focusPosition, null, null, null, true);
            }
            view.headerCt.setSortState();
            view.refreshNeeded = view.refreshing = me.refreshing = false;
        } else {
            view.refresh();
        }
    },

    renderRange: function(start, end, forceSynchronous, fromLockingPartner) {
        var me = this,
            rows = me.view.all,
            store = me.store;

        // Skip if we are being asked to render exactly the rows that we already have.
        // This can happen if the viewSize has to be recalculated (due to either a data refresh or a view resize event)
        // but the calculated size ends up the same.
        if (!(start === rows.startIndex && end === rows.endIndex)) {

            // If range is available synchronously, process it now.
            if (store.rangeCached(start, end)) {
                me.cancelLoad();

                if (me.synchronousRender || forceSynchronous) {
                    me.onRangeFetched(null, start, end, null, fromLockingPartner);
                } else {
                    if (!me.renderTask) {
                        me.renderTask = new Ext.util.DelayedTask(me.onRangeFetched, me, null, false);
                    }
                    // Render the new range very soon after this scroll event handler exits.
                    // If scrolling very quickly, a few more scroll events may fire before
                    // the render takes place. Each one will just *update* the arguments with which
                    // the pending invocation is called.
                    me.renderTask.delay(1, null, null, [null, start, end, null, fromLockingPartner]);
                }
            }

            // Required range is not in the prefetch buffer. Ask the store to prefetch it.
            else {
                me.attemptLoad(start, end);
            }
        }
    },

    onRangeFetched: function(range, start, end, options, fromLockingPartner) {
        var me = this,
            view = me.view,
            oldStart,
            rows = view.all,
            removeCount,
            increment = 0,
            calculatedTop,
            newTop,
            lockingPartner = (view.lockingPartner && !fromLockingPartner && !me.doNotMirror) && view.lockingPartner.bufferedRenderer,
            newRows,
            partnerNewRows,
            topAdditionSize,
            topBufferZone,
            i,
            variableRowHeight = me.variableRowHeight;

        // View may have been destroyed since the DelayedTask was kicked off.
        if (view.isDestroyed) {
            return;
        }

        // If called as a callback from the Store, the range will be passed, if called from renderRange, it won't
        if (range) {
            // Re-cache the scrollTop if there has been an asynchronous call to the server.
            me.scrollTop = me.view.getScrollY();
        } else {
            range = me.store.getRange(start, end);

            // Store may have been cleared since the DelayedTask was kicked off.
            if (!range) {
                return;
            }
        }

        // Best guess rendered block position is start row index * row height.
        calculatedTop = start * me.rowHeight;

        // The new range encompasses the current range. Refresh and keep the scroll position stable
        if (start < rows.startIndex && end > rows.endIndex) {

            // How many rows will be added at top. So that we can reposition the table to maintain scroll position
            topAdditionSize = rows.startIndex - start;

            // MUST use View method so that itemremove events are fired so widgets can be recycled.
            view.clearViewEl(true);
            newRows = view.doAdd(range, start);
            view.fireEvent('itemadd', range, start, newRows);
            for (i = 0; i < topAdditionSize; i++) {
                increment -= newRows[i].offsetHeight;
            }

            // We've just added a bunch of rows to the top of our range, so move upwards to keep the row appearance stable
           newTop = me.bodyTop + increment;
        }
        else {
            // No overlapping nodes, we'll need to render the whole range
            // teleported flag is set in getFirstVisibleRowIndex/getLastVisibleRowIndex if
            // the table body has moved outside the viewport bounds
            if (me.teleported || start > rows.endIndex || end < rows.startIndex) {
                newTop = calculatedTop;

                // If we teleport with variable row height, the best thing is to try to render the block
                // <bufferzone> pixels above the scrollTop so that the rendered block encompasses the
                // viewport. Only do that if the start is more than <bufferzone> down the dataset.
                if (variableRowHeight) {
                    topBufferZone = me.scrollTop < me.position ? me.leadingBufferZone : me.trailingBufferZone;
                    if (start > topBufferZone) {
                        newTop = me.scrollTop - me.rowHeight * topBufferZone;
                    }
                }
                // MUST use View method so that itemremove events are fired so widgets can be recycled.
                view.clearViewEl(true);
                me.teleported = false;
            }

            if (!rows.getCount()) {
                newRows = view.doAdd(range, start);
                view.fireEvent('itemadd', range, start, newRows);
            }
            // Moved down the dataset (content moved up): remove rows from top, add to end
            else if (end > rows.endIndex) {
                removeCount = Math.max(start - rows.startIndex, 0);

                // We only have to bump the table down by the height of removed rows if rows are not a standard size
                if (variableRowHeight) {
                    increment = rows.item(rows.startIndex + removeCount, true).offsetTop;
                }
                newRows = rows.scroll(Ext.Array.slice(range, rows.endIndex + 1 - start), 1, removeCount, start, end);

                // We only have to bump the table down by the height of removed rows if rows are not a standard size
                if (variableRowHeight) {
                    // Bump the table downwards by the height scraped off the top
                    newTop = me.bodyTop + increment;
                } else {
                    newTop = calculatedTop;
                }
            }
            // Moved up the dataset: remove rows from end, add to top
            else {
                removeCount = Math.max(rows.endIndex - end, 0);
                oldStart = rows.startIndex;
                newRows = rows.scroll(Ext.Array.slice(range, 0, rows.startIndex - start), -1, removeCount, start, end);

                // We only have to bump the table up by the height of top-added rows if rows are not a standard size
                if (variableRowHeight) {
                    // Bump the table upwards by the height added to the top
                    newTop = me.bodyTop - rows.item(oldStart, true).offsetTop;

                    // We've arrived at row zero...
                    if (!rows.startIndex) {
                        // But the calculated top position is out. It must be zero at this point
                        // We adjust the scroll position to keep visual position of table the same.
                        if (newTop) {
                            view.setScrollY(me.position = (me.scrollTop -= newTop));
                            newTop = 0;
                        }
                    }

                    // Not at zero yet, but the position has moved into negative range
                    else if (newTop < 0) {
                        increment = rows.startIndex * me.rowHeight;
                        view.setScrollY(me.position = (me.scrollTop += increment));
                        newTop = me.bodyTop + increment;
                    }
                } else {
                    newTop = calculatedTop;
                }
            }

            // The position property is the scrollTop value *at which the table was last correct*
            // MUST be set at table render/adjustment time
            me.position = me.scrollTop;
        }

        // Position the item container.
        newTop = Math.max(Math.floor(newTop), 0);
        if (view.positionBody) {
            me.setBodyTop(newTop);
        }

        // Sync the other side to exactly the same range from the dataset.
        // Then ensure that we are still at exactly the same scroll position.
        if (newRows && lockingPartner && !lockingPartner.disabled) {
            // Set the pointers of the partner so that its onRangeFetched believes it is at the correct position.
            lockingPartner.scrollTop = lockingPartner.position = me.scrollTop;
            partnerNewRows = lockingPartner.onRangeFetched(null, start, end, options, true);
            if (lockingPartner.bodyTop !== newTop) {
                lockingPartner.setBodyTop(newTop);
            }
            // Set the real scrollY position after the correct data has been rendered there.
            lockingPartner.view.setScrollY(me.scrollTop);

            // Sync the row heights if configured to do so
            if (variableRowHeight && view.ownerGrid.syncRowHeights) {
                me.syncRowHeights(newRows, partnerNewRows);
            }
        }
        return newRows;
    },

    syncRowHeights: function(itemEls, partnerItemEls) {
        var me = this,
            ln = 0, otherLn = 1, // Different initial values so that all items are synched
            mySynchronizer = [],
            otherSynchronizer = [],
            RowSynchronizer = Ext.grid.locking.RowSynchronizer,
            i, rowSync;

        if (itemEls && partnerItemEls) {
            ln = itemEls.length;
            otherLn = partnerItemEls.length;
        }

        // The other side might not quite by in scroll sync with us, in which case
        // it may have gone a different path way and rolled some rows into
        // the rendered block where we may have re-rendered the whole thing.
        // If this has happened, fall back to syncing all rows.
        if (ln !== otherLn) {
            itemEls = me.view.all.slice();
            partnerItemEls = me.view.lockingPartner.all.slice();
            ln = otherLn = itemEls.length;
        }
        for (i = 0; i < ln; i++) {
            mySynchronizer[i] = rowSync = new RowSynchronizer(me.view, itemEls[i]);
            rowSync.measure();
        }
        for (i = 0; i < otherLn; i++) {
            otherSynchronizer[i] = rowSync = new RowSynchronizer(me.view.lockingPartner, partnerItemEls[i]);
            rowSync.measure();
        }
        for (i = 0; i < ln; i++) {
            mySynchronizer[i].finish(otherSynchronizer[i]);
            otherSynchronizer[i].finish(mySynchronizer[i]);
        }

        // Ensure that both BufferedRenderers have the same idea about scroll range and row height
        me.syncRowHeightsFinish();
    },

    syncRowHeightsFinish: function () {
        var me = this,
            view = me.view,
            lockingPartner = view.lockingPartner.bufferedRenderer;

        // Now that row heights have potentially changed, both BufferedRenderers
        // have to re-evaluate what they think the average rowHeight is
        // based on the synchronized-height rows.
        delete me.rowHeight;
        me.refreshSize();
        if (lockingPartner.rowHeight !== me.rowHeight) {
            delete lockingPartner.rowHeight;
            lockingPartner.refreshSize();
        }
    },

    setBodyTop: function(bodyTop) {
        var me = this,
            view = me.view,
            store = me.store,
            body = view.body;

        body.translate((me.isRTL && Ext.supports.xOriginBug && view.scrollFlags.y) ? Ext.getScrollbarSize().width : null, me.bodyTop = bodyTop);

        // If this is the last page, correct the scroll range to be just enough to fit.
        if (me.variableRowHeight) {

            // We are displaying the last row, so ensure the scroll range finishes exactly at the bottom of the view body
            if (view.all.endIndex === (store.getCount()) - 1) {
                me.stretchView(view, me.scrollHeight = me.bodyTop + body.dom.offsetHeight - 1);
            }

            // Scroll range not enough - add what we think will be enough to accommodate the final rows. Will be chopped when we get to the end. See above.
            else if (me.bodyTop + body.dom.offsetHeight - 1 > me.scrollHeight) {
                me.stretchView(view, me.scrollHeight += ((store.getCount()) - view.all.endIndex) * me.rowHeight);
            }
        }
    },

    getFirstVisibleRowIndex: function(startRow, endRow, viewportTop, viewportBottom) {
        var me = this,
            view = me.view,
            rows = view.all,
            elements = rows.elements,
            clientHeight = me.viewClientHeight,
            target,
            targetTop,
            bodyTop = me.bodyTop;

        // If variableRowHeight, we have to search for the first row who's bottom edge is within the viewport
        if (rows.getCount() && me.variableRowHeight) {
            if (!arguments.length) {
                startRow = rows.startIndex;
                endRow = rows.endIndex;
                viewportTop = me.scrollTop;
                viewportBottom = viewportTop + clientHeight;

                // Teleported so that body is outside viewport: Use rowHeight calculation
                if (bodyTop > viewportBottom || bodyTop + view.body.dom.offsetHeight < viewportTop) {
                    me.teleported = true;
                    return Math.floor(me.scrollTop / me.rowHeight);
                }

                // In first, non-recursive call, begin targeting the most likely first row
                target = startRow + Math.min(me.numFromEdge + ((me.lastScrollDirection === -1) ? me.leadingBufferZone : me.trailingBufferZone), Math.floor((endRow - startRow) / 2));
            } else {
                target = startRow + Math.floor((endRow - startRow) / 2);
            }
            targetTop = bodyTop + elements[target].offsetTop;

            // If target is entirely above the viewport, chop downwards
            if (targetTop + elements[target].offsetHeight <= viewportTop) {
                return me.getFirstVisibleRowIndex(target + 1, endRow, viewportTop, viewportBottom);
            }

            // Target is first
            if (targetTop <= viewportTop) {
                return target;
            }
            // Not narrowed down to 1 yet; chop upwards
            else if (target !== startRow) {
                return me.getFirstVisibleRowIndex(startRow, target - 1, viewportTop, viewportBottom);
            }
        }
        return Math.floor(me.scrollTop / me.rowHeight);
    },
    
    /**
     * Returns the index of the last row in your table view deemed to be visible.
     * @return {Number}
     * @private
     */
    getLastVisibleRowIndex: function(startRow, endRow, viewportTop, viewportBottom) {
        var me = this,
            view = me.view,
            rows = view.all,
            elements = rows.elements,
            clientHeight = me.viewClientHeight,
            target,
            targetTop, targetBottom,
            bodyTop = me.bodyTop;

        // If variableRowHeight, we have to search for the first row who's bottom edge is below the bottom of the viewport
        if (rows.getCount() && me.variableRowHeight) {
            if (!arguments.length) {
                startRow = rows.startIndex;
                endRow = rows.endIndex;
                viewportTop = me.scrollTop;
                viewportBottom = viewportTop + clientHeight;

                // Teleported so that body is outside viewport: Use rowHeight calculation
                if (bodyTop > viewportBottom || bodyTop + view.body.dom.offsetHeight < viewportTop) {
                    me.teleported = true;
                    return Math.floor(me.scrollTop / me.rowHeight) + Math.ceil(clientHeight / me.rowHeight);
                }

                // In first, non-recursive call, begin targeting the most likely last row
                target = endRow - Math.min(me.numFromEdge + ((me.lastScrollDirection === 1) ? me.leadingBufferZone : me.trailingBufferZone), Math.floor((endRow - startRow) / 2));
            } else {
                target = startRow + Math.floor((endRow - startRow) / 2);
            }
            targetTop = bodyTop + elements[target].offsetTop;

            // If target is entirely below the viewport, chop upwards
            if (targetTop > viewportBottom) {
                return me.getLastVisibleRowIndex(startRow, target - 1, viewportTop, viewportBottom);
            }
            targetBottom = targetTop + elements[target].offsetHeight;

            // Target is last
            if (targetBottom >= viewportBottom) {
                return target;
            }
            // Not narrowed down to 1 yet; chop downwards
            else if (target !== endRow) {
                return me.getLastVisibleRowIndex(target + 1, endRow, viewportTop, viewportBottom);
            }
        }
        return me.getFirstVisibleRowIndex() + Math.ceil(clientHeight / me.rowHeight);
    },

    getScrollHeight: function(calculatedOnly) {
        var me = this,
            view   = me.view,
            rows   = view.all,
            store  = me.store,
            recCount = store.getCount(),
            rowCount,
            scrollHeight;

        if (!recCount) {
            return 0;
        }
        if (!me.hasOwnProperty('rowHeight')) {
            rowCount = rows.getCount();
            if (rowCount) {
                me.rowHeight = me.variableRowHeight ? Math.floor(view.body.dom.clientHeight / rowCount) : rows.first(true).offsetHeight;
            }
        }
        scrollHeight = Math.floor(recCount * me.rowHeight);

        // Allow to be overridden by the reality of where the view is.
        if (!calculatedOnly) {
            // If this is the last page, correct the scroll range to be just enough to fit.
            if (scrollHeight && (rows.endIndex === recCount - 1)) {
                scrollHeight = Math.max(scrollHeight, me.bodyTop + view.body.dom.offsetHeight - 1);
            }
        }

        return me.scrollHeight = scrollHeight; // jshint ignore:line

    },

    attemptLoad: function(start, end) {
        var me = this;
        if (me.scrollToLoadBuffer) {
            if (!me.loadTask) {
                me.loadTask = new Ext.util.DelayedTask(me.doAttemptLoad, me, []);
            }
            me.loadTask.delay(me.scrollToLoadBuffer, me.doAttemptLoad, me, [start, end]);
        } else {
            me.doAttemptLoad(start, end);
        }
    },

    cancelLoad: function() {
        if (this.loadTask) {
            this.loadTask.cancel();
        }
    },

    doAttemptLoad:  function(start, end) {
        var me = this;

        this.store.getRange(start, end, {
            loadId: ++me.loadId,
            callback: function(range, start, end, options) {
                // If our loadId position has not changed since the getRange request started, we can continue to render
                if (options.loadId === me.loadId) {
                    this.onRangeFetched(range, start, end, options);
                }
            },
            scope: this,
            fireEvent: false
        });
    },

    destroy: function() {
        var me = this,
            view = me.view;
        
        me.cancelLoad();
        
        if (view && view.el) {
            view.un('scroll', me.onViewScroll, me);
        }

        // Remove listeners from old grid, view and store
        Ext.destroy(me.viewListeners, me.storeListeners, me.gridListeners, me.stretcher);
    }
}, function(cls) {
    // Minimal leading and trailing zones are best on mobile.
    // Use 2 to ensure visible range is covered
    if (Ext.supports.Touch) {
        cls.prototype.leadingBufferZone = cls.prototype.trailingBufferZone = 2;
        cls.prototype.numFromEdge = 1;
    }
});
