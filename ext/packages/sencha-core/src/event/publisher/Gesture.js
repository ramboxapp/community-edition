/**
 * @private
 */
Ext.define('Ext.event.publisher.Gesture', {
    extend: 'Ext.event.publisher.Dom',

    requires: [
        'Ext.util.Point',
        'Ext.AnimationQueue'
    ],

    uses: 'Ext.event.gesture.*',

    type: 'gesture',

    config: {
        /**
         * @private
         *
         * By default the gesture publisher runs all handlers on requestAnimationFrame
         * timing for smooth performance of gestures and scrolling.  Set this config
         * to false to disable requestAnimationFrame and run handlers immediately.
         *
         * Test environments may want to set this to false to ensure that gesture events
         * such as tap behave the same as dom events such as click in that they fire
         * immediately with no delay
         */
        async: true
    },

    isCancelEvent: {
        touchcancel: 1,
        pointercancel: 1,
        MSPointerCancel: 1
    },

    handledEvents: [],
    handledDomEvents: [],

    constructor: function(config) {
        var me = this,
            handledDomEvents = me.handledDomEvents,
            supports = Ext.supports,
            supportsTouchEvents = supports.TouchEvents,
            Fn = Ext.Function,
            onTouchStart = me.onTouchStart,
            onTouchMove = me.onTouchMove,
            onTouchEnd = me.onTouchEnd,
            // onTouchMove runs on requestAnimationFrame for performance reasons.
            // onTouchEnd must follow the same pattern, to avoid a scenario where touchend
            // could potentially be processed before the last touchmove
            //
            // Although it may seem unintuitive, onTouchStart must also run using
            // requestAnimationFrame timing. This is necessary mainly on muli-input devices
            // such as Windows 8 with Chrome (see https://sencha.jira.com/browse/EXTJS-14945)
            // on such browsers, if you click the mouse and then touch the screen in a
            // different location, the browser will simulate a "mousemove" event before
            // the touchstart event, as if you moved the mouse to the new location before
            // touching the screen.  In this scenario we need to ensure that the simulated
            // mousemove happens BEFORE the touchstart event, or gesture recognizers can
            // get out of sync
            //
            // onTouchMove invocations are queued in such a way that the last invocation
            // wins if multiple invocations occur within a single animation frame
            // (this is the default behavior of createAnimationFrame)
            //
            // onTouchStart and onTouchEnd invocations are queued in FIFO order.  This is
            // different from how onTouchMove behaves because when multiple "start" or
            // "end" events occur in quick succession, we need to handle them all so we
            // can sync the state of activeTouches and activeTouchesMap.
            asyncTouchStart = Fn.createAnimationFrame(me.onTouchStart, me, null, 1),
            asyncTouchMove = Fn.createAnimationFrame(me.onTouchMove, me),
            asyncTouchEnd = Fn.createAnimationFrame(me.onTouchEnd, me, null, 1);

        // set up handlers that do not use requestAnimationFrame for when the useAnimationFrame
        // config is set to false
        me._handlers = {
            touchstart: onTouchStart,
            touchmove: onTouchMove,
            touchend: onTouchEnd,
            touchcancel: onTouchEnd,
            pointerdown: onTouchStart,
            pointermove: onTouchMove,
            pointerup: onTouchEnd,
            pointercancel: onTouchEnd,
            MSPointerDown: onTouchStart,
            MSPointerMove: onTouchMove,
            MSPointerUp: onTouchEnd,
            MSPointerCancel: onTouchEnd,
            mousedown: onTouchStart,
            mousemove: onTouchMove,
            mouseup: onTouchEnd
        };

        me._asyncHandlers = {
            touchstart: asyncTouchStart,
            touchmove: asyncTouchMove,
            touchend: asyncTouchEnd,
            touchcancel: asyncTouchEnd,
            pointerdown: asyncTouchStart,
            pointermove: asyncTouchMove,
            pointerup: asyncTouchEnd,
            pointercancel: asyncTouchEnd,
            MSPointerDown: asyncTouchStart,
            MSPointerMove: asyncTouchMove,
            MSPointerUp: asyncTouchEnd,
            MSPointerCancel: asyncTouchEnd,
            mousedown: asyncTouchStart,
            mousemove: asyncTouchMove,
            mouseup: asyncTouchEnd
        };

        // A map that tracks names of the handledEvents of all registered recognizers
        me.activeTouchesMap = {};
        me.activeTouches = [];
        me.changedTouches = [];
        me.recognizers = [];

        if (supportsTouchEvents) {
            // bind handlers that are only invoked when the browser has touchevents
            me.onTargetTouchMove = me.onTargetTouchMove.bind(me);
            me.onTargetTouchEnd = me.onTargetTouchEnd.bind(me);
        }

        if (supports.PointerEvents) {
            handledDomEvents.push('pointerdown', 'pointermove', 'pointerup', 'pointercancel');
            me.mousePointerType = 'mouse';
        } else if (supports.MSPointerEvents) {
            // IE10 uses vendor prefixed pointer events, IE11+ use unprefixed names.
            handledDomEvents.push('MSPointerDown', 'MSPointerMove', 'MSPointerUp', 'MSPointerCancel');
            me.mousePointerType = 4;
        } else if (supportsTouchEvents) {
            handledDomEvents.push('touchstart', 'touchmove', 'touchend', 'touchcancel');
        }

        if (!handledDomEvents.length || (supportsTouchEvents && Ext.isWebKit && Ext.os.is.Desktop)) {
            // If the browser doesn't have pointer events or touch events we use mouse events
            // to trigger gestures.  The exception to this rule is touch enabled webkit
            // browsers such as chrome on Windows 8.  These browsers accept both touch and
            // mouse input, so we need to listen for both touch events and mouse events.
            handledDomEvents.push('mousedown', 'mousemove', 'mouseup');
        }

        me.initConfig(config);

        return me.callParent();
    },

    onReady: function() {
        this.callParent();

        Ext.Array.sort(this.recognizers, function(recognizerA, recognizerB) {
            var a = recognizerA.priority,
                b = recognizerB.priority;

            return (a > b) ? 1 : (a < b) ? -1 : 0;
        });
    },

    registerRecognizer: function(recognizer) {
        var me = this,
            handledEvents = recognizer.handledEvents,
            ln = handledEvents.length,
            i;

        // The recognizer will call our onRecognized method when it determines that a
        // gesture has occurred.
        recognizer.setOnRecognized(me.onRecognized);
        recognizer.setCallbackScope(me);

        // the gesture publishers handledEvents array is derived from the handledEvents
        // of all of its recognizers
        for (i = 0; i < ln; i++) {
            me.handledEvents.push(handledEvents[i]);
        }

        me.registerEvents(handledEvents);

        me.recognizers.push(recognizer);
    },

    onRecognized: function(eventName, e, info) {
        var me = this,
            changedTouches = e.changedTouches,
            ln = changedTouches.length,
            targetGroups, targets, i, touch;

        info = info || {};

        // At this point "e" still refers to the originally dispatched Ext.event.Event that
        // wraps a native browser event such as "touchend", or "mousemove".  We need to
        // dispatch with an an event object that has the correct "recognized" type such
        // as "tap", or "drag".  We don't want to change the type of the original event
        // object because it may be used asynchronously by event handlers, so we create a
        // new object that is chained to the original event.
        info.type = eventName;
        // Touch events have a handy feature - the original target of a touchstart is
        // always the target of successive touchmove/touchend events event if the touch
        // is dragged off of the original target.  Pointer events also have this behavior
        // via the setPointerCapture method, unless their target is removed from the dom
        // mid-gesture, however, we do not currently use setPointerCapture because it
        // can change the target of translated mouse events.  Mouse events do not have this
        // "capturing" feature at all - the target is always the element that was under
        // the mouse at the time the event occurred.  To be safe, and to ensure consistency,
        // we just always set the target of recognized events to be the original target
        // that was cached when the first "start" event was received.
        info.target = changedTouches[0].target;

        // reset isStopped just in case the event that we are wrapping had
        // stoppedPropagation called
        info.isStopped = false;

        e = e.chain(info);

        if (ln > 1) {
            targetGroups = [];
            for (i = 0; i < ln; i++) {
                touch = changedTouches[i];
                targetGroups.push(touch.targets);
            }

            targets = me.getCommonTargets(targetGroups);
        } else {
            targets = changedTouches[0].targets;
        }

        me.publish(eventName, targets, e);
    },

    getCommonTargets: function(targetGroups) {
        var firstTargetGroup = targetGroups[0],
            ln = targetGroups.length;

        if (ln === 1) {
            return firstTargetGroup;
        }

        var commonTargets = [],
            i = 1,
            target, targets, j;

        while (true) {
            target = firstTargetGroup[firstTargetGroup.length - i];

            if (!target) {
                return commonTargets;
            }

            for (j = 1; j < ln; j++) {
                targets = targetGroups[j];

                if (targets[targets.length - i] !== target) {
                    return commonTargets;
                }
            }

            commonTargets.unshift(target);
            i++;
        }

        return commonTargets;
    },

    invokeRecognizers: function(methodName, e) {
        var recognizers = this.recognizers,
            ln = recognizers.length,
            i, recognizer;

        if (methodName === 'onStart') {
            for (i = 0; i < ln; i++) {
                recognizers[i].isActive = true;
            }
        }

        for (i = 0; i < ln; i++) {
            recognizer = recognizers[i];
            if (recognizer.isActive && recognizer[methodName].call(recognizer, e) === false) {
                recognizer.isActive = false;
            }
        }
    },

    updateTouches: function(e, isEnd) {
        var me = this,
            browserEvent = e.browserEvent,
            // the touchSource is the object from which we get data about the changed touch
            // point or points related to an event object, such as identifier, target, and
            // coordinates. For touch event the source is changedTouches, for mouse and
            // pointer events it is the event object itself.
            touchSources = browserEvent.changedTouches || [browserEvent],
            activeTouches = me.activeTouches,
            activeTouchesMap = me.activeTouchesMap,
            changedTouches = [],
            touchSource, identifier, touch, target, i, ln, x, y;

        for (i = 0, ln = touchSources.length; i < ln; i++) {
            touchSource = touchSources[i];

            if ('identifier' in touchSource) {
                // touch events have an identifier property on their touches objects.
                // It can be 0, hence the "in" check
                identifier = touchSource.identifier;
            } else if ('pointerId' in touchSource) {
                // Pointer events have a pointerId on the event object itself
                identifier = touchSource.pointerId;
            } else {
                // Mouse events don't have an identifier, so we always use 1 since there
                // can only be one mouse touch point active at a time
                identifier = 1;
            }

            touch = activeTouchesMap[identifier];

            if (!touch) {
                target = Ext.event.Event.resolveTextNode(touchSource.target);
                touch = activeTouchesMap[identifier] = {
                    identifier: identifier,
                    target: target,
                    // There are 2 main advantages to caching the targets here, vs.
                    // waiting until onRecognized
                    // 1. for "move" events we don't have to construct the targets array
                    // for every event - a theoretical performance win
                    // 2. if the target is removed from the dom mid-gesture we still
                    // want any gestures listeners on elements that were above the
                    // target to complete.  This means the propagating targets must reflect
                    // the target element's initial hierarchy when the gesture began
                    targets: me.getPropagatingTargets(target)
                };
                activeTouches.push(touch);
            }

            if (isEnd) {
                delete activeTouchesMap[identifier];
                Ext.Array.remove(activeTouches, touch);
            }

            x = touchSource.pageX;
            y = touchSource.pageY;

            touch.pageX = x;
            touch.pageY = y;
            // recognizers frequently use Point methods, so go ahead and create a Point.
            touch.point = new Ext.util.Point(x, y);
            changedTouches.push(touch);
        }

        // decorate the event object with the touch point info so that it can be used from
        // within gesture recognizers (clone touches, just in case event object is used
        // asynchronously since this.activeTouches is continuously modified)
        e.touches = Ext.Array.clone(activeTouches);
        // no need to clone changedTouches since we just created it from scratch
        e.changedTouches = changedTouches;
    },

    doDelegatedEvent: function(e) {
        var me = this;

        // call parent method to dispatch the browser event (e.g. touchstart, mousemove)
        // before proceeding to the gesture recognition step.
        e = me.callParent([e, false]);

        // superclass method will return false if the event being handled is a
        // "emulated" event.  This may include emulated mouse events on browsers that
        // support touch events, or "compatibility" mouse events on browsers that
        // support pointer events.  If this is the case, do not proceed with gesture
        // recognition.
        if (e) {
            if (!e.button || e.button < 1) {
                // mouse gestures (and pointer gestures triggered by a mouse) can only be
                // initiated using the left button (0).  button value < 0 is also acceptable
                // (e.g. pointermove has a button value of -1)
                me.handlers[e.type].call(me, e);
            }

            // wait until after handlers have been dispatched before calling afterEvent.
            // this ensures that timestamps captured in afterEvent represent the time
            // that event handling completed for this event.
            me.afterEvent(e);
        }
    },

    onTouchStart: function(e) {
        var me = this,
            target = e.target;

        if (e.browserEvent.type === 'touchstart') {
            // When using touch events, if the target is removed from the dom mid-gesture
            // the touchend event cannot be handled normally because it will not bubble
            // to the top of the dom since the target el is no longer attached to the dom.
            // Add some special handlers to clean everything up. (see onTargetTouchEnd)
            // use addEventListener directly so that we don't have to spin up an instance
            // of Ext.Element for every event target.
            target.addEventListener('touchmove', me.onTargetTouchMove);
            target.addEventListener('touchend', me.onTargetTouchEnd);
            target.addEventListener('touchcancel', me.onTargetTouchEnd);
        }

        me.updateTouches(e);

        if (!me.isStarted) {
            // this is the first active touch - invoke "onStart" which indicates the
            // beginning of a gesture
            me.isStarted = true;
            me.invokeRecognizers('onStart', e);

            // Disable garbage collection during gestures so that if the target element
            // of a gesture is removed from the dom, it does not get garbage collected
            // until the gesture is complete
            if (Ext.enableGarbageCollector) {
                Ext.dom.GarbageCollector.pause();
            }
        }
        me.invokeRecognizers('onTouchStart', e);
    },

    onTouchMove: function(e) {
        var me = this,
            mousePointerType = me.mousePointerType;

        if (me.isStarted) {
            // In IE10/11, the corresponding pointerup event is not fired after the pointerdown after 
            // the mouse is released from the scrollbar. However, it does fire a pointermove event with buttons: 0, so
            // we capture that here and ensure the touch end process is completed.
            if (mousePointerType && e.browserEvent.pointerType === mousePointerType && e.buttons === 0) {
                e.type = Ext.dom.Element.prototype.eventMap.touchend;
                e.button = 0;
                me.onTouchEnd(e);
                return;
            }
            me.updateTouches(e);
            if (e.changedTouches.length > 0) {
                me.invokeRecognizers('onTouchMove', e);
            }
        }
    },

    // This method serves as the handler for both "end" and "cancel" events.  This is
    // because they are handled identically with the exception of the recognizer method
    // that is called.
    onTouchEnd: function(e) {
        var me = this;

        if (!me.isStarted) {
            return;
        }

        me.updateTouches(e, true);

        me.invokeRecognizers(me.isCancelEvent[e.type] ? 'onTouchCancel' : 'onTouchEnd', e);

        if (!me.activeTouches.length) {
            // no more active touches - invoke onEnd to indicate the end of the gesture
            me.isStarted = false;
            me.invokeRecognizers('onEnd', e);

            // Gesture is finished, safe to resume garbage collection so that any target
            // elements destroyed while gesture was in progress can be collected
            if (Ext.enableGarbageCollector) {
                Ext.dom.GarbageCollector.resume();
            }
        }
    },

    onTargetTouchMove: function(e) {
        if (Ext.elevateFunction) {
            // using [e] is faster than using arguments in most browsers
            // http://jsperf.com/passing-arguments
            Ext.elevateFunction(this.doTargetTouchMove, this, [e]);
        } else {
            this.doTargetTouchMove(e);
        }
    },

    doTargetTouchMove: function(e) {
        // handle touchmove if the target el was removed from dom mid-gesture.
        // see onTouchStart/onTargetTouchEnd for further explanation
        if (!Ext.getBody().contains(e.target)) {
            this.onTouchMove(new Ext.event.Event(e));
        }
    },

    onTargetTouchEnd: function(e) {
        if (Ext.elevateFunction) {
            // using [e] is faster than using arguments in most browsers
            // http://jsperf.com/passing-arguments
            Ext.elevateFunction(this.doTargetTouchEnd, this, [e]);
        } else {
            this.doTargetTouchEnd(e);
        }
    },

    doTargetTouchEnd: function(e) {
        var me = this,
            target = e.target;

        target.removeEventListener('touchmove', me.onTargetTouchMove);
        target.removeEventListener('touchend', me.onTargetTouchEnd);
        target.removeEventListener('touchcancel', me.onTargetTouchEnd);

        // if the target el was removed from the dom mid-gesture, then the touchend event,
        // when it occurs, will not be handled because it will not bubble to the top of
        // the dom. This is because the "target" of the touchend is the removed element.
        // If this is the case, go ahead and trigger touchend handling now.
        // Detect whether the target was removed from the DOM mid gesture by using Element.contains.
        // Originally we attempted to detect this by listening for the DOMNodeRemovedFromDocument
        // event, and setting a flag on the element when it was removed, however that
        // approach only works when the element is removed using removedChild, and fails
        // if the element is removed because some ancestor had innerHTML assigned.
        // note: this handling is applicable for actual touchend events, pointer and mouse
        // events will fire on whatever element is under the cursor/pointer after the
        // original target has been removed.
        if (!Ext.getBody().contains(target)) {
            me.onTouchEnd(new Ext.event.Event(e));
        }
    },

    updateAsync: function(async) {
        this.handlers = async ? this._asyncHandlers : this._handlers;
    },

    /**
     * Resets the internal state of the Gesture publisher and all of its recognizers.
     * Applications will not typically need to use this method, but it is useful for
     * Unit-testing situations where a clean slate is required for each test.
     *
     * Calling this method will also reset the state of Ext.event.publisher.Dom
     */
    reset: function() {
        var me = this,
            recognizers = me.recognizers,
            ln = recognizers.length,
            i, recognizer;

        me.activeTouchesMap = {};
        me.activeTouches = [];
        me.changedTouches = [];
        me.isStarted = false;

        for (i = 0; i < ln; i++) {
            recognizer = recognizers[i];
            recognizer.reset();
            recognizer.isActive = false;
        }

        this.callParent();
    }
}, function(Gesture) {
    Gesture.instance = new Gesture();
});
