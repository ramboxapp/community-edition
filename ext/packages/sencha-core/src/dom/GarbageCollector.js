/**
 * @private
 * Garbage collector for Ext.dom.Element instances.  Automatically cleans up Elements
 * that are no longer in the dom, but were not properly destroyed using
 * {@link Ext.dom.Element#destroy destroy()}.  Recommended practice is for Components to
 * clean up their own elements, but the GarbageCollector runs on regularly scheduled
 * intervals to attempt to clean up orphaned Elements that may have slipped through the cracks.
 */
Ext.define('Ext.dom.GarbageCollector', {
    singleton: true,

    /**
     * @property {Number}
     * The interval at which to run Element garbage collection. Set this property directly
     * to tune the interval.
     *
     *     Ext.dom.GarbageCollector.interval = 60000; // run garbage collection every one minute
     */
    interval: 30000,

    constructor: function() {
        var me = this;
        me.collect = Ext.Function.bind(me.collect, me);
        me.lastTime = Ext.now();
        me.resume();
    },

    /**
     * Collects orphaned Ext.dom.Elements by removing their listeners and evicting them
     * from the cache.  Runs on a regularly scheduled {@link #interval} but can be called
     * directly to force garbage collection.
     * @return {String[]} An array containing the IDs of the elements that were garbage
     * collected, prefixed by their tag names.  Only applies in dev mode.  Returns nothing
     * in a production build.
     */
    collect: function() {
        var me = this,
            cache = Ext.cache,
            eid, dom, el, t, isGarbage, tagName;
        
        //<debug>
        var collectedIds = [];
        //</debug>
        

        for (eid in cache) {
            if (!cache.hasOwnProperty(eid)) {
                continue;
            }

            el = cache[eid];

            if (el.skipGarbageCollection) {
                continue;
            }

            dom = el.dom;

            //<debug>
            // Should always have a DOM node
            if (!dom) {
                Ext.Error.raise('Missing DOM node in element garbage collection: ' + eid);
            }
            //</debug>
            
            try {
                // In IE, accessing any properties of the window object of an orphaned iframe
                // can result in a "Permission Denied" error.  The same error also occurs
                // when accessing any properties of orphaned documentElement or body inside
                // of an iframe (documentElement and body become orphaned when the iframe
                // contentWindow is unloaded)
                isGarbage = Ext.isGarbage(dom);
            } catch (e) {
                // if an error was thrown in isGarbage it is most likely because we are
                // dealing with an inaccessible window or documentElement inside an orphaned
                // iframe in IE.  In this case we can't do anything except remove the
                // cache entry.
                delete cache[eid];
                //<debug>
                collectedIds.push('#' + el.id);
                //</debug>
                continue;
            }
            
            if (isGarbage) {
                if (el && el.dom) {
                    //<debug>
                    tagName = el.dom.tagName;
                    //</debug>
                    el.collect();
                    //<debug>
                    collectedIds.push((tagName ? tagName : '') + '#' + el.id);
                    //</debug>
                }
            }
        }
        //<feature legacyBrowser>
        // Cleanup IE Object leaks
        if (Ext.isIE9m) {
            t = {};
            for (eid in cache) {
                if (cache.hasOwnProperty(eid)) {
                    t[eid] = cache[eid];
                }
            }
            Ext.cache = Ext.dom.Element.cache = t;
        }
        //</feature>

        me.lastTime = Ext.now();

        //<debug>
        return collectedIds;
        //</debug>
    },

    /**
     * Pauses the timer and stops garbage collection
     */
    pause: function() {
        clearTimeout(this.timerId);
    },

    /**
     * Resumes garbage collection at the specified {@link #interval}
     */
    resume: function() {
        var me = this,
            lastTime = me.lastTime;

        if (Ext.enableGarbageCollector && (Ext.now() - lastTime > me.interval)) {
            me.collect();
        }

        me.timerId = Ext.interval(me.collect, me.interval);
    }
});