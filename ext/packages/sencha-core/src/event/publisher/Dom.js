/**
 * @private
 */
Ext.define('Ext.event.publisher.Dom', {
    extend: 'Ext.event.publisher.Publisher',
    requires: [
        'Ext.event.Event'
    ],

    type: 'dom',

    /**
     * @property {Array} handledDomEvents
     * An array of DOM events that this publisher handles.  Events specified in this array
     * will be added as global listeners on the {@link #target}
     */
    handledDomEvents: [],

    reEnterCount: 0,

    // The following events do not bubble, but can still be "captured" at the top of
    // the DOM,  For these events, when the delegated event model is used, we attach a
    // single listener on the window object using the "useCapture" option.
    captureEvents: {
        resize: 1,
        focus: 1,
        blur: 1,
        paste: 1,
        input: 1,
        change: 1,
        animationstart: 1,
        animationend: 1,
        scroll: 1
    },

    // The following events do not bubble, and cannot be "captured".  The only way to
    // listen for these events is via a listener attached directly to the target element
    directEvents: {
        mouseenter: 1,
        mouseleave: 1,
        pointerenter: 1,
        pointerleave: 1,
        MSPointerEnter: 1,
        MSPointerLeave: 1,
        load: 1,
        unload: 1,
        beforeunload: 1,
        error: 1,
        DOMContentLoaded: 1,
        DOMFrameContentLoaded: 1,
        hashchange: 1
    },

    /**
     * In browsers that implement pointerevents when a pointerdown is triggered by touching
     * the screen, pointerover and pointerenter events will be fired immmediately before
     * the pointerdown. Also pointerout and pointerleave will be fired immediately after
     * pointerup when triggered using touch input.  For a consistent cross-browser
     * experience on touch-screens we block pointerover, pointerout, pointerenter, and
     * pointerleave when triggered by touch input, since in most cases pointerover/pointerenter
     * behavior is not desired when touching the screen.  Note: this should only affect
     * events with pointerType === 'touch' or pointerType === 'pen', we do NOT want to
     * block these events when triggered using a mouse.
     * See also:
     *     http://www.w3.org/TR/pointerevents/#the-pointerdown-event
     *     http://www.w3.org/TR/pointerevents/#the-pointerenter-event
     * @private
     */
    blockedPointerEvents: {
        pointerover: 1,
        pointerout: 1,
        pointerenter: 1,
        pointerleave: 1,
        MSPointerOver: 1,
        MSPointerOut: 1,
        MSPointerEnter: 1,
        MSPointerLeave: 1
    },

    /**
     * Browsers with pointer events may implement "compatibility" mouse events:
     * http://www.w3.org/TR/pointerevents/#compatibility-mapping-with-mouse-events
     * The behavior implemented in handlers for mouse over/out/enter/leave is not typically
     * desired when touching the screen, so we map all of these events to their pointer
     * counterparts in Ext.Element event translation code, so that they can be blocked
     * via "blockedPointerEvents".  The only scenario where this breaks down is in IE10
     * with mouseenter/mouseleave, since MSPointerEnter/MSPointerLeave were not implemented
     * in IE10.  For these 2 events we have to resort to a different method - capturing
     * the timestamp of the last pointer event that has pointerType == 'touch', and if the
     * mouse event occurred within a certain threshold we can reasonably assume it occurred
     * because of a touch on the screen (see isEventBlocked)
     * @private
     */
    blockedCompatibilityMouseEvents: {
        mouseenter: 1,
        mouseleave: 1
    },

    constructor: function() {
        var me = this;

        me.bubbleSubscribers = {};
        me.captureSubscribers = {};
        me.directSubscribers = {};
        me.directCaptureSubscribers = {};

        // this map tracks all the names of the events that currently have a delegated
        // event listener attached so that they can be removed from the dom when the
        // publisher is destroyed
        me.delegatedListeners = {};

        me.initHandlers();

        Ext.onInternalReady(me.onReady, me);

        me.callParent();
    },

    registerEvents: function() {
        var me = this,
            publishersByEvent = Ext.event.publisher.Publisher.publishersByEvent,
            domEvents = me.handledDomEvents,
            ln = domEvents.length,
            i = 0,
            eventName;

        for (; i < ln; i++) {
            eventName = domEvents[i];
            me.handles[eventName] = 1;
            publishersByEvent[eventName] = me;
        }

        this.callParent();
    },

    onReady: function() {
        var me = this,
            domEvents = me.handledDomEvents,
            ln, i;

        if (domEvents) {
            // If the publisher has handledDomEvents we attach delegated listeners up front
            // for those events. Dom publisher does not have a list of event names, but
            // attaches listeners dynamically as subscribers are subscribed.  This allows it
            // to handle all DOM events that are not explicitly handled by another publisher.
            // Subclasses such as Gesture must explicitly list their handledDomEvents.
            for (i = 0, ln = domEvents.length; i < ln; i++) {
                me.addDelegatedListener(domEvents[i]);
            }
        }

        Ext.getWin().on('unload', me.destroy, me);
    },

    initHandlers: function() {
        var me = this;

        me.onDelegatedEvent = Ext.bind(me.onDelegatedEvent, me);
        me.onDirectEvent = Ext.bind(me.onDirectEvent, me);
        me.onDirectCaptureEvent = Ext.bind(me.onDirectCaptureEvent, me);
    },

    addDelegatedListener: function(eventName) {
        this.delegatedListeners[eventName] = 1;
        this.target.addEventListener(
            eventName, this.onDelegatedEvent, !!this.captureEvents[eventName]
        );
    },

    removeDelegatedListener: function(eventName) {
        delete this.delegatedListeners[eventName];
        this.target.removeEventListener(
            eventName, this.onDelegatedEvent, !!this.captureEvents[eventName]
        );
    },

    addDirectListener: function(eventName, element, capture) {
        element.dom.addEventListener(
            eventName,
            capture ? this.onDirectCaptureEvent : this.onDirectEvent,
            capture
        );
    },

    removeDirectListener: function(eventName, element, capture) {
        element.dom.removeEventListener(
            eventName,
            capture ? this.onDirectCaptureEvent : this.onDirectEvent,
            capture
        );
    },

    subscribe: function(element, eventName, delegated, capture) {
        var me = this,
            subscribers, id;

        if (delegated && !me.directEvents[eventName]) {
            // delegated listeners
            subscribers = capture ? me.captureSubscribers : me.bubbleSubscribers;
            if (!me.handles[eventName] && !me.delegatedListeners[eventName]) {
                // First time we've attached a listener for this eventName - need to begin
                // listening at the dom level
                me.addDelegatedListener(eventName);
            }

            if (subscribers[eventName]) {
                ++subscribers[eventName];
            } else {
                subscribers[eventName] = 1;
            }
        } else {
            subscribers = capture ? me.directCaptureSubscribers : me.directSubscribers;

            id = element.id;
            // Direct subscribers are tracked by eventName first and by element id second.
            // This allows the element id key to be deleted when there are no more subscribers
            // so that this map does not grow indefinitely (it can only grow to a finite
            // set of event names) - see unsubscribe
            subscribers = subscribers[eventName] || (subscribers[eventName] = {});
            if (subscribers[id]) {
                ++subscribers[id];
            } else {
                subscribers[id] = 1;
                me.addDirectListener(eventName, element, capture);
            }
        }
    },

    unsubscribe: function(element, eventName, delegated, capture) {
        var me = this,
            captureSubscribers, bubbleSubscribers, subscribers, id;

        if (delegated && !me.directEvents[eventName]) {
            captureSubscribers = me.captureSubscribers;
            bubbleSubscribers = me.bubbleSubscribers;
            subscribers = capture ? captureSubscribers : bubbleSubscribers;

            if (subscribers[eventName]) {
                --subscribers[eventName];
            }

            if (!me.handles[eventName] && !bubbleSubscribers[eventName] && !captureSubscribers[eventName]) {
                // decremented subscribers back to 0 - and the event is not in "handledEvents"
                // no longer need to listen at the dom level
                this.removeDelegatedListener(eventName);
            }
        } else {
            subscribers = capture ? me.directCaptureSubscribers : me.directSubscribers;

            id = element.id;
            subscribers = subscribers[eventName];
            if (subscribers[id]) {
                --subscribers[id];
            }

            if (!subscribers[id]) {
                // no more direct subscribers for this element/id/capture, so we can safely
                // remove the dom listener
                delete subscribers[id];
                me.removeDirectListener(eventName, element, capture);
            }
        }
    },

    getPropagatingTargets: function(target) {
        var currentNode = target,
            targets = [],
            parentNode;

        while (currentNode) {
            targets.push(currentNode);
            parentNode = currentNode.parentNode;

            if (!parentNode) {
                // If the node has no parentNode it means one of two things - either it is
                // not in the dom, or we have looped all the way up to the document object.
                // If the latter is the case we need to add the window object to the targets
                // to ensure that our propagation mimics browser propagation where events
                // can bubble from the document to the window.
                parentNode = currentNode.defaultView;
            }

            currentNode = parentNode;
        }

        return targets;
    },

    publish: function(eventName, target, e) {
        var me = this,
            targets, el, i, ln;

        if (Ext.isArray(target)) {
            // Gesture publisher passes an already created array of propagating targets
            targets = target;
        } else if (me.captureEvents[eventName]) {
            el = Ext.cache[target.id];
            targets = el ? [el] : [];
        } else {
            targets = me.getPropagatingTargets(target);
        }

        ln = targets.length;

        // We will now proceed to fire events in both capture and bubble phases.  You
        // may notice that we are looping all potential targets both times, and only
        // firing on the target if there is an Ext.Element wrapper in the cache.  This is
        // done (vs. eliminating non-cached targets from the array up front) because
        // event handlers can add listeners to other elements during propagation.  Looping
        // all the potential targets ensures that these dynamically added listeners
        // are fired.  See https://sencha.jira.com/browse/EXTJS-15953

        // capture phase (top-down event propagation).
        if (me.captureSubscribers[eventName]) {
            for (i = ln; i--;) {
                el = Ext.cache[targets[i].id];
                if (el) {
                    me.fire(el, eventName, e, false, true);
                    if (e.isStopped) {
                        break;
                    }
                }
            }
        }

        // bubble phase (bottom-up event propagation).
        // stopPropagation during capture phase cancels entire bubble phase
        if (!e.isStopped && me.bubbleSubscribers[eventName]) {
            for (i = 0; i < ln; i++) {
                el = Ext.cache[targets[i].id];
                if (el) {
                    me.fire(el, eventName, e, false, false);
                    if (e.isStopped) {
                        break;
                    }
                }
            }
        }
    },

    fire: function(element, eventName, e, direct, capture) {
        var event;

        if (element.hasListeners[eventName]) {
            event = element.events[eventName];

            if (event) {
                if (capture && direct) {
                    event = event.directCaptures;
                } else if (capture) {
                    event = event.captures;
                } else if (direct) {
                    event = event.directs;
                }

                // yes, this second null check for event is necessary - one of the
                // above assignments might have resulted in undefined
                if (event) {
                    e.setCurrentTarget(element.dom);
                    event.fire(e, e.target);
                }
            }
        }
    },

    onDelegatedEvent: function(e) {
        if (Ext.elevateFunction) {
            // using [e] is faster than using arguments in most browsers
            // http://jsperf.com/passing-arguments
            Ext.elevateFunction(this.doDelegatedEvent, this, [e]);
        } else {
            this.doDelegatedEvent(e);
        }
    },

    doDelegatedEvent: function(e, invokeAfter) {
        var me = this,
            timeStamp = e.timeStamp;

        e = new Ext.event.Event(e);

        if (me.isEventBlocked(e)) {
            return false;
        }

        me.beforeEvent(e);

        Ext.frameStartTime = timeStamp;

        me.reEnterCount++;
        me.publish(e.type, e.target, e);
        me.reEnterCount--;

        if (invokeAfter !== false) {
            me.afterEvent(e);
        }

        return e;
    },

    /**
     * Handler for directly-attached (non-delegated) dom events
     * @param {Event} e
     * @private
     */
    onDirectEvent: function(e) {
        if (Ext.elevateFunction) {
            // using [e] is faster than using arguments in most browsers
            // http://jsperf.com/passing-arguments
            Ext.elevateFunction(this.doDirectEvent, this, [e, false]);
        } else {
            this.doDirectEvent(e, false);
        }
    },

    // When eventPhase is AT_TARGET there's no way to know if we are handling a capture
    // or bubble listener, hence the need for this separate handler fn
    onDirectCaptureEvent: function(e) {
        if (Ext.elevateFunction) {
            // using [e] is faster than using arguments in most browsers
            // http://jsperf.com/passing-arguments
            Ext.elevateFunction(this.doDirectEvent, this, [e, true]);
        } else {
            this.doDirectEvent(e, true);
        }
    },

    doDirectEvent: function(e, capture) {
        var me = this,
            currentTarget = e.currentTarget,
            timeStamp = e.timeStamp;

        e = new Ext.event.Event(e);

        if (me.isEventBlocked(e)) {
            return;
        }

        me.beforeEvent(e);

        Ext.frameStartTime = timeStamp;

        // Since natural DOM propagation has occurred, no emulated propagation is needed.
        // Simply dispatch the event on the currentTarget element
        me.reEnterCount++;
        me.fire(Ext.cache[currentTarget.id], e.type, e, true, capture);
        me.reEnterCount--;

        me.afterEvent(e);
    },

    beforeEvent: function(e) {
        var browserEvent = e.browserEvent,
            // use full class name, not me.self, so that Dom and Gesture publishers will
            // both place flags on the same object.
            self = Ext.event.publisher.Dom,
            touches, touch;

        if (browserEvent.type === 'touchstart') {
            touches = browserEvent.touches;

            if (touches.length === 1) {
                // capture the coordinates of the first touchstart event so we can use
                // them to eliminate duplicate mouse events if needed, (see isEventBlocked).
                touch = touches[0];
                self.lastTouchStartX = touch.pageX;
                self.lastTouchStartY = touch.pageY;
            }
        }
    },

    afterEvent: function(e) {
        var browserEvent = e.browserEvent,
            type = browserEvent.type,
            // use full class name, not me.self, so that Dom and Gesture publishers will
            // both place flags on the same object.
            self = Ext.event.publisher.Dom,
            GlobalEvents = Ext.GlobalEvents;

        // It is important that the following time stamps are captured after the handlers
        // have been invoked because they need to represent the "exit" time, so that they
        // can be compared against the next "entry" time into onDelegatedEvent or
        // onDirectEvent to detect the time lapse in between the firing of the 2 events.
        // We set these flags on "this.self" so that they can be shared between Dom
        // publisher and subclasses

        if (e.self.pointerEvents[type] && e.pointerType !== 'mouse') {
            // track the last time a pointer event was fired as a result of interaction
            // with the screen, pointerType === 'touch' most likely but could also be
            // pointerType === 'pen' hence the reason we use !== 'mouse', This is used
            // to eliminate potential duplicate "compatibility" mouse events
            // (see isEventBlocked)
            self.lastScreenPointerEventTime = Ext.now();
        }

        if (type === 'touchend') {
            // Capture a time stamp so we can use it to eliminate potential duplicate
            // emulated mouse events on multi-input devices that have touch events,
            // e.g. Chrome on Window8 with touch-screen (see isEventBlocked).
            self.lastTouchEndTime = Ext.now();
        }

        if (!this.reEnterCount && GlobalEvents.hasListeners.idle && !GlobalEvents.idleEventMask[type]) {
            GlobalEvents.fireEvent('idle');
        }
    },

    /**
     * Detects if the given event should be blocked from firing because it is an emulated
     * "compatibility" mouse event triggered by a touch on the screen.
     * @param {Ext.event.Event} e
     * @return {Boolean}
     * @private
     */
    isEventBlocked: function(e) {
        var me = this,
            type = e.type,
            // use full class name, not me.self, so that Dom and Gesture publishers will
            // both look for flags on the same object.
            self = Ext.event.publisher.Dom,
            now = Ext.now();

        // prevent emulated pointerover, pointerout, pointerenter, and pointerleave
        // events from firing when triggered by touching the screen.
        return (me.blockedPointerEvents[type] && e.pointerType !== 'mouse') ||
            // prevent compatibility mouse events from firing on devices with pointer
            // events - see comment on blockedCompatibilityMouseEvents for more details
            // The time from when the last pointer event fired until when compatibility
            // events are received varies depending on the browser, device, and application
            // so we use 1 second to be safe
            (me.blockedCompatibilityMouseEvents[type] &&
                (now - self.lastScreenPointerEventTime < 1000)) ||

            (Ext.supports.TouchEvents && e.self.mouseEvents[e.type] &&
            // some browsers (e.g. webkit on Windows 8 with touch screen) emulate mouse
            // events after touch events have fired.  This only seems to happen when there
            // is no movement present, so, for example, a touchstart followed immediately
            // by a touchend would result in the following sequence of events:
            // "touchstart, touchend, mousemove, mousedown, mouseup"
            // yes, you read that right, the emulated mousemove fires before mousedown.
            // However, touch events with movement (touchstart, touchmove, then touchend)
            // do not trigger the emulated mouse events.
            // The side effect of this behavior is that single-touch gestures that expect
            // no movement (e.g. tap) can double-fire - once when the touchstart/touchend
            // occurs, and then again when the emulated mousedown/up occurs.
            // We cannot solve the problem by only listening for touch events and ignoring
            // mouse events, since we may be on a multi-input device that supports both
            // touch and mouse events and we want gestures to respond to both kinds of
            // events.  Instead we have to detect if the mouse event is a "dupe" by
            // checking if its coordinates are near the last touchstart's coordinates,
            // and if it's timestamp is within a certain threshold of the last touchend
            // event's timestamp.  This is because when dealing with multi-touch events,
            // the emulated mousedown event (when it does fire) will fire with approximately
            // the same coordinates as the first touchstart, but within a short time after
            // the last touchend.  We use 15px as the distance threshold, to be on the safe
            // side because the difference in coordinates can sometimes be up to 6px.
            Math.abs(e.pageX - self.lastTouchStartX) < 15 &&
            Math.abs(e.pageY - self.lastTouchStartY) < 15 &&

            // in the majority of cases, the emulated mousedown is observed within
            // 5ms of touchend, however, to be certain we avoid a situation where a
            // gesture handler gets executed twice we use a threshold of 1000ms.  The
            // side effect of this is that if a user touches the screen and then quickly
            // clicks screen in the same spot, the mousedown/mouseup sequence that
            // ensues will not trigger any gesture recognizers.
            (Ext.now() - self.lastTouchEndTime) < 1000);
    },

    destroy: function() {
        var eventName;

        for (eventName in this.delegatedListeners) {
            this.removeDelegatedListener(eventName);
        }
    },

    /**
     * Resets the internal state of the Dom publisher.  Internally the Dom publisher
     * keeps track of timing and coordinates of events for eliminating browser duplicates
     * (e.g. emulated mousedown after pointerdown etc.).  This method resets all this
     * cached data to a state similar to when the publisher was first instantiated.
     *
     * Applications will not typically need to use this method, but it is useful for
     * Unit-testing situations where a clean slate is required for each test.
     */
    reset: function() {
        // use full class name, not me.self, so that Dom and Gesture publishers will
        // both reset flags on the same object.
        var self = Ext.event.publisher.Dom;

        // set to undefined, not null, because that is the initial state of these vars and
        // undefined/null return different results when used in math operations
        // (see isEventBlocked)
        self.lastScreenPointerEventTime = self.lastTouchEndTime = self.lastTouchStartX =
            self.lastTouchStartY = undefined;
    }
}, function(Dom) {
    var doc = document,
        defaultView = doc.defaultView,
        prototype = Dom.prototype;

    if ((Ext.os.is.iOS && Ext.os.version.getMajor() < 5) || Ext.browser.is.AndroidStock ||
        !(defaultView && defaultView.addEventListener)) {
        // Delegated listeners will get attached to the document object because
        // attaching to the window object will not work.  In IE8 this is needed because
        // events do not bubble up to the window - bubbling stops at the document
        // object.  The iOS < 5 check was carried forward from Sencha Touch 2.3 -
        // Not sure why it was needed.  The check for (defaultView && defaultView.addEventListener)
        // was carried forward as well - it may be required for older mobile browsers.
        // see also TOUCH-5408
        prototype.target = doc;
    } else {
        /**
         * @property {Object} target the DOM target to which listeners are attached for
         * delegated events.
         * @private
         */
        prototype.target = defaultView;
    }

    Dom.instance = new Dom();
});
