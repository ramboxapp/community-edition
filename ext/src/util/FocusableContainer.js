/**
 * A mixin for groups of Focusable things (Components, Widgets, etc) that
 * should respond to arrow keys to navigate among the peers, but keep only
 * one of the peers focusable by default (tabIndex=0)
 *
 * Some examples: Toolbars, Radio groups, Tab bars
 */

Ext.define('Ext.util.FocusableContainer', {
    extend: 'Ext.Mixin',
    
    requires: [
        'Ext.util.KeyNav'
    ],
    
    mixinConfig: {
        id: 'focusablecontainer',
        
        before: {
            onAdd: 'onFocusableChildAdd',
            onRemove: 'onFocusableChildRemove',
            destroy: 'destroyFocusableContainer',
            onFocusEnter: 'onFocusEnter'
        },
        
        after: {
            afterRender: 'initFocusableContainer',
            onFocusLeave: 'onFocusLeave'
        }
    },
    
    isFocusableContainer: true,
    
    /**
     * @cfg {Boolean} [enableFocusableContainer=true] Enable or disable
     * navigation with arrow keys for this FocusableContainer. This option may
     * be useful with nested FocusableContainers such as Grid column headers,
     * when only the root container should handle keyboard events.
     */
    enableFocusableContainer: true,
    
    /**
     * @cfg {Number} [activeChildTabIndex=0] DOM tabIndex attribute to set on the
     * active Focusable child of this container when using the "Roaming tabindex"
     * technique. Set this value to > 0 to precisely control the tabbing order
     * of the components/containers on the page.
     */
    activeChildTabIndex: 0,
    
    /**
     * @cfg {Number} [inactiveChildTabIndex=-1] DOM tabIndex attribute to set on
     * inactive Focusable children of this container when using the "Roaming tabindex"
     * technique. This value rarely needs to be changed from its default.
     */
    inactiveChildTabIndex: -1,
    
    privates: {
        initFocusableContainer: function() {
            // Allow nested containers to optionally disable
            // children containers' behavior
            if (this.enableFocusableContainer) {
                this.doInitFocusableContainer();
            }
        },
        
        doInitFocusableContainer: function() {
            var me = this,
                el;
        
            el = me.getFocusableContainerEl();
        
            // We set tabIndex on the focusable container el so that the user
            // could tab into it; we catch its focus event and focus a child instead
            me.activateFocusableContainerEl(el);
        
            me.mon(el, 'mousedown', me.onFocusableContainerMousedown, me);
        
            me.focusableKeyNav = me.createFocusableContainerKeyNav(el);
        },
        
        createFocusableContainerKeyNav: function(el) {
            var me = this;
            
            return new Ext.util.KeyNav(el, {
                ignoreInputFields: true,
                scope: me,

                tab: me.onFocusableContainerTabKey,
                enter: me.onFocusableContainerEnterKey,
                space: me.onFocusableContainerSpaceKey,
                up: me.onFocusableContainerUpKey,
                down: me.onFocusableContainerDownKey,
                left: me.onFocusableContainerLeftKey,
                right: me.onFocusableContainerRightKey
            });
        },
        
        destroyFocusableContainer: function() {
            if (this.enableFocusableContainer) {
                this.doDestroyFocusableContainer();
            }
        },
    
        doDestroyFocusableContainer: function() {
            var keyNav = this.focusableKeyNav;
        
            if (keyNav) {
                keyNav.destroy();
                delete this.focusableKeyNav;
            }
        },
        
        // Default FocusableContainer implies a flat list of focusable children
        getFocusables: function() {
            return this.items.items;
        },

        initDefaultFocusable: function(beforeRender) {
            var me = this,
                activeIndex = me.activeChildTabIndex,
                haveFocusable = false,
                items, item, i, len, tabIdx;

            items = me.getFocusables();
            len   = items.length;

            if (!len) {
                return;
            }

            // Check if any child Focusable is already active.
            // Note that we're not determining *which* focusable child
            // to focus here, only that we have some focusables.
            for (i = 0; i < len; i++) {
                item = items[i];

                if (item.focusable) {
                    haveFocusable = true;
                    tabIdx = item.getTabIndex();

                    if (tabIdx != null && tabIdx >= activeIndex) {
                        return item;
                    }
                }
            }

            // No interactive children found, no point in going further
            if (!haveFocusable) {
                return;
            }

            // No child is focusable by default, so the first *interactive*
            // one gets initial childTabIndex. We are not looking for a focusable
            // child here because it may not be focusable yet if this happens
            // before rendering; we assume that an interactive child will become
            // focusable later and now activateFocusable() will just assign it
            // the respective tabIndex.
            item = me.findNextFocusableChild(null, true, items, beforeRender);

            if (item) {
                me.activateFocusable(item);
            }

            return item;
        },

        clearFocusables: function() {
            var me = this,
                items = me.getFocusables(),
                len = items.length,
                item, i;

            for (i = 0; i < len; i++) {
                item = items[i];

                if (item.focusable) {
                    me.deactivateFocusable(item);
                }
            }
        },

        activateFocusable: function(child, /* optional */ newTabIndex) {
            var activeIndex = newTabIndex != null ? newTabIndex : this.activeChildTabIndex;

            child.setTabIndex(activeIndex);
        },

        deactivateFocusable: function(child, /* optional */ newTabIndex) {
            var inactiveIndex = newTabIndex != null ? newTabIndex : this.inactiveChildTabIndex;

            child.setTabIndex(inactiveIndex);
        },

        onFocusableContainerTabKey: function() {
            return true;
        },

        onFocusableContainerEnterKey: function() {
            return true;
        },

        onFocusableContainerSpaceKey: function() {
            return true;
        },

        onFocusableContainerUpKey: function(e) {
            return this.moveChildFocus(e, false);
        },
        
        onFocusableContainerLeftKey: function(e) {
            return this.moveChildFocus(e, false);
        },
        
        onFocusableContainerRightKey: function(e) {
            return this.moveChildFocus(e, true);
        },
        
        onFocusableContainerDownKey: function(e) {
            return this.moveChildFocus(e, true);
        },
        
        getFocusableFromEvent: function(e) {
            var child = Ext.Component.fromElement(e.getTarget());
        
            //<debug>
            if (!child) {
                Ext.Error.raise("No focusable child found for keyboard event!");
            }
            //</debug>
            
            return child;
        },
        
        moveChildFocus: function(e, forward) {
            var child = this.getFocusableFromEvent(e);
            
            return this.focusChild(child, forward, e);
        },
    
        focusChild: function(child, forward) {
            var nextChild = this.findNextFocusableChild(child, forward);
        
            if (nextChild) {
                nextChild.focus();
            }
        
            return nextChild;
        },
        
        findNextFocusableChild: function(child, step, items, beforeRender) {
            var item, idx, i, len;
        
            items = items || this.getFocusables();
            
            // If the child is null or undefined, idx will be -1.
            // The loop below will account for that, trying to find
            // the first focusable child from either end (depending on step)
            idx = Ext.Array.indexOf(items, child);
            
            // It's often easier to pass a boolean for 1/-1
            step = step === true ? 1 : step === false ? -1 : step;
        
            len = items.length;
            i   = step > 0 ? (idx < len ? idx + step : 0) : (idx > 0 ? idx + step : len - 1);
        
            for (;; i += step) {
                // We're looking for the first or last focusable child
                // and we've reached the end of the items, so punt
                if (idx < 0 && (i >= len || i < 0)) {
                    return null;
                }
                
                // Loop over forward
                else if (i >= len) {
                    i = -1; // Iterator will increase it once more
                    continue;
                }
                
                // Loop over backward
                else if (i < 0) {
                    i = len;
                    continue;
                }
                
                // Looped to the same item, give up
                else if (i === idx) {
                    return null;
                }
                
                item = items[i];
                
                if (!item || !item.focusable) {
                    continue;
                }
                
                // This loop can be run either at FocusableContainer init time,
                // or later when we need to navigate upon pressing an arrow key.
                // When we're navigating, we have to know exactly if the child is
                // focusable or not, hence only rendered children will make the cut.
                // At the init time item.isFocusable() may return false incorrectly
                // just because the item has not been rendered yet and its focusEl
                // is not defined, so we don't bother to call isFocus and return
                // the first potentially focusable child.
                if (beforeRender || (item.isFocusable && item.isFocusable())) {
                    return item;
                }
            }
        
            return null;
        },
    
        getFocusableContainerEl: function() {
            return this.el;
        },
        
        onFocusableChildAdd: function(child) {
            return this.doFocusableChildAdd(child);
        },
        
        activateFocusableContainerEl: function(el) {
            el = el || this.getFocusableContainerEl();
        
            el.set({ tabindex: this.activeChildTabIndex });
        },
        
        deactivateFocusableContainerEl: function(el) {
            el = el || this.getFocusableContainerEl();
        
            el.set({ tabindex: this.inactiveChildTabIndex });
        },
        
        doFocusableChildAdd: function(child) {
            if (child.focusable) {
                child.focusableContainer = this;
                this.deactivateFocusable(child);
            }
        },
        
        onFocusableChildRemove: function(child) {
            return this.doFocusableChildRemove(child);
        },
    
        doFocusableChildRemove: function(child) {
            // If the focused child is being removed, we deactivate the FocusableContainer
            // So that it returns to the tabbing order.
            // For example, locking a grid column must return the owning HeaderContainer to tabbability
            if (child === this.lastFocusedChild) {
                this.lastFocusedChild = null;
                this.activateFocusableContainerEl();
            }
            delete child.focusableContainer;
        },
        
        onFocusableContainerMousedown: function(e, target) {
            var targetCmp = Ext.Component.fromElement(target);
            
            // Capture the timestamp for the mousedown. If we're navigating into the container itself
            // via the mouse we don't want to default focus the first child like we would when using
            // the keyboard. By the time we get to the focusenter handling, we don't know what has caused
            // the focus to be triggered, so if the timestamp falls within some small epsilon, the focus enter
            // has been caused via the mouse and we can react accordingly.
            this.mousedownTimestamp = targetCmp === this ? Ext.Date.now() : 0;
        },

        onFocusEnter: function(e) {
            var me = this,
                target = e.toComponent,
                mousedownTimestamp = me.mousedownTimestamp,
                epsilon = 50,
                child;
            
            me.mousedownTimestamp = 0;
            if (target === me) {
                if (!mousedownTimestamp || Ext.Date.now() - mousedownTimestamp > epsilon) {
                    child = me.initDefaultFocusable();

                    if (child) {
                        me.deactivateFocusableContainerEl();
                        child.focus();
                    }
                }
            } else {
                me.deactivateFocusableContainerEl();
            }
            
            return target;
        },

        onFocusLeave: function(e) {
            var me = this,
                lastFocused = me.lastFocusedChild;

            if (!me.isDestroyed) {
                me.clearFocusables();

                if (lastFocused) {
                    me.activateFocusable(lastFocused);
                }
                else {
                    me.activateFocusableContainerEl();
                }
            }
        },
        
        beforeFocusableChildBlur: Ext.privateFn,
        afterFocusableChildBlur: Ext.privateFn,
    
        beforeFocusableChildFocus: function(child) {
            var me = this;
            
            me.clearFocusables();
            me.activateFocusable(child);
            
            if (child.needArrowKeys) {
                me.guardFocusableChild(child);
            }
        },
        
        guardFocusableChild: function(child) {
            var me = this,
                index = me.activeChildTabIndex,
                guard;
            
            guard = me.findNextFocusableChild(child, -1);
            
            if (guard) {
                guard.setTabIndex(index);
            }
            
            guard = me.findNextFocusableChild(child, 1);
            
            if (guard) {
                guard.setTabIndex(index);
            }
        },
    
        afterFocusableChildFocus: function(child) {
            this.lastFocusedChild = child;
        },
        
        // TODO
        onFocusableChildShow: Ext.privateFn,
        onFocusableChildHide: Ext.privateFn,
        onFocusableChildEnable: Ext.privateFn,
        onFocusableChildDisable: Ext.privateFn,
        onFocusableChildMasked: Ext.privateFn,
        onFocusableChildDestroy: Ext.privateFn,
        onFocusableChildUpdate: Ext.privateFn
    }
});
