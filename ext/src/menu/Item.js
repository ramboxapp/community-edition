/**
 * A base class for all menu items that require menu-related functionality such as click handling,
 * sub-menus, icons, etc.
 *
 *     @example
 *     Ext.create('Ext.menu.Menu', {
 *         width: 100,
 *         height: 100,
 *         floating: false,  // usually you want this set to True (default)
 *         renderTo: Ext.getBody(),  // usually rendered by it's containing component
 *         items: [{
 *             text: 'icon item',
 *             iconCls: 'add16'
 *         },{
 *             text: 'text item'
 *         },{
 *             text: 'plain item',
 *             plain: true
 *         }]
 *     });
 */
Ext.define('Ext.menu.Item', {
    extend: 'Ext.Component',
    alias: 'widget.menuitem',
    alternateClassName: 'Ext.menu.TextItem',

    /**
     * @property {Boolean} isMenuItem
     * `true` in this class to identify an object as an instantiated Menu Item, or subclass thereof.
     */
    isMenuItem: true,

    mixins: [
        'Ext.mixin.Queryable'
    ],

    /**
     * @property {Boolean} activated
     * Whether or not this item is currently activated
     */
    activated: false,

    /**
     * @property {Ext.menu.Menu} parentMenu
     * The parent Menu of this item.
     */

    /**
     * @cfg {String} activeCls
     * The CSS class added to the menu item when the item is focused.
     */
    activeCls: Ext.baseCSSPrefix + 'menu-item-active',

    /**
     * @cfg {String} ariaRole
     * @private
     */
    ariaRole: 'menuitem',

    /**
     * @cfg {Boolean} canActivate
     * Whether or not this menu item can be focused.
     * @deprecated 5.1.0 Use the {@link #focusable} config.
     */

    /**
     * @cfg {Number} clickHideDelay
     * The delay in milliseconds to wait before hiding the menu after clicking the menu item.
     * This only has an effect when `hideOnClick: true`.
     */
    clickHideDelay: 0,

    /**
     * @cfg {Boolean} destroyMenu
     * Whether or not to destroy any associated sub-menu when this item is destroyed.
     */
    destroyMenu: true,

    /**
     * @cfg {String} disabledCls
     * The CSS class added to the menu item when the item is disabled.
     */
    disabledCls: Ext.baseCSSPrefix + 'menu-item-disabled',

    /**
     * @cfg {String} [href='#']
     * The href attribute to use for the underlying anchor link.
     */

    /**
     * @cfg {String} hrefTarget
     * The target attribute to use for the underlying anchor link.
     */

    /**
     * @cfg {Boolean} hideOnClick
     * Whether to not to hide the owning menu when this item is clicked.
     */
    hideOnClick: true,

    /**
     * @cfg {String} icon
     * The path to an icon to display in this item.
     *
     * There are no default icons that come with Ext JS.
     *
     * Defaults to `Ext.BLANK_IMAGE_URL`.
     */

    /**
     * @cfg {String} iconCls
     * A CSS class that specifies a `background-image` to use as the icon for this item.
     *
     * There are no default icon classes that come with Ext JS.
     */

    /**
     * @cfg {Number/String} glyph
     * A numeric unicode character code to use as the icon for this item. The default
     * font-family for glyphs can be set globally using
     * {@link Ext#setGlyphFontFamily Ext.setGlyphFontFamily()}. Alternatively, this
     * config option accepts a string with the charCode and font-family separated by the
     * `@` symbol. For example '65@My Font Family'.
     */

    /**
     * @cfg {Ext.menu.Menu/Object} menu
     * Either an instance of {@link Ext.menu.Menu} or a config object for an {@link Ext.menu.Menu}
     * which will act as a sub-menu to this item.
     */

    /**
     * @property {Ext.menu.Menu} menu The sub-menu associated with this item, if one was configured.
     */

    /**
     * @cfg {String} menuAlign
     * The default {@link Ext.util.Positionable#getAlignToXY Ext.util.Positionable.getAlignToXY} anchor position value for this
     * item's sub-menu relative to this item's position.
     */
    menuAlign: 'tl-tr?',

    /**
     * @cfg {Number} menuExpandDelay
     * The delay in milliseconds before this item's sub-menu expands after this item is moused over.
     */
    menuExpandDelay: 200,

    /**
     * @cfg {Number} menuHideDelay
     * The delay in milliseconds before this item's sub-menu hides after this item is moused out.
     */
    menuHideDelay: 200,

    /**
     * @cfg {Boolean} plain
     * Whether or not this item is plain text/html with no icon or visual activation.
     */

    /**
     * @cfg {String/Object} tooltip
     * The tooltip for the button - can be a string to be used as innerHTML (html tags are accepted) or
     * QuickTips config object.
     */

    /**
     * @cfg {String} tooltipType
     * The type of tooltip to use. Either 'qtip' for QuickTips or 'title' for title attribute.
     */
    tooltipType: 'qtip',
    
    focusable: true,

    baseCls: Ext.baseCSSPrefix + 'menu-item',
    arrowCls: Ext.baseCSSPrefix + 'menu-item-arrow',
    baseIconCls: Ext.baseCSSPrefix + 'menu-item-icon',
    textCls: Ext.baseCSSPrefix + 'menu-item-text',
    indentCls: Ext.baseCSSPrefix + 'menu-item-indent',
    indentNoSeparatorCls: Ext.baseCSSPrefix + 'menu-item-indent-no-separator',
    indentRightIconCls: Ext.baseCSSPrefix + 'menu-item-indent-right-icon',
    indentRightArrowCls: Ext.baseCSSPrefix + 'menu-item-indent-right-arrow',
    linkCls: Ext.baseCSSPrefix + 'menu-item-link',
    linkHrefCls: Ext.baseCSSPrefix + 'menu-item-link-href',

    childEls: [
        'itemEl', 'iconEl', 'textEl', 'arrowEl'
    ],

    renderTpl:
        '<tpl if="plain">' +
            '{text}' +
        '<tpl else>' +
            '<a id="{id}-itemEl" data-ref="itemEl"' +
                ' class="{linkCls}<tpl if="hasHref"> {linkHrefCls}</tpl>{childElCls}"' +
                ' href="{href}" role="menuitem" ' +
                '<tpl if="hrefTarget"> target="{hrefTarget}"</tpl>' +
                ' hidefocus="true"' +
                // For most browsers the text is already unselectable but Opera needs an explicit unselectable="on".
                ' unselectable="on"' +
                '<tpl if="tabIndex != null">' +
                    ' tabindex="{tabIndex}"' +
                '</tpl>' +
            '>' +
                '<span id="{id}-textEl" data-ref="textEl" class="{textCls} {textCls}-{ui} {indentCls}{childElCls}" unselectable="on">{text}</span>' +
                '<tpl if="hasIcon">' +
                    '<div role="presentation" id="{id}-iconEl" data-ref="iconEl" class="{baseIconCls}-{ui} {baseIconCls}' +
                        '{[values.rightIcon ? "-right" : ""]} {iconCls}' +
                        '{childElCls} {glyphCls}" style="<tpl if="icon">background-image:url({icon});</tpl>' +
                        '<tpl if="glyph && glyphFontFamily">font-family:{glyphFontFamily};</tpl>">' +
                        '<tpl if="glyph">&#{glyph};</tpl>' +
                    '</div>' +
                '</tpl>' +
                '<tpl if="showCheckbox">' +
                    '<div role="presentation" id="{id}-checkEl" data-ref="checkEl" class="{baseIconCls}-{ui} {baseIconCls}' +
                        '{[(values.hasIcon && !values.rightIcon) ? "-right" : ""]} ' +
                        '{groupCls} {checkboxCls}{childElCls}">' +
                    '</div>' +
                '</tpl>' +
                '<tpl if="hasMenu">' +
                    '<div role="presentation" id="{id}-arrowEl" data-ref="arrowEl" class="{arrowCls} {arrowCls}-{ui}{childElCls}"></div>' +
                '</tpl>' +
            '</a>' +
        '</tpl>',

    maskOnDisable: false,

    iconAlign: 'left',

    /**
     * @cfg {String} text
     * The text/html to display in this item.
     */

    /**
     * @cfg {Function/String} handler
     * A function called when the menu item is clicked (can be used instead of {@link #click} event).
     * @cfg {Ext.menu.Item} handler.item The item that was clicked
     * @cfg {Ext.event.Event} handler.e The underlying {@link Ext.event.Event}.
     * @declarativeHandler
     */

    /**
     * @event activate
     * Fires when this item is activated
     * @param {Ext.menu.Item} item The activated item
     */

    /**
     * @event click
     * Fires when this item is clicked
     * @param {Ext.menu.Item} item The item that was clicked
     * @param {Ext.event.Event} e The underlying {@link Ext.event.Event}.
     */

    /**
     * @event deactivate
     * Fires when this item is deactivated
     * @param {Ext.menu.Item} item The deactivated item
     */

    /**
     * @event textchange
     * Fired when the item's text is changed by the {@link #setText} method.
     * @param {Ext.menu.Item} this
     * @param {String} oldText
     * @param {String} newText
     */

    /**
     * @event iconchange
     * Fired when the item's icon is changed by the {@link #setIcon} or {@link #setIconCls} methods.
     * @param {Ext.menu.Item} this
     * @param {String} oldIcon
     * @param {String} newIcon
     */

    canFocus: function() {
        var me = this;
        
        // This is an override of the implementation in Focusable.
        // We do not refuse focus if the Item is disabled.
        // http://www.w3.org/TR/2013/WD-wai-aria-practices-20130307/#menu
        // "Disabled menu items receive focus but have no action when Enter or Left Arrow/Right Arrow is pressed."
        // Test that deprecated canActivate config has not been set to false.
        return me.focusable && me.rendered && me.canActivate !== false &&
               !me.destroying && !me.isDestroyed &&
               me.isVisible(true);
    },

    onFocus: function(e) {
        var me = this;

        me.callParent([e]);

        if (!me.disabled) {
            if (!me.plain) {
                me.addCls(me.activeCls);
            }

            me.activated = true;
            if (me.hasListeners.activate) {
                me.fireEvent('activate', me);
            }
        }
    },

    onFocusLeave: function(e) {
        var me = this;

        me.callParent([e]);

        if (me.activated) {
            if (!me.plain) {
                me.removeCls(me.activeCls);
            }
            me.doHideMenu();
            me.activated = false;
            if (me.hasListeners.deactivate) {
                me.fireEvent('deactivate', me);
            }
        }
    },

    doHideMenu: function() {
        var menu = this.menu;

        this.cancelDeferExpand();
        if (menu && menu.isVisible()) {
            menu.hide();
        }
    },

    /**
     * @private
     * Hides the entire floating menu tree that we are within.
     * Walks up the refOwner axis to find topmost floating Menu and hides that.
     */
    deferHideParentMenus: function() {
        var topMenu = this.getRefOwner();

        if (topMenu.floating) {
            topMenu.bubble(function(parent) {
                if (!parent.floating && !parent.isMenuItem) {
                    return false;
                }
                if (parent.isMenu) {
                    topMenu = parent;
                }
            });

            topMenu.hide();
        }
    },

    expandMenu: function(event, delay) {
        var me = this;

        if (me.activated && me.menu) {

            // hideOnClick makes no sense when there's a child menu
            me.hideOnClick = false;

            me.cancelDeferHide();

            // Allow configuration of zero to perform immediate expansion.
            delay = delay == null ? me.menuExpandDelay : delay;
            if (delay === 0) {
                me.doExpandMenu(event);
            } else {
                me.cancelDeferExpand();
                // Delay can't be 0 by this point
                me.expandMenuTimer = Ext.defer(me.doExpandMenu, delay, me, [event]);
            }
        }
    },

    doExpandMenu: function(clickEvent) {
        var me = this,
            menu = me.menu;

        if (!menu.isVisible()) {
            me.parentMenu.activeChild = menu;
            menu.ownerCmp = me;
            menu.parentMenu = me.parentMenu;
            menu.constrainTo = document.body;

            // Pointer-invoked menus do not auto focus, key invoked ones do.
            menu.autoFocus = !clickEvent || !clickEvent.pointerType;
            menu.showBy(me, me.menuAlign);
        }
    },

    getRefItems: function(deep) {
        var menu = this.menu,
            items;

        if (menu) {
            items = menu.getRefItems(deep);
            items.unshift(menu);
        }
        return items || [];
    },

    getValue: function () {
        return this.value;
    },

    hideMenu: function(delay) {
        var me = this;

        if (me.menu) {
            me.cancelDeferExpand();
            me.hideMenuTimer = Ext.defer(me.doHideMenu, Ext.isNumber(delay) ? delay : me.menuHideDelay, me);
        }
    },

    initComponent: function() {
        var me = this,
            cls = me.cls ? [me.cls] : [],
            menu;

        // During deprecation period of canActivate config, copy it into focusable config.
        if (me.hasOwnProperty('canActivate')) {
            me.focusable = me.canActivate;
        }

        if (me.plain) {
            cls.push(Ext.baseCSSPrefix + 'menu-item-plain');
        }

        if (cls.length) {
            me.cls  = cls.join(' ');
        }

        if (me.menu) {
            menu = me.menu;
            me.menu = null;
            me.setMenu(menu);
        }

        me.callParent(arguments);
    },

    onClick: function (e) {
        var me = this,
            clickHideDelay = me.clickHideDelay,
            browserEvent = e.browserEvent,
            clickResult, preventDefault;

        if (!me.href || me.disabled) {
            e.stopEvent();
            if (me.disabled) {
                return false;
            }
        }

        if (me.disabled || me.handlingClick) {
            return;
        }

        if (me.hideOnClick) {
            // on mobile webkit, when the menu item has an href, a longpress will 
            // trigger the touch call-out menu to show.  If this is the case, the tap 
            // event object's browser event type will be 'touchcancel', and we do not 
            // want to hide the menu.
            
            // items with submenus are activated by touchstart on mobile browsers, so
            // we cannot hide the menu on "tap"
            if (!clickHideDelay) {
                me.deferHideParentMenus();
            } else {
                me.deferHideParentMenusTimer = Ext.defer(me.deferHideParentMenus, clickHideDelay, me);
            }
        }

        // Click event may have destroyed the menu, don't do anything further
        clickResult = me.fireEvent('click', me, e);
        if (me.isDestroyed) {
            return;
        }

        if (clickResult !== false && me.handler) {
            Ext.callback(me.handler, me.scope, [me, e], 0, me);
        }

        // If there's an href, invoke dom.click() after we've fired the click event in case a click
        // listener wants to handle it.
        //
        // Note that we're having to do this because the key navigation code will blindly call stopEvent()
        // on all key events that it handles!
        //
        // But, we need to check the browser event object that was passed to the listeners to determine if
        // the default action has been prevented.  If so, we don't want to honor the .href config.
        if (Ext.isIE9m) {
            // Here we need to invert the value since it's meaning is the opposite of defaultPrevented.
            preventDefault = browserEvent.returnValue === false ? true : false;
        } else {
            preventDefault = !!browserEvent.defaultPrevented;
        }

        // We only manually need to trigger the click event if it's come from a key event.
        if (me.href && e.type !== 'click' && !preventDefault) {
            me.handlingClick = true;
            me.itemEl.dom.click();
            me.handlingClick = false;
        }

        if (!me.hideOnClick) {
            me.focus();
        }
        return clickResult;
    },

    onRemoved: function() {
        var me = this;

        // Removing the active item, must deactivate it.
        if (me.activated && me.parentMenu.activeItem === me) {
            me.parentMenu.deactivateActiveItem();
        }
        me.callParent(arguments);
        me.parentMenu = me.ownerCmp = null;
    },

    // @private
    beforeDestroy: function() {
        var me = this;
        if (me.rendered) {
            me.clearTip();
        }
        me.callParent();
    },

    onDestroy: function() {
        var me = this;

        me.cancelDeferExpand();
        me.cancelDeferHide();
        clearTimeout(me.deferHideParentMenusTimer);

        me.setMenu(null);
        me.callParent(arguments);
    },

    beforeRender: function() {
        var me = this,
            glyph = me.glyph,
            glyphFontFamily = Ext._glyphFontFamily,
            hasIcon = !!(me.icon || me.iconCls || glyph),
            hasMenu = !!me.menu,
            rightIcon = ((me.iconAlign === 'right') && !hasMenu),
            isCheckItem = me.isMenuCheckItem,
            indentCls = [],
            ownerCt = me.ownerCt,
            isOwnerPlain = ownerCt.plain,
            glyphParts;

        me.callParent();

        if (hasIcon) {
            if (hasMenu && me.showCheckbox) {
                // nowhere to put the icon, menu arrow on one side, checkbox on the other.
                // TODO:  maybe put the icon or checkbox next to the arrow?
                hasIcon = false;
            }
        }

        if (typeof glyph === 'string') {
            glyphParts = glyph.split('@');
            glyph = glyphParts[0];
            glyphFontFamily = glyphParts[1];
        }

        if (!isOwnerPlain || (hasIcon && !rightIcon) || isCheckItem) {
            if (ownerCt.showSeparator && !isOwnerPlain) {
                indentCls.push(me.indentCls);
            } else {
                indentCls.push(me.indentNoSeparatorCls);
            }
        }

        if (hasMenu) {
            indentCls.push(me.indentRightArrowCls);
        } else if (hasIcon && (rightIcon || isCheckItem)) {
            indentCls.push(me.indentRightIconCls);
        }

        Ext.applyIf(me.renderData, {
            hasHref: !!me.href,
            href: me.href || '#',
            hrefTarget: me.hrefTarget,
            icon: me.icon,
            iconCls: me.iconCls,
            glyph: glyph,
            glyphCls: glyph ? Ext.baseCSSPrefix + 'menu-item-glyph' : undefined,
            glyphFontFamily: glyphFontFamily,
            hasIcon: hasIcon,
            hasMenu: hasMenu,
            indent: !isOwnerPlain || hasIcon || isCheckItem,
            isCheckItem: isCheckItem,
            rightIcon: rightIcon,
            plain: me.plain,
            text: me.text,
            arrowCls: me.arrowCls,
            baseIconCls: me.baseIconCls,
            textCls: me.textCls,
            indentCls: indentCls.join(' '),
            linkCls: me.linkCls,
            linkHrefCls: me.linkHrefCls,
            groupCls: me.group ? me.groupCls : '',
            tabIndex: me.tabIndex
        });
    },

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        if (me.tooltip) {
            me.setTooltip(me.tooltip, true);
        }
    },

    /**
     * Get the attached sub-menu for this item.
     * @return {Ext.menu.Menu} The sub-menu. `null` if it doesn't exist.
     */
    getMenu: function() {
        return this.menu || null;
    },

    /**
     * Set a child menu for this item. See the {@link #cfg-menu} configuration.
     * @param {Ext.menu.Menu/Object} menu A menu, or menu configuration. null may be
     * passed to remove the menu.
     * @param {Boolean} [destroyMenu] True to destroy any existing menu. False to
     * prevent destruction. If not specified, the {@link #destroyMenu} configuration
     * will be used.
     */
    setMenu: function(menu, destroyMenu) {
        var me = this,
            oldMenu = me.menu,
            arrowEl = me.arrowEl,
            instanced;

        if (oldMenu) {
            oldMenu.ownerCmp = oldMenu.parentMenu = null;

            if (destroyMenu === true || (destroyMenu !== false && me.destroyMenu)) {
                Ext.destroy(oldMenu);
            }
        }
        if (menu) {
            instanced = menu.isMenu;
            menu = me.menu = Ext.menu.Manager.get(menu, {
                ownerCmp: me,
                focusOnToFront: false
            });
            // We need to forcibly set this here because we could be passed an existing menu, which means
            // the config above won't get applied during creation.
            menu.setOwnerCmp(me, instanced);
        } else {
            menu = me.menu = null;
        }

        if (menu && me.rendered && !me.destroying && arrowEl) {
            arrowEl[menu ? 'addCls' : 'removeCls'](me.arrowCls);
        }
    },

    /**
     * Sets the {@link #click} handler of this item
     * @param {Function} fn The handler function
     * @param {Object} [scope] The scope of the handler function
     */
    setHandler: function(fn, scope) {
        this.handler = fn || null;
        this.scope = scope;
    },

    /**
     * Sets the {@link #icon} on this item.
     * @param {String} icon The new icon
     */
    setIcon: function(icon){
        var iconEl = this.iconEl,
            oldIcon = this.icon;
        if (iconEl) {
            iconEl.src = icon || Ext.BLANK_IMAGE_URL;
        }
        this.icon = icon;
        this.fireEvent('iconchange', this, oldIcon, icon);
    },

    /**
     * Sets the {@link #iconCls} of this item
     * @param {String} iconCls The CSS class to set to {@link #iconCls}
     */
    setIconCls: function(iconCls) {
        var me = this,
            iconEl = me.iconEl,
            oldCls = me.iconCls;

        if (iconEl) {
            if (me.iconCls) {
                iconEl.removeCls(me.iconCls);
            }

            if (iconCls) {
                iconEl.addCls(iconCls);
            }
        }

        me.iconCls = iconCls;
        me.fireEvent('iconchange', me, oldCls, iconCls);
    },

    /**
     * Sets the {@link #text} of this item
     * @param {String} text The {@link #text}
     */
    setText: function(text) {
        var me = this,
            el = me.textEl || me.el,
            oldText = me.text;

        me.text = text;

        if (me.rendered) {
            el.setHtml(text || '');
            me.updateLayout();
        }
        me.fireEvent('textchange', me, oldText, text);
    },

    getTipAttr: function(){
        return this.tooltipType === 'qtip' ? 'data-qtip' : 'title';
    },

    //private
    clearTip: function() {
        if (Ext.quickTipsActive && Ext.isObject(this.tooltip)) {
            Ext.tip.QuickTipManager.unregister(this.itemEl);
        }
    },

    /**
     * Sets the tooltip for this menu item.
     *
     * @param {String/Object} tooltip This may be:
     *
     *   - **String** : A string to be used as innerHTML (html tags are accepted) to show in a tooltip
     *   - **Object** : A configuration object for {@link Ext.tip.QuickTipManager#register}.
     *
     * @return {Ext.menu.Item} this
     */
    setTooltip: function(tooltip, initial) {
        var me = this;

        if (me.rendered) {
            if (!initial) {
                me.clearTip();
            }

            if (Ext.quickTipsActive && Ext.isObject(tooltip)) {
                Ext.tip.QuickTipManager.register(Ext.apply({
                    target: me.itemEl.id
                },
                tooltip));
                me.tooltip = tooltip;
            } else {
                me.itemEl.dom.setAttribute(me.getTipAttr(), tooltip);
            }
        } else {
            me.tooltip = tooltip;
        }

        return me;
    },

    privates: {
        cancelDeferExpand: function() {
            window.clearTimeout(this.expandMenuTimer);
        },

        cancelDeferHide: function(){
            window.clearTimeout(this.hideMenuTimer);
        },

        getFocusEl: function() {
            return this.itemEl;
        }
    }
});
