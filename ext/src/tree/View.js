/**
 * Used as a view by {@link Ext.tree.Panel TreePanel}.
 */
Ext.define('Ext.tree.View', {
    extend: 'Ext.view.Table',
    alias: 'widget.treeview',

    config: {
        selectionModel: {
            type: 'treemodel'
        }
    },
    
    /**
     * @property {Boolean} isTreeView
     * `true` in this class to identify an object as an instantiated TreeView, or subclass thereof.
     */
    isTreeView: true,

    loadingCls: Ext.baseCSSPrefix + 'grid-tree-loading',
    expandedCls: Ext.baseCSSPrefix + 'grid-tree-node-expanded',
    leafCls: Ext.baseCSSPrefix + 'grid-tree-node-leaf',

    expanderSelector: '.' + Ext.baseCSSPrefix + 'tree-expander',
    checkboxSelector: '.' + Ext.baseCSSPrefix + 'tree-checkbox',
    expanderIconOverCls: Ext.baseCSSPrefix + 'tree-expander-over',

    // Class to add to the node wrap element used to hold nodes when a parent is being
    // collapsed or expanded. During the animation, UI interaction is forbidden by testing
    // for an ancestor node with this class.
    nodeAnimWrapCls: Ext.baseCSSPrefix + 'tree-animator-wrap',
    
    ariaRole: 'tree',

    /**
     * @cfg {Boolean}
     * @inheritdoc
     */
    loadMask: false,

    /**
     * @cfg {Boolean} rootVisible
     * False to hide the root node.
     */
    rootVisible: true,

    /**
     * @cfg {Boolean} animate
     * True to enable animated expand/collapse (defaults to the value of {@link Ext#enableFx Ext.enableFx})
     */

    expandDuration: 250,
    collapseDuration: 250,

    toggleOnDblClick: true,

    stripeRows: false,

    // fields that will trigger a change in the ui that aren't likely to be bound to a column
    uiFields: {
        checked: 1,
        icon: 1,
        iconCls: 1
    },

    // fields that requires a full row render
    rowFields: {
        expanded: 1,
        loaded: 1,
        expandable: 1,
        leaf: 1,
        loading: 1,
        qtip: 1,
        qtitle: 1,
        cls: 1
    },

    // treeRowTpl which is inserted into the rowTpl chain before the base rowTpl. Sets tree-specific classes and attributes
    treeRowTpl: [
        '{%',
            'this.processRowValues(values);',
            'this.nextTpl.applyOut(values, out, parent);',
        '%}', {
            priority: 10,
            processRowValues: function(rowValues) {
                var record = rowValues.record,
                    view = rowValues.view;

                // We always need to set the qtip/qtitle, because they may have been
                // emptied, which means we still need to flush that change to the DOM
                // so the old values are overwritten
                rowValues.rowAttr['data-qtip'] = record.get('qtip') || '';
                rowValues.rowAttr['data-qtitle'] = record.get('qtitle') || '';
                if (record.isExpanded()) {
                    rowValues.rowClasses.push(view.expandedCls);
                }
                if (record.isLeaf()) {
                    rowValues.rowClasses.push(view.leafCls);
                }
                if (record.isLoading()) {
                    rowValues.rowClasses.push(view.loadingCls);
                }
            }
        }
    ],

    /**
     * @event afteritemexpand
     * Fires after an item has been visually expanded and is visible in the tree.
     * @param {Ext.data.NodeInterface} node         The node that was expanded
     * @param {Number} index                        The index of the node
     * @param {HTMLElement} item                    The HTML element for the node that was expanded
     */

    /**
     * @event afteritemcollapse
     * Fires after an item has been visually collapsed and is no longer visible in the tree.
     * @param {Ext.data.NodeInterface} node         The node that was collapsed
     * @param {Number} index                        The index of the node
     * @param {HTMLElement} item                    The HTML element for the node that was collapsed
     */

    /**
     * @event nodedragover
     * Fires when a tree node is being targeted for a drag drop, return false to signal drop not allowed.
     * @param {Ext.data.NodeInterface} targetNode The target node
     * @param {String} position The drop position, "before", "after" or "append",
     * @param {Object} dragData Data relating to the drag operation
     * @param {Ext.event.Event} e The event object for the drag
     */

    initComponent: function() {
        var me = this;

        if (me.bufferedRenderer) {
            me.animate = false;
        }
        else if (me.initialConfig.animate === undefined) {
            me.animate = Ext.enableFx;
        }

        me.store = me.panel.getStore();
        me.onRootChange(me.store.getRoot());

        me.animQueue = {};
        me.animWraps = {};

        me.callParent();
        me.store.setRootVisible(me.rootVisible);
        me.addRowTpl(Ext.XTemplate.getTpl(me, 'treeRowTpl'));
    },

    onFillComplete: function(treeStore, fillRoot, newNodes) {
        var me = this,
            store = me.store,
            start = store.indexOf(newNodes[0]);

        // Always update the current node, since the load may be triggered
        // by .load() directly instead of .expand() on the node
        fillRoot.triggerUIUpdate();

        // In the cases of expand, the records might not be in the store yet,
        // so jump out early and expand will handle it later
        if (!newNodes.length || start === -1) {
            return;
        }

        // Insert new nodes into the view
        me.onAdd(me.store, newNodes, start);

        me.refreshPartner();
    },

    refreshPartner: function() {
        var partner = this.lockingPartner;
        if (partner) {
            partner.refresh();
        }
    },

    afterRender: function() {
        var me = this;

        me.callParent();

        me.el.on({
            scope: me,
            delegate: me.expanderSelector,
            mouseover: me.onExpanderMouseOver,
            mouseout: me.onExpanderMouseOut,
            click: {
                delegate: me.checkboxSelector,
                fn: me.onCheckboxChange,
                scope: me
            }
        });
    },

    afterComponentLayout: function(width, height, prevWidth, prevHeight) {
        var scroller = this.getScrollable();

        this.callParent([width, height, prevWidth, prevHeight]);

        if (scroller && !this.bufferedRenderer) {
            scroller.refresh();
        }
    },

    processUIEvent: function(e) {
        // If the clicked node is part of an animation, ignore the click.
        // This is because during a collapse animation, the associated Records
        // will already have been removed from the Store, and the event is not processable.
        if (e.getTarget('.' + this.nodeAnimWrapCls, this.el)) {
            return false;
        }
        return this.callParent([e]);
    },

    setRootNode: function(node) {
        this.node = node;
    },

    onCheckboxChange: function(e, t) {
        var me = this,
            item = e.getTarget(me.getItemSelector(), me.getTargetEl());

        if (item) {
            me.onCheckChange(me.getRecord(item));
        }
    },

    onCheckChange: function(record) {
        var checked = record.get('checked');
        if (Ext.isBoolean(checked)) {
            checked = !checked;
            record.set('checked', checked);
            this.fireEvent('checkchange', record, checked);
        }
    },

    getChecked: function() {
        var checked = [];
        this.node.cascadeBy(function(rec){
            if (rec.get('checked')) {
                checked.push(rec);
            }
        });
        return checked;
    },

    isItemChecked: function(rec) {
        return rec.get('checked');
    },

    /**
     * @private
     */
    createAnimWrap: function(record, index) {
        var me = this,
            node = me.getNode(record),
            tmpEl;

        tmpEl = Ext.fly(node).insertSibling({
            role: 'presentation',
            tag: 'div',
            cls: me.nodeAnimWrapCls
        }, 'after');

        return {
            record: record,
            node: node,
            el: tmpEl,
            expanding: false,
            collapsing: false,
            animateEl: tmpEl,
            targetEl: tmpEl
        };
    },

    /**
     * @private
     * Returns the animation wrapper element for the specified parent node, used to wrap the child nodes as
     * they slide up or down during expand/collapse.
     *
     * @param parent The parent node to be expanded or collapsed
     *
     * @param [bubble=true] If the passed parent node does not already have a wrap element created, by default
     * this function will bubble up to each parent node looking for a valid wrap element to reuse, returning
     * the first one it finds. This is the appropriate behavior, e.g., for the collapse direction, so that the
     * entire expanded set of branch nodes can collapse as a single unit.
     *
     * However for expanding each parent node should instead always create its own animation wrap if one
     * doesn't exist, so that its children can expand independently of any other nodes -- this is crucial
     * when executing the "expand all" behavior. If multiple nodes attempt to reuse the same ancestor wrap
     * element concurrently during expansion it will lead to problems as the first animation to complete will
     * delete the wrap el out from under other running animations. For that reason, when expanding you should
     * always pass `bubble: false` to be on the safe side.
     *
     * If the passed parent has no wrap (or there is no valid ancestor wrap after bubbling), this function
     * will return null and the calling code should then call {@link #createAnimWrap} if needed.
     *
     * @return {Ext.dom.Element} The wrapping element as created in {@link #createAnimWrap}, or null
     */
    getAnimWrap: function(parent, bubble) {
        if (!this.animate) {
            return null;
        }

        var wraps = this.animWraps,
            wrap = wraps[parent.internalId];

        if (bubble !== false) {
            while (!wrap && parent) {
                parent = parent.parentNode;
                if (parent) {
                    wrap = wraps[parent.internalId];
                }
            }
        }
        return wrap;
    },

    doAdd: function(records, index) {
        var me = this,
            record = records[0],
            parent = record.parentNode,
            all = me.all,
            relativeIndex,
            animWrap = me.getAnimWrap(parent),
            targetEl, childNodes, len, result, children;

        if (!animWrap || !animWrap.expanding) {
            return me.callParent([records, index]);
        }

        // If we are adding records which have a parent that is currently expanding
        // lets add them to the animation wrap
        result = me.bufferRender(records, index, true);
        children = result.children;

        // We need the parent that has the animWrap, not the node's parent
        parent = animWrap.record;

        // If there is an anim wrap we do our special magic logic
        targetEl = animWrap.targetEl;
        childNodes = targetEl.dom.childNodes;
        len = childNodes.length;

        // The relative index is the index in the full flat collection minus the index of the wraps parent
        relativeIndex = index - me.indexInStore(parent) - 1;

        // If we are adding records to the wrap that have a higher relative index then there are currently children
        // it means we have to append the nodes to the wrap
        if (!len || relativeIndex >= len) {
            targetEl.appendChild(result.fragment, true);
        }
        // If there are already more children then the relative index it means we are adding child nodes of
        // some expanded node in the anim wrap. In this case we have to insert the nodes in the right location
        else {
            Ext.fly(childNodes[relativeIndex]).insertSibling(children, 'before', true);
        }

        // We also have to update the node cache of the DataView
        all.insert(index, children);
        return children;
    },

    onRemove: function(ds, records, index) {
        var me = this,
            empty, i;

        if (me.viewReady) {
            empty = me.store.getCount() === 0;

            // If buffered rendering is being used, call the parent class.
            if (me.bufferedRenderer) {
                return me.callParent([ds, records, index]);
            }

            // Nothing left, just refresh the view.
            if (empty) {
                me.refresh();
            }
            else {
                // Remove in reverse order so that indices remain correct
                for (i = records.length - 1, index += i; i >= 0; --i, --index) {
                    me.doRemove(records[i], index);
                }
                me.refreshSizePending = true;
            }

            // Only loop through firing the event if there's anyone listening
            if (me.hasListeners.itemremove) {
                for (i = records.length - 1, index += i; i >= 0; --i, --index) {
                    me.fireEvent('itemremove', records[i], index, me);
                }
            }
        }
    },

    doRemove: function(record, index) {
        // If we are adding records which have a parent that is currently expanding
        // lets add them to the animation wrap
        var me = this,
            all = me.all,
            animWrap = me.getAnimWrap(record),
            item = all.item(index),
            node = item ? item.dom : null;

        if (!node || !animWrap || !animWrap.collapsing) {
            return me.callParent([record, index]);
        }

        // Insert the item at the beginning of the animate el - child nodes are removed
        // in reverse order so that the index can be used.
        animWrap.targetEl.dom.insertBefore(node, animWrap.targetEl.dom.firstChild);
        all.removeElement(index);
    },

    onBeforeExpand: function(parent, records, index) {
        var me = this,
            animWrap;

        if (me.rendered && me.all.getCount() && me.animate) {
            if (me.getNode(parent)) {
                animWrap = me.getAnimWrap(parent, false);
                if (!animWrap) {
                    animWrap = me.animWraps[parent.internalId] = me.createAnimWrap(parent);
                    animWrap.animateEl.setHeight(0);
                }
                else if (animWrap.collapsing) {
                    // If we expand this node while it is still expanding then we
                    // have to remove the nodes from the animWrap.
                    animWrap.targetEl.select(me.itemSelector).destroy();
                }
                animWrap.expanding = true;
                animWrap.collapsing = false;
            }
        }
    },

    onExpand: function(parent) {
        var me = this,
            queue = me.animQueue,
            id = parent.getId(),
            node = me.getNode(parent),
            index = node ? me.indexOf(node) : -1,
            animWrap,
            animateEl,
            targetEl;

        if (me.singleExpand) {
            me.ensureSingleExpand(parent);
        }

        // The item is not visible yet
        if (index === -1) {
            return;
        }

        animWrap = me.getAnimWrap(parent, false);

        if (!animWrap) {
            parent.isExpandingOrCollapsing = false;
            me.fireEvent('afteritemexpand', parent, index, node);
            return;
        }

        animateEl = animWrap.animateEl;
        targetEl = animWrap.targetEl;

        animateEl.stopAnimation();
        queue[id] = true;

        // Must set element height before this event finishes because animation does not set
        // initial condition until first tick has elapsed.
        // Which is good because the upcoming layout resumption must read the content height BEFORE it gets squished.
        Ext.on('idle', function() {
	    animateEl.dom.style.height = '0px';
        }, null, {single: true});

        animateEl.animate({
            from: {
                height: 0
            },
            to: {
                height: targetEl.dom.scrollHeight
            },
            duration: me.expandDuration,
            listeners: {
                afteranimate: function() {
                    // Move all the nodes out of the anim wrap to their proper location
                    // Must do this in afteranimate because lastframe does not fire if the
                    // animation is stopped.
                    var items = targetEl.dom.childNodes,
                        activeEl = Ext.Element.getActiveElement();

                    if (items.length) {
                        if (!targetEl.contains(activeEl)) {
                            activeEl = null;
                        }
                        animWrap.el.insertSibling(items, 'before', true);
                        if (activeEl) {
                            activeEl.focus();
                        }
                    }
                    animWrap.el.destroy();
                    me.animWraps[animWrap.record.internalId] = queue[id] = null;
                }
            },
            callback: function() {
                parent.isExpandingOrCollapsing = false;
                if (!me.isDestroyed) {
                    me.refreshSize(true);
                }
                me.fireEvent('afteritemexpand', parent, index, node);
            }
        });
    },

    // Triggered by the TreeStore's beforecollapse event.
    onBeforeCollapse: function(parent, records, index, callback, scope) {
        var me = this,
            animWrap;

        if (me.rendered && me.all.getCount()) {
            if (me.animate) {
                // Only process if the collapsing node is in the UI.
                // A node may be collapsed as part of a recursive ancestor collapse, and if it
                // has already been removed from the UI by virtue of an ancestor being collapsed, we should not do anything.
                if (parent.isVisible()) {
                    animWrap = me.getAnimWrap(parent);
                    if (!animWrap) {
                        animWrap = me.animWraps[parent.internalId] = me.createAnimWrap(parent, index);
                    }
                    else if (animWrap.expanding) {
                        // If we collapse this node while it is still expanding then we
                        // have to remove the nodes from the animWrap.
                        animWrap.targetEl.select(this.itemSelector).destroy();
                    }
                    animWrap.expanding = false;
                    animWrap.collapsing = true;
                    animWrap.callback = callback;
                    animWrap.scope = scope;
                }
            } else {
                // Cache any passed callback for use in the onCollapse post collapse handler non-animated codepath
                me.onCollapseCallback = callback;
                me.onCollapseScope = scope;
            }
        }
    },

    onCollapse: function(parent) {
        var me = this,
            queue = me.animQueue,
            id = parent.getId(),
            node = me.getNode(parent),
            index = node ? me.indexOf(node) : -1,
            animWrap = me.getAnimWrap(parent),
            animateEl;

        // If the collapsed node is already removed from the UI
        // by virtue of being a descendant of a collapsed node, then
        // we have nothing to do here.
        if (!me.all.getCount() || !parent.isVisible()) {
            return;
        }

        // Not animating, all items will have been added, so updateLayout and resume layouts
        if (!animWrap) {
            parent.isExpandingOrCollapsing = false;
            me.fireEvent('afteritemcollapse', parent, index, node);

            // Call any collapse callback cached in the onBeforeCollapse handler
            Ext.callback(me.onCollapseCallback, me.onCollapseScope);
            me.onCollapseCallback = me.onCollapseScope = null;
            return;
        }

        animateEl = animWrap.animateEl;

        queue[id] = true;

        animateEl.stopAnimation();
        animateEl.animate({
            to: {
                height: 0
            },
            duration: me.collapseDuration,
            listeners: {
                afteranimate: function() {
                    // In case lastframe did not fire because the animation was stopped.
                    animWrap.el.destroy();
                    me.animWraps[animWrap.record.internalId] = queue[id] = null;
                }
            },
            callback: function() {
                parent.isExpandingOrCollapsing = false;
                if (!me.isDestroyed) {
                    me.refreshSize(true);
                }
                me.fireEvent('afteritemcollapse', parent, index, node);

                // Call any collapse callback cached in the onBeforeCollapse handler
                Ext.callback(animWrap.callback, animWrap.scope);
                animWrap.callback = animWrap.scope = null;
            }
        });
    },

    /**
     * Checks if a node is currently undergoing animation
     * @private
     * @param {Ext.data.Model} node The node
     * @return {Boolean} True if the node is animating
     */
    isAnimating: function(node) {
        return !!this.animQueue[node.getId()];
    },

    /**
     * Expands a record that is loaded in the view.
     *
     * If an animated collapse or expand of the record is in progress, this call will be ignored.
     * @param {Ext.data.Model} record The record to expand
     * @param {Boolean} [deep] True to expand nodes all the way down the tree hierarchy.
     * @param {Function} [callback] The function to run after the expand is completed
     * @param {Object} [scope] The scope of the callback function.
     */
    expand: function(record, deep, callback, scope) {
        var me = this,
            doAnimate = !!me.animate,
            result;

        // Block toggling if we are already animating an expand or collapse operation.
        if (!doAnimate || !record.isExpandingOrCollapsing) {
            if (!record.isLeaf()) {
                record.isExpandingOrCollapsing = doAnimate;
            }

            // Need to suspend layouts because the expand process makes multiple changes to the UI
            // in addition to inserting new nodes. Folder and elbow images have to change, so we
            // need to coalesce all resulting layouts.
            Ext.suspendLayouts();
            result = record.expand(deep, callback, scope);
            Ext.resumeLayouts(true);
            return result;
        }
    },

    /**
     * Collapses a record that is loaded in the view.
     *
     * If an animated collapse or expand of the record is in progress, this call will be ignored.
     * @param {Ext.data.Model} record The record to collapse
     * @param {Boolean} [deep] True to collapse nodes all the way up the tree hierarchy.
     * @param {Function} [callback] The function to run after the collapse is completed
     * @param {Object} [scope] The scope of the callback function.
     */
    collapse: function(record, deep, callback, scope) {
        var me = this,
            doAnimate = !!me.animate;

        // Block toggling if we are already animating an expand or collapse operation.
        if (!doAnimate || !record.isExpandingOrCollapsing) {
            if (!record.isLeaf()) {
                record.isExpandingOrCollapsing = doAnimate;
            }
            return record.collapse(deep, callback, scope);
        }
    },

    /**
     * Toggles a record between expanded and collapsed.
     *
     * If an animated collapse or expand of the record is in progress, this call will be ignored.
     * @param {Ext.data.Model} record
     * @param {Boolean} [deep] True to collapse nodes all the way up the tree hierarchy.
     * @param {Function} [callback] The function to run after the expand/collapse is completed
     * @param {Object} [scope] The scope of the callback function.
     */
    toggle: function(record, deep, callback, scope) {
        if (record.isExpanded()) {
            this.collapse(record, deep, callback, scope);
        } else {
            this.expand(record, deep, callback, scope);
        }
    },

    onItemDblClick: function(record, item, index, e) {
        var me = this,
            editingPlugin = me.editingPlugin;

        me.callParent([record, item, index, e]);
        if (me.toggleOnDblClick && record.isExpandable() && !(editingPlugin && editingPlugin.clicksToEdit === 2)) {
            me.toggle(record);
        }
    },

    onBeforeItemMouseDown: function(record, item, index, e) {
        if (e.getTarget(this.expanderSelector, item)) {
            return false;
        }
        return this.callParent([record, item, index, e]);
    },

    onItemClick: function(record, item, index, e) {
        if (e.getTarget(this.expanderSelector, item) && record.isExpandable()) {
            this.toggle(record, e.ctrlKey);
            return false;
        }
        return this.callParent([record, item, index, e]);
    },

    onExpanderMouseOver: function(e, t) {
        e.getTarget(this.cellSelector, 10, true).addCls(this.expanderIconOverCls);
    },

    onExpanderMouseOut: function(e, t) {
        e.getTarget(this.cellSelector, 10, true).removeCls(this.expanderIconOverCls);
    },

    getStoreListeners: function() {
        return Ext.apply(this.callParent(), {
            rootchange: this.onRootChange,
            fillcomplete: this.onFillComplete
        });
    },

    onBindStore: function(store, initial, propName, oldStore) {
        var oldRoot = oldStore && oldStore.getRootNode(),
            newRoot = store && store.getRootNode();

        this.callParent([store, initial, propName, oldStore]);

        // The root implicitly changes when reconfigured with a new store.
        // The store's own rootChange event when it initially sets its own rootNode
        // will not have reached us because it was not ourt store during its initialization.
        if (newRoot !== oldRoot) {
            this.onRootChange(newRoot, oldRoot);
        }
    },

    onRootChange: function(newRoot, oldRoot) {
        var me = this;

        if (oldRoot) {
            me.rootListeners.destroy();
            me.rootListeners = null;
        }
        
        if (newRoot) {
            me.rootListeners = newRoot.on({
                beforeexpand: me.onBeforeExpand,
                expand: me.onExpand,
                beforecollapse: me.onBeforeCollapse,
                collapse: me.onCollapse,
                destroyable: true,
                scope: me
            });
        }
    },

    ensureSingleExpand: function(node) {
        var parent = node.parentNode;
        if (parent) {
            parent.eachChild(function(child) {
                if (child !== node && child.isExpanded()) {
                    child.collapse();
                }
            });
        }
    },

    shouldUpdateCell: function(record, column, changedFieldNames) {
        // For the TreeColumn, if any of the known tree column UI affecting fields are updated
        // the cell should be updated in whatever way. 1 if a custom renderer (not our default tree cell renderer), else 2.
        if (column.isTreeColumn && changedFieldNames) {
            var i = 0,
                len = changedFieldNames.length;

            for (; i < len; ++i) {
                // Check for fields which always require a full row update.
                if (this.rowFields[changedFieldNames[i]]) {
                    return 1;
                }
                // Check for fields which require this column to be updated.
                // The TreeColumn's treeRenderer is not a custom renderer.
                if (this.uiFields[changedFieldNames[i]]) {
                    return 2;
                }
            }
        }
        return this.callParent([record, column, changedFieldNames]);
    }
});
