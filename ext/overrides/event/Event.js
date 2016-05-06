/** */
Ext.define('Ext.overrides.event.Event', {
    override: 'Ext.event.Event',

    // map of events that should fire global mousedown even if stopped
    mousedownEvents: {
        mousedown: 1,
        pointerdown: 1,
        touchstart: 1
    },

    /**
     * @method injectEvent
     * @member Ext.event.Event
     * Injects a DOM event using the data in this object and (optionally) a new target.
     * This is a low-level technique and not likely to be used by application code. The
     * currently supported event types are:
     * <p><b>HTMLEvents</b></p>
     * <ul>
     * <li>load</li>
     * <li>unload</li>
     * <li>select</li>
     * <li>change</li>
     * <li>submit</li>
     * <li>reset</li>
     * <li>resize</li>
     * <li>scroll</li>
     * </ul>
     * <p><b>MouseEvents</b></p>
     * <ul>
     * <li>click</li>
     * <li>dblclick</li>
     * <li>mousedown</li>
     * <li>mouseup</li>
     * <li>mouseover</li>
     * <li>mousemove</li>
     * <li>mouseout</li>
     * </ul>
     * <p><b>UIEvents</b></p>
     * <ul>
     * <li>focusin</li>
     * <li>focusout</li>
     * <li>activate</li>
     * <li>focus</li>
     * <li>blur</li>
     * </ul>
     * @param {Ext.Element/HTMLElement} target (optional) If specified, the target for the event. This
     * is likely to be used when relaying a DOM event. If not specified, {@link #getTarget}
     * is used to determine the target.
     */
    injectEvent: (function () {
        var API,
            dispatchers = {}, // keyed by event type (e.g., 'mousedown')
            crazyIEButtons;

        // Good reference: http://developer.yahoo.com/yui/docs/UserAction.js.html

        // IE9 has createEvent, but this code causes major problems with htmleditor (it
        // blocks all mouse events and maybe more). TODO

        if (!Ext.isIE9m && document.createEvent) { // if (DOM compliant)
            API = {
                createHtmlEvent: function (doc, type, bubbles, cancelable) {
                    var event = doc.createEvent('HTMLEvents');

                    event.initEvent(type, bubbles, cancelable);
                    return event;
                },

                createMouseEvent: function (doc, type, bubbles, cancelable, detail,
                                            clientX, clientY, ctrlKey, altKey, shiftKey, metaKey,
                                            button, relatedTarget) {
                    var event = doc.createEvent('MouseEvents'),
                        view = doc.defaultView || window;

                    if (event.initMouseEvent) {
                        event.initMouseEvent(type, bubbles, cancelable, view, detail,
                                    clientX, clientY, clientX, clientY, ctrlKey, altKey,
                                    shiftKey, metaKey, button, relatedTarget);
                    } else { // old Safari
                        event = doc.createEvent('UIEvents');
                        event.initEvent(type, bubbles, cancelable);
                        event.view = view;
                        event.detail = detail;
                        event.screenX = clientX;
                        event.screenY = clientY;
                        event.clientX = clientX;
                        event.clientY = clientY;
                        event.ctrlKey = ctrlKey;
                        event.altKey = altKey;
                        event.metaKey = metaKey;
                        event.shiftKey = shiftKey;
                        event.button = button;
                        event.relatedTarget = relatedTarget;
                    }

                    return event;
                },

                createUIEvent: function (doc, type, bubbles, cancelable, detail) {
                    var event = doc.createEvent('UIEvents'),
                        view = doc.defaultView || window;

                    event.initUIEvent(type, bubbles, cancelable, view, detail);
                    return event;
                },

                fireEvent: function (target, type, event) {
                    target.dispatchEvent(event);
                }
            };
        } else if (document.createEventObject) { // else if (IE)
            crazyIEButtons = { 0: 1, 1: 4, 2: 2 };

            API = {
                createHtmlEvent: function (doc, type, bubbles, cancelable) {
                    var event = doc.createEventObject();
                    event.bubbles = bubbles;
                    event.cancelable = cancelable;
                    return event;
                },

                createMouseEvent: function (doc, type, bubbles, cancelable, detail,
                                            clientX, clientY, ctrlKey, altKey, shiftKey, metaKey,
                                            button, relatedTarget) {
                    var event = doc.createEventObject();
                    event.bubbles = bubbles;
                    event.cancelable = cancelable;
                    event.detail = detail;
                    event.screenX = clientX;
                    event.screenY = clientY;
                    event.clientX = clientX;
                    event.clientY = clientY;
                    event.ctrlKey = ctrlKey;
                    event.altKey = altKey;
                    event.shiftKey = shiftKey;
                    event.metaKey = metaKey;
                    event.button = crazyIEButtons[button] || button;
                    event.relatedTarget = relatedTarget; // cannot assign to/fromElement
                    return event;
                },

                createUIEvent: function (doc, type, bubbles, cancelable, detail) {
                    var event = doc.createEventObject();
                    event.bubbles = bubbles;
                    event.cancelable = cancelable;
                    return event;
                },

                fireEvent: function (target, type, event) {
                    target.fireEvent('on' + type, event);
                }
            };
        }

        //----------------
        // HTMLEvents

        Ext.Object.each({
                load:   [false, false],
                unload: [false, false],
                select: [true, false],
                change: [true, false],
                submit: [true, true],
                reset:  [true, false],
                resize: [true, false],
                scroll: [true, false]
            },
            function (name, value) {
                var bubbles = value[0], cancelable = value[1];
                dispatchers[name] = function (targetEl, srcEvent) {
                    var e = API.createHtmlEvent(name, bubbles, cancelable);
                    API.fireEvent(targetEl, name, e);
                };
            });

        //----------------
        // MouseEvents

        function createMouseEventDispatcher (type, detail) {
            var cancelable = (type !== 'mousemove');
            return function (targetEl, srcEvent) {
                var xy = srcEvent.getXY(),
                    e = API.createMouseEvent(targetEl.ownerDocument, type, true, cancelable,
                                detail, xy[0], xy[1], srcEvent.ctrlKey, srcEvent.altKey,
                                srcEvent.shiftKey, srcEvent.metaKey, srcEvent.button,
                                srcEvent.relatedTarget);
                API.fireEvent(targetEl, type, e);
            };
        }

        Ext.each(['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout'],
            function (eventName) {
                dispatchers[eventName] = createMouseEventDispatcher(eventName, 1);
            });

        //----------------
        // UIEvents

        Ext.Object.each({
                focusin:  [true, false],
                focusout: [true, false],
                activate: [true, true],
                focus:    [false, false],
                blur:     [false, false]
            },
            function (name, value) {
                var bubbles = value[0], cancelable = value[1];
                dispatchers[name] = function (targetEl, srcEvent) {
                    var e = API.createUIEvent(targetEl.ownerDocument, name, bubbles, cancelable, 1);
                    API.fireEvent(targetEl, name, e);
                };
            });

        //---------
        if (!API) {
            // not even sure what ancient browsers fall into this category...

            dispatchers = {}; // never mind all those we just built :P

            API = {};
        }

        function cannotInject (target, srcEvent) {
            //<debug>
            // TODO log something
            //</debug>
        }

        return function (target) {
            var me = this,
                dispatcher = dispatchers[me.type] || cannotInject,
                t = target ? (target.dom || target) : me.getTarget();

            dispatcher(t, me);
        };
    }()), // call to produce method

    preventDefault: function() {
        var me = this,
            event = me.browserEvent,
            parentEvent = me.parentEvent,
            unselectable, target;


        // This check is for IE8/9. The event object may have been
        // invalidated, so we can't delve into the details of it. If so,
        // just fall out gracefully and don't attempt to do anything.
        if (typeof event.type !== 'unknown') {
            me.defaultPrevented = true;

            // if the event was created by prototype-chaining a new object to an existing event
            // instance, we need to make sure the parent event is defaultPrevented as well.
            if (parentEvent) {
                parentEvent.defaultPrevented = true;
            }

            if (event.preventDefault) {
                event.preventDefault();
            } else {
                // The purpose of the code below is for preventDefault to stop focus from
                // occurring like it does in other modern browsers. This only happens in
                // IE8/9 when using attachEvent. The use of unselectable seems the most reliable
                // way to prevent this from happening. We need to use a timeout to restore the
                // unselectable state because if we don't setting it has no effect. It's important
                // to set the atrribute to 'on' as opposed to just setting the property on the DOM element.
                // See the link below for a discussion on the issue:
                // http://bugs.jquery.com/ticket/10345
                if (event.type === 'mousedown') {
                    target = event.target;
                    unselectable = target.getAttribute('unselectable');
                    if (unselectable !== 'on') {
                        target.setAttribute('unselectable', 'on');
                        Ext.defer(function() {
                            target.setAttribute('unselectable', unselectable);
                        }, 1);
                    }
                }
                // IE9 and earlier do not support preventDefault
                event.returnValue = false;
                // Some keys events require setting the keyCode to -1 to be prevented
                // all ctrl + X and F1 -> F12
                if (event.ctrlKey || event.keyCode > 111 && event.keyCode < 124) {
                    event.keyCode = -1;
                }
            }
        }

        return me;
    },

    stopPropagation: function() {
        var me = this,
            event = me.browserEvent;

        // This check is for IE8/9. The event object may have been
        // invalidated, so we can't delve into the details of it. If so,
        // just fall out gracefully and don't attempt to do anything.
        if (typeof event.type !== 'unknown') {
            if (me.mousedownEvents[me.type]) {
                // Fire the "unstoppable" global mousedown event
                // (used for menu hiding, etc)
                Ext.GlobalEvents.fireMouseDown(me);
            }
            me.callParent();
        }
        return me;
    },

    deprecated: {
        '5.0': {
            methods: {
                /**
                 * @method clone
                 * @member Ext.event.Event
                 * Clones this event.
                 * @return {Ext.event.Event} The cloned copy
                 * @deprecated 5.0.0
                 */
                clone: function() {
                    return new this.self(this.browserEvent, this);
                }
            }
        }
    }
}, function() {
    var Event = this,
        btnMap,
        onKeyDown = function(e) {
            if (e.keyCode === 9) {
                Event.forwardTab = !e.shiftKey;
            }
        },
        onKeyUp = function(e) {
            if (e.keyCode === 9) {
                delete Event.forwardTab;
            }
        };

//<feature legacyBrowser>
    if (Ext.isIE9m) {
        btnMap = {
            0: 0,
            1: 0,
            4: 1,
            2: 2
        };

        Event.override({
            statics: {
                /**
                 * @member Ext.event.Event
                 * When events are attached using IE's attachEvent API instead of
                 * addEventListener accessing any members of an event object asynchronously
                 * results in "Member not found" error.  To work around this we fabricate
                 * our own event object by copying all of its members to a new object.
                 * @param {Event} browserEvent The native browser event object
                 * @private
                 * @static
                 */
                enableIEAsync: function(browserEvent) {
                    var name,
                        fakeEvent = {};

                    for (name in browserEvent) {
                        fakeEvent[name] = browserEvent[name];
                    }

                    return fakeEvent;
                }
            },

            constructor: function(event, info, touchesMap, identifiers) {
                var me = this;
                me.callParent([event, info, touchesMap, identifiers]);
                me.button = btnMap[event.button];

                if (event.type === 'contextmenu') {
                    me.button = 2; // IE8/9 reports click as 0, so we can at least attempt to infer here
                }   

                // IE8 can throw an error when trying to access properties on a browserEvent
                // object when the event has been buffered or delayed.  Cache them here
                // so we can access them later.
                me.toElement = event.toElement;
                me.fromElement = event.fromElement;
            },

            mouseLeaveRe: /(mouseout|mouseleave)/,
            mouseEnterRe: /(mouseover|mouseenter)/,

            /**
             * @member Ext.event.Event
             * @inheritdoc Ext.event.Event#static-enableIEAsync
             * @private
             */
            enableIEAsync: function(browserEvent) {
                this.browserEvent = this.self.enableIEAsync(browserEvent);
            },

            getRelatedTarget: function(selector, maxDepth, returnEl) {
                var me = this,
                    type, target;

                if (!me.relatedTarget) {
                    type = me.type;
                    if (me.mouseLeaveRe.test(type)) {
                        target = me.toElement;
                    } else if (me.mouseEnterRe.test(type)) {
                        target = me.fromElement;
                    }
                    if (target) {
                        me.relatedTarget = me.self.resolveTextNode(target);
                    }
                }

                return me.callParent([selector, maxDepth, returnEl]);
            }
        });

        // We place these listeners to capture Tab and Shift-Tab key strokes
        // and pass this information in the focus/blur event if it happens
        // between keydown/keyup pair.
        document.attachEvent('onkeydown', onKeyDown);
        document.attachEvent('onkeyup',   onKeyUp);
        
        window.attachEvent('onunload', function() {
            document.detachEvent('onkeydown', onKeyDown);
            document.detachEvent('onkeyup',   onKeyUp);
        });
    }
    else
//</feature>
    if (document.addEventListener) {
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('keyup',   onKeyUp,   true);
    }
});
