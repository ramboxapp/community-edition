/**
 * A publisher that adds support for mousenter and mouseleave events on browsers that do
 * not support those events natively
 * @private
 */
Ext.define('Ext.event.publisher.MouseEnterLeave', {
    extend: 'Ext.event.publisher.Dom',
    type: 'mouseEnterLeave'
}, function(MouseEnterLeave) {
    var eventMap = {
        mouseover: 'mouseenter',
        mouseout: 'mouseleave'
    };

    if (!Ext.supports.MouseEnterLeave) {
        MouseEnterLeave.override({
            handledDomEvents: ['mouseover', 'mouseout'],
            handledEvents: ['mouseenter', 'mouseleave'],

            doDelegatedEvent: function(e) {
                var target, relatedTarget, id, el, type, event;

                // call parent to dispatch the native browser event first (mouseover, mouseout)
                e = this.callParent([e]);

                target = e.getTarget();
                relatedTarget = e.getRelatedTarget();

                if (relatedTarget && Ext.fly(target).contains(relatedTarget)) {
                    return;
                }

                id = target.id;
                if (id) {
                    el = Ext.cache[id];

                    if (el) {
                        type = eventMap[e.type];
                        e = e.chain({
                            type: type
                        });
                        if (el.hasListeners[type]) {
                            event = el.events[type];

                            if (event) {
                                // mouseenter/leave are always tracked by the "directs"
                                // Ext.util.Event because they are listed in the directEvents
                                // map of Dom publisher
                                event = event.directs;
                                if (event) {
                                    e.setCurrentTarget(el.dom);
                                    event.fire(e, e.target);
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    MouseEnterLeave.instance = new MouseEnterLeave();
});
