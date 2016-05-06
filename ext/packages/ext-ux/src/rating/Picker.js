/**
 * A ratings picker based on `Ext.Widget`.
 *
 *      @example
 *      Ext.create({
 *          xtype: 'rating',
 *          renderTo: Ext.getBody(),
 *          listeners: {
 *              change: function (picker, value) {
 *                 console.log('Rating ' + value);
 *              }
 *          }
 *      });
 */
Ext.define('Ext.ux.rating.Picker', {
    extend: 'Ext.Widget',

    xtype: 'rating',

    focusable: true,

    /*
     * The "cachedConfig" block is basically the same as "config" except that these
     * values are applied specially to the first instance of the class. After processing
     * these configs, the resulting values are stored on the class `prototype` and the
     * template DOM element also reflects these default values.
     */
    cachedConfig: {
        /**
         * @cfg {String} [family]
         * The CSS `font-family` to use for displaying the `{@link #glyphs}`.
         */
        family: 'monospace',

        /**
         * @cfg {String/String[]/Number[]} [glyphs]
         * Either a string containing the two glyph characters, or an array of two strings
         * containing the individual glyph characters or an array of two numbers with the
         * character codes for the individual glyphs.
         *
         * For example:
         *
         *      @example
         *      Ext.create({
         *          xtype: 'rating',
         *          renderTo: Ext.getBody(),
         *          glyphs: [ 9671, 9670 ], // '◇◆',
         *          listeners: {
         *              change: function (picker, value) {
         *                 console.log('Rating ' + value);
         *              }
         *          }
         *      });
         */
        glyphs: '☆★',

        /**
         * @cfg {Number} [minimum=1]
         * The minimum allowed `{@link #value}` (rating).
         */
        minimum: 1,

        /**
         * @cfg {Number} [limit=1]
         * The maximum allowed `{@link #value}` (rating).
         */
        limit: 5,

        /**
         * @cfg {String/Object} [overStyle]
         * Optional styles to apply to the rating glyphs when `{@link #trackOver}` is
         * enabled.
         */
        overStyle: null,

        /**
         * @cfg {Number} [rounding=1]
         * The rounding to apply to values. Common choices are 0.5 (for half-steps) or
         * 0.25 (for quarter steps).
         */
        rounding: 1,

        /**
         * @cfg {String} [scale="125%"]
         * The CSS `font-size` to apply to the glyphs. This value defaults to 125% because
         * glyphs in the stock font tend to be too small. When using specially designed
         * "icon fonts" you may want to set this to 100%.
         */
        scale: '125%',

        /**
         * @cfg {String/Object} [selectedStyle]
         * Optional styles to apply to the rating value glyphs.
         */
        selectedStyle: null,

        /**
         * @cfg {String/Object} [style]
         * Optional styles to apply to the top-level element.
         */
        style: null,

        /**
         * @cfg {Object/String/String[]/Ext.XTemplate/Function} tooltip
         * A template or a function that produces the tooltip text. The `Object`, `String`
         * and `String[]` forms are converted to an `Ext.XTemplate`. If a function is given,
         * it will be called with an object parameter and should return the tooltip text.
         * The object contains these properties:
         *
         *   - component: The rating component requesting the tooltip.
         *   - tracking: The current value under the mouse cursor.
         *   - trackOver: The value of the `{@link #trackOver}` config.
         *   - value: The current value.
         *
         * Templates can use these properties to generate the proper text.
         */
        tooltip: null,

        /**
         * @cfg {Boolean} [trackOver=true]
         * Determines if mouse movements should temporarily update the displayed value.
         * The actual `value` is only updated on `click` but this rather acts as the
         * "preview" of the value prior to click.
         */
        trackOver: true,

        /**
         * @cfg {Number} value
         * The rating value. This value is bounded by `minimum` and `limit` and is also
         * adjusted by the `rounding`.
         */
        value: null,

        //---------------------------------------------------------------------
        // Private configs

        /**
         * @cfg {String} tooltipText
         * The current tooltip text. This value is set into the DOM by the updater (hence
         * only when it changes). This is intended for use by the tip manager
         * (`{@link Ext.tip.QuickTipManager}`). Developers should never need to set this
         * config since it is handled by virtue of setting other configs (such as the
         * {@link #tooltip} or the {@link #value}.).
         * @private
         */
        tooltipText: null,

        /**
         * @cfg {Number} trackingValue
         * This config is used to when `trackOver` is `true` and represents the tracked
         * value. This config is maintained by our `mousemove` handler. This should not
         * need to be set directly by user code.
         * @private
         */
        trackingValue: null
    },

    config: {
        /**
         * @cfg {Boolean/Object} [animate=false]
         * Specifies an animation to use when changing the `{@link #value}`. When setting
         * this config, it is probably best to set `{@link #trackOver}` to `false`.
         */
        animate: null
    },

    // This object describes our element tree from the root.
    element: {
        cls: 'u' + Ext.baseCSSPrefix + 'rating-picker',

        // Since we are replacing the entire "element" tree, we have to assign this
        // "reference" as would our base class.
        reference: 'element',

        children: [{
            reference: 'innerEl',
            cls: 'u' + Ext.baseCSSPrefix + 'rating-picker-inner',
            listeners: {
                click: 'onClick',
                mousemove: 'onMouseMove',
                mouseenter: 'onMouseEnter',
                mouseleave: 'onMouseLeave'
            },

            children: [{
                reference: 'valueEl',
                cls: 'u' + Ext.baseCSSPrefix + 'rating-picker-value'
            },{
                reference: 'trackerEl',
                cls: 'u' + Ext.baseCSSPrefix + 'rating-picker-tracker'
            }]
        }]
    },

    // Tell the Binding system to default to our "value" config.
    defaultBindProperty: 'value',

    // Enable two-way data binding for the "value" config.
    twoWayBindable: 'value',

    overCls: 'u' + Ext.baseCSSPrefix + 'rating-picker-over',

    trackOverCls: 'u' + Ext.baseCSSPrefix + 'rating-picker-track-over',

    //-------------------------------------------------------------------------
    // Config Appliers

    applyGlyphs: function (value) {
        if (typeof value === 'string') {
            //<debug>
            if (value.length !== 2) {
                Ext.Error.raise('Expected 2 characters for "glyphs" not "' + value +'".');
            }
            //</debug>
            value = [ value.charAt(0), value.charAt(1) ];
        }
        else if (typeof value[0] === 'number') {
            value = [
                String.fromCharCode(value[0]),
                String.fromCharCode(value[1])
            ];
        }

        return value;
    },

    applyOverStyle: function(style) {
        this.trackerEl.applyStyles(style);
    },

    applySelectedStyle: function(style) {
        this.valueEl.applyStyles(style);
    },

    applyStyle: function(style) {
        this.element.applyStyles(style);
    },

    applyTooltip: function (tip) {
        if (tip && typeof tip !== 'function') {
            if (!tip.isTemplate) {
                tip = new Ext.XTemplate(tip);
            }

            tip = tip.apply.bind(tip);
        }

        return tip;
    },

    applyTrackingValue: function (value) {
        return this.applyValue(value); // same rounding as normal value
    },

    applyValue: function (v) {
        if (v !== null) {
            var rounding = this.getRounding(),
                limit = this.getLimit(),
                min = this.getMinimum();

            v = Math.round(Math.round(v / rounding) * rounding * 1000) / 1000;
            v = (v < min) ? min : (v > limit ? limit : v);
        }

        return v;
    },

    //-------------------------------------------------------------------------
    // Event Handlers

    onClick: function (event) {
        var value = this.valueFromEvent(event);
        this.setValue(value);
    },

    onMouseEnter: function () {
        this.element.addCls(this.overCls);
    },

    onMouseLeave: function () {
        this.element.removeCls(this.overCls);
    },

    onMouseMove: function (event) {
        var value = this.valueFromEvent(event);
        this.setTrackingValue(value);
    },

    //-------------------------------------------------------------------------
    // Config Updaters

    updateFamily: function (family) {
        this.element.setStyle('fontFamily', "'" + family + "'");
    },

    updateGlyphs: function () {
        this.refreshGlyphs();
    },

    updateLimit: function () {
        this.refreshGlyphs();
    },

    updateScale: function (size) {
        this.element.setStyle('fontSize', size);
    },

    updateTooltip: function () {
        this.refreshTooltip();
    },

    updateTooltipText: function (text) {
        var innerEl = this.innerEl,
            QuickTips = Ext.tip && Ext.tip.QuickTipManager,
            tip = QuickTips && QuickTips.tip,
            target;

        if (QuickTips) {
            innerEl.dom.setAttribute('data-qtip', text);
            this.trackerEl.dom.setAttribute('data-qtip', text);

            // If the QuickTipManager is active over our widget, we need to update
            // the tooltip text directly.
            target = tip && tip.activeTarget;
            target = target && target.el;
            if (target && innerEl.contains(target)) {
                tip.update(text);
            }
        }
    },

    updateTrackingValue: function (value) {
        var me = this,
            trackerEl = me.trackerEl,
            newWidth = me.valueToPercent(value);

        trackerEl.setStyle('width', newWidth);

        me.refreshTooltip();
    },

    updateTrackOver: function (trackOver) {
        this.element[trackOver ? 'addCls' : 'removeCls'](this.trackOverCls);
    },

    updateValue: function (value, oldValue) {
        var me = this,
            animate = me.getAnimate(),
            valueEl = me.valueEl,
            newWidth = me.valueToPercent(value),
            column, record;

        if (me.isConfiguring || !animate) {
            valueEl.setStyle('width', newWidth);
        } else {
            valueEl.stopAnimation();
            valueEl.animate(Ext.merge({
                from: { width: me.valueToPercent(oldValue) },
                to:   { width: newWidth }
            }, animate));
        }

        me.refreshTooltip();

        if (!me.isConfiguring) {
            // Since we are (re)configured many times as we are used in a grid cell, we
            // avoid firing the change event unless there are listeners.
            if (me.hasListeners.change) {
                me.fireEvent('change', me, value, oldValue);
            }

            column = me.getWidgetColumn && me.getWidgetColumn();
            record = column && me.getWidgetRecord && me.getWidgetRecord();

            if (record && column.dataIndex) {
                // When used in a widgetcolumn, we should update the backing field. The
                // linkages will be cleared as we are being recycled, so this will only
                // reach this line when we are properly attached to a record and the
                // change is coming from the user (or a call to setValue).
                record.set(column.dataIndex, value);
            }
        }
    },

    //-------------------------------------------------------------------------
    // Config System Optimizations
    //
    // These are to deal with configs that combine to determine what should be
    // rendered in the DOM. For example, "glyphs" and "limit" must both be known
    // to render the proper text nodes. The "tooltip" and "value" likewise are
    // used to update the tooltipText.
    //
    // To avoid multiple updates to the DOM (one for each config), we simply mark
    // the rendering as invalid and post-process these flags on the tail of any
    // bulk updates.

    afterCachedConfig: function () {
        // Now that we are done setting up the initial values we need to refresh the
        // DOM before we allow Ext.Widget's implementation to cloneNode on it.
        this.refresh();

        return this.callParent(arguments);
    },

    initConfig: function (instanceConfig) {
        this.isConfiguring = true;

        this.callParent([ instanceConfig ]);

        // The firstInstance will already have refreshed the DOM (in afterCacheConfig)
        // but all instances beyond the first need to refresh if they have custom values
        // for one or more configs that affect the DOM (such as "glyphs" and "limit").
        this.refresh();
    },

    setConfig: function () {
        var me = this;

        // Since we could be updating multiple configs, save any updates that need
        // multiple values for afterwards.
        me.isReconfiguring = true;

        me.callParent(arguments);

        me.isReconfiguring = false;

        // Now that all new values are set, we can refresh the DOM.
        me.refresh();

        return me;
    },

    //-------------------------------------------------------------------------

    destroy: function () {
        var me = this,
            tip = me.tip;

        if (tip) {
            me.tip = Ext.destroy(tip);
        }

        me.callParent();
    },

    privates: {
        /**
         * This method returns the DOM text node into which glyphs are placed.
         * @param {HTMLElement} dom The DOM node parent of the text node.
         * @return {HTMLTextNode} The text node.
         * @private
         */
        getGlyphTextNode: function (dom) {
            var node = dom.lastChild;

            // We want all our text nodes to be at the end of the child list, most
            // especially the text node on the innerEl. That text node affects the
            // default left/right position of our absolutely positioned child divs
            // (trackerEl and valueEl).

            if (!node || node.nodeType !== 3) {
                node = dom.ownerDocument.createTextNode('');
                dom.appendChild(node);
            }

            return node;
        },

        getTooltipData: function () {
            var me = this;

            return {
                component: me,
                tracking: me.getTrackingValue(),
                trackOver: me.getTrackOver(),
                value: me.getValue()
            };
        },

        /**
         * Forcibly refreshes both glyph and tooltip rendering.
         * @private
         */
        refresh: function () {
            var me = this;

            if (me.invalidGlyphs) {
                me.refreshGlyphs(true);
            }

            if (me.invalidTooltip) {
                me.refreshTooltip(true);
            }
        },

        /**
         * Refreshes the glyph text rendering unless we are currently performing a
         * bulk config change (initConfig or setConfig).
         * @param {Boolean} now Pass `true` to force the refresh to happen now.
         * @private
         */
        refreshGlyphs: function (now) {
            var me = this,
                later = !now && (me.isConfiguring || me.isReconfiguring),
                el, glyphs, limit, on, off, trackerEl, valueEl;

            if (!later) {
                el = me.getGlyphTextNode(me.innerEl.dom);
                valueEl = me.getGlyphTextNode(me.valueEl.dom);
                trackerEl = me.getGlyphTextNode(me.trackerEl.dom);

                glyphs = me.getGlyphs();
                limit = me.getLimit();

                for (on = off = ''; limit--; ) {
                    off += glyphs[0];
                    on += glyphs[1];
                }

                el.nodeValue = off;
                valueEl.nodeValue = on;
                trackerEl.nodeValue = on;
            }

            me.invalidGlyphs = later;
        },

        /**
         * Refreshes the tooltip text rendering unless we are currently performing a
         * bulk config change (initConfig or setConfig).
         * @param {Boolean} now Pass `true` to force the refresh to happen now.
         * @private
         */
        refreshTooltip: function (now) {
            var me = this,
                later = !now && (me.isConfiguring || me.isReconfiguring),
                tooltip = me.getTooltip(),
                data, text;

            if (!later) {
                tooltip = me.getTooltip();

                if (tooltip) {
                    data = me.getTooltipData();
                    text = tooltip(data);
                    me.setTooltipText(text);
                }
            }

            me.invalidTooltip = later;
        },

        /**
         * Convert the coordinates of the given `Event` into a rating value.
         * @param {Ext.Event} event The event.
         * @return {Number} The rating based on the given event coordinates.
         * @private
         */
        valueFromEvent: function (event) {
            var me = this,
                el = me.innerEl,
                ex = event.getX(),
                rounding = me.getRounding(),
                cx = el.getX(),
                x = ex - cx,
                w = el.getWidth(),
                limit = me.getLimit(),
                v;

            if (me.getInherited().rtl) {
                x = w - x;
            }

            v = x / w * limit;

            // We have to round up here so that the area we are over is considered
            // the value.
            v = Math.ceil(v / rounding) * rounding;

            return v;
        },

        /**
         * Convert the given rating into a width percentage.
         * @param {Number} value The rating value to convert.
         * @return {String} The width percentage to represent the given value.
         * @private
         */
        valueToPercent: function (value) {
            value = (value / this.getLimit()) * 100;
            return value + '%';
        }
    }
});
