/**
 * A special Ext.util.Event subclass that adds support for capture (top-down propagation)
 * listeners, and non-delegated (directly attached to the dom) listeners.
 *
 * An Ext.Element will have one instance of this class per event type that is being listened
 * for.  The ElementEvent instance provides a single point for attaching event listeners
 * and abstracts away important details on the timing and ordering of event firing.
 * Internally this class manages up to 3 separate Ext.util.Event instances.  These represent
 * separate stacks of listeners that may be invoked during different phases of event propagation.
 *
 * - `captures` - tracks listeners that should fire during the "capture" phase of the
 * standard delegated model (listeners attached using capture:true)
 * - `direct` - tracks directly attached listeners, that is listeners that should fire
 * immediately when the event is dispatched to the dom element, before the event bubbles
 * upward and delegated listener processing begins
 * (listeners attached using delegated:false)
 * - `directCaptures` - tracks directly attached capture listeners (only works in IE10+)
 *
 * For more detail on the timing of when these event stacks are dispatched please see
 * Ext.event.publisher.Dom
 *
 * @private
 */
Ext.define('Ext.dom.ElementEvent', {
    extend: 'Ext.util.Event',

    addListener: function(fn, scope, options, caller, manager) {
        var me = this,
            added = false,
            name = me.name,
            captures, directs, directCaptures;

        options = options || {};

        if (options.delegated === false || Ext.event.publisher.Dom.instance.directEvents[name]) {
            if (options.capture) {
                directCaptures = me.directCaptures ||
                    (me.directCaptures = new Ext.util.Event(me.observable, name));
                added = directCaptures.addListener(fn, scope, options, caller, manager);
            } else {
                directs = me.directs || (me.directs = new Ext.util.Event(me.observable, name));
                added = directs.addListener(fn, scope, options, caller, manager);
            }
        } else if (options.capture) {
            captures = me.captures || (me.captures = new Ext.util.Event(me.observable, name));
            added = captures.addListener(fn, scope, options, caller, manager);
        } else {
            added = me.callParent([fn, scope, options, caller, manager]);
        }

        return added;
    },

    removeListener: function(fn, scope) {
        var me = this,
            captures = me.captures,
            directs = me.directs,
            directCaptures = me.directCaptures,
            removed = false,
            index = me.findListener(fn, scope);

        if (index !== -1) {
            removed = me.callParent([fn, scope, index]);
        } else {
            if (directs) {
                index = directs.findListener(fn, scope);
            }

            if (index !== -1) {
                removed = directs.removeListener(fn, scope, index);
            } else {
                if (captures) {
                    index = captures.findListener(fn, scope);
                }

                if (index !== -1) {
                    removed = captures.removeListener(fn, scope, index);
                } else if (directCaptures) {
                    index = directCaptures.findListener(fn, scope);
                    if (index !== -1) {
                        removed = directCaptures.removeListener(fn, scope, index);
                    }
                }
            }
        }

        return removed;
    },

    clearListeners: function() {
        var me = this,
            directCaptures = me.directCaptures,
            directs = me.directs,
            captures = me.captures;

        if (directCaptures) {
            directCaptures.clearListeners();
        }

        if (directs) {
            directs.clearListeners();
        }

        if (captures) {
            captures.clearListeners();
        }

        me.callParent();
    },

    suspend: function() {
        var me = this,
            directCaptures = me.directCaptures,
            directs = me.directs,
            captures = me.captures;

        if (directCaptures) {
            directCaptures.suspend();
        }

        if (directs) {
            directs.suspend();
        }

        if (captures) {
            captures.suspend();
        }

        me.callParent();
    },

    resume: function() {
        var me = this,
            directCaptures = me.directCaptures,
            directs = me.directs,
            captures = me.captures;

        if (directCaptures) {
            directCaptures.resume();
        }

        if (directs) {
            directs.resume();
        }

        if (captures) {
            captures.resume();
        }

        me.callParent();
    }

});