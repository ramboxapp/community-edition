/**
 * A menu object. This is the container to which you may add {@link Ext.menu.Item menu items}.
 *
 * Menus may contain either {@link Ext.menu.Item menu items}, or general {@link Ext.Component Components}.
 * Menus may also contain {@link Ext.panel.Panel#dockedItems docked items} because it extends {@link Ext.panel.Panel}.
 *
 * By default, non {@link Ext.menu.Item menu items} are indented so that they line up with the text of menu items. clearing
 * the icon column. To make a contained general {@link Ext.Component Component} left aligned configure the child
 * Component with `indent: false.
 *
 * By default, Menus are absolutely positioned, floating Components. By configuring a Menu with `{@link #floating}: false`,
 * a Menu may be used as a child of a {@link Ext.container.Container Container}.
 *
 *     @example
 *     Ext.create('Ext.menu.Menu', {
 *         width: 100,
 *         margin: '0 0 10 0',
 *         floating: false,  // usually you want this set to True (default)
 *         renderTo: Ext.getBody(),  // usually rendered by it's containing component
 *         items: [{
 *             text: 'regular item 1'
 *         },{
 *             text: 'regular item 2'
 *         },{
 *             text: 'regular item 3'
 *         }]
 *     });
 *
 *     Ext.create('Ext.menu.Menu', {
 *         width: 100,
 *         plain: true,
 *         floating: false,  // usually you want this set to True (default)
 *         renderTo: Ext.getBody(),  // usually rendered by it's containing component
 *         items: [{
 *             text: 'plain item 1'
 *         },{
 *             text: 'plain item 2'
 *         },{
 *             text: 'plain item 3'
 *         }]
 *     });
 */
