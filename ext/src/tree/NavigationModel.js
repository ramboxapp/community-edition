/**
 * @class Ext.tree.NavigationModel
 * @private
 * This class listens for key events fired from a {@link Ext.tree.Panel TreePanel}, and moves the currently focused item
 * by adding the class {@link #focusCls}.
 *
 * Navigation and interactions are defined by http://www.w3.org/TR/2013/WD-wai-aria-practices-20130307/#TreeView
 * or, if there are multiple visible columns, by http://www.w3.org/TR/2013/WD-wai-aria-practices-20130307/#treegrid
 */
Ext.define('Ext.tree.NavigationModel', {
    extend: 'Ext.grid.NavigationModel',
    
    alias: 'view.navigation.tree',
    
    initKeyNav: function(view) {
        var me = this,
            columns = me.view.ownerGrid.columns;

        // Must go up to any possible locking assembly to find total number of columns
        me.isTreeGrid = columns && columns.length > 1;
        me.callParent([view]);
        me.keyNav.map.addBinding([{
            key: '8',
            shift: true,
            handler: me.onAsterisk,
            scope: me
        }, {
            key: Ext.event.Event.NUM_MULTIPLY,
            handler: me.onAsterisk,
            scope: me
        }]);
        me.view.grid.on({
            columnschanged: me.onColumnsChanged,
            scope: me
        });
    },

    onColumnsChanged: function() {
        // Must go up to any possible locking assembly to find total number of columns
        this.isTreeGrid = this.view.ownerGrid.getVisibleColumnManager().getColumns().length > 1;
    },

    onKeyLeft: function(keyEvent) {
        var me = this,
            view = keyEvent.view,
            record = me.record;

        // Left when a TreeGrid navigates between columns
        if (me.isTreeGrid && !keyEvent.ctrlKey) {
            return me.callParent([keyEvent]);
        }

        // Left arrow key on an expanded node closes the node.
        if (keyEvent.position.column.isTreeColumn && record.isExpanded()) {
            view.collapse(record);
        }
        // Left arrow key on a closed or end node moves focus to the node's parent (don't attempt to focus hidden root).
        else {
            record = record.parentNode;
            if (record && !(record.isRoot() && !view.rootVisible)) {
                me.setPosition(record, null, keyEvent);
            }
        }
    },

    onKeyRight: function(keyEvent) {
        var me = this,
            record = me.record;

        // Right when a TreeGrid navigates between columns
        if (me.isTreeGrid && !keyEvent.ctrlKey) {
            return me.callParent([keyEvent]);
        }

        // Right arrow key expands a closed node, moves to the first child of an open node, or does nothing on an end node.
        if (!record.isLeaf()) {
            if (keyEvent.position.column.isTreeColumn && !record.isExpanded()) {
                keyEvent.view.expand(record);
            } else if (record.isExpanded()) {
                record = record.childNodes[0];
                if (record) {
                    me.setPosition(record);
                }
            }
        }
    },

    onKeyEnter: function(keyEvent) {
        if (this.record.data.checked != null) {
            this.toggleCheck(keyEvent);
        } else {
            this.callParent([keyEvent]);
        }
    },

    onKeySpace: function(keyEvent) {
        if (this.record.data.checked != null) {
            this.toggleCheck(keyEvent);
        } else {
            this.callParent([keyEvent]);
        }
    },

    toggleCheck: function(keyEvent) {
        this.view.onCheckChange(this.record);
    },

    // (asterisk) on keypad expands all nodes.
    onAsterisk: function(keyEvent) {
        this.view.ownerCt.expandAll();
    }
});