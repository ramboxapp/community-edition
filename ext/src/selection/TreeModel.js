/**
 * This selection model is created by default for {@link Ext.tree.Panel}.
 *
 * It implements a row selection model.
 */
Ext.define('Ext.selection.TreeModel', {
    extend: 'Ext.selection.RowModel',
    alias: 'selection.treemodel',

    /**
     * @cfg {Boolean} pruneRemoved
     * @hide
     */
    
    /**
     * @cfg {Boolean} selectOnExpanderClick
     * `true` to select the row when clicking on the icon to collapse or expand
     * a tree node.
     *
     * @since 5.1.0
     */
    selectOnExpanderClick: false,

    constructor: function(config) {
        var me = this;

        me.callParent([config]);

        // If pruneRemoved is required, we must listen to the the Store's bubbled noderemove event to know when nodes
        // are added and removed from parentNodes.
        // The Store's remove event will be fired during collapses.
        if (me.pruneRemoved) {
            me.pruneRemoved = false;
            me.pruneRemovedNodes = true;
        }
    },

    getStoreListeners: function() {
        var me = this,
            result = me.callParent();

        result.noderemove = me.onNodeRemove;
        return result;
    },

    onNodeRemove: function(parent, node, isMove) {
        // deselection of deleted records done in base Model class
        if (!isMove) {
            var toDeselect = [];
            this.gatherSelected(node, toDeselect);
            if (toDeselect.length) {
                this.deselect(toDeselect);
            }
        }
    },

    // onStoreRefresh asks if it should remove from the selection any selected records which are no
    // longer findable in the store after the refresh.
    // TreeModel does not use the pruneRemoved flag because records are being added and removed
    // from TreeStores on exand and collapse. It uses the pruneRemovedNodes flag.
    pruneRemovedOnRefresh: function() {
        return this.pruneRemovedNodes;
    },

    vetoSelection: function(e) {
        var view = this.view,
            select = this.selectOnExpanderClick,
            veto = !select && e.type === 'click' && e.getTarget(view.expanderSelector || (view.lockingPartner && view.lockingPartner.expanderSelector));

        return veto || this.callParent([e]);
    },

    privates: {
        gatherSelected: function(node, toDeselect) {
            var childNodes = node.childNodes,
                i, len, child;

            if (this.selected.containsKey(node.id)) {
                toDeselect.push(node);
            }

            if (childNodes) {
                for (i = 0, len = childNodes.length; i < len; ++i) {
                    child = childNodes[i];
                    this.gatherSelected(child, toDeselect);
                }
            }
        }
    }
});
