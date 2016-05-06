/**
 * A modal, floating Component which may be shown above a specified {@link Ext.Component Component} while loading data.
 * When shown, the configured owning Component will be covered with a modality mask, and the LoadMask's {@link #msg} will be
 * displayed centered, accompanied by a spinner image.
 *
 * If the {@link #store} config option is specified, the masking will be automatically shown and then hidden synchronized with
 * the Store's loading process.
 *
 * Because this is a floating Component, its z-index will be managed by the global {@link Ext.WindowManager ZIndexManager}
 * object, and upon show, it will place itsef at the top of the hierarchy.
 *
 * Example usage:
 *
 *     @example
 *     var myPanel = new Ext.panel.Panel({
 *         renderTo : document.body,
 *         height   : 100,
 *         width    : 200,
 *         title    : 'Foo'
 *     });
 *
 *     var myMask = new Ext.LoadMask({
 *         msg    : 'Please wait...',
 *         target : myPanel
 *     });
 *
 *     myMask.show();
 */
Ext.define('Ext.LoadMask', {

    extend: 'Ext.Component',

    alias: 'widget.loadmask',

    /* Begin Definitions */

    mixins: [
        'Ext.util.StoreHolder'
    ],

    uses: ['Ext.data.StoreManager'],

    /* End Definitions */
    
    /**
     * @property {Boolean} isLoadMask
     * `true` in this class to identify an object as an instantiated LoadMask, or subclass thereof.
     */
    isLoadMask: true,

    /**
     * @cfg {Ext.Component} target The Component you wish to mask. The the mask will be automatically sized
     * upon Component resize, and the message box will be kept centered.
     */

    /**
     * @cfg {Ext.data.Store} store
     * Optional Store to which the mask is bound. The mask is displayed when a load request is issued, and
     * hidden on either load success, or load fail.
     */

    //<locale>
    /**
     * @cfg {String} [msg="Loading..."]
     * The text to display in a centered loading message box.
     */
    msg: 'Loading...',
    //</locale>

    msgCls: Ext.baseCSSPrefix + 'mask-loading',

    msgWrapCls: Ext.baseCSSPrefix + 'mask-msg',

    /**
     * @cfg {Boolean} [useMsg=true]
     * Whether or not to use a loading message class or simply mask the bound element.
     */
    useMsg: true,

    /**
     * @cfg {Boolean} [useTargetEl=false]
     * True to mask the {@link Ext.Component#getTargetEl targetEl} of the bound Component. By default,
     * the {@link Ext.Component#getEl el} will be masked.
     */
    useTargetEl: false,

    /**
     * @cfg {Boolean} shim `true` to enable an iframe shim for this LoadMask to keep
     * windowed objects from showing through.
     */

    // @private
    cls: Ext.baseCSSPrefix + 'mask',
    componentCls: Ext.baseCSSPrefix + 'border-box',
    
    ariaRole: 'status',
    focusable: true,
    tabIndex: 0,
    
    autoEl: {
        tag: 'div',
        role: 'status'
    },

    childEls: [
        'msgWrapEl',
        'msgEl',
        'msgTextEl'
    ],

    renderTpl: [
        '<div id="{id}-msgWrapEl" data-ref="msgWrapEl" class="{[values.$comp.msgWrapCls]}">',
            '<div id="{id}-msgEl" data-ref="msgEl" class="{[values.$comp.msgCls]} ',
                Ext.baseCSSPrefix, 'mask-msg-inner {childElCls}">',
                '<div id="{id}-msgTextEl" data-ref="msgTextEl" class="',
                    Ext.baseCSSPrefix, 'mask-msg-text',
                    '{childElCls}">{msg}</div>',
            '</div>',
        '</div>'
    ],

    /**
     * Creates new LoadMask.
     * @param {Object} [config] The config object.
     */
    constructor : function(config) {
        var me = this,
            comp;

        if (arguments.length === 2) {
            //<debug>
            if (Ext.isDefined(Ext.global.console)) {
                Ext.global.console.warn('Ext.LoadMask: LoadMask now uses a standard 1 arg constructor: use the target config');
            }
            //</debug>
            comp = me.target = config;
            config = arguments[1];
        } else {
            comp = config.target;
        }
        
        //<debug>
        if (config.maskCls) {
            Ext.log.warn('Ext.LoadMask property maskCls is deprecated, use msgWrapCls instead');
            config.msgWrapCls = config.msgWrapCls || config.maskCls;
        }
        //</debug>
        
        // Must apply configs early so that renderTo can be calculated correctly.
        me.callParent([config]);

        // Target is a Component
        if (comp.isComponent) {
            me.ownerCt = comp;
            me.hidden = true;

            // Ask the component which element should be masked.
            // Most will not have an answer, in which case this returns the document body
            // Ext.view.Table for example returns the el of its owning Panel.
            me.renderTo = me.getMaskTarget();
            me.external = me.renderTo === Ext.getBody();
            me.bindComponent(comp);
        }
        // Element support to be deprecated
        else {
            //<debug>
            if (Ext.isDefined(Ext.global.console)) {
                Ext.global.console.warn('Ext.LoadMask: LoadMask for elements has been deprecated, use Ext.dom.Element.mask & Ext.dom.Element.unmask');
            }
            //</debug>
            comp = Ext.get(comp);
            me.isElement = true;
            me.renderTo = me.target;
        }
        me.render(me.renderTo);
        if (me.store) {
            me.bindStore(me.store, true);
        }
    },

    initRenderData: function() {
        var result = this.callParent(arguments);
        result.msg = this.msg || '';
        return result;
    },
    
    onRender: function() {
        this.callParent(arguments);
        
        // In versions prior to 5.1, maskEl was rendered outside of the
        // LoadMask's main el and had a reference to it; we keep this
        // reference for backwards compatibility.
        this.maskEl = this.el;
    },

    bindComponent: function(comp) {
        var me = this,
            listeners = {
                scope: this,
                resize: me.sizeMask
            };

        if (me.external) {
            listeners.added = me.onComponentAdded;
            listeners.removed = me.onComponentRemoved;
            if (comp.floating) {
                listeners.move = me.sizeMask;
                me.activeOwner = comp;
            } else if (comp.ownerCt) {
                me.onComponentAdded(comp.ownerCt);
            }
        }

        me.mon(comp, listeners);
        
        // Subscribe to the observer that manages the hierarchy
        // Only needed if we had to be rendered outside of the target
        if (me.external) {
            me.mon(Ext.GlobalEvents, {
                show: me.onContainerShow,
                hide: me.onContainerHide,
                expand: me.onContainerExpand,
                collapse: me.onContainerCollapse,
                scope: me
            });
        }
    },

    onComponentAdded: function(owner) {
        var me = this;
        delete me.activeOwner;
        me.floatParent = owner;
        if (!owner.floating) {
            owner = owner.up('[floating]');
        }
        if (owner) {
            me.activeOwner = owner;
            me.mon(owner, 'move', me.sizeMask, me);
            me.mon(owner, 'tofront', me.onOwnerToFront, me);
        } else {
            me.preventBringToFront = true;
        }
        owner = me.floatParent.ownerCt;
        if (me.rendered && me.isVisible() && owner) {
            me.floatOwner = owner;
            me.mon(owner, 'afterlayout', me.sizeMask, me, {single: true});
        }
    },

    onComponentRemoved: function(owner) {
        var me = this,
            activeOwner = me.activeOwner,
            floatOwner = me.floatOwner;

        if (activeOwner) {
            me.mun(activeOwner, 'move', me.sizeMask, me);
            me.mun(activeOwner, 'tofront', me.onOwnerToFront, me);
        }
        if (floatOwner) {
            me.mun(floatOwner, 'afterlayout', me.sizeMask, me);
        }
        delete me.activeOwner;
        delete me.floatOwner;
    },

    afterRender: function() {
        var me = this;
        
        me.callParent(arguments);
        
        // In IE8-11, clicking on an inner msgEl will focus it, despite
        // it having no tabindex attribute and thus being canonically
        // non-focusable. Placing unselectable="on" attribute will make
        // it unfocusable but will also prevent clicks from focusing
        // the parent element. We want clicks within the mask's main el
        // to focus it, hence the workaround.
        if (Ext.isIE) {
            me.el.on('mousedown', me.onMouseDown, me);
        }

        // This LoadMask shares the DOM and may be tipped out by the use of innerHTML
        // Ensure the element does not get garbage collected from under us.
        this.el.skipGarbageCollection = true;
    },
    
    onMouseDown: function(e) {
        var el = this.el;
        
        if (e.within(el)) {
            e.preventDefault();
            el.focus();
        }
    },

    onOwnerToFront: function(owner, zIndex) {
        this.el.setStyle('zIndex', zIndex + 1);
    },

    // Only called if we are rendered external to the target.
    // Best we can do is show.
    onContainerShow: function(container) {
        if (!this.isHierarchicallyHidden()) {
            this.onComponentShow();
        }
    },

    // Only called if we are rendered external to the target.
    // Best we can do is hide.
    onContainerHide: function(container) {
        if (this.isHierarchicallyHidden()) {
            this.onComponentHide();
        }
    },

    // Only called if we are rendered external to the target.
    // Best we can do is show.
    onContainerExpand: function(container) {
        if (!this.isHierarchicallyHidden()) {
            this.onComponentShow();
        }
    },

    // Only called if we are rendered external to the target.
    // Best we can do is hide.
    onContainerCollapse: function(container) {
        if (this.isHierarchicallyHidden()) {
            this.onComponentHide();
        }
    },

    onComponentHide: function() {
        var me = this;

        if (me.rendered && me.isVisible()) {
            me.hide();
            me.showNext = true;
        }
    },

    onComponentShow: function() {
        if (this.showNext) {
            this.show();
        }
        delete this.showNext;
    },

    /**
     * @private
     * Called when this LoadMask's Component is resized. The toFront method rebases and resizes the modal mask.
     */
    sizeMask: function() {
        var me = this,
            // Need to use the closest floating component (if it exists) as the basis
            // for our z-index positioning
            target = me.activeOwner || me.target,
            boxTarget = me.external ? me.getOwner().el : me.getMaskTarget();

        if (me.rendered && me.isVisible()) {
            // Only need to move and size the message wrap if we are outside of
            // the masked element.
            // If we are inside, it will be left:0;top:0;width:100%;height:100% by default
            if (me.external) {
                if (!me.isElement && target.floating) {
                    me.onOwnerToFront(target, target.el.getZIndex());
                }
                me.el.setSize(boxTarget.getSize()).alignTo(boxTarget, 'tl-tl');
            }
            
            // Always need to center the message wrap
            me.msgWrapEl.center(me.el);
        }
    },

    /**
     * Changes the data store bound to this LoadMask.
     * @param {Ext.data.Store} store The store to bind to this LoadMask
     */
    bindStore : function(store, initial) {
        var me = this;
        me.mixins.storeholder.bindStore.apply(me, arguments);
        store = me.store;
        if (store && store.isLoading()) {
            me.onBeforeLoad();
        }
    },

    getStoreListeners: function(store) {
        var load = this.onLoad,
            beforeLoad = this.onBeforeLoad,
            result = {
                // Fired when a range is requested for rendering that is not in the cache
                cachemiss: beforeLoad,

                // Fired when a range for rendering which was previously missing from the cache is loaded.
                // buffer so that scrolling and store filling has settled, and the results have been rendered.
                cachefilled: {
                    fn: load,
                    buffer: 100
                }
            };

        // Only need to mask on load if the proxy is asynchronous - ie: Ajax/JsonP
        if (!store.loadsSynchronously()) {
            result.beforeload = beforeLoad;
            result.load = load;
        }
        return result;
    },

    onDisable : function() {
        this.callParent(arguments);
        if (this.loading) {
            this.onLoad();
        }
    },

    getOwner: function() {
        return this.ownerCt || this.ownerCmp || this.floatParent;
    },

    getMaskTarget: function() {
        var owner = this.getOwner();
        if (this.isElement) {
            return this.target;
        }
        return this.useTargetEl ? owner.getTargetEl() : (owner.getMaskTarget() || Ext.getBody());
    },

    // @private
    onBeforeLoad : function() {
        var me = this,
            owner = me.getOwner(),
            origin;

        if (!me.disabled) {
            me.loading = true;
            // If the owning Component has not been layed out, defer so that the ZIndexManager
            // gets to read its layed out size when sizing the modal mask
            if (owner.componentLayoutCounter) {
                me.maybeShow();
            } else {
                // The code below is a 'run-once' interceptor.
                origin = owner.afterComponentLayout;
                owner.afterComponentLayout = function() {
                    owner.afterComponentLayout = origin;
                    origin.apply(owner, arguments);
                    me.maybeShow();
                };
            }
        }
    },

    maybeShow: function() {
        var me = this,
            owner = me.getOwner();

        if (!owner.isVisible(true)) {
            me.showNext = true;
        }
        else if (me.loading && owner.rendered) {
            me.show();
        }
    },

    hide: function() {
        var me = this,
            ownerCt = me.ownerCt;
        
        // Element support to be deprecated
        if (me.isElement) {
            ownerCt.unmask();
            me.fireEvent('hide', this);
            
            return;
        }
        
        ownerCt.enableTabbing();
        ownerCt.setMasked(false);
        
        delete me.showNext;
        
        return me.callParent(arguments);
    },

    show: function() {
        var me = this;

        // Element support to be deprecated
        if (me.isElement) {
            me.ownerCt.mask(this.useMsg ? this.msg : '', this.msgCls);
            me.fireEvent('show', this);
            
            return;
        }

        return me.callParent(arguments);
    },

    afterShow: function() {
        var me = this,
            ownerCt = me.ownerCt,
            el = me.el;

        me.loading = true;
        me.callParent(arguments);

        // Allow dynamic setting of msgWrapCls
        if (me.hasOwnProperty('msgWrapCls')) {
            el.dom.className = me.msgWrapCls;
        }

        if (me.useMsg) {
            me.msgTextEl.setHtml(me.msg);
        } else {
            // Only the mask is visible if useMsg is false
            me.msgEl.hide();
        }

        if (me.shim || Ext.useShims) {
            el.enableShim(null, true);
        } else {
            // Just in case me.shim was changed since last time we were shown (by
            // Component#setLoading())
            el.disableShim();
        }

        ownerCt.disableTabbing();
        ownerCt.setMasked(true);
        
        // Owner's disabled tabbing will also make the mask
        // untabbable since it is rendered within the target
        el.restoreTabbableState();

        // If owner contains focus, focus this.
        // Component level onHide processing takes care of focus reversion on hide.
        if (ownerCt.containsFocus) {
            me.focus();
        }
        me.sizeMask();
    },

    // @private
    onLoad : function() {
        this.loading = false;
        this.hide();
    },

    beforeDestroy: function() {
        // We don't have a real ownerCt, so clear it out here to prevent
        // spurious warnings when we are destroyed
        this.ownerCt = null;
        this.bindStore(null);
        this.callParent();
    },

    onDestroy: function() {
        var me = this;

        if (me.isElement) {
            me.ownerCt.unmask();
        }

        me.callParent();
    },
    
    privates: {
        getFocusEl: function() {
            return this.el;
        }
    }
});