Ext.define('Ext.menu.Menu', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.menu',
    requires: [
        'Ext.layout.container.VBox',
        'Ext.menu.CheckItem',
        'Ext.menu.Item',
        'Ext.menu.Manager',
        'Ext.menu.Separator'
    ],

    mixins: [
        'Ext.util.FocusableContainer'
    ],

    /**
     * @property {Ext.menu.Menu} parentMenu
     * The parent Menu of this Menu.
     */
    
    /**
     * @cfg {Boolean} [enableKeyNav=true]
     * @deprecated 5.1.0 Intra-menu key navigation is always enabled.
     */
    enableKeyNav: true,

    /**
     * @cfg {Boolean} [allowOtherMenus=false]
     * True to allow multiple menus to be displayed at the same time.
     */
    allowOtherMenus: false,

    /**
     * @cfg {String} ariaRole
     * @private
     */
    ariaRole: 'menu',

    /**
     * @cfg {Boolean} autoRender
     * Floating is true, so autoRender always happens.
     * @private
     */

    /**
     * @cfg {Boolean} [floating=true]
     * A Menu configured as `floating: true` (the default) will be rendered as an absolutely positioned,
     * {@link Ext.Component#floating floating} {@link Ext.Component Component}. If configured as `floating: false`, the Menu may be
     * used as a child item of another {@link Ext.container.Container Container}.
     */
    floating: true,

    /**
     * @cfg {Boolean} constrain
     * Menus are constrained to the document body by default.
     * @private
     */
    constrain: true,

    /**
     * @cfg {Boolean} [hidden]
     * True to initially render the Menu as hidden, requiring to be shown manually.
     *
     * Defaults to `true` when `floating: true`, and defaults to `false` when `floating: false`.
     */
    hidden: true,

    hideMode: 'visibility',

    /**
     * @cfg {Boolean} [ignoreParentClicks=false]
     * True to ignore clicks on any item in this menu that is a parent item (displays a submenu)
     * so that the submenu is not dismissed when clicking the parent item.
     */
    ignoreParentClicks: false,

    /**
     * @property {Boolean} isMenu
     * `true` in this class to identify an object as an instantiated Menu, or subclass thereof.
     */
    isMenu: true,

    /**
     * @cfg {Ext.enums.Layout/Object} layout
     * @private
     */

    /**
     * @cfg {Boolean} [showSeparator=true]
     * True to show the icon separator.
     */
    showSeparator : true,

    /**
     * @cfg {Number} [minWidth=120]
     * The minimum width of the Menu. The default minWidth only applies when the {@link #floating} config is true.
     */
    minWidth: undefined,

    defaultMinWidth: 120,

    /**
     * @cfg {String} [defaultAlign="tl-bl?"]
     * The default {@link Ext.util.Positionable#getAlignToXY Ext.dom.Element#getAlignToXY} anchor position value for this menu
     * relative to its owner. Used in conjunction with {@link #showBy}.
     */
    defaultAlign: 'tl-bl?',

    /**
     * @cfg {Boolean} [plain=false]
     * True to remove the incised line down the left side of the menu and to not indent general Component items.
     * 
     * {@link Ext.menu.Item MenuItem}s will *always* have space at their start for an icon. With the `plain` setting,
     * non {@link Ext.menu.Item MenuItem} child components will not be indented to line up.
     * 
     * Basically, `plain:true` makes a Menu behave more like a regular {@link Ext.layout.container.HBox HBox layout}
     * {@link Ext.panel.Panel Panel} which just has the same background as a Menu.
     * 
     * See also the {@link #showSeparator} config.
     */
    
    focusOnToFront: false,
    bringParentToFront: false,

    defaultFocus: ':focusable',

    // private
    menuClickBuffer: 0,
    baseCls: Ext.baseCSSPrefix + 'menu',
    _iconSeparatorCls: Ext.baseCSSPrefix + 'menu-icon-separator',
    _itemCmpCls: Ext.baseCSSPrefix + 'menu-item-cmp',

    /**
     * @event click
     * Fires when this menu is clicked
     * @param {Ext.menu.Menu} menu The menu which has been clicked
     * @param {Ext.Component} item The menu item that was clicked. `undefined` if not applicable.
     * @param {Ext.event.Event} e The underlying {@link Ext.event.Event}.
     */

    /**
     * @event mouseenter
     * Fires when the mouse enters this menu
     * @param {Ext.menu.Menu} menu The menu
     * @param {Ext.event.Event} e The underlying {@link Ext.event.Event}
     */

    /**
     * @event mouseleave
     * Fires when the mouse leaves this menu
     * @param {Ext.menu.Menu} menu The menu
     * @param {Ext.event.Event} e The underlying {@link Ext.event.Event}
     */

    /**
     * @event mouseover
     * Fires when the mouse is hovering over this menu
     * @param {Ext.menu.Menu} menu The menu
     * @param {Ext.Component} item The menu item that the mouse is over. `undefined` if not applicable.
     * @param {Ext.event.Event} e The underlying {@link Ext.event.Event}
     */
    
    layout: {
        type: 'vbox',
        align: 'stretchmax',
        overflowHandler: 'Scroller'
    },

    initComponent: function() {
        var me = this,
            cls = [Ext.baseCSSPrefix + 'menu'],
            bodyCls = me.bodyCls ? [me.bodyCls] : [],
            isFloating = me.floating !== false,
            listeners = {
                element: 'el',
                click: me.onClick,
                mouseover: me.onMouseOver,
                scope: me
            };

        if (Ext.supports.Touch) {
            listeners.pointerdown = me.onMouseOver;
        }
        me.on(listeners);
        me.on({
            beforeshow: me.onBeforeShow,
            scope: me
        });

        // Menu classes
        if (me.plain) {
            cls.push(Ext.baseCSSPrefix + 'menu-plain');
        }
        me.cls = cls.join(' ');

        // Menu body classes
        bodyCls.push(Ext.baseCSSPrefix + 'menu-body', Ext.dom.Element.unselectableCls);
        me.bodyCls = bodyCls.join(' ');

        if (isFloating)  {
            // only apply the minWidth when we're floating & one hasn't already been set
            if (me.minWidth === undefined) {
                me.minWidth = me.defaultMinWidth;
            }
        } else {
            // hidden defaults to false if floating is configured as false
            me.hidden = !!me.initialConfig.hidden;
            me.constrain = false;
        }

        me.callParent(arguments);

        // Configure items prior to render with special classes to align
        // non MenuItem child components with their MenuItem siblings.
        Ext.override(me.getLayout(), {
            configureItem: me.configureItem
        });
    },

    // Private implementation for Menus. They are a special case, in that in the vast majority
    // (nearly all?) of use cases they shouldn't be constrained to anything other than the viewport.
    // See EXTJS-13596.
    initFloatConstrain: Ext.emptyFn,

    // As menus are never contained, a Menu's visibility only ever depends upon its own hidden state.
    // Ignore hiddenness from the ancestor hierarchy, override it with local hidden state.
    getInherited: function() {
        var result = this.callParent();
        result.hidden = this.hidden;
        return result;
    },

    beforeRender: function() {
        this.callParent(arguments);

        // Menus are usually floating: true, which means they shrink wrap their items.
        // However, when they are contained, and not auto sized, we must stretch the items.
        if (!this.getSizeModel().width.shrinkWrap) {
            this.layout.align = 'stretch';
        }
    },

    onBoxReady: function() {
        var me = this,
            iconSeparatorCls = me._iconSeparatorCls;

        me.focusableKeyNav.map.processEvent = function(e) {
            // ESC may be from input fields, and FocusableContainers ignore keys from 
            // input fields. We do not want to ignore ESC. ESC hide menus.
            if (e.keyCode === e.ESC) {
                e.target = me.el.dom;
            }
            return e;
        };

       // Handle ESC key
        me.focusableKeyNav.map.addBinding([{
            key: 27,
            handler: me.onEscapeKey,
            scope: me
        }, 
         // Handle character shotrcuts
        {
            key: /[\w]/,
            handler: me.onShortcutKey,
            scope: me,
            shift: false,
            ctrl: false,
            alt: false
        }]);

        me.callParent(arguments);

        // TODO: Move this to a subTemplate When we support them in the future
        if (me.showSeparator) {
            me.iconSepEl = me.body.insertFirst({
                role: 'presentation',
                cls: iconSeparatorCls + ' ' + iconSeparatorCls + '-' + me.ui,
                html: '&#160;'
            });
        }

        // Modern IE browsers have click events translated to PointerEvents, and b/c of this the
        // event isn't being canceled like it needs to be. So, we need to add an extra listener.
        if (Ext.supports.MSPointerEvents || Ext.supports.PointerEvents) {
            me.el.on({
                scope: me,
                click: me.preventClick,
                translate: false
            });
        }

        me.mouseMonitor = me.el.monitorMouseLeave(100, me.onMouseLeave, me);
    },

    onFocusLeave: function(e) {
        var me = this;

        me.callParent([e]);
        me.mixins.focusablecontainer.onFocusLeave.call(me, e);
        if (me.floating) {
            me.hide();
        }
    },

    /**
     * @param {Ext.Component} item The child item to test for focusability.
     * Returns whether a menu item can be activated or not.
     * @return {Boolean} `true` if the passed item is focusable.
     */
    canActivateItem: function(item) {
        return item && item.isFocusable();
    },

    /**
     * Deactivates the current active item on the menu, if one exists.
     */
    deactivateActiveItem: function() {
        var me = this,
            activeItem = me.lastFocusedChild;

        if (activeItem) {
            activeItem.blur();
        }
    },

    // @private
    getItemFromEvent: function(e) {
        var me = this,
            renderTarget = me.layout.getRenderTarget().dom,
            toEl = e.getTarget();

        // See which top level element the event is in and find its owning Component.
        while (toEl.parentNode !== renderTarget) {
            toEl = toEl.parentNode;
            if (!toEl) {
                return;
            }
        }
        return Ext.getCmp(toEl.id);
    },

    lookupComponent: function(cmp) {
        var me = this;

        if (typeof cmp === 'string') {
            cmp = me.lookupItemFromString(cmp);
        } else if (Ext.isObject(cmp)) {
            cmp = me.lookupItemFromObject(cmp);
        }

        // Apply our minWidth to all of our non-docked child components (Menu extends Panel)
        // so it's accounted for in our VBox layout
        if (!cmp.dock) {
            cmp.minWidth = cmp.minWidth || me.minWidth;
        }

        return cmp;
    },

    // @private
    lookupItemFromObject: function(cmp) {
        var me = this;

        if (!cmp.isComponent) {
            if (!cmp.xtype) {
                cmp = Ext.create('Ext.menu.' + (Ext.isBoolean(cmp.checked) ? 'Check': '') + 'Item', cmp);
            } else {
                cmp = Ext.ComponentManager.create(cmp, cmp.xtype);
            }
        }

        if (cmp.isMenuItem) {
            cmp.parentMenu = me;
        }

        return cmp;
    },

    // @private
    lookupItemFromString: function(cmp) {
        return (cmp === 'separator' || cmp === '-') ?
            new Ext.menu.Separator()
            : new Ext.menu.Item({
                canActivate: false,
                hideOnClick: false,
                plain: true,
                text: cmp
            });
    },

    // Override applied to the Menu's layout. Runs in the context of the layout.
    // Add special classes to allow non MenuItem components to coexist with MenuItems.
    // If there is only *one* child, then this Menu is just a vehicle for floating
    // and aligning the component, so do not do this.
    configureItem: function(cmp) {
        var me = this.owner,
            prefix = Ext.baseCSSPrefix,
            ui = me.ui,
            cls, cmpCls;

        if (cmp.isMenuItem) {
            cmp.setUI(ui);
        } else if (me.items.getCount() > 1 && !cmp.rendered && !cmp.dock) {
            cmpCls = me._itemCmpCls;
            cls = [cmpCls + ' ' + cmpCls + '-' + ui];

            // The "plain" setting means that the menu does not look so much like a menu. It's more like a grey Panel.
            // So it has no vertical separator.
            // Plain menus also will not indent non MenuItem components; there is nothing to indent them to the right of.
            if (!me.plain && (cmp.indent !== false || cmp.iconCls === 'no-icon')) {
                cls.push(prefix + 'menu-item-indent-' + ui);
            }

            if (cmp.rendered) {
                cmp.el.addCls(cls);
            } else {
                cmp.cls = (cmp.cls || '') + ' ' + cls.join(' ');
            }
            // So we can clean the item if it gets removed.
            cmp.$extraMenuCls = cls;
        }

        // @noOptimize.callParent
        this.callParent(arguments);
    },

    onRemove: function(cmp) {
        this.callParent([cmp]);
        
        // Remove any extra classes we added to non-MenuItem child items
        if (!cmp.isDestroyed && cmp.$extraMenuCls) {
            cmp.el.removeCls(cmp.$extraMenuCls);
        }
    },

    onClick: function(e) {
        var me = this,
            type = e.type,
            item,
            clickResult,
            iskeyEvent = type === 'keydown';

        if (me.disabled) {
            e.stopEvent();
            return;
        }

        item = me.getItemFromEvent(e);
        if (item && item.isMenuItem) {
            if (!item.menu || !me.ignoreParentClicks) {
                clickResult = item.onClick(e);
            } else {
                e.stopEvent();
            }

            // SPACE and ENTER invokes the menu
            if (item.menu && clickResult !== false && iskeyEvent) {
                item.expandMenu(e, 0);
            }
        }
        // Click event may be fired without an item, so we need a second check
        if (!item || item.disabled) {
            item = undefined;
        }
        me.fireEvent('click', me, item, e);
    },

    onDestroy: function() {
        var me = this;

        me.parentMenu = me.ownerCmp = null;
        if (me.rendered) {
            me.el.un(me.mouseMonitor);
            Ext.destroy(me.iconSepEl);
        }
        me.callParent(arguments);
    },

    onMouseLeave: function(e) {
        if (this.disabled) {
            return;
        }
        this.fireEvent('mouseleave', this, e);
    },

    onMouseOver: function(e) {
        var me = this,
            fromEl = e.getRelatedTarget(),
            mouseEnter = !me.el.contains(fromEl),
            item = me.getItemFromEvent(e),
            parentMenu = me.parentMenu,
            ownerCmp = me.ownerCmp;

        if (mouseEnter && parentMenu) {
            parentMenu.setActiveItem(ownerCmp);
            ownerCmp.cancelDeferHide();
            parentMenu.mouseMonitor.mouseenter();
        }

        if (me.disabled) {
            return;
        }

        // Do not activate the item if the mouseover was within the item, and it's already active
        if (item) {
            if (!item.containsFocus) {
                item.focus();
            }
            if (item.expandMenu) {
                item.expandMenu(e);
            }
        }
        if (mouseEnter) {
            me.fireEvent('mouseenter', me, e);
        }
        me.fireEvent('mouseover', me, item, e);
    },

    setActiveItem: function(item) {
        var me = this;

        if (item && (item !== me.lastFocusedChild)) {
            me.focusChild(item, 1);
            // Focusing will scroll the item into view.
        }
    },

    onEscapeKey: function() {
        if (this.floating) {
            this.hide();
        }
    },

    onShortcutKey: function(keyCode, e) {
        var shortcutChar = String.fromCharCode(e.getCharCode()),
            items = this.query('>[text]'),
            len = items.length,
            item = this.lastFocusedChild,
            focusIndex = Ext.Array.indexOf(items, item),
            i = focusIndex;

        // Loop through all items which have a text property starting at the one after the current focus.
        for (;;) {
            if (++i === len) {
                i = 0;
            }
            item = items[i];

            // Looped back to start - no matches
            if (i === focusIndex) {
                return;
            }
            
            // Found a text match
            if (item.text && item.text[0].toUpperCase() === shortcutChar) {
                item.focus();
                return;
            }
        }
    },

    // Tabbing in a floating menu must hide, but not move focus.
    // onHide takes care of moving focus back to an owner Component.
    onFocusableContainerTabKey: function(e) {
        if (this.floating) {
            this.hide();
        }
    },

    onFocusableContainerEnterKey: function(e) {
        this.onClick(e);
    },

    onFocusableContainerSpaceKey: function(e) {
        this.onClick(e);
    },

    onFocusableContainerLeftKey: function(e) {
        // If we are a submenu, then left arrow focuses the owning MenuItem
        if (this.parentMenu) {
            this.ownerCmp.focus();
            this.hide();
        }
    },

    onFocusableContainerRightKey: function(e) {
        var me = this,
            focusItem = me.lastFocusedChild;

        if (focusItem && focusItem.expandMenu) {
            focusItem.expandMenu(e, 0);
        }
    },

    onBeforeShow: function() {
        // Do not allow show immediately after a hide
        if (Ext.Date.getElapsed(this.lastHide) < this.menuClickBuffer) {
            return false;
        }
    },

    beforeShow: function() {
        var me = this,
            activeEl,
            viewHeight;

        // Constrain the height to the containing element's viewable area
        if (me.floating) {

            if (!me.hasFloatMenuParent() && !me.allowOtherMenus) {
                Ext.menu.Manager.hideAll();
            }
            // Only register a focusAnchor to return to on hide if the active element is not the document
            // If there's no focusAnchor, we return to the ownerCmp, or first focusable ancestor.
            activeEl = Ext.Element.getActiveElement();
            me.focusAnchor = activeEl === document.body ? null : activeEl;

            me.savedMaxHeight = me.maxHeight;
            viewHeight = me.container.getViewSize().height;
            me.maxHeight = Math.min(me.maxHeight || viewHeight, viewHeight);
        }

        me.callParent(arguments);
    },

    afterShow: function() {
        var me = this;

        me.callParent(arguments);
        Ext.menu.Manager.onShow(me);

        // Restore configured maxHeight
        if (me.floating && me.autoFocus) {
            me.maxHeight = me.savedMaxHeight;
            me.focus();
        }
    },

    onHide: function(animateTarget, cb, scope) {
        var me = this,
            focusTarget;

         // If we contain focus just before element hide, move it elsewhere before hiding
        if (me.el.contains(Ext.Element.getActiveElement())) {
            // focusAnchor was the active element before this menu was shown.
            focusTarget = me.focusAnchor || me.ownerCmp || me.up(':focusable');

            // Component hide processing will focus the "previousFocus" element.
            if (focusTarget) {
                me.previousFocus = focusTarget;
            }
        }
        me.callParent([animateTarget, cb, scope]);
        me.lastHide = Ext.Date.now();
        Ext.menu.Manager.onHide(me);
    },

    preventClick: function (e) {
        var item = this.getItemFromEvent(e);
        if (item && !item.href) {
            e.preventDefault();
        }
    },

    privates: {
        hasFloatMenuParent: function() {
            return this.parentMenu || this.up('menu[floating=true]');
        },

        setOwnerCmp: function(comp, instanced) {
            var me = this;

            me.parentMenu = comp.isMenuItem ? comp : null;
            me.ownerCmp = comp;
            me.registerWithOwnerCt();

            delete me.hierarchicallyHidden;
            if (me.inheritedState && instanced) {
                me.invalidateInheritedState();
            }

            if (me.reference) {
                me.fixReference();
            }

            // We have been added to a container, we may have child references
            // or be a reference ourself. At this point we have no way of knowing if 
            // our references are correct, so trigger a fix.
            if (instanced) {
                Ext.ComponentManager.markReferencesDirty();
            }
        }
    }
});
