/**
 * This class provides an **unordered** collection similar to `Ext.util.Collection`. The
 * removal of order maintenance provides a significant performance increase. Further, this
 * class does not provide events or other high-level features. It maintains an array of
 * `items` and a map to quickly find items by their `id`.
 *
 * @private
 * @since 5.1.1
 */
Ext.define('Ext.util.Bag', {
    isBag: true,

    constructor: function () {
        /**
         * @property {Object[]} items
         * An array containing the items.
         * @private
         * @since 5.1.1
         */
        this.items = [];

        /**
         * @property {Object} map
         * An object used as a map to find items based on their key.
         * @private
         * @since 5.1.1
         */
        this.map = {};
    },

    /**
     * @property {Number} generation
     * Mutation counter which is incremented when the collection changes.
     * @readonly
     * @since 5.1.1
     */
    generation: 0,

    /**
     * @property {Number} length
     * The count of items in the collection.
     * @readonly
     * @since 5.1.1
     */
    length: 0,

    add: function (item) {
        var me = this,
            id = me.getKey(item),
            map = me.map,
            items = me.items,
            idx = map[id],
            old;

        if (idx === undefined) {
            items.push(item);
            map[id] = me.length++;
            old = item;
        } else {
            old = items[idx];
            items[idx] = item;
        }

        ++me.generation;

        return old;
    },

    clear: function () {
        var me = this,
            needsClear = me.generation || me.length,
            ret = needsClear ? me.items : [];

        if (needsClear) {
            me.items = [];
            me.length = 0;
            me.map = {};
            ++me.generation;
        }

        return ret;
    },

    clone: function () {
        var me = this,
            ret = new me.self(),
            len = me.length;

        if (len) {
            Ext.apply(ret.map, me.map);
            ret.items = me.items.slice();
            ret.length = me.length;
        }

        return ret;
    },

    contains: function(item) {
        var ret = false,
            map = this.map,
            key;

        if (item != null) {
            key = this.getKey(item);
            if (key in map) {
                ret = this.items[map[key]] === item;
            }
        }

        return ret;
    },

    containsKey: function(key) {
        return key in this.map;
    },

    destroy: function () {
        this.items = this.map = null;
        this.callParent();
    },

    getAt: function(index) {
        var out = null;
        if (index < this.length) {
            out = this.items[index];
        }
        return out;
    },

    getByKey: function(key) {
        var map = this.map,
            ret = null;

        if (key in map) {
            ret = this.items[map[key]];
        }
        return ret;
    },

    getCount: function() {
        return this.length;
    },

    getKey: function (item) {
        return item.id || item.getId();
    },

    remove: function (item) {
        var me = this,
            map = me.map,
            items = me.items,
            old = null,
            idx, id, last;

        if (me.length) {
            idx = map[id = me.getKey(item)];

            if (idx !== undefined) {
                delete map[id];
                old = items[idx];
                last = items.pop();

                if (idx < --me.length) {
                    items[idx] = last;
                    map[me.getKey(last)] = idx;
                }

                ++me.generation;
            }
        }

        return old;
    },

    removeByKey: function(key) {
        var item = this.getByKey(key);
        if (item) {
            this.remove(item);
        }
        return item || null;
    },

    sort: function (fn) {
        var me = this,
            items = me.items,
            n = items.length,
            item;

        if (n) {
            Ext.Array.sort(items, fn);

            me.map = {};

            while (n-- > 0) {
                item = items[n];
                me.map[me.getKey(item)] = n;
            }

            ++me.generation;
        }
    }
});