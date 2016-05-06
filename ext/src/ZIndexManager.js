/**
 * A class that manages a group of {@link Ext.Component#floating} Components and provides z-order management,
 * and Component activation behavior, including masking below the active (topmost) Component.
 *
 * {@link Ext.Component#floating Floating} Components which are rendered directly into the document (such as
 * {@link Ext.window.Window Window}s) which are {@link Ext.Component#method-show show}n are managed by a
 * {@link Ext.WindowManager global instance}.
 *
 * {@link Ext.Component#floating Floating} Components which are descendants of {@link Ext.Component#floating floating}
 * *Containers* (for example a {@link Ext.view.BoundList BoundList} within an {@link Ext.window.Window Window},
 * or a {@link Ext.menu.Menu Menu}), are managed by a ZIndexManager owned by that floating Container. Therefore
 * ComboBox dropdowns within Windows will have managed z-indices guaranteed to be correct, relative to the Window.
 */
Ext.define('Ext.ZIndexManager', {
    alternateClassName: 'Ext.WindowGroup',

    requires: [
        'Ext.util.SorterCollection',
        'Ext.util.FilterCollection',
        'Ext.GlobalEvents'
    ],

    statics: {
        zBase : 9000,
        activeCounter: 0
    },

    /**
     * @private
     */
    constructor: function(container) {
        var me = this;

        me.id = Ext.id(null, 'zindex-mgr-');

        // The stack is a collection sorted on the incrementing activeCounter ascending, so recently active components
        // sort to the top.
        // The component's alwaysOnTop flag takes priority in the sort order and
        // cause the component to gravitate to the correct end of the stack.
        me.zIndexStack = new Ext.util.Collection({
            sorters: {
                sorterFn: function(comp1, comp2) {
                    var ret = (comp1.alwaysOnTop || 0) - (comp2.alwaysOnTop || 0);
                    if (!ret) {
                       ret = comp1.getActiveCounter() - comp2.getActiveCounter();
                    }
                    return ret;
                }
            },
            filters: {
                filterFn: function(comp) {
                    return comp.isVisible();
                }
            }
        });

        // zIndexStack will call into this class on key lifecycle events if methods exist here.
        // Specifically, we implement onCollectionSort which is called by Component's updaters for activeCounter and alwaysOnTop.
        me.zIndexStack.addObserver(me);
        me.front = null;

        // Listen for global component hiding and showing.
        // onComponentShowHide only reacts if we are managing the component.
        me.globalListeners = Ext.GlobalEvents.on({
            hide: me.onComponentShowHide,
            show: me.onComponentShowHide,
            scope: me,
            destroyable: true
        });

        if (container) {

            // This is the ZIndexManager for an Ext.container.Container, base its zseed on the zIndex of the Container's element
            if (container.isContainer) {
                container.on('resize', me.onContainerResize, me);
                me.zseed = Ext.Number.from(me.rendered ? container.getEl().getStyle('zIndex') : undefined, me.getNextZSeed());
                // The containing element we will be dealing with (eg masking) is the content target
                me.targetEl = container.getTargetEl();
                me.container = container;
            }
            // This is the ZIndexManager for a DOM element
            else {
                Ext.on('resize', me.onContainerResize, me);
                me.zseed = me.getNextZSeed();
                me.targetEl = Ext.get(container);
            }
        }
        // No container passed means we are the global WindowManager. Our target is the doc body.
        // DOM must be ready to collect that ref.
        else {
            me.zseed = me.getNextZSeed();
            Ext.onInternalReady(function() {
                Ext.on('resize', me.onContainerResize, me);
                me.targetEl = Ext.getBody();
            });
        }
    },

    // Required to be an Observer of a Collection
    getId: function() {
        return this.id;
    },

    getNextZSeed: function() {
        return (Ext.ZIndexManager.zBase += 10000);
    },

    setBase: function(baseZIndex) {
        this.zseed = baseZIndex;
        return this.onCollectionSort();
    },

    // @private
    // Called whenever the zIndexStack is sorted.
    // That happens in reaction to the activeCounter time being set, or the alwaysOnTop config being set.
    onCollectionSort: function() {
        var me = this,
            oldFront = me.front,
            zIndex = me.zseed,
            a = me.zIndexStack.getRange(),
            len = a.length,
            i, comp, topModal, topVisible,
            doFocus = false;

        for (i = 0; i < len; i++) {
            comp = a[i];

            // Setting the zIndex of a Component returns the topmost zIndex consumed by
            // that Component.
            // If it's just a plain floating Component such as a BoundList, then the
            // return value is the passed value plus 10, ready for the next item.
            // If a floating *Container* has its zIndex set, it re-orders its managed
            // floating children, starting from that new base, and returns a value 10000 above
            // the highest zIndex which it allocates.
            zIndex = comp.setZIndex(zIndex);

            // Only register a new topmost to activate if we find one that is visible
            // Unfiltered panels with hidden:"true can end up here during an animated hide process
            // When the hidden flag is set, and the ghost show operation kicks the ZIndexManager's sort.
            if (!comp.hidden) {
                topVisible = comp;

                // Track topmost visible modal so we can place the modal mask just below it.
                if (comp.modal) {
                    topModal = comp;
                }
            }
        }

        // Sort resulted in a different component (possibly no component) at the top of the stack
        if (topVisible !== oldFront) {

            // Clear active flag on old front component. Just fires the deactivate event/
            // Do not inform it, if the reason for its deactivation is that it's being destroyed.
            if (oldFront && !oldFront.destroying) {
                oldFront.setActive(false);
            }

            // Only activate topmost *visible* component.
            if (topVisible) {
                // Modals always get focused.
                //
                // New front only gets focused if the oldFront is still visible.
                // If the oldFront is no longer the front because it was hidden,
                // its onHide processing will have handled moving focus out correctly.
                //
                // Focus the new front unless it is configured not to do so on toFront.
                //
                // Make sure the component or its descendants *can* be focused, too.
                doFocus = topVisible.modal || ((!oldFront || oldFront.isVisible()) && ((topVisible.focusOnToFront && !topVisible.preventFocusOnActivate))) &&
                          topVisible.isFocusable(true);
                topVisible.setActive(true, doFocus);
            }
        }

        // Cache the top of the stack
        me.front = topVisible;

        // If we encountered a modal in our reassigment, ensure our modal mask is just below it.
        if (topModal) {
            me.showModalMask(topModal);
        } else {
            me.hideModalMask();
        }
        return zIndex;
    },

    /**
     * @private
     * Called from {@link Ext.util.Floating} updater methods when a config which affects the stack order is
     * updated in a Component.
     *
     * eg {@link Ext.Component#alwaysOnTop alwaysOnTop} or {@link Ext.Component#activeCounter activeCounter}
     */
    onComponentUpdate: function(comp) {
        if (this.zIndexStack.contains(comp)) {
            this.zIndexStack.sort();
        }
    },

    onComponentRender: function(comp) {
        this.zIndexStack.itemChanged(comp, 'hidden');
    },

    /**
     * @private
     * Called when the global hide and show events are fired. If it is one of our components, we must re-sort.
     */
    onComponentShowHide: function(comp) {
        var zIndexStack = this.zIndexStack;

        // If component has hidden, it will be filtered out, so we have to look in Collection's source if it's there.
        if (comp.isFloating() && !this.hidingAll && (zIndexStack.getSource() || zIndexStack).contains(comp)) {
            zIndexStack.itemChanged(comp, 'hidden');
            zIndexStack.sort();
        }
    },

    /**
     * Registers a floating {@link Ext.Component} with this ZIndexManager. This should not
     * need to be called under normal circumstances. Floating Components (such as Windows,
     * BoundLists and Menus) are automatically registered with a
     * {@link Ext.Component#zIndexManager zIndexManager} at render time.
     *
     * Where this may be useful is moving Windows between two ZIndexManagers. For example,
     * to bring the Ext.MessageBox dialog under the same manager as the Desktop's
     * ZIndexManager in the desktop sample app:
     *
     *     MyDesktop.getDesktop().getManager().register(Ext.MessageBox);
     *
     * @param {Ext.Component} comp The Component to register.
     */
    register : function(comp) {
        var me = this;

        if (comp.zIndexManager) {
            comp.zIndexManager.unregister(comp);
        }
        comp.zIndexManager = me;
        if (!comp.rendered) {
            // Checking for rendered as opposed to hide/show is important because
            // it's still possible to render a floating component and have it be visible.
            // Since rendered isn't a global event, we need to react individually on each
            // component and update the state in the collectioh after render.
            comp.on('render', me.onComponentRender, me, {single: true});
        }
        me.zIndexStack.add(comp);
    },

    /**
     * Unregisters a {@link Ext.Component} from this ZIndexManager. This should not
     * need to be called. Components are automatically unregistered upon destruction.
     * See {@link #register}.
     * @param {Ext.Component} comp The Component to unregister.
     */
    unregister : function(comp) {
        var me = this;

        delete comp.zIndexManager;
        comp.un('render', me.onComponentRender, me);
        me.zIndexStack.remove(comp);
        me.onCollectionSort();
    },

    /**
     * Gets a registered Component by id.
     * @param {String/Object} id The id of the Component or a {@link Ext.Component} instance
     * @return {Ext.Component}
     */
    get : function(id) {
        return id.isComponent ? id : this.zIndexStack.get(id);
    },

   /**
     * Brings the specified Component to the front of any other active Components in this ZIndexManager.
     * @param {String/Object} comp The id of the Component or a {@link Ext.Component} instance.
     * @param {Boolean} preventFocus Pass `true` to prevent the component being focused when moved to front.
     * @return {Boolean} True if the component was brought to the front, else false
     * if it was already in front, or another component remains at the front due to configuration (eg
     * {@link Ext.util.Floating#alwaysOnTop}, or if the component was not found.
     */
    bringToFront : function(comp, preventFocus) {
        var me = this,
            zIndexStack = me.zIndexStack,
            oldFront = zIndexStack.last(),
            newFront, preventFocusSetting;
            
        comp = me.get(comp);
        // Refuse to perform this operation if there is an visible alwaysOnTop component
        if (!comp || zIndexStack.find('alwaysOnTop', true)) {
            return false;
        }

        preventFocusSetting = comp.preventFocusOnActivate;

        // The onCollectionSorted reaction to the setting of activeCounter will focus by default.
        // Prevent it if requested.
        comp.preventFocusOnActivate = preventFocus;
        comp.setActiveCounter(++Ext.ZIndexManager.activeCounter);
        comp.preventFocusOnActivate = preventFocusSetting;
        newFront = zIndexStack.last();

        // Return true if the passed component was moved to the front and was not already at the front
        return (newFront === comp && newFront !== oldFront);
    },

    /**
     * Sends the specified Component to the back of other active Components in this ZIndexManager.
     * @param {String/Object} comp The id of the Component or a {@link Ext.Component} instance
     * @return {Ext.Component} The Component
     */
    sendToBack : function(comp) {
        comp = this.get(comp);
        if (comp) {
            comp.setActiveCounter(0);
        }
        return comp || null;
    },

    /**
     * Hides all Components managed by this ZIndexManager.
     */
    hideAll : function() {
        var all = this.zIndexStack.getRange(),
            len = all.length,
            i;

        this.hidingAll = true;
        for (i = 0; i < len; i++) {
            all[i].hide();
        }
        this.hidingAll = false;
    },

    /**
     * @private
     * Temporarily hides all currently visible managed Components. This is for when
     * dragging a Window which may manage a set of floating descendants in its ZIndexManager;
     * they should all be hidden just for the duration of the drag.
     */
    hide: function() {
        var me = this,
            activeElement = Ext.Element.getActiveElement(),
            all = me.tempHidden = me.zIndexStack.getRange(),
            len = all.length,
            i,
            comp;

        // If any of the components contained focus, we must restore it on show.
        me.focusRestoreElement = null;
        for (i = 0; i < len; i++) {
            comp = all[i];
            if (comp.el.contains(activeElement)) {
                me.focusRestoreElement = activeElement;
            }
            comp.el.hide();
            comp.hidden = true;
        }
    },

    /**
     * @private
     * Restores temporarily hidden managed Components to visibility.
     */
    show: function() {
        var me = this,
            i,
            tempHidden = me.tempHidden,
            len = tempHidden ? tempHidden.length : 0,
            comp;

        for (i = 0; i < len; i++) {
            comp = tempHidden[i];
            comp.el.show();
            comp.hidden = false;
            comp.setPosition(comp.x, comp.y);
        }
        me.tempHidden = null;
        if (me.focusRestoreElement) {
            me.focusRestoreElement.focus();
        }
    },

    /**
     * Gets the currently-active Component in this ZIndexManager.
     * @return {Ext.Component} The active Component
     */
    getActive : function() {
        return this.zIndexStack.last();
    },

    /**
     * Returns zero or more Components in this ZIndexManager using the custom search function passed to this method.
     * The function should accept a single {@link Ext.Component} reference as its only argument and should
     * return true if the Component matches the search criteria, otherwise it should return false.
     * @param {Function} fn The search function
     * @param {Object} [scope] The scope (`this` reference) in which the function is executed.
     * Defaults to the Component being tested. That gets passed to the function if not specified.
     * @return {Array} An array of zero or more matching floating components.
     */
    getBy : function(fn, scope) {
        return this.zIndexStack.filterBy(fn, scope).getRange();
    },

    /**
     * Executes the specified function once for every Component in this ZIndexManager, passing each
     * Component as the only parameter. Returning false from the function will stop the iteration.
     * @param {Function} fn The function to execute for each item
     * @param {Object} [scope] The scope (this reference) in which the function
     * is executed. Defaults to the current Component in the iteration.
     */
    each : function(fn, scope) {
        this.zIndexStack.each(fn, scope);
    },

    /**
     * Executes the specified function once for every Component in this ZIndexManager, passing each
     * Component as the only parameter. Returning false from the function will stop the iteration.
     * The components are passed to the function starting at the bottom and proceeding to the top.
     * @param {Function} fn The function to execute for each item
     * @param {Object} scope (optional) The scope (this reference) in which the function
     * is executed. Defaults to the current Component in the iteration.
     */
    eachBottomUp: function (fn, scope) {
        var stack = this.zIndexStack.getRange(),
            i,
            len = stack.length,
            comp;

        for (i = 0; i < len; i++) {
            comp = stack[i];
            if (comp.isComponent && fn.call(scope || comp, comp) === false) {
                return;
            }
        }
    },

    /**
     * Executes the specified function once for every Component in this ZIndexManager, passing each
     * Component as the only parameter. Returning false from the function will stop the iteration.
     * The components are passed to the function starting at the top and proceeding to the bottom.
     * @param {Function} fn The function to execute for each item
     * @param {Object} [scope] The scope (this reference) in which the function
     * is executed. Defaults to the current Component in the iteration.
     */
    eachTopDown: function (fn, scope) {
        var stack = this.zIndexStack.getRange(),
            i,
            comp;

        for (i = stack.length; i-- > 0; ) {
            comp = stack[i];
            if (comp.isComponent && fn.call(scope || comp, comp) === false) {
                return;
            }
        }
    },

    destroy: function() {
        var me   = this,
            stack = me.zIndexStack.getRange(),
            len = stack.length,
            i;

        for (i = 0; i < len; i++) {
            Ext.destroy(stack[i]);
        }

        Ext.destroy(me.mask, me.maskShim, me.zIndexStack, me.globalListeners);
        me.zIndexStack = me.container = me.targetEl = me.globalListeners = null;
    },

    privates: {
        getMaskBox: function() {
            var maskTarget = this.mask.maskTarget;

            if (maskTarget.dom === document.body) {
                // If we're masking the body, subtract the border/padding so we don't cause scrollbar.
                return {
                    height: Math.max(document.body.scrollHeight, Ext.dom.Element.getDocumentHeight()),
                    width: Math.max(document.body.scrollWidth, document.documentElement.clientWidth),
                    x: 0,
                    y: 0
                };
            } else {
                return maskTarget.getBox();
            } 
        },

        hideModalMask: function() {
            var mask = this.mask,
                maskShim = this.maskShim,
                maskTarget, tabbableAttr;

            if (mask && mask.isVisible()) {
                maskTarget = mask.maskTarget;
                tabbableAttr = 'data-savedtabindex-' + maskTarget.getId();
                maskTarget.restoreChildrenTabbableState(tabbableAttr);
                maskTarget.restoreTabbableState(tabbableAttr);
                
                mask.maskTarget = undefined;
                mask.hide();
                if (maskShim) {
                    maskShim.hide();
                }
            }
        },

        onContainerResize: function() {
            var me = this,
                mask = me.mask,
                maskShim = me.maskShim,
                viewSize;

            if (mask && mask.isVisible()) {

                // At the new container size, the mask might be *causing* the scrollbar, so to find the valid
                // client size to mask, we must temporarily unmask the parent node.
                mask.hide();
                if (maskShim) {
                    maskShim.hide();
                }

                viewSize = me.getMaskBox();
                if (maskShim) {
                    maskShim.setSize(viewSize);
                    maskShim.show();
                }
                mask.setSize(viewSize);
                mask.show();
            }
        },

        onMaskClick: function() {
            if (this.front) {
                this.front.focus();
            }
        },

        showModalMask: function(comp) {
            var me = this,
                compEl = comp.el,
                zIndex = compEl.getStyle('zIndex') - 4,
                maskTarget = comp.floatParent ? comp.floatParent.getTargetEl() : comp.container,
                mask = me.mask,
                shim = me.maskShim,
                viewSize, tabbableAttr, tempTabbableAttr, tabbables;

            if (!mask) {
                // Create the mask at zero size so that it does not affect upcoming target measurements.
                me.mask = mask = Ext.getBody().createChild({
                    //<debug>
                    // tell the spec runner to ignore this element when checking if the dom is clean 
                    'data-sticky': true,
                    //</debug>
                    role: 'presentation',
                    cls: Ext.baseCSSPrefix + 'mask ' + Ext.baseCSSPrefix + 'border-box',
                    style: 'height:0;width:0'
                });
                mask.setVisibilityMode(Ext.Element.DISPLAY);
                mask.on('click', me.onMaskClick, me);
            } else {
                // If the mask is already shown, hide it before showing again
                // to ensure underlying elements' tabbability is restored
                me.hideModalMask();
            }

            mask.maskTarget = maskTarget;
            viewSize = me.getMaskBox();

            if (shim) {
                shim.setStyle('zIndex', zIndex);
                shim.show();
                shim.setBox(viewSize);
            }
            mask.setStyle('zIndex', zIndex);
            
            tabbableAttr = 'data-savedtabindex-' + maskTarget.getId();
            tempTabbableAttr = tabbableAttr + '-temp';
            
            // Since there is no fast and reliable way of finding elements above or below
            // a given z-index, we just cheat and prevent tabbable elements within the
            // topmost component from being made untabbable.
            tabbables = compEl.findTabbableElements();
            
            if (tabbables.length) {
                compEl.saveTabbableState(tempTabbableAttr);
                compEl.saveChildrenTabbableState(tempTabbableAttr);
            }
            
            maskTarget.saveTabbableState(tabbableAttr);
            maskTarget.saveChildrenTabbableState(tabbableAttr);
            
            // Now restore the tabbables within the component itself. We don't have to
            // repeat this when the mask is hidden.
            if (tabbables.length) {
                compEl.restoreChildrenTabbableState(tempTabbableAttr);
                compEl.restoreTabbableState(tempTabbableAttr);
            }

            mask.show();
            mask.setBox(viewSize);
        }    
    }
}, function() {
    /**
     * @class Ext.WindowManager
     * @extends Ext.ZIndexManager
     *
     * The default global floating Component group that is available automatically.
     *
     * This manages instances of floating Components which were rendered programatically without
     * being added to a {@link Ext.container.Container Container}, and for floating Components
     * which were added into non-floating Containers.
     * 
     * *Floating* Containers create their own instance of ZIndexManager, and floating Components
     * added at any depth below there are managed by that ZIndexManager.
     *
     * @singleton
     */
    Ext.WindowManager = Ext.WindowMgr = new this();
});
