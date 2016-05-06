/**
 * @private
 */
Ext.define('Ext.event.publisher.Focus', {
    extend: 'Ext.event.publisher.Dom',

    type: 'focus',

    handledEvents: ['focusenter', 'focusleave'],

    handledDomEvents: ['focusin', 'focusout'],

    doDelegatedEvent: function(e, invokeAfter) {
        var me = this,
            relatedTarget;

        e = me.callParent([e, false]);

        if (e) {
            if (e.type === 'focusout') {
                // If focus is departing to the document, there will be no forthcoming focusin event
                // to trigger a focusleave, to fire a focusleave now.
                if (e.relatedTarget == null) {
                    me.processFocusIn(e, e.target, document.body, invokeAfter);
                }
            }
            else {
                relatedTarget = e.relatedTarget;

                // IE reports relatedTarget as either an inaccessible object which coercively equates to null, or just a blank object in the case of focusing from nowhere.
                // So we can't use a truth test ternary expression to substitute in document.body.
                me.processFocusIn(e, (relatedTarget == null || !relatedTarget.tagName) ? document.body : relatedTarget, e.target, invokeAfter);
            }
        }
    },

    processFocusIn: function(e, fromElement, toElement, invokeAfter) {
        var me = this,
            commonAncestor = Ext.Element.getCommonAncestor(toElement, fromElement, true),
            node, targets = [],
            event;

        // Gather targets for focusleave event from the fromElement to the parentNode (not inclusive)
        for (node = fromElement; node && node !== commonAncestor; node = node.parentNode) {
            targets.push(node);
        }

        // Publish the focusleave event for the bubble hierarchy
        if (targets.length) {
            event = me.createSyntheticEvent('focusleave', e, fromElement, toElement);
            me.publish('focusleave', targets, event);
            targets.length = 0;
            if (event.isStopped) {
                return;
            }
        }

        // Gather targets for focusenter event from the focus targetElement to the parentNode (not inclusive)
        for (node = toElement; node !== commonAncestor; node = node.parentNode) {
            targets.push(node);
        }

        // Publish the focusleave event for the bubble hierarchy
        event = me.createSyntheticEvent('focusenter', e, toElement, fromElement);
        me.publish('focusenter', targets, event);
        if (event.isStopped) {
            return;
        }

        if (invokeAfter) {
            me.afterEvent(e);
        }

        Ext.GlobalEvents.fireEvent('focus', {
            event: event,
            toElement: toElement,
            fromElement: fromElement
        });
    },
    
    createSyntheticEvent: function(eventName, browserEvent, target, relatedTarget) {
        var event = new Ext.event.Event(browserEvent);
    
        event.type = eventName;

        event.relatedTarget = relatedTarget;
        event.target = target;
    
        return event;
    }
},

function(Focus) {
    var focusTimeout;

    // At this point only Firefox does not support focusin/focusout, see this bug:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=687787
    if (!Ext.supports.FocusinFocusoutEvents) {
        // When focusin/focusout are not available we capture focus event instead,
        // and fire both focusenter *and* focusleave in the focus handler.
        this.override({
            handledDomEvents: ['focus', 'blur'],
            
            doDelegatedEvent: function(e, invokeAfter) {
                var me = this;

                e = me.callSuper([e, false]);

                if (e) {
                    clearTimeout(focusTimeout);
                    focusTimeout = 0;
                    if (e.type === 'blur') {
                        var blurredEl = e.target === window ? document.body : e.target;

                        // There might be an upcoming focus event, but if none happens
                        // within 1ms, then we treat this as a focus of the body
                        focusTimeout = setTimeout(function() {
                            focusTimeout = 0;
                            me.processFocusIn(e, blurredEl, document.body, invokeAfter);
                            Focus.previousActiveElement = null;
                        }, 0);
                        if (e.target === window || e.target === document) {
                            Focus.previousActiveElement = null;
                        }
                        else {
                            Focus.previousActiveElement = e.target;
                        }
                    } else {
                        me.processFocusIn(e, Focus.previousActiveElement || document.body, e.target === window ? document.body : e.target, invokeAfter);
                    }
                }
            }
        });
    }

    Focus.instance = new Focus();
});
