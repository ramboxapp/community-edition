Ext.define('ExtThemeNeptune.Component', {
    override: 'Ext.Component',
    initComponent: function() {
        this.callParent();
        if (this.dock && this.border === undefined) {
            this.border = false;
        }
    },
    privates: {
        initStyles: function() {
            var me = this,
                hasOwnBorder = me.hasOwnProperty('border'),
                border = me.border;
            if (me.dock) {
                // prevent the superclass method from setting the border style.  We want to
                // allow dock layout to decide which borders to suppress.
                me.border = null;
            }
            me.callParent(arguments);
            if (hasOwnBorder) {
                me.border = border;
            } else {
                delete me.border;
            }
        }
    }
});

/**
 * The FocusManager is responsible for managing the following according to WAI ARIA practices:
 *
 * 1. Component focus
 * 2. Keyboard navigation
 * 3. Provide a visual cue for focused components, in the form of a focus ring/frame.
 *
 */
Ext.define('Ext.aria.FocusManager', {
    singleton: true,
    requires: [
        'Ext.util.KeyNav',
        'Ext.util.Observable'
    ],
    mixins: {
        observable: 'Ext.util.Observable'
    },
    /**
     * @property {Boolean} enabled
     * Whether or not the FocusManager is currently enabled
     */
    enabled: false,
    /**
     * @event disable
     * Fires when the FocusManager is disabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */
    /**
     * @event enable
     * Fires when the FocusManager is enabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */
    // Array to keep track of open windows
    windows: [],
    constructor: function(config) {
        var me = this,
            whitelist = me.whitelist,
            cache, i, len;
        me.mixins.observable.constructor.call(me, config);
    },
    /**
     * @private
     * Enables the FocusManager by turning on window management and keyboard navigation
     */
    enable: function() {
        var me = this,
            doc = Ext.getDoc();
        if (me.enabled) {
            return;
        }
        // initDom will call addFocusListener which needs the FocusManager to be enabled
        me.enabled = true;
        // map F6 to toggle focus among open windows
        me.toggleKeyMap = new Ext.util.KeyMap({
            target: doc,
            scope: me,
            defaultEventAction: 'stopEvent',
            key: Ext.event.Event.F6,
            fn: me.toggleWindow
        });
        me.fireEvent('enable', me);
    },
    onComponentBlur: function(cmp, e) {
        var me = this;
        if (me.focusedCmp === cmp) {
            me.previousFocusedCmp = cmp;
        }
        Ext.globalEvents.fireEvent('componentblur', me, cmp, me.previousFocusedCmp);
        return false;
    },
    onComponentFocus: function(cmp, e) {
        var me = this;
        if (Ext.globalEvents.fireEvent('beforecomponentfocus', me, cmp, me.previousFocusedCmp) === false) {
            me.clearComponent(cmp);
            return;
        }
        me.focusedCmp = cmp;
        return false;
    },
    // This should be fixed in https://sencha.jira.com/browse/EXTJS-14124
    onComponentHide: Ext.emptyFn,
    toggleWindow: function(key, e) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            focusedCmp = me.focusedCmp,
            curIndex = 0,
            newIndex = 0,
            current;
        if (length === 1) {
            return;
        }
        current = focusedCmp.isWindow ? focusedCmp : focusedCmp.up('window');
        if (current) {
            curIndex = me.findWindowIndex(current);
        }
        if (e.shiftKey) {
            newIndex = curIndex - 1;
            if (newIndex < 0) {
                newIndex = length - 1;
            }
        } else {
            newIndex = curIndex + 1;
            if (newIndex === length) {
                newIndex = 0;
            }
        }
        current = windows[newIndex];
        if (current.cmp.isWindow) {
            current.cmp.toFront();
        }
        current.cmp.focus(false, 100);
        return false;
    },
    addWindow: function(window) {
        var me = this,
            win = {
                cmp: window
            };
        me.windows.push(win);
    },
    removeWindow: function(window) {
        var me = this,
            windows = me.windows,
            current;
        if (windows.length === 1) {
            return;
        }
        current = me.findWindowIndex(window);
        if (current >= 0) {
            Ext.Array.erase(windows, current, 1);
        }
    },
    findWindowIndex: function(window) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            curIndex = -1,
            i;
        for (i = 0; i < length; i++) {
            if (windows[i].cmp === window) {
                curIndex = i;
                break;
            }
        }
        return curIndex;
    }
}, function() {
    var mgr = Ext['FocusManager'] = Ext.aria.FocusManager;
    Ext.onReady(function() {
        mgr.enable();
    });
});

/** */
Ext.define('Ext.aria.Component', {
    override: 'Ext.Component',
    requires: [
        'Ext.aria.FocusManager'
    ],
    /**
     * @cfg {String} [ariaRole] ARIA role for this Component, defaults to no role.
     * With no role, no other ARIA attributes are set.
     */
    /**
     * @cfg {String} [ariaLabel] ARIA label for this Component. It is best to use
     * {@link #ariaLabelledBy} option instead, because screen readers prefer
     * aria-labelledby attribute to aria-label. {@link #ariaLabel} and {@link #ariaLabelledBy}
     * config options are mutually exclusive.
     */
    /**
     * @cfg {String} [ariaLabelledBy] DOM selector for a child element that is to be used
     * as label for this Component, set in aria-labelledby attribute.
     * If the selector is by #id, the label element can be any existing element,
     * not necessarily a child of the main Component element.
     *
     * {@link #ariaLabelledBy} and {@link #ariaLabel} config options are mutually exclusive,
     * and ariaLabel has the higher precedence.
     */
    /**
     * @cfg {String} [ariaDescribedBy] DOM selector for a child element that is to be used
     * as description for this Component, set in aria-describedby attribute.
     * The selector works the same way as {@link #ariaLabelledBy}
     */
    /**
     * @cfg {Object} [ariaAttributes] An object containing ARIA attributes to be set
     * on this Component's ARIA element. Use this to set the attributes that cannot be
     * determined by the Component's state, such as `aria-live`, `aria-flowto`, etc.
     */
    /**
     * @cfg {Boolean} [ariaRenderAttributesToElement=true] ARIA attributes are usually
     * rendered into the main element of the Component using autoEl config option.
     * However for certain Components (form fields, etc.) the main element is
     * presentational and ARIA attributes should be rendered into child elements
     * of the Component markup; this is done using the Component templates.
     *
     * If this flag is set to `true` (default), the ARIA attributes will be applied
     * to the main element.
     * @private
     */
    ariaRenderAttributesToElement: true,
    statics: {
        ariaHighContrastModeCls: Ext.baseCSSPrefix + 'aria-highcontrast'
    },
    // Several of the attributes, like aria-controls and aria-activedescendant
    // need to refer to element ids which are not available at render time
    ariaApplyAfterRenderAttributes: function() {
        var me = this,
            role = me.ariaRole,
            attrs;
        if (role !== 'presentation') {
            attrs = me.ariaGetAfterRenderAttributes();
            me.ariaUpdate(attrs);
        }
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            role = me.ariaRole,
            attrs = {
                role: role
            };
        // It does not make much sense to set ARIA attributes
        // on purely presentational Component, or on a Component
        // with no ARIA role specified
        if (role === 'presentation' || role === undefined) {
            return attrs;
        }
        if (me.hidden) {
            attrs['aria-hidden'] = true;
        }
        if (me.disabled) {
            attrs['aria-disabled'] = true;
        }
        if (me.ariaLabel) {
            attrs['aria-label'] = me.ariaLabel;
        }
        Ext.apply(attrs, me.ariaAttributes);
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs = {},
            el;
        if (!me.ariaLabel && me.ariaLabelledBy) {
            el = me.ariaGetLabelEl(me.ariaLabelledBy);
            if (el) {
                attrs['aria-labelledby'] = el.id;
            }
        }
        if (me.ariaDescribedBy) {
            el = me.ariaGetLabelEl(me.ariaDescribedBy);
            if (el) {
                attrs['aria-describedby'] = el.id;
            }
        }
        return attrs;
    },
    /**
     * Updates the component's element properties
     * @private
     * @param {Ext.Element} [el] The element to set properties on
     * @param {Object[]} props Array of properties (name: value)
     */
    ariaUpdate: function(el, props) {
        // The one argument form updates the default ariaEl
        if (arguments.length === 1) {
            props = el;
            el = this.ariaGetEl();
        }
        if (!el) {
            return;
        }
        el.set(props);
    },
    /**
     * Return default ARIA element for this Component
     * @private
     * @return {Ext.Element} ARIA element
     */
    ariaGetEl: function() {
        return this.el;
    },
    /**
     * @private
     * Return default ARIA labelled-by element for this Component, if any
     *
     * @param {String} [selector] Element selector
     *
     * @return {Ext.Element} Label element, or null
     */
    ariaGetLabelEl: function(selector) {
        var me = this,
            el = null;
        if (selector) {
            if (/^#/.test(selector)) {
                selector = selector.replace(/^#/, '');
                el = Ext.get(selector);
            } else {
                el = me.ariaGetEl().down(selector);
            }
        }
        return el;
    },
    // Unlike getFocusEl, this one always returns Ext.Element
    ariaGetFocusEl: function() {
        var el = this.getFocusEl();
        while (el.isComponent) {
            el = el.getFocusEl();
        }
        return el;
    },
    onFocus: function(e, t, eOpts) {
        var me = this,
            mgr = Ext.aria.FocusManager,
            tip, el;
        me.callParent(arguments);
        if (me.tooltip && Ext.quickTipsActive) {
            tip = Ext.tip.QuickTipManager.getQuickTip();
            el = me.ariaGetEl();
            tip.cancelShow(el);
            tip.showByTarget(el);
        }
        if (me.hasFocus && mgr.enabled) {
            return mgr.onComponentFocus(me);
        }
    },
    onBlur: function(e, t, eOpts) {
        var me = this,
            mgr = Ext.aria.FocusManager;
        me.callParent(arguments);
        if (me.tooltip && Ext.quickTipsActive) {
            Ext.tip.QuickTipManager.getQuickTip().cancelShow(me.ariaGetEl());
        }
        if (!me.hasFocus && mgr.enabled) {
            return mgr.onComponentBlur(me);
        }
    },
    onDisable: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-disabled': true
        });
    },
    onEnable: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-disabled': false
        });
    },
    onHide: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-hidden': true
        });
    },
    onShow: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-hidden': false
        });
    }
}, function() {
    function detectHighContrastMode() {
        /* Absolute URL for test image
         * (data URIs are not supported by all browsers, and not properly removed when images are disabled in Firefox) */
        var imgSrc = "http://www.html5accessibility.com/tests/clear.gif",
            supports = {},
            div = document.createElement("div"),
            divEl = Ext.get(div),
            divStyle = div.style,
            img = document.createElement("img"),
            supports = {
                images: true,
                backgroundImages: true,
                borderColors: true,
                highContrastMode: false,
                lightOnDark: false
            };
        /* create div for testing if high contrast mode is on or images are turned off */
        div.id = "ui-helper-high-contrast";
        div.className = "ui-helper-hidden-accessible";
        divStyle.borderWidth = "1px";
        divStyle.borderStyle = "solid";
        divStyle.borderTopColor = "#F00";
        divStyle.borderRightColor = "#FF0";
        divStyle.backgroundColor = "#FFF";
        divStyle.width = "2px";
        /* For IE, div must be wider than the image inside it when hidden off screen */
        img.alt = "";
        div.appendChild(img);
        document.body.appendChild(div);
        divStyle.backgroundImage = "url(" + imgSrc + ")";
        img.src = imgSrc;
        var getColorValue = function(colorTxt) {
                var values = [],
                    colorValue = 0,
                    match;
                if (colorTxt.indexOf("rgb(") !== -1) {
                    values = colorTxt.replace("rgb(", "").replace(")", "").split(", ");
                } else if (colorTxt.indexOf("#") !== -1) {
                    match = colorTxt.match(colorTxt.length === 7 ? /^#(\S\S)(\S\S)(\S\S)$/ : /^#(\S)(\S)(\S)$/);
                    if (match) {
                        values = [
                            "0x" + match[1],
                            "0x" + match[2],
                            "0x" + match[3]
                        ];
                    }
                }
                for (var i = 0; i < values.length; i++) {
                    colorValue += parseInt(values[i]);
                }
                return colorValue;
            };
        var performCheck = function(event) {
                var bkImg = divEl.getStyle("backgroundImage"),
                    body = Ext.getBody();
                supports.images = img.offsetWidth === 1;
                supports.backgroundImages = !(bkImg !== null && (bkImg === "none" || bkImg === "url(invalid-url:)"));
                supports.borderColors = !(divEl.getStyle("borderTopColor") === divEl.getStyle("borderRightColor"));
                supports.highContrastMode = !supports.images || !supports.backgroundImages;
                supports.lightOnDark = getColorValue(divEl.getStyle("color")) - getColorValue(divEl.getStyle("backgroundColor")) > 0;
                if (Ext.isIE) {
                    div.outerHTML = "";
                } else /* prevent mixed-content warning, see http://support.microsoft.com/kb/925014 */
                {
                    document.body.removeChild(div);
                }
            };
        performCheck();
        return supports;
    }
    Ext.enableAria = true;
    Ext.onReady(function() {
        var supports = Ext.supports,
            flags, div;
        flags = Ext.isWindows ? detectHighContrastMode() : {};
        supports.HighContrastMode = !!flags.highContrastMode;
        if (supports.HighContrastMode) {
            Ext.getBody().addCls(Ext.Component.ariaHighContrastModeCls);
        }
    });
});

/** */
Ext.define('Ext.aria.Img', {
    override: 'Ext.Img',
    getElConfig: function() {
        var me = this,
            config;
        config = me.callParent();
        // Screen reader software requires images to have tabIndex
        config.tabIndex = -1;
        return config;
    },
    onRender: function() {
        var me = this;
        //<debugger>
        if (!me.alt) {
            Ext.log.warn('For ARIA compliance, IMG elements SHOULD have an alt attribute');
        }
        //</debugger>
        me.callParent();
    }
});

/** */
Ext.define('Ext.aria.panel.Tool', {
    override: 'Ext.panel.Tool',
    requires: [
        'Ext.aria.Component',
        'Ext.util.KeyMap'
    ],
    tabIndex: 0,
    destroy: function() {
        if (this.keyMap) {
            this.keyMap.destroy();
        }
        this.callParent();
    },
    ariaAddKeyMap: function(params) {
        var me = this;
        me.keyMap = new Ext.util.KeyMap(Ext.apply({
            target: me.el
        }, params));
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        if (me.tooltip && me.tooltipType === 'qtip') {
            attrs['aria-label'] = me.tooltip;
        }
        return attrs;
    }
});

Ext.define('ExtThemeNeptune.resizer.Splitter', {
    override: 'Ext.resizer.Splitter',
    size: 8
});

Ext.define('ExtThemeNeptune.toolbar.Toolbar', {
    override: 'Ext.toolbar.Toolbar',
    usePlainButtons: false,
    border: false
});

Ext.define('ExtThemeNeptune.layout.component.Dock', {
    override: 'Ext.layout.component.Dock',
    /**
     * This table contains the border removal classes indexed by the sum of the edges to
     * remove. Each edge is assigned a value:
     * 
     *  * `left` = 1
     *  * `bottom` = 2
     *  * `right` = 4
     *  * `top` = 8
     * 
     * @private
     */
    noBorderClassTable: [
        0,
        // TRBL
        Ext.baseCSSPrefix + 'noborder-l',
        // 0001 = 1
        Ext.baseCSSPrefix + 'noborder-b',
        // 0010 = 2
        Ext.baseCSSPrefix + 'noborder-bl',
        // 0011 = 3
        Ext.baseCSSPrefix + 'noborder-r',
        // 0100 = 4
        Ext.baseCSSPrefix + 'noborder-rl',
        // 0101 = 5
        Ext.baseCSSPrefix + 'noborder-rb',
        // 0110 = 6
        Ext.baseCSSPrefix + 'noborder-rbl',
        // 0111 = 7
        Ext.baseCSSPrefix + 'noborder-t',
        // 1000 = 8
        Ext.baseCSSPrefix + 'noborder-tl',
        // 1001 = 9
        Ext.baseCSSPrefix + 'noborder-tb',
        // 1010 = 10
        Ext.baseCSSPrefix + 'noborder-tbl',
        // 1011 = 11
        Ext.baseCSSPrefix + 'noborder-tr',
        // 1100 = 12
        Ext.baseCSSPrefix + 'noborder-trl',
        // 1101 = 13
        Ext.baseCSSPrefix + 'noborder-trb',
        // 1110 = 14
        Ext.baseCSSPrefix + 'noborder-trbl'
    ],
    // 1111 = 15
    /**
     * The numeric values assigned to each edge indexed by the `dock` config value.
     * @private
     */
    edgeMasks: {
        top: 8,
        right: 4,
        bottom: 2,
        left: 1
    },
    handleItemBorders: function() {
        var me = this,
            edges = 0,
            maskT = 8,
            maskR = 4,
            maskB = 2,
            maskL = 1,
            owner = me.owner,
            bodyBorder = owner.bodyBorder,
            ownerBorder = owner.border,
            collapsed = me.collapsed,
            edgeMasks = me.edgeMasks,
            noBorderCls = me.noBorderClassTable,
            dockedItemsGen = owner.dockedItems.generation,
            b, borderCls, docked, edgesTouched, i, ln, item, dock, lastValue, mask, addCls, removeCls;
        if (me.initializedBorders === dockedItemsGen) {
            return;
        }
        addCls = [];
        removeCls = [];
        borderCls = me.getBorderCollapseTable();
        noBorderCls = me.getBorderClassTable ? me.getBorderClassTable() : noBorderCls;
        me.initializedBorders = dockedItemsGen;
        // Borders have to be calculated using expanded docked item collection.
        me.collapsed = false;
        docked = me.getDockedItems();
        me.collapsed = collapsed;
        for (i = 0 , ln = docked.length; i < ln; i++) {
            item = docked[i];
            if (item.ignoreBorderManagement) {
                // headers in framed panels ignore border management, so we do not want
                // to set "satisfied" on the edge in question
                
                continue;
            }
            dock = item.dock;
            mask = edgesTouched = 0;
            addCls.length = 0;
            removeCls.length = 0;
            if (dock !== 'bottom') {
                if (edges & maskT) {
                    // if (not touching the top edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskT;
                    }
                }
                if (b === false) {
                    mask += maskT;
                }
            }
            if (dock !== 'left') {
                if (edges & maskR) {
                    // if (not touching the right edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskR;
                    }
                }
                if (b === false) {
                    mask += maskR;
                }
            }
            if (dock !== 'top') {
                if (edges & maskB) {
                    // if (not touching the bottom edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskB;
                    }
                }
                if (b === false) {
                    mask += maskB;
                }
            }
            if (dock !== 'right') {
                if (edges & maskL) {
                    // if (not touching the left edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskL;
                    }
                }
                if (b === false) {
                    mask += maskL;
                }
            }
            if ((lastValue = item.lastBorderMask) !== mask) {
                item.lastBorderMask = mask;
                if (lastValue) {
                    removeCls[0] = noBorderCls[lastValue];
                }
                if (mask) {
                    addCls[0] = noBorderCls[mask];
                }
            }
            if ((lastValue = item.lastBorderCollapse) !== edgesTouched) {
                item.lastBorderCollapse = edgesTouched;
                if (lastValue) {
                    removeCls[removeCls.length] = borderCls[lastValue];
                }
                if (edgesTouched) {
                    addCls[addCls.length] = borderCls[edgesTouched];
                }
            }
            if (removeCls.length) {
                item.removeCls(removeCls);
            }
            if (addCls.length) {
                item.addCls(addCls);
            }
            // mask can use += but edges must use |= because there can be multiple items
            // on an edge but the mask is reset per item
            edges |= edgeMasks[dock];
        }
        // = T, R, B or L (8, 4, 2 or 1)
        mask = edgesTouched = 0;
        addCls.length = 0;
        removeCls.length = 0;
        if (edges & maskT) {
            // if (not touching the top edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskT;
            }
        }
        if (b === false) {
            mask += maskT;
        }
        if (edges & maskR) {
            // if (not touching the right edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskR;
            }
        }
        if (b === false) {
            mask += maskR;
        }
        if (edges & maskB) {
            // if (not touching the bottom edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskB;
            }
        }
        if (b === false) {
            mask += maskB;
        }
        if (edges & maskL) {
            // if (not touching the left edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskL;
            }
        }
        if (b === false) {
            mask += maskL;
        }
        if ((lastValue = me.lastBodyBorderMask) !== mask) {
            me.lastBodyBorderMask = mask;
            if (lastValue) {
                removeCls[0] = noBorderCls[lastValue];
            }
            if (mask) {
                addCls[0] = noBorderCls[mask];
            }
        }
        if ((lastValue = me.lastBodyBorderCollapse) !== edgesTouched) {
            me.lastBodyBorderCollapse = edgesTouched;
            if (lastValue) {
                removeCls[removeCls.length] = borderCls[lastValue];
            }
            if (edgesTouched) {
                addCls[addCls.length] = borderCls[edgesTouched];
            }
        }
        if (removeCls.length) {
            owner.removeBodyCls(removeCls);
        }
        if (addCls.length) {
            owner.addBodyCls(addCls);
        }
    },
    onRemove: function(item) {
        var lastBorderMask = item.lastBorderMask;
        if (!item.isDestroyed && !item.ignoreBorderManagement && lastBorderMask) {
            item.lastBorderMask = 0;
            item.removeCls(this.noBorderClassTable[lastBorderMask]);
        }
        this.callParent([
            item
        ]);
    }
});

Ext.define('ExtThemeNeptune.panel.Panel', {
    override: 'Ext.panel.Panel',
    border: false,
    bodyBorder: false,
    initBorderProps: Ext.emptyFn,
    initBodyBorder: function() {
        // The superclass method converts a truthy bodyBorder into a number and sets
        // an inline border-width style on the body element.  This prevents that from
        // happening if borderBody === true so that the body will get its border-width
        // the stylesheet.
        if (this.bodyBorder !== true) {
            this.callParent();
        }
    }
});

/** */
Ext.define('Ext.aria.panel.Panel', {
    override: 'Ext.panel.Panel',
    closeText: 'Close Panel',
    collapseText: 'Collapse Panel',
    expandText: 'Expand Panel',
    untitledText: 'Untitled Panel',
    onBoxReady: function() {
        var me = this,
            Event = Ext.event.Event,
            collapseTool = me.collapseTool,
            header, tools, i, len;
        me.callParent();
        if (collapseTool) {
            collapseTool.ariaUpdate({
                'aria-label': me.collapsed ? me.expandText : me.collapseText
            });
            collapseTool.ariaAddKeyMap({
                key: [
                    Event.ENTER,
                    Event.SPACE
                ],
                handler: me.toggleCollapse,
                scope: me
            });
        }
        if (me.closable) {
            toolBtn = me.down('tool[type=close]');
            if (toolBtn) {
                toolBtn.ariaUpdate({
                    'aria-label': me.closeText
                });
                toolBtn.ariaAddKeyMap({
                    key: [
                        Event.ENTER,
                        Event.SPACE
                    ],
                    handler: me.close,
                    scope: me
                });
            }
        }
        header = me.getHeader();
    },
    setTitle: function(newTitle) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-label': newTitle
        });
    },
    createReExpander: function(direction, defaults) {
        var me = this,
            Event = Ext.event.Event,
            opposite, result, tool;
        opposite = me.getOppositeDirection(direction);
        result = me.callParent(arguments);
        tool = result.down('tool[type=expand-' + opposite + ']');
        if (tool) {
            tool.on('boxready', function() {
                tool.ariaUpdate({
                    'aria-label': me.collapsed ? me.expandText : me.collapseText
                });
                tool.ariaAddKeyMap({
                    key: [
                        Event.ENTER,
                        Event.SPACE
                    ],
                    handler: me.toggleCollapse,
                    scope: me
                });
            }, {
                single: true
            });
        }
        return result;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.collapsible) {
            attrs['aria-expanded'] = !me.collapsed;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            newAttrs = {},
            attrs, toolBtn, textEl;
        attrs = me.callParent(arguments);
        if (me.ariaRole === 'presentation') {
            return attrs;
        }
        if (me.title) {
            textEl = me.ariaGetTitleTextEl();
            if (textEl) {
                newAttrs = {
                    'aria-labelledby': textEl.id
                };
            } else {
                newAttrs = {
                    'aria-label': me.title
                };
            }
        } else if (me.ariaLabel) {
            newAttrs = {
                'aria-label': me.ariaLabel
            };
        }
        Ext.apply(attrs, newAttrs);
        return attrs;
    },
    ariaGetTitleTextEl: function() {
        var header = this.header;
        return header && header.titleCmp && header.titleCmp.textEl || null;
    },
    afterExpand: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': true
        });
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), {
                'aria-label': me.collapseText
            });
        }
    },
    afterCollapse: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': false
        });
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), {
                'aria-label': me.expandText
            });
        }
    }
});

/** */
Ext.define('Ext.aria.form.field.Base', {
    override: 'Ext.form.field.Base',
    requires: [
        'Ext.util.Format',
        'Ext.aria.Component'
    ],
    /**
     * @cfg {String} formatText The text to use for the field format announcement
     * placed in the `title` attribute of the input field. This format will not
     * be used if the title attribute is configured explicitly.
     */
    ariaRenderAttributesToElement: false,
    msgTarget: 'side',
    // use this scheme because it is the only one working for now
    getSubTplData: function() {
        var me = this,
            fmt = Ext.util.Format.attributes,
            data, attrs;
        data = me.callParent(arguments);
        attrs = me.ariaGetRenderAttributes();
        // Role is rendered separately
        delete attrs.role;
        data.inputAttrTpl = [
            data.inputAttrTpl,
            fmt(attrs)
        ].join(' ');
        return data;
    },
    ariaGetEl: function() {
        return this.inputEl;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            readOnly = me.readOnly,
            formatText = me.formatText,
            attrs;
        attrs = me.callParent();
        if (readOnly != null) {
            attrs['aria-readonly'] = !!readOnly;
        }
        if (formatText && !attrs.title) {
            attrs.title = Ext.String.format(formatText, me.format);
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            labelEl = me.labelEl,
            attrs;
        attrs = me.callParent();
        if (labelEl) {
            attrs['aria-labelledby'] = labelEl.id;
        }
        return attrs;
    },
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': readOnly
        });
    },
    markInvalid: function(f, isValid) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': true
        });
    },
    clearInvalid: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': false
        });
    }
});

/** */
Ext.define('Ext.aria.form.field.Display', {
    override: 'Ext.form.field.Display',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    msgTarget: 'none',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-readonly'] = true;
        return attrs;
    }
});

Ext.define('ExtThemeNeptune.panel.Table', {
    override: 'Ext.panel.Table',
    initComponent: function() {
        var me = this;
        if (!me.hasOwnProperty('bodyBorder') && !me.hideHeaders) {
            me.bodyBorder = true;
        }
        me.callParent();
    }
});

/** */
Ext.define('Ext.aria.view.View', {
    override: 'Ext.view.View',
    initComponent: function() {
        var me = this,
            selModel;
        me.callParent();
        selModel = me.getSelectionModel();
        selModel.on({
            scope: me,
            select: me.ariaSelect,
            deselect: me.ariaDeselect
        });
        me.on({
            scope: me,
            refresh: me.ariaInitViewItems,
            itemadd: me.ariaItemAdd,
            itemremove: me.ariaItemRemove
        });
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs, mode;
        attrs = me.callParent();
        mode = me.getSelectionModel().getSelectionMode();
        if (mode !== 'SINGLE') {
            attrs['aria-multiselectable'] = true;
        }
        if (me.title) {
            attrs['aria-label'] = me.title;
        }
        return attrs;
    },
    // For Views, we have to apply ARIA attributes to the list items
    // post factum, because we have no control over the template
    // that is used to create the items.
    ariaInitViewItems: function() {
        var me = this,
            updateSize = me.pageSize || me.store.buffered,
            pos = me.store.requestStart + 1,
            nodes, node, size, i, len;
        nodes = me.getNodes();
        size = me.store.getTotalCount();
        for (i = 0 , len = nodes.length; i < len; i++) {
            node = nodes[i];
            if (!node.id) {
                node.setAttribute('id', Ext.id());
            }
            node.setAttribute('role', me.itemAriaRole);
            node.setAttribute('aria-selected', false);
            if (updateSize) {
                node.setAttribute('aria-setsize', size);
                node.setAttribute('aria-posinset', pos + i);
            }
        }
    },
    ariaSelect: function(selModel, record) {
        var me = this,
            node;
        node = me.getNode(record);
        if (node) {
            node.setAttribute('aria-selected', true);
            me.ariaUpdate({
                'aria-activedescendant': node.id
            });
        }
    },
    ariaDeselect: function(selModel, record) {
        var me = this,
            node;
        node = me.getNode(record);
        if (node) {
            node.removeAttribute('aria-selected');
            me.ariaUpdate({
                'aria-activedescendant': undefined
            });
        }
    },
    ariaItemRemove: function(records, index, nodes) {
        if (!nodes) {
            return;
        }
        var me = this,
            ariaSelected, i, len;
        ariaSelected = me.el.getAttribute('aria-activedescendant');
        for (i = 0 , len = nodes.length; i < len; i++) {
            if (ariaSelected === nodes[i].id) {
                me.ariaUpdate({
                    'aria-activedescendant': undefined
                });
                break;
            }
        }
    },
    ariaItemAdd: function(records, index, nodes) {
        this.ariaInitViewItems(records, index, nodes);
    },
    setTitle: function(title) {
        var me = this;
        me.title = title;
        me.ariaUpdate({
            'aria-label': title
        });
    }
});

/** */
Ext.define('Ext.aria.view.Table', {
    override: 'Ext.view.Table',
    requires: [
        'Ext.aria.view.View'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            plugins = me.plugins,
            readOnly = true,
            attrs, i, len;
        attrs = me.callParent();
        if (plugins) {
            for (i = 0 , len = plugins.length; i < len; i++) {
                // Both CellEditor and RowEditor have 'editing' property
                if ('editing' in plugins[i]) {
                    readOnly = false;
                    break;
                }
            }
        }
        attrs['aria-readonly'] = readOnly;
        return attrs;
    },
    // Table Views are rendered from templates that are rarely overridden,
    // so we can render ARIA attributes in the templates instead of applying
    // them after the fact.
    ariaItemAdd: Ext.emptyFn,
    ariaItemRemove: Ext.emptyFn,
    ariaInitViewItems: Ext.emptyFn,
    ariaFindNode: function(selModel, record, row, column) {
        var me = this,
            node;
        if (selModel.isCellModel) {
            // When column is hidden, its index will be -1
            if (column > -1) {
                node = me.getCellByPosition({
                    row: row,
                    column: column
                });
            } else {
                node = me.getCellByPosition({
                    row: row,
                    column: 0
                });
            }
        } else {
            node = Ext.fly(me.getNode(record));
        }
        return node;
    },
    ariaSelect: function(selModel, record, row, column) {
        var me = this,
            node;
        node = me.ariaFindNode(selModel, record, row, column);
        if (node) {
            node.set({
                'aria-selected': true
            });
            me.ariaUpdate({
                'aria-activedescendant': node.id
            });
        }
    },
    ariaDeselect: function(selModel, record, row, column) {
        var me = this,
            node;
        node = me.ariaFindNode(selModel, record, row, column);
        if (node) {
            node.set({
                'aria-selected': undefined
            });
            me.ariaUpdate({
                'aria-activedescendant': undefined
            });
        }
    },
    renderRow: function(record, rowIdx, out) {
        var me = this,
            rowValues = me.rowValues;
        rowValues.ariaRowAttr = 'role="row"';
        return me.callParent(arguments);
    },
    renderCell: function(column, record, recordIndex, rowIndex, columnIndex, out) {
        var me = this,
            cellValues = me.cellValues;
        cellValues.ariaCellAttr = 'role="gridcell"';
        cellValues.ariaCellInnerAttr = '';
        return me.callParent(arguments);
    },
    collectData: function(records, startIndex) {
        var me = this,
            data;
        data = me.callParent(arguments);
        Ext.applyIf(data, {
            ariaTableAttr: 'role="presentation"',
            ariaTbodyAttr: 'role="rowgroup"'
        });
        return data;
    }
});

/** */
Ext.define('Ext.aria.form.field.Checkbox', {
    override: 'Ext.form.field.Checkbox',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    /**
     * @cfg {Boolean} [required=false] Set to `true` to make screen readers announce this
     * checkbox as required. Note that no field validation is performed, and this option
     * only affects ARIA attributes set for this field.
     */
    isFieldLabelable: false,
    hideLabel: true,
    ariaGetEl: function() {
        return this.inputEl;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-checked'] = me.getValue();
        if (me.required) {
            attrs['aria-required'] = true;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            boxLabelEl = me.boxLabelEl,
            attrs;
        attrs = me.callParent();
        if (me.boxLabel && !me.fieldLabel && boxLabelEl) {
            attrs['aria-labelledby'] = boxLabelEl.id;
        }
        return attrs;
    },
    onChange: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-checked': me.getValue()
        });
    }
});

/** */
Ext.define('Ext.aria.grid.header.Container', {
    override: 'Ext.grid.header.Container',
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        delete attrs['aria-label'];
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.grid.column.Column', {
    override: 'Ext.grid.column.Column',
    ariaSortStates: {
        ASC: 'ascending',
        DESC: 'descending'
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            sortState = me.sortState,
            states = me.ariaSortStates,
            attr;
        attr = me.callParent();
        attr['aria-sort'] = states[sortState];
        return attr;
    },
    setSortState: function(sorter) {
        var me = this,
            states = me.ariaSortStates,
            oldSortState = me.sortState,
            newSortState;
        me.callParent(arguments);
        newSortState = me.sortState;
        if (oldSortState !== newSortState) {
            me.ariaUpdate({
                'aria-sort': states[newSortState]
            });
        }
    }
});

/** */
Ext.define('Ext.aria.grid.NavigationModel', {
    override: 'Ext.grid.NavigationModel',
    // WAI-ARIA recommends no wrapping around row ends in navigation mode
    preventWrap: true
});

/** */
Ext.define('Ext.aria.form.field.Text', {
    override: 'Ext.form.field.Text',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.allowBlank !== undefined) {
            attrs['aria-required'] = !me.allowBlank;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.button.Button', {
    override: 'Ext.button.Button',
    requires: [
        'Ext.aria.Component'
    ],
    showEmptyMenu: true,
    constructor: function(config) {
        // Don't warn if we're under the slicer
        if (config.menu && !Ext.theme) {
            this.ariaCheckMenuConfig(config);
        }
        this.callParent(arguments);
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            menu = me.menu,
            attrs;
        attrs = me.callParent(arguments);
        if (menu) {
            attrs['aria-haspopup'] = true;
            attrs['aria-owns'] = menu.id;
        }
        if (me.enableToggle) {
            attrs['aria-pressed'] = me.pressed;
        }
        return attrs;
    },
    toggle: function(state) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            "aria-pressed": me.pressed
        });
    },
    ariaGetLabelEl: function() {
        return this.btnInnerEl;
    },
    // ARIA requires that buttons with a menu react to
    // Space and Enter keys by showing the menu. This
    // behavior conflicts with the various handler
    // functions we support in Ext JS; to avoid problems
    // we check if we have the menu *and* handlers, or
    // `click` event listeners, and raise an error if we do
    ariaCheckMenuConfig: function(cfg) {
        var text = cfg.text || cfg.html || 'Unknown';
        if (cfg.enableToggle || cfg.toggleGroup) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "'s behavior will conflict with " + "toggling");
        }
        if (cfg.href) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "' cannot behave as a link");
        }
        if (cfg.handler || (cfg.listeners && cfg.listeners.click)) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "' should display the menu " + "on SPACE or ENTER keys, which will conflict with the " + "button handler");
        }
    }
});

/** */
Ext.define('Ext.aria.tab.Tab', {
    override: 'Ext.tab.Tab',
    //<locale>
    closeText: 'closable',
    //</locale>
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-selected'] = !!me.active;
        if (me.card && me.card.getEl()) {
            attrs['aria-controls'] = me.card.getEl().id;
        }
        return attrs;
    },
    activate: function(suppressEvent) {
        this.callParent([
            suppressEvent
        ]);
        this.ariaUpdate({
            'aria-selected': true
        });
    },
    deactivate: function(suppressEvent) {
        this.callParent([
            suppressEvent
        ]);
        this.ariaUpdate({
            'aria-selected': false
        });
    }
});

/** */
Ext.define('Ext.aria.tab.Bar', {
    override: 'Ext.tab.Bar',
    requires: [
        'Ext.aria.tab.Tab'
    ],
    findNextActivatable: function(toClose) {
        var me = this,
            next;
        next = me.callParent(arguments);
        // If the default algorithm can't find the next tab to activate,
        // fall back to the currently active tab. We need to have a focused
        // tab at all times.
        if (!next) {
            next = me.activeTab;
        }
        return next;
    }
});

/** */
Ext.define('Ext.aria.tab.Panel', {
    override: 'Ext.tab.Panel',
    requires: [
        'Ext.layout.container.Card',
        'Ext.aria.tab.Bar'
    ],
    isTabPanel: true,
    onAdd: function(item, index) {
        item.ariaRole = 'tabpanel';
        this.callParent(arguments);
    },
    setActiveTab: function(card) {
        var me = this,
            items, item, isActive, i, len;
        me.callParent(arguments);
        items = me.getRefItems();
        for (i = 0 , len = items.length; i < len; i++) {
            item = items[i];
            if (item.ariaRole === 'tabpanel') {
                isActive = item === card;
                item.ariaUpdate({
                    'aria-expanded': isActive,
                    'aria-hidden': !isActive
                });
            }
        }
    },
    ariaIsOwnTab: function(cmp) {
        return cmp.isTab && cmp.isGroupedBy.ownerCt === this;
    }
});

/** */
Ext.define('Ext.aria.window.Window', {
    override: 'Ext.window.Window',
    requires: [
        'Ext.aria.panel.Panel',
        'Ext.util.ComponentDragger',
        'Ext.util.Region',
        'Ext.EventManager',
        'Ext.aria.FocusManager'
    ],
    closeText: 'Close Window',
    moveText: 'Move Window',
    resizeText: 'Resize Window',
    deltaMove: 10,
    deltaResize: 10,
    initComponent: function() {
        var me = this,
            tools = me.tools;
        // Add buttons to move and resize the window,
        // unless it's a Toast
        if (!tools) {
            me.tools = tools = [];
        }
        //TODO: Create new tools
        if (!me.isToast) {
            tools.unshift({
                type: 'resize',
                tooltip: me.resizeText
            }, {
                type: 'move',
                tooltip: me.moveText
            });
        }
        me.callParent();
    },
    onBoxReady: function() {
        var me = this,
            EO = Ext.event.Event,
            toolBtn;
        me.callParent();
        if (me.isToast) {
            return;
        }
        if (me.draggable) {
            toolBtn = me.down('tool[type=move]');
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), {
                    'aria-label': me.moveText
                });
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [
                        EO.UP,
                        EO.DOWN,
                        EO.LEFT,
                        EO.RIGHT
                    ],
                    handler: me.moveWindow,
                    scope: me
                });
            }
        }
        if (me.resizable) {
            toolBtn = me.down('tool[type=resize]');
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), {
                    'aria-label': me.resizeText
                });
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [
                        EO.UP,
                        EO.DOWN,
                        EO.LEFT,
                        EO.RIGHT
                    ],
                    handler: me.resizeWindow,
                    scope: me
                });
            }
        }
    },
    onEsc: function(k, e) {
        var me = this;
        if (e.within(me.el)) {
            e.stopEvent();
            me.close();
        }
    },
    onShow: function() {
        var me = this;
        me.callParent(arguments);
        Ext.aria.FocusManager.addWindow(me);
    },
    afterHide: function() {
        var me = this;
        Ext.aria.FocusManager.removeWindow(me);
        me.callParent(arguments);
    },
    moveWindow: function(keyCode, e) {
        var me = this,
            delta = me.deltaMove,
            pos = me.getPosition(),
            EO = Ext.event.Event;
        switch (keyCode) {
            case EO.RIGHT:
                pos[0] += delta;
                break;
            case EO.LEFT:
                pos[0] -= delta;
                break;
            case EO.UP:
                pos[1] -= delta;
                break;
            case EO.DOWN:
                pos[1] += delta;
                break;
        }
        me.setPagePosition(pos);
        e.stopEvent();
    },
    resizeWindow: function(keyCode, e) {
        var me = this,
            delta = me.deltaResize,
            width = me.getWidth(),
            height = me.getHeight(),
            EO = Ext.event.Event;
        switch (keyCode) {
            case EO.RIGHT:
                width += delta;
                break;
            case EO.LEFT:
                width -= delta;
                break;
            case EO.UP:
                height -= delta;
                break;
            case EO.DOWN:
                height += delta;
                break;
        }
        me.setSize(width, height);
        e.stopEvent();
    }
});

/** */
Ext.define('Ext.aria.tip.QuickTip', {
    override: 'Ext.tip.QuickTip',
    showByTarget: function(targetEl) {
        var me = this,
            target, size, xy, x, y;
        target = me.targets[targetEl.id];
        if (!target) {
            return;
        }
        me.activeTarget = target;
        me.activeTarget.el = Ext.get(targetEl).dom;
        me.anchor = me.activeTarget.anchor;
        size = targetEl.getSize();
        xy = targetEl.getXY();
        me.showAt([
            xy[0],
            xy[1] + size.height
        ]);
    }
});

/** */
Ext.define('Ext.aria.button.Split', {
    override: 'Ext.button.Split',
    constructor: function(config) {
        var ownerCt = config.ownerCt;
        // Warn unless the button belongs to a date picker,
        // the user can't do anything about that
        // Also don't warn if we're under the slicer
        if (!Ext.theme && (!ownerCt || !ownerCt.isDatePicker)) {
            Ext.log.warn("Using Split buttons is not recommended in WAI-ARIA " + "compliant applications, because their behavior conflicts " + "with accessibility best practices. See WAI-ARIA 1.0 " + "Authoring guide: http://www.w3.org/TR/wai-aria-practices/#menubutton");
        }
        this.callParent(arguments);
    }
});

/** */
Ext.define('Ext.aria.button.Cycle', {
    override: 'Ext.button.Cycle',
    constructor: function(config) {
        // Don't warn if we're under the slicer
        if (!Ext.theme) {
            Ext.log.warn("Using Cycle buttons is not recommended in WAI-ARIA " + "compliant applications, because their behavior conflicts " + "with accessibility best practices. See WAI-ARIA 1.0 " + "Authoring guide: http://www.w3.org/TR/wai-aria-practices/#menubutton");
        }
        this.callParent(arguments);
    }
});

Ext.define('ExtThemeNeptune.container.ButtonGroup', {
    override: 'Ext.container.ButtonGroup',
    usePlainButtons: false
});

/** */
Ext.define('Ext.aria.container.Viewport', {
    override: 'Ext.container.Viewport',
    initComponent: function() {
        var me = this,
            items = me.items,
            layout = me.layout,
            i, len, item, el;
        if (items && layout === 'border' || (Ext.isObject(layout) && layout.type === 'border')) {
            for (i = 0 , len = items.length; i < len; i++) {
                item = items[i];
                if (item.region) {
                    Ext.applyIf(item, {
                        ariaRole: 'region',
                        headerRole: 'heading'
                    });
                }
            }
        }
        me.callParent();
    },
    ariaGetAfterRenderAttributes: function() {
        var attrs = this.callParent();
        // Viewport's role attribute is applied to the element that is never rendered,
        // so we have to do it post factum
        attrs.role = this.ariaRole;
        // Viewport should not have a label, document title should be announced instead
        delete attrs['aria-label'];
        delete attrs['aria-labelledby'];
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.field.TextArea', {
    override: 'Ext.form.field.TextArea',
    requires: [
        'Ext.aria.form.field.Text'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-multiline'] = true;
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.window.MessageBox', {
    override: 'Ext.window.MessageBox',
    requires: [
        'Ext.aria.window.Window',
        'Ext.aria.form.field.Text',
        'Ext.aria.form.field.TextArea',
        'Ext.aria.form.field.Display',
        'Ext.aria.button.Button'
    ]
});

/** */
Ext.define('Ext.aria.form.FieldContainer', {
    override: 'Ext.form.FieldContainer',
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        if (me.fieldLabel && me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.CheckboxGroup', {
    override: 'Ext.form.CheckboxGroup',
    requires: [
        'Ext.aria.form.FieldContainer',
        'Ext.aria.form.field.Base'
    ],
    msgTarget: 'side',
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': !!readOnly
        });
    },
    markInvalid: function(f, isValid) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': !!isValid
        });
    },
    clearInvalid: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': false
        });
    }
});

/** */
Ext.define('Ext.aria.form.FieldSet', {
    override: 'Ext.form.FieldSet',
    expandText: 'Expand',
    collapseText: 'Collapse',
    onBoxReady: function() {
        var me = this,
            checkboxCmp = me.checkboxCmp,
            toggleCmp = me.toggleCmp,
            legend = me.legend,
            el;
        me.callParent(arguments);
        if (!legend) {
            return;
        }
        // mark the legend and the checkbox or drop down inside the legend immune to collapse
        // so when they get focus, isVisible(deep) will not return true for them when the fieldset is collapsed
        legend.collapseImmune = true;
        legend.getInherited().collapseImmune = true;
        if (checkboxCmp) {
            checkboxCmp.collapseImmune = true;
            checkboxCmp.getInherited().collapseImmune = true;
            checkboxCmp.getActionEl().set({
                title: me.expandText + ' ' + me.title
            });
        }
        if (toggleCmp) {
            toggleCmp.collapseImmune = true;
            toggleCmp.getInherited().collapseImmune = true;
            // The toggle component is missing a key map to respond to enter and space
            toggleCmp.keyMap = new Ext.util.KeyMap({
                target: toggleCmp.el,
                key: [
                    Ext.event.Event.ENTER,
                    Ext.event.Event.SPACE
                ],
                handler: function(key, e, eOpt) {
                    e.stopEvent();
                    me.toggle();
                },
                scope: me
            });
            el = toggleCmp.getActionEl();
            if (me.collapsed) {
                el.set({
                    title: me.expandText + ' ' + me.title
                });
            } else {
                el.set({
                    title: me.collapseText + ' ' + me.title
                });
            }
        }
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-expanded'] = !me.collapsed;
        return attrs;
    },
    setExpanded: function(expanded) {
        var me = this,
            toggleCmp = me.toggleCmp,
            el;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': expanded
        });
        // Update the title
        if (toggleCmp) {
            el = toggleCmp.getActionEl();
            if (!expanded) {
                el.set({
                    title: me.expandText + ' ' + me.title
                });
            } else {
                el.set({
                    title: me.collapseText + ' ' + me.title
                });
            }
        }
    }
});

/** */
Ext.define('Ext.aria.form.RadioGroup', {
    override: 'Ext.form.RadioGroup',
    requires: [
        'Ext.aria.form.CheckboxGroup'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.allowBlank !== undefined) {
            attrs['aria-required'] = !me.allowBlank;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.field.Picker', {
    override: 'Ext.form.field.Picker',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-haspopup'] = true;
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs, picker;
        attrs = me.callParent();
        picker = me.getPicker();
        if (picker) {
            attrs['aria-owns'] = picker.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.view.BoundListKeyNav', {
    override: 'Ext.view.BoundListKeyNav',
    requires: [
        'Ext.aria.view.View'
    ],
    focusItem: function(item) {
        var me = this,
            boundList = me.view;
        if (typeof item === 'number') {
            item = boundList.all.item(item);
        }
        if (item) {
            boundList.ariaUpdate({
                'aria-activedescendant': Ext.id(item, me.id + '-')
            });
            me.callParent([
                item
            ]);
        }
    }
});

/** */
Ext.define('Ext.aria.form.field.Number', {
    override: 'Ext.form.field.Number',
    ariaGetRenderAttributes: function() {
        var me = this,
            min = me.minValue,
            max = me.maxValue,
            attrs, v;
        attrs = me.callParent(arguments);
        v = me.getValue();
        // Skip the defaults
        if (min !== Number.NEGATIVE_INFINITY) {
            attrs['aria-valuemin'] = isFinite(min) ? min : 'NaN';
        }
        if (max !== Number.MAX_VALUE) {
            attrs['aria-valuemax'] = isFinite(max) ? max : 'NaN';
        }
        attrs['aria-valuenow'] = v !== null && isFinite(v) ? v : 'NaN';
        return attrs;
    },
    onChange: function(f) {
        var me = this,
            v;
        me.callParent(arguments);
        v = me.getValue();
        me.ariaUpdate({
            'aria-valuenow': v !== null && isFinite(v) ? v : 'NaN'
        });
    },
    setMinValue: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-valuemin': isFinite(me.minValue) ? me.minValue : 'NaN'
        });
    },
    setMaxValue: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-valuemax': isFinite(me.maxValue) ? me.maxValue : 'NaN'
        });
    }
});

Ext.define('ExtThemeNeptune.toolbar.Paging', {
    override: 'Ext.toolbar.Paging',
    defaultButtonUI: 'plain-toolbar',
    inputItemWidth: 40
});

/** */
Ext.define('Ext.aria.view.BoundList', {
    override: 'Ext.view.BoundList',
    onHide: function() {
        this.ariaUpdate({
            "aria-activedescendant": Ext.emptyString
        });
        // Maintainer: onHide takes arguments
        this.callParent(arguments);
    }
});

/** */
Ext.define('Ext.aria.form.field.ComboBox', {
    override: 'Ext.form.field.ComboBox',
    requires: [
        'Ext.aria.form.field.Picker'
    ],
    createPicker: function() {
        var me = this,
            picker;
        picker = me.callParent(arguments);
        if (picker) {
            // update aria-activedescendant whenever the picker highlight changes
            me.mon(picker, {
                highlightitem: me.ariaUpdateActiveDescendant,
                scope: me
            });
        }
        return picker;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-readonly'] = !!(!me.editable || me.readOnly);
        attrs['aria-expanded'] = !!me.isExpanded;
        attrs['aria-autocomplete'] = "list";
        return attrs;
    },
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': me.readOnly
        });
    },
    setEditable: function(editable) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': !me.editable
        });
    },
    onExpand: function() {
        var me = this,
            selected = me.picker.getSelectedNodes();
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': true,
            'aria-activedescendant': (selected.length ? selected[0].id : undefined)
        });
    },
    onCollapse: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': false,
            'aria-activedescendant': undefined
        });
    },
    ariaUpdateActiveDescendant: function(list) {
        this.ariaUpdate({
            'aria-activedescendant': list.highlightedItem ? list.highlightedItem.id : undefined
        });
    }
});

Ext.define('ExtThemeNeptune.picker.Month', {
    override: 'Ext.picker.Month',
    // Monthpicker contains logic that reduces the margins of the month items if it detects
    // that the text has wrapped.  This can happen in the classic theme  in certain
    // locales such as zh_TW.  In order to work around this, Month picker measures
    // the month items to see if the height is greater than "measureMaxHeight".
    // In neptune the height of the items is larger, so we must increase this value.
    // While the actual height of the month items in neptune is 24px, we will only 
    // determine that the text has wrapped if the height of the item exceeds 36px.
    // this allows theme developers some leeway to increase the month item size in
    // a neptune-derived theme.
    measureMaxHeight: 36
});

/** */
Ext.define('Ext.aria.form.field.Date', {
    override: 'Ext.form.field.Date',
    requires: [
        'Ext.aria.form.field.Picker'
    ],
    formatText: 'Expected date format {0}',
    /**
     * @private
     * Override because we do not want to focus the field if the collapse
     * was because of a tab key. Tab should move the focus to the next field.
     * Before collapsing the field will set doCancelFieldFocus based on the pressed key
     */
    onCollapse: function() {
        var me = this;
        if (!me.doCancelFieldFocus) {
            me.focus(false, 60);
        }
    }
});

/** */
Ext.define('Ext.aria.picker.Color', {
    override: 'Ext.picker.Color',
    requires: [
        'Ext.aria.Component'
    ],
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
    },
    //\\ TODO: set up KeyNav
    ariaGetEl: function() {
        return this.innerEl;
    },
    onColorSelect: function(picker, cell) {
        var me = this;
        if (cell && cell.dom) {
            me.ariaUpdate(me.eventEl, {
                'aria-activedescendant': cell.dom.id
            });
        }
    },
    privates: {
        getFocusEl: function() {
            return this.el;
        }
    }
});

Ext.define('ExtThemeNeptune.form.field.HtmlEditor', {
    override: 'Ext.form.field.HtmlEditor',
    defaultButtonUI: 'plain-toolbar'
});

/** */
Ext.define('Ext.aria.form.field.Time', {
    override: 'Ext.form.field.Time',
    requires: [
        'Ext.aria.form.field.ComboBox'
    ],
    // The default format for the time field is 'g:i A',
    // which is hardly informative
    formatText: 'Expected time format HH:MM AM or PM'
});

Ext.define('ExtThemeNeptune.grid.RowEditor', {
    override: 'Ext.grid.RowEditor',
    buttonUI: 'default-toolbar'
});

Ext.define('ExtThemeNeptune.grid.column.RowNumberer', {
    override: 'Ext.grid.column.RowNumberer',
    width: 25
});

/** */
Ext.define('Ext.aria.menu.Item', {
    override: 'Ext.menu.Item',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.menu) {
            attrs['aria-haspopup'] = true;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            menu = me.menu,
            attrs;
        attrs = me.callParent();
        if (menu && menu.rendered) {
            attrs['aria-controls'] = menu.ariaGetEl().id;
        }
        if (me.plain) {
            attrs['aria-label'] = me.text;
        } else {
            attrs['aria-labelledby'] = me.textEl.id;
        }
        return attrs;
    },
    doExpandMenu: function() {
        var me = this,
            menu = me.menu;
        me.callParent();
        if (menu && menu.rendered) {
            me.ariaUpdate({
                'aria-controls': menu.ariaGetEl().id
            });
        }
    }
});

/** */
Ext.define('Ext.aria.menu.CheckItem', {
    override: 'Ext.menu.CheckItem',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-checked'] = me.menu ? 'mixed' : !!me.checked;
        return attrs;
    },
    setChecked: function(checked, suppressEvents) {
        this.callParent([
            checked,
            suppressEvents
        ]);
        this.ariaUpdate({
            'aria-checked': checked
        });
    }
});

Ext.define('ExtThemeNeptune.menu.Separator', {
    override: 'Ext.menu.Separator',
    border: true
});

Ext.define('ExtThemeNeptune.menu.Menu', {
    override: 'Ext.menu.Menu',
    showSeparator: false
});

/** */
Ext.define('Ext.aria.slider.Thumb', {
    override: 'Ext.slider.Thumb',
    move: function(v, animate) {
        var me = this,
            el = me.el,
            slider = me.slider,
            styleProp = slider.vertical ? 'bottom' : slider.horizontalProp,
            to, from;
        v += '%';
        if (!animate) {
            el.dom.style[styleProp] = v;
            slider.fireEvent('move', slider, v, me);
        } else {
            to = {};
            to[styleProp] = v;
            if (!Ext.supports.GetPositionPercentage) {
                from = {};
                from[styleProp] = el.dom.style[styleProp];
            }
            new Ext.fx.Anim({
                target: el,
                duration: 350,
                from: from,
                to: to,
                callback: function() {
                    slider.fireEvent('move', slider, v, me);
                }
            });
        }
    }
});

/** */
Ext.define('Ext.aria.slider.Tip', {
    override: 'Ext.slider.Tip',
    init: function(slider) {
        var me = this,
            timeout = slider.tipHideTimeout;
        me.onSlide = Ext.Function.createThrottled(me.onSlide, 50, me);
        me.hide = Ext.Function.createBuffered(me.hide, timeout, me);
        me.callParent(arguments);
        slider.on({
            scope: me,
            change: me.onSlide,
            move: me.onSlide,
            changecomplete: me.hide
        });
    }
});

// There is no clear way to support multi-thumb sliders
// in accessible applications, so we default to support
// only single-slider ones
/** */
Ext.define('Ext.aria.slider.Multi', {
    override: 'Ext.slider.Multi',
    /**
     * @cfg {Number} [tipHideTimeout=1000] Timeout in ms after which
     * the slider tip will be hidden.
     */
    tipHideTimeout: 1000,
    animate: false,
    tabIndex: 0,
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-minvalue'] = me.minValue;
        attrs['aria-maxvalue'] = me.maxValue;
        attrs['aria-valuenow'] = me.getValue(0);
        return attrs;
    },
    getSubTplData: function() {
        var me = this,
            fmt = Ext.util.Format.attributes,
            data, attrs;
        data = me.callParent(arguments);
        attrs = me.ariaGetRenderAttributes();
        // Role is rendered separately
        delete attrs.role;
        data.inputAttrTpl = fmt(attrs);
        return data;
    },
    onKeyDown: function(e) {
        var me = this,
            key, value;
        if (me.disabled || me.thumbs.length !== 1) {
            e.preventDefault();
            return;
        }
        key = e.getKey();
        switch (key) {
            case e.HOME:
                e.stopEvent();
                me.setValue(0, me.minValue, undefined, true);
                return;
            case e.END:
                e.stopEvent();
                me.setValue(0, me.maxValue, undefined, true);
                return;
            case e.PAGE_UP:
                e.stopEvent();
                value = me.getValue(0) - me.keyIncrement * 10;
                me.setValue(0, value, undefined, true);
                return;
            case e.PAGE_DOWN:
                e.stopEvent();
                value = me.getValue(0) + me.keyIncrement * 10;
                me.setValue(0, value, undefined, true);
                return;
        }
        me.callParent(arguments);
    },
    setMinValue: function(value) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-minvalue': value
        });
    },
    setMaxValue: function(value) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-maxvalue': value
        });
    },
    setValue: function(index, value) {
        var me = this;
        me.callParent(arguments);
        if (index === 0) {
            me.ariaUpdate({
                'aria-valuenow': value
            });
        }
    }
});

/** */
Ext.define('Ext.aria.window.Toast', {
    override: 'Ext.window.Toast',
    initComponent: function() {
        // Close tool is not really helpful to blind users
        // when Toast window is set to auto-close on timeout
        if (this.autoClose) {
            this.closable = false;
        }
        this.callParent();
    }
});


/**
 * Base class from Ext.ux.TabReorderer.
 */
Ext.define('Ext.ux.BoxReorderer', {
    requires: [
        'Ext.dd.DD'
    ],
    mixins: {
        observable: 'Ext.util.Observable'
    },
    /**
     * @cfg {String} itemSelector
     * A {@link Ext.DomQuery DomQuery} selector which identifies the encapsulating elements of child
     * Components which participate in reordering.
     */
    itemSelector: '.x-box-item',
    /**
     * @cfg {Mixed} animate
     * If truthy, child reordering is animated so that moved boxes slide smoothly into position.
     * If this option is numeric, it is used as the animation duration in milliseconds.
     */
    animate: 100,
    /**
     * @event StartDrag
     * Fires when dragging of a child Component begins.
     * @param {Ext.ux.BoxReorderer} this
     * @param {Ext.container.Container} container The owning Container
     * @param {Ext.Component} dragCmp The Component being dragged
     * @param {Number} idx The start index of the Component being dragged.
     */
    /**
     * @event Drag
     * Fires during dragging of a child Component.
     * @param {Ext.ux.BoxReorderer} this
     * @param {Ext.container.Container} container The owning Container
     * @param {Ext.Component} dragCmp The Component being dragged
     * @param {Number} startIdx The index position from which the Component was initially dragged.
     * @param {Number} idx The current closest index to which the Component would drop.
     */
    /**
     * @event ChangeIndex
     * Fires when dragging of a child Component causes its drop index to change.
     * @param {Ext.ux.BoxReorderer} this
     * @param {Ext.container.Container} container The owning Container
     * @param {Ext.Component} dragCmp The Component being dragged
     * @param {Number} startIdx The index position from which the Component was initially dragged.
     * @param {Number} idx The current closest index to which the Component would drop.
     */
    /**
     * @event Drop
     * Fires when a child Component is dropped at a new index position.
     * @param {Ext.ux.BoxReorderer} this
     * @param {Ext.container.Container} container The owning Container
     * @param {Ext.Component} dragCmp The Component being dropped
     * @param {Number} startIdx The index position from which the Component was initially dragged.
     * @param {Number} idx The index at which the Component is being dropped.
     */
    constructor: function() {
        this.mixins.observable.constructor.apply(this, arguments);
    },
    init: function(container) {
        var me = this;
        me.container = container;
        // Set our animatePolicy to animate the start position (ie x for HBox, y for VBox)
        me.animatePolicy = {};
        me.animatePolicy[container.getLayout().names.x] = true;
        // Initialize the DD on first layout, when the innerCt has been created.
        me.container.on({
            scope: me,
            boxready: me.onBoxReady,
            beforedestroy: me.onContainerDestroy
        });
    },
    /**
     * @private Clear up on Container destroy
     */
    onContainerDestroy: function() {
        var dd = this.dd;
        if (dd) {
            dd.unreg();
            this.dd = null;
        }
    },
    onBoxReady: function() {
        var me = this,
            layout = me.container.getLayout(),
            names = layout.names,
            dd;
        // Create a DD instance. Poke the handlers in.
        // TODO: Ext5's DD classes should apply config to themselves.
        // TODO: Ext5's DD classes should not use init internally because it collides with use as a plugin
        // TODO: Ext5's DD classes should be Observable.
        // TODO: When all the above are trus, this plugin should extend the DD class.
        dd = me.dd = new Ext.dd.DD(layout.innerCt, me.container.id + '-reorderer');
        Ext.apply(dd, {
            animate: me.animate,
            reorderer: me,
            container: me.container,
            getDragCmp: me.getDragCmp,
            clickValidator: Ext.Function.createInterceptor(dd.clickValidator, me.clickValidator, me, false),
            onMouseDown: me.onMouseDown,
            startDrag: me.startDrag,
            onDrag: me.onDrag,
            endDrag: me.endDrag,
            getNewIndex: me.getNewIndex,
            doSwap: me.doSwap,
            findReorderable: me.findReorderable
        });
        // Decide which dimension we are measuring, and which measurement metric defines
        // the *start* of the box depending upon orientation.
        dd.dim = names.width;
        dd.startAttr = names.beforeX;
        dd.endAttr = names.afterX;
    },
    getDragCmp: function(e) {
        return this.container.getChildByElement(e.getTarget(this.itemSelector, 10));
    },
    // check if the clicked component is reorderable
    clickValidator: function(e) {
        var cmp = this.getDragCmp(e);
        // If cmp is null, this expression MUST be coerced to boolean so that createInterceptor is able to test it against false
        return !!(cmp && cmp.reorderable !== false);
    },
    onMouseDown: function(e) {
        var me = this,
            container = me.container,
            containerBox, cmpEl, cmpBox;
        // Ascertain which child Component is being mousedowned
        me.dragCmp = me.getDragCmp(e);
        if (me.dragCmp) {
            cmpEl = me.dragCmp.getEl();
            me.startIndex = me.curIndex = container.items.indexOf(me.dragCmp);
            // Start position of dragged Component
            cmpBox = cmpEl.getBox();
            // Last tracked start position
            me.lastPos = cmpBox[me.startAttr];
            // Calculate constraints depending upon orientation
            // Calculate offset from mouse to dragEl position
            containerBox = container.el.getBox();
            if (me.dim === 'width') {
                me.minX = containerBox.left;
                me.maxX = containerBox.right - cmpBox.width;
                me.minY = me.maxY = cmpBox.top;
                me.deltaX = e.getX() - cmpBox.left;
            } else {
                me.minY = containerBox.top;
                me.maxY = containerBox.bottom - cmpBox.height;
                me.minX = me.maxX = cmpBox.left;
                me.deltaY = e.getY() - cmpBox.top;
            }
            me.constrainY = me.constrainX = true;
        }
    },
    startDrag: function() {
        var me = this,
            dragCmp = me.dragCmp;
        if (dragCmp) {
            // For the entire duration of dragging the *Element*, defeat any positioning and animation of the dragged *Component*
            dragCmp.setPosition = Ext.emptyFn;
            dragCmp.animate = false;
            // Animate the BoxLayout just for the duration of the drag operation.
            if (me.animate) {
                me.container.getLayout().animatePolicy = me.reorderer.animatePolicy;
            }
            // We drag the Component element
            me.dragElId = dragCmp.getEl().id;
            me.reorderer.fireEvent('StartDrag', me, me.container, dragCmp, me.curIndex);
            // Suspend events, and set the disabled flag so that the mousedown and mouseup events
            // that are going to take place do not cause any other UI interaction.
            dragCmp.suspendEvents();
            dragCmp.disabled = true;
            dragCmp.el.setStyle('zIndex', 100);
        } else {
            me.dragElId = null;
        }
    },
    /**
     * @private
     * Find next or previous reorderable component index.
     * @param {Number} newIndex The initial drop index.
     * @return {Number} The index of the reorderable component.
     */
    findReorderable: function(newIndex) {
        var me = this,
            items = me.container.items,
            newItem;
        if (items.getAt(newIndex).reorderable === false) {
            newItem = items.getAt(newIndex);
            if (newIndex > me.startIndex) {
                while (newItem && newItem.reorderable === false) {
                    newIndex++;
                    newItem = items.getAt(newIndex);
                }
            } else {
                while (newItem && newItem.reorderable === false) {
                    newIndex--;
                    newItem = items.getAt(newIndex);
                }
            }
        }
        newIndex = Math.min(Math.max(newIndex, 0), items.getCount() - 1);
        if (items.getAt(newIndex).reorderable === false) {
            return -1;
        }
        return newIndex;
    },
    /**
     * @private
     * Swap 2 components.
     * @param {Number} newIndex The initial drop index.
     */
    doSwap: function(newIndex) {
        var me = this,
            items = me.container.items,
            container = me.container,
            wasRoot = me.container._isLayoutRoot,
            orig, dest, tmpIndex;
        newIndex = me.findReorderable(newIndex);
        if (newIndex === -1) {
            return;
        }
        me.reorderer.fireEvent('ChangeIndex', me, container, me.dragCmp, me.startIndex, newIndex);
        orig = items.getAt(me.curIndex);
        dest = items.getAt(newIndex);
        items.remove(orig);
        tmpIndex = Math.min(Math.max(newIndex, 0), items.getCount() - 1);
        items.insert(tmpIndex, orig);
        items.remove(dest);
        items.insert(me.curIndex, dest);
        // Make the Box Container the topmost layout participant during the layout.
        container._isLayoutRoot = true;
        container.updateLayout();
        container._isLayoutRoot = wasRoot;
        me.curIndex = newIndex;
    },
    onDrag: function(e) {
        var me = this,
            newIndex;
        newIndex = me.getNewIndex(e.getPoint());
        if ((newIndex !== undefined)) {
            me.reorderer.fireEvent('Drag', me, me.container, me.dragCmp, me.startIndex, me.curIndex);
            me.doSwap(newIndex);
        }
    },
    endDrag: function(e) {
        if (e) {
            e.stopEvent();
        }
        var me = this,
            layout = me.container.getLayout(),
            temp;
        if (me.dragCmp) {
            delete me.dragElId;
            // Reinstate the Component's positioning method after mouseup, and allow the layout system to animate it.
            delete me.dragCmp.setPosition;
            me.dragCmp.animate = true;
            // Ensure the lastBox is correct for the animation system to restore to when it creates the "from" animation frame
            me.dragCmp.lastBox[layout.names.x] = me.dragCmp.getPosition(true)[layout.names.widthIndex];
            // Make the Box Container the topmost layout participant during the layout.
            me.container._isLayoutRoot = true;
            me.container.updateLayout();
            me.container._isLayoutRoot = undefined;
            // Attempt to hook into the afteranimate event of the drag Component to call the cleanup
            temp = Ext.fx.Manager.getFxQueue(me.dragCmp.el.id)[0];
            if (temp) {
                temp.on({
                    afteranimate: me.reorderer.afterBoxReflow,
                    scope: me
                });
            } else // If not animated, clean up after the mouseup has happened so that we don't click the thing being dragged
            {
                Ext.Function.defer(me.reorderer.afterBoxReflow, 1, me);
            }
            if (me.animate) {
                delete layout.animatePolicy;
            }
            me.reorderer.fireEvent('drop', me, me.container, me.dragCmp, me.startIndex, me.curIndex);
        }
    },
    /**
     * @private
     * Called after the boxes have been reflowed after the drop.
     * Re-enabled the dragged Component.
     */
    afterBoxReflow: function() {
        var me = this;
        me.dragCmp.el.setStyle('zIndex', '');
        me.dragCmp.disabled = false;
        me.dragCmp.resumeEvents();
    },
    /**
     * @private
     * Calculate drop index based upon the dragEl's position.
     */
    getNewIndex: function(pointerPos) {
        var me = this,
            dragEl = me.getDragEl(),
            dragBox = Ext.fly(dragEl).getBox(),
            targetEl, targetBox, targetMidpoint,
            i = 0,
            it = me.container.items.items,
            ln = it.length,
            lastPos = me.lastPos;
        me.lastPos = dragBox[me.startAttr];
        for (; i < ln; i++) {
            targetEl = it[i].getEl();
            // Only look for a drop point if this found item is an item according to our selector
            if (targetEl.is(me.reorderer.itemSelector)) {
                targetBox = targetEl.getBox();
                targetMidpoint = targetBox[me.startAttr] + (targetBox[me.dim] >> 1);
                if (i < me.curIndex) {
                    if ((dragBox[me.startAttr] < lastPos) && (dragBox[me.startAttr] < (targetMidpoint - 5))) {
                        return i;
                    }
                } else if (i > me.curIndex) {
                    if ((dragBox[me.startAttr] > lastPos) && (dragBox[me.endAttr] > (targetMidpoint + 5))) {
                        return i;
                    }
                }
            }
        }
    }
});

/**
 * This plugin can enable a cell to cell drag and drop operation within the same grid view.
 *
 * Note that the plugin must be added to the grid view, not to the grid panel. For example, using {@link Ext.panel.Table viewConfig}:
 *
 *      viewConfig: {
 *          plugins: {
 *              ptype: 'celldragdrop',
 *
 *              // Remove text from source cell and replace with value of emptyText.
 *              applyEmptyText: true,
 *
 *              //emptyText: Ext.String.htmlEncode('<<foo>>'),
 *
 *              // Will only allow drops of the same type.
 *              enforceType: true
 *          }
 *      }
 */
Ext.define('Ext.ux.CellDragDrop', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.celldragdrop',
    uses: [
        'Ext.view.DragZone'
    ],
    /**
     * @cfg {Boolean} enforceType
     * Set to `true` to only allow drops of the same type.
     *
     * Defaults to `false`.
     */
    enforceType: false,
    /**
     * @cfg {Boolean} applyEmptyText
     * If `true`, then use the value of {@link #emptyText} to replace the drag record's value after a node drop.
     * Note that, if dropped on a cell of a different type, it will convert the default text according to its own conversion rules.
     *
     * Defaults to `false`.
     */
    applyEmptyText: false,
    /**
     * @cfg {Boolean} emptyText
     * If {@link #applyEmptyText} is `true`, then this value as the drag record's value after a node drop.
     *
     * Defaults to an empty string.
     */
    emptyText: '',
    /**
     * @cfg {Boolean} dropBackgroundColor
     * The default background color for when a drop is allowed.
     *
     * Defaults to green.
     */
    dropBackgroundColor: 'green',
    /**
     * @cfg {Boolean} noDropBackgroundColor
     * The default background color for when a drop is not allowed.
     *
     * Defaults to red.
     */
    noDropBackgroundColor: 'red',
    //<locale>
    /**
     * @cfg {String} dragText
     * The text to show while dragging.
     *
     * Two placeholders can be used in the text:
     *
     * - `{0}` The number of selected items.
     * - `{1}` 's' when more than 1 items (only useful for English).
     */
    dragText: '{0} selected row{1}',
    //</locale>
    /**
     * @cfg {String} ddGroup
     * A named drag drop group to which this object belongs. If a group is specified, then both the DragZones and
     * DropZone used by this plugin will only interact with other drag drop objects in the same group.
     */
    ddGroup: "GridDD",
    /**
     * @cfg {Boolean} enableDrop
     * Set to `false` to disallow the View from accepting drop gestures.
     */
    enableDrop: true,
    /**
     * @cfg {Boolean} enableDrag
     * Set to `false` to disallow dragging items from the View.
     */
    enableDrag: true,
    /**
     * @cfg {Object/Boolean} containerScroll
     * True to register this container with the Scrollmanager for auto scrolling during drag operations.
     * A {@link Ext.dd.ScrollManager} configuration may also be passed.
     */
    containerScroll: false,
    init: function(view) {
        var me = this;
        view.on('render', me.onViewRender, me, {
            single: true
        });
    },
    destroy: function() {
        var me = this;
        Ext.destroy(me.dragZone, me.dropZone);
    },
    enable: function() {
        var me = this;
        if (me.dragZone) {
            me.dragZone.unlock();
        }
        if (me.dropZone) {
            me.dropZone.unlock();
        }
        me.callParent();
    },
    disable: function() {
        var me = this;
        if (me.dragZone) {
            me.dragZone.lock();
        }
        if (me.dropZone) {
            me.dropZone.lock();
        }
        me.callParent();
    },
    onViewRender: function(view) {
        var me = this,
            scrollEl;
        if (me.enableDrag) {
            if (me.containerScroll) {
                scrollEl = view.getEl();
            }
            me.dragZone = new Ext.view.DragZone({
                view: view,
                ddGroup: me.dragGroup || me.ddGroup,
                dragText: me.dragText,
                containerScroll: me.containerScroll,
                scrollEl: scrollEl,
                getDragData: function(e) {
                    var view = this.view,
                        item = e.getTarget(view.getItemSelector()),
                        record = view.getRecord(item),
                        cell = e.getTarget(view.getCellSelector()),
                        dragEl, header;
                    if (item) {
                        dragEl = document.createElement('div');
                        dragEl.className = 'x-form-text';
                        dragEl.appendChild(document.createTextNode(cell.textContent || cell.innerText));
                        header = view.getHeaderByCell(cell);
                        return {
                            event: new Ext.EventObjectImpl(e),
                            ddel: dragEl,
                            item: e.target,
                            columnName: header.dataIndex,
                            record: record
                        };
                    }
                },
                onInitDrag: function(x, y) {
                    var self = this,
                        data = self.dragData,
                        view = self.view,
                        selectionModel = view.getSelectionModel(),
                        record = data.record,
                        el = data.ddel;
                    // Update the selection to match what would have been selected if the user had
                    // done a full click on the target node rather than starting a drag from it.
                    if (!selectionModel.isSelected(record)) {
                        selectionModel.select(record, true);
                    }
                    Ext.fly(self.ddel).update(el.textContent || el.innerText);
                    self.proxy.update(self.ddel);
                    self.onStartDrag(x, y);
                    return true;
                }
            });
        }
        if (me.enableDrop) {
            me.dropZone = new Ext.dd.DropZone(view.el, {
                view: view,
                ddGroup: me.dropGroup || me.ddGroup,
                containerScroll: true,
                getTargetFromEvent: function(e) {
                    var self = this,
                        view = self.view,
                        cell = e.getTarget(view.cellSelector),
                        row, header;
                    // Ascertain whether the mousemove is within a grid cell.
                    if (cell) {
                        row = view.findItemByChild(cell);
                        header = view.getHeaderByCell(cell);
                        if (row && header) {
                            return {
                                node: cell,
                                record: view.getRecord(row),
                                columnName: header.dataIndex
                            };
                        }
                    }
                },
                // On Node enter, see if it is valid for us to drop the field on that type of column.
                onNodeEnter: function(target, dd, e, dragData) {
                    var self = this,
                        destType = target.record.getField(target.columnName).type.toUpperCase(),
                        sourceType = dragData.record.getField(dragData.columnName).type.toUpperCase();
                    delete self.dropOK;
                    // Return if no target node or if over the same cell as the source of the drag.
                    if (!target || target.node === dragData.item.parentNode) {
                        return;
                    }
                    // Check whether the data type of the column being dropped on accepts the
                    // dragged field type. If so, set dropOK flag, and highlight the target node.
                    if (me.enforceType && destType !== sourceType) {
                        self.dropOK = false;
                        if (me.noDropCls) {
                            Ext.fly(target.node).addCls(me.noDropCls);
                        } else {
                            Ext.fly(target.node).applyStyles({
                                backgroundColor: me.noDropBackgroundColor
                            });
                        }
                        return false;
                    }
                    self.dropOK = true;
                    if (me.dropCls) {
                        Ext.fly(target.node).addCls(me.dropCls);
                    } else {
                        Ext.fly(target.node).applyStyles({
                            backgroundColor: me.dropBackgroundColor
                        });
                    }
                },
                // Return the class name to add to the drag proxy. This provides a visual indication
                // of drop allowed or not allowed.
                onNodeOver: function(target, dd, e, dragData) {
                    return this.dropOK ? this.dropAllowed : this.dropNotAllowed;
                },
                // Highlight the target node.
                onNodeOut: function(target, dd, e, dragData) {
                    var cls = this.dropOK ? me.dropCls : me.noDropCls;
                    if (cls) {
                        Ext.fly(target.node).removeCls(cls);
                    } else {
                        Ext.fly(target.node).applyStyles({
                            backgroundColor: ''
                        });
                    }
                },
                // Process the drop event if we have previously ascertained that a drop is OK.
                onNodeDrop: function(target, dd, e, dragData) {
                    if (this.dropOK) {
                        target.record.set(target.columnName, dragData.record.get(dragData.columnName));
                        if (me.applyEmptyText) {
                            dragData.record.set(dragData.columnName, me.emptyText);
                        }
                        return true;
                    }
                },
                onCellDrop: Ext.emptyFn
            });
        }
    }
});

/**
 * @class Ext.ux.DataTip
 * @extends Ext.ToolTip.
 * This plugin implements automatic tooltip generation for an arbitrary number of child nodes *within* a Component.
 *
 * This plugin is applied to a high level Component, which contains repeating elements, and depending on the host Component type,
 * it automatically selects a {@link Ext.ToolTip#delegate delegate} so that it appears when the mouse enters a sub-element.
 *
 * When applied to a GridPanel, this ToolTip appears when over a row, and the Record's data is applied
 * using this object's {@link #tpl} template.
 *
 * When applied to a DataView, this ToolTip appears when over a view node, and the Record's data is applied
 * using this object's {@link #tpl} template.
 *
 * When applied to a TreePanel, this ToolTip appears when over a tree node, and the Node's {@link Ext.data.Model} record data is applied
 * using this object's {@link #tpl} template.
 *
 * When applied to a FormPanel, this ToolTip appears when over a Field, and the Field's `tooltip` property is used is applied
 * using this object's {@link #tpl} template, or if it is a string, used as HTML content. If there is no `tooltip` property,
 * the field itself is used as the template's data object.
 *
 * If more complex logic is needed to determine content, then the {@link #beforeshow} event may be used.
 * This class also publishes a **`beforeshowtip`** event through its host Component. The *host Component* fires the
 * **`beforeshowtip`** event.
 */
Ext.define('Ext.ux.DataTip', function(DataTip) {
    //  Target the body (if the host is a Panel), or, if there is no body, the main Element.
    function onHostRender() {
        var e = this.isXType('panel') ? this.body : this.el;
        if (this.dataTip.renderToTarget) {
            this.dataTip.render(e);
        }
        this.dataTip.setTarget(e);
    }
    function updateTip(tip, data) {
        if (tip.rendered) {
            if (tip.host.fireEvent('beforeshowtip', tip.eventHost, tip, data) === false) {
                return false;
            }
            tip.update(data);
        } else {
            if (Ext.isString(data)) {
                tip.html = data;
            } else {
                tip.data = data;
            }
        }
    }
    function beforeViewTipShow(tip) {
        var rec = this.view.getRecord(tip.triggerElement),
            data;
        if (rec) {
            data = tip.initialConfig.data ? Ext.apply(tip.initialConfig.data, rec.data) : rec.data;
            return updateTip(tip, data);
        } else {
            return false;
        }
    }
    function beforeFormTipShow(tip) {
        var field = Ext.getCmp(tip.triggerElement.id);
        if (field && (field.tooltip || tip.tpl)) {
            return updateTip(tip, field.tooltip || field);
        } else {
            return false;
        }
    }
    return {
        extend: 'Ext.tip.ToolTip',
        mixins: {
            plugin: 'Ext.plugin.Abstract'
        },
        alias: 'plugin.datatip',
        lockableScope: 'both',
        constructor: function(config) {
            var me = this;
            me.callParent([
                config
            ]);
            me.mixins.plugin.constructor.call(me, config);
        },
        init: function(host) {
            var me = this;
            me.mixins.plugin.init.call(me, host);
            host.dataTip = me;
            me.host = host;
            if (host.isXType('tablepanel')) {
                me.view = host.getView();
                if (host.ownerLockable) {
                    me.host = host.ownerLockable;
                }
                me.delegate = me.delegate || me.view.rowSelector;
                me.on('beforeshow', beforeViewTipShow);
            } else if (host.isXType('dataview')) {
                me.view = me.host;
                me.delegate = me.delegate || host.itemSelector;
                me.on('beforeshow', beforeViewTipShow);
            } else if (host.isXType('form')) {
                me.delegate = '.' + Ext.form.Labelable.prototype.formItemCls;
                me.on('beforeshow', beforeFormTipShow);
            } else if (host.isXType('combobox')) {
                me.view = host.getPicker();
                me.delegate = me.delegate || me.view.getItemSelector();
                me.on('beforeshow', beforeViewTipShow);
            }
            if (host.rendered) {
                onHostRender.call(host);
            } else {
                host.onRender = Ext.Function.createSequence(host.onRender, onHostRender);
            }
        }
    };
});

/**
 * @author Ed Spencer (http://sencha.com)
 * Transition plugin for DataViews
 */
Ext.define('Ext.ux.DataView.Animated', {
    /**
     * @property defaults
     * @type Object
     * Default configuration options for all DataViewTransition instances
     */
    defaults: {
        duration: 750,
        idProperty: 'id'
    },
    /**
     * Creates the plugin instance, applies defaults
     * @constructor
     * @param {Object} config Optional config object
     */
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },
    /**
     * Initializes the transition plugin. Overrides the dataview's default refresh function
     * @param {Ext.view.View} dataview The dataview
     */
    init: function(dataview) {
        var me = this,
            store = dataview.store,
            items = dataview.all,
            task = {
                interval: 20
            },
            duration = me.duration;
        /**
         * @property dataview
         * @type Ext.view.View
         * Reference to the DataView this instance is bound to
         */
        me.dataview = dataview;
        dataview.blockRefresh = true;
        dataview.updateIndexes = Ext.Function.createSequence(dataview.updateIndexes, function() {
            this.getTargetEl().select(this.itemSelector).each(function(element, composite, index) {
                element.dom.id = Ext.util.Format.format("{0}-{1}", dataview.id, store.getAt(index).internalId);
            }, this);
        }, dataview);
        /**
         * @property dataviewID
         * @type String
         * The string ID of the DataView component. This is used internally when animating child objects
         */
        me.dataviewID = dataview.id;
        /**
         * @property cachedStoreData
         * @type Object
         * A cache of existing store data, keyed by id. This is used to determine
         * whether any items were added or removed from the store on data change
         */
        me.cachedStoreData = {};
        //catch the store data with the snapshot immediately
        me.cacheStoreData(store.data || store.snapshot);
        dataview.on('resize', function() {
            var store = dataview.store;
            if (store.getCount() > 0) {}
        }, // reDraw.call(this, store);
        this);
        // Buffer listenher so that rapid calls, for example a filter followed by a sort
        // Only produce one redraw.
        dataview.store.on({
            datachanged: reDraw,
            scope: this,
            buffer: 50
        });
        function reDraw() {
            var parentEl = dataview.getTargetEl(),
                parentElY = parentEl.getY(),
                parentElPaddingTop = parentEl.getPadding('t'),
                added = me.getAdded(store),
                removed = me.getRemoved(store),
                remaining = me.getRemaining(store),
                itemArray, i, id,
                itemFly = new Ext.dom.Fly(),
                rtl = me.dataview.getInherited().rtl,
                oldPos, newPos,
                styleSide = rtl ? 'right' : 'left',
                newStyle = {};
            // Not yet rendered
            if (!parentEl) {
                return;
            }
            // Collect nodes that will be removed in the forthcoming refresh so
            // that we can put them back in order to fade them out
            Ext.iterate(removed, function(recId, item) {
                id = me.dataviewID + '-' + recId;
                // Stop any animations for removed items and ensure th.
                Ext.fx.Manager.stopAnimation(id);
                item.dom = Ext.getDom(id);
                if (!item.dom) {
                    delete removed[recId];
                }
            });
            me.cacheStoreData(store);
            // stores the current top and left values for each element (discovered below)
            var oldPositions = {},
                newPositions = {};
            // Find current positions of elements which are to remain after the refresh.
            Ext.iterate(remaining, function(id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    oldPos = oldPositions[id] = {
                        top: itemFly.getY() - parentElY - itemFly.getMargin('t') - parentElPaddingTop
                    };
                    oldPos[styleSide] = me.getItemX(itemFly);
                } else {
                    delete remaining[id];
                }
            });
            // The view MUST refresh, creating items in the natural flow, and collecting the items
            // so that its item collection is consistent.
            dataview.refresh();
            // Replace removed nodes so that they can be faded out, THEN removed
            Ext.iterate(removed, function(id, item) {
                parentEl.dom.appendChild(item.dom);
                itemFly.attach(item.dom).animate({
                    duration: duration,
                    opacity: 0,
                    callback: function(anim) {
                        var el = Ext.get(anim.target.id);
                        if (el) {
                            el.destroy();
                        }
                    }
                });
                delete item.dom;
            });
            // We have taken care of any removals.
            // If the store is empty, we are done.
            if (!store.getCount()) {
                return;
            }
            // Collect the correct new positions after the refresh
            itemArray = items.slice();
            // Reverse order so that moving to absolute position does not affect the position of
            // the next one we're looking at.
            for (i = itemArray.length - 1; i >= 0; i--) {
                id = store.getAt(i).internalId;
                itemFly.attach(itemArray[i]);
                newPositions[id] = {
                    dom: itemFly.dom,
                    top: itemFly.getY() - parentElY - itemFly.getMargin('t') - parentElPaddingTop
                };
                newPositions[id][styleSide] = me.getItemX(itemFly);
                // We're going to absolutely position each item.
                // If it is a "remaining" one from last refesh, shunt it back to
                // its old position from where it will be animated.
                newPos = oldPositions[id] || newPositions[id];
                // set absolute positioning on all DataView items. We need to set position, left and 
                // top at the same time to avoid any flickering
                newStyle.position = 'absolute';
                newStyle.top = newPos.top + "px";
                newStyle[styleSide] = newPos.left + "px";
                itemFly.applyStyles(newStyle);
            }
            // This is the function which moves remaining items to their new position
            var doAnimate = function() {
                    var elapsed = new Date() - task.taskStartTime,
                        fraction = elapsed / duration;
                    if (fraction >= 1) {
                        // At end, return all items to natural flow.
                        newStyle.position = newStyle.top = newStyle[styleSide] = '';
                        for (id in newPositions) {
                            itemFly.attach(newPositions[id].dom).applyStyles(newStyle);
                        }
                        Ext.TaskManager.stop(task);
                    } else {
                        // In frame, move each "remaining" item according to time elapsed
                        for (id in remaining) {
                            var oldPos = oldPositions[id],
                                newPos = newPositions[id],
                                oldTop = oldPos.top,
                                newTop = newPos.top,
                                oldLeft = oldPos[styleSide],
                                newLeft = newPos[styleSide],
                                diffTop = fraction * Math.abs(oldTop - newTop),
                                diffLeft = fraction * Math.abs(oldLeft - newLeft),
                                midTop = oldTop > newTop ? oldTop - diffTop : oldTop + diffTop,
                                midLeft = oldLeft > newLeft ? oldLeft - diffLeft : oldLeft + diffLeft;
                            newStyle.top = midTop + "px";
                            newStyle[styleSide] = midLeft + "px";
                            itemFly.attach(newPos.dom).applyStyles(newStyle);
                        }
                    }
                };
            // Fade in new items
            Ext.iterate(added, function(id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    itemFly.setOpacity(0);
                    itemFly.animate({
                        duration: duration,
                        opacity: 1
                    });
                }
            });
            // Stop any previous animations
            Ext.TaskManager.stop(task);
            task.run = doAnimate;
            Ext.TaskManager.start(task);
            me.cacheStoreData(store);
        }
    },
    getItemX: function(el) {
        var rtl = this.dataview.getInherited().rtl,
            parentEl = el.up('');
        if (rtl) {
            return parentEl.getViewRegion().right - el.getRegion().right + el.getMargin('r');
        } else {
            return el.getX() - parentEl.getX() - el.getMargin('l') - parentEl.getPadding('l');
        }
    },
    /**
     * Caches the records from a store locally for comparison later
     * @param {Ext.data.Store} store The store to cache data from
     */
    cacheStoreData: function(store) {
        var cachedStoreData = this.cachedStoreData = {};
        store.each(function(record) {
            cachedStoreData[record.internalId] = record;
        });
    },
    /**
     * Returns all records that were already in the DataView
     * @return {Object} All existing records
     */
    getExisting: function() {
        return this.cachedStoreData;
    },
    /**
     * Returns the total number of items that are currently visible in the DataView
     * @return {Number} The number of existing items
     */
    getExistingCount: function() {
        var count = 0,
            items = this.getExisting();
        for (var k in items) {
            count++;
        }
        return count;
    },
    /**
     * Returns all records in the given store that were not already present
     * @param {Ext.data.Store} store The updated store instance
     * @return {Object} Object of records not already present in the dataview in format {id: record}
     */
    getAdded: function(store) {
        var cachedStoreData = this.cachedStoreData,
            added = {};
        store.each(function(record) {
            if (cachedStoreData[record.internalId] == null) {
                added[record.internalId] = record;
            }
        });
        return added;
    },
    /**
     * Returns all records that are present in the DataView but not the new store
     * @param {Ext.data.Store} store The updated store instance
     * @return {Array} Array of records that used to be present
     */
    getRemoved: function(store) {
        var cachedStoreData = this.cachedStoreData,
            removed = {},
            id;
        for (id in cachedStoreData) {
            if (store.findBy(function(record) {
                return record.internalId == id;
            }) == -1) {
                removed[id] = cachedStoreData[id];
            }
        }
        return removed;
    },
    /**
     * Returns all records that are already present and are still present in the new store
     * @param {Ext.data.Store} store The updated store instance
     * @return {Object} Object of records that are still present from last time in format {id: record}
     */
    getRemaining: function(store) {
        var cachedStoreData = this.cachedStoreData,
            remaining = {};
        store.each(function(record) {
            if (cachedStoreData[record.internalId] != null) {
                remaining[record.internalId] = record;
            }
        });
        return remaining;
    }
});

/**
 * @author Ed Spencer
 */
Ext.define('Ext.ux.DataView.DragSelector', {
    requires: [
        'Ext.dd.DragTracker',
        'Ext.util.Region'
    ],
    /**
     * Initializes the plugin by setting up the drag tracker
     */
    init: function(dataview) {
        /**
         * @property dataview
         * @type Ext.view.View
         * The DataView bound to this instance
         */
        this.dataview = dataview;
        dataview.mon(dataview, {
            beforecontainerclick: this.cancelClick,
            scope: this,
            render: {
                fn: this.onRender,
                scope: this,
                single: true
            }
        });
    },
    /**
     * @private
     * Called when the attached DataView is rendered. This sets up the DragTracker instance that will be used
     * to created a dragged selection area
     */
    onRender: function() {
        /**
         * @property tracker
         * @type Ext.dd.DragTracker
         * The DragTracker attached to this instance. Note that the 4 on* functions are called in the scope of the 
         * DragTracker ('this' refers to the DragTracker inside those functions), so we pass a reference to the 
         * DragSelector so that we can call this class's functions.
         */
        this.tracker = Ext.create('Ext.dd.DragTracker', {
            dataview: this.dataview,
            el: this.dataview.el,
            dragSelector: this,
            onBeforeStart: this.onBeforeStart,
            onStart: this.onStart,
            onDrag: this.onDrag,
            onEnd: this.onEnd
        });
        /**
         * @property dragRegion
         * @type Ext.util.Region
         * Represents the region currently dragged out by the user. This is used to figure out which dataview nodes are
         * in the selected area and to set the size of the Proxy element used to highlight the current drag area
         */
        this.dragRegion = Ext.create('Ext.util.Region');
    },
    /**
     * @private
     * Listener attached to the DragTracker's onBeforeStart event. Returns false if the drag didn't start within the
     * DataView's el
     */
    onBeforeStart: function(e) {
        return e.target == this.dataview.getEl().dom;
    },
    /**
     * @private
     * Listener attached to the DragTracker's onStart event. Cancel's the DataView's containerclick event from firing
     * and sets the start co-ordinates of the Proxy element. Clears any existing DataView selection
     * @param {Ext.event.Event} e The click event
     */
    onStart: function(e) {
        var dragSelector = this.dragSelector,
            dataview = this.dataview;
        // Flag which controls whether the cancelClick method vetoes the processing of the DataView's containerclick event.
        // On IE (where else), this needs to remain set for a millisecond after mouseup because even though the mouse has
        // moved, the mouseup will still trigger a click event.
        this.dragging = true;
        //here we reset and show the selection proxy element and cache the regions each item in the dataview take up
        dragSelector.fillRegions();
        dragSelector.getProxy().show();
        dataview.getSelectionModel().deselectAll();
    },
    /**
     * @private
     * Reusable handler that's used to cancel the container click event when dragging on the dataview. See onStart for
     * details
     */
    cancelClick: function() {
        return !this.tracker.dragging;
    },
    /**
     * @private
     * Listener attached to the DragTracker's onDrag event. Figures out how large the drag selection area should be and
     * updates the proxy element's size to match. Then iterates over all of the rendered items and marks them selected
     * if the drag region touches them
     * @param {Ext.event.Event} e The drag event
     */
    onDrag: function(e) {
        var dragSelector = this.dragSelector,
            selModel = dragSelector.dataview.getSelectionModel(),
            dragRegion = dragSelector.dragRegion,
            bodyRegion = dragSelector.bodyRegion,
            proxy = dragSelector.getProxy(),
            regions = dragSelector.regions,
            length = regions.length,
            startXY = this.startXY,
            currentXY = this.getXY(),
            minX = Math.min(startXY[0], currentXY[0]),
            minY = Math.min(startXY[1], currentXY[1]),
            width = Math.abs(startXY[0] - currentXY[0]),
            height = Math.abs(startXY[1] - currentXY[1]),
            region, selected, i;
        Ext.apply(dragRegion, {
            top: minY,
            left: minX,
            right: minX + width,
            bottom: minY + height
        });
        dragRegion.constrainTo(bodyRegion);
        proxy.setBox(dragRegion);
        for (i = 0; i < length; i++) {
            region = regions[i];
            selected = dragRegion.intersect(region);
            if (selected) {
                selModel.select(i, true);
            } else {
                selModel.deselect(i);
            }
        }
    },
    /**
     * @private
     * Listener attached to the DragTracker's onEnd event. This is a delayed function which executes 1
     * millisecond after it has been called. This is because the dragging flag must remain active to cancel
     * the containerclick event which the mouseup event will trigger.
     * @param {Ext.event.Event} e The event object
     */
    onEnd: Ext.Function.createDelayed(function(e) {
        var dataview = this.dataview,
            selModel = dataview.getSelectionModel(),
            dragSelector = this.dragSelector;
        this.dragging = false;
        dragSelector.getProxy().hide();
    }, 1),
    /**
     * @private
     * Creates a Proxy element that will be used to highlight the drag selection region
     * @return {Ext.Element} The Proxy element
     */
    getProxy: function() {
        if (!this.proxy) {
            this.proxy = this.dataview.getEl().createChild({
                tag: 'div',
                cls: 'x-view-selector'
            });
        }
        return this.proxy;
    },
    /**
     * @private
     * Gets the region taken up by each rendered node in the DataView. We use these regions to figure out which nodes
     * to select based on the selector region the user has dragged out
     */
    fillRegions: function() {
        var dataview = this.dataview,
            regions = this.regions = [];
        dataview.all.each(function(node) {
            regions.push(node.getRegion());
        });
        this.bodyRegion = dataview.getEl().getRegion();
    }
});

/**
 * @author Ed Spencer
 *
 * ## Basic DataView with Draggable mixin.
 *
 *     Ext.Loader.setPath('Ext.ux', '../../../SDK/extjs/examples/ux');
 *
 *     Ext.define('My.cool.View', {
 *         extend: 'Ext.view.View',
 *
 *         mixins: {
 *             draggable: 'Ext.ux.DataView.Draggable'
 *         },
 *
 *         initComponent: function() {
 *             this.mixins.draggable.init(this, {
 *                 ddConfig: {
 *                     ddGroup: 'someGroup'
 *                 }
 *             });
 * 
 *             this.callParent(arguments);
 *         }
 *     });
 *
 *     Ext.onReady(function () {
 *         Ext.create('Ext.data.Store', {
 *             storeId: 'baseball',
 *             fields: ['team', 'established'],
 *             data: [
 *                 { team: 'Atlanta Braves', established: '1871' },
 *                 { team: 'Miami Marlins', established: '1993' },
 *                 { team: 'New York Mets', established: '1962' },
 *                 { team: 'Philadelphia Phillies', established: '1883' },
 *                 { team: 'Washington Nationals', established: '1969' }
 *             ]
 *          });
 *
 *          Ext.create('My.cool.View', {
 *              store: Ext.StoreMgr.get('baseball'),
 *              tpl: [
 *                  '<tpl for=".">', 
 *                      '<p class="team">', 
 *                          'The {team} were founded in {established}.',
 *                      '</p>', 
 *                  '</tpl>'
 *              ],
 *              itemSelector: 'p.team',
 *              renderTo: Ext.getBody()
 *          });
 *      });
 */
Ext.define('Ext.ux.DataView.Draggable', {
    requires: 'Ext.dd.DragZone',
    /**
     * @cfg {String} ghostCls The CSS class added to the outermost element of the created ghost proxy
     * (defaults to 'x-dataview-draggable-ghost')
     */
    ghostCls: 'x-dataview-draggable-ghost',
    /**
     * @cfg {Ext.XTemplate/Array} ghostTpl The template used in the ghost DataView
     */
    ghostTpl: [
        '<tpl for=".">',
        '{title}',
        '</tpl>'
    ],
    /**
     * @cfg {Object} ddConfig Config object that is applied to the internally created DragZone
     */
    /**
     * @cfg {String} ghostConfig Config object that is used to configure the internally created DataView
     */
    init: function(dataview, config) {
        /**
         * @property dataview
         * @type Ext.view.View
         * The Ext.view.View instance that this DragZone is attached to
         */
        this.dataview = dataview;
        dataview.on('render', this.onRender, this);
        Ext.apply(this, {
            itemSelector: dataview.itemSelector,
            ghostConfig: {}
        }, config || {});
        Ext.applyIf(this.ghostConfig, {
            itemSelector: 'img',
            cls: this.ghostCls,
            tpl: this.ghostTpl
        });
    },
    /**
     * @private
     * Called when the attached DataView is rendered. Sets up the internal DragZone
     */
    onRender: function() {
        var config = Ext.apply({}, this.ddConfig || {}, {
                dvDraggable: this,
                dataview: this.dataview,
                getDragData: this.getDragData,
                getTreeNode: this.getTreeNode,
                afterRepair: this.afterRepair,
                getRepairXY: this.getRepairXY
            });
        /**
         * @property dragZone
         * @type Ext.dd.DragZone
         * The attached DragZone instane
         */
        this.dragZone = Ext.create('Ext.dd.DragZone', this.dataview.getEl(), config);
    },
    getDragData: function(e) {
        var draggable = this.dvDraggable,
            dataview = this.dataview,
            selModel = dataview.getSelectionModel(),
            target = e.getTarget(draggable.itemSelector),
            selected, dragData;
        if (target) {
            if (!dataview.isSelected(target)) {
                selModel.select(dataview.getRecord(target));
            }
            selected = dataview.getSelectedNodes();
            dragData = {
                copy: true,
                nodes: selected,
                records: selModel.getSelection(),
                item: true
            };
            if (selected.length === 1) {
                dragData.single = true;
                dragData.ddel = target;
            } else {
                dragData.multi = true;
                dragData.ddel = draggable.prepareGhost(selModel.getSelection());
            }
            return dragData;
        }
        return false;
    },
    getTreeNode: function() {},
    // console.log('test');
    afterRepair: function() {
        this.dragging = false;
        var nodes = this.dragData.nodes,
            length = nodes.length,
            i;
        //FIXME: Ext.fly does not work here for some reason, only frames the last node
        for (i = 0; i < length; i++) {
            Ext.get(nodes[i]).frame('#8db2e3', 1);
        }
    },
    /**
     * @private
     * Returns the x and y co-ordinates that the dragged item should be animated back to if it was dropped on an
     * invalid drop target. If we're dragging more than one item we don't animate back and just allow afterRepair
     * to frame each dropped item.
     */
    getRepairXY: function(e) {
        if (this.dragData.multi) {
            return false;
        } else {
            var repairEl = Ext.get(this.dragData.ddel),
                repairXY = repairEl.getXY();
            //take the item's margins and padding into account to make the repair animation line up perfectly
            repairXY[0] += repairEl.getPadding('t') + repairEl.getMargin('t');
            repairXY[1] += repairEl.getPadding('l') + repairEl.getMargin('l');
            return repairXY;
        }
    },
    /**
     * Updates the internal ghost DataView by ensuring it is rendered and contains the correct records
     * @param {Array} records The set of records that is currently selected in the parent DataView
     * @return {HTMLElement} The Ghost DataView's encapsulating HtmnlElement.
     */
    prepareGhost: function(records) {
        return this.createGhost(records).getEl().dom;
    },
    /**
     * @private
     * Creates the 'ghost' DataView that follows the mouse cursor during the drag operation. This div is usually a
     * lighter-weight representation of just the nodes that are selected in the parent DataView.
     */
    createGhost: function(records) {
        var me = this,
            store;
        if (me.ghost) {
            (store = me.ghost.store).loadRecords(records);
        } else {
            store = Ext.create('Ext.data.Store', {
                model: records[0].self
            });
            store.loadRecords(records);
            me.ghost = Ext.create('Ext.view.View', Ext.apply({
                renderTo: document.createElement('div'),
                store: store
            }, me.ghostConfig));
            me.ghost.container.skipGarbageCollection = me.ghost.el.skipGarbageCollection = true;
        }
        store.clearData();
        return me.ghost;
    },
    destroy: function() {
        if (this.ghost) {
            this.ghost.container.destroy();
            this.ghost.destroy();
        }
    }
});

/**
 *
 */
Ext.define('Ext.ux.DataView.LabelEditor', {
    extend: 'Ext.Editor',
    alignment: 'tl-tl',
    completeOnEnter: true,
    cancelOnEsc: true,
    shim: false,
    autoSize: {
        width: 'boundEl',
        height: 'field'
    },
    labelSelector: 'x-editable',
    requires: [
        'Ext.form.field.Text'
    ],
    constructor: function(config) {
        config.field = config.field || Ext.create('Ext.form.field.Text', {
            allowOnlyWhitespace: false,
            selectOnFocus: true
        });
        this.callParent([
            config
        ]);
    },
    init: function(view) {
        this.view = view;
        this.mon(view, 'afterrender', this.bindEvents, this);
        this.on('complete', this.onSave, this);
    },
    // initialize events
    bindEvents: function() {
        this.mon(this.view.getEl(), {
            click: {
                fn: this.onClick,
                scope: this
            }
        });
    },
    // on mousedown show editor
    onClick: function(e, target) {
        var me = this,
            item, record;
        if (Ext.fly(target).hasCls(me.labelSelector) && !me.editing && !e.ctrlKey && !e.shiftKey) {
            e.stopEvent();
            item = me.view.findItemByChild(target);
            record = me.view.store.getAt(me.view.indexOf(item));
            me.startEdit(target, record.data[me.dataIndex]);
            me.activeRecord = record;
        } else if (me.editing) {
            me.field.blur();
            e.preventDefault();
        }
    },
    // update record
    onSave: function(ed, value) {
        this.activeRecord.set(this.dataIndex, value);
    }
});

/**
 * @author Ed Spencer (http://sencha.com)
 * Transition plugin for DataViews
 */
Ext.ux.DataViewTransition = Ext.extend(Object, {
    /**
     * @property defaults
     * @type Object
     * Default configuration options for all DataViewTransition instances
     */
    defaults: {
        duration: 750,
        idProperty: 'id'
    },
    /**
     * Creates the plugin instance, applies defaults
     * @constructor
     * @param {Object} config Optional config object
     */
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },
    /**
     * Initializes the transition plugin. Overrides the dataview's default refresh function
     * @param {Ext.view.View} dataview The dataview
     */
    init: function(dataview) {
        /**
         * @property dataview
         * @type Ext.view.View
         * Reference to the DataView this instance is bound to
         */
        this.dataview = dataview;
        var idProperty = this.idProperty;
        dataview.blockRefresh = true;
        dataview.updateIndexes = Ext.Function.createSequence(dataview.updateIndexes, function() {
            this.getTargetEl().select(this.itemSelector).each(function(element, composite, index) {
                element.id = element.dom.id = Ext.util.Format.format("{0}-{1}", dataview.id, dataview.store.getAt(index).get(idProperty));
            }, this);
        }, dataview);
        /**
         * @property dataviewID
         * @type String
         * The string ID of the DataView component. This is used internally when animating child objects
         */
        this.dataviewID = dataview.id;
        /**
         * @property cachedStoreData
         * @type Object
         * A cache of existing store data, keyed by id. This is used to determine
         * whether any items were added or removed from the store on data change
         */
        this.cachedStoreData = {};
        //var store = dataview.store;
        //catch the store data with the snapshot immediately
        this.cacheStoreData(dataview.store.snapshot);
        dataview.store.on('datachanged', function(store) {
            var parentEl = dataview.getTargetEl(),
                calcItem = store.getAt(0),
                added = this.getAdded(store),
                removed = this.getRemoved(store),
                previous = this.getRemaining(store),
                existing = Ext.apply({}, previous, added);
            //hide old items
            Ext.each(removed, function(item) {
                Ext.fly(this.dataviewID + '-' + item.get(this.idProperty)).animate({
                    remove: false,
                    duration: duration,
                    opacity: 0,
                    useDisplay: true
                });
            }, this);
            //store is empty
            if (calcItem == undefined) {
                this.cacheStoreData(store);
                return;
            }
            var el = Ext.get(this.dataviewID + "-" + calcItem.get(this.idProperty));
            //calculate the number of rows and columns we have
            var itemCount = store.getCount(),
                itemWidth = el.getMargin('lr') + el.getWidth(),
                itemHeight = el.getMargin('bt') + el.getHeight(),
                dvWidth = parentEl.getWidth(),
                columns = Math.floor(dvWidth / itemWidth),
                rows = Math.ceil(itemCount / columns),
                currentRows = Math.ceil(this.getExistingCount() / columns);
            //make sure the correct styles are applied to the parent element
            parentEl.applyStyles({
                display: 'block',
                position: 'relative'
            });
            //stores the current top and left values for each element (discovered below)
            var oldPositions = {},
                newPositions = {},
                elCache = {};
            //find current positions of each element and save a reference in the elCache
            Ext.iterate(previous, function(id, item) {
                var id = item.get(this.idProperty),
                    el = elCache[id] = Ext.get(this.dataviewID + '-' + id);
                oldPositions[id] = {
                    top: el.getY() - parentEl.getY() - el.getMargin('t') - parentEl.getPadding('t'),
                    left: el.getX() - parentEl.getX() - el.getMargin('l') - parentEl.getPadding('l')
                };
            }, this);
            //set absolute positioning on all DataView items. We need to set position, left and 
            //top at the same time to avoid any flickering
            Ext.iterate(previous, function(id, item) {
                var oldPos = oldPositions[id],
                    el = elCache[id];
                if (el.getStyle('position') != 'absolute') {
                    elCache[id].applyStyles({
                        position: 'absolute',
                        left: oldPos.left + "px",
                        top: oldPos.top + "px",
                        //we set the width here to make ListViews work correctly. This is not needed for DataViews
                        width: el.getWidth(!Ext.isIE || Ext.isStrict),
                        height: el.getHeight(!Ext.isIE || Ext.isStrict)
                    });
                }
            });
            //get new positions
            var index = 0;
            Ext.iterate(store.data.items, function(item) {
                var id = item.get(idProperty),
                    el = elCache[id];
                var column = index % columns,
                    row = Math.floor(index / columns),
                    top = row * itemHeight,
                    left = column * itemWidth;
                newPositions[id] = {
                    top: top,
                    left: left
                };
                index++;
            }, this);
            //do the movements
            var startTime = new Date(),
                duration = this.duration,
                dataviewID = this.dataviewID;
            var doAnimate = function() {
                    var elapsed = new Date() - startTime,
                        fraction = elapsed / duration;
                    if (fraction >= 1) {
                        for (var id in newPositions) {
                            Ext.fly(dataviewID + '-' + id).applyStyles({
                                top: newPositions[id].top + "px",
                                left: newPositions[id].left + "px"
                            });
                        }
                        Ext.TaskManager.stop(task);
                    } else {
                        //move each item
                        for (var id in newPositions) {
                            if (!previous[id])  {
                                
                                continue;
                            }
                            
                            var oldPos = oldPositions[id],
                                newPos = newPositions[id],
                                oldTop = oldPos.top,
                                newTop = newPos.top,
                                oldLeft = oldPos.left,
                                newLeft = newPos.left,
                                diffTop = fraction * Math.abs(oldTop - newTop),
                                diffLeft = fraction * Math.abs(oldLeft - newLeft),
                                midTop = oldTop > newTop ? oldTop - diffTop : oldTop + diffTop,
                                midLeft = oldLeft > newLeft ? oldLeft - diffLeft : oldLeft + diffLeft;
                            Ext.fly(dataviewID + '-' + id).applyStyles({
                                top: midTop + "px",
                                left: midLeft + "px"
                            });
                        }
                    }
                };
            var task = {
                    run: doAnimate,
                    interval: 20,
                    scope: this
                };
            Ext.TaskManager.start(task);
            var count = 0;
            for (var k in added) {
                count++;
            }
            if (Ext.global.console && Ext.global.console.log) {
                Ext.global.console.log('added:', count);
            }
            //show new items
            Ext.iterate(added, function(id, item) {
                Ext.fly(this.dataviewID + '-' + item.get(this.idProperty)).applyStyles({
                    top: newPositions[item.get(this.idProperty)].top + "px",
                    left: newPositions[item.get(this.idProperty)].left + "px"
                });
                Ext.fly(this.dataviewID + '-' + item.get(this.idProperty)).animate({
                    remove: false,
                    duration: duration,
                    opacity: 1
                });
            }, this);
            this.cacheStoreData(store);
        }, this);
    },
    /**
     * Caches the records from a store locally for comparison later
     * @param {Ext.data.Store} store The store to cache data from
     */
    cacheStoreData: function(store) {
        this.cachedStoreData = {};
        store.each(function(record) {
            this.cachedStoreData[record.get(this.idProperty)] = record;
        }, this);
    },
    /**
     * Returns all records that were already in the DataView
     * @return {Object} All existing records
     */
    getExisting: function() {
        return this.cachedStoreData;
    },
    /**
     * Returns the total number of items that are currently visible in the DataView
     * @return {Number} The number of existing items
     */
    getExistingCount: function() {
        var count = 0,
            items = this.getExisting();
        for (var k in items) count++;
        return count;
    },
    /**
     * Returns all records in the given store that were not already present
     * @param {Ext.data.Store} store The updated store instance
     * @return {Object} Object of records not already present in the dataview in format {id: record}
     */
    getAdded: function(store) {
        var added = {};
        store.each(function(record) {
            if (this.cachedStoreData[record.get(this.idProperty)] == undefined) {
                added[record.get(this.idProperty)] = record;
            }
        }, this);
        return added;
    },
    /**
     * Returns all records that are present in the DataView but not the new store
     * @param {Ext.data.Store} store The updated store instance
     * @return {Array} Array of records that used to be present
     */
    getRemoved: function(store) {
        var removed = [];
        for (var id in this.cachedStoreData) {
            if (store.findExact(this.idProperty, Number(id)) == -1) {
                removed.push(this.cachedStoreData[id]);
            }
        }
        return removed;
    },
    /**
     * Returns all records that are already present and are still present in the new store
     * @param {Ext.data.Store} store The updated store instance
     * @return {Object} Object of records that are still present from last time in format {id: record}
     */
    getRemaining: function(store) {
        var remaining = {};
        store.each(function(record) {
            if (this.cachedStoreData[record.get(this.idProperty)] != undefined) {
                remaining[record.get(this.idProperty)] = record;
            }
        }, this);
        return remaining;
    }
});

/**
 * An explorer component for navigating hierarchical content.  Consists of a breadcrumb bar
 * at the top, tree navigation on the left, and a center panel which displays the contents
 * of a given node.
 */
Ext.define('Ext.ux.Explorer', {
    extend: 'Ext.panel.Panel',
    xtype: 'explorer',
    requires: [
        'Ext.layout.container.Border',
        'Ext.toolbar.Breadcrumb',
        'Ext.tree.Panel'
    ],
    config: {
        /**
         * @cfg {Object} breadcrumb
         * Configuration object for the breadcrumb toolbar
         */
        breadcrumb: {
            dock: 'top',
            xtype: 'breadcrumb',
            reference: 'breadcrumb'
        },
        /**
         * @cfg {Object} contentView
         * Configuration object for the "content" data view
         */
        contentView: {
            xtype: 'dataview',
            reference: 'contentView',
            region: 'center',
            cls: Ext.baseCSSPrefix + 'explorer-view',
            itemSelector: '.' + Ext.baseCSSPrefix + 'explorer-item',
            tpl: '<tpl for=".">' + '<div class="' + Ext.baseCSSPrefix + 'explorer-item">' + '<div class="{iconCls}">' + '<div class="' + Ext.baseCSSPrefix + 'explorer-node-icon' + '{[values.leaf ? " ' + Ext.baseCSSPrefix + 'explorer-leaf-icon' + '" : ""]}' + '">' + '</div>' + '<div class="' + Ext.baseCSSPrefix + 'explorer-item-text">{text}</div>' + '</div>' + '</div>' + '</tpl>'
        },
        /**
         * @cfg {Ext.data.TreeStore} store
         * The TreeStore to use as the data source
         */
        store: null,
        /**
         * @cfg {Object} tree
         * Configuration object for the tree
         */
        tree: {
            xtype: 'treepanel',
            reference: 'tree',
            region: 'west',
            width: 200
        }
    },
    renderConfig: {
        /**
         * @cfg {Ext.data.TreeModel} selection
         * The selected node
         */
        selection: null
    },
    layout: 'border',
    referenceHolder: true,
    defaultListenerScope: true,
    cls: Ext.baseCSSPrefix + 'explorer',
    initComponent: function() {
        var me = this,
            store = me.getStore();
        if (!store) {
            Ext.Error.raise('Ext.ux.Explorer requires a store.');
        }
        me.dockedItems = [
            me.getBreadcrumb()
        ];
        me.items = [
            me.getTree(),
            me.getContentView()
        ];
        me.callParent();
    },
    applyBreadcrumb: function(breadcrumb) {
        var store = this.getStore();
        breadcrumb = Ext.create(Ext.apply({
            store: store,
            selection: store.getRoot()
        }, breadcrumb));
        breadcrumb.on('selectionchange', '_onBreadcrumbSelectionChange', this);
        return breadcrumb;
    },
    applyContentView: function(contentView) {
        /**
         * @property {Ext.data.Store} contentStore
         * @private
         * The backing store for the content view
         */
        var contentStore = this.contentStore = new Ext.data.Store({
                model: this.getStore().model
            });
        contentView = Ext.create(Ext.apply({
            store: contentStore
        }, contentView));
        return contentView;
    },
    applyTree: function(tree) {
        tree = Ext.create(Ext.apply({
            store: this.getStore()
        }, tree));
        tree.on('selectionchange', '_onTreeSelectionChange', this);
        return tree;
    },
    updateSelection: function(node) {
        var me = this,
            refs = me.getReferences(),
            breadcrumb = refs.breadcrumb,
            tree = refs.tree,
            treeSelectionModel = tree.getSelectionModel(),
            contentStore = me.contentStore,
            parentNode, treeView;
        if (breadcrumb.getSelection() !== node) {
            breadcrumb.setSelection(node);
        }
        if (treeSelectionModel.getSelection()[0] !== node) {
            treeSelectionModel.select([
                node
            ]);
            parentNode = node.parentNode;
            if (parentNode) {
                parentNode.expand();
            }
            treeView = tree.getView();
            treeView.scrollRowIntoView(treeView.getRow(node));
        }
        contentStore.removeAll();
        contentStore.add(node.hasChildNodes() ? node.childNodes : [
            node
        ]);
    },
    updateStore: function(store) {
        this.getBreadcrumb().setStore(store);
    },
    privates: {
        /**
         * Handles the tree's selectionchange event
         * @private
         * @param {Ext.tree.Panel} tree
         * @param {Ext.data.TreeModel[]} selection
         */
        _onTreeSelectionChange: function(tree, selection) {
            this.setSelection(selection[0]);
        },
        /**
         * Handles the breadcrumb bar's selectionchange event
         */
        _onBreadcrumbSelectionChange: function(breadcrumb, selection) {
            this.setSelection(selection);
        }
    }
});

/**
 * <p>A plugin for Field Components which creates clones of the Field for as
 * long as the user keeps filling them. Leaving the final one blank ends the repeating series.</p>
 * <p>Usage:</p>
 * <pre><code>
    {
        xtype: 'combo',
        plugins: [ Ext.ux.FieldReplicator ],
        triggerAction: 'all',
        fieldLabel: 'Select recipient',
        store: recipientStore
    }
 * </code></pre>
 */
Ext.define('Ext.ux.FieldReplicator', {
    alias: 'plugin.fieldreplicator',
    init: function(field) {
        // Assign the field an id grouping it with fields cloned from it. If it already
        // has an id that means it is itself a clone.
        if (!field.replicatorId) {
            field.replicatorId = Ext.id();
        }
        field.on('blur', this.onBlur, this);
    },
    onBlur: function(field) {
        var ownerCt = field.ownerCt,
            replicatorId = field.replicatorId,
            isEmpty = Ext.isEmpty(field.getRawValue()),
            siblings = ownerCt.query('[replicatorId=' + replicatorId + ']'),
            isLastInGroup = siblings[siblings.length - 1] === field,
            clone, idx;
        // If a field before the final one was blanked out, remove it
        if (isEmpty && !isLastInGroup) {
            Ext.Function.defer(field.destroy, 10, field);
        }
        //delay to allow tab key to move focus first
        // If the field is the last in the list and has a value, add a cloned field after it
        else if (!isEmpty && isLastInGroup) {
            if (field.onReplicate) {
                field.onReplicate();
            }
            clone = field.cloneConfig({
                replicatorId: replicatorId
            });
            idx = ownerCt.items.indexOf(field);
            ownerCt.add(idx + 1, clone);
        }
    }
});

/**
 * @author Shea Frederick
 *
 * The GMap Panel UX extends `Ext.panel.Panel` in order to display Google Maps.
 *
 * It is important to note that you must include the following Google Maps API above bootstrap.js in your 
 * application's index.html file (or equivilant).
 *
 *     <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3&sensor=false"></script>
 *
 * It is important to note that due to the Google Maps loader, you cannot currently include
 * the above JS resource in the Cmd generated app.json file.  Doing so interferes with the loading of
 * Ext JS and Google Maps. 
 *
 * The following example creates a window containing a GMap Panel.  In this case, the center 
 * is set as geoCodeAddr, which is a string that Google translates into longitude and latitude.
 * 
 *     var mapwin = Ext.create('Ext.Window', {
 *         layout: 'fit',
 *         title: 'GMap Window',
 *         width: 450,
 *         height: 250,
 *         items: {
 *             xtype: 'gmappanel',
 *             gmapType: 'map',
 *             center: {
 *                 geoCodeAddr: "221B Baker Street",
 *                 marker: {
 *                     title: 'Holmes Home'
 *                 }
 *             },
 *             mapOptions : {
 *                 mapTypeId: google.maps.MapTypeId.ROADMAP
 *             }
 *         }
 *     }).show();
 * 
 */
Ext.define('Ext.ux.GMapPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.gmappanel',
    requires: [
        'Ext.window.MessageBox'
    ],
    initComponent: function() {
        Ext.applyIf(this, {
            plain: true,
            gmapType: 'map',
            border: false
        });
        this.callParent();
    },
    onBoxReady: function() {
        var center = this.center;
        this.callParent(arguments);
        if (center) {
            if (center.geoCodeAddr) {
                this.lookupCode(center.geoCodeAddr, center.marker);
            } else {
                this.createMap(center);
            }
        } else {
            Ext.Error.raise('center is required');
        }
    },
    createMap: function(center, marker) {
        var options = Ext.apply({}, this.mapOptions);
        options = Ext.applyIf(options, {
            zoom: 14,
            center: center,
            mapTypeId: google.maps.MapTypeId.HYBRID
        });
        this.gmap = new google.maps.Map(this.body.dom, options);
        if (marker) {
            this.addMarker(Ext.applyIf(marker, {
                position: center
            }));
        }
        Ext.each(this.markers, this.addMarker, this);
        this.fireEvent('mapready', this, this.gmap);
    },
    addMarker: function(marker) {
        marker = Ext.apply({
            map: this.gmap
        }, marker);
        if (!marker.position) {
            marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        }
        var o = new google.maps.Marker(marker);
        Ext.Object.each(marker.listeners, function(name, fn) {
            google.maps.event.addListener(o, name, fn);
        });
        return o;
    },
    lookupCode: function(addr, marker) {
        this.geocoder = new google.maps.Geocoder();
        this.geocoder.geocode({
            address: addr
        }, Ext.Function.bind(this.onLookupComplete, this, [
            marker
        ], true));
    },
    onLookupComplete: function(data, response, marker) {
        if (response != 'OK') {
            Ext.MessageBox.alert('Error', 'An error occured: "' + response + '"');
            return;
        }
        this.createMap(data[0].geometry.location, marker);
    },
    afterComponentLayout: function(w, h) {
        this.callParent(arguments);
        this.redraw();
    },
    redraw: function() {
        var map = this.gmap;
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    }
});

/**
* Allows GroupTab to render a table structure.
*/
Ext.define('Ext.ux.GroupTabRenderer', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.grouptabrenderer',
    tableTpl: new Ext.XTemplate('<div id="{view.id}-body" class="' + Ext.baseCSSPrefix + '{view.id}-table ' + Ext.baseCSSPrefix + 'grid-table-resizer" style="{tableStyle}">', '{%', 'values.view.renderRows(values.rows, values.viewStartIndex, out);', '%}', '</div>', {
        priority: 5
    }),
    rowTpl: new Ext.XTemplate('{%', 'Ext.Array.remove(values.itemClasses, "', Ext.baseCSSPrefix + 'grid-row");', 'var dataRowCls = values.recordIndex === -1 ? "" : " ' + Ext.baseCSSPrefix + 'grid-data-row";', '%}', '<div {[values.rowId ? ("id=\\"" + values.rowId + "\\"") : ""]} ', 'data-boundView="{view.id}" ', 'data-recordId="{record.internalId}" ', 'data-recordIndex="{recordIndex}" ', 'class="' + Ext.baseCSSPrefix + 'grouptab-row {[values.itemClasses.join(" ")]} {[values.rowClasses.join(" ")]}{[dataRowCls]}" ', '{rowAttr:attributes}>', '<tpl for="columns">' + '{%', 'parent.view.renderCell(values, parent.record, parent.recordIndex, parent.rowIndex, xindex - 1, out, parent)', '%}', '</tpl>', '</div>', {
        priority: 5
    }),
    cellTpl: new Ext.XTemplate('{%values.tdCls = values.tdCls.replace(" ' + Ext.baseCSSPrefix + 'grid-cell "," ");%}', '<div class="' + Ext.baseCSSPrefix + 'grouptab-cell {tdCls}" {tdAttr}>', '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner" style="text-align: {align}; {style};">{value}</div>', '<div class="x-grouptabs-corner x-grouptabs-corner-top-left"></div>', '<div class="x-grouptabs-corner x-grouptabs-corner-bottom-left"></div>', '</div>', {
        priority: 5
    }),
    selectors: {
        // Outer table
        bodySelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',
        // Element which contains rows
        nodeContainerSelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',
        // row
        itemSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',
        // row which contains cells as opposed to wrapping rows
        rowSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',
        // cell
        cellSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-cell',
        getCellSelector: function(header) {
            return header ? header.getCellSelector() : this.cellSelector;
        }
    },
    init: function(grid) {
        var view = grid.getView(),
            me = this;
        view.addTpl(me.tableTpl);
        view.addRowTpl(me.rowTpl);
        view.addCellTpl(me.cellTpl);
        Ext.apply(view, me.selectors);
    }
});

/**
 * @author Nicolas Ferrero
 * A TabPanel with grouping support.
 */
Ext.define('Ext.ux.GroupTabPanel', {
    extend: 'Ext.Container',
    alias: 'widget.grouptabpanel',
    requires: [
        'Ext.tree.Panel',
        'Ext.ux.GroupTabRenderer'
    ],
    baseCls: Ext.baseCSSPrefix + 'grouptabpanel',
    /**
     * @event beforetabchange
     * Fires before a tab change (activated by {@link #setActiveTab}). Return false in any listener to cancel
     * the tabchange
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newCard The card that is about to be activated
     * @param {Ext.Component} oldCard The card that is currently active
     */
    /**
     * @event tabchange
     * Fires when a new tab has been activated (activated by {@link #setActiveTab}).
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newCard The newly activated item
     * @param {Ext.Component} oldCard The previously active item
     */
    /**
     * @event beforegroupchange
     * Fires before a group change (activated by {@link #setActiveGroup}). Return false in any listener to cancel
     * the groupchange
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newGroup The root group card that is about to be activated
     * @param {Ext.Component} oldGroup The root group card that is currently active
     */
    /**
     * @event groupchange
     * Fires when a new group has been activated (activated by {@link #setActiveGroup}).
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newGroup The newly activated root group item
     * @param {Ext.Component} oldGroup The previously active root group item
     */
    initComponent: function(config) {
        var me = this;
        Ext.apply(me, config);
        // Processes items to create the TreeStore and also set up
        // "this.cards" containing the actual card items.
        me.store = me.createTreeStore();
        me.layout = {
            type: 'hbox',
            align: 'stretch'
        };
        me.defaults = {
            border: false
        };
        me.items = [
            {
                xtype: 'treepanel',
                cls: 'x-tree-panel x-grouptabbar',
                width: 150,
                rootVisible: false,
                store: me.store,
                hideHeaders: true,
                animate: false,
                processEvent: Ext.emptyFn,
                border: false,
                plugins: [
                    {
                        ptype: 'grouptabrenderer'
                    }
                ],
                viewConfig: {
                    overItemCls: '',
                    getRowClass: me.getRowClass
                },
                columns: [
                    {
                        xtype: 'treecolumn',
                        sortable: false,
                        dataIndex: 'text',
                        flex: 1,
                        renderer: function(value, cell, node, idx1, idx2, store, tree) {
                            var cls = '';
                            if (node.parentNode && node.parentNode.parentNode === null) {
                                cls += ' x-grouptab-first';
                                if (node.previousSibling) {
                                    cls += ' x-grouptab-prev';
                                }
                                if (!node.get('expanded') || node.firstChild == null) {
                                    cls += ' x-grouptab-last';
                                }
                            } else if (node.nextSibling === null) {
                                cls += ' x-grouptab-last';
                            } else {
                                cls += ' x-grouptab-center';
                            }
                            if (node.data.activeTab) {
                                cls += ' x-active-tab';
                            }
                            cell.tdCls = 'x-grouptab' + cls;
                            return value;
                        }
                    }
                ]
            },
            {
                xtype: 'container',
                flex: 1,
                layout: 'card',
                activeItem: me.mainItem,
                baseCls: Ext.baseCSSPrefix + 'grouptabcontainer',
                items: me.cards
            }
        ];
        me.callParent(arguments);
        me.setActiveTab(me.activeTab);
        me.setActiveGroup(me.activeGroup);
        me.mon(me.down('treepanel').getSelectionModel(), 'select', me.onNodeSelect, me);
    },
    getRowClass: function(node, rowIndex, rowParams, store) {
        var cls = '';
        if (node.data.activeGroup) {
            cls += ' x-active-group';
        }
        return cls;
    },
    /**
     * @private
     * Node selection listener.
     */
    onNodeSelect: function(selModel, node) {
        var me = this,
            currentNode = me.store.getRootNode(),
            parent;
        if (node.parentNode && node.parentNode.parentNode === null) {
            parent = node;
        } else {
            parent = node.parentNode;
        }
        if (me.setActiveGroup(parent.get('id')) === false || me.setActiveTab(node.get('id')) === false) {
            return false;
        }
        while (currentNode) {
            currentNode.set('activeTab', false);
            currentNode.set('activeGroup', false);
            currentNode = currentNode.firstChild || currentNode.nextSibling || currentNode.parentNode.nextSibling;
        }
        parent.set('activeGroup', true);
        parent.eachChild(function(child) {
            child.set('activeGroup', true);
        });
        node.set('activeTab', true);
        selModel.view.refresh();
    },
    /**
     * Makes the given component active (makes it the visible card in the GroupTabPanel's CardLayout)
     * @param {Ext.Component} cmp The component to make active
     */
    setActiveTab: function(cmp) {
        var me = this,
            newTab = cmp,
            oldTab;
        if (Ext.isString(cmp)) {
            newTab = Ext.getCmp(newTab);
        }
        if (newTab === me.activeTab) {
            return false;
        }
        oldTab = me.activeTab;
        if (me.fireEvent('beforetabchange', me, newTab, oldTab) !== false) {
            me.activeTab = newTab;
            if (me.rendered) {
                me.down('container[baseCls=' + Ext.baseCSSPrefix + 'grouptabcontainer' + ']').getLayout().setActiveItem(newTab);
            }
            me.fireEvent('tabchange', me, newTab, oldTab);
        }
        return true;
    },
    /**
     * Makes the given group active
     * @param {Ext.Component} cmp The root component to make active.
     */
    setActiveGroup: function(cmp) {
        var me = this,
            newGroup = cmp,
            oldGroup;
        if (Ext.isString(cmp)) {
            newGroup = Ext.getCmp(newGroup);
        }
        if (newGroup === me.activeGroup) {
            return true;
        }
        oldGroup = me.activeGroup;
        if (me.fireEvent('beforegroupchange', me, newGroup, oldGroup) !== false) {
            me.activeGroup = newGroup;
            me.fireEvent('groupchange', me, newGroup, oldGroup);
        } else {
            return false;
        }
        return true;
    },
    /**
     * @private
     * Creates the TreeStore used by the GroupTabBar.
     */
    createTreeStore: function() {
        var me = this,
            groups = me.prepareItems(me.items),
            data = {
                text: '.',
                children: []
            },
            cards = me.cards = [];
        me.activeGroup = me.activeGroup || 0;
        Ext.each(groups, function(groupItem, idx) {
            var leafItems = groupItem.items.items,
                rootItem = (leafItems[groupItem.mainItem] || leafItems[0]),
                groupRoot = {
                    children: []
                };
            // Create the root node of the group
            groupRoot.id = rootItem.id;
            groupRoot.text = rootItem.title;
            groupRoot.iconCls = rootItem.iconCls;
            groupRoot.expanded = true;
            groupRoot.activeGroup = (me.activeGroup === idx);
            groupRoot.activeTab = groupRoot.activeGroup ? true : false;
            if (groupRoot.activeTab) {
                me.activeTab = groupRoot.id;
            }
            if (groupRoot.activeGroup) {
                me.mainItem = groupItem.mainItem || 0;
                me.activeGroup = groupRoot.id;
            }
            Ext.each(leafItems, function(leafItem) {
                // First node has been done
                if (leafItem.id !== groupRoot.id) {
                    var child = {
                            id: leafItem.id,
                            leaf: true,
                            text: leafItem.title,
                            iconCls: leafItem.iconCls,
                            activeGroup: groupRoot.activeGroup,
                            activeTab: false
                        };
                    groupRoot.children.push(child);
                }
                // Ensure the items do not get headers
                delete leafItem.title;
                delete leafItem.iconCls;
                cards.push(leafItem);
            });
            data.children.push(groupRoot);
        });
        return Ext.create('Ext.data.TreeStore', {
            fields: [
                'id',
                'text',
                'activeGroup',
                'activeTab'
            ],
            root: {
                expanded: true
            },
            proxy: {
                type: 'memory',
                data: data
            }
        });
    },
    /**
     * Returns the item that is currently active inside this GroupTabPanel.
     * @return {Ext.Component/Number} The currently active item
     */
    getActiveTab: function() {
        return this.activeTab;
    },
    /**
     * Returns the root group item that is currently active inside this GroupTabPanel.
     * @return {Ext.Component/Number} The currently active root group item
     */
    getActiveGroup: function() {
        return this.activeGroup;
    }
});

/**
 * Barebones iframe implementation. 
 */
Ext.define('Ext.ux.IFrame', {
    extend: 'Ext.Component',
    alias: 'widget.uxiframe',
    loadMask: 'Loading...',
    src: 'about:blank',
    renderTpl: [
        '<iframe src="{src}" id="{id}-iframeEl" data-ref="iframeEl" name="{frameName}" width="100%" height="100%" frameborder="0"></iframe>'
    ],
    childEls: [
        'iframeEl'
    ],
    initComponent: function() {
        this.callParent();
        this.frameName = this.frameName || this.id + '-frame';
    },
    initEvents: function() {
        var me = this;
        me.callParent();
        me.iframeEl.on('load', me.onLoad, me);
    },
    initRenderData: function() {
        return Ext.apply(this.callParent(), {
            src: this.src,
            frameName: this.frameName
        });
    },
    getBody: function() {
        var doc = this.getDoc();
        return doc.body || doc.documentElement;
    },
    getDoc: function() {
        try {
            return this.getWin().document;
        } catch (ex) {
            return null;
        }
    },
    getWin: function() {
        var me = this,
            name = me.frameName,
            win = Ext.isIE ? me.iframeEl.dom.contentWindow : window.frames[name];
        return win;
    },
    getFrame: function() {
        var me = this;
        return me.iframeEl.dom;
    },
    beforeDestroy: function() {
        this.cleanupListeners(true);
        this.callParent();
    },
    cleanupListeners: function(destroying) {
        var doc, prop;
        if (this.rendered) {
            try {
                doc = this.getDoc();
                if (doc) {
                    Ext.get(doc).un(this._docListeners);
                    if (destroying) {
                        for (prop in doc) {
                            if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
                                delete doc[prop];
                            }
                        }
                    }
                }
            } catch (e) {}
        }
    },
    onLoad: function() {
        var me = this,
            doc = me.getDoc(),
            fn = me.onRelayedEvent;
        if (doc) {
            try {
                // These events need to be relayed from the inner document (where they stop
                // bubbling) up to the outer document. This has to be done at the DOM level so
                // the event reaches listeners on elements like the document body. The effected
                // mechanisms that depend on this bubbling behavior are listed to the right
                // of the event.
                Ext.get(doc).on(me._docListeners = {
                    mousedown: fn,
                    // menu dismisal (MenuManager) and Window onMouseDown (toFront)
                    mousemove: fn,
                    // window resize drag detection
                    mouseup: fn,
                    // window resize termination
                    click: fn,
                    // not sure, but just to be safe
                    dblclick: fn,
                    // not sure again
                    scope: me
                });
            } catch (e) {}
            // cannot do this xss
            // We need to be sure we remove all our events from the iframe on unload or we're going to LEAK!
            Ext.get(this.getWin()).on('beforeunload', me.cleanupListeners, me);
            this.el.unmask();
            this.fireEvent('load', this);
        } else if (me.src) {
            this.el.unmask();
            this.fireEvent('error', this);
        }
    },
    onRelayedEvent: function(event) {
        // relay event from the iframe's document to the document that owns the iframe...
        var iframeEl = this.iframeEl,
            // Get the left-based iframe position
            iframeXY = iframeEl.getTrueXY(),
            originalEventXY = event.getXY(),
            // Get the left-based XY position.
            // This is because the consumer of the injected event will
            // perform its own RTL normalization.
            eventXY = event.getTrueXY();
        // the event from the inner document has XY relative to that document's origin,
        // so adjust it to use the origin of the iframe in the outer document:
        event.xy = [
            iframeXY[0] + eventXY[0],
            iframeXY[1] + eventXY[1]
        ];
        event.injectEvent(iframeEl);
        // blame the iframe for the event...
        event.xy = originalEventXY;
    },
    // restore the original XY (just for safety)
    load: function(src) {
        var me = this,
            text = me.loadMask,
            frame = me.getFrame();
        if (me.fireEvent('beforeload', me, src) !== false) {
            if (text && me.el) {
                me.el.mask(text);
            }
            frame.src = me.src = (src || me.src);
        }
    }
});
/*
 * TODO items:
 *
 * Iframe should clean up any Ext.dom.Element wrappers around its window, document
 * documentElement and body when it is destroyed.  This helps prevent "Permission Denied"
 * errors in IE when Ext.dom.GarbageCollector tries to access those objects on an orphaned
 * iframe.  Permission Denied errors can occur in one of the following 2 scenarios:
 *
 *     a. When an iframe is removed from the document, and all references to it have been
 *     removed, IE will "clear" the window object.  At this point the window object becomes
 *     completely inaccessible - accessing any of its properties results in a "Permission
 *     Denied" error. http://msdn.microsoft.com/en-us/library/ie/hh180174(v=vs.85).aspx
 *
 *     b. When an iframe is unloaded (either by navigating to a new url, or via document.open/
 *     document.write, new html and body elements are created and the old the html and body
 *     elements are orphaned.  Accessing the html and body elements or any of their properties
 *     results in a "Permission Denied" error.
 */

/**
 * Basic status bar component that can be used as the bottom toolbar of any {@link Ext.Panel}.  In addition to
 * supporting the standard {@link Ext.toolbar.Toolbar} interface for adding buttons, menus and other items, the StatusBar
 * provides a greedy status element that can be aligned to either side and has convenient methods for setting the
 * status text and icon.  You can also indicate that something is processing using the {@link #showBusy} method.
 *
 *     Ext.create('Ext.Panel', {
 *         title: 'StatusBar',
 *         // etc.
 *         bbar: Ext.create('Ext.ux.StatusBar', {
 *             id: 'my-status',
 *      
 *             // defaults to use when the status is cleared:
 *             defaultText: 'Default status text',
 *             defaultIconCls: 'default-icon',
 *      
 *             // values to set initially:
 *             text: 'Ready',
 *             iconCls: 'ready-icon',
 *      
 *             // any standard Toolbar items:
 *             items: [{
 *                 text: 'A Button'
 *             }, '-', 'Plain Text']
 *         })
 *     });
 *
 *     // Update the status bar later in code:
 *     var sb = Ext.getCmp('my-status');
 *     sb.setStatus({
 *         text: 'OK',
 *         iconCls: 'ok-icon',
 *         clear: true // auto-clear after a set interval
 *     });
 *
 *     // Set the status bar to show that something is processing:
 *     sb.showBusy();
 *
 *     // processing....
 *
 *     sb.clearStatus(); // once completeed
 *
 */
Ext.define('Ext.ux.statusbar.StatusBar', {
    extend: 'Ext.toolbar.Toolbar',
    alternateClassName: 'Ext.ux.StatusBar',
    alias: 'widget.statusbar',
    requires: [
        'Ext.toolbar.TextItem'
    ],
    /**
     * @cfg {String} statusAlign
     * The alignment of the status element within the overall StatusBar layout.  When the StatusBar is rendered,
     * it creates an internal div containing the status text and icon.  Any additional Toolbar items added in the
     * StatusBar's {@link #cfg-items} config, or added via {@link #method-add} or any of the supported add* methods, will be
     * rendered, in added order, to the opposite side.  The status element is greedy, so it will automatically
     * expand to take up all sapce left over by any other items.  Example usage:
     *
     *     // Create a left-aligned status bar containing a button,
     *     // separator and text item that will be right-aligned (default):
     *     Ext.create('Ext.Panel', {
     *         title: 'StatusBar',
     *         // etc.
     *         bbar: Ext.create('Ext.ux.statusbar.StatusBar', {
     *             defaultText: 'Default status text',
     *             id: 'status-id',
     *             items: [{
     *                 text: 'A Button'
     *             }, '-', 'Plain Text']
     *         })
     *     });
     *
     *     // By adding the statusAlign config, this will create the
     *     // exact same toolbar, except the status and toolbar item
     *     // layout will be reversed from the previous example:
     *     Ext.create('Ext.Panel', {
     *         title: 'StatusBar',
     *         // etc.
     *         bbar: Ext.create('Ext.ux.statusbar.StatusBar', {
     *             defaultText: 'Default status text',
     *             id: 'status-id',
     *             statusAlign: 'right',
     *             items: [{
     *                 text: 'A Button'
     *             }, '-', 'Plain Text']
     *         })
     *     });
     */
    /**
     * @cfg {String} [defaultText='']
     * The default {@link #text} value.  This will be used anytime the status bar is cleared with the
     * `useDefaults:true` option.
     */
    /**
     * @cfg {String} [defaultIconCls='']
     * The default {@link #iconCls} value (see the iconCls docs for additional details about customizing the icon).
     * This will be used anytime the status bar is cleared with the `useDefaults:true` option.
     */
    /**
     * @cfg {String} text
     * A string that will be <b>initially</b> set as the status message.  This string
     * will be set as innerHTML (html tags are accepted) for the toolbar item.
     * If not specified, the value set for {@link #defaultText} will be used.
     */
    /**
     * @cfg {String} [iconCls='']
     * A CSS class that will be **initially** set as the status bar icon and is
     * expected to provide a background image.
     *
     * Example usage:
     *
     *     // Example CSS rule:
     *     .x-statusbar .x-status-custom {
     *         padding-left: 25px;
     *         background: transparent url(images/custom-icon.gif) no-repeat 3px 2px;
     *     }
     *
     *     // Setting a default icon:
     *     var sb = Ext.create('Ext.ux.statusbar.StatusBar', {
     *         defaultIconCls: 'x-status-custom'
     *     });
     *
     *     // Changing the icon:
     *     sb.setStatus({
     *         text: 'New status',
     *         iconCls: 'x-status-custom'
     *     });
     */
    /**
     * @cfg {String} cls
     * The base class applied to the containing element for this component on render.
     */
    cls: 'x-statusbar',
    /**
     * @cfg {String} busyIconCls
     * The default {@link #iconCls} applied when calling {@link #showBusy}.
     * It can be overridden at any time by passing the `iconCls` argument into {@link #showBusy}.
     */
    busyIconCls: 'x-status-busy',
    /**
     * @cfg {String} busyText
     * The default {@link #text} applied when calling {@link #showBusy}.
     * It can be overridden at any time by passing the `text` argument into {@link #showBusy}.
     */
    busyText: 'Loading...',
    /**
     * @cfg {Number} autoClear
     * The number of milliseconds to wait after setting the status via
     * {@link #setStatus} before automatically clearing the status text and icon.
     * Note that this only applies when passing the `clear` argument to {@link #setStatus}
     * since that is the only way to defer clearing the status.  This can
     * be overridden by specifying a different `wait` value in {@link #setStatus}.
     * Calls to {@link #clearStatus} always clear the status bar immediately and ignore this value.
     */
    autoClear: 5000,
    /**
     * @cfg {String} emptyText
     * The text string to use if no text has been set. If there are no other items in
     * the toolbar using an empty string (`''`) for this value would end up in the toolbar
     * height collapsing since the empty string will not maintain the toolbar height.
     * Use `''` if the toolbar should collapse in height vertically when no text is
     * specified and there are no other items in the toolbar.
     */
    emptyText: '&#160;',
    // private
    activeThreadId: 0,
    // private
    initComponent: function() {
        var right = this.statusAlign === 'right';
        this.callParent(arguments);
        this.currIconCls = this.iconCls || this.defaultIconCls;
        this.statusEl = Ext.create('Ext.toolbar.TextItem', {
            cls: 'x-status-text ' + (this.currIconCls || ''),
            text: this.text || this.defaultText || ''
        });
        if (right) {
            this.cls += ' x-status-right';
            this.add('->');
            this.add(this.statusEl);
        } else {
            this.insert(0, this.statusEl);
            this.insert(1, '->');
        }
    },
    /**
     * Sets the status {@link #text} and/or {@link #iconCls}. Also supports automatically clearing the
     * status that was set after a specified interval.
     *
     * Example usage:
     *
     *     // Simple call to update the text
     *     statusBar.setStatus('New status');
     *
     *     // Set the status and icon, auto-clearing with default options:
     *     statusBar.setStatus({
     *         text: 'New status',
     *         iconCls: 'x-status-custom',
     *         clear: true
     *     });
     *
     *     // Auto-clear with custom options:
     *     statusBar.setStatus({
     *         text: 'New status',
     *         iconCls: 'x-status-custom',
     *         clear: {
     *             wait: 8000,
     *             anim: false,
     *             useDefaults: false
     *         }
     *     });
     *
     * @param {Object/String} config A config object specifying what status to set, or a string assumed
     * to be the status text (and all other options are defaulted as explained below). A config
     * object containing any or all of the following properties can be passed:
     *
     * @param {String} config.text The status text to display.  If not specified, any current
     * status text will remain unchanged.
     *
     * @param {String} config.iconCls The CSS class used to customize the status icon (see
     * {@link #iconCls} for details). If not specified, any current iconCls will remain unchanged.
     *
     * @param {Boolean/Number/Object} config.clear Allows you to set an internal callback that will
     * automatically clear the status text and iconCls after a specified amount of time has passed. If clear is not
     * specified, the new status will not be auto-cleared and will stay until updated again or cleared using
     * {@link #clearStatus}. If `true` is passed, the status will be cleared using {@link #autoClear},
     * {@link #defaultText} and {@link #defaultIconCls} via a fade out animation. If a numeric value is passed,
     * it will be used as the callback interval (in milliseconds), overriding the {@link #autoClear} value.
     * All other options will be defaulted as with the boolean option.  To customize any other options,
     * you can pass an object in the format:
     * 
     * @param {Number} config.clear.wait The number of milliseconds to wait before clearing
     * (defaults to {@link #autoClear}).
     * @param {Boolean} config.clear.anim False to clear the status immediately once the callback
     * executes (defaults to true which fades the status out).
     * @param {Boolean} config.clear.useDefaults False to completely clear the status text and iconCls
     * (defaults to true which uses {@link #defaultText} and {@link #defaultIconCls}).
     *
     * @return {Ext.ux.statusbar.StatusBar} this
     */
    setStatus: function(o) {
        var me = this;
        o = o || {};
        Ext.suspendLayouts();
        if (Ext.isString(o)) {
            o = {
                text: o
            };
        }
        if (o.text !== undefined) {
            me.setText(o.text);
        }
        if (o.iconCls !== undefined) {
            me.setIcon(o.iconCls);
        }
        if (o.clear) {
            var c = o.clear,
                wait = me.autoClear,
                defaults = {
                    useDefaults: true,
                    anim: true
                };
            if (Ext.isObject(c)) {
                c = Ext.applyIf(c, defaults);
                if (c.wait) {
                    wait = c.wait;
                }
            } else if (Ext.isNumber(c)) {
                wait = c;
                c = defaults;
            } else if (Ext.isBoolean(c)) {
                c = defaults;
            }
            c.threadId = this.activeThreadId;
            Ext.defer(me.clearStatus, wait, me, [
                c
            ]);
        }
        Ext.resumeLayouts(true);
        return me;
    },
    /**
     * Clears the status {@link #text} and {@link #iconCls}. Also supports clearing via an optional fade out animation.
     *
     * @param {Object} [config] A config object containing any or all of the following properties.  If this
     * object is not specified the status will be cleared using the defaults below:
     * @param {Boolean} config.anim True to clear the status by fading out the status element (defaults
     * to false which clears immediately).
     * @param {Boolean} config.useDefaults True to reset the text and icon using {@link #defaultText} and
     * {@link #defaultIconCls} (defaults to false which sets the text to '' and removes any existing icon class).
     *
     * @return {Ext.ux.statusbar.StatusBar} this
     */
    clearStatus: function(o) {
        o = o || {};
        var me = this,
            statusEl = me.statusEl;
        if (o.threadId && o.threadId !== me.activeThreadId) {
            // this means the current call was made internally, but a newer
            // thread has set a message since this call was deferred.  Since
            // we don't want to overwrite a newer message just ignore.
            return me;
        }
        var text = o.useDefaults ? me.defaultText : me.emptyText,
            iconCls = o.useDefaults ? (me.defaultIconCls ? me.defaultIconCls : '') : '';
        if (o.anim) {
            // animate the statusEl Ext.Element
            statusEl.el.puff({
                remove: false,
                useDisplay: true,
                callback: function() {
                    statusEl.el.show();
                    me.setStatus({
                        text: text,
                        iconCls: iconCls
                    });
                }
            });
        } else {
            me.setStatus({
                text: text,
                iconCls: iconCls
            });
        }
        return me;
    },
    /**
     * Convenience method for setting the status text directly.  For more flexible options see {@link #setStatus}.
     * @param {String} text (optional) The text to set (defaults to '')
     * @return {Ext.ux.statusbar.StatusBar} this
     */
    setText: function(text) {
        var me = this;
        me.activeThreadId++;
        me.text = text || '';
        if (me.rendered) {
            me.statusEl.setText(me.text);
        }
        return me;
    },
    /**
     * Returns the current status text.
     * @return {String} The status text
     */
    getText: function() {
        return this.text;
    },
    /**
     * Convenience method for setting the status icon directly.  For more flexible options see {@link #setStatus}.
     * See {@link #iconCls} for complete details about customizing the icon.
     * @param {String} iconCls (optional) The icon class to set (defaults to '', and any current icon class is removed)
     * @return {Ext.ux.statusbar.StatusBar} this
     */
    setIcon: function(cls) {
        var me = this;
        me.activeThreadId++;
        cls = cls || '';
        if (me.rendered) {
            if (me.currIconCls) {
                me.statusEl.removeCls(me.currIconCls);
                me.currIconCls = null;
            }
            if (cls.length > 0) {
                me.statusEl.addCls(cls);
                me.currIconCls = cls;
            }
        } else {
            me.currIconCls = cls;
        }
        return me;
    },
    /**
     * Convenience method for setting the status text and icon to special values that are pre-configured to indicate
     * a "busy" state, usually for loading or processing activities.
     *
     * @param {Object/String} config (optional) A config object in the same format supported by {@link #setStatus}, or a
     * string to use as the status text (in which case all other options for setStatus will be defaulted).  Use the
     * `text` and/or `iconCls` properties on the config to override the default {@link #busyText}
     * and {@link #busyIconCls} settings. If the config argument is not specified, {@link #busyText} and
     * {@link #busyIconCls} will be used in conjunction with all of the default options for {@link #setStatus}.
     * @return {Ext.ux.statusbar.StatusBar} this
     */
    showBusy: function(o) {
        if (Ext.isString(o)) {
            o = {
                text: o
            };
        }
        o = Ext.applyIf(o || {}, {
            text: this.busyText,
            iconCls: this.busyIconCls
        });
        return this.setStatus(o);
    }
});

/**
 * A GridPanel class with live search support.
 * @author Nicolas Ferrero
 */
Ext.define('Ext.ux.LiveSearchGridPanel', {
    extend: 'Ext.grid.Panel',
    requires: [
        'Ext.toolbar.TextItem',
        'Ext.form.field.Checkbox',
        'Ext.form.field.Text',
        'Ext.ux.statusbar.StatusBar'
    ],
    /**
     * @private
     * search value initialization
     */
    searchValue: null,
    /**
     * @private
     * The matched positions from the most recent search
     */
    matches: [],
    /**
     * @private
     * The current index matched.
     */
    currentIndex: null,
    /**
     * @private
     * The generated regular expression used for searching.
     */
    searchRegExp: null,
    /**
     * @private
     * Case sensitive mode.
     */
    caseSensitive: false,
    /**
     * @private
     * Regular expression mode.
     */
    regExpMode: false,
    /**
     * @cfg {String} matchCls
     * The matched string css classe.
     */
    matchCls: 'x-livesearch-match',
    defaultStatusText: 'Nothing Found',
    // Component initialization override: adds the top and bottom toolbars and setup headers renderer.
    initComponent: function() {
        var me = this;
        me.tbar = [
            'Search',
            {
                xtype: 'textfield',
                name: 'searchField',
                hideLabel: true,
                width: 200,
                listeners: {
                    change: {
                        fn: me.onTextFieldChange,
                        scope: this,
                        buffer: 500
                    }
                }
            },
            {
                xtype: 'button',
                text: '&lt;',
                tooltip: 'Find Previous Row',
                handler: me.onPreviousClick,
                scope: me
            },
            {
                xtype: 'button',
                text: '&gt;',
                tooltip: 'Find Next Row',
                handler: me.onNextClick,
                scope: me
            },
            '-',
            {
                xtype: 'checkbox',
                hideLabel: true,
                margin: '0 0 0 4px',
                handler: me.regExpToggle,
                scope: me
            },
            'Regular expression',
            {
                xtype: 'checkbox',
                hideLabel: true,
                margin: '0 0 0 4px',
                handler: me.caseSensitiveToggle,
                scope: me
            },
            'Case sensitive'
        ];
        me.bbar = new Ext.ux.StatusBar({
            defaultText: me.defaultStatusText,
            name: 'searchStatusBar'
        });
        me.callParent(arguments);
    },
    // afterRender override: it adds textfield and statusbar reference and start monitoring keydown events in textfield input 
    afterRender: function() {
        var me = this;
        me.callParent(arguments);
        me.textField = me.down('textfield[name=searchField]');
        me.statusBar = me.down('statusbar[name=searchStatusBar]');
        me.view.on('cellkeydown', me.focusTextField, me);
    },
    focusTextField: function(view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        if (e.getKey() === e.S) {
            e.preventDefault();
            this.textField.focus();
        }
    },
    // detects html tag
    tagsRe: /<[^>]*>/gm,
    // DEL ASCII code
    tagsProtect: '\x0f',
    /**
     * In normal mode it returns the value with protected regexp characters.
     * In regular expression mode it returns the raw value except if the regexp is invalid.
     * @return {String} The value to process or null if the textfield value is blank or invalid.
     * @private
     */
    getSearchValue: function() {
        var me = this,
            value = me.textField.getValue();
        if (value === '') {
            return null;
        }
        if (!me.regExpMode) {
            value = Ext.String.escapeRegex(value);
        } else {
            try {
                new RegExp(value);
            } catch (error) {
                me.statusBar.setStatus({
                    text: error.message,
                    iconCls: 'x-status-error'
                });
                return null;
            }
            // this is stupid
            if (value === '^' || value === '$') {
                return null;
            }
        }
        return value;
    },
    /**
     * Finds all strings that matches the searched value in each grid cells.
     * @private
     */
    onTextFieldChange: function() {
        var me = this,
            count = 0,
            view = me.view,
            cellSelector = view.cellSelector,
            innerSelector = view.innerSelector,
            columns = me.visibleColumnManager.getColumns();
        view.refresh();
        // reset the statusbar
        me.statusBar.setStatus({
            text: me.defaultStatusText,
            iconCls: ''
        });
        me.searchValue = me.getSearchValue();
        me.matches = [];
        me.currentIndex = null;
        if (me.searchValue !== null) {
            me.searchRegExp = new RegExp(me.getSearchValue(), 'g' + (me.caseSensitive ? '' : 'i'));
            me.store.each(function(record, idx) {
                var node = view.getNode(record);
                if (node) {
                    Ext.Array.forEach(columns, function(column) {
                        var cell = Ext.fly(node).down(column.getCellInnerSelector(), true),
                            matches, cellHTML, seen;
                        if (cell) {
                            matches = cell.innerHTML.match(me.tagsRe);
                            cellHTML = cell.innerHTML.replace(me.tagsRe, me.tagsProtect);
                            // populate indexes array, set currentIndex, and replace wrap matched string in a span
                            cellHTML = cellHTML.replace(me.searchRegExp, function(m) {
                                ++count;
                                if (!seen) {
                                    me.matches.push({
                                        record: record,
                                        column: column
                                    });
                                    seen = true;
                                }
                                return '<span class="' + me.matchCls + '">' + m + '</span>';
                            }, me);
                            // restore protected tags
                            Ext.each(matches, function(match) {
                                cellHTML = cellHTML.replace(me.tagsProtect, match);
                            });
                            // update cell html
                            cell.innerHTML = cellHTML;
                        }
                    });
                }
            }, me);
            // results found
            if (count) {
                me.currentIndex = 0;
                me.gotoCurrent();
                me.statusBar.setStatus({
                    text: Ext.String.format('{0} match{1} found.', count, count === 1 ? 'es' : ''),
                    iconCls: 'x-status-valid'
                });
            }
        }
        // no results found
        if (me.currentIndex === null) {
            me.getSelectionModel().deselectAll();
            me.textField.focus();
        }
    },
    /**
     * Selects the previous row containing a match.
     * @private
     */
    onPreviousClick: function() {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;
        if (len) {
            me.currentIndex = idx === 0 ? len - 1 : idx - 1;
            me.gotoCurrent();
        }
    },
    /**
     * Selects the next row containing a match.
     * @private
     */
    onNextClick: function() {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;
        if (len) {
            me.currentIndex = idx === len - 1 ? 0 : idx + 1;
            me.gotoCurrent();
        }
    },
    /**
     * Switch to case sensitive mode.
     * @private
     */
    caseSensitiveToggle: function(checkbox, checked) {
        this.caseSensitive = checked;
        this.onTextFieldChange();
    },
    /**
     * Switch to regular expression mode
     * @private
     */
    regExpToggle: function(checkbox, checked) {
        this.regExpMode = checked;
        this.onTextFieldChange();
    },
    privates: {
        gotoCurrent: function() {
            var pos = this.matches[this.currentIndex];
            this.getNavigationModel().setPosition(pos.record, pos.column);
            this.getSelectionModel().select(pos.record);
        }
    }
});

/**
 * The Preview Plugin enables toggle of a configurable preview of all visible records.
 *
 * Note: This plugin does NOT assert itself against an existing RowBody feature and may conflict with
 * another instance of the same plugin.
 */
Ext.define('Ext.ux.PreviewPlugin', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.preview',
    requires: [
        'Ext.grid.feature.RowBody'
    ],
    // private, css class to use to hide the body
    hideBodyCls: 'x-grid-row-body-hidden',
    /**
     * @cfg {String} bodyField
     * Field to display in the preview. Must be a field within the Model definition
     * that the store is using.
     */
    bodyField: '',
    /**
     * @cfg {Boolean} previewExpanded
     */
    previewExpanded: true,
    /**
     * Plugin may be safely declared on either a panel.Grid or a Grid View/viewConfig
     * @param {Ext.grid.Panel/Ext.view.View} target
     */
    setCmp: function(target) {
        this.callParent(arguments);
        // Resolve grid from view as necessary
        var me = this,
            grid = me.cmp = target.isXType('gridview') ? target.grid : target,
            bodyField = me.bodyField,
            hideBodyCls = me.hideBodyCls,
            feature = Ext.create('Ext.grid.feature.RowBody', {
                grid: grid,
                getAdditionalData: function(data, idx, model, rowValues) {
                    var getAdditionalData = Ext.grid.feature.RowBody.prototype.getAdditionalData,
                        additionalData = {
                            rowBody: data[bodyField],
                            rowBodyCls: grid.getView().previewExpanded ? '' : hideBodyCls
                        };
                    if (Ext.isFunction(getAdditionalData)) {
                        // "this" is the RowBody object hjere. Do not change to "me"
                        Ext.apply(additionalData, getAdditionalData.apply(this, arguments));
                    }
                    return additionalData;
                }
            }),
            initFeature = function(grid, view) {
                view.previewExpanded = me.previewExpanded;
                // By this point, existing features are already in place, so this must be initialized and added
                view.featuresMC.add(feature);
                feature.init(grid);
            };
        // The grid has already created its view
        if (grid.view) {
            initFeature(grid, grid.view);
        } else // At the time a grid creates its plugins, it has not created all the things
        // it needs to create its view correctly.
        // Process the view and init the RowBody Feature as soon as the view is created.
        {
            grid.on({
                viewcreated: initFeature,
                single: true
            });
        }
    },
    /**
     * Toggle between the preview being expanded/hidden on all rows
     * @param {Boolean} expanded Pass true to expand the record and false to not show the preview.
     */
    toggleExpanded: function(expanded) {
        var grid = this.getCmp(),
            view = grid && grid.getView(),
            bufferedRenderer = view.bufferedRenderer,
            scrollManager = view.scrollManager;
        if (grid && view && expanded !== view.previewExpanded) {
            this.previewExpanded = view.previewExpanded = !!expanded;
            view.refreshView();
            // If we are using the touch scroller, ensure that the scroller knows about
            // the correct scrollable range
            if (scrollManager) {
                if (bufferedRenderer) {
                    bufferedRenderer.stretchView(view, bufferedRenderer.getScrollHeight(true));
                } else {
                    scrollManager.refresh(true);
                }
            }
        }
    }
});

/**
 * Plugin for displaying a progressbar inside of a paging toolbar
 * instead of plain text.
 */
Ext.define('Ext.ux.ProgressBarPager', {
    requires: [
        'Ext.ProgressBar'
    ],
    /**
     * @cfg {Number} width
     * <p>The default progress bar width.  Default is 225.</p>
    */
    width: 225,
    /**
     * @cfg {String} defaultText
    * <p>The text to display while the store is loading.  Default is 'Loading...'</p>
     */
    defaultText: 'Loading...',
    /**
     * @cfg {Object} defaultAnimCfg
     * <p>A {@link Ext.fx.Anim Ext.fx.Anim} configuration object.</p>
     */
    defaultAnimCfg: {
        duration: 1000,
        easing: 'bounceOut'
    },
    /**
     * Creates new ProgressBarPager.
     * @param {Object} config Configuration options
     */
    constructor: function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },
    //public
    init: function(parent) {
        var displayItem;
        if (parent.displayInfo) {
            this.parent = parent;
            displayItem = parent.child("#displayItem");
            if (displayItem) {
                parent.remove(displayItem, true);
            }
            this.progressBar = Ext.create('Ext.ProgressBar', {
                text: this.defaultText,
                width: this.width,
                animate: this.defaultAnimCfg,
                style: {
                    cursor: 'pointer'
                },
                listeners: {
                    el: {
                        scope: this,
                        click: this.handleProgressBarClick
                    }
                }
            });
            parent.displayItem = this.progressBar;
            parent.add(parent.displayItem);
            Ext.apply(parent, this.parentOverrides);
        }
    },
    // private
    // This method handles the click for the progress bar
    handleProgressBarClick: function(e) {
        var parent = this.parent,
            displayItem = parent.displayItem,
            box = this.progressBar.getBox(),
            xy = e.getXY(),
            position = xy[0] - box.x,
            pages = Math.ceil(parent.store.getTotalCount() / parent.pageSize),
            newPage = Math.max(Math.ceil(position / (displayItem.width / pages)), 1);
        parent.store.loadPage(newPage);
    },
    // private, overriddes
    parentOverrides: {
        // private
        // This method updates the information via the progress bar.
        updateInfo: function() {
            if (this.displayItem) {
                var count = this.store.getCount(),
                    pageData = this.getPageData(),
                    message = count === 0 ? this.emptyMsg : Ext.String.format(this.displayMsg, pageData.fromRecord, pageData.toRecord, this.store.getTotalCount()),
                    percentage = pageData.pageCount > 0 ? (pageData.currentPage / pageData.pageCount) : 0;
                this.displayItem.updateProgress(percentage, message, this.animate || this.defaultAnimConfig);
            }
        }
    }
});

/**
 * @deprecated
 * Ext.ux.RowExpander has been promoted to the core framework. Use
 * {@link Ext.grid.plugin.RowExpander} instead.  Ext.ux.RowExpander is now just an empty
 * stub that extends Ext.grid.plugin.RowExpander for backward compatibility reasons.
 */
Ext.define('Ext.ux.RowExpander', {
    extend: 'Ext.grid.plugin.RowExpander'
});

/**
 * Plugin for PagingToolbar which replaces the textfield input with a slider
 */
Ext.define('Ext.ux.SlidingPager', {
    requires: [
        'Ext.slider.Single',
        'Ext.slider.Tip'
    ],
    /**
     * Creates new SlidingPager.
     * @param {Object} config Configuration options
     */
    constructor: function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },
    init: function(pbar) {
        var idx = pbar.items.indexOf(pbar.child("#inputItem")),
            slider;
        Ext.each(pbar.items.getRange(idx - 2, idx + 2), function(c) {
            c.hide();
        });
        slider = Ext.create('Ext.slider.Single', {
            width: 114,
            minValue: 1,
            maxValue: 1,
            hideLabel: true,
            tipText: function(thumb) {
                return Ext.String.format('Page <b>{0}</b> of <b>{1}</b>', thumb.value, thumb.slider.maxValue);
            },
            listeners: {
                changecomplete: function(s, v) {
                    pbar.store.loadPage(v);
                }
            }
        });
        pbar.insert(idx + 1, slider);
        pbar.on({
            change: function(pb, data) {
                slider.setMaxValue(data.pageCount);
                slider.setValue(data.currentPage);
            }
        });
    }
});

/**
 * UX used to provide a spotlight around a specified component/element.
 */
Ext.define('Ext.ux.Spotlight', {
    /**
     * @private
     * The baseCls for the spotlight elements
     */
    baseCls: 'x-spotlight',
    /**
     * @cfg animate {Boolean} True to animate the spotlight change
     * (defaults to true)
     */
    animate: true,
    /**
     * @cfg duration {Integer} The duration of the animation, in milliseconds
     * (defaults to 250)
     */
    duration: 250,
    /**
     * @cfg easing {String} The type of easing for the spotlight animatation
     * (defaults to null)
     */
    easing: null,
    /**
     * @private
     * True if the spotlight is active on the element
     */
    active: false,
    constructor: function(config) {
        Ext.apply(this, config);
    },
    /**
     * Create all the elements for the spotlight
     */
    createElements: function() {
        var me = this,
            baseCls = me.baseCls,
            body = Ext.getBody();
        me.right = body.createChild({
            cls: baseCls
        });
        me.left = body.createChild({
            cls: baseCls
        });
        me.top = body.createChild({
            cls: baseCls
        });
        me.bottom = body.createChild({
            cls: baseCls
        });
        me.all = Ext.create('Ext.CompositeElement', [
            me.right,
            me.left,
            me.top,
            me.bottom
        ]);
    },
    /**
     * Show the spotlight
     */
    show: function(el, callback, scope) {
        var me = this;
        //get the target element
        me.el = Ext.get(el);
        //create the elements if they don't already exist
        if (!me.right) {
            me.createElements();
        }
        if (!me.active) {
            //if the spotlight is not active, show it
            me.all.setDisplayed('');
            me.active = true;
            Ext.on('resize', me.syncSize, me);
            me.applyBounds(me.animate, false);
        } else {
            //if the spotlight is currently active, just move it
            me.applyBounds(false, false);
        }
    },
    /**
     * Hide the spotlight
     */
    hide: function(callback, scope) {
        var me = this;
        Ext.un('resize', me.syncSize, me);
        me.applyBounds(me.animate, true);
    },
    /**
     * Resizes the spotlight with the window size.
     */
    syncSize: function() {
        this.applyBounds(false, false);
    },
    /**
     * Resizes the spotlight depending on the arguments
     * @param {Boolean} animate True to animate the changing of the bounds
     * @param {Boolean} reverse True to reverse the animation
     */
    applyBounds: function(animate, reverse) {
        var me = this,
            box = me.el.getBox(),
            //get the current view width and height
            viewWidth = Ext.Element.getViewportWidth(),
            viewHeight = Ext.Element.getViewportHeight(),
            i = 0,
            config = false,
            from, to, clone;
        //where the element should start (if animation)
        from = {
            right: {
                x: box.right,
                y: viewHeight,
                width: (viewWidth - box.right),
                height: 0
            },
            left: {
                x: 0,
                y: 0,
                width: box.x,
                height: 0
            },
            top: {
                x: viewWidth,
                y: 0,
                width: 0,
                height: box.y
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: 0,
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };
        //where the element needs to finish
        to = {
            right: {
                x: box.right,
                y: box.y,
                width: (viewWidth - box.right) + 'px',
                height: (viewHeight - box.y) + 'px'
            },
            left: {
                x: 0,
                y: 0,
                width: box.x + 'px',
                height: (box.y + box.height) + 'px'
            },
            top: {
                x: box.x,
                y: 0,
                width: (viewWidth - box.x) + 'px',
                height: box.y + 'px'
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: (box.x + box.width) + 'px',
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };
        //reverse the objects
        if (reverse) {
            clone = Ext.clone(from);
            from = to;
            to = clone;
        }
        if (animate) {
            Ext.Array.forEach([
                'right',
                'left',
                'top',
                'bottom'
            ], function(side) {
                me[side].setBox(from[side]);
                me[side].animate({
                    duration: me.duration,
                    easing: me.easing,
                    to: to[side]
                });
            }, this);
        } else {
            Ext.Array.forEach([
                'right',
                'left',
                'top',
                'bottom'
            ], function(side) {
                me[side].setBox(Ext.apply(from[side], to[side]));
                me[side].repaint();
            }, this);
        }
    },
    /**
     * Removes all the elements for the spotlight
     */
    destroy: function() {
        var me = this;
        Ext.destroy(me.right, me.left, me.top, me.bottom);
        delete me.el;
        delete me.all;
    }
});

/**
 * Plugin for adding a close context menu to tabs. Note that the menu respects
 * the closable configuration on the tab. As such, commands like remove others
 * and remove all will not remove items that are not closable.
 */
Ext.define('Ext.ux.TabCloseMenu', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.tabclosemenu',
    mixins: {
        observable: 'Ext.util.Observable'
    },
    /**
     * @cfg {String} closeTabText
     * The text for closing the current tab.
     */
    closeTabText: 'Close Tab',
    /**
     * @cfg {Boolean} showCloseOthers
     * Indicates whether to show the 'Close Others' option.
     */
    showCloseOthers: true,
    /**
     * @cfg {String} closeOthersTabsText
     * The text for closing all tabs except the current one.
     */
    closeOthersTabsText: 'Close Other Tabs',
    /**
     * @cfg {Boolean} showCloseAll
     * Indicates whether to show the 'Close All' option.
     */
    showCloseAll: true,
    /**
     * @cfg {String} closeAllTabsText
     * The text for closing all tabs.
     */
    closeAllTabsText: 'Close All Tabs',
    /**
     * @cfg {Array} extraItemsHead
     * An array of additional context menu items to add to the front of the context menu.
     */
    extraItemsHead: null,
    /**
     * @cfg {Array} extraItemsTail
     * An array of additional context menu items to add to the end of the context menu.
     */
    extraItemsTail: null,
    //public
    constructor: function(config) {
        this.callParent([
            config
        ]);
        this.mixins.observable.constructor.call(this, config);
    },
    init: function(tabpanel) {
        this.tabPanel = tabpanel;
        this.tabBar = tabpanel.down("tabbar");
        this.mon(this.tabPanel, {
            scope: this,
            afterlayout: this.onAfterLayout,
            single: true
        });
    },
    onAfterLayout: function() {
        this.mon(this.tabBar.el, {
            scope: this,
            contextmenu: this.onContextMenu,
            delegate: '.x-tab'
        });
    },
    destroy: function() {
        this.callParent();
        Ext.destroy(this.menu);
    },
    // private
    onContextMenu: function(event, target) {
        var me = this,
            menu = me.createMenu(),
            disableAll = true,
            disableOthers = true,
            tab = me.tabBar.getChildByElement(target),
            index = me.tabBar.items.indexOf(tab);
        me.item = me.tabPanel.getComponent(index);
        menu.child('#close').setDisabled(!me.item.closable);
        if (me.showCloseAll || me.showCloseOthers) {
            me.tabPanel.items.each(function(item) {
                if (item.closable) {
                    disableAll = false;
                    if (item !== me.item) {
                        disableOthers = false;
                        return false;
                    }
                }
                return true;
            });
            if (me.showCloseAll) {
                menu.child('#closeAll').setDisabled(disableAll);
            }
            if (me.showCloseOthers) {
                menu.child('#closeOthers').setDisabled(disableOthers);
            }
        }
        event.preventDefault();
        me.fireEvent('beforemenu', menu, me.item, me);
        menu.showAt(event.getXY());
    },
    createMenu: function() {
        var me = this;
        if (!me.menu) {
            var items = [
                    {
                        itemId: 'close',
                        text: me.closeTabText,
                        scope: me,
                        handler: me.onClose
                    }
                ];
            if (me.showCloseAll || me.showCloseOthers) {
                items.push('-');
            }
            if (me.showCloseOthers) {
                items.push({
                    itemId: 'closeOthers',
                    text: me.closeOthersTabsText,
                    scope: me,
                    handler: me.onCloseOthers
                });
            }
            if (me.showCloseAll) {
                items.push({
                    itemId: 'closeAll',
                    text: me.closeAllTabsText,
                    scope: me,
                    handler: me.onCloseAll
                });
            }
            if (me.extraItemsHead) {
                items = me.extraItemsHead.concat(items);
            }
            if (me.extraItemsTail) {
                items = items.concat(me.extraItemsTail);
            }
            me.menu = Ext.create('Ext.menu.Menu', {
                items: items,
                listeners: {
                    hide: me.onHideMenu,
                    scope: me
                }
            });
        }
        return me.menu;
    },
    onHideMenu: function() {
        var me = this;
        me.fireEvent('aftermenu', me.menu, me);
    },
    onClose: function() {
        this.tabPanel.remove(this.item);
    },
    onCloseOthers: function() {
        this.doClose(true);
    },
    onCloseAll: function() {
        this.doClose(false);
    },
    doClose: function(excludeActive) {
        var items = [];
        this.tabPanel.items.each(function(item) {
            if (item.closable) {
                if (!excludeActive || item !== this.item) {
                    items.push(item);
                }
            }
        }, this);
        Ext.suspendLayouts();
        Ext.Array.forEach(items, function(item) {
            this.tabPanel.remove(item);
        }, this);
        Ext.resumeLayouts(true);
    }
});

/**
 * This plugin allow you to reorder tabs of a TabPanel.
 */
Ext.define('Ext.ux.TabReorderer', {
    extend: 'Ext.ux.BoxReorderer',
    alias: 'plugin.tabreorderer',
    itemSelector: '.' + Ext.baseCSSPrefix + 'tab',
    init: function(tabPanel) {
        var me = this;
        me.callParent([
            tabPanel.getTabBar()
        ]);
        // Ensure reorderable property is copied into dynamically added tabs
        tabPanel.onAdd = Ext.Function.createSequence(tabPanel.onAdd, me.onAdd);
    },
    onBoxReady: function() {
        var tabs, len,
            i = 0,
            tab;
        this.callParent(arguments);
        // Copy reorderable property from card into tab
        for (tabs = this.container.items.items , len = tabs.length; i < len; i++) {
            tab = tabs[i];
            if (tab.card) {
                tab.reorderable = tab.card.reorderable;
            }
        }
    },
    onAdd: function(card, index) {
        card.tab.reorderable = card.reorderable;
    },
    afterBoxReflow: function() {
        var me = this;
        // Cannot use callParent, this is not called in the scope of this plugin, but that of its Ext.dd.DD object
        Ext.ux.BoxReorderer.prototype.afterBoxReflow.apply(me, arguments);
        // Move the associated card to match the tab order
        if (me.dragCmp) {
            me.container.tabPanel.setActiveTab(me.dragCmp.card);
            me.container.tabPanel.move(me.dragCmp.card, me.curIndex);
        }
    }
});

Ext.ns('Ext.ux');
/**
 * Plugin for adding a tab menu to a TabBar is the Tabs overflow.
 */
Ext.define('Ext.ux.TabScrollerMenu', {
    alias: 'plugin.tabscrollermenu',
    requires: [
        'Ext.menu.Menu'
    ],
    /**
     * @cfg {Number} pageSize How many items to allow per submenu.
     */
    pageSize: 10,
    /**
     * @cfg {Number} maxText How long should the title of each {@link Ext.menu.Item} be.
     */
    maxText: 15,
    /**
     * @cfg {String} menuPrefixText Text to prefix the submenus.
     */
    menuPrefixText: 'Items',
    /**
     * Creates new TabScrollerMenu.
     * @param {Object} config Configuration options
     */
    constructor: function(config) {
        Ext.apply(this, config);
    },
    //private
    init: function(tabPanel) {
        var me = this;
        me.tabPanel = tabPanel;
        tabPanel.on({
            render: function() {
                me.tabBar = tabPanel.tabBar;
                me.layout = me.tabBar.layout;
                me.layout.overflowHandler.handleOverflow = Ext.Function.bind(me.showButton, me);
                me.layout.overflowHandler.clearOverflow = Ext.Function.createSequence(me.layout.overflowHandler.clearOverflow, me.hideButton, me);
            },
            destroy: me.destroy,
            scope: me,
            single: true
        });
    },
    showButton: function() {
        var me = this,
            result = Ext.getClass(me.layout.overflowHandler).prototype.handleOverflow.apply(me.layout.overflowHandler, arguments),
            button = me.menuButton;
        if (me.tabPanel.items.getCount() > 1) {
            if (!button) {
                button = me.menuButton = me.tabBar.body.createChild({
                    cls: Ext.baseCSSPrefix + 'tab-tabmenu-right'
                }, me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-scroller-right'));
                button.addClsOnOver(Ext.baseCSSPrefix + 'tab-tabmenu-over');
                button.on('click', me.showTabsMenu, me);
            }
            button.setVisibilityMode(Ext.dom.Element.DISPLAY);
            button.show();
            result.reservedSpace += button.getWidth();
        } else {
            me.hideButton();
        }
        return result;
    },
    hideButton: function() {
        var me = this;
        if (me.menuButton) {
            me.menuButton.hide();
        }
    },
    /**
     * Returns an the current page size (this.pageSize);
     * @return {Number} this.pageSize The current page size.
     */
    getPageSize: function() {
        return this.pageSize;
    },
    /**
     * Sets the number of menu items per submenu "page size".
     * @param {Number} pageSize The page size
     */
    setPageSize: function(pageSize) {
        this.pageSize = pageSize;
    },
    /**
     * Returns the current maxText length;
     * @return {Number} this.maxText The current max text length.
     */
    getMaxText: function() {
        return this.maxText;
    },
    /**
     * Sets the maximum text size for each menu item.
     * @param {Number} t The max text per each menu item.
     */
    setMaxText: function(t) {
        this.maxText = t;
    },
    /**
     * Returns the current menu prefix text String.;
     * @return {String} this.menuPrefixText The current menu prefix text.
     */
    getMenuPrefixText: function() {
        return this.menuPrefixText;
    },
    /**
     * Sets the menu prefix text String.
     * @param {String} t The menu prefix text.
     */
    setMenuPrefixText: function(t) {
        this.menuPrefixText = t;
    },
    showTabsMenu: function(e) {
        var me = this;
        if (me.tabsMenu) {
            me.tabsMenu.removeAll();
        } else {
            me.tabsMenu = new Ext.menu.Menu();
        }
        me.generateTabMenuItems();
        var target = Ext.get(e.getTarget()),
            xy = target.getXY();
        //Y param + 24 pixels
        xy[1] += 24;
        me.tabsMenu.showAt(xy);
    },
    // private
    generateTabMenuItems: function() {
        var me = this,
            tabPanel = me.tabPanel,
            curActive = tabPanel.getActiveTab(),
            allItems = tabPanel.items.getRange(),
            pageSize = me.getPageSize(),
            tabsMenu = me.tabsMenu,
            totalItems, numSubMenus, remainder, i, curPage, menuItems, x, item, start, index;
        tabsMenu.suspendLayouts();
        allItems = Ext.Array.filter(allItems, function(item) {
            if (item.id == curActive.id) {
                return false;
            }
            return item.hidden ? !!item.hiddenByLayout : true;
        });
        totalItems = allItems.length;
        numSubMenus = Math.floor(totalItems / pageSize);
        remainder = totalItems % pageSize;
        if (totalItems > pageSize) {
            // Loop through all of the items and create submenus in chunks of 10
            for (i = 0; i < numSubMenus; i++) {
                curPage = (i + 1) * pageSize;
                menuItems = [];
                for (x = 0; x < pageSize; x++) {
                    index = x + curPage - pageSize;
                    item = allItems[index];
                    menuItems.push(me.autoGenMenuItem(item));
                }
                tabsMenu.add({
                    text: me.getMenuPrefixText() + ' ' + (curPage - pageSize + 1) + ' - ' + curPage,
                    menu: menuItems
                });
            }
            // remaining items
            if (remainder > 0) {
                start = numSubMenus * pageSize;
                menuItems = [];
                for (i = start; i < totalItems; i++) {
                    item = allItems[i];
                    menuItems.push(me.autoGenMenuItem(item));
                }
                me.tabsMenu.add({
                    text: me.menuPrefixText + ' ' + (start + 1) + ' - ' + (start + menuItems.length),
                    menu: menuItems
                });
            }
        } else {
            for (i = 0; i < totalItems; ++i) {
                tabsMenu.add(me.autoGenMenuItem(allItems[i]));
            }
        }
        tabsMenu.resumeLayouts(true);
    },
    // private
    autoGenMenuItem: function(item) {
        var maxText = this.getMaxText(),
            text = Ext.util.Format.ellipsis(item.title, maxText);
        return {
            text: text,
            handler: this.showTabFromMenu,
            scope: this,
            disabled: item.disabled,
            tabToShow: item,
            iconCls: item.iconCls
        };
    },
    // private
    showTabFromMenu: function(menuItem) {
        this.tabPanel.setActiveTab(menuItem.tabToShow);
    },
    destroy: function() {
        Ext.destroy(this.tabsMenu, this.menuButton);
    }
});

/**
 * Plugin which allows items to be dropped onto a toolbar and be turned into new Toolbar items.
 * To use the plugin, you just need to provide a createItem implementation that takes the drop
 * data as an argument and returns an object that can be placed onto the toolbar. Example:
 * <pre>
 * Ext.create('Ext.ux.ToolbarDroppable', {
 *   createItem: function(data) {
 *     return Ext.create('Ext.Button', {text: data.text});
 *   }
 * });
 * </pre>
 * The afterLayout function can also be overridden, and is called after a new item has been
 * created and inserted into the Toolbar. Use this for any logic that needs to be run after
 * the item has been created.
 */
Ext.define('Ext.ux.ToolbarDroppable', {
    /**
     * Creates new ToolbarDroppable.
     * @param {Object} config Config options.
     */
    constructor: function(config) {
        Ext.apply(this, config);
    },
    /**
     * Initializes the plugin and saves a reference to the toolbar
     * @param {Ext.toolbar.Toolbar} toolbar The toolbar instance
     */
    init: function(toolbar) {
        /**
       * @property toolbar
       * @type Ext.toolbar.Toolbar
       * The toolbar instance that this plugin is tied to
       */
        this.toolbar = toolbar;
        this.toolbar.on({
            scope: this,
            render: this.createDropTarget
        });
    },
    /**
     * Creates a drop target on the toolbar
     */
    createDropTarget: function() {
        /**
         * @property dropTarget
         * @type Ext.dd.DropTarget
         * The drop target attached to the toolbar instance
         */
        this.dropTarget = Ext.create('Ext.dd.DropTarget', this.toolbar.getEl(), {
            notifyOver: Ext.Function.bind(this.notifyOver, this),
            notifyDrop: Ext.Function.bind(this.notifyDrop, this)
        });
    },
    /**
     * Adds the given DD Group to the drop target
     * @param {String} ddGroup The DD Group
     */
    addDDGroup: function(ddGroup) {
        this.dropTarget.addToGroup(ddGroup);
    },
    /**
     * Calculates the location on the toolbar to create the new sorter button based on the XY of the
     * drag event
     * @param {Ext.event.Event} e The event object
     * @return {Number} The index at which to insert the new button
     */
    calculateEntryIndex: function(e) {
        var entryIndex = 0,
            toolbar = this.toolbar,
            items = toolbar.items.items,
            count = items.length,
            xHover = e.getXY()[0],
            index = 0,
            el, xTotal, width, midpoint;
        for (; index < count; index++) {
            el = items[index].getEl();
            xTotal = el.getXY()[0];
            width = el.getWidth();
            midpoint = xTotal + width / 2;
            if (xHover < midpoint) {
                entryIndex = index;
                break;
            } else {
                entryIndex = index + 1;
            }
        }
        return entryIndex;
    },
    /**
     * Returns true if the drop is allowed on the drop target. This function can be overridden
     * and defaults to simply return true
     * @param {Object} data Arbitrary data from the drag source
     * @return {Boolean} True if the drop is allowed
     */
    canDrop: function(data) {
        return true;
    },
    /**
     * Custom notifyOver method which will be used in the plugin's internal DropTarget
     * @return {String} The CSS class to add
     */
    notifyOver: function(dragSource, event, data) {
        return this.canDrop.apply(this, arguments) ? this.dropTarget.dropAllowed : this.dropTarget.dropNotAllowed;
    },
    /**
     * Called when the drop has been made. Creates the new toolbar item, places it at the correct location
     * and calls the afterLayout callback.
     */
    notifyDrop: function(dragSource, event, data) {
        var canAdd = this.canDrop(dragSource, event, data),
            tbar = this.toolbar;
        if (canAdd) {
            var entryIndex = this.calculateEntryIndex(event);
            tbar.insert(entryIndex, this.createItem(data));
            tbar.doLayout();
            this.afterLayout();
        }
        return canAdd;
    },
    /**
     * Creates the new toolbar item based on drop data. This method must be implemented by the plugin instance
     * @param {Object} data Arbitrary data from the drop
     * @return {Mixed} An item that can be added to a toolbar
     */
    createItem: function(data) {
        Ext.Error.raise("The createItem method must be implemented in the ToolbarDroppable plugin");
    },
    /**
     * Called after a new button has been created and added to the toolbar. Add any required cleanup logic here
     */
    afterLayout: Ext.emptyFn
});

/**
 * A Picker field that contains a tree panel on its popup, enabling selection of tree nodes.
 */
Ext.define('Ext.ux.TreePicker', {
    extend: 'Ext.form.field.Picker',
    xtype: 'treepicker',
    uses: [
        'Ext.tree.Panel'
    ],
    triggerCls: Ext.baseCSSPrefix + 'form-arrow-trigger',
    config: {
        /**
         * @cfg {Ext.data.TreeStore} store
         * A tree store that the tree picker will be bound to
         */
        store: null,
        /**
         * @cfg {String} displayField
         * The field inside the model that will be used as the node's text.
         * Defaults to the default value of {@link Ext.tree.Panel}'s `displayField` configuration.
         */
        displayField: null,
        /**
         * @cfg {Array} columns
         * An optional array of columns for multi-column trees
         */
        columns: null,
        /**
         * @cfg {Boolean} selectOnTab
         * Whether the Tab key should select the currently highlighted item. Defaults to `true`.
         */
        selectOnTab: true,
        /**
         * @cfg {Number} maxPickerHeight
         * The maximum height of the tree dropdown. Defaults to 300.
         */
        maxPickerHeight: 300,
        /**
         * @cfg {Number} minPickerHeight
         * The minimum height of the tree dropdown. Defaults to 100.
         */
        minPickerHeight: 100
    },
    editable: false,
    /**
     * @event select
     * Fires when a tree node is selected
     * @param {Ext.ux.TreePicker} picker        This tree picker
     * @param {Ext.data.Model} record           The selected record
     */
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.mon(me.store, {
            scope: me,
            load: me.onLoad,
            update: me.onUpdate
        });
    },
    /**
     * Creates and returns the tree panel to be used as this field's picker.
     */
    createPicker: function() {
        var me = this,
            picker = new Ext.tree.Panel({
                shrinkWrapDock: 2,
                store: me.store,
                floating: true,
                displayField: me.displayField,
                columns: me.columns,
                minHeight: me.minPickerHeight,
                maxHeight: me.maxPickerHeight,
                manageHeight: false,
                shadow: false,
                listeners: {
                    scope: me,
                    itemclick: me.onItemClick
                },
                viewConfig: {
                    listeners: {
                        scope: me,
                        render: me.onViewRender
                    }
                }
            }),
            view = picker.getView();
        if (Ext.isIE9 && Ext.isStrict) {
            // In IE9 strict mode, the tree view grows by the height of the horizontal scroll bar when the items are highlighted or unhighlighted.
            // Also when items are collapsed or expanded the height of the view is off. Forcing a repaint fixes the problem.
            view.on({
                scope: me,
                highlightitem: me.repaintPickerView,
                unhighlightitem: me.repaintPickerView,
                afteritemexpand: me.repaintPickerView,
                afteritemcollapse: me.repaintPickerView
            });
        }
        return picker;
    },
    onViewRender: function(view) {
        view.getEl().on('keypress', this.onPickerKeypress, this);
    },
    /**
     * repaints the tree view
     */
    repaintPickerView: function() {
        var style = this.picker.getView().getEl().dom.style;
        // can't use Element.repaint because it contains a setTimeout, which results in a flicker effect
        style.display = style.display;
    },
    /**
     * Handles a click even on a tree node
     * @private
     * @param {Ext.tree.View} view
     * @param {Ext.data.Model} record
     * @param {HTMLElement} node
     * @param {Number} rowIndex
     * @param {Ext.event.Event} e
     */
    onItemClick: function(view, record, node, rowIndex, e) {
        this.selectItem(record);
    },
    /**
     * Handles a keypress event on the picker element
     * @private
     * @param {Ext.event.Event} e
     * @param {HTMLElement} el
     */
    onPickerKeypress: function(e, el) {
        var key = e.getKey();
        if (key === e.ENTER || (key === e.TAB && this.selectOnTab)) {
            this.selectItem(this.picker.getSelectionModel().getSelection()[0]);
        }
    },
    /**
     * Changes the selection to a given record and closes the picker
     * @private
     * @param {Ext.data.Model} record
     */
    selectItem: function(record) {
        var me = this;
        me.setValue(record.getId());
        me.fireEvent('select', me, record);
        me.collapse();
    },
    /**
     * Runs when the picker is expanded.  Selects the appropriate tree node based on the value of the input element,
     * and focuses the picker so that keyboard navigation will work.
     * @private
     */
    onExpand: function() {
        var me = this,
            picker = me.picker,
            store = picker.store,
            value = me.value,
            node;
        if (value) {
            node = store.getNodeById(value);
        }
        if (!node) {
            node = store.getRoot();
        }
        picker.selectPath(node.getPath());
    },
    /**
     * Sets the specified value into the field
     * @param {Mixed} value
     * @return {Ext.ux.TreePicker} this
     */
    setValue: function(value) {
        var me = this,
            record;
        me.value = value;
        if (me.store.loading) {
            // Called while the Store is loading. Ensure it is processed by the onLoad method.
            return me;
        }
        // try to find a record in the store that matches the value
        record = value ? me.store.getNodeById(value) : me.store.getRoot();
        if (value === undefined) {
            record = me.store.getRoot();
            me.value = record.getId();
        } else {
            record = me.store.getNodeById(value);
        }
        // set the raw value to the record's display field if a record was found
        me.setRawValue(record ? record.get(me.displayField) : '');
        return me;
    },
    getSubmitValue: function() {
        return this.value;
    },
    /**
     * Returns the current data value of the field (the idProperty of the record)
     * @return {Number}
     */
    getValue: function() {
        return this.value;
    },
    /**
     * Handles the store's load event.
     * @private
     */
    onLoad: function() {
        var value = this.value;
        if (value) {
            this.setValue(value);
        }
    },
    onUpdate: function(store, rec, type, modifiedFieldNames) {
        var display = this.displayField;
        if (type === 'edit' && modifiedFieldNames && Ext.Array.contains(modifiedFieldNames, display) && this.value === rec.getId()) {
            this.setRawValue(rec.get(display));
        }
    }
});

/**
 * @author Don Griffin
 *
 * This is a base class for more advanced "simlets" (simulated servers). A simlet is asked
 * to provide a response given a {@link Ext.ux.ajax.SimXhr} instance.
 */
Ext.define('Ext.ux.ajax.Simlet', function() {
    var urlRegex = /([^?#]*)(#.*)?$/,
        dateRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/,
        intRegex = /^[+-]?\d+$/,
        floatRegex = /^[+-]?\d+\.\d+$/;
    function parseParamValue(value) {
        var m;
        if (Ext.isDefined(value)) {
            value = decodeURIComponent(value);
            if (intRegex.test(value)) {
                value = parseInt(value, 10);
            } else if (floatRegex.test(value)) {
                value = parseFloat(value);
            } else if (!!(m = dateRegex.test(value))) {
                value = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
            }
        }
        return value;
    }
    return {
        alias: 'simlet.basic',
        isSimlet: true,
        responseProps: [
            'responseText',
            'responseXML',
            'status',
            'statusText'
        ],
        /**
         * @cfg {Number} responseText
         */
        /**
         * @cfg {Number} responseXML
         */
        /**
         * @cfg {Object} responseHeaders
         */
        /**
         * @cfg {Number} status
         */
        status: 200,
        /**
         * @cfg {String} statusText
         */
        statusText: 'OK',
        constructor: function(config) {
            Ext.apply(this, config);
        },
        doGet: function(ctx) {
            var me = this,
                ret = {};
            Ext.Array.forEach(me.responseProps, function(prop) {
                if (prop in me) {
                    ret[prop] = me[prop];
                }
            });
            return ret;
        },
        doPost: function(ctx) {
            var me = this,
                ret = {};
            Ext.Array.forEach(me.responseProps, function(prop) {
                if (prop in me) {
                    ret[prop] = me[prop];
                }
            });
            return ret;
        },
        doRedirect: function(ctx) {
            return false;
        },
        /**
         * Performs the action requested by the given XHR and returns an object to be applied
         * on to the XHR (containing `status`, `responseText`, etc.). For the most part,
         * this is delegated to `doMethod` methods on this class, such as `doGet`.
         *
         * @param {Ext.ux.ajax.SimXhr} xhr The simulated XMLHttpRequest instance.
         * @returns {Object} The response properties to add to the XMLHttpRequest.
         */
        exec: function(xhr) {
            var me = this,
                ret = {},
                method = 'do' + Ext.String.capitalize(xhr.method.toLowerCase()),
                // doGet
                fn = me[method];
            if (fn) {
                ret = fn.call(me, me.getCtx(xhr.method, xhr.url, xhr));
            } else {
                ret = {
                    status: 405,
                    statusText: 'Method Not Allowed'
                };
            }
            return ret;
        },
        getCtx: function(method, url, xhr) {
            return {
                method: method,
                params: this.parseQueryString(url),
                url: url,
                xhr: xhr
            };
        },
        openRequest: function(method, url, options, async) {
            var ctx = this.getCtx(method, url),
                redirect = this.doRedirect(ctx),
                xhr;
            if (redirect) {
                xhr = redirect;
            } else {
                xhr = new Ext.ux.ajax.SimXhr({
                    mgr: this.manager,
                    simlet: this,
                    options: options
                });
                xhr.open(method, url, async);
            }
            return xhr;
        },
        parseQueryString: function(str) {
            var m = urlRegex.exec(str),
                ret = {},
                key, value, i, n;
            if (m && m[1]) {
                var pair,
                    parts = m[1].split('&');
                for (i = 0 , n = parts.length; i < n; ++i) {
                    if ((pair = parts[i].split('='))[0]) {
                        key = decodeURIComponent(pair.shift());
                        value = parseParamValue((pair.length > 1) ? pair.join('=') : pair[0]);
                        if (!(key in ret)) {
                            ret[key] = value;
                        } else if (Ext.isArray(ret[key])) {
                            ret[key].push(value);
                        } else {
                            ret[key] = [
                                ret[key],
                                value
                            ];
                        }
                    }
                }
            }
            return ret;
        },
        redirect: function(method, url, params) {
            switch (arguments.length) {
                case 2:
                    if (typeof url == 'string') {
                        break;
                    };
                    params = url;
                // fall...
                case 1:
                    url = method;
                    method = 'GET';
                    break;
            }
            if (params) {
                url = Ext.urlAppend(url, Ext.Object.toQueryString(params));
            }
            return this.manager.openRequest(method, url);
        }
    };
}());

/**
 * This base class is used to handle data preparation (e.g., sorting, filtering and
 * group summary).
 */
Ext.define('Ext.ux.ajax.DataSimlet', function() {
    function makeSortFn(def, cmp) {
        var order = def.direction,
            sign = (order && order.toUpperCase() === 'DESC') ? -1 : 1;
        return function(leftRec, rightRec) {
            var lhs = leftRec[def.property],
                rhs = rightRec[def.property],
                c = (lhs < rhs) ? -1 : ((rhs < lhs) ? 1 : 0);
            if (c || !cmp) {
                return c * sign;
            }
            return cmp(leftRec, rightRec);
        };
    }
    function makeSortFns(defs, cmp) {
        for (var sortFn = cmp,
            i = defs && defs.length; i; ) {
            sortFn = makeSortFn(defs[--i], sortFn);
        }
        return sortFn;
    }
    return {
        extend: 'Ext.ux.ajax.Simlet',
        buildNodes: function(node, path) {
            var me = this,
                nodeData = {
                    data: []
                },
                len = node.length,
                children, i, child, name;
            me.nodes[path] = nodeData;
            for (i = 0; i < len; ++i) {
                nodeData.data.push(child = node[i]);
                name = child.text || child.title;
                child.id = path ? path + '/' + name : name;
                children = child.children;
                if (!(child.leaf = !children)) {
                    delete child.children;
                    me.buildNodes(children, child.id);
                }
            }
        },
        fixTree: function(ctx, tree) {
            var me = this,
                node = ctx.params.node,
                nodes;
            if (!(nodes = me.nodes)) {
                me.nodes = nodes = {};
                me.buildNodes(tree, '');
            }
            node = nodes[node];
            if (node) {
                if (me.node) {
                    me.node.sortedData = me.sortedData;
                    me.node.currentOrder = me.currentOrder;
                }
                me.node = node;
                me.data = node.data;
                me.sortedData = node.sortedData;
                me.currentOrder = node.currentOrder;
            } else {
                me.data = null;
            }
        },
        getData: function(ctx) {
            var me = this,
                params = ctx.params,
                order = (params.filter || '') + (params.group || '') + '-' + (params.sort || '') + '-' + (params.dir || ''),
                tree = me.tree,
                dynamicData, data, fields, sortFn;
            if (tree) {
                me.fixTree(ctx, tree);
            }
            data = me.data;
            if (typeof data === 'function') {
                dynamicData = true;
                data = data.call(this, ctx);
            }
            // If order is '--' then it means we had no order passed, due to the string concat above
            if (!data || order === '--') {
                return data || [];
            }
            if (!dynamicData && order == me.currentOrder) {
                return me.sortedData;
            }
            ctx.filterSpec = params.filter && Ext.decode(params.filter);
            ctx.groupSpec = params.group && Ext.decode(params.group);
            fields = params.sort;
            if (params.dir) {
                fields = [
                    {
                        direction: params.dir,
                        property: fields
                    }
                ];
            } else {
                fields = Ext.decode(params.sort);
            }
            if (ctx.filterSpec) {
                var filters = new Ext.util.FilterCollection();
                filters.add(this.processFilters(ctx.filterSpec));
                data = Ext.Array.filter(data, filters.getFilterFn());
            }
            sortFn = makeSortFns((ctx.sortSpec = fields));
            if (ctx.groupSpec) {
                sortFn = makeSortFns([
                    ctx.groupSpec
                ], sortFn);
            }
            // If a straight Ajax request, data may not be an array.
            // If an Array, preserve 'physical' order of raw data...
            data = Ext.isArray(data) ? data.slice(0) : data;
            if (sortFn) {
                Ext.Array.sort(data, sortFn);
            }
            me.sortedData = data;
            me.currentOrder = order;
            return data;
        },
        processFilters: Ext.identityFn,
        getPage: function(ctx, data) {
            var ret = data,
                length = data.length,
                start = ctx.params.start || 0,
                end = ctx.params.limit ? Math.min(length, start + ctx.params.limit) : length;
            if (start || end < length) {
                ret = ret.slice(start, end);
            }
            return ret;
        },
        getGroupSummary: function(groupField, rows, ctx) {
            return rows[0];
        },
        getSummary: function(ctx, data, page) {
            var me = this,
                groupField = ctx.groupSpec.property,
                accum,
                todo = {},
                summary = [],
                fieldValue, lastFieldValue;
            Ext.each(page, function(rec) {
                fieldValue = rec[groupField];
                todo[fieldValue] = true;
            });
            function flush() {
                if (accum) {
                    summary.push(me.getGroupSummary(groupField, accum, ctx));
                    accum = null;
                }
            }
            // data is ordered primarily by the groupField, so one pass can pick up all
            // the summaries one at a time.
            Ext.each(data, function(rec) {
                fieldValue = rec[groupField];
                if (lastFieldValue !== fieldValue) {
                    flush();
                    lastFieldValue = fieldValue;
                }
                if (!todo[fieldValue]) {
                    // if we have even 1 summary, we have summarized all that we need
                    // (again because data and page are ordered by groupField)
                    return !summary.length;
                }
                if (accum) {
                    accum.push(rec);
                } else {
                    accum = [
                        rec
                    ];
                }
                return true;
            });
            flush();
            // make sure that last pesky summary goes...
            return summary;
        }
    };
}());

/**
 * JSON Simlet.
 */
Ext.define('Ext.ux.ajax.JsonSimlet', {
    extend: 'Ext.ux.ajax.DataSimlet',
    alias: 'simlet.json',
    doGet: function(ctx) {
        var me = this,
            data = me.getData(ctx),
            page = me.getPage(ctx, data),
            reader = ctx.xhr.options.proxy && ctx.xhr.options.proxy.getReader(),
            root = reader && reader.getRootProperty(),
            ret = me.callParent(arguments),
            // pick up status/statusText
            response = {};
        if (root && Ext.isArray(page)) {
            response[root] = page;
            response[reader.getTotalProperty()] = data.length;
        } else {
            response = page;
        }
        if (ctx.groupSpec) {
            response.summaryData = me.getSummary(ctx, data, page);
        }
        ret.responseText = Ext.encode(response);
        return ret;
    }
});

/**
 * @author Don Griffin
 *
 * Simulates an XMLHttpRequest object's methods and properties but is backed by a
 * {@link Ext.ux.ajax.Simlet} instance that provides the data.
 */
Ext.define('Ext.ux.ajax.SimXhr', {
    readyState: 0,
    mgr: null,
    simlet: null,
    constructor: function(config) {
        var me = this;
        Ext.apply(me, config);
        me.requestHeaders = {};
    },
    abort: function() {
        var me = this;
        if (me.timer) {
            clearTimeout(me.timer);
            me.timer = null;
        }
        me.aborted = true;
    },
    getAllResponseHeaders: function() {
        var headers = [];
        if (Ext.isObject(this.responseHeaders)) {
            Ext.Object.each(this.responseHeaders, function(name, value) {
                headers.push(name + ': ' + value);
            });
        }
        return headers.join('\r\n');
    },
    getResponseHeader: function(header) {
        var headers = this.responseHeaders;
        return (headers && headers[header]) || null;
    },
    open: function(method, url, async, user, password) {
        var me = this;
        me.method = method;
        me.url = url;
        me.async = async !== false;
        me.user = user;
        me.password = password;
        me.setReadyState(1);
    },
    overrideMimeType: function(mimeType) {
        this.mimeType = mimeType;
    },
    schedule: function() {
        var me = this,
            delay = me.mgr.delay;
        if (delay) {
            me.timer = setTimeout(function() {
                me.onTick();
            }, delay);
        } else {
            me.onTick();
        }
    },
    send: function(body) {
        var me = this;
        me.body = body;
        if (me.async) {
            me.schedule();
        } else {
            me.onComplete();
        }
    },
    setReadyState: function(state) {
        var me = this;
        if (me.readyState != state) {
            me.readyState = state;
            me.onreadystatechange();
        }
    },
    setRequestHeader: function(header, value) {
        this.requestHeaders[header] = value;
    },
    // handlers
    onreadystatechange: Ext.emptyFn,
    onComplete: function() {
        var me = this,
            callback;
        me.readyState = 4;
        Ext.apply(me, me.simlet.exec(me));
        callback = me.jsonpCallback;
        if (callback) {
            var text = callback + '(' + me.responseText + ')';
            eval(text);
        }
    },
    onTick: function() {
        var me = this;
        me.timer = null;
        me.onComplete();
        me.onreadystatechange && me.onreadystatechange();
    }
});

/**
 * @author Don Griffin
 *
 * This singleton manages simulated Ajax responses. This allows application logic to be
 * written unaware that its Ajax calls are being handled by simulations ("simlets"). This
 * is currently done by hooking {@link Ext.data.Connection} methods, so all users of that
 * class (and {@link Ext.Ajax} since it is a derived class) qualify for simulation.
 *
 * The requires hooks are inserted when either the {@link #init} method is called or the
 * first {@link Ext.ux.ajax.Simlet} is registered. For example:
 *
 *      Ext.onReady(function () {
 *          initAjaxSim();
 *
 *          // normal stuff
 *      });
 *
 *      function initAjaxSim () {
 *          Ext.ux.ajax.SimManager.init({
 *              delay: 300
 *          }).register({
 *              '/app/data/url': {
 *                  type: 'json',  // use JsonSimlet (type is like xtype for components)
 *                  data: [
 *                      { foo: 42, bar: 'abc' },
 *                      ...
 *                  ]
 *              }
 *          });
 *      }
 *
 * As many URL's as desired can be registered and associated with a {@link Ext.ux.ajax.Simlet}. To make
 * non-simulated Ajax requests once this singleton is initialized, add a `nosim:true` option
 * to the Ajax options:
 *
 *      Ext.Ajax.request({
 *          url: 'page.php',
 *          nosim: true, // ignored by normal Ajax request
 *          params: {
 *              id: 1
 *          },
 *          success: function(response){
 *              var text = response.responseText;
 *              // process server response here
 *          }
 *      });
 */
Ext.define('Ext.ux.ajax.SimManager', {
    singleton: true,
    requires: [
        'Ext.data.Connection',
        'Ext.ux.ajax.SimXhr',
        'Ext.ux.ajax.Simlet',
        'Ext.ux.ajax.JsonSimlet'
    ],
    /**
     * @cfg {Ext.ux.ajax.Simlet} defaultSimlet
     * The {@link Ext.ux.ajax.Simlet} instance to use for non-matching URL's. By default, this will
     * return 404. Set this to null to use real Ajax calls for non-matching URL's.
     */
    /**
     * @cfg {String} defaultType
     * The default `type` to apply to generic {@link Ext.ux.ajax.Simlet} configuration objects. The
     * default is 'basic'.
     */
    defaultType: 'basic',
    /**
     * @cfg {Number} delay
     * The number of milliseconds to delay before delivering a response to an async request.
     */
    delay: 150,
    /**
     * @property {Boolean} ready
     * True once this singleton has initialized and applied its Ajax hooks.
     * @private
     */
    ready: false,
    constructor: function() {
        this.simlets = [];
    },
    getSimlet: function(url) {
        // Strip down to base URL (no query parameters or hash):
        var me = this,
            index = url.indexOf('?'),
            simlets = me.simlets,
            len = simlets.length,
            i, simlet, simUrl, match;
        if (index < 0) {
            index = url.indexOf('#');
        }
        if (index > 0) {
            url = url.substring(0, index);
        }
        for (i = 0; i < len; ++i) {
            simlet = simlets[i];
            simUrl = simlet.url;
            if (simUrl instanceof RegExp) {
                match = simUrl.test(url);
            } else {
                match = simUrl === url;
            }
            if (match) {
                return simlet;
            }
        }
        return me.defaultSimlet;
    },
    getXhr: function(method, url, options, async) {
        var simlet = this.getSimlet(url);
        if (simlet) {
            return simlet.openRequest(method, url, options, async);
        }
        return null;
    },
    /**
     * Initializes this singleton and applies configuration options.
     * @param {Object} config An optional object with configuration properties to apply.
     * @return {Ext.ux.ajax.SimManager} this
     */
    init: function(config) {
        var me = this;
        Ext.apply(me, config);
        if (!me.ready) {
            me.ready = true;
            if (!('defaultSimlet' in me)) {
                me.defaultSimlet = new Ext.ux.ajax.Simlet({
                    status: 404,
                    statusText: 'Not Found'
                });
            }
            me._openRequest = Ext.data.Connection.prototype.openRequest;
            Ext.data.Connection.override({
                openRequest: function(options, requestOptions, async) {
                    var xhr = !options.nosim && me.getXhr(requestOptions.method, requestOptions.url, options, async);
                    if (!xhr) {
                        xhr = this.callParent(arguments);
                    }
                    return xhr;
                }
            });
            if (Ext.data.JsonP) {
                Ext.data.JsonP.self.override({
                    createScript: function(url, params, options) {
                        var fullUrl = Ext.urlAppend(url, Ext.Object.toQueryString(params)),
                            script = !options.nosim && me.getXhr('GET', fullUrl, options, true);
                        if (!script) {
                            script = this.callParent(arguments);
                        }
                        return script;
                    },
                    loadScript: function(request) {
                        var script = request.script;
                        if (script.simlet) {
                            script.jsonpCallback = request.params[request.callbackKey];
                            script.send(null);
                            // Ext.data.JsonP will attempt dom removal of a script tag, so emulate its presence
                            request.script = document.createElement('script');
                        } else {
                            this.callParent(arguments);
                        }
                    }
                });
            }
        }
        return me;
    },
    openRequest: function(method, url, async) {
        var opt = {
                method: method,
                url: url
            };
        return this._openRequest.call(Ext.data.Connection.prototype, {}, opt, async);
    },
    /**
     * Registeres one or more {@link Ext.ux.ajax.Simlet} instances.
     * @param {Array/Object} simlet Either a {@link Ext.ux.ajax.Simlet} instance or config, an Array
     * of such elements or an Object keyed by URL with values that are {@link Ext.ux.ajax.Simlet}
     * instances or configs.
     */
    register: function(simlet) {
        var me = this;
        me.init();
        function reg(one) {
            var simlet = one;
            if (!simlet.isSimlet) {
                simlet = Ext.create('simlet.' + (simlet.type || simlet.stype || me.defaultType), one);
            }
            me.simlets.push(simlet);
            simlet.manager = me;
        }
        if (Ext.isArray(simlet)) {
            Ext.each(simlet, reg);
        } else if (simlet.isSimlet || simlet.url) {
            reg(simlet);
        } else {
            Ext.Object.each(simlet, function(url, s) {
                s.url = url;
                reg(s);
            });
        }
        return me;
    }
});

/**
 * This class simulates XML-based requests.
 */
Ext.define('Ext.ux.ajax.XmlSimlet', {
    extend: 'Ext.ux.ajax.DataSimlet',
    alias: 'simlet.xml',
    /**
     * This template is used to populate the XML response. The configuration of the Reader
     * is available so that its `root` and `record` properties can be used as well as the
     * `fields` of the associated `model`. But beyond that, the way these pieces are put
     * together in the document requires the flexibility of a template.
     */
    xmlTpl: [
        '<{root}>\n',
        '<tpl for="data">',
        '    <{parent.record}>\n',
        '<tpl for="parent.fields">',
        '        <{name}>{[parent[values.name]]}</{name}>\n',
        '</tpl>',
        '    </{parent.record}>\n',
        '</tpl>',
        '</{root}>'
    ],
    doGet: function(ctx) {
        var me = this,
            data = me.getData(ctx),
            page = me.getPage(ctx, data),
            proxy = ctx.xhr.options.operation.getProxy(),
            reader = proxy && proxy.getReader(),
            model = reader && reader.getModel(),
            ret = me.callParent(arguments),
            // pick up status/statusText
            response = {
                data: page,
                reader: reader,
                fields: model && model.fields,
                root: reader && reader.getRootProperty(),
                record: reader && reader.record
            },
            tpl, xml, doc;
        if (ctx.groupSpec) {
            response.summaryData = me.getSummary(ctx, data, page);
        }
        // If a straight Ajax request there won't be an xmlTpl.
        if (me.xmlTpl) {
            tpl = Ext.XTemplate.getTpl(me, 'xmlTpl');
            xml = tpl.apply(response);
        } else {
            xml = data;
        }
        if (typeof DOMParser != 'undefined') {
            doc = (new DOMParser()).parseFromString(xml, "text/xml");
        } else {
            // IE doesn't have DOMParser, but fortunately, there is an ActiveX for XML
            doc = new ActiveXObject("Microsoft.XMLDOM");
            doc.async = false;
            doc.loadXML(xml);
        }
        ret.responseText = xml;
        ret.responseXML = doc;
        return ret;
    },
    fixTree: function() {
        this.callParent(arguments);
        var buffer = [];
        this.buildTreeXml(this.data, buffer);
        this.data = buffer.join('');
    },
    buildTreeXml: function(nodes, buffer) {
        var rootProperty = this.rootProperty,
            recordProperty = this.recordProperty;
        buffer.push('<', rootProperty, '>');
        Ext.Array.forEach(nodes, function(node) {
            buffer.push('<', recordProperty, '>');
            for (var key in node) {
                if (key == 'children') {
                    this.buildTreeXml(node.children, buffer);
                } else {
                    buffer.push('<', key, '>', node[key], '</', key, '>');
                }
            }
            buffer.push('</', recordProperty, '>');
        });
        buffer.push('</', rootProperty, '>');
    }
});

/**
 * This base class can be used by derived classes to dynamically require Google API's.
 */
Ext.define('Ext.ux.google.Api', {
    mixins: [
        'Ext.mixin.Mashup'
    ],
    requiredScripts: [
        '//www.google.com/jsapi'
    ],
    statics: {
        loadedModules: {}
    },
    /*
             *  feeds: [ callback1, callback2, .... ]  transitions to -> feeds : true  (when complete)
             */
    onClassExtended: function(cls, data, hooks) {
        var onBeforeClassCreated = hooks.onBeforeCreated,
            Api = this;
        // the Ext.ux.google.Api class
        hooks.onBeforeCreated = function(cls, data) {
            var me = this,
                apis = [],
                requiresGoogle = Ext.Array.from(data.requiresGoogle),
                loadedModules = Api.loadedModules,
                remaining = 0,
                callback = function() {
                    if (!--remaining) {
                        onBeforeClassCreated.call(me, cls, data, hooks);
                    }
                    Ext.env.Ready.unblock();
                },
                api, i, length;
            /*
             *  requiresGoogle: [
             *      'feeds',
             *      { api: 'feeds', version: '1.x',
             *        callback : fn, nocss : true }  //optionals
             *  ]
             */
            length = requiresGoogle.length;
            for (i = 0; i < length; ++i) {
                if (Ext.isString(api = requiresGoogle[i])) {
                    apis.push({
                        api: api
                    });
                } else if (Ext.isObject(api)) {
                    apis.push(Ext.apply({}, api));
                }
            }
            Ext.each(apis, function(api) {
                var name = api.api,
                    version = String(api.version || '1.x'),
                    module = loadedModules[name];
                if (!module) {
                    ++remaining;
                    Ext.env.Ready.block();
                    loadedModules[name] = module = [
                        callback
                    ].concat(api.callback || []);
                    delete api.api;
                    delete api.version;
                    //TODO:  window.google assertion?
                    google.load(name, version, Ext.applyIf({
                        callback: function() {
                            loadedModules[name] = true;
                            for (var n = module.length; n-- > 0; ) {
                                module[n]();
                            }
                        }
                    }, //iterate callbacks in reverse
                    api));
                } else if (module !== true) {
                    module.push(callback);
                }
            });
            if (!remaining) {
                onBeforeClassCreated.call(me, cls, data, hooks);
            }
        };
    }
});

/**
 * This class, when required, ensures that the Google RSS Feeds API is available.
 */
Ext.define('Ext.ux.google.Feeds', {
    extend: 'Ext.ux.google.Api',
    requiresGoogle: {
        api: 'feeds',
        nocss: true
    }
});

/**
 * This view is created by the "google-rss" `Ext.dashboard.Dashboard` part.
 */
Ext.define('Ext.ux.dashboard.GoogleRssView', {
    extend: 'Ext.Component',
    requires: [
        'Ext.tip.ToolTip',
        'Ext.ux.google.Feeds'
    ],
    feedCls: Ext.baseCSSPrefix + 'dashboard-googlerss',
    previewCls: Ext.baseCSSPrefix + 'dashboard-googlerss-preview',
    closeDetailsCls: Ext.baseCSSPrefix + 'dashboard-googlerss-close',
    nextCls: Ext.baseCSSPrefix + 'dashboard-googlerss-next',
    prevCls: Ext.baseCSSPrefix + 'dashboard-googlerss-prev',
    /**
     * The RSS feed URL. Some example RSS Feeds:
     *
     *   * http://rss.slashdot.org/Slashdot/slashdot
     *   * http://sports.espn.go.com/espn/rss/news (ESPN Top News)
     *   * http://news.google.com/news?ned=us&topic=t&output=rss (Sci/Tech - Google News)
     *   * http://rss.news.yahoo.com/rss/software (Yahoo Software News)
     *   * http://feeds.feedburner.com/extblog (Sencha Blog)
     *   * http://sencha.com/forum/external.php?type=RSS2 (Sencha Forums)
     *   * http://feeds.feedburner.com/ajaxian (Ajaxian)
     *   * http://rss.cnn.com/rss/edition.rss (CNN Top Stories)
     */
    feedUrl: null,
    scrollable: true,
    maxFeedEntries: 10,
    previewTips: false,
    mode: 'detail',
    //closeDetailsGlyph: '10008@',
    closeDetailsGlyph: '8657@',
    // black triangles
    prevGlyph: '9664@',
    nextGlyph: '9654@',
    // hollow triangles
    //prevGlyph: '9665@', nextGlyph: '9655@',
    // black pointing index
    //prevGlyph: '9754@', nextGlyph: '9755@',
    // white pointing index
    //prevGlyph: '9756@', nextGlyph: '9758@',
    // double arrows
    //prevGlyph: '8656@', nextGlyph: '8658@',
    // closed arrows
    //prevGlyph: '8678@', nextGlyph: '8680@',
    detailTpl: '<tpl for="entries[currentEntry]">' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-detail-header">' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-detail-nav">' + '<tpl if="parent.hasPrev">' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-prev ' + Ext.baseCSSPrefix + 'dashboard-googlerss-glyph">' + '{parent.prevGlyph}' + '</span> ' + '</tpl>' + ' {[parent.currentEntry+1]}/{parent.numEntries} ' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-next ' + Ext.baseCSSPrefix + 'dashboard-googlerss-glyph"' + '<tpl if="!parent.hasNext">' + ' style="visibility:hidden"' + '</tpl>' + '> {parent.nextGlyph}' + '</span> ' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-close ' + Ext.baseCSSPrefix + 'dashboard-googlerss-glyph"> ' + '{parent.closeGlyph}' + '</span> ' + '</div>' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-title">' + '<a href="{link}" target=_blank>{title}</a>' + '</div>' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-author">By {author} - {publishedDate:this.date}</div>' + '</div>' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-detail">' + '{content}' + '</div>' + '</tpl>',
    summaryTpl: '<tpl for="entries">' + '<div class="' + Ext.baseCSSPrefix + 'dashboard-googlerss">' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-title">' + '<a href="{link}" target=_blank>{title}</a>' + '</span> ' + '<img src="' + Ext.BLANK_IMAGE_URL + '" data-index="{#}" class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-preview"><br>' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-author">By {author} - {publishedDate:this.date}</span><br>' + '<span class="' + Ext.baseCSSPrefix + 'dashboard-googlerss-snippet">{contentSnippet}</span><br>' + '</div>' + '</tpl>',
    initComponent: function() {
        var me = this;
        me.feedMgr = new google.feeds.Feed(me.feedUrl);
        me.callParent();
    },
    afterRender: function() {
        var me = this;
        me.callParent();
        if (me.feedMgr) {
            me.refresh();
        }
        me.el.on({
            click: me.onClick,
            scope: me
        });
        if (me.previewTips) {
            me.tip = new Ext.tip.ToolTip({
                target: me.el,
                delegate: '.' + me.previewCls,
                maxWidth: 800,
                showDelay: 750,
                autoHide: false,
                scrollable: true,
                anchor: 'top',
                listeners: {
                    beforeshow: 'onBeforeShowTip',
                    scope: me
                }
            });
        }
    },
    formatDate: function(date) {
        if (!date) {
            return '';
        }
        date = new Date(date);
        var now = new Date(),
            d = Ext.Date.clearTime(now, true),
            notime = Ext.Date.clearTime(date, true).getTime();
        if (notime === d.getTime()) {
            return 'Today ' + Ext.Date.format(date, 'g:i a');
        }
        d = Ext.Date.add(d, 'd', -6);
        if (d.getTime() <= notime) {
            return Ext.Date.format(date, 'D g:i a');
        }
        if (d.getYear() === now.getYear()) {
            return Ext.Date.format(date, 'D M d \\a\\t g:i a');
        }
        return Ext.Date.format(date, 'D M d, Y \\a\\t g:i a');
    },
    getTitle: function() {
        var data = this.data;
        return data && data.title;
    },
    onBeforeShowTip: function(tip) {
        if (this.mode !== 'summary') {
            return false;
        }
        var el = tip.triggerElement,
            index = parseInt(el.getAttribute('data-index'), 10);
        tip.maxHeight = Ext.Element.getViewportHeight() / 2;
        tip.update(this.data.entries[index - 1].content);
    },
    onClick: function(e) {
        var me = this,
            entry = me.data.currentEntry,
            target = Ext.fly(e.getTarget());
        if (target.hasCls(me.nextCls)) {
            me.setCurrentEntry(entry + 1);
        } else if (target.hasCls(me.prevCls)) {
            me.setCurrentEntry(entry - 1);
        } else if (target.hasCls(me.closeDetailsCls)) {
            me.setMode('summary');
        } else if (target.hasCls(me.previewCls)) {
            me.setMode('detail', parseInt(target.getAttribute('data-index'), 10));
        }
    },
    refresh: function() {
        var me = this;
        if (!me.feedMgr) {
            return;
        }
        me.fireEvent('beforeload', me);
        //setTimeout(function () {
        me.feedMgr.setNumEntries(me.maxFeedEntries);
        me.feedMgr.load(function(result) {
            me.setFeedData(result.feed);
            me.fireEvent('load', me);
        });
    },
    //}, 2000);
    setCurrentEntry: function(current) {
        this.setMode(this.mode, current);
    },
    setFeedData: function(feedData) {
        var me = this,
            entries = feedData.entries,
            count = entries && entries.length || 0,
            data = Ext.apply({
                numEntries: count,
                closeGlyph: me.wrapGlyph(me.closeDetailsGlyph),
                prevGlyph: me.wrapGlyph(me.prevGlyph),
                nextGlyph: me.wrapGlyph(me.nextGlyph),
                currentEntry: 0
            }, feedData);
        me.data = data;
        me.setMode(me.mode);
    },
    setMode: function(mode, currentEntry) {
        var me = this,
            data = me.data,
            current = (currentEntry === undefined) ? data.currentEntry : currentEntry;
        me.tpl = me.getTpl(mode + 'Tpl');
        me.tpl.date = me.formatDate;
        me.mode = mode;
        data.currentEntry = current;
        data.hasNext = current + 1 < data.numEntries;
        data.hasPrev = current > 0;
        me.update(data);
        me.el.dom.scrollTop = 0;
    },
    wrapGlyph: function(glyph) {
        var glyphFontFamily = Ext._glyphFontFamily,
            glyphParts, html;
        if (typeof glyph === 'string') {
            glyphParts = glyph.split('@');
            glyph = glyphParts[0];
            glyphFontFamily = glyphParts[1];
        }
        html = '&#' + glyph + ';';
        if (glyphFontFamily) {
            html = '<span style="font-family:' + glyphFontFamily + '">' + html + '</span>';
        }
        return html;
    },
    // @private
    beforeDestroy: function() {
        Ext.destroy(this.tip);
        this.callParent();
    }
});

/**
 * This `part` implements a Google RSS Feed for use in a `Dashboard`.
 */
Ext.define('Ext.ux.dashboard.GoogleRssPart', {
    extend: 'Ext.dashboard.Part',
    alias: 'part.google-rss',
    requires: [
        'Ext.window.MessageBox',
        'Ext.ux.dashboard.GoogleRssView'
    ],
    viewTemplate: {
        layout: 'fit',
        items: {
            xclass: 'Ext.ux.dashboard.GoogleRssView',
            feedUrl: '{feedUrl}'
        }
    },
    type: 'google-rss',
    config: {
        suggestedFeed: 'http://rss.slashdot.org/Slashdot/slashdot'
    },
    formTitleAdd: 'Add RSS Feed',
    formTitleEdit: 'Edit RSS Feed',
    formLabel: 'RSS Feed URL',
    displayForm: function(instance, currentConfig, callback, scope) {
        var me = this,
            suggestion = currentConfig ? currentConfig.feedUrl : me.getSuggestedFeed(),
            title = instance ? me.formTitleEdit : me.formTitleAdd;
        Ext.Msg.prompt(title, me.formLabel, function(btn, text) {
            if (btn === 'ok') {
                callback.call(scope || me, {
                    feedUrl: text
                });
            }
        }, me, false, suggestion);
    }
});

/**
 * Paging Memory Proxy, allows to use paging grid with in memory dataset
 */
Ext.define('Ext.ux.data.PagingMemoryProxy', {
    extend: 'Ext.data.proxy.Memory',
    alias: 'proxy.pagingmemory',
    alternateClassName: 'Ext.data.PagingMemoryProxy',
    constructor: function() {
        Ext.log.warn('Ext.ux.data.PagingMemoryProxy functionality has been merged into Ext.data.proxy.Memory by using the enablePaging flag.');
        this.callParent(arguments);
    },
    read: function(operation, callback, scope) {
        var reader = this.getReader(),
            result = reader.read(this.data),
            sorters, filters, sorterFn, records;
        scope = scope || this;
        // filtering
        filters = operation.filters;
        if (filters.length > 0) {
            //at this point we have an array of  Ext.util.Filter objects to filter with,
            //so here we construct a function that combines these filters by ANDing them together
            records = [];
            Ext.each(result.records, function(record) {
                var isMatch = true,
                    length = filters.length,
                    i;
                for (i = 0; i < length; i++) {
                    var filter = filters[i],
                        fn = filter.filterFn,
                        scope = filter.scope;
                    isMatch = isMatch && fn.call(scope, record);
                }
                if (isMatch) {
                    records.push(record);
                }
            }, this);
            result.records = records;
            result.totalRecords = result.total = records.length;
        }
        // sorting
        sorters = operation.sorters;
        if (sorters.length > 0) {
            //construct an amalgamated sorter function which combines all of the Sorters passed
            sorterFn = function(r1, r2) {
                var result = sorters[0].sort(r1, r2),
                    length = sorters.length,
                    i;
                //if we have more than one sorter, OR any additional sorter functions together
                for (i = 1; i < length; i++) {
                    result = result || sorters[i].sort.call(this, r1, r2);
                }
                return result;
            };
            result.records.sort(sorterFn);
        }
        // paging (use undefined cause start can also be 0 (thus false))
        if (operation.start !== undefined && operation.limit !== undefined) {
            result.records = result.records.slice(operation.start, operation.start + operation.limit);
            result.count = result.records.length;
        }
        Ext.apply(operation, {
            resultSet: result
        });
        operation.setCompleted();
        operation.setSuccessful();
        Ext.Function.defer(function() {
            Ext.callback(callback, scope, [
                operation
            ]);
        }, 10);
    }
});

// A DropZone which cooperates with DragZones whose dragData contains
// a "field" property representing a form Field. Fields may be dropped onto
// grid data cells containing a matching data type.
Ext.define('Ext.ux.dd.CellFieldDropZone', {
    extend: 'Ext.dd.DropZone',
    constructor: function(cfg) {
        cfg = cfg || {};
        if (cfg.onCellDrop) {
            this.onCellDrop = cfg.onCellDrop;
        }
        if (cfg.ddGroup) {
            this.ddGroup = cfg.ddGroup;
        }
    },
    //  Call the DropZone constructor using the View's scrolling element
    //  only after the grid has been rendered.
    init: function(grid) {
        var me = this;
        if (grid.rendered) {
            me.grid = grid;
            grid.getView().on({
                render: function(v) {
                    me.view = v;
                    Ext.ux.dd.CellFieldDropZone.superclass.constructor.call(me, me.view.el);
                },
                single: true
            });
        } else {
            grid.on('render', me.init, me, {
                single: true
            });
        }
    },
    //  Scroll the main configured Element when we drag close to the edge
    containerScroll: true,
    getTargetFromEvent: function(e) {
        var me = this,
            v = me.view;
        //      Ascertain whether the mousemove is within a grid cell
        var cell = e.getTarget(v.getCellSelector());
        if (cell) {
            //          We *are* within a grid cell, so ask the View exactly which one,
            //          Extract data from the Model to create a target object for
            //          processing in subsequent onNodeXXXX methods. Note that the target does
            //          not have to be a DOM element. It can be whatever the noNodeXXX methods are
            //          programmed to expect.
            var row = v.findItemByChild(cell),
                columnIndex = cell.cellIndex;
            if (row && Ext.isDefined(columnIndex)) {
                return {
                    node: cell,
                    record: v.getRecord(row),
                    fieldName: me.grid.getVisibleColumnManager().getColumns()[columnIndex].dataIndex
                };
            }
        }
    },
    //  On Node enter, see if it is valid for us to drop the field on that type of column.
    onNodeEnter: function(target, dd, e, dragData) {
        delete this.dropOK;
        if (!target) {
            return;
        }
        //      Check that a field is being dragged.
        var f = dragData.field;
        if (!f) {
            return;
        }
        //      Check whether the data type of the column being dropped on accepts the
        //      dragged field type. If so, set dropOK flag, and highlight the target node.
        var field = target.record.fieldsMap[target.fieldName];
        if (field.isNumeric) {
            if (!f.isXType('numberfield')) {
                return;
            }
        } else if (field.isDateField) {
            if (!f.isXType('datefield')) {
                return;
            }
        } else if (field.isBooleanField) {
            if (!f.isXType('checkbox')) {
                return;
            }
        }
        this.dropOK = true;
        Ext.fly(target.node).addCls('x-drop-target-active');
    },
    //  Return the class name to add to the drag proxy. This provides a visual indication
    //  of drop allowed or not allowed.
    onNodeOver: function(target, dd, e, dragData) {
        return this.dropOK ? this.dropAllowed : this.dropNotAllowed;
    },
    //  highlight the target node.
    onNodeOut: function(target, dd, e, dragData) {
        Ext.fly(target.node).removeCls('x-drop-target-active');
    },
    //  Process the drop event if we have previously ascertained that a drop is OK.
    onNodeDrop: function(target, dd, e, dragData) {
        if (this.dropOK) {
            var value = dragData.field.getValue();
            target.record.set(target.fieldName, value);
            this.onCellDrop(target.fieldName, value);
            return true;
        }
    },
    onCellDrop: Ext.emptyFn
});

Ext.define('Ext.ux.dd.PanelFieldDragZone', {
    extend: 'Ext.dd.DragZone',
    constructor: function(cfg) {
        cfg = cfg || {};
        if (cfg.ddGroup) {
            this.ddGroup = cfg.ddGroup;
        }
    },
    //  Call the DRagZone's constructor. The Panel must have been rendered.
    init: function(panel) {
        // Panel is an HtmlElement
        if (panel.nodeType) {
            // Called via dragzone::init
            Ext.ux.dd.PanelFieldDragZone.superclass.init.apply(this, arguments);
        } else // Panel is a Component - need the el
        {
            // Called via plugin::init
            if (panel.rendered) {
                Ext.ux.dd.PanelFieldDragZone.superclass.constructor.call(this, panel.getEl());
            } else {
                panel.on('afterrender', this.init, this, {
                    single: true
                });
            }
        }
    },
    scroll: false,
    //  On mousedown, we ascertain whether it is on one of our draggable Fields.
    //  If so, we collect data about the draggable object, and return a drag data
    //  object which contains our own data, plus a "ddel" property which is a DOM
    //  node which provides a "view" of the dragged data.
    getDragData: function(e) {
        var targetLabel = e.getTarget('label', null, true),
            text, oldMark, field, dragEl;
        if (targetLabel) {
            // Get the data we are dragging: the Field
            // create a ddel for the drag proxy to display
            field = Ext.getCmp(targetLabel.up('.' + Ext.form.Labelable.prototype.formItemCls).id);
            // Temporary prevent marking the field as invalid, since it causes changes
            // to the underlying dom element which can cause problems in IE
            oldMark = field.preventMark;
            field.preventMark = true;
            if (field.isValid()) {
                field.preventMark = oldMark;
                dragEl = document.createElement('div');
                dragEl.className = Ext.baseCSSPrefix + 'form-text';
                text = field.getRawValue();
                dragEl.innerHTML = Ext.isEmpty(text) ? '&#160;' : text;
                Ext.fly(dragEl).setWidth(field.getEl().getWidth());
                return {
                    field: field,
                    ddel: dragEl
                };
            } else {
                e.stopEvent();
            }
            field.preventMark = oldMark;
        }
    },
    //  The coordinates to slide the drag proxy back to on failed drop.
    getRepairXY: function() {
        return this.dragData.field.getEl().getXY();
    }
});

/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.desktop.Desktop
 * @extends Ext.panel.Panel
 * <p>This class manages the wallpaper, shortcuts and taskbar.</p>
 */
Ext.define('Ext.ux.desktop.Desktop', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.desktop',
    uses: [
        'Ext.util.MixedCollection',
        'Ext.menu.Menu',
        'Ext.view.View',
        // dataview
        'Ext.window.Window',
        'Ext.ux.desktop.TaskBar',
        'Ext.ux.desktop.Wallpaper'
    ],
    activeWindowCls: 'ux-desktop-active-win',
    inactiveWindowCls: 'ux-desktop-inactive-win',
    lastActiveWindow: null,
    border: false,
    html: '&#160;',
    layout: 'fit',
    xTickSize: 1,
    yTickSize: 1,
    app: null,
    /**
     * @cfg {Array/Ext.data.Store} shortcuts
     * The items to add to the DataView. This can be a {@link Ext.data.Store Store} or a
     * simple array. Items should minimally provide the fields in the
     * {@link Ext.ux.desktop.ShortcutModel Shortcut}.
     */
    shortcuts: null,
    /**
     * @cfg {String} shortcutItemSelector
     * This property is passed to the DataView for the desktop to select shortcut items.
     * If the {@link #shortcutTpl} is modified, this will probably need to be modified as
     * well.
     */
    shortcutItemSelector: 'div.ux-desktop-shortcut',
    /**
     * @cfg {String} shortcutTpl
     * This XTemplate is used to render items in the DataView. If this is changed, the
     * {@link #shortcutItemSelector} will probably also need to changed.
     */
    shortcutTpl: [
        '<tpl for=".">',
        '<div class="ux-desktop-shortcut" id="{name}-shortcut">',
        '<div class="ux-desktop-shortcut-icon {iconCls}">',
        '<img src="',
        Ext.BLANK_IMAGE_URL,
        '" title="{name}">',
        '</div>',
        '<span class="ux-desktop-shortcut-text">{name}</span>',
        '</div>',
        '</tpl>',
        '<div class="x-clear"></div>'
    ],
    /**
     * @cfg {Object} taskbarConfig
     * The config object for the TaskBar.
     */
    taskbarConfig: null,
    windowMenu: null,
    initComponent: function() {
        var me = this;
        me.windowMenu = new Ext.menu.Menu(me.createWindowMenu());
        me.bbar = me.taskbar = new Ext.ux.desktop.TaskBar(me.taskbarConfig);
        me.taskbar.windowMenu = me.windowMenu;
        me.windows = new Ext.util.MixedCollection();
        me.contextMenu = new Ext.menu.Menu(me.createDesktopMenu());
        me.items = [
            {
                xtype: 'wallpaper',
                id: me.id + '_wallpaper'
            },
            me.createDataView()
        ];
        me.callParent();
        me.shortcutsView = me.items.getAt(1);
        me.shortcutsView.on('itemclick', me.onShortcutItemClick, me);
        var wallpaper = me.wallpaper;
        me.wallpaper = me.items.getAt(0);
        if (wallpaper) {
            me.setWallpaper(wallpaper, me.wallpaperStretch);
        }
    },
    afterRender: function() {
        var me = this;
        me.callParent();
        me.el.on('contextmenu', me.onDesktopMenu, me);
    },
    //------------------------------------------------------
    // Overrideable configuration creation methods
    createDataView: function() {
        var me = this;
        return {
            xtype: 'dataview',
            overItemCls: 'x-view-over',
            trackOver: true,
            itemSelector: me.shortcutItemSelector,
            store: me.shortcuts,
            style: {
                position: 'absolute'
            },
            x: 0,
            y: 0,
            tpl: new Ext.XTemplate(me.shortcutTpl)
        };
    },
    createDesktopMenu: function() {
        var me = this,
            ret = {
                items: me.contextMenuItems || []
            };
        if (ret.items.length) {
            ret.items.push('-');
        }
        ret.items.push({
            text: 'Tile',
            handler: me.tileWindows,
            scope: me,
            minWindows: 1
        }, {
            text: 'Cascade',
            handler: me.cascadeWindows,
            scope: me,
            minWindows: 1
        });
        return ret;
    },
    createWindowMenu: function() {
        var me = this;
        return {
            defaultAlign: 'br-tr',
            items: [
                {
                    text: 'Restore',
                    handler: me.onWindowMenuRestore,
                    scope: me
                },
                {
                    text: 'Minimize',
                    handler: me.onWindowMenuMinimize,
                    scope: me
                },
                {
                    text: 'Maximize',
                    handler: me.onWindowMenuMaximize,
                    scope: me
                },
                '-',
                {
                    text: 'Close',
                    handler: me.onWindowMenuClose,
                    scope: me
                }
            ],
            listeners: {
                beforeshow: me.onWindowMenuBeforeShow,
                hide: me.onWindowMenuHide,
                scope: me
            }
        };
    },
    //------------------------------------------------------
    // Event handler methods
    onDesktopMenu: function(e) {
        var me = this,
            menu = me.contextMenu;
        e.stopEvent();
        if (!menu.rendered) {
            menu.on('beforeshow', me.onDesktopMenuBeforeShow, me);
        }
        menu.showAt(e.getXY());
        menu.doConstrain();
    },
    onDesktopMenuBeforeShow: function(menu) {
        var me = this,
            count = me.windows.getCount();
        menu.items.each(function(item) {
            var min = item.minWindows || 0;
            item.setDisabled(count < min);
        });
    },
    onShortcutItemClick: function(dataView, record) {
        var me = this,
            module = me.app.getModule(record.data.module),
            win = module && module.createWindow();
        if (win) {
            me.restoreWindow(win);
        }
    },
    onWindowClose: function(win) {
        var me = this;
        me.windows.remove(win);
        me.taskbar.removeTaskButton(win.taskButton);
        me.updateActiveWindow();
    },
    //------------------------------------------------------
    // Window context menu handlers
    onWindowMenuBeforeShow: function(menu) {
        var items = menu.items.items,
            win = menu.theWin;
        items[0].setDisabled(win.maximized !== true && win.hidden !== true);
        // Restore
        items[1].setDisabled(win.minimized === true);
        // Minimize
        items[2].setDisabled(win.maximized === true || win.hidden === true);
    },
    // Maximize
    onWindowMenuClose: function() {
        var me = this,
            win = me.windowMenu.theWin;
        win.close();
    },
    onWindowMenuHide: function(menu) {
        Ext.defer(function() {
            menu.theWin = null;
        }, 1);
    },
    onWindowMenuMaximize: function() {
        var me = this,
            win = me.windowMenu.theWin;
        win.maximize();
        win.toFront();
    },
    onWindowMenuMinimize: function() {
        var me = this,
            win = me.windowMenu.theWin;
        win.minimize();
    },
    onWindowMenuRestore: function() {
        var me = this,
            win = me.windowMenu.theWin;
        me.restoreWindow(win);
    },
    //------------------------------------------------------
    // Dynamic (re)configuration methods
    getWallpaper: function() {
        return this.wallpaper.wallpaper;
    },
    setTickSize: function(xTickSize, yTickSize) {
        var me = this,
            xt = me.xTickSize = xTickSize,
            yt = me.yTickSize = (arguments.length > 1) ? yTickSize : xt;
        me.windows.each(function(win) {
            var dd = win.dd,
                resizer = win.resizer;
            dd.xTickSize = xt;
            dd.yTickSize = yt;
            resizer.widthIncrement = xt;
            resizer.heightIncrement = yt;
        });
    },
    setWallpaper: function(wallpaper, stretch) {
        this.wallpaper.setWallpaper(wallpaper, stretch);
        return this;
    },
    //------------------------------------------------------
    // Window management methods
    cascadeWindows: function() {
        var x = 0,
            y = 0,
            zmgr = this.getDesktopZIndexManager();
        zmgr.eachBottomUp(function(win) {
            if (win.isWindow && win.isVisible() && !win.maximized) {
                win.setPosition(x, y);
                x += 20;
                y += 20;
            }
        });
    },
    createWindow: function(config, cls) {
        var me = this,
            win,
            cfg = Ext.applyIf(config || {}, {
                stateful: false,
                isWindow: true,
                constrainHeader: true,
                minimizable: true,
                maximizable: true
            });
        cls = cls || Ext.window.Window;
        win = me.add(new cls(cfg));
        me.windows.add(win);
        win.taskButton = me.taskbar.addTaskButton(win);
        win.animateTarget = win.taskButton.el;
        win.on({
            activate: me.updateActiveWindow,
            beforeshow: me.updateActiveWindow,
            deactivate: me.updateActiveWindow,
            minimize: me.minimizeWindow,
            destroy: me.onWindowClose,
            scope: me
        });
        win.on({
            boxready: function() {
                win.dd.xTickSize = me.xTickSize;
                win.dd.yTickSize = me.yTickSize;
                if (win.resizer) {
                    win.resizer.widthIncrement = me.xTickSize;
                    win.resizer.heightIncrement = me.yTickSize;
                }
            },
            single: true
        });
        // replace normal window close w/fadeOut animation:
        win.doClose = function() {
            win.doClose = Ext.emptyFn;
            // dblclick can call again...
            win.el.disableShadow();
            win.el.fadeOut({
                listeners: {
                    afteranimate: function() {
                        win.destroy();
                    }
                }
            });
        };
        return win;
    },
    getActiveWindow: function() {
        var win = null,
            zmgr = this.getDesktopZIndexManager();
        if (zmgr) {
            // We cannot rely on activate/deactive because that fires against non-Window
            // components in the stack.
            zmgr.eachTopDown(function(comp) {
                if (comp.isWindow && !comp.hidden) {
                    win = comp;
                    return false;
                }
                return true;
            });
        }
        return win;
    },
    getDesktopZIndexManager: function() {
        var windows = this.windows;
        // TODO - there has to be a better way to get this...
        return (windows.getCount() && windows.getAt(0).zIndexManager) || null;
    },
    getWindow: function(id) {
        return this.windows.get(id);
    },
    minimizeWindow: function(win) {
        win.minimized = true;
        win.hide();
    },
    restoreWindow: function(win) {
        if (win.isVisible()) {
            win.restore();
            win.toFront();
        } else {
            win.show();
        }
        return win;
    },
    tileWindows: function() {
        var me = this,
            availWidth = me.body.getWidth(true);
        var x = me.xTickSize,
            y = me.yTickSize,
            nextY = y;
        me.windows.each(function(win) {
            if (win.isVisible() && !win.maximized) {
                var w = win.el.getWidth();
                // Wrap to next row if we are not at the line start and this Window will
                // go off the end
                if (x > me.xTickSize && x + w > availWidth) {
                    x = me.xTickSize;
                    y = nextY;
                }
                win.setPosition(x, y);
                x += w + me.xTickSize;
                nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
            }
        });
    },
    updateActiveWindow: function() {
        var me = this,
            activeWindow = me.getActiveWindow(),
            last = me.lastActiveWindow;
        if (last && last.isDestroyed) {
            me.lastActiveWindow = null;
            return;
        }
        if (activeWindow === last) {
            return;
        }
        if (last) {
            if (last.el.dom) {
                last.addCls(me.inactiveWindowCls);
                last.removeCls(me.activeWindowCls);
            }
            last.active = false;
        }
        me.lastActiveWindow = activeWindow;
        if (activeWindow) {
            activeWindow.addCls(me.activeWindowCls);
            activeWindow.removeCls(me.inactiveWindowCls);
            activeWindow.minimized = false;
            activeWindow.active = true;
        }
        me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);
    }
});

/**
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 * @class Ext.ux.desktop.App
 */
Ext.define('Ext.ux.desktop.App', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    requires: [
        'Ext.container.Viewport',
        'Ext.ux.desktop.Desktop'
    ],
    isReady: false,
    modules: null,
    useQuickTips: true,
    constructor: function(config) {
        var me = this;
        me.mixins.observable.constructor.call(this, config);
        if (Ext.isReady) {
            Ext.Function.defer(me.init, 10, me);
        } else {
            Ext.onReady(me.init, me);
        }
    },
    init: function() {
        var me = this,
            desktopCfg;
        if (me.useQuickTips) {
            Ext.QuickTips.init();
        }
        me.modules = me.getModules();
        if (me.modules) {
            me.initModules(me.modules);
        }
        desktopCfg = me.getDesktopConfig();
        me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);
        me.viewport = new Ext.container.Viewport({
            layout: 'fit',
            items: [
                me.desktop
            ]
        });
        Ext.getWin().on('beforeunload', me.onUnload, me);
        me.isReady = true;
        me.fireEvent('ready', me);
    },
    /**
     * This method returns the configuration object for the Desktop object. A derived
     * class can override this method, call the base version to build the config and
     * then modify the returned object before returning it.
     */
    getDesktopConfig: function() {
        var me = this,
            cfg = {
                app: me,
                taskbarConfig: me.getTaskbarConfig()
            };
        Ext.apply(cfg, me.desktopConfig);
        return cfg;
    },
    getModules: Ext.emptyFn,
    /**
     * This method returns the configuration object for the Start Button. A derived
     * class can override this method, call the base version to build the config and
     * then modify the returned object before returning it.
     */
    getStartConfig: function() {
        var me = this,
            cfg = {
                app: me,
                menu: []
            },
            launcher;
        Ext.apply(cfg, me.startConfig);
        Ext.each(me.modules, function(module) {
            launcher = module.launcher;
            if (launcher) {
                launcher.handler = launcher.handler || Ext.bind(me.createWindow, me, [
                    module
                ]);
                cfg.menu.push(module.launcher);
            }
        });
        return cfg;
    },
    createWindow: function(module) {
        var window = module.createWindow();
        window.show();
    },
    /**
     * This method returns the configuration object for the TaskBar. A derived class
     * can override this method, call the base version to build the config and then
     * modify the returned object before returning it.
     */
    getTaskbarConfig: function() {
        var me = this,
            cfg = {
                app: me,
                startConfig: me.getStartConfig()
            };
        Ext.apply(cfg, me.taskbarConfig);
        return cfg;
    },
    initModules: function(modules) {
        var me = this;
        Ext.each(modules, function(module) {
            module.app = me;
        });
    },
    getModule: function(name) {
        var ms = this.modules;
        for (var i = 0,
            len = ms.length; i < len; i++) {
            var m = ms[i];
            if (m.id == name || m.appType == name) {
                return m;
            }
        }
        return null;
    },
    onReady: function(fn, scope) {
        if (this.isReady) {
            fn.call(scope, this);
        } else {
            this.on({
                ready: fn,
                scope: scope,
                single: true
            });
        }
    },
    getDesktop: function() {
        return this.desktop;
    },
    onUnload: function(e) {
        if (this.fireEvent('beforeunload', this) === false) {
            e.stopEvent();
        }
    }
});

/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.define('Ext.ux.desktop.Module', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    constructor: function(config) {
        this.mixins.observable.constructor.call(this, config);
        this.init();
    },
    init: Ext.emptyFn
});

/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.desktop.ShortcutModel
 * @extends Ext.data.Model
 * This model defines the minimal set of fields for desktop shortcuts.
 */
Ext.define('Ext.ux.desktop.ShortcutModel', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'name'
        },
        {
            name: 'iconCls'
        },
        {
            name: 'module'
        }
    ]
});

/**
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 * @class Ext.ux.desktop.StartMenu
 */
Ext.define('Ext.ux.desktop.StartMenu', {
    extend: 'Ext.menu.Menu',
    // We want header styling like a Panel
    baseCls: Ext.baseCSSPrefix + 'panel',
    // Special styling within
    cls: 'x-menu ux-start-menu',
    bodyCls: 'ux-start-menu-body',
    defaultAlign: 'bl-tl',
    iconCls: 'user',
    bodyBorder: true,
    width: 300,
    initComponent: function() {
        var me = this;
        me.layout.align = 'stretch';
        me.items = me.menu;
        me.callParent();
        me.toolbar = new Ext.toolbar.Toolbar(Ext.apply({
            dock: 'right',
            cls: 'ux-start-menu-toolbar',
            vertical: true,
            width: 100,
            layout: {
                align: 'stretch'
            }
        }, me.toolConfig));
        me.addDocked(me.toolbar);
        delete me.toolItems;
    },
    addMenuItem: function() {
        var cmp = this.menu;
        cmp.add.apply(cmp, arguments);
    },
    addToolItem: function() {
        var cmp = this.toolbar;
        cmp.add.apply(cmp, arguments);
    }
});
// StartMenu

/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.desktop.TaskBar
 * @extends Ext.toolbar.Toolbar
 */
Ext.define('Ext.ux.desktop.TaskBar', {
    // This must be a toolbar. we rely on acquired toolbar classes and inherited toolbar methods for our
    // child items to instantiate and render correctly.
    extend: 'Ext.toolbar.Toolbar',
    requires: [
        'Ext.button.Button',
        'Ext.resizer.Splitter',
        'Ext.menu.Menu',
        'Ext.ux.desktop.StartMenu'
    ],
    alias: 'widget.taskbar',
    cls: 'ux-taskbar',
    /**
     * @cfg {String} startBtnText
     * The text for the Start Button.
     */
    startBtnText: 'Start',
    initComponent: function() {
        var me = this;
        me.startMenu = new Ext.ux.desktop.StartMenu(me.startConfig);
        me.quickStart = new Ext.toolbar.Toolbar(me.getQuickStart());
        me.windowBar = new Ext.toolbar.Toolbar(me.getWindowBarConfig());
        me.tray = new Ext.toolbar.Toolbar(me.getTrayConfig());
        me.items = [
            {
                xtype: 'button',
                cls: 'ux-start-button',
                iconCls: 'ux-start-button-icon',
                menu: me.startMenu,
                menuAlign: 'bl-tl',
                text: me.startBtnText
            },
            me.quickStart,
            {
                xtype: 'splitter',
                html: '&#160;',
                height: 14,
                width: 2,
                // TODO - there should be a CSS way here
                cls: 'x-toolbar-separator x-toolbar-separator-horizontal'
            },
            me.windowBar,
            '-',
            me.tray
        ];
        me.callParent();
    },
    afterLayout: function() {
        var me = this;
        me.callParent();
        me.windowBar.el.on('contextmenu', me.onButtonContextMenu, me);
    },
    /**
     * This method returns the configuration object for the Quick Start toolbar. A derived
     * class can override this method, call the base version to build the config and
     * then modify the returned object before returning it.
     */
    getQuickStart: function() {
        var me = this,
            ret = {
                minWidth: 20,
                width: Ext.themeName === 'neptune' ? 70 : 60,
                items: [],
                enableOverflow: true
            };
        Ext.each(this.quickStart, function(item) {
            ret.items.push({
                tooltip: {
                    text: item.name,
                    align: 'bl-tl'
                },
                //tooltip: item.name,
                overflowText: item.name,
                iconCls: item.iconCls,
                module: item.module,
                handler: me.onQuickStartClick,
                scope: me
            });
        });
        return ret;
    },
    /**
     * This method returns the configuration object for the Tray toolbar. A derived
     * class can override this method, call the base version to build the config and
     * then modify the returned object before returning it.
     */
    getTrayConfig: function() {
        var ret = {
                items: this.trayItems
            };
        delete this.trayItems;
        return ret;
    },
    getWindowBarConfig: function() {
        return {
            flex: 1,
            cls: 'ux-desktop-windowbar',
            items: [
                '&#160;'
            ],
            layout: {
                overflowHandler: 'Scroller'
            }
        };
    },
    getWindowBtnFromEl: function(el) {
        var c = this.windowBar.getChildByElement(el);
        return c || null;
    },
    onQuickStartClick: function(btn) {
        var module = this.app.getModule(btn.module),
            window;
        if (module) {
            window = module.createWindow();
            window.show();
        }
    },
    onButtonContextMenu: function(e) {
        var me = this,
            t = e.getTarget(),
            btn = me.getWindowBtnFromEl(t);
        if (btn) {
            e.stopEvent();
            me.windowMenu.theWin = btn.win;
            me.windowMenu.showBy(t);
        }
    },
    onWindowBtnClick: function(btn) {
        var win = btn.win;
        if (win.minimized || win.hidden) {
            btn.disable();
            win.show(null, function() {
                btn.enable();
            });
        } else if (win.active) {
            btn.disable();
            win.on('hide', function() {
                btn.enable();
            }, null, {
                single: true
            });
            win.minimize();
        } else {
            win.toFront();
        }
    },
    addTaskButton: function(win) {
        var config = {
                iconCls: win.iconCls,
                enableToggle: true,
                toggleGroup: 'all',
                width: 140,
                margin: '0 2 0 3',
                text: Ext.util.Format.ellipsis(win.title, 20),
                listeners: {
                    click: this.onWindowBtnClick,
                    scope: this
                },
                win: win
            };
        var cmp = this.windowBar.add(config);
        cmp.toggle(true);
        return cmp;
    },
    removeTaskButton: function(btn) {
        var found,
            me = this;
        me.windowBar.items.each(function(item) {
            if (item === btn) {
                found = item;
            }
            return !found;
        });
        if (found) {
            me.windowBar.remove(found);
        }
        return found;
    },
    setActiveButton: function(btn) {
        if (btn) {
            btn.toggle(true);
        } else {
            this.windowBar.items.each(function(item) {
                if (item.isButton) {
                    item.toggle(false);
                }
            });
        }
    }
});
/**
 * @class Ext.ux.desktop.TrayClock
 * @extends Ext.toolbar.TextItem
 * This class displays a clock on the toolbar.
 */
Ext.define('Ext.ux.desktop.TrayClock', {
    extend: 'Ext.toolbar.TextItem',
    alias: 'widget.trayclock',
    cls: 'ux-desktop-trayclock',
    html: '&#160;',
    timeFormat: 'g:i A',
    tpl: '{time}',
    initComponent: function() {
        var me = this;
        me.callParent();
        if (typeof (me.tpl) == 'string') {
            me.tpl = new Ext.XTemplate(me.tpl);
        }
    },
    afterRender: function() {
        var me = this;
        Ext.Function.defer(me.updateTime, 100, me);
        me.callParent();
    },
    onDestroy: function() {
        var me = this;
        if (me.timer) {
            window.clearTimeout(me.timer);
            me.timer = null;
        }
        me.callParent();
    },
    updateTime: function() {
        var me = this,
            time = Ext.Date.format(new Date(), me.timeFormat),
            text = me.tpl.apply({
                time: time
            });
        if (me.lastText != text) {
            me.setText(text);
            me.lastText = text;
        }
        me.timer = Ext.Function.defer(me.updateTime, 10000, me);
    }
});

/*!
* Ext JS Library
* Copyright(c) 2006-2014 Sencha Inc.
* licensing@sencha.com
* http://www.sencha.com/license
*/
// From code originally written by David Davis (http://www.sencha.com/blog/html5-video-canvas-and-ext-js/)
/* -NOTICE-
 * For HTML5 video to work, your server must
 * send the right content type, for more info see:
 * http://developer.mozilla.org/En/HTML/Element/Video
 */
Ext.define('Ext.ux.desktop.Video', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.video',
    layout: 'fit',
    autoplay: false,
    controls: true,
    bodyStyle: 'background-color:#000;color:#fff',
    html: '',
    tpl: [
        '<video id="{id}-video" autoPlay="{autoplay}" controls="{controls}" poster="{poster}" start="{start}" loopstart="{loopstart}" loopend="{loopend}" autobuffer="{autobuffer}" loop="{loop}" style="width:100%;height:100%">',
        '<tpl for="src">',
        '<source src="{src}" type="{type}"/>',
        '</tpl>',
        '{html}',
        '</video>'
    ],
    initComponent: function() {
        var me = this,
            fallback, size, cfg, el;
        if (me.fallbackHTML) {
            fallback = me.fallbackHTML;
        } else {
            fallback = "Your browser does not support HTML5 Video. ";
            if (Ext.isChrome) {
                fallback += 'Upgrade Chrome.';
            } else if (Ext.isGecko) {
                fallback += 'Upgrade to Firefox 3.5 or newer.';
            } else {
                var chrome = '<a href="http://www.google.com/chrome">Chrome</a>';
                fallback += 'Please try <a href="http://www.mozilla.com">Firefox</a>';
                if (Ext.isIE) {
                    fallback += ', ' + chrome + ' or <a href="http://www.apple.com/safari/">Safari</a>.';
                } else {
                    fallback += ' or ' + chrome + '.';
                }
            }
        }
        me.fallbackHTML = fallback;
        cfg = me.data = Ext.copyTo({
            tag: 'video',
            html: fallback
        }, me, 'id,poster,start,loopstart,loopend,playcount,autobuffer,loop');
        // just having the params exist enables them
        if (me.autoplay) {
            cfg.autoplay = 1;
        }
        if (me.controls) {
            cfg.controls = 1;
        }
        // handle multiple sources
        if (Ext.isArray(me.src)) {
            cfg.src = me.src;
        } else {
            cfg.src = [
                {
                    src: me.src
                }
            ];
        }
        me.callParent();
    },
    afterRender: function() {
        var me = this;
        me.callParent();
        me.video = me.body.getById(me.id + '-video');
        el = me.video.dom;
        me.supported = (el && el.tagName.toLowerCase() == 'video');
        if (me.supported) {
            me.video.on('error', me.onVideoError, me);
        }
    },
    getFallback: function() {
        return '<h1 style="background-color:#ff4f4f;padding: 10px;">' + this.fallbackHTML + '</h1>';
    },
    onVideoError: function() {
        var me = this;
        me.video.remove();
        me.supported = false;
        me.body.createChild(me.getFallback());
    },
    onDestroy: function() {
        var me = this;
        var video = me.video;
        if (me.supported && video) {
            var videoDom = video.dom;
            if (videoDom && videoDom.pause) {
                videoDom.pause();
            }
            video.remove();
            me.video = null;
        }
        me.callParent();
    }
});

/*!
 * Ext JS Library
 * Copyright(c) 2006-2014 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.desktop.Wallpaper
 * @extends Ext.Component
 * <p>This component renders an image that stretches to fill the component.</p>
 */
Ext.define('Ext.ux.desktop.Wallpaper', {
    extend: 'Ext.Component',
    alias: 'widget.wallpaper',
    cls: 'ux-wallpaper',
    html: '<img src="' + Ext.BLANK_IMAGE_URL + '">',
    stretch: false,
    wallpaper: null,
    stateful: true,
    stateId: 'desk-wallpaper',
    afterRender: function() {
        var me = this;
        me.callParent();
        me.setWallpaper(me.wallpaper, me.stretch);
    },
    applyState: function() {
        var me = this,
            old = me.wallpaper;
        me.callParent(arguments);
        if (old != me.wallpaper) {
            me.setWallpaper(me.wallpaper);
        }
    },
    getState: function() {
        return this.wallpaper && {
            wallpaper: this.wallpaper
        };
    },
    setWallpaper: function(wallpaper, stretch) {
        var me = this,
            imgEl, bkgnd;
        me.stretch = (stretch !== false);
        me.wallpaper = wallpaper;
        if (me.rendered) {
            imgEl = me.el.dom.firstChild;
            if (!wallpaper || wallpaper == Ext.BLANK_IMAGE_URL) {
                Ext.fly(imgEl).hide();
            } else if (me.stretch) {
                imgEl.src = wallpaper;
                me.el.removeCls('ux-wallpaper-tiled');
                Ext.fly(imgEl).setStyle({
                    width: '100%',
                    height: '100%'
                }).show();
            } else {
                Ext.fly(imgEl).hide();
                bkgnd = 'url(' + wallpaper + ')';
                me.el.addCls('ux-wallpaper-tiled');
            }
            me.el.setStyle({
                backgroundImage: bkgnd || ''
            });
            if (me.stateful) {
                me.saveState();
            }
        }
        return me;
    }
});

/**
 * This is the base class for {@link Ext.ux.event.Recorder} and {@link Ext.ux.event.Player}.
 */
Ext.define('Ext.ux.event.Driver', {
    extend: 'Ext.util.Observable',
    active: null,
    specialKeysByName: {
        PGUP: 33,
        PGDN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    },
    specialKeysByCode: {},
    /**
     * @event start
     * Fires when this object is started.
     * @param {Ext.ux.event.Driver} this
     */
    /**
     * @event stop
     * Fires when this object is stopped.
     * @param {Ext.ux.event.Driver} this
     */
    getTextSelection: function(el) {
        // See https://code.google.com/p/rangyinputs/source/browse/trunk/rangyinputs_jquery.js
        var doc = el.ownerDocument,
            range, range2, start, end;
        if (typeof el.selectionStart === "number") {
            start = el.selectionStart;
            end = el.selectionEnd;
        } else if (doc.selection) {
            range = doc.selection.createRange();
            range2 = el.createTextRange();
            range2.setEndPoint('EndToStart', range);
            start = range2.text.length;
            end = start + range.text.length;
        }
        return [
            start,
            end
        ];
    },
    getTime: function() {
        return new Date().getTime();
    },
    /**
     * Returns the number of milliseconds since start was called.
     */
    getTimestamp: function() {
        var d = this.getTime();
        return d - this.startTime;
    },
    onStart: function() {},
    onStop: function() {},
    /**
     * Starts this object. If this object is already started, nothing happens.
     */
    start: function() {
        var me = this;
        if (!me.active) {
            me.active = new Date();
            me.startTime = me.getTime();
            me.onStart();
            me.fireEvent('start', me);
        }
    },
    /**
     * Stops this object. If this object is not started, nothing happens.
     */
    stop: function() {
        var me = this;
        if (me.active) {
            me.active = null;
            me.onStop();
            me.fireEvent('stop', me);
        }
    }
}, function() {
    var proto = this.prototype;
    Ext.Object.each(proto.specialKeysByName, function(name, value) {
        proto.specialKeysByCode[value] = name;
    });
});

/**
 * Event maker.
 */
Ext.define('Ext.ux.event.Maker', {
    eventQueue: [],
    startAfter: 500,
    timerIncrement: 500,
    currentTiming: 0,
    constructor: function(config) {
        var me = this;
        me.currentTiming = me.startAfter;
        if (!Ext.isArray(config)) {
            config = [
                config
            ];
        }
        Ext.Array.each(config, function(item) {
            item.el = item.el || 'el';
            Ext.Array.each(Ext.ComponentQuery.query(item.cmpQuery), function(cmp) {
                var event = {},
                    x, y, el;
                if (!item.domQuery) {
                    el = cmp[item.el];
                } else {
                    el = cmp.el.down(item.domQuery);
                }
                event.target = '#' + el.dom.id;
                event.type = item.type;
                event.button = config.button || 0;
                x = el.getX() + (el.getWidth() / 2);
                y = el.getY() + (el.getHeight() / 2);
                event.xy = [
                    x,
                    y
                ];
                event.ts = me.currentTiming;
                me.currentTiming += me.timerIncrement;
                me.eventQueue.push(event);
            });
            if (item.screenshot) {
                me.eventQueue[me.eventQueue.length - 1].screenshot = true;
            }
        });
        return me.eventQueue;
    }
});

/**
 * @extends Ext.ux.event.Driver
 * This class manages the playback of an array of "event descriptors". For details on the
 * contents of an "event descriptor", see {@link Ext.ux.event.Recorder}. The events recorded by the
 * {@link Ext.ux.event.Recorder} class are designed to serve as input for this class.
 * 
 * The simplest use of this class is to instantiate it with an {@link #eventQueue} and call
 * {@link #method-start}. Like so:
 *
 *      var player = Ext.create('Ext.ux.event.Player', {
 *          eventQueue: [ ... ],
 *          speed: 2,  // play at 2x speed
 *          listeners: {
 *              stop: function () {
 *                  player = null; // all done
 *              }
 *          }
 *      });
 *
 *      player.start();
 *
 * A more complex use would be to incorporate keyframe generation after playing certain
 * events.
 *
 *      var player = Ext.create('Ext.ux.event.Player', {
 *          eventQueue: [ ... ],
 *          keyFrameEvents: {
 *              click: true
 *          },
 *          listeners: {
 *              stop: function () {
 *                  // play has completed... probably time for another keyframe...
 *                  player = null;
 *              },
 *              keyframe: onKeyFrame
 *          }
 *      });
 *
 *      player.start();
 *
 * If a keyframe can be handled immediately (synchronously), the listener would be:
 *
 *      function onKeyFrame () {
 *          handleKeyFrame();
 *      }
 *
 *  If the keyframe event is always handled asynchronously, then the event listener is only
 *  a bit more:
 *
 *      function onKeyFrame (p, eventDescriptor) {
 *          eventDescriptor.defer(); // pause event playback...
 *
 *          handleKeyFrame(function () {
 *              eventDescriptor.finish(); // ...resume event playback
 *          });
 *      }
 *
 * Finally, if the keyframe could be either handled synchronously or asynchronously (perhaps
 * differently by browser), a slightly more complex listener is required.
 *
 *      function onKeyFrame (p, eventDescriptor) {
 *          var async;
 *
 *          handleKeyFrame(function () {
 *              // either this callback is being called immediately by handleKeyFrame (in
 *              // which case async is undefined) or it is being called later (in which case
 *              // async will be true).
 *
 *              if (async) {
 *                  eventDescriptor.finish();
 *              } else {
 *                  async = false;
 *              }
 *          });
 *
 *          // either the callback was called (and async is now false) or it was not
 *          // called (and async remains undefined).
 *
 *          if (async !== false) {
 *              eventDescriptor.defer();
 *              async = true; // let the callback know that we have gone async
 *          }
 *      }
 */
Ext.define('Ext.ux.event.Player', function(Player) {
    var defaults = {},
        mouseEvents = {},
        keyEvents = {},
        doc,
        //HTML events supported
        uiEvents = {},
        //events that bubble by default
        bubbleEvents = {
            //scroll:     1,
            resize: 1,
            reset: 1,
            submit: 1,
            change: 1,
            select: 1,
            error: 1,
            abort: 1
        };
    Ext.each([
        'click',
        'dblclick',
        'mouseover',
        'mouseout',
        'mousedown',
        'mouseup',
        'mousemove'
    ], function(type) {
        bubbleEvents[type] = defaults[type] = mouseEvents[type] = {
            bubbles: true,
            cancelable: (type != "mousemove"),
            // mousemove cannot be cancelled
            detail: 1,
            screenX: 0,
            screenY: 0,
            clientX: 0,
            clientY: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 0
        };
    });
    Ext.each([
        'keydown',
        'keyup',
        'keypress'
    ], function(type) {
        bubbleEvents[type] = defaults[type] = keyEvents[type] = {
            bubbles: true,
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: 0,
            charCode: 0
        };
    });
    Ext.each([
        'blur',
        'change',
        'focus',
        'resize',
        'scroll',
        'select'
    ], function(type) {
        defaults[type] = uiEvents[type] = {
            bubbles: (type in bubbleEvents),
            cancelable: false,
            detail: 1
        };
    });
    var inputSpecialKeys = {
            8: function(target, start, end) {
                // backspace: 8,
                if (start < end) {
                    target.value = target.value.substring(0, start) + target.value.substring(end);
                } else if (start > 0) {
                    target.value = target.value.substring(0, --start) + target.value.substring(end);
                }
                this.setTextSelection(target, start, start);
            },
            46: function(target, start, end) {
                // delete: 46
                if (start < end) {
                    target.value = target.value.substring(0, start) + target.value.substring(end);
                } else if (start < target.value.length - 1) {
                    target.value = target.value.substring(0, start) + target.value.substring(start + 1);
                }
                this.setTextSelection(target, start, start);
            }
        };
    return {
        extend: 'Ext.ux.event.Driver',
        /**
     * @cfg {Array} eventQueue The event queue to playback. This must be provided before
     * the {@link #method-start} method is called.
     */
        /**
     * @cfg {Object} keyFrameEvents An object that describes the events that should generate
     * keyframe events. For example, `{ click: true }` would generate keyframe events after
     * each `click` event.
     */
        keyFrameEvents: {
            click: true
        },
        /**
     * @cfg {Boolean} pauseForAnimations True to pause event playback during animations, false
     * to ignore animations. Default is true.
     */
        pauseForAnimations: true,
        /**
     * @cfg {Number} speed The playback speed multiplier. Default is 1.0 (to playback at the
     * recorded speed). A value of 2 would playback at 2x speed.
     */
        speed: 1,
        stallTime: 0,
        _inputSpecialKeys: {
            INPUT: inputSpecialKeys,
            TEXTAREA: Ext.apply({}, //13: function (target, start, end) { // enter: 8,
            //TODO ?
            //}
            inputSpecialKeys)
        },
        tagPathRegEx: /(\w+)(?:\[(\d+)\])?/,
        /**
     * @event beforeplay
     * Fires before an event is played.
     * @param {Ext.ux.event.Player} this
     * @param {Object} eventDescriptor The event descriptor about to be played.
     */
        /**
     * @event keyframe
     * Fires when this player reaches a keyframe. Typically, this is after events
     * like `click` are injected and any resulting animations have been completed.
     * @param {Ext.ux.event.Player} this
     * @param {Object} eventDescriptor The keyframe event descriptor.
     */
        constructor: function(config) {
            var me = this;
            me.callParent(arguments);
            me.timerFn = function() {
                me.onTick();
            };
            me.attachTo = me.attachTo || window;
            doc = me.attachTo.document;
        },
        /**
     * Returns the element given is XPath-like description.
     * @param {String} xpath The XPath-like description of the element.
     * @return {HTMLElement}
     */
        getElementFromXPath: function(xpath) {
            var me = this,
                parts = xpath.split('/'),
                regex = me.tagPathRegEx,
                i, n, m, count, tag, child,
                el = me.attachTo.document;
            el = (parts[0] == '~') ? el.body : el.getElementById(parts[0].substring(1));
            // remove '#'
            for (i = 1 , n = parts.length; el && i < n; ++i) {
                m = regex.exec(parts[i]);
                count = m[2] ? parseInt(m[2], 10) : 1;
                tag = m[1].toUpperCase();
                for (child = el.firstChild; child; child = child.nextSibling) {
                    if (child.tagName == tag) {
                        if (count == 1) {
                            break;
                        }
                        --count;
                    }
                }
                el = child;
            }
            return el;
        },
        // Moving across a line break only counts as moving one character in a TextRange, whereas a line break in
        // the textarea value is two characters. This function corrects for that by converting a text offset into a
        // range character offset by subtracting one character for every line break in the textarea prior to the
        // offset
        offsetToRangeCharacterMove: function(el, offset) {
            return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
        },
        setTextSelection: function(el, startOffset, endOffset) {
            // See https://code.google.com/p/rangyinputs/source/browse/trunk/rangyinputs_jquery.js
            if (startOffset < 0) {
                startOffset += el.value.length;
            }
            if (endOffset == null) {
                endOffset = startOffset;
            }
            if (endOffset < 0) {
                endOffset += el.value.length;
            }
            if (typeof el.selectionStart === "number") {
                el.selectionStart = startOffset;
                el.selectionEnd = endOffset;
            } else {
                var range = el.createTextRange();
                var startCharMove = this.offsetToRangeCharacterMove(el, startOffset);
                range.collapse(true);
                if (startOffset == endOffset) {
                    range.move("character", startCharMove);
                } else {
                    range.moveEnd("character", this.offsetToRangeCharacterMove(el, endOffset));
                    range.moveStart("character", startCharMove);
                }
                range.select();
            }
        },
        getTimeIndex: function() {
            var t = this.getTimestamp() - this.stallTime;
            return t * this.speed;
        },
        makeToken: function(eventDescriptor, signal) {
            var me = this,
                t0;
            eventDescriptor[signal] = true;
            eventDescriptor.defer = function() {
                eventDescriptor[signal] = false;
                t0 = me.getTime();
            };
            eventDescriptor.finish = function() {
                eventDescriptor[signal] = true;
                me.stallTime += me.getTime() - t0;
                me.schedule();
            };
        },
        /**
     * This method is called after an event has been played to prepare for the next event.
     * @param {Object} eventDescriptor The descriptor of the event just played.
     */
        nextEvent: function(eventDescriptor) {
            var me = this,
                index = ++me.queueIndex;
            // keyframe events are inserted after a keyFrameEvent is played.
            if (me.keyFrameEvents[eventDescriptor.type]) {
                Ext.Array.insert(me.eventQueue, index, [
                    {
                        keyframe: true,
                        ts: eventDescriptor.ts
                    }
                ]);
            }
        },
        /**
     * This method returns the event descriptor at the front of the queue. This does not
     * dequeue the event. Repeated calls return the same object (until {@link #nextEvent}
     * is called).
     */
        peekEvent: function() {
            return this.eventQueue[this.queueIndex] || null;
        },
        /**
     * Replaces an event in the queue with an array of events. This is often used to roll
     * up a multi-step pseudo-event and expand it just-in-time to be played. The process
     * for doing this in a derived class would be this:
     * 
     *      Ext.define('My.Player', {
     *          extend: 'Ext.ux.event.Player',
     *
     *          peekEvent: function () {
     *              var event = this.callParent();
     *
     *              if (event.multiStepSpecial) {
     *                  this.replaceEvent(null, [
     *                      ... expand to actual events
     *                  ]);
     *
     *                  event = this.callParent(); // get the new next event
     *              }
     *
     *              return event;
     *          }
     *      });
     * 
     * This method ensures that the `beforeplay` hook (if any) from the replaced event is
     * placed on the first new event and the `afterplay` hook (if any) is placed on the
     * last new event.
     * 
     * @param {Number} index The queue index to replace. Pass `null` to replace the event
     * at the current `queueIndex`.
     * @param {Event[]} events The array of events with which to replace the specified
     * event.
     */
        replaceEvent: function(index, events) {
            for (var t,
                i = 0,
                n = events.length; i < n; ++i) {
                if (i) {
                    t = events[i - 1];
                    delete t.afterplay;
                    delete t.screenshot;
                    delete events[i].beforeplay;
                }
            }
            Ext.Array.replace(this.eventQueue, (index == null) ? this.queueIndex : index, 1, events);
        },
        /**
     * This method dequeues and injects events until it has arrived at the time index. If
     * no events are ready (based on the time index), this method does nothing.
     * @return {Boolean} True if there is more to do; false if not (at least for now).
     */
        processEvents: function() {
            var me = this,
                animations = me.pauseForAnimations && me.attachTo.Ext.fx.Manager.items,
                eventDescriptor;
            while ((eventDescriptor = me.peekEvent()) !== null) {
                if (animations && animations.getCount()) {
                    return true;
                }
                if (eventDescriptor.keyframe) {
                    if (!me.processKeyFrame(eventDescriptor)) {
                        return false;
                    }
                    me.nextEvent(eventDescriptor);
                } else if (eventDescriptor.ts <= me.getTimeIndex() && me.fireEvent('beforeplay', me, eventDescriptor) !== false && me.playEvent(eventDescriptor)) {
                    me.nextEvent(eventDescriptor);
                } else {
                    return true;
                }
            }
            me.stop();
            return false;
        },
        /**
     * This method is called when a keyframe is reached. This will fire the keyframe event.
     * If the keyframe has been handled, true is returned. Otherwise, false is returned.
     * @param {Object} eventDescriptor The event descriptor of the keyframe.
     * @return {Boolean} True if the keyframe was handled, false if not.
     */
        processKeyFrame: function(eventDescriptor) {
            var me = this;
            // only fire keyframe event (and setup the eventDescriptor) once...
            if (!eventDescriptor.defer) {
                me.makeToken(eventDescriptor, 'done');
                me.fireEvent('keyframe', me, eventDescriptor);
            }
            return eventDescriptor.done;
        },
        /**
     * Called to inject the given event on the specified target.
     * @param {HTMLElement} target The target of the event.
     * @param {Object} event The event to inject. The properties of this object should be
     * those of standard DOM events but vary based on the `type` property. For details on
     * event types and their properties, see the class documentation.
     */
        injectEvent: function(target, event) {
            var me = this,
                type = event.type,
                options = Ext.apply({}, event, defaults[type]),
                handler;
            if (type === 'type') {
                handler = me._inputSpecialKeys[target.tagName];
                if (handler) {
                    return me.injectTypeInputEvent(target, event, handler);
                }
                return me.injectTypeEvent(target, event);
            }
            if (type === 'focus' && target.focus) {
                target.focus();
                return true;
            }
            if (type === 'blur' && target.blur) {
                target.blur();
                return true;
            }
            if (type === 'scroll') {
                target.scrollLeft = event.pos[0];
                target.scrollTop = event.pos[1];
                return true;
            }
            if (type === 'mduclick') {
                return me.injectEvent(target, Ext.applyIf({
                    type: 'mousedown'
                }, event)) && me.injectEvent(target, Ext.applyIf({
                    type: 'mouseup'
                }, event)) && me.injectEvent(target, Ext.applyIf({
                    type: 'click'
                }, event));
            }
            if (mouseEvents[type]) {
                return Player.injectMouseEvent(target, options, me.attachTo);
            }
            if (keyEvents[type]) {
                return Player.injectKeyEvent(target, options, me.attachTo);
            }
            if (uiEvents[type]) {
                return Player.injectUIEvent(target, type, options.bubbles, options.cancelable, options.view || me.attachTo, options.detail);
            }
            return false;
        },
        injectTypeEvent: function(target, event) {
            var me = this,
                text = event.text,
                xlat = [],
                ch, chUp, i, n, sel, upper, isInput;
            if (text) {
                delete event.text;
                upper = text.toUpperCase();
                for (i = 0 , n = text.length; i < n; ++i) {
                    ch = text.charCodeAt(i);
                    chUp = upper.charCodeAt(i);
                    xlat.push(Ext.applyIf({
                        type: 'keydown',
                        charCode: chUp,
                        keyCode: chUp
                    }, event), Ext.applyIf({
                        type: 'keypress',
                        charCode: ch,
                        keyCode: ch
                    }, event), Ext.applyIf({
                        type: 'keyup',
                        charCode: chUp,
                        keyCode: chUp
                    }, event));
                }
            } else {
                xlat.push(Ext.applyIf({
                    type: 'keydown',
                    charCode: event.keyCode
                }, event), Ext.applyIf({
                    type: 'keyup',
                    charCode: event.keyCode
                }, event));
            }
            for (i = 0 , n = xlat.length; i < n; ++i) {
                me.injectEvent(target, xlat[i]);
            }
            return true;
        },
        injectTypeInputEvent: function(target, event, handler) {
            var me = this,
                text = event.text,
                sel, n;
            if (handler) {
                sel = me.getTextSelection(target);
                if (text) {
                    n = sel[0];
                    target.value = target.value.substring(0, n) + text + target.value.substring(sel[1]);
                    n += text.length;
                    me.setTextSelection(target, n, n);
                } else {
                    if (!(handler = handler[event.keyCode])) {
                        // no handler for the special key for this element
                        if ('caret' in event) {
                            me.setTextSelection(target, event.caret, event.caret);
                        } else if (event.selection) {
                            me.setTextSelection(target, event.selection[0], event.selection[1]);
                        }
                        return me.injectTypeEvent(target, event);
                    }
                    handler.call(this, target, sel[0], sel[1]);
                    return true;
                }
            }
            return true;
        },
        playEvent: function(eventDescriptor) {
            var me = this,
                target = me.getElementFromXPath(eventDescriptor.target),
                event;
            if (!target) {
                // not present (yet)... wait for element present...
                // TODO - need a timeout here
                return false;
            }
            if (!me.playEventHook(eventDescriptor, 'beforeplay')) {
                return false;
            }
            if (!eventDescriptor.injected) {
                eventDescriptor.injected = true;
                event = me.translateEvent(eventDescriptor, target);
                me.injectEvent(target, event);
            }
            return me.playEventHook(eventDescriptor, 'afterplay');
        },
        playEventHook: function(eventDescriptor, hookName) {
            var me = this,
                doneName = hookName + '.done',
                firedName = hookName + '.fired',
                hook = eventDescriptor[hookName];
            if (hook && !eventDescriptor[doneName]) {
                if (!eventDescriptor[firedName]) {
                    eventDescriptor[firedName] = true;
                    me.makeToken(eventDescriptor, doneName);
                    if (me.eventScope && Ext.isString(hook)) {
                        hook = me.eventScope[hook];
                    }
                    if (hook) {
                        hook.call(me.eventScope || me, eventDescriptor);
                    }
                }
                return false;
            }
            return true;
        },
        schedule: function() {
            var me = this;
            if (!me.timer) {
                me.timer = setTimeout(me.timerFn, 10);
            }
        },
        _translateAcross: [
            'type',
            'button',
            'charCode',
            'keyCode',
            'caret',
            'pos',
            'text',
            'selection'
        ],
        translateEvent: function(eventDescriptor, target) {
            var me = this,
                event = {},
                modKeys = eventDescriptor.modKeys || '',
                names = me._translateAcross,
                i = names.length,
                name, xy;
            while (i--) {
                name = names[i];
                if (name in eventDescriptor) {
                    event[name] = eventDescriptor[name];
                }
            }
            event.altKey = modKeys.indexOf('A') > 0;
            event.ctrlKey = modKeys.indexOf('C') > 0;
            event.metaKey = modKeys.indexOf('M') > 0;
            event.shiftKey = modKeys.indexOf('S') > 0;
            if (target && 'x' in eventDescriptor) {
                xy = Ext.fly(target).getXY();
                xy[0] += eventDescriptor.x;
                xy[1] += eventDescriptor.y;
            } else if ('x' in eventDescriptor) {
                xy = [
                    eventDescriptor.x,
                    eventDescriptor.y
                ];
            } else if ('px' in eventDescriptor) {
                xy = [
                    eventDescriptor.px,
                    eventDescriptor.py
                ];
            }
            if (xy) {
                event.clientX = event.screenX = xy[0];
                event.clientY = event.screenY = xy[1];
            }
            if (eventDescriptor.key) {
                event.keyCode = me.specialKeysByName[eventDescriptor.key];
            }
            if (eventDescriptor.type === 'wheel') {
                if ('onwheel' in me.attachTo.document) {
                    event.wheelX = eventDescriptor.dx;
                    event.wheelY = eventDescriptor.dy;
                } else {
                    event.type = 'mousewheel';
                    event.wheelDeltaX = -40 * eventDescriptor.dx;
                    event.wheelDeltaY = event.wheelDelta = -40 * eventDescriptor.dy;
                }
            }
            return event;
        },
        //---------------------------------
        // Driver overrides
        onStart: function() {
            var me = this;
            me.queueIndex = 0;
            me.schedule();
        },
        onStop: function() {
            var me = this;
            if (me.timer) {
                clearTimeout(me.timer);
                me.timer = null;
            }
        },
        //---------------------------------
        onTick: function() {
            var me = this;
            me.timer = null;
            if (me.processEvents()) {
                me.schedule();
            }
        },
        statics: {
            ieButtonCodeMap: {
                0: 1,
                1: 4,
                2: 2
            },
            /*
         * Injects a key event using the given event information to populate the event
         * object.
         * 
         * **Note:** `keydown` causes Safari 2.x to crash.
         * 
         * @param {HTMLElement} target The target of the given event.
         * @param {Object} options Object object containing all of the event injection
         * options.
         * @param {String} options.type The type of event to fire. This can be any one of
         * the following: `keyup`, `keydown` and `keypress`.
         * @param {Boolean} [options.bubbles=true] `tru` if the event can be bubbled up.
         * DOM Level 3 specifies that all key events bubble by default.
         * @param {Boolean} [options.cancelable=true] `true` if the event can be canceled
         * using `preventDefault`. DOM Level 3 specifies that all key events can be
         * cancelled.
         * @param {Boolean} [options.ctrlKey=false] `true` if one of the CTRL keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.altKey=false] `true` if one of the ALT keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.shiftKey=false] `true` if one of the SHIFT keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.metaKey=false] `true` if one of the META keys is
         * pressed while the event is firing.
         * @param {int} [options.keyCode=0] The code for the key that is in use.
         * @param {int} [options.charCode=0] The Unicode code for the character associated
         * with the key being used.
         * @param {Window} [view=window] The view containing the target. This is typically
         * the window object.
         * @private
         */
            injectKeyEvent: function(target, options, view) {
                var type = options.type,
                    customEvent = null;
                if (type === 'textevent') {
                    type = 'keypress';
                }
                view = view || window;
                //check for DOM-compliant browsers first
                if (doc.createEvent) {
                    try {
                        customEvent = doc.createEvent("KeyEvents");
                        // Interesting problem: Firefox implemented a non-standard
                        // version of initKeyEvent() based on DOM Level 2 specs.
                        // Key event was removed from DOM Level 2 and re-introduced
                        // in DOM Level 3 with a different interface. Firefox is the
                        // only browser with any implementation of Key Events, so for
                        // now, assume it's Firefox if the above line doesn't error.
                        // @TODO: Decipher between Firefox's implementation and a correct one.
                        customEvent.initKeyEvent(type, options.bubbles, options.cancelable, view, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.keyCode, options.charCode);
                    } catch (ex) {
                        // If it got here, that means key events aren't officially supported. 
                        // Safari/WebKit is a real problem now. WebKit 522 won't let you
                        // set keyCode, charCode, or other properties if you use a
                        // UIEvent, so we first must try to create a generic event. The
                        // fun part is that this will throw an error on Safari 2.x. The
                        // end result is that we need another try...catch statement just to
                        // deal with this mess.
                        try {
                            //try to create generic event - will fail in Safari 2.x
                            customEvent = doc.createEvent("Events");
                        } catch (uierror) {
                            //the above failed, so create a UIEvent for Safari 2.x
                            customEvent = doc.createEvent("UIEvents");
                        } finally {
                            customEvent.initEvent(type, options.bubbles, options.cancelable);
                            customEvent.view = view;
                            customEvent.altKey = options.altKey;
                            customEvent.ctrlKey = options.ctrlKey;
                            customEvent.shiftKey = options.shiftKey;
                            customEvent.metaKey = options.metaKey;
                            customEvent.keyCode = options.keyCode;
                            customEvent.charCode = options.charCode;
                        }
                    }
                    target.dispatchEvent(customEvent);
                } else if (doc.createEventObject) {
                    //IE
                    customEvent = doc.createEventObject();
                    customEvent.bubbles = options.bubbles;
                    customEvent.cancelable = options.cancelable;
                    customEvent.view = view;
                    customEvent.ctrlKey = options.ctrlKey;
                    customEvent.altKey = options.altKey;
                    customEvent.shiftKey = options.shiftKey;
                    customEvent.metaKey = options.metaKey;
                    // IE doesn't support charCode explicitly. CharCode should
                    // take precedence over any keyCode value for accurate
                    // representation.
                    customEvent.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
                    target.fireEvent("on" + type, customEvent);
                } else {
                    return false;
                }
                return true;
            },
            /*
         * Injects a mouse event using the given event information to populate the event
         * object.
         *
         * @param {HTMLElement} target The target of the given event.
         * @param {Object} options Object object containing all of the event injection
         * options.
         * @param {String} options.type The type of event to fire. This can be any one of
         * the following: `click`, `dblclick`, `mousedown`, `mouseup`, `mouseout`,
         * `mouseover` and `mousemove`.
         * @param {Boolean} [options.bubbles=true] `tru` if the event can be bubbled up.
         * DOM Level 2 specifies that all mouse events bubble by default.
         * @param {Boolean} [options.cancelable=true] `true` if the event can be canceled
         * using `preventDefault`. DOM Level 2 specifies that all mouse events except
         * `mousemove` can be cancelled. This defaults to `false` for `mousemove`.
         * @param {Boolean} [options.ctrlKey=false] `true` if one of the CTRL keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.altKey=false] `true` if one of the ALT keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.shiftKey=false] `true` if one of the SHIFT keys is
         * pressed while the event is firing.
         * @param {Boolean} [options.metaKey=false] `true` if one of the META keys is
         * pressed while the event is firing.
         * @param {int} [options.detail=1] The number of times the mouse button has been
         * used.
         * @param {int} [options.screenX=0] The x-coordinate on the screen at which point
         * the event occurred.
         * @param {int} [options.screenY=0] The y-coordinate on the screen at which point
         * the event occurred.
         * @param {int} [options.clientX=0] The x-coordinate on the client at which point
         * the event occurred.
         * @param {int} [options.clientY=0] The y-coordinate on the client at which point
         * the event occurred.
         * @param {int} [options.button=0] The button being pressed while the event is
         * executing. The value should be 0 for the primary mouse button (typically the
         * left button), 1 for the tertiary mouse button (typically the middle button),
         * and 2 for the secondary mouse button (typically the right button).
         * @param {HTMLElement} [options.relatedTarget=null] For `mouseout` events, this
         * is the element that the mouse has moved to. For `mouseover` events, this is
         * the element that the mouse has moved from. This argument is ignored for all
         * other events.
         * @param {Window} [view=window] The view containing the target. This is typically
         * the window object.
         * @private
         */
            injectMouseEvent: function(target, options, view) {
                var type = options.type,
                    customEvent = null;
                view = view || window;
                //check for DOM-compliant browsers first
                if (doc.createEvent) {
                    customEvent = doc.createEvent("MouseEvents");
                    //Safari 2.x (WebKit 418) still doesn't implement initMouseEvent()
                    if (customEvent.initMouseEvent) {
                        customEvent.initMouseEvent(type, options.bubbles, options.cancelable, view, options.detail, options.screenX, options.screenY, options.clientX, options.clientY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget);
                    } else {
                        //Safari
                        //the closest thing available in Safari 2.x is UIEvents
                        customEvent = doc.createEvent("UIEvents");
                        customEvent.initEvent(type, options.bubbles, options.cancelable);
                        customEvent.view = view;
                        customEvent.detail = options.detail;
                        customEvent.screenX = options.screenX;
                        customEvent.screenY = options.screenY;
                        customEvent.clientX = options.clientX;
                        customEvent.clientY = options.clientY;
                        customEvent.ctrlKey = options.ctrlKey;
                        customEvent.altKey = options.altKey;
                        customEvent.metaKey = options.metaKey;
                        customEvent.shiftKey = options.shiftKey;
                        customEvent.button = options.button;
                        customEvent.relatedTarget = options.relatedTarget;
                    }
                    /*
                 * Check to see if relatedTarget has been assigned. Firefox
                 * versions less than 2.0 don't allow it to be assigned via
                 * initMouseEvent() and the property is readonly after event
                 * creation, so in order to keep YAHOO.util.getRelatedTarget()
                 * working, assign to the IE proprietary toElement property
                 * for mouseout event and fromElement property for mouseover
                 * event.
                 */
                    if (options.relatedTarget && !customEvent.relatedTarget) {
                        if (type == "mouseout") {
                            customEvent.toElement = options.relatedTarget;
                        } else if (type == "mouseover") {
                            customEvent.fromElement = options.relatedTarget;
                        }
                    }
                    target.dispatchEvent(customEvent);
                } else if (doc.createEventObject) {
                    //IE
                    customEvent = doc.createEventObject();
                    customEvent.bubbles = options.bubbles;
                    customEvent.cancelable = options.cancelable;
                    customEvent.view = view;
                    customEvent.detail = options.detail;
                    customEvent.screenX = options.screenX;
                    customEvent.screenY = options.screenY;
                    customEvent.clientX = options.clientX;
                    customEvent.clientY = options.clientY;
                    customEvent.ctrlKey = options.ctrlKey;
                    customEvent.altKey = options.altKey;
                    customEvent.metaKey = options.metaKey;
                    customEvent.shiftKey = options.shiftKey;
                    customEvent.button = Player.ieButtonCodeMap[options.button] || 0;
                    /*
                 * Have to use relatedTarget because IE won't allow assignment
                 * to toElement or fromElement on generic events. This keeps
                 * YAHOO.util.customEvent.getRelatedTarget() functional.
                 */
                    customEvent.relatedTarget = options.relatedTarget;
                    target.fireEvent('on' + type, customEvent);
                } else {
                    return false;
                }
                return true;
            },
            /*
         * Injects a UI event using the given event information to populate the event
         * object.
         * 
         * @param {HTMLElement} target The target of the given event.
         * @param {String} options.type The type of event to fire. This can be any one of
         * the following: `click`, `dblclick`, `mousedown`, `mouseup`, `mouseout`,
         * `mouseover` and `mousemove`.
         * @param {Boolean} [options.bubbles=true] `tru` if the event can be bubbled up.
         * DOM Level 2 specifies that all mouse events bubble by default.
         * @param {Boolean} [options.cancelable=true] `true` if the event can be canceled
         * using `preventDefault`. DOM Level 2 specifies that all mouse events except
         * `mousemove` can be canceled. This defaults to `false` for `mousemove`.
         * @param {int} [options.detail=1] The number of times the mouse button has been
         * used.
         * @param {Window} [view=window] The view containing the target. This is typically
         * the window object.
         * @private
         */
            injectUIEvent: function(target, options, view) {
                var customEvent = null;
                view = view || window;
                //check for DOM-compliant browsers first
                if (doc.createEvent) {
                    //just a generic UI Event object is needed
                    customEvent = doc.createEvent("UIEvents");
                    customEvent.initUIEvent(options.type, options.bubbles, options.cancelable, view, options.detail);
                    target.dispatchEvent(customEvent);
                } else if (doc.createEventObject) {
                    //IE
                    customEvent = doc.createEventObject();
                    customEvent.bubbles = options.bubbles;
                    customEvent.cancelable = options.cancelable;
                    customEvent.view = view;
                    customEvent.detail = options.detail;
                    target.fireEvent("on" + options.type, customEvent);
                } else {
                    return false;
                }
                return true;
            }
        }
    };
});
// statics

/**
 * @extends Ext.ux.event.Driver
 * Event recorder.
 */
Ext.define('Ext.ux.event.Recorder', function(Recorder) {
    function apply() {
        var a = arguments,
            n = a.length,
            obj = {
                kind: 'other'
            },
            i;
        for (i = 0; i < n; ++i) {
            Ext.apply(obj, arguments[i]);
        }
        if (obj.alt && !obj.event) {
            obj.event = obj.alt;
        }
        return obj;
    }
    function key(extra) {
        return apply({
            kind: 'keyboard',
            modKeys: true,
            key: true
        }, extra);
    }
    function mouse(extra) {
        return apply({
            kind: 'mouse',
            button: true,
            modKeys: true,
            xy: true
        }, extra);
    }
    var eventsToRecord = {
            keydown: key(),
            keypress: key(),
            keyup: key(),
            dragmove: mouse({
                alt: 'mousemove',
                pageCoords: true,
                whileDrag: true
            }),
            mousemove: mouse({
                pageCoords: true
            }),
            mouseover: mouse(),
            mouseout: mouse(),
            click: mouse(),
            wheel: mouse({
                wheel: true
            }),
            mousedown: mouse({
                press: true
            }),
            mouseup: mouse({
                release: true
            }),
            scroll: apply({
                listen: false
            }),
            focus: apply(),
            blur: apply()
        };
    for (var key in eventsToRecord) {
        if (!eventsToRecord[key].event) {
            eventsToRecord[key].event = key;
        }
    }
    eventsToRecord.wheel.event = null;
    // must detect later
    return {
        extend: 'Ext.ux.event.Driver',
        /**
         * @event add
         * Fires when an event is added to the recording.
         * @param {Ext.ux.event.Recorder} this
         * @param {Object} eventDescriptor The event descriptor.
         */
        /**
         * @event coalesce
         * Fires when an event is coalesced. This edits the tail of the recorded
         * event list.
         * @param {Ext.ux.event.Recorder} this
         * @param {Object} eventDescriptor The event descriptor that was coalesced.
         */
        eventsToRecord: eventsToRecord,
        ignoreIdRegEx: /ext-gen(?:\d+)/,
        inputRe: /^(input|textarea)$/i,
        constructor: function(config) {
            var me = this,
                events = config && config.eventsToRecord;
            if (events) {
                me.eventsToRecord = Ext.apply(Ext.apply({}, me.eventsToRecord), // duplicate
                events);
                // and merge
                delete config.eventsToRecord;
            }
            // don't smash
            me.callParent(arguments);
            me.clear();
            me.modKeys = [];
            me.attachTo = me.attachTo || window;
        },
        clear: function() {
            this.eventsRecorded = [];
        },
        listenToEvent: function(event) {
            var me = this,
                el = me.attachTo.document.body,
                fn = function() {
                    return me.onEvent.apply(me, arguments);
                },
                cleaner = {};
            if (el.attachEvent && el.ownerDocument.documentMode < 10) {
                event = 'on' + event;
                el.attachEvent(event, fn);
                cleaner.destroy = function() {
                    if (fn) {
                        el.detachEvent(event, fn);
                        fn = null;
                    }
                };
            } else {
                el.addEventListener(event, fn, true);
                cleaner.destroy = function() {
                    if (fn) {
                        el.removeEventListener(event, fn, true);
                        fn = null;
                    }
                };
            }
            return cleaner;
        },
        coalesce: function(rec, ev) {
            var me = this,
                events = me.eventsRecorded,
                length = events.length,
                tail = length && events[length - 1],
                tail2 = (length > 1) && events[length - 2],
                tail3 = (length > 2) && events[length - 3];
            if (!tail) {
                return false;
            }
            if (rec.type === 'mousemove') {
                if (tail.type === 'mousemove' && rec.ts - tail.ts < 200) {
                    rec.ts = tail.ts;
                    events[length - 1] = rec;
                    return true;
                }
            } else if (rec.type === 'click') {
                if (tail2 && tail.type === 'mouseup' && tail2.type === 'mousedown') {
                    if (rec.button == tail.button && rec.button == tail2.button && rec.target == tail.target && rec.target == tail2.target && me.samePt(rec, tail) && me.samePt(rec, tail2)) {
                        events.pop();
                        // remove mouseup
                        tail2.type = 'mduclick';
                        return true;
                    }
                }
            } else if (rec.type === 'keyup') {
                // tail3 = { type: "type",     text: "..." },
                // tail2 = { type: "keydown",  charCode: 65, keyCode: 65 },
                // tail  = { type: "keypress", charCode: 97, keyCode: 97 },
                // rec   = { type: "keyup",    charCode: 65, keyCode: 65 },
                if (tail2 && tail.type === 'keypress' && tail2.type === 'keydown') {
                    if (rec.target === tail.target && rec.target === tail2.target) {
                        events.pop();
                        // remove keypress
                        tail2.type = 'type';
                        tail2.text = String.fromCharCode(tail.charCode);
                        delete tail2.charCode;
                        delete tail2.keyCode;
                        if (tail3 && tail3.type === 'type') {
                            if (tail3.text && tail3.target === tail2.target) {
                                tail3.text += tail2.text;
                                events.pop();
                            }
                        }
                        return true;
                    }
                }
                // tail = { type: "keydown", charCode: 40, keyCode: 40 },
                // rec  = { type: "keyup",   charCode: 40, keyCode: 40 },
                else if (me.completeKeyStroke(tail, rec)) {
                    tail.type = 'type';
                    me.completeSpecialKeyStroke(ev.target, tail, rec);
                    return true;
                }
                // tail2 = { type: "keydown", charCode: 40, keyCode: 40 },
                // tail  = { type: "scroll",  ... },
                // rec   = { type: "keyup",   charCode: 40, keyCode: 40 },
                else if (tail.type === 'scroll' && me.completeKeyStroke(tail2, rec)) {
                    tail2.type = 'type';
                    me.completeSpecialKeyStroke(ev.target, tail2, rec);
                    // swap the order of type and scroll events
                    events.pop();
                    events.pop();
                    events.push(tail, tail2);
                    return true;
                }
            }
            return false;
        },
        completeKeyStroke: function(down, up) {
            if (down && down.type === 'keydown' && down.keyCode === up.keyCode) {
                delete down.charCode;
                return true;
            }
            return false;
        },
        completeSpecialKeyStroke: function(target, down, up) {
            var key = this.specialKeysByCode[up.keyCode];
            if (key && this.inputRe.test(target.tagName)) {
                // home,end,arrow keys + shift get crazy, so encode selection/caret
                delete down.keyCode;
                down.key = key;
                down.selection = this.getTextSelection(target);
                if (down.selection[0] === down.selection[1]) {
                    down.caret = down.selection[0];
                    delete down.selection;
                }
                return true;
            }
            return false;
        },
        getElementXPath: function(el) {
            var me = this,
                good = false,
                xpath = [],
                count, sibling, t, tag;
            for (t = el; t; t = t.parentNode) {
                if (t == me.attachTo.document.body) {
                    xpath.unshift('~');
                    good = true;
                    break;
                }
                if (t.id && !me.ignoreIdRegEx.test(t.id)) {
                    xpath.unshift('#' + t.id);
                    good = true;
                    break;
                }
                for (count = 1 , sibling = t; !!(sibling = sibling.previousSibling); ) {
                    if (sibling.tagName == t.tagName) {
                        ++count;
                    }
                }
                tag = t.tagName.toLowerCase();
                if (count < 2) {
                    xpath.unshift(tag);
                } else {
                    xpath.unshift(tag + '[' + count + ']');
                }
            }
            return good ? xpath.join('/') : null;
        },
        getRecordedEvents: function() {
            return this.eventsRecorded;
        },
        onEvent: function(ev) {
            var me = this,
                e = new Ext.event.Event(ev),
                info = me.eventsToRecord[e.type],
                root, modKeys, elXY,
                rec = {
                    type: e.type,
                    ts: me.getTimestamp(),
                    target: me.getElementXPath(e.target)
                },
                xy;
            if (!info || !rec.target) {
                return;
            }
            root = e.target.ownerDocument;
            root = root.defaultView || root.parentWindow;
            // Standards || IE
            if (root !== me.attachTo) {
                return;
            }
            if (me.eventsToRecord.scroll) {
                me.syncScroll(e.target);
            }
            if (info.xy) {
                xy = e.getXY();
                if (info.pageCoords || !rec.target) {
                    rec.px = xy[0];
                    rec.py = xy[1];
                } else {
                    elXY = Ext.fly(e.getTarget()).getXY();
                    xy[0] -= elXY[0];
                    xy[1] -= elXY[1];
                    rec.x = xy[0];
                    rec.y = xy[1];
                }
            }
            if (info.button) {
                if ('buttons' in ev) {
                    rec.button = ev.buttons;
                } else // LEFT=1, RIGHT=2, MIDDLE=4, etc.
                {
                    rec.button = ev.button;
                }
                if (!rec.button && info.whileDrag) {
                    return;
                }
            }
            if (info.wheel) {
                rec.type = 'wheel';
                if (info.event === 'wheel') {
                    // Current FireFox (technically IE9+ if we use addEventListener but
                    // checking document.onwheel does not detect this)
                    rec.dx = ev.deltaX;
                    rec.dy = ev.deltaY;
                } else if (typeof ev.wheelDeltaX === 'number') {
                    // new WebKit has both X & Y
                    rec.dx = -1 / 40 * ev.wheelDeltaX;
                    rec.dy = -1 / 40 * ev.wheelDeltaY;
                } else if (ev.wheelDelta) {
                    // old WebKit and IE
                    rec.dy = -1 / 40 * ev.wheelDelta;
                } else if (ev.detail) {
                    // Old Gecko
                    rec.dy = ev.detail;
                }
            }
            if (info.modKeys) {
                me.modKeys[0] = e.altKey ? 'A' : '';
                me.modKeys[1] = e.ctrlKey ? 'C' : '';
                me.modKeys[2] = e.metaKey ? 'M' : '';
                me.modKeys[3] = e.shiftKey ? 'S' : '';
                modKeys = me.modKeys.join('');
                if (modKeys) {
                    rec.modKeys = modKeys;
                }
            }
            if (info.key) {
                rec.charCode = e.getCharCode();
                rec.keyCode = e.getKey();
            }
            if (me.coalesce(rec, e)) {
                me.fireEvent('coalesce', me, rec);
            } else {
                me.eventsRecorded.push(rec);
                me.fireEvent('add', me, rec);
            }
        },
        onStart: function() {
            var me = this,
                ddm = me.attachTo.Ext.dd.DragDropManager,
                evproto = me.attachTo.Ext.EventObjectImpl.prototype,
                special = [];
            // FireFox does not support the 'mousewheel' event but does support the
            // 'wheel' event instead.
            Recorder.prototype.eventsToRecord.wheel.event = ('onwheel' in me.attachTo.document) ? 'wheel' : 'mousewheel';
            me.listeners = [];
            Ext.Object.each(me.eventsToRecord, function(name, value) {
                if (value && value.listen !== false) {
                    if (!value.event) {
                        value.event = name;
                    }
                    if (value.alt && value.alt !== name) {
                        // The 'drag' event is just mousemove while buttons are pressed,
                        // so if there is a mousemove entry as well, ignore the drag
                        if (!me.eventsToRecord[value.alt]) {
                            special.push(value);
                        }
                    } else {
                        me.listeners.push(me.listenToEvent(value.event));
                    }
                }
            });
            Ext.each(special, function(info) {
                me.eventsToRecord[info.alt] = info;
                me.listeners.push(me.listenToEvent(info.alt));
            });
            me.ddmStopEvent = ddm.stopEvent;
            ddm.stopEvent = Ext.Function.createSequence(ddm.stopEvent, function(e) {
                me.onEvent(e);
            });
            me.evStopEvent = evproto.stopEvent;
            evproto.stopEvent = Ext.Function.createSequence(evproto.stopEvent, function() {
                me.onEvent(this);
            });
        },
        onStop: function() {
            var me = this;
            Ext.destroy(me.listeners);
            me.listeners = null;
            me.attachTo.Ext.dd.DragDropManager.stopEvent = me.ddmStopEvent;
            me.attachTo.Ext.EventObjectImpl.prototype.stopEvent = me.evStopEvent;
        },
        samePt: function(pt1, pt2) {
            return pt1.x == pt2.x && pt1.y == pt2.y;
        },
        syncScroll: function(el) {
            var me = this,
                ts = me.getTimestamp(),
                oldX, oldY, x, y, scrolled, rec;
            for (var p = el; p; p = p.parentNode) {
                oldX = p.$lastScrollLeft;
                oldY = p.$lastScrollTop;
                x = p.scrollLeft;
                y = p.scrollTop;
                scrolled = false;
                if (oldX !== x) {
                    if (x) {
                        scrolled = true;
                    }
                    p.$lastScrollLeft = x;
                }
                if (oldY !== y) {
                    if (y) {
                        scrolled = true;
                    }
                    p.$lastScrollTop = y;
                }
                if (scrolled) {
                    //console.log('scroll x:' + x + ' y:' + y, p);
                    me.eventsRecorded.push(rec = {
                        type: 'scroll',
                        target: me.getElementXPath(p),
                        ts: ts,
                        pos: [
                            x,
                            y
                        ]
                    });
                    me.fireEvent('add', me, rec);
                }
                if (p.tagName === 'BODY') {
                    break;
                }
            }
        }
    };
});

/**
 * Recorder manager.
 * Used as a bookmarklet:
 *
 *    javascript:void(window.open("../ux/event/RecorderManager.html","recmgr"))
 */
Ext.define('Ext.ux.event.RecorderManager', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.eventrecordermanager',
    uses: [
        'Ext.ux.event.Recorder',
        'Ext.ux.event.Player'
    ],
    layout: 'fit',
    buttonAlign: 'left',
    eventsToIgnore: {
        mousemove: 1,
        mouseover: 1,
        mouseout: 1
    },
    bodyBorder: false,
    playSpeed: 1,
    initComponent: function() {
        var me = this;
        me.recorder = new Ext.ux.event.Recorder({
            attachTo: me.attachTo,
            listeners: {
                add: me.updateEvents,
                coalesce: me.updateEvents,
                buffer: 200,
                scope: me
            }
        });
        me.recorder.eventsToRecord = Ext.apply({}, me.recorder.eventsToRecord);
        function speed(text, value) {
            return {
                text: text,
                speed: value,
                group: 'speed',
                checked: value == me.playSpeed,
                handler: me.onPlaySpeed,
                scope: me
            };
        }
        me.tbar = [
            {
                text: 'Record',
                xtype: 'splitbutton',
                whenIdle: true,
                handler: me.onRecord,
                scope: me,
                menu: me.makeRecordButtonMenu()
            },
            {
                text: 'Play',
                xtype: 'splitbutton',
                whenIdle: true,
                handler: me.onPlay,
                scope: me,
                menu: [
                    speed('Qarter Speed (0.25x)', 0.25),
                    speed('Half Speed (0.5x)', 0.5),
                    speed('3/4 Speed (0.75x)', 0.75),
                    '-',
                    speed('Recorded Speed (1x)', 1),
                    speed('Double Speed (2x)', 2),
                    speed('Quad Speed (4x)', 4),
                    '-',
                    speed('Full Speed', 1000)
                ]
            },
            {
                text: 'Clear',
                whenIdle: true,
                handler: me.onClear,
                scope: me
            },
            '->',
            {
                text: 'Stop',
                whenActive: true,
                disabled: true,
                handler: me.onStop,
                scope: me
            }
        ];
        var events = me.attachTo && me.attachTo.testEvents;
        me.items = [
            {
                xtype: 'textarea',
                itemId: 'eventView',
                fieldStyle: 'font-family: monospace',
                selectOnFocus: true,
                emptyText: 'Events go here!',
                value: events ? me.stringifyEvents(events) : '',
                scrollToBottom: function() {
                    var inputEl = this.inputEl.dom;
                    inputEl.scrollTop = inputEl.scrollHeight;
                }
            }
        ];
        me.fbar = [
            {
                xtype: 'tbtext',
                text: 'Attached To: ' + (me.attachTo && me.attachTo.location.href)
            }
        ];
        me.callParent();
    },
    makeRecordButtonMenu: function() {
        var ret = [],
            subs = {},
            eventsToRec = this.recorder.eventsToRecord,
            ignoredEvents = this.eventsToIgnore;
        Ext.Object.each(eventsToRec, function(name, value) {
            var sub = subs[value.kind];
            if (!sub) {
                subs[value.kind] = sub = [];
                ret.push({
                    text: value.kind,
                    menu: sub
                });
            }
            sub.push({
                text: name,
                checked: true,
                handler: function(menuItem) {
                    if (menuItem.checked) {
                        eventsToRec[name] = value;
                    } else {
                        delete eventsToRec[name];
                    }
                }
            });
            if (ignoredEvents[name]) {
                sub[sub.length - 1].checked = false;
                Ext.Function.defer(function() {
                    delete eventsToRec[name];
                }, 1);
            }
        });
        function less(lhs, rhs) {
            return (lhs.text < rhs.text) ? -1 : ((rhs.text < lhs.text) ? 1 : 0);
        }
        ret.sort(less);
        Ext.Array.each(ret, function(sub) {
            sub.menu.sort(less);
        });
        return ret;
    },
    getEventView: function() {
        return this.down('#eventView');
    },
    onClear: function() {
        var view = this.getEventView();
        view.setValue('');
    },
    onPlay: function() {
        var me = this,
            view = me.getEventView(),
            events = view.getValue();
        if (events) {
            events = Ext.decode(events);
            if (events.length) {
                me.player = Ext.create('Ext.ux.event.Player', {
                    attachTo: window.opener,
                    eventQueue: events,
                    speed: me.playSpeed,
                    listeners: {
                        stop: me.onPlayStop,
                        scope: me
                    }
                });
                me.player.start();
                me.syncBtnUI();
            }
        }
    },
    onPlayStop: function() {
        this.player = null;
        this.syncBtnUI();
    },
    onPlaySpeed: function(menuitem) {
        this.playSpeed = menuitem.speed;
    },
    onRecord: function() {
        this.recorder.start();
        this.syncBtnUI();
    },
    onStop: function() {
        var me = this;
        if (me.player) {
            me.player.stop();
            me.player = null;
        } else {
            me.recorder.stop();
        }
        me.syncBtnUI();
        me.updateEvents();
    },
    syncBtnUI: function() {
        var me = this,
            idle = !me.player && !me.recorder.active;
        Ext.each(me.query('[whenIdle]'), function(btn) {
            btn.setDisabled(!idle);
        });
        Ext.each(me.query('[whenActive]'), function(btn) {
            btn.setDisabled(idle);
        });
        var view = me.getEventView();
        view.setReadOnly(!idle);
    },
    stringifyEvents: function(events) {
        var line,
            lines = [];
        Ext.each(events, function(ev) {
            line = [];
            Ext.Object.each(ev, function(name, value) {
                if (line.length) {
                    line.push(', ');
                } else {
                    line.push('  { ');
                }
                line.push(name, ': ');
                line.push(Ext.encode(value));
            });
            line.push(' }');
            lines.push(line.join(''));
        });
        return '[\n' + lines.join(',\n') + '\n]';
    },
    updateEvents: function() {
        var me = this,
            text = me.stringifyEvents(me.recorder.getRecordedEvents()),
            view = me.getEventView();
        view.setValue(text);
        view.scrollToBottom();
    }
});

/**
 * A control that allows selection of multiple items in a list.
 */
Ext.define('Ext.ux.form.MultiSelect', {
    extend: 'Ext.form.FieldContainer',
    mixins: [
        'Ext.util.StoreHolder',
        'Ext.form.field.Field'
    ],
    alternateClassName: 'Ext.ux.Multiselect',
    alias: [
        'widget.multiselectfield',
        'widget.multiselect'
    ],
    requires: [
        'Ext.panel.Panel',
        'Ext.view.BoundList',
        'Ext.layout.container.Fit'
    ],
    uses: [
        'Ext.view.DragZone',
        'Ext.view.DropZone'
    ],
    layout: 'anchor',
    /**
     * @cfg {String} [dragGroup=""] The ddgroup name for the MultiSelect DragZone.
     */
    /**
     * @cfg {String} [dropGroup=""] The ddgroup name for the MultiSelect DropZone.
     */
    /**
     * @cfg {String} [title=""] A title for the underlying panel.
     */
    /**
     * @cfg {Boolean} [ddReorder=false] Whether the items in the MultiSelect list are drag/drop reorderable.
     */
    ddReorder: false,
    /**
     * @cfg {Object/Array} tbar An optional toolbar to be inserted at the top of the control's selection list.
     * This can be a {@link Ext.toolbar.Toolbar} object, a toolbar config, or an array of buttons/button configs
     * to be added to the toolbar. See {@link Ext.panel.Panel#tbar}.
     */
    /**
     * @cfg {String} [appendOnly=false] `true` if the list should only allow append drops when drag/drop is enabled.
     * This is useful for lists which are sorted.
     */
    appendOnly: false,
    /**
     * @cfg {String} [displayField="text"] Name of the desired display field in the dataset.
     */
    displayField: 'text',
    /**
     * @cfg {String} [valueField="text"] Name of the desired value field in the dataset.
     */
    /**
     * @cfg {Boolean} [allowBlank=true] `false` to require at least one item in the list to be selected, `true` to allow no
     * selection.
     */
    allowBlank: true,
    /**
     * @cfg {Number} [minSelections=0] Minimum number of selections allowed.
     */
    minSelections: 0,
    /**
     * @cfg {Number} [maxSelections=Number.MAX_VALUE] Maximum number of selections allowed.
     */
    maxSelections: Number.MAX_VALUE,
    /**
     * @cfg {String} [blankText="This field is required"] Default text displayed when the control contains no items.
     */
    blankText: 'This field is required',
    /**
     * @cfg {String} [minSelectionsText="Minimum {0}item(s) required"] 
     * Validation message displayed when {@link #minSelections} is not met. 
     * The {0} token will be replaced by the value of {@link #minSelections}.
     */
    minSelectionsText: 'Minimum {0} item(s) required',
    /**
     * @cfg {String} [maxSelectionsText="Maximum {0}item(s) allowed"] 
     * Validation message displayed when {@link #maxSelections} is not met
     * The {0} token will be replaced by the value of {@link #maxSelections}.
     */
    maxSelectionsText: 'Maximum {0} item(s) required',
    /**
     * @cfg {String} [delimiter=","] The string used to delimit the selected values when {@link #getSubmitValue submitting}
     * the field as part of a form. If you wish to have the selected values submitted as separate
     * parameters rather than a single delimited parameter, set this to `null`.
     */
    delimiter: ',',
    /**
     * @cfg {String} [dragText="{0} Item{1}"] The text to show while dragging items.
     * {0} will be replaced by the number of items. {1} will be replaced by the plural
     * form if there is more than 1 item.
     */
    dragText: '{0} Item{1}',
    /**
     * @cfg {Ext.data.Store/Array} store The data source to which this MultiSelect is bound (defaults to `undefined`).
     * Acceptable values for this property are:
     * <div class="mdetail-params"><ul>
     * <li><b>any {@link Ext.data.Store Store} subclass</b></li>
     * <li><b>an Array</b> : Arrays will be converted to a {@link Ext.data.ArrayStore} internally.
     * <div class="mdetail-params"><ul>
     * <li><b>1-dimensional array</b> : (e.g., <tt>['Foo','Bar']</tt>)<div class="sub-desc">
     * A 1-dimensional array will automatically be expanded (each array item will be the combo
     * {@link #valueField value} and {@link #displayField text})</div></li>
     * <li><b>2-dimensional array</b> : (e.g., <tt>[['f','Foo'],['b','Bar']]</tt>)<div class="sub-desc">
     * For a multi-dimensional array, the value in index 0 of each item will be assumed to be the combo
     * {@link #valueField value}, while the value at index 1 is assumed to be the combo {@link #displayField text}.
     * </div></li></ul></div></li></ul></div>
     */
    ignoreSelectChange: 0,
    /**
     * @cfg {Object} listConfig
     * An optional set of configuration properties that will be passed to the {@link Ext.view.BoundList}'s constructor.
     * Any configuration that is valid for BoundList can be included.
     */
    initComponent: function() {
        var me = this;
        me.items = me.setupItems();
        me.bindStore(me.store, true);
        if (me.store.autoCreated) {
            me.valueField = me.displayField = 'field1';
            if (!me.store.expanded) {
                me.displayField = 'field2';
            }
        }
        if (!Ext.isDefined(me.valueField)) {
            me.valueField = me.displayField;
        }
        me.callParent();
        me.initField();
    },
    setupItems: function() {
        var me = this;
        me.boundList = Ext.create('Ext.view.BoundList', Ext.apply({
            anchor: 'none 100%',
            border: 1,
            multiSelect: true,
            store: me.store,
            displayField: me.displayField,
            disabled: me.disabled
        }, me.listConfig));
        me.boundList.getSelectionModel().on('selectionchange', me.onSelectChange, me);
        // Boundlist expects a reference to its pickerField for when an item is selected (see Boundlist#onItemClick).
        me.boundList.pickerField = me;
        // Only need to wrap the BoundList in a Panel if we have a title.
        if (!me.title) {
            return me.boundList;
        }
        // Wrap to add a title
        me.boundList.border = false;
        return {
            border: true,
            anchor: 'none 100%',
            layout: 'anchor',
            title: me.title,
            tbar: me.tbar,
            items: me.boundList
        };
    },
    onSelectChange: function(selModel, selections) {
        if (!this.ignoreSelectChange) {
            this.setValue(selections);
        }
    },
    getSelected: function() {
        return this.boundList.getSelectionModel().getSelection();
    },
    // compare array values
    isEqual: function(v1, v2) {
        var fromArray = Ext.Array.from,
            i = 0,
            len;
        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;
        if (len !== v2.length) {
            return false;
        }
        for (; i < len; i++) {
            if (v2[i] !== v1[i]) {
                return false;
            }
        }
        return true;
    },
    afterRender: function() {
        var me = this,
            records;
        me.callParent();
        if (me.selectOnRender) {
            records = me.getRecordsForValue(me.value);
            if (records.length) {
                ++me.ignoreSelectChange;
                me.boundList.getSelectionModel().select(records);
                --me.ignoreSelectChange;
            }
            delete me.toSelect;
        }
        if (me.ddReorder && !me.dragGroup && !me.dropGroup) {
            me.dragGroup = me.dropGroup = 'MultiselectDD-' + Ext.id();
        }
        if (me.draggable || me.dragGroup) {
            me.dragZone = Ext.create('Ext.view.DragZone', {
                view: me.boundList,
                ddGroup: me.dragGroup,
                dragText: me.dragText
            });
        }
        if (me.droppable || me.dropGroup) {
            me.dropZone = Ext.create('Ext.view.DropZone', {
                view: me.boundList,
                ddGroup: me.dropGroup,
                handleNodeDrop: function(data, dropRecord, position) {
                    var view = this.view,
                        store = view.getStore(),
                        records = data.records,
                        index;
                    // remove the Models from the source Store
                    data.view.store.remove(records);
                    index = store.indexOf(dropRecord);
                    if (position === 'after') {
                        index++;
                    }
                    store.insert(index, records);
                    view.getSelectionModel().select(records);
                    me.fireEvent('drop', me, records);
                }
            });
        }
    },
    isValid: function() {
        var me = this,
            disabled = me.disabled,
            validate = me.forceValidation || !disabled;
        return validate ? me.validateValue(me.value) : disabled;
    },
    validateValue: function(value) {
        var me = this,
            errors = me.getErrors(value),
            isValid = Ext.isEmpty(errors);
        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            } else {
                me.markInvalid(errors);
            }
        }
        return isValid;
    },
    markInvalid: function(errors) {
        // Save the message and fire the 'invalid' event
        var me = this,
            oldMsg = me.getActiveError();
        me.setActiveErrors(Ext.Array.from(errors));
        if (oldMsg !== me.getActiveError()) {
            me.updateLayout();
        }
    },
    /**
     * Clear any invalid styles/messages for this field.
     *
     * __Note:__ this method does not cause the Field's {@link #validate} or {@link #isValid} methods to return `true`
     * if the value does not _pass_ validation. So simply clearing a field's errors will not necessarily allow
     * submission of forms submitted with the {@link Ext.form.action.Submit#clientValidation} option set.
     */
    clearInvalid: function() {
        // Clear the message and fire the 'valid' event
        var me = this,
            hadError = me.hasActiveError();
        me.unsetActiveError();
        if (hadError) {
            me.updateLayout();
        }
    },
    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            }
        }
        return data;
    },
    /**
     * Returns the value that would be included in a standard form submit for this field.
     *
     * @return {String} The value to be submitted, or `null`.
     */
    getSubmitValue: function() {
        var me = this,
            delimiter = me.delimiter,
            val = me.getValue();
        return Ext.isString(delimiter) ? val.join(delimiter) : val;
    },
    getValue: function() {
        return this.value || [];
    },
    getRecordsForValue: function(value) {
        var me = this,
            records = [],
            all = me.store.getRange(),
            valueField = me.valueField,
            i = 0,
            allLen = all.length,
            rec, j, valueLen;
        for (valueLen = value.length; i < valueLen; ++i) {
            for (j = 0; j < allLen; ++j) {
                rec = all[j];
                if (rec.get(valueField) == value[i]) {
                    records.push(rec);
                }
            }
        }
        return records;
    },
    setupValue: function(value) {
        var delimiter = this.delimiter,
            valueField = this.valueField,
            i = 0,
            out, len, item;
        if (Ext.isDefined(value)) {
            if (delimiter && Ext.isString(value)) {
                value = value.split(delimiter);
            } else if (!Ext.isArray(value)) {
                value = [
                    value
                ];
            }
            for (len = value.length; i < len; ++i) {
                item = value[i];
                if (item && item.isModel) {
                    value[i] = item.get(valueField);
                }
            }
            out = Ext.Array.unique(value);
        } else {
            out = [];
        }
        return out;
    },
    setValue: function(value) {
        var me = this,
            selModel = me.boundList.getSelectionModel(),
            store = me.store;
        // Store not loaded yet - we cannot set the value
        if (!store.getCount()) {
            store.on({
                load: Ext.Function.bind(me.setValue, me, [
                    value
                ]),
                single: true
            });
            return;
        }
        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);
        if (me.rendered) {
            ++me.ignoreSelectChange;
            selModel.deselectAll();
            if (value.length) {
                selModel.select(me.getRecordsForValue(value));
            }
            --me.ignoreSelectChange;
        } else {
            me.selectOnRender = true;
        }
    },
    clearValue: function() {
        this.setValue([]);
    },
    onEnable: function() {
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.enable();
        }
    },
    onDisable: function() {
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.disable();
        }
    },
    getErrors: function(value) {
        var me = this,
            format = Ext.String.format,
            errors = [],
            numSelected;
        value = Ext.Array.from(value || me.getValue());
        numSelected = value.length;
        if (!me.allowBlank && numSelected < 1) {
            errors.push(me.blankText);
        }
        if (numSelected < me.minSelections) {
            errors.push(format(me.minSelectionsText, me.minSelections));
        }
        if (numSelected > me.maxSelections) {
            errors.push(format(me.maxSelectionsText, me.maxSelections));
        }
        return errors;
    },
    onDestroy: function() {
        var me = this;
        me.bindStore(null);
        Ext.destroy(me.dragZone, me.dropZone);
        me.callParent();
    },
    onBindStore: function(store) {
        var boundList = this.boundList;
        if (boundList) {
            boundList.bindStore(store);
        }
    }
});

/** */
Ext.define('Ext.aria.ux.form.MultiSelect', {
    override: 'Ext.ux.form.MultiSelect',
    requires: [
        'Ext.view.BoundListKeyNav'
    ],
    /**
     * @cfg {Number} [pageSize=10] The number of items to advance on pageUp and pageDown
     */
    pageSize: 10,
    afterRender: function() {
        var me = this,
            boundList = me.boundList;
        me.callParent();
        if (boundList) {
            boundList.pageSize = me.pageSize;
            me.keyNav = new Ext.view.BoundListKeyNav(boundList.el, {
                boundList: boundList,
                // The View takes care of these
                up: Ext.emptyFn,
                down: Ext.emptyFn,
                pageUp: function() {
                    var me = this,
                        boundList = me.boundList,
                        store = boundList.getStore(),
                        selModel = boundList.getSelectionModel(),
                        pageSize = boundList.pageSize,
                        selection, oldItemIdx, newItemIdx;
                    selection = selModel.getSelection()[0];
                    oldItemIdx = selection ? store.indexOf(selection) : -1;
                    newItemIdx = oldItemIdx < 0 ? 0 : oldItemIdx - pageSize;
                    selModel.select(newItemIdx < 0 ? 0 : newItemIdx);
                },
                pageDown: function() {
                    var me = this,
                        boundList = me.boundList,
                        pageSize = boundList.pageSize,
                        store = boundList.store,
                        selModel = boundList.getSelectionModel(),
                        selection, oldItemIdx, newItemIdx, lastIdx;
                    selection = selModel.getSelection()[0];
                    lastIdx = store.getCount() - 1;
                    oldItemIdx = selection ? store.indexOf(selection) : -1;
                    newItemIdx = oldItemIdx < 0 ? pageSize : oldItemIdx + pageSize;
                    selModel.select(newItemIdx > lastIdx ? lastIdx : newItemIdx);
                },
                home: function() {
                    this.boundList.getSelectionModel().select(0);
                },
                end: function() {
                    var boundList = this.boundList;
                    boundList.getSelectionModel().select(boundList.store.getCount() - 1);
                }
            });
        }
    },
    destroy: function() {
        var me = this,
            keyNav = me.keyNav;
        if (keyNav) {
            keyNav.destroy();
        }
        me.callParent();
    }
});

/*
 * Note that this control will most likely remain as an example, and not as a core Ext form
 * control.  However, the API will be changing in a future release and so should not yet be
 * treated as a final, stable API at this time.
 */
/**
 * A control that allows selection of between two Ext.ux.form.MultiSelect controls.
 */
Ext.define('Ext.ux.form.ItemSelector', {
    extend: 'Ext.ux.form.MultiSelect',
    alias: [
        'widget.itemselectorfield',
        'widget.itemselector'
    ],
    alternateClassName: [
        'Ext.ux.ItemSelector'
    ],
    requires: [
        'Ext.button.Button',
        'Ext.ux.form.MultiSelect'
    ],
    /**
     * @cfg {Boolean} [hideNavIcons=false] True to hide the navigation icons
     */
    hideNavIcons: false,
    /**
     * @cfg {Array} buttons Defines the set of buttons that should be displayed in between the ItemSelector
     * fields. Defaults to <tt>['top', 'up', 'add', 'remove', 'down', 'bottom']</tt>. These names are used
     * to build the button CSS class names, and to look up the button text labels in {@link #buttonsText}.
     * This can be overridden with a custom Array to change which buttons are displayed or their order.
     */
    buttons: [
        'top',
        'up',
        'add',
        'remove',
        'down',
        'bottom'
    ],
    /**
     * @cfg {Object} buttonsText The tooltips for the {@link #buttons}.
     * Labels for buttons.
     */
    buttonsText: {
        top: "Move to Top",
        up: "Move Up",
        add: "Add to Selected",
        remove: "Remove from Selected",
        down: "Move Down",
        bottom: "Move to Bottom"
    },
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    initComponent: function() {
        var me = this;
        me.ddGroup = me.id + '-dd';
        me.callParent();
        // bindStore must be called after the fromField has been created because
        // it copies records from our configured Store into the fromField's Store
        me.bindStore(me.store);
    },
    createList: function(title) {
        var me = this;
        return Ext.create('Ext.ux.form.MultiSelect', {
            // We don't want the multiselects themselves to act like fields,
            // so override these methods to prevent them from including
            // any of their values
            submitValue: false,
            getSubmitData: function() {
                return null;
            },
            getModelData: function() {
                return null;
            },
            flex: 1,
            dragGroup: me.ddGroup,
            dropGroup: me.ddGroup,
            title: title,
            store: {
                model: me.store.model,
                data: []
            },
            displayField: me.displayField,
            valueField: me.valueField,
            disabled: me.disabled,
            listeners: {
                boundList: {
                    scope: me,
                    itemdblclick: me.onItemDblClick,
                    drop: me.syncValue
                }
            }
        });
    },
    setupItems: function() {
        var me = this;
        me.fromField = me.createList(me.fromTitle);
        me.toField = me.createList(me.toTitle);
        return [
            me.fromField,
            {
                xtype: 'container',
                margin: '0 4',
                layout: {
                    type: 'vbox',
                    pack: 'center'
                },
                items: me.createButtons()
            },
            me.toField
        ];
    },
    createButtons: function() {
        var me = this,
            buttons = [];
        if (!me.hideNavIcons) {
            Ext.Array.forEach(me.buttons, function(name) {
                buttons.push({
                    xtype: 'button',
                    tooltip: me.buttonsText[name],
                    handler: me['on' + Ext.String.capitalize(name) + 'BtnClick'],
                    cls: Ext.baseCSSPrefix + 'form-itemselector-btn',
                    iconCls: Ext.baseCSSPrefix + 'form-itemselector-' + name,
                    navBtn: true,
                    scope: me,
                    margin: '4 0 0 0'
                });
            });
        }
        return buttons;
    },
    /**
     * Get the selected records from the specified list.
     * 
     * Records will be returned *in store order*, not in order of selection.
     * @param {Ext.view.BoundList} list The list to read selections from.
     * @return {Ext.data.Model[]} The selected records in store order.
     * 
     */
    getSelections: function(list) {
        var store = list.getStore();
        return Ext.Array.sort(list.getSelectionModel().getSelection(), function(a, b) {
            a = store.indexOf(a);
            b = store.indexOf(b);
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
    },
    onTopBtnClick: function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);
        store.suspendEvents();
        store.remove(selected, true);
        store.insert(0, selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },
    onBottomBtnClick: function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);
        store.suspendEvents();
        store.remove(selected, true);
        store.add(selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },
    onUpBtnClick: function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = 0,
            len = selected.length,
            index = 0;
        // Move each selection up by one place if possible
        store.suspendEvents();
        for (; i < len; ++i , index++) {
            rec = selected[i];
            index = Math.max(index, store.indexOf(rec) - 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },
    onDownBtnClick: function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = selected.length - 1,
            index = store.getCount() - 1;
        // Move each selection down by one place if possible
        store.suspendEvents();
        for (; i > -1; --i , index--) {
            rec = selected[i];
            index = Math.min(index, store.indexOf(rec) + 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },
    onAddBtnClick: function() {
        var me = this,
            selected = me.getSelections(me.fromField.boundList);
        me.moveRec(true, selected);
        me.toField.boundList.getSelectionModel().select(selected);
    },
    onRemoveBtnClick: function() {
        var me = this,
            selected = me.getSelections(me.toField.boundList);
        me.moveRec(false, selected);
        me.fromField.boundList.getSelectionModel().select(selected);
    },
    moveRec: function(add, recs) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField,
            fromStore = add ? fromField.store : toField.store,
            toStore = add ? toField.store : fromField.store;
        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.remove(recs);
        toStore.add(recs);
        fromStore.resumeEvents();
        toStore.resumeEvents();
        fromField.boundList.refresh();
        toField.boundList.refresh();
        me.syncValue();
    },
    // Synchronizes the submit value with the current state of the toStore
    syncValue: function() {
        var me = this;
        me.mixins.field.setValue.call(me, me.setupValue(me.toField.store.getRange()));
    },
    onItemDblClick: function(view, rec) {
        this.moveRec(view === this.fromField.boundList, rec);
    },
    setValue: function(value) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField,
            fromStore = fromField.store,
            toStore = toField.store,
            selected;
        // Wait for from store to be loaded
        if (!me.fromStorePopulated) {
            me.fromField.store.on({
                load: Ext.Function.bind(me.setValue, me, [
                    value
                ]),
                single: true
            });
            return;
        }
        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);
        selected = me.getRecordsForValue(value);
        // Clear both left and right Stores.
        // Both stores must not fire events during this process.
        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.removeAll();
        toStore.removeAll();
        // Reset fromStore
        me.populateFromStore(me.store);
        // Copy selection across to toStore
        Ext.Array.forEach(selected, function(rec) {
            // In the from store, move it over
            if (fromStore.indexOf(rec) > -1) {
                fromStore.remove(rec);
            }
            toStore.add(rec);
        });
        // Stores may now fire events
        fromStore.resumeEvents();
        toStore.resumeEvents();
        // Refresh both sides and then update the app layout
        Ext.suspendLayouts();
        fromField.boundList.refresh();
        toField.boundList.refresh();
        Ext.resumeLayouts(true);
    },
    onBindStore: function(store, initial) {
        var me = this;
        if (me.fromField) {
            me.fromField.store.removeAll();
            me.toField.store.removeAll();
            // Add everything to the from field as soon as the Store is loaded
            if (store.getCount()) {
                me.populateFromStore(store);
            } else {
                me.store.on('load', me.populateFromStore, me);
            }
        }
    },
    populateFromStore: function(store) {
        var fromStore = this.fromField.store;
        // Flag set when the fromStore has been loaded
        this.fromStorePopulated = true;
        fromStore.add(store.getRange());
        // setValue waits for the from Store to be loaded
        fromStore.fireEvent('load', fromStore);
    },
    onEnable: function() {
        var me = this;
        me.callParent();
        me.fromField.enable();
        me.toField.enable();
        Ext.Array.forEach(me.query('[navBtn]'), function(btn) {
            btn.enable();
        });
    },
    onDisable: function() {
        var me = this;
        me.callParent();
        me.fromField.disable();
        me.toField.disable();
        Ext.Array.forEach(me.query('[navBtn]'), function(btn) {
            btn.disable();
        });
    },
    onDestroy: function() {
        this.bindStore(null);
        this.callParent();
    }
});

Ext.define('Ext.ux.form.SearchField', {
    extend: 'Ext.form.field.Text',
    alias: 'widget.searchfield',
    triggers: {
        clear: {
            weight: 0,
            cls: Ext.baseCSSPrefix + 'form-clear-trigger',
            hidden: true,
            handler: 'onClearClick',
            scope: 'this'
        },
        search: {
            weight: 1,
            cls: Ext.baseCSSPrefix + 'form-search-trigger',
            handler: 'onSearchClick',
            scope: 'this'
        }
    },
    hasSearch: false,
    paramName: 'query',
    initComponent: function() {
        var me = this,
            store = me.store,
            proxy;
        me.callParent(arguments);
        me.on('specialkey', function(f, e) {
            if (e.getKey() == e.ENTER) {
                me.onSearchClick();
            }
        });
        if (!store || !store.isStore) {
            store = me.store = Ext.data.StoreManager.lookup(store);
        }
        // We're going to use filtering
        store.setRemoteFilter(true);
        // Set up the proxy to encode the filter in the simplest way as a name/value pair
        proxy = me.store.getProxy();
        proxy.setFilterParam(me.paramName);
        proxy.encodeFilters = function(filters) {
            return filters[0].getValue();
        };
    },
    onClearClick: function() {
        var me = this,
            activeFilter = me.activeFilter;
        if (activeFilter) {
            me.setValue('');
            me.store.getFilters().remove(activeFilter);
            me.activeFilter = null;
            me.getTrigger('clear').hide();
            me.updateLayout();
        }
    },
    onSearchClick: function() {
        var me = this,
            value = me.getValue();
        if (value.length > 0) {
            // Param name is ignored here since we use custom encoding in the proxy.
            // id is used by the Store to replace any previous filter
            me.activeFilter = new Ext.util.Filter({
                property: me.paramName,
                value: value
            });
            me.store.getFilters().add(me.activeFilter);
            me.getTrigger('clear').show();
            me.updateLayout();
        }
    }
});

/**
 * A small grid nested within a parent grid's row. 
 *
 * See the [Kitchen Sink](http://dev.sencha.com/extjs/5.0.1/examples/kitchensink/#customer-grid) for example usage.
 */
Ext.define('Ext.ux.grid.SubTable', {
    extend: 'Ext.grid.plugin.RowExpander',
    alias: 'plugin.subtable',
    rowBodyTpl: [
        '<table class="' + Ext.baseCSSPrefix + 'grid-subtable"><tbody>',
        '{%',
        'this.owner.renderTable(out, values);',
        '%}',
        '</tbody></table>'
    ],
    init: function(grid) {
        var me = this,
            columns = me.columns,
            len, i, columnCfg;
        me.callParent(arguments);
        me.columns = [];
        if (columns) {
            for (i = 0 , len = columns.length; i < len; ++i) {
                // Don't register with the component manager, we create them to use
                // their rendering smarts, but don't want to treat them as real components
                columnCfg = Ext.apply({
                    preventRegister: true
                }, columns[i]);
                columnCfg.xtype = columnCfg.xtype || 'gridcolumn';
                me.columns.push(Ext.widget(columnCfg));
            }
        }
    },
    destroy: function() {
        var columns = this.columns,
            len, i;
        if (columns) {
            for (i = 0 , len = columns.length; i < len; ++i) {
                columns[i].destroy();
            }
        }
        this.columns = null;
        this.callParent();
    },
    getRowBodyFeatureData: function(record, idx, rowValues) {
        this.callParent(arguments);
        rowValues.rowBodyCls += ' ' + Ext.baseCSSPrefix + 'grid-subtable-row';
    },
    renderTable: function(out, rowValues) {
        var me = this,
            columns = me.columns,
            numColumns = columns.length,
            associatedRecords = me.getAssociatedRecords(rowValues.record),
            recCount = associatedRecords.length,
            rec, column, i, j, value;
        out.push('<thead>');
        for (j = 0; j < numColumns; j++) {
            out.push('<th class="' + Ext.baseCSSPrefix + 'grid-subtable-header">', columns[j].text, '</th>');
        }
        out.push('</thead>');
        for (i = 0; i < recCount; i++) {
            rec = associatedRecords[i];
            out.push('<tr>');
            for (j = 0; j < numColumns; j++) {
                column = columns[j];
                value = rec.get(column.dataIndex);
                if (column.renderer && column.renderer.call) {
                    value = column.renderer.call(column.scope || me, value, {}, rec);
                }
                out.push('<td class="' + Ext.baseCSSPrefix + 'grid-subtable-cell"');
                if (column.width != null) {
                    out.push(' style="width:' + column.width + 'px"');
                }
                out.push('><div class="' + Ext.baseCSSPrefix + 'grid-cell-inner">', value, '</div></td>');
            }
            out.push('</tr>');
        }
    },
    getRowBodyContentsFn: function(rowBodyTpl) {
        var me = this;
        return function(rowValues) {
            rowBodyTpl.owner = me;
            return rowBodyTpl.applyTemplate(rowValues);
        };
    },
    getAssociatedRecords: function(record) {
        return record[this.association]().getRange();
    }
});

/**
 * A Grid which creates itself from an existing HTML table element.
 */
Ext.define('Ext.ux.grid.TransformGrid', {
    extend: 'Ext.grid.Panel',
    /**
     * Creates the grid from HTML table element.
     * @param {String/HTMLElement/Ext.Element} table The table element from which this grid will be created -
     * The table MUST have some type of size defined for the grid to fill. The container will be
     * automatically set to position relative if it isn't already.
     * @param {Object} [config] A config object that sets properties on this grid and has two additional (optional)
     * properties: fields and columns which allow for customizing data fields and columns for this grid.
     */
    constructor: function(table, config) {
        config = Ext.apply({}, config);
        table = this.table = Ext.get(table);
        var configFields = config.fields || [],
            configColumns = config.columns || [],
            fields = [],
            cols = [],
            headers = table.query("thead th"),
            i = 0,
            len = headers.length,
            data = table.dom,
            width, height, store, col, text, name;
        for (; i < len; ++i) {
            col = headers[i];
            text = col.innerHTML;
            name = 'tcol-' + i;
            fields.push(Ext.applyIf(configFields[i] || {}, {
                name: name,
                mapping: 'td:nth(' + (i + 1) + ')/@innerHTML'
            }));
            cols.push(Ext.applyIf(configColumns[i] || {}, {
                text: text,
                dataIndex: name,
                width: col.offsetWidth,
                tooltip: col.title,
                sortable: true
            }));
        }
        if (config.width) {
            width = config.width;
        } else {
            width = table.getWidth() + 1;
        }
        if (config.height) {
            height = config.height;
        }
        Ext.applyIf(config, {
            store: {
                data: data,
                fields: fields,
                proxy: {
                    type: 'memory',
                    reader: {
                        record: 'tbody tr',
                        type: 'xml'
                    }
                }
            },
            columns: cols,
            width: width,
            height: height
        });
        this.callParent([
            config
        ]);
        if (config.remove !== false) {
            // Don't use table.remove() as that destroys the row/cell data in the table in
            // IE6-7 so it cannot be read by the data reader.
            data.parentNode.removeChild(data);
        }
    },
    onDestroy: function() {
        this.callParent();
        this.table.remove();
        delete this.table;
    }
});

/**
 * A {@link Ext.ux.statusbar.StatusBar} plugin that provides automatic error
 * notification when the associated form contains validation errors.
 */
Ext.define('Ext.ux.statusbar.ValidationStatus', {
    extend: 'Ext.Component',
    requires: [
        'Ext.util.MixedCollection'
    ],
    /**
     * @cfg {String} errorIconCls
     * The {@link Ext.ux.statusbar.StatusBar#iconCls iconCls} value to be applied
     * to the status message when there is a validation error.
     */
    errorIconCls: 'x-status-error',
    /**
     * @cfg {String} errorListCls
     * The css class to be used for the error list when there are validation errors.
     */
    errorListCls: 'x-status-error-list',
    /**
     * @cfg {String} validIconCls
     * The {@link Ext.ux.statusbar.StatusBar#iconCls iconCls} value to be applied
     * to the status message when the form validates.
     */
    validIconCls: 'x-status-valid',
    /**
     * @cfg {String} showText
     * The {@link Ext.ux.statusbar.StatusBar#text text} value to be applied when
     * there is a form validation error.
     */
    showText: 'The form has errors (click for details...)',
    /**
     * @cfg {String} hideText
     * The {@link Ext.ux.statusbar.StatusBar#text text} value to display when
     * the error list is displayed.
     */
    hideText: 'Click again to hide the error list',
    /**
     * @cfg {String} submitText
     * The {@link Ext.ux.statusbar.StatusBar#text text} value to be applied when
     * the form is being submitted.
     */
    submitText: 'Saving...',
    // private
    init: function(sb) {
        var me = this;
        me.statusBar = sb;
        sb.on({
            single: true,
            scope: me,
            render: me.onStatusbarRender,
            beforedestroy: me.destroy
        });
        sb.on({
            click: {
                element: 'el',
                fn: me.onStatusClick,
                scope: me,
                buffer: 200
            }
        });
    },
    onStatusbarRender: function(sb) {
        var me = this,
            startMonitor = function() {
                me.monitor = true;
            };
        me.monitor = true;
        me.errors = Ext.create('Ext.util.MixedCollection');
        me.listAlign = (sb.statusAlign === 'right' ? 'br-tr?' : 'bl-tl?');
        if (me.form) {
            me.formPanel = Ext.getCmp(me.form);
            me.basicForm = me.formPanel.getForm();
            me.startMonitoring();
            me.basicForm.on('beforeaction', function(f, action) {
                if (action.type === 'submit') {
                    // Ignore monitoring while submitting otherwise the field validation
                    // events cause the status message to reset too early
                    me.monitor = false;
                }
            });
            me.basicForm.on('actioncomplete', startMonitor);
            me.basicForm.on('actionfailed', startMonitor);
        }
    },
    // private
    startMonitoring: function() {
        this.basicForm.getFields().each(function(f) {
            f.on('validitychange', this.onFieldValidation, this);
        }, this);
    },
    // private
    stopMonitoring: function() {
        this.basicForm.getFields().each(function(f) {
            f.un('validitychange', this.onFieldValidation, this);
        }, this);
    },
    // private
    onDestroy: function() {
        this.stopMonitoring();
        this.statusBar.statusEl.un('click', this.onStatusClick, this);
        this.callParent(arguments);
    },
    // private
    onFieldValidation: function(f, isValid) {
        var me = this,
            msg;
        if (!me.monitor) {
            return false;
        }
        msg = f.getErrors()[0];
        if (msg) {
            me.errors.add(f.id, {
                field: f,
                msg: msg
            });
        } else {
            me.errors.removeAtKey(f.id);
        }
        this.updateErrorList();
        if (me.errors.getCount() > 0) {
            if (me.statusBar.getText() !== me.showText) {
                me.statusBar.setStatus({
                    text: me.showText,
                    iconCls: me.errorIconCls
                });
            }
        } else {
            me.statusBar.clearStatus().setIcon(me.validIconCls);
        }
    },
    // private
    updateErrorList: function() {
        var me = this,
            msg,
            msgEl = me.getMsgEl();
        if (me.errors.getCount() > 0) {
            msg = [
                '<ul>'
            ];
            this.errors.each(function(err) {
                msg.push('<li id="x-err-', err.field.id, '"><a href="#">', err.msg, '</a></li>');
            });
            msg.push('</ul>');
            msgEl.update(msg.join(''));
        } else {
            msgEl.update('');
        }
        // reset msgEl size
        msgEl.setSize('auto', 'auto');
    },
    // private
    getMsgEl: function() {
        var me = this,
            msgEl = me.msgEl,
            t;
        if (!msgEl) {
            msgEl = me.msgEl = Ext.DomHelper.append(Ext.getBody(), {
                cls: me.errorListCls
            }, true);
            msgEl.hide();
            msgEl.on('click', function(e) {
                t = e.getTarget('li', 10, true);
                if (t) {
                    Ext.getCmp(t.id.split('x-err-')[1]).focus();
                    me.hideErrors();
                }
            }, null, {
                stopEvent: true
            });
        }
        // prevent anchor click navigation
        return msgEl;
    },
    // private
    showErrors: function() {
        var me = this;
        me.updateErrorList();
        me.getMsgEl().alignTo(me.statusBar.getEl(), me.listAlign).slideIn('b', {
            duration: 300,
            easing: 'easeOut'
        });
        me.statusBar.setText(me.hideText);
        me.formPanel.body.on('click', me.hideErrors, me, {
            single: true
        });
    },
    // hide if the user clicks directly into the form
    // private
    hideErrors: function() {
        var el = this.getMsgEl();
        if (el.isVisible()) {
            el.slideOut('b', {
                duration: 300,
                easing: 'easeIn'
            });
            this.statusBar.setText(this.showText);
        }
        this.formPanel.body.un('click', this.hideErrors, this);
    },
    // private
    onStatusClick: function() {
        if (this.getMsgEl().isVisible()) {
            this.hideErrors();
        } else if (this.errors.getCount() > 0) {
            this.showErrors();
        }
    }
});

