/**
 * This abstract base class is used by grid filters that have a three
 * {@link Ext.data.Store#cfg-filters store filter}.
 * @protected
 */
Ext.define('Ext.grid.filters.filter.TriFilter', {
    extend: 'Ext.grid.filters.filter.Base',

    /**
     * @property {String[]} menuItems
     * The items to be shown in this menu.  Items are added to the menu
     * according to their position within this array.
     * Defaults to:
     *      menuItems : ['lt', 'gt', '-', 'eq']
     * @private
     */
    menuItems: ['lt', 'gt', '-', 'eq'],

    constructor: function (config) {
        var me = this,
            stateful = false,
            filter = {},
            filterGt, filterLt, filterEq, value, operator;

        me.callParent([config]);

        value = me.value;

        filterLt = me.getStoreFilter('lt');
        filterGt = me.getStoreFilter('gt');
        filterEq = me.getStoreFilter('eq');

        if (filterLt || filterGt || filterEq) {
            // This filter was restored from stateful filters on the store so enforce it as active.
            stateful = me.active = true;
            if (filterLt) {
                me.onStateRestore(filterLt);
            }
            if (filterGt) {
                me.onStateRestore(filterGt);
            }
            if (filterEq) {
                me.onStateRestore(filterEq);
            }
        } else {
            // Once we've reached this block, we know that this grid filter doesn't have a stateful filter, so if our
            // flag to begin saving future filter mutations is set we know that any configured filter must be nulled
            // out or it will replace our stateful filter.
            if (me.grid.stateful && me.getGridStore().saveStatefulFilters) {
                value = undefined;
            }

            // TODO: What do we mean by value === null ?
            me.active = me.getActiveState(config, value);
        }

        // Note that stateful filters will have already been gotten above. If not, or if all filters aren't stateful, we
        // need to make sure that there is an actual filter instance created, with or without a value.
        //
        // Note use the alpha alias for the operators ('gt', 'lt', 'eq') so they map in Filters.onFilterRemove().
        filter.lt = filterLt || me.createFilter({
            operator: 'lt',
            value: (!stateful && value && value.lt) || null
        }, 'lt');

        filter.gt = filterGt || me.createFilter({
            operator: 'gt',
            value: (!stateful && value && value.gt) || null
        }, 'gt');

        filter.eq = filterEq || me.createFilter({
            operator: 'eq',
            value: (!stateful && value && value.eq) || null
        }, 'eq');

        me.filter = filter;

        if (me.active) {
            me.setColumnActive(true);
            if (!stateful) {
                for (operator in value) {
                    me.addStoreFilter(me.filter[operator]);
                }
            }
            // TODO: maybe call this.activate?
        }
    },

    /**
     * @private
     * This method will be called when a column's menu trigger is clicked as well as when a filter is
     * activated. Depending on the caller, the UI and the store will be synced.
     */
    activate: function (showingMenu) {
        var me = this,
            filters = me.filter,
            fields = me.fields,
            filter, field, operator, value, isRootMenuItem;

        if (me.preventFilterRemoval) {
            return;
        }

        for (operator in filters) {
            filter = filters[operator];
            field = fields[operator];
            value = filter.getValue();

            if (value) {
                field.setValue(value);

                // Some types, such as Date, have additional menu check items in their Filter menu hierarchy. Others, such as Number, do not.
                // Because of this, it is necessary to make sure that the direct menuitem ancestor of the fields is not the rootMenuItem (the
                // "Filters" menu item), which has its checked state controlled elsewhere.
                //
                // In other words, if the ancestor is not the rootMenuItem, check it.
                if (isRootMenuItem === undefined) {
                    isRootMenuItem = me.owner.activeFilterMenuItem === field.up('menuitem');
                }

                if (!isRootMenuItem) {
                    field.up('menuitem').setChecked(true, /*suppressEvents*/ true);
                }

                // Note that we only want to add store filters when they've been removed, which means that when Filter.showMenu() is called
                // we DO NOT want to add a filter as they've already been added!
                if (!showingMenu) {
                    me.addStoreFilter(filter);
                }
            }
        }
    },

    /**
     * @private
     * This method will be called when a filter is deactivated. The UI and the store will be synced.
     */
    deactivate: function () {
        var me = this,
            filters = me.filter,
            f, filter;

        if (!me.countActiveFilters() || me.preventFilterRemoval) {
            return;
        }

        me.preventFilterRemoval = true;

        for (f in filters) {
            filter = filters[f];

            if (filter.getValue()) {
                me.removeStoreFilter(filter);
            }
        }

        me.preventFilterRemoval = false;
    },

    countActiveFilters: function () {
        var filters = this.filter,
            filterCollection = this.getGridStore().getFilters(),
            prefix = this.getBaseIdPrefix(),
            i = 0,
            filter;

        if (filterCollection.length) {
            for (filter in filters) {
                if (filterCollection.get(prefix + '-' + filter)) {
                    i++;
                }
            }
        }

        return i;
    },

    onFilterRemove: function (operator) {
        var me = this,
            value;

        // Filters can be removed at any time, even before a column filter's menu has been created (i.e.,
        // store.clearFilter()). So, only call setValue() if the menu has been created since that method
        // assumes that menu fields exist.
        if (!me.menu && me.countActiveFilters()) {
            me.active = false;
        } else if (me.menu) {
            value = {};
            value[operator] = null;
            me.setValue(value);
        }
    },

    onStateRestore: Ext.emptyFn,

    setValue: function (value) {
        var me = this,
            filters = me.filter,
            add = [],
            remove = [],
            active = false,
            filterCollection = me.getGridStore().getFilters(),
            field, filter, v, i, len, rLen, aLen;

        if (me.preventFilterRemoval) {
            return;
        }

        me.preventFilterRemoval = true;

        if ('eq' in value) {
            v = filters.lt.getValue();
            if (v || v === 0) {
                remove.push(filters.lt);
            }

            v = filters.gt.getValue();
            if (v || v === 0) {
                remove.push(filters.gt);
            }

            v = value.eq;
            if (v || v === 0) {
                add.push(filters.eq);
                filters.eq.setValue(v);
            } else {
                remove.push(filters.eq);
            }
        } else {
            v = filters.eq.getValue();
            if (v || v === 0) {
                remove.push(filters.eq);
            }

            if ('lt' in value) {
                v = value.lt;
                if (v || v === 0) {
                    add.push(filters.lt);
                    filters.lt.setValue(v);
                } else {
                    remove.push(filters.lt);
                }
            }

            if ('gt' in value) {
                v = value.gt;
                if (v || v === 0) {
                    add.push(filters.gt);
                    filters.gt.setValue(v);
                } else {
                    remove.push(filters.gt);
                }
            }
        }

        // Note that we don't want to update the filter collection unnecessarily, so we must know the
        // current number of active filters that this TriFilter has +/- the number of filters we're
        // adding and removing, respectively. This will determine the present active state of the
        // TriFilter which we can use to not only help determine if the condition below should pass
        // but (if it does) how the active state should then be updated.
        rLen = remove.length;
        aLen = add.length;
        active = !!(me.countActiveFilters() + aLen - rLen);

        if (rLen || aLen || active !== me.active) {
            // Begin the update now because the update could also be triggered if #setActive is called.
            // We must wrap all the calls that could change the filter collection.
            filterCollection.beginUpdate();

            if (rLen) {
                for (i = 0; i < rLen; i++) {
                    filter = remove[i];

                    me.fields[filter.getOperator()].setValue(null);
                    filter.setValue(null);
                    me.removeStoreFilter(filter);
                }
            }

            if (aLen) {
                for (i = 0; i < aLen; i++) {
                    me.addStoreFilter(add[i]);
                }
            }

            me.setActive(active);
            filterCollection.endUpdate();
        }

        me.preventFilterRemoval = false;
    }
});
