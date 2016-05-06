/**
 * @private
 * A collection containing the result of applying grouping to the records in the store.
 */
Ext.define('Ext.util.GroupCollection', {
    extend: 'Ext.util.Collection',
    
    requires: [
        'Ext.util.Group',

        // Since Collection uses sub-collections of various derived types we step up to
        // list all the requirements of Collection. The idea being that instead of a
        // "requires" of Ext.util.Collection (which cannot pull everything) you instead
        // do a "requires" of Ext.util.GroupCollection and it will.
        'Ext.util.SorterCollection',
        'Ext.util.FilterCollection'
    ],

    isGroupCollection: true,

    config: {
        grouper: null,
        itemRoot: null
    },

    observerPriority: -100,

    //-------------------------------------------------------------------------
    // Calls from the source Collection:

    onCollectionAdd: function (source, details) {
        this.addItemsToGroups(source, details.items);
    },

    onCollectionBeforeItemChange: function (source, details) {
        this.changeDetails = details;
    },

    onCollectionBeginUpdate: function () {
        this.beginUpdate();
    },

    onCollectionEndUpdate: function () {
        this.endUpdate();
    },

    onCollectionItemChange: function (source, details) {
        var item = details.item;

        // Check if the change to the item caused the item to move. If it did, the group ordering
        // will be handled by virtue of being removed/added to the collection. If not, check whether
        // we're in the correct group and fix up if not.
        if (!details.indexChanged) {
            this.syncItemGrouping(source, item, source.getKey(item), details.oldKey, details.oldIndex);
        }
        this.changeDetails = null;
    },

    onCollectionRefresh: function (source) {
        this.removeAll();
        this.addItemsToGroups(source, source.items);
    },

    onCollectionRemove: function (source, details) {
        var me = this,
            changeDetails = me.changeDetails,
            entries, entry, group, i, n, removeGroups, item;

        if (changeDetails) {
            // The item has changed, so the group key may be different, need
            // to look it up
            item = changeDetails.item;
            group = me.findGroupForItem(item);
            entries = [];
            if (group) {
                entries.push({
                    group: group,
                    items: [item]
                });
            }
        } else {
            entries = me.groupItems(source, details.items, false);
        }

        for (i = 0, n = entries.length; i < n; ++i) {
            group = (entry = entries[i]).group;

            if (group) {
                group.remove(entry.items);
                if (!group.length) {
                    (removeGroups || (removeGroups = [])).push(group);
                }
            }
        }

        if (removeGroups) {
            me.remove(removeGroups);
        }
    },

    // If the SorterCollection instance is not changing, the Group will react to
    // changes inside the SorterCollection, but if the instance changes we need
    // to sync the Group to the new SorterCollection.
    onCollectionSort: function (source) {
        // sorting the collection effectively sorts the items in each group...
        var me = this,
            sorters = source.getSorters(false),
            items, length, i, group;

        if (sorters) {
            items = me.items;
            length = me.length;
            for (i = 0; i < length; ++i) {
                group = items[i];
                if (group.getSorters() !== sorters) {
                    group.setSorters(sorters);
                }
            }
        }
    },

    onCollectionUpdateKey: function (source, details) {
        var index = details.index,
            item = details.item;

        if (!details.indexChanged) {
            index = source.indexOf(item);
            this.syncItemGrouping(source, item, details.newKey, details.oldKey, index);
        }
    },

    //-------------------------------------------------------------------------
    // Private

    addItemsToGroups: function (source, items) {
        this.groupItems(source, items, true);
    },

    groupItems: function (source, items, adding) {
        var me = this,
            byGroup = {},
            entries = [],
            grouper = source.getGrouper(),
            groupKeys = me.itemGroupKeys,
            entry, group, groupKey, i, item, itemKey, len, newGroups;

        for (i = 0, len = items.length; i < len; ++i) {
            groupKey = grouper.getGroupString(item = items[i]);
            itemKey = source.getKey(item);

            if (adding) {
                (groupKeys || (me.itemGroupKeys = groupKeys = {}))[itemKey] = groupKey;
            } else if (groupKeys) {
                delete groupKeys[itemKey];
            }

            if (!(entry = byGroup[groupKey])) {
                if (!(group = me.getByKey(groupKey)) && adding) {
                    (newGroups || (newGroups = [])).push(group = me.createGroup(source, groupKey));
                }

                entries.push(byGroup[groupKey] = entry = {
                    group: group,
                    items: []
                });
            }

            entry.items.push(item);
        }

        for (i = 0, len = entries.length; i < len; ++i) {
            entry = entries[i];
            entry.group.add(entry.items);
        }

        if (newGroups) {
            me.add(newGroups);
        }

        return entries;
    },

    syncItemGrouping: function (source, item, itemKey, oldKey, itemIndex) {
        var me = this,
            itemGroupKeys = me.itemGroupKeys || (me.itemGroupKeys = {}),
            grouper = source.getGrouper(),
            groupKey = grouper.getGroupString(item),
            removeGroups = 0,
            index = -1,
            addGroups, group, oldGroup, oldGroupKey,
            firstIndex;

        if (oldKey) {
            oldGroupKey = itemGroupKeys[oldKey];
            delete itemGroupKeys[oldKey];
        } else {
            oldGroupKey = itemGroupKeys[itemKey];
        }

        itemGroupKeys[itemKey] = groupKey;

        if (!(group = me.get(groupKey))) {
            group = me.createGroup(source, groupKey);
            addGroups = [group];
        }

        // This checks whether or not the item is in the collection.
        // Short optimization instead of calling contains since we already have the key here.
        if (group.get(itemKey) !== item) {
            if (group.getCount() > 0 && source.getSorters().getCount() === 0) {
                // We have items in the group & it's not sorted, so find the
                // correct position in the group to insert.
                firstIndex = source.indexOf(group.items[0]);
                if (itemIndex < firstIndex) {
                    index = 0;
                } else {
                    index = itemIndex - firstIndex;
                }
            }
            if (index === -1) {
                group.add(item);
            } else {
                group.insert(index, item);
            }
        } else {
            group.itemChanged(item);
        }

        if (groupKey !== oldGroupKey && (oldGroupKey === 0 || oldGroupKey)) {
            oldGroup = me.get(oldGroupKey);
            if (oldGroup) {
                oldGroup.remove(item);
                if (!oldGroup.length) {
                    removeGroups = [oldGroup];
                }
            }
        }

        if (addGroups) {
            me.splice(0, removeGroups, addGroups);
        } else if (removeGroups) {
            me.splice(0, removeGroups);
        }
    },
    
    createGroup: function(source, key) {
        var group = new Ext.util.Group({
            groupKey: key,
            rootProperty: this.getItemRoot(),
            sorters: source.getSorters()
        });
        return group;
    },
    
    getKey: function(item) {
        return item.getGroupKey();
    },

    createSortFn: function () {
        var me = this,
            grouper = me.getGrouper(),
            sorterFn = me.getSorters().getSortFn();

        if (!grouper) {
            return sorterFn;
        }

        return function (lhs, rhs) {
            // The grouper has come from the collection, so we pass the items in
            // the group for comparison because the grouper is also used to
            // sort the data in the collection
            return grouper.sort(lhs.items[0], rhs.items[0]) || sorterFn(lhs, rhs);
        };
    },

    updateGrouper: function(grouper) {
        var me = this;
        me.grouped = !!(grouper && me.$groupable.getAutoGroup());
        me.onSorterChange();
        me.onEndUpdateSorters(me.getSorters());
    },

    destroy: function() {
        this.$groupable = null;
        this.callParent();
    },

    privates: {
        findGroupForItem: function(item) {
            var items = this.items,
                len = items.length,
                i, group;

            for (i = 0; i < len; ++i) {
                group = items[i];
                if (group.contains(item)) {
                    return group;
                }
            }
        }
    }
});
