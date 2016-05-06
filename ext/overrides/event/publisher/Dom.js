//<feature legacyBrowser>
Ext.define('Ext.overrides.event.publisher.Dom', {
    override: 'Ext.event.publisher.Dom'

}, function (DomPublisher) {
    if (Ext.isIE9m) {
        var docBody = document.body,
            prototype = DomPublisher.prototype,
            onDirectEvent, onDirectCaptureEvent;

        prototype.target = document;
        prototype.directBoundListeners = {};

        // This method gets bound to the element scope in addDirectListener so that
        // the currentTarget can be captured using "this".
        onDirectEvent = function(e, publisher, capture) {
            e.target = e.srcElement || window;
            e.currentTarget = this;
            if (capture) {
                // Although directly attached capture listeners are not supported in IE9m
                // we still need to call the handler so at least the event fires.
                publisher.onDirectCaptureEvent(e);
            } else {
                publisher.onDirectEvent(e);
            }
        };

        onDirectCaptureEvent = function(e, publisher) {
            e.target = e.srcElement || window;
            e.currentTarget = this; // this, not DomPublisher
            publisher.onDirectCaptureEvent(e);
        };

        DomPublisher.override({
            addDelegatedListener: function(eventName) {
                this.delegatedListeners[eventName] = 1;
                // Use attachEvent for IE9 and below.  Even though IE9 strict supports
                // addEventListener, it has issues with using synthetic events.
                this.target.attachEvent('on' + eventName, this.onDelegatedEvent);
            },

            removeDelegatedListener: function(eventName) {
                delete this.delegatedListeners[eventName];
                this.target.detachEvent('on' + eventName, this.onDelegatedEvent);
            },

            addDirectListener: function(eventName, element, capture) {
                var me = this,
                    dom = element.dom,
                    // binding the listener to the element allows us to capture the
                    // "currentTarget" (see onDirectEvent)
                    boundFn = Ext.Function.bind(onDirectEvent, dom, [me, capture], true),
                    directBoundListeners = me.directBoundListeners,
                    handlers = directBoundListeners[eventName] || (directBoundListeners[eventName] = {});

                handlers[dom.id] = boundFn;
                // may be called with an SVG element here, which
                // does not have the attachEvent method on IE 9 strict
                if(dom.attachEvent) {
                    dom.attachEvent('on' + eventName, boundFn);
                } else {
                    me.callParent(arguments);
                }
            },

            removeDirectListener: function(eventName, element) {
                var dom = element.dom;

                if (dom.detachEvent) {
                    dom.detachEvent('on' + eventName,
                        this.directBoundListeners[eventName][dom.id]);
                } else {
                    this.callParent(arguments);
                }
            },

            doDelegatedEvent: function(e, invokeAfter) {
                e.target = e.srcElement || window;

                if (e.type === 'focusin') {
                    e.relatedTarget = e.fromElement === docBody ? null : e.fromElement;
                }
                else if (e.type === 'focusout') {
                    e.relatedTarget = e.toElement === docBody ? null : e.toElement;
                }

                return this.callParent([e, invokeAfter]);
            }
        });

        // can't capture any events without addEventListener.  Have to have direct
        // listeners for every event that does not bubble.
        Ext.apply(prototype.directEvents, prototype.captureEvents);
        prototype.captureEvents = {};
    }
});
//</feature>