/**
 * This class is used to manage simple, LRU caches. It provides an absolutely minimal
 * container interface. It is created like this:
 *
 *      this.itemCache = new Ext.util.Cache({
 *          miss: function (key) {
 *              return new CacheItem(key);
 *          }
 *      });
 *
 * The `{@link #miss}` abstract method must be implemented by either a derived class or
 * at the instance level as shown above.
 *
 * Once the cache exists and it can handle cache misses, the cache is used like so:
 *
 *      var item = this.itemCache.get(key);
 *
 * The `key` is some value that uniquely identifies the cached item.
 *
 * In some cases, creating the cache item may require more than just the lookup key. In
 * that case, any extra arguments passed to `get` will be passed to `miss`.
 *
 *      this.otherCache = new Ext.util.Cache({
 *          miss: function (key, extra) {
 *              return new CacheItem(key, extra);
 *          }
 *      });
 *
 *      var item = this.otherCache.get(key, extra);
 *
 * To process items as they are removed, you can provide an `{@link #evict}` method. The
 * stock method is `Ext.emptyFn` and so does nothing.
 *
 * For example:
 *
 *      this.itemCache = new Ext.util.Cache({
 *          miss: function (key) {
 *              return new CacheItem(key);
 *          },
 *
 *          evict: function (key, cacheItem) {
 *              cacheItem.destroy();
 *          }
 *      });
 *
 * @class Ext.util.Cache
 * @private
 * @since 5.1.0
 */
(function (Cache, prototype) {
// @define Ext.util.Cache

    // NOTE: We have to implement this class old-school because it is used by the
    // platformConfig class processor (so Ext.define is not yet ready for action).
    (Ext.util || (Ext.util = {})).Cache = Cache = function (config) {
        var me = this,
            head;

        if (config) {
            Ext.apply(me, config);
        }

        // Give all entries the same object shape.
        me.head = head = {
            //<debug>
            id: (me.seed = 0),
            //</debug>
            key: null,
            value: null
        };

        me.map = {};

        head.next = head.prev = head;
    };

    Cache.prototype = prototype = {
        /**
         * @cfg {Number} maxSize The maximum size the cache is allowed to grow to before
         * further additions cause removal of the least recently used entry.
         */
        maxSize: 100,

        /**
         * @property {Number} count
         * The number of items in this cache.
         * @readonly
         */
        count: 0,

        /**
         * This method is called by `{@link #get}` when the key is not found in the cache.
         * The implementation of this method should create the (expensive) value and return
         * it. Whatever arguments were passed to `{@link #get}` will be passed on to this
         * method.
         *
         * @param {String} key The cache lookup key for the item.
         * @param {Object...} args Any other arguments originally passed to `{@link #get}`.
         * @method miss
         * @abstract
         * @protected
         */

        /**
         * Removes all items from this cache.
         */
        clear: function () {
            var me = this,
                head = me.head,
                entry = head.next;

            head.next = head.prev = head;

            if (!me.evict.$nullFn) {
                for ( ; entry !== head; entry = entry.next) {
                    me.evict(entry.key, entry.value);
                }
            }

            me.count = 0;
        },

        /**
         * Calls the given function `fn` for each item in the cache. The items will be passed
         * to `fn` from most-to-least recently used.
         * @param {Function} fn The function to call for each cache item.
         * @param {String} fn.key The cache key for the item.
         * @param {Object} fn.value The value in the cache for the item.
         * @param {Object} [scope] The `this` pointer to use for `fn`.
         */
        each: function (fn, scope) {
            scope = scope || this;

            for (var head = this.head, ent = head.next; ent !== head; ent = ent.next) {
                if (fn.call(scope, ent.key, ent.value)) {
                    break;
                }
            }
        },

        /**
         * Finds an item in this cache and returns its value. If the item is present, it is
         * shuffled into the MRU (most-recently-used) position as necessary. If the item is
         * missing, the `{@link #miss}` method is called to create the item.
         *
         * @param {String} key The cache key of the item.
         * @param {Object...} args Arguments for the `miss` method should it be needed.
         * @return {Object} The cached object.
         */
        get: function (key) {
            var me = this,
                head = me.head,
                map = me.map,
                entry = map[key];

            if (entry) {
                if (entry.prev !== head) {
                    // The entry is not at the front, so remove it and insert it at the front
                    // (to make it the MRU - Most Recently Used).
                    me.unlinkEntry(entry);
                    me.linkEntry(entry);
                }
            } else {
                map[key] = entry = {
                    //<debug>
                    id: ++me.seed,
                    //</debug>
                    key: key,
                    value: me.miss.apply(me, arguments)
                };

                me.linkEntry(entry);
                ++me.count;

                while (me.count > me.maxSize) {
                    me.unlinkEntry(head.prev, true);
                    --me.count;
                }
            }

            return entry.value;
        },

        //-------------------------------------------------------------------------
        // Internals

        /**
         * This method is called internally from `{@link #get}` when the cache is full and
         * the least-recently-used (LRU) item has been removed.
         *
         * @param {String} key The cache lookup key for the item being removed.
         * @param {Object} value The cache value (returned by `{@link #miss}`) for the item
         * being removed.
         * @method evict
         * @template
         * @protected
         */
        evict: Ext.emptyFn,

        /**
         * Inserts the given entry at the front (MRU) end of the entry list.
         * @param {Object} entry The cache item entry.
         * @private
         */
        linkEntry: function (entry) {
            var head = this.head,
                first = head.next;

            entry.next = first;
            entry.prev = head;
            head.next = entry;
            first.prev = entry;
        },

        /**
         * Removes the given entry from the entry list.
         * @param {Object} entry The cache item entry.
         * @param {Boolean} evicted Pass `true` if `{@link #evict}` should be called.
         * @private
         */
        unlinkEntry: function (entry, evicted) {
            var next = entry.next,
                prev = entry.prev;

            prev.next = next;
            next.prev = prev;

            if (evicted) {
                this.evict(entry.key, entry.value);
            }
        }
    };

    prototype.destroy = prototype.clear;
}());
