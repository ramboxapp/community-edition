/**
 * TabBar is used internally by a {@link Ext.tab.Panel TabPanel} and typically should not
 * need to be created manually.
 */
Ext.define('Ext.tab.Bar', {
    extend: 'Ext.panel.Bar',
    xtype: 'tabbar',

    baseCls: Ext.baseCSSPrefix + 'tab-bar',

    requires: [
        'Ext.tab.Tab',
        'Ext.util.Point',
        'Ext.layout.component.Body'
    ],
    
    mixins: [
        'Ext.util.FocusableContainer'
    ],

    componentLayout: 'body',

    /**
     * @property {Boolean} isTabBar
     * `true` in this class to identify an object as an instantiated Tab Bar, or subclass thereof.
     */
    isTabBar: true,

    config: {
        /**
         * @cfg {'default'/0/1/2} tabRotation
         * The rotation of the tabs.  Can be one of the following values:
         *
         * - `default` - use the default rotation, depending on the dock position (see below)
         * - `0` - no rotation
         * - `1` - rotate 90deg clockwise
         * - `2` - rotate 90deg counter-clockwise
         *
         * The default behavior of this config depends on the dock position:
         *
         * - `'top'` or `'bottom'` - `0`
         * - `'right'` - `1`
         * - `'left'` - `2`
         */
        tabRotation: 'default',

        /**
         * @cfg {Boolean} tabStretchMax
         * `true` to stretch all tabs to the height of the tallest tab when the tabBar
         * is docked horizontally, or the width of the widest tab when the tabBar is
         * docked vertically.
         */
        tabStretchMax: true,
        
        // NB: This option is named this way for the intent, but in fact activation
        // happens in arrow key handler, not in focus handler. In IE focus events are
        // asynchronous, so activation happens before the tab's focus handler is fired.
        /**
         * @cfg {Boolean} [activateOnFocus=true]
         * `true` to follow WAI-ARIA requirement and activate tab when it is navigated to
         * with arrow keys, or `false` to disable that behavior. When activation on focus
         * is disabled, users will have to use arrow keys to focus a tab, and then press
         * Space key to activate it.
         */
        activateOnFocus: true
    },

    // @private
    defaultType: 'tab',

    /**
     * @cfg {Boolean} plain
     * True to not show the full background on the tabbar
     */
    plain: false,

    /**
     * @cfg {Boolean} ensureActiveVisibleOnChange
     * `true` to ensure the active tab is scrolled into view when the tab changes, the text, the
     * icon or the glyph. This is only applicable if using an overflow scroller.
     *
     * @since 5.1.1
     */
    ensureActiveVisibleOnChange: true,
    
    ariaRole: 'tablist',

    childEls: [
        'body', 'strip'
    ],

    _stripCls: Ext.baseCSSPrefix + 'tab-bar-strip',
    _baseBodyCls: Ext.baseCSSPrefix + 'tab-bar-body',

    // @private
    renderTpl:
        '<div id="{id}-body" data-ref="body" role="presentation" class="{baseBodyCls} {baseBodyCls}-{ui} ' +
            '{bodyCls} {bodyTargetCls}{childElCls}"<tpl if="bodyStyle"> style="{bodyStyle}"</tpl>>' +
            '{%this.renderContainer(out,values)%}' +
        '</div>' +
        '<div id="{id}-strip" data-ref="strip" role="presentation" class="{stripCls} {stripCls}-{ui}{childElCls}"></div>',

    /**
     * @cfg {Number} minTabWidth
     * The minimum width for a tab in this tab Bar. Defaults to the tab Panel's {@link Ext.tab.Panel#minTabWidth minTabWidth} value.
     * @deprecated This config is deprecated. It is much easier to use the {@link Ext.tab.Panel#minTabWidth minTabWidth} config on the TabPanel.
     */

    /**
     * @cfg {Number} maxTabWidth
     * The maximum width for a tab in this tab Bar. Defaults to the tab Panel's {@link Ext.tab.Panel#maxTabWidth maxTabWidth} value.
     * @deprecated This config is deprecated. It is much easier to use the {@link Ext.tab.Panel#maxTabWidth maxTabWidth} config on the TabPanel.
     */

    _reverseDockNames: {
        left: 'right',
        right: 'left'
    },

    _layoutAlign: {
        top: 'end',
        right: 'begin',
        bottom: 'begin',
        left: 'end'
    },

    /**
     * @event change
     * Fired when the currently-active tab has changed
     * @param {Ext.tab.Bar} tabBar The TabBar
     * @param {Ext.tab.Tab} tab The new Tab
     * @param {Ext.Component} card The card that was just shown in the TabPanel
     */
    
    // @private
    initComponent: function() {
        var me = this,
            initialLayout = me.initialConfig.layout,
            initialAlign = initialLayout && initialLayout.align,
            initialOverflowHandler = initialLayout && initialLayout.overflowHandler;

        if (me.plain) {
            me.addCls(me.baseCls + '-plain');
        }

        me.callParent();

        me.setLayout({
            align: initialAlign || (me.getTabStretchMax() ? 'stretchmax' :
                    me._layoutAlign[me.dock]),
            overflowHandler: initialOverflowHandler || 'scroller'
        });

        me.on({
            click: me.onClick,
            element: 'el',
            scope: me
        });
    },

    /**
     * Ensure the passed tab is visible if using overflow scrolling 
     * @param {Ext.tab.Tab/Ext.Component/Number} [tab] The tab, item in the owning {@link Ext.tab.Panel} or
     * the index of the item to scroll to. Defaults to the active tab.
     */
    ensureTabVisible: function(tab) {
        var me = this,
            tabPanel = me.tabPanel,
            overflowHandler = me.layout.overflowHandler;

        if (me.rendered && overflowHandler && me.tooNarrow && overflowHandler.scrollToItem) {
            if (tab || tab === 0) {
                if (!tab.isTab) {
                    if (Ext.isNumber(tab)) {
                        tab = this.items.getAt(tab);
                    } else if (tab.isComponent && tabPanel && tabPanel.items.contains(tab)) {
                        tab = tab.tab;
                    }
                }
            }

            if (!tab) {
                tab = me.activeTab;
            }

            if (tab) {
                overflowHandler.scrollToItem(tab);
            }
        }
    },

    initRenderData: function() {
        var me = this;

        return Ext.apply(me.callParent(), {
            bodyCls: me.bodyCls,
            baseBodyCls: me._baseBodyCls,
            bodyTargetCls: me.bodyTargetCls,
            stripCls: me._stripCls,
            dock: me.dock
        });
    },

    setDock: function(dock) {
        var me = this,
            items = me.items,
            ownerCt = me.ownerCt,
            item, i, ln;

        items = items && items.items;

        if (items) {
            for (i = 0, ln = items.length; i < ln; i++) {
                item = items[i];
                if (item.isTab) {
                    item.setTabPosition(dock);
                }
            }
        }

        if (me.rendered) {
            // TODO: remove resetItemMargins once EXTJS-13359 is fixed
            me.resetItemMargins();
            if (ownerCt && ownerCt.isHeader) {
                ownerCt.resetItemMargins();
            }
            me.needsScroll = true;
        }
        me.callParent([dock]);
    },

    updateTabRotation: function(tabRotation) {
        var me = this,
            items = me.items,
            i, ln, item;

        items = items && items.items;

        if (items) {
            for (i = 0, ln = items.length; i < ln; i++) {
                item = items[i];
                if (item.isTab) {
                    item.setRotation(tabRotation);
                }
            }
        }

        if (me.rendered) {
            // TODO: remove resetItemMargins once EXTJS-13359 is fixed
            me.resetItemMargins();

            me.needsScroll = true;
            me.updateLayout();
        }
    },

    onRender: function() {
        var me = this;

        me.callParent();

        if (Ext.isIE8 && me.vertical) {
            me.el.on({
                mousemove: me.onMouseMove, 
                scope: me
            });
        }
    },
    
    afterLayout: function() {
        this.adjustTabPositions();
        this.callParent(arguments);
    },

    onAdd: function(tab, pos) {
        var fn = this.onTabContentChange;

        if (this.ensureActiveVisibleOnChange) {
            tab.barListeners = tab.on({
                scope: this,
                destroyable: true,
                glyphchange: fn,
                iconchange: fn,
                textchange: fn
            });
        }
        this.callParent([tab, pos]);
    },

    onAdded: function(container, pos, instanced) {
        if (container.isHeader) {
            this.addCls(container.baseCls + '-' + container.ui + '-tab-bar');
        }
        this.callParent([container, pos, instanced]);
    },

    onRemove: function(tab, destroying) {
        var me = this;

        // If we're not destroying, no need to do this here since they will
        // be cleaned up
        if (me.ensureActiveVisibleOnChange) {
            if (!destroying) {
                tab.barListeners.destroy();
            }
            tab.barListeners = null;
        }

        if (tab === me.previousTab) {
            me.previousTab = null;
        }
        me.callParent([tab, destroying]);
    },

    onRemoved: function(destroying) {
        var ownerCt = this.ownerCt;

        if (ownerCt.isHeader) {
            this.removeCls(ownerCt.baseCls + '-' + ownerCt.ui + '-tab-bar');
        }
        this.callParent([destroying]);
    },

    onTabContentChange: function(tab) {
        if (tab === this.activeTab) {
            this.ensureTabVisible(tab);
        }
    },

    afterComponentLayout: function(width) {
        var me = this,
            needsScroll = me.needsScroll,
            overflowHandler = me.layout.overflowHandler;
        
        me.callParent(arguments);
            
        if (overflowHandler && needsScroll && me.tooNarrow && overflowHandler.scrollToItem) {
            overflowHandler.scrollToItem(me.activeTab);
        }
        delete me.needsScroll;
    },

    // private
    onMouseMove: function(e) {
        var me = this,
            overTab = me._overTab,
            tabInfo, tab;

        if (e.getTarget('.' + Ext.baseCSSPrefix + 'box-scroller')) {
            return;
        }

        tabInfo = me.getTabInfoFromPoint(e.getXY());
        tab = tabInfo.tab;

        if (tab !== overTab) {
            if (overTab && overTab.rendered) {
                overTab.onMouseLeave(e);
                me._overTab = null;
            }
            if (tab) {
                tab.onMouseEnter(e);
                me._overTab = tab;
                if (!tab.disabled) {
                    me.el.setStyle('cursor', 'pointer');
                }
            } else {
                me.el.setStyle('cursor', 'default');
            }
        }
    },

    onMouseLeave: function(e) {
        var overTab = this._overTab;

        if (overTab && overTab.rendered) {
            overTab.onMouseLeave(e);
        }
    },

    // @private
    // in IE8 and IE9 the clickable region of a rotated element is not its new rotated
    // position, but it's original unrotated position.  The result is that rotated tabs do
    // not capture click and mousenter/mosueleave events correctly.  This method accepts
    // an xy position and calculates if the coordinates are within a tab and if they
    // are within the tab's close icon (if any)
    getTabInfoFromPoint: function(xy) {
        var me = this,
            tabs = me.items.items,
            length = tabs.length,
            innerCt = me.layout.innerCt,
            innerCtXY = innerCt.getXY(),
            point = new Ext.util.Point(xy[0], xy[1]),
            i = 0,
            lastBox, tabRegion, closeEl, close, closeXY, closeX, closeY, closeWidth,
            closeHeight, tabX, tabY, tabWidth, tabHeight, closeRegion, isTabReversed,
            direction, tab;

        for (; i < length; i++) {
            tab = tabs[i];
            lastBox = tab.lastBox;
            if (!lastBox || !tab.isTab) {
                // avoid looping hidden or not laid out, or if the item
                // is not a tab
                continue;
            }
            tabX = innerCtXY[0] + lastBox.x;
            tabY = innerCtXY[1] - innerCt.dom.scrollTop + lastBox.y;
            tabWidth = lastBox.width;
            tabHeight = lastBox.height;
            tabRegion = new Ext.util.Region(
                tabY,
                tabX + tabWidth,
                tabY + tabHeight,
                tabX
            );
            if (tabRegion.contains(point)) {
                closeEl = tab.closeEl;
                if (closeEl) {
                    // Read the dom to determine if the contents of the tab are reversed
                    // (rotated 180 degrees).  If so, we can cache the result becuase
                    // it's safe to assume all tabs in the tabbar will be the same
                    if (me._isTabReversed === undefined) {
                        me._isTabReversed = isTabReversed =
                        // use currentStyle because getComputedStyle won't get the
                        // filter property in IE9
                        (tab.btnWrap.dom.currentStyle.filter.indexOf('rotation=2') !== -1);
                    }

                    direction = isTabReversed ? this._reverseDockNames[me.dock] : me.dock;

                    closeWidth = closeEl.getWidth();
                    closeHeight = closeEl.getHeight();
                    closeXY = me.getCloseXY(closeEl, tabX, tabY, tabWidth, tabHeight,
                        closeWidth, closeHeight, direction);
                    closeX = closeXY[0];
                    closeY = closeXY[1];

                    closeRegion = new Ext.util.Region(
                        closeY,
                        closeX + closeWidth,
                        closeY + closeHeight,
                        closeX
                    );

                    close = closeRegion.contains(point);
                }
                break;
            }
        }

        return {
            tab: tab,
            close: close
        };
    },

    // @private
    getCloseXY: function(closeEl, tabX, tabY, tabWidth, tabHeight, closeWidth, closeHeight, direction) {
        var closeXY = closeEl.getXY(),
            closeX, closeY;

        if (direction === 'right') {
            closeX = tabX + tabWidth - ((closeXY[1] - tabY) + closeHeight); 
            closeY = tabY + (closeXY[0] - tabX); 
        } else {
            closeX = tabX + (closeXY[1] - tabY);
            closeY = tabY + tabX + tabHeight - closeXY[0] - closeWidth;
        }

        return [closeX, closeY];
    },

    /**
     * @private
     * Closes the given tab by removing it from the TabBar and removing the corresponding card from the TabPanel
     * @param {Ext.tab.Tab} toClose The tab to close
     */
    closeTab: function(toClose) {
        var me = this,
            card = toClose.card,
            tabPanel = me.tabPanel,
            toActivate;

        if (card && card.fireEvent('beforeclose', card) === false) {
            return false;
        }
        
        // If we are closing the active tab, revert to the previously active tab (or the previous or next enabled sibling if
        // there *is* no previously active tab, or the previously active tab is the one that's being closed or the previously
        // active tab has since been disabled)
        toActivate = me.findNextActivatable(toClose);

        // We are going to remove the associated card, and then, if that was sucessful, remove the Tab,
        // And then potentially activate another Tab. We should not layout for each of these operations.
        Ext.suspendLayouts();

        if (tabPanel && card) {
            // Remove the ownerCt so the tab doesn't get destroyed if the remove is successful
            // We need this so we can have the tab fire it's own close event.
            delete toClose.ownerCt;
            
            // we must fire 'close' before removing the card from panel, otherwise
            // the event will no loger have any listener
            card.fireEvent('close', card);
            tabPanel.remove(card);
            
            // Remove succeeded
            if (!tabPanel.getComponent(card)) {
                /*
                 * Force the close event to fire. By the time this function returns,
                 * the tab is already destroyed and all listeners have been purged
                 * so the tab can't fire itself.
                 */
                toClose.fireClose();
                me.remove(toClose);
            } else {
                // Restore the ownerCt from above
                toClose.ownerCt = me;
                Ext.resumeLayouts(true);
                return false;
            }
        }

        // If we are closing the active tab, revert to the previously active tab (or the previous sibling or the nnext sibling)
        if (toActivate) {
            // Our owning TabPanel calls our setActiveTab method, so only call that if this Bar is being used
            // in some other context (unlikely)
            if (tabPanel) {
                tabPanel.setActiveTab(toActivate.card);
            } else {
                me.setActiveTab(toActivate);
            }
            toActivate.focus();
        }
        Ext.resumeLayouts(true);
    },

    // private - used by TabPanel too.
    // Works out the next tab to activate when one tab is closed.
    findNextActivatable: function(toClose) {
        var me = this;
        if (toClose.active && me.items.getCount() > 1) {
            return (me.previousTab && me.previousTab !== toClose && !me.previousTab.disabled) ? me.previousTab : (toClose.next('tab[disabled=false]') || toClose.prev('tab[disabled=false]'));
        }
    },

    /**
     * @private
     * Marks the given tab as active
     * @param {Ext.tab.Tab} tab The tab to mark active
     * @param {Boolean} initial True if we're setting the tab during setup
     */
    setActiveTab: function(tab, initial) {
        var me = this;

        if (!tab.disabled && tab !== me.activeTab) {
            // Deactivate the previous tab, and ensure this FocusableContainer knows about it
            if (me.activeTab) {
                if (me.activeTab.isDestroyed) {
                    me.previousTab = null;
                } else {
                    me.previousTab = me.activeTab;
                    me.activeTab.deactivate();
                    me.deactivateFocusable(me.activeTab);
                }
            }

            // Activate the new tab, and ensure this FocusableContainer knows about it
            tab.activate();
            me.activateFocusable(tab);

            me.activeTab = tab;
            me.needsScroll = true;
            
            // We don't fire the change event when setting the first tab.
            // Also no need to run a layout
            if (!initial) {
                me.fireEvent('change', me, tab, tab.card);
                // Ensure that after the currently in progress layout, the active tab is scrolled into view
                me.updateLayout();
            }
        }
    },

    privates: {
        adjustTabPositions: function() {
            var me = this,
                items = me.items.items,
                i = items.length,
                tab, lastBox, el, rotation, prop;

            // When tabs are rotated vertically we don't have a reliable way to position
            // them using CSS in modern browsers.  This is because of the way transform-orign
            // works - it requires the width to be known, and the width is not known in css.
            // Consequently we have to make an adjustment to the tab's position in these browsers.
            // This is similar to what we do in Ext.panel.Header#adjustTitlePosition
            if (!Ext.isIE8) {
                // 'left' in normal mode, 'right' in rtl
                prop = me._getTabAdjustProp();

                while (i--) {
                    tab = items[i];
                    el = tab.el;
                    lastBox = tab.lastBox;
                    rotation = tab.isTab ? tab.getActualRotation() : 0;
                    if (rotation === 1 && tab.isVisible()) {
                        // rotated 90 degrees using the top left corner as the axis.
                        // tabs need to be shifted to the right by their width
                        el.setStyle(prop, (lastBox.x + lastBox.width) + 'px');
                    } else if (rotation === 2 && tab.isVisible()) {
                        // rotated 270 degrees using the bottom right corner as the axis.
                        // tabs need to be shifted to the left by their height
                        el.setStyle(prop, (lastBox.x - lastBox.height) + 'px');
                    }
                }
            }
        },

        applyTargetCls: function(targetCls) {
            this.bodyTargetCls = targetCls;
        },

        // rtl hook
        _getTabAdjustProp: function() {
            return 'left';
        },

        getTargetEl: function() {
            return this.body || this.frameBody || this.el;
        },

        onClick: function(e, target) {
            var me = this,
                tabEl, tab, isCloseClick, tabInfo;

            if (e.getTarget('.' + Ext.baseCSSPrefix + 'box-scroller')) {
                return;
            }

            if (Ext.isIE8 && me.vertical) {
                tabInfo = me.getTabInfoFromPoint(e.getXY());
                tab = tabInfo.tab;
                isCloseClick = tabInfo.close;
            } else {
                // The target might not be a valid tab el.
                tabEl = e.getTarget('.' + Ext.tab.Tab.prototype.baseCls);
                tab = tabEl && Ext.getCmp(tabEl.id);
                isCloseClick = tab && tab.closeEl && (target === tab.closeEl.dom);
            }

            if (isCloseClick) {
                e.preventDefault();
            }
            
            if (tab && tab.isDisabled && !tab.isDisabled()) {
                // This will focus the tab; we do it before activating the card
                // because the card may attempt to focus itself or a child item.
                // We need to focus the tab explicitly because click target is
                // the Bar, not the Tab.
                tab.beforeClick(isCloseClick);
                
                if (tab.closable && isCloseClick) {
                    tab.onCloseClick();
                }
                else {
                    me.doActivateTab(tab);
                }
            }
        },
        
        doActivateTab: function(tab) {
            var tabPanel = this.tabPanel;
            
            if (tabPanel) {
                // TabPanel will call setActiveTab of the TabBar
                if (!tab.disabled) {
                    tabPanel.setActiveTab(tab.card);
                }
            } else {
                this.setActiveTab(tab);
            }
        },
        
        onFocusableContainerFocus: function(e) {
            var me = this,
                mixin = me.mixins.focusablecontainer,
                child;
            
            child = mixin.onFocusableContainerFocus.call(me, e);
            
            if (child && child.isTab) {
                me.doActivateTab(child);
            }
        },
        
        onFocusableContainerFocusEnter: function(e) {
            var me = this,
                mixin = me.mixins.focusablecontainer,
                child;
            
            child = mixin.onFocusableContainerFocusEnter.call(me, e);
            
            if (child && child.isTab) {
                me.doActivateTab(child);
            }
        },
        
        focusChild: function(child, forward) {
            var me = this,
                mixin = me.mixins.focusablecontainer,
                nextChild;
            
            nextChild = mixin.focusChild.call(me, child, forward);
            
            if (me.activateOnFocus && nextChild && nextChild.isTab) {
                me.doActivateTab(nextChild);
            }
        }
    }
});
