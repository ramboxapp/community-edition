/**
 * A mixin for individually focusable things (Components, Widgets, etc)
 */
Ext.define('Ext.util.Focusable', {
    mixinId: 'focusable',

    /**
     * @property {Boolean} hasFocus
     * `true` if this component has focus.
     * @private
     */
    hasFocus: false,
    
    
    /**
     * @property {Boolean} focusable
     *
     * `true` for interactive Components, `false` for static Components.
     * For Containers, this property reflects interactiveness of the
     * Container itself, not its children. See {@link #isFocusable}.
     *
     * **Note:** Plain components are static, so not focusable.
     */
    focusable: false,
    
    /**
     * @cfg {Number} [tabIndex] DOM tabIndex attribute for this Focusable
     */
    
    /**
     * @cfg {String} [focusCls='x-focus'] CSS class that will be added to focused
     * Component, and removed when Component blurs.
     */
    focusCls: 'focus',
    
    /**
     * @event focus
     * Fires when this Component receives focus.
     * @param {Ext.Component} this
     * @param {Ext.event.Event} event The focus event.
     */

    /**
     * @event blur
     * Fires when this Component loses focus.
     * @param {Ext.Component} this
     * @param {Ext.event.Event} event The blur event.
     */
    
    /**
     * Template method to do any Focusable related initialization that
     * does not involve event listeners creation.
     * @protected
     */
    initFocusable: Ext.emptyFn,
    
    /**
     * Template method to do any event listener initialization for a Focusable.
     * This generally happens after the focusEl is available.
     * @protected
     */
    initFocusableEvents: function() {
        // If *not* naturally focusable, then we look for the tabIndex property
        // to be defined which indicates that the element should be made focusable.
        this.initFocusableElement();
    },
    
    /**
     * Returns the focus styling holder element associated with this Focusable.
     * By default it is the same element as {@link #getFocusEl getFocusEl}.
     *
     * @return {Ext.Element} The focus styling element.
     * @protected
     */
    getFocusClsEl: function() {
        return this.getFocusEl();
    },

    /**
     * Returns the focus holder element associated with this Focusable. At the
     * level of the Focusable base, this function returns `this.el` (or for Widgets,
     * `this.element`).
     *
     * Subclasses with embedded focusable elements (such as Window, Field and Button)
     * should override this for use by {@link Ext.util.Focusable#method-focus focus}
     * method.
     *
     * @return {Ext.Element}
     * @protected
     */
    getFocusEl: function () {
        return this.element || this.el;
    },

    destroyFocusable: function() {
        this.focusListeners = Ext.destroy(this.focusListeners);
        delete this.focusTask;
    },

    enableFocusable: Ext.emptyFn,

    disableFocusable: function() {
        var me = this,
            focusTarget,
            focusCls = me.focusCls,
            focusClsEl;

        // If this is disabled while focused, by default, focus would return to document.body.
        // This must be avoided, both for the convenience of keyboard users, and also
        // for when focus is tracked within a tree, such as below an expanded ComboBox.
        if (me.hasFocus) {
            focusTarget = me.findFocusTarget();
            if (focusTarget) {
                focusTarget.focus();
            }
        }
        focusClsEl = me.getFocusClsEl();
        
        if (focusCls && focusClsEl) {
            focusClsEl.removeCls(me.removeClsWithUI(focusCls, true));
        }
    },
    
    /**
     * Determine if this Focusable can receive focus at this time.
     *
     * Note that Containers can be non-focusable themselves while delegating
     * focus treatment to a child Component; see
     * {@link Ext.container.Container #defaultFocus} for more information.
     *
     * @param {Boolean} [deep=false] Optionally determine if the container itself
     * is focusable, or if container's focus is delegated to a child component
     * and that child is focusable.
     *
     * @return {Boolean} True if component is focusable, false if not.
     */
    isFocusable: function(deep) {
        var me = this,
            focusEl;
        
        if (!me.focusable && (!me.isContainer || !deep)) {
            return false;
        }
        
        focusEl = me.getFocusEl();
        
        if (focusEl && me.canFocus()) {

            // getFocusEl might return a Component if a Container wishes to
            // delegate focus to a descendant. Both Component and Element
            // implement isFocusable, so always ask that.
            return focusEl.isFocusable(deep);
        }
        
        return false;
    },
    
    canFocus: function() {
        var me = this;
        
        // Containers may have focusable children while being non-focusable
        // themselves; this is why we only account for me.focusable for
        // ordinary Components here and below.
        return (me.isContainer || me.focusable) && me.rendered &&
               !me.destroying && !me.isDestroyed && !me.disabled &&
               me.isVisible(true);
    },
    
    /**
     * Try to focus this component.
     *
     * If this component is disabled, a close relation will be targeted for focus instead
     * to keep focus localized for keyboard users.
     * @param {Mixed} [selectText] If applicable, `true` to also select all the text in this component, or an array consisting of start and end (defaults to start) position of selection.
     * @param {Boolean/Number} [delay] Delay the focus this number of milliseconds (true for 10 milliseconds).
     * @param {Function} [callback] Only needed if the `delay` parameter is used. A function to call upon focus.
     * @param {Function} [scope] Only needed if the `delay` parameter is used. The scope (`this` reference) in which to execute the callback.
     * @return {Ext.Component} The focused Component. Usually `this` Component. Some Containers may
     * delegate focus to a descendant Component ({@link Ext.window.Window Window}s can do this through their
     * {@link Ext.window.Window#defaultFocus defaultFocus} config option. If this component is disabled, a closely
     * related component will be focused and that will be returned.
     */
    focus: function(selectText, delay, callback, scope) {
        var me = this,
            focusTarget, focusElDom, containerScrollTop;

        if ((!me.focusable && !me.isContainer) || me.isDestroyed || me.destroying) {
            return;
        }

        // If delay is wanted, queue a call to this function.
        if (delay) {
            me.getFocusTask().delay(Ext.isNumber(delay) ? delay : 10, me.focus, me, [selectText, false, callback, scope]);
            return me;
        }

        // An immediate focus call must cancel any outstanding delayed focus calls.
        me.cancelFocus();
        
        // Assignment in conditional here to avoid calling getFocusEl()
        // if me.canFocus() returns false
        if (me.canFocus()) {
            if (focusTarget = me.getFocusEl()) {

                // getFocusEl might return a Component if a Container wishes to delegate focus to a
                // descendant via its defaultFocus configuration.
                if (focusTarget.isComponent) {
                    return focusTarget.focus(selectText, delay, callback, scope);
                }

                focusElDom = focusTarget.dom;

                // If it was an Element with a dom property
                if (focusElDom) {

                    // Not a natural focus holding element, add a tab index to make it
                    // programmatically focusable
                    if (focusTarget.needsTabIndex()) {
                        focusElDom.tabIndex = -1;
                    }

                    if (me.floating) {
                        containerScrollTop = me.container.dom.scrollTop;
                    }

                    // Focus the element.
                    // The Ext.event.publisher.Focus publisher listens for global focus changes and
                    // The ComponentManager responds by invoking the onFocusEnter and onFocusLeave methods
                    // of the components involved.
                    focusTarget.focus();

                    if (selectText) {
                        if (Ext.isArray(selectText)) {
                            if (me.selectText) {
                                me.selectText.apply(me, selectText);
                            }
                        } else if (focusElDom.select) {
                            // This method both focuses and selects the element.
                            focusElDom.select();
                        } else if (me.selectText) {
                            me.selectText();
                        }
                    }

                    // Call the callback when focus is done
                    Ext.callback(callback, scope);
                }

                // Focusing a floating Component brings it to the front of its stack.
                // this is performed by its zIndexManager. Pass preventFocus true to avoid recursion.
                if (me.floating) {
                    // Every component that doesn't have preventFocus set gets a delayed call to focus().
                    // Only bring to front if the current component isn't the manager's topmost component.
                    if (me !== me.zIndexManager.getActive()) {
                        me.toFront(true);
                    }

                    if (containerScrollTop !== undefined) {
                        me.container.dom.scrollTop = containerScrollTop;
                    }
                }
            }
        } else {
            // If we are asked to focus while not able to focus though disablement/invisibility etc,
            // focus may revert to document.body if the current focus is being hidden or destroyed.
            // This must be avoided, both for the convenience of keyboard users, and also
            // for when focus is tracked within a tree, such as below an expanded ComboBox.
            focusTarget = me.findFocusTarget();
            if (focusTarget) {
                return focusTarget.focus(selectText, delay, callback, scope);
            }
        }

        return me;
    },

    /**
     * Cancel any deferred focus on this component
     * @protected
     */
    cancelFocus: function() {
        var task = this.getFocusTask();

        if (task) {
            task.cancel();
        }
    },

    /**
     * Template method to do any pre-blur processing.
     * @protected
     * @param {Ext.event.Event} e The event object
     */
    beforeBlur: Ext.emptyFn,
    
    // private
    onBlur: function(e) {
        var me = this,
            container = me.focusableContainer,
            focusCls = me.focusCls,
            focusClsEl;
        
        if (!me.focusable || me.destroying) {
            return;
        }

        me.beforeBlur(e);
        
        if (container) {
            container.beforeFocusableChildBlur(me, e);
        }
        
        focusClsEl = me.getFocusClsEl();
        
        if (focusCls && focusClsEl) {
            focusClsEl.removeCls(me.removeClsWithUI(focusCls, true));
        }
        
        if (me.validateOnBlur) {
            me.validate();
        }
        
        me.hasFocus = false;
        me.fireEvent('blur', me, e);
        me.postBlur(e);
        
        if (container) {
            container.afterFocusableChildBlur(me, e);
        }
    },

    /**
     * Template method to do any post-blur processing.
     * @protected
     * @param {Ext.event.Event} e The event object
     */
    postBlur: Ext.emptyFn,

    /**
     * Template method to do any pre-focus processing.
     * @protected
     * @param {Ext.event.Event} e The event object
     */
    beforeFocus: Ext.emptyFn,
    
    // private
    onFocus: function(e) {
        var me = this,
            container = me.focusableContainer,
            focusCls = me.focusCls,
            focusClsEl;
        
        if (!me.focusable) {
            return;
        }

        if (me.canFocus()) {
            me.beforeFocus(e);
            
            if (container) {
                container.beforeFocusableChildFocus(me, e);
            }
            
            focusClsEl = me.getFocusClsEl();
            
            if (focusCls && focusClsEl) {
                focusClsEl.addCls(me.addClsWithUI(focusCls, true));
            }
            
            if (!me.hasFocus) {
                me.hasFocus = true;
                me.fireEvent('focus', me, e);
            }
            
            me.postFocus(e);
            
            if (container) {
                container.afterFocusableChildFocus(me, e);
            }
        }
    },
    
    /**
     * Template method to do any post-focus processing.
     * @protected
     * @param {Ext.event.Event} e The event object
     */
    postFocus: Ext.emptyFn,
    
    /**
     * Return the actual tabIndex for this Focusable.
     *
     * @return {Number} tabIndex attribute value
     */
    getTabIndex: function() {
        var me = this,
            el, index;
        
        if (!me.focusable) {
            return;
        }
        
        el = me.getFocusEl();
        
        if (el) {
            // getFocusEl may return a child Component
            if (el.isComponent) {
                index = el.getTabIndex();
            }
            
            // We can't query el.dom.tabIndex because IE8 will return 0
            // when tabIndex attribute is not present.
            else if (el.isElement) {
                index = el.getAttribute(Ext.Element.tabIndexAttributeName);
            }
            
            // A component can be configured with el: '#id' to look up
            // its main element from the DOM rather than render it; in
            // such case getTabIndex() may happen to be called before
            // said lookup has happened; indeterminate result follows.
            else {
                return;
            }
            
            me.tabIndex = index;
        }
        else {
            index = me.tabIndex;
        }
        
        return index - 0; // getAttribute returns a string
    },
    
    /**
     * Set the tabIndex property for this Focusable. If the focusEl
     * is avalable, set tabIndex attribute on it, too.
     *
     * @param {Number} newTabIndex new tabIndex to set
     */
    setTabIndex: function(newTabIndex) {
        var me = this,
            el;
        
        if (!me.focusable) {
            return;
        }
        
        me.tabIndex = newTabIndex;
        el = me.getFocusEl();
        
        if (el) {
            // getFocusEl may return a child Component
            if (el.isComponent) {
                el.setTabIndex(newTabIndex);
            }
            
            // Or if a component is configured with el: '#id', it may
            // still be a string by the time setTabIndex is called from
            // FocusableContainer.
            else if (el.isElement) {
                el.set({ tabindex: newTabIndex });
            }
        }
    },
    
    /**
     * @template
     * @protected
     * Called when focus enters this Component's hierarchy
     * @param {Ext.event.Event} e
     */
    onFocusEnter: function(e) {
        var me = this;

        // Prioritize focusing back to a previous *Component*
        // This more correctly handles the case of a Component becoming
        // unfocusable in some way during the intervening time while this was visible.
        me.previousFocus = e.fromComponent || e.relatedTarget;
        me.containsFocus = true;
        me.fireEvent('focusenter', me, e);
    },

    /**
     * @template
     * @protected
     * Called when focus exits from this Component's hierarchy
     * @param {Ext.event.Event} e
     */
    onFocusLeave: function(e) {
        var me = this;

        me.previousFocus = null;
        me.containsFocus = false;
        me.fireEvent('focusleave', me, e);
    },

    privates: {
        
        /**
         * Returns focus to the cached previously focused Component or element.
         *
         * Usually called by onHide.
         *
         * @private
         */
        revertFocus: function() {
            var me = this,
                focusTarget = me.previousFocus;

            me.previousFocus = null;

            // If this about to be hidden component contains focus...
            //  Before hiding, restore focus to what was focused when we were shown.
            if (focusTarget && me.containsFocus) {

                // If reverting back to a Component, it will re-route to a close focusable relation
                // if it is not now focusable.
                if (focusTarget.isComponent) {
                    focusTarget.focus();
                }
                // Reverting to an element.
                else {
                    focusTarget = Ext.fly(focusTarget);
                    // TODO: Remove extra check when IE8 retires.
                    if (Ext.isIE8 || (focusTarget.isFocusable && focusTarget.isFocusable())) {
                        focusTarget.focus();
                    }
                }
            }
        },

        /**
         * Finds an alternate Component to focus if this Component is disabled while focused, or
         * focused while disabled, or otherwise unable to focus.
         * 
         * In both cases, focus must not be lost to document.body, but must move to an intuitively
         * connectable Component, either a sibling, or uncle or nephew.
         *
         * This is both for the convenience of keyboard users, and also for when focus is tracked
         * within a Component tree such as for ComboBoxes and their dropdowns.
         *
         * For example, a ComboBox with a PagingToolbar in is BoundList. If the "Next Page"
         * button is hit, the LoadMask shows and focuses, the next page is the last page, so
         * the "Next Page" button is disabled. When the LoadMask hides, it attempt to focus the
         * last focused Component which is the disabled "Next Page" button. In this situation,
         * focus should move to a sibling within the PagingToolbar.
         * 
         * @return {Ext.Component} A closely related focusable Component to which focus can move.
         * @private
         */
        findFocusTarget: function() {
            var me = this,
                owner,
                focusTargets;

            for (owner = me.up(':not([disabled])'); owner; owner = owner.up(':not([disabled])')) {
                // Use CQ to find a target that is focusable, and not this Component.
                // Cannot use owner.child() because the parent might not be a Container.
                // Non-Container Components may still have ownership relationships with
                // other Components. eg: BoundList with PagingToolbar
                focusTargets = Ext.ComponentQuery.query(':focusable:not([hasFocus])', owner);
                if (focusTargets.length) {
                    return focusTargets[0];
                }

                // We found no focusable siblings in our owner, but the owner may itself be focusable,
                // it is not always a Container - could be the owning Field of a BoundList.
                if (owner.isFocusable && owner.isFocusable()) {
                    return owner;
                }
            }
        },
    
        /**
         * Sets up the focus listener on this Component's {@link #getFocusEl focusEl} if it has one.
         *
         * Form Components which must implicitly participate in tabbing order usually have a naturally
         * focusable element as their {@link #getFocusEl focusEl}, and it is the DOM event of that
         * receiving focus which drives the Component's `onFocus` handling, and the DOM event of it
         * being blurred which drives the `onBlur` handling.
         * @private
         */
        initFocusableElement: function() {
            var me = this,
                tabIndex = me.tabIndex,
                focusEl = me.getFocusEl(),
                needsTabIndex;

            if (focusEl && !focusEl.isComponent) {
                needsTabIndex = focusEl.needsTabIndex();

                // Add the tabIndex only is it's needed to make it tabbable, or there is a user-configured tabIndex
                if (needsTabIndex || tabIndex != null) {
                    focusEl.dom.setAttribute('tabindex', tabIndex);
                }

                // This attribute is a shortcut to look up a Component by its Elements
                // It only makes sense on focusable elements, so we set it here
                focusEl.dom.setAttribute(Ext.Component.componentIdAttribute, me.id);
            }
        },

        // private
        getFocusTask: function() {
            if (!this.focusTask) {
                this.focusTask = Ext.focusTask;
            }
            
            return this.focusTask;
        },

        // private
        blur: function() {
            var me = this,
                focusEl;
            
            if (!me.focusable || !me.rendered) {
                return;
            }
            
            focusEl = me.getFocusEl();

            if (focusEl) {
                me.blurring = true;
                focusEl.blur();
                delete me.blurring;
            }
            
            return me;
        },
        
        disableTabbing: function() {
            var me = this,
                el = me.el,
                focusEl;
            
            if (!me.focusable) {
                return;
            }
            
            focusEl = me.getFocusEl();
            
            if (el) {
                el.saveChildrenTabbableState();
            }
            
            if (focusEl) {
                focusEl = focusEl.isComponent ? focusEl.getFocusEl() : focusEl;
                focusEl.saveTabbableState();
            }
        },
        
        enableTabbing: function() {
            var me = this,
                el = me.el,
                focusEl;
            
            if (!me.focusable) {
                return;
            }
            
            focusEl = me.getFocusEl();
            
            if (focusEl) {
                focusEl = focusEl.isComponent ? focusEl.getFocusEl() : focusEl;
                focusEl.restoreTabbableState();
            }
            
            if (el) {
                el.restoreChildrenTabbableState();
            }
        }
    }
},

function() {
    // One global DelayedTask to assign focus
    // So that the last focus call wins.
    if (!Ext.focusTask) {
        Ext.focusTask = new Ext.util.DelayedTask();
    }
});
