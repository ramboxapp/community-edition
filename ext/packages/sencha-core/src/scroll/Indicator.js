/**
 * Provides a visual indicator of scroll position while scrolling using a {@link
 * Ext.scroll.TouchScroller TouchScroller}.  This class should not be created directly.
 * To configure scroll indicators please use the {@link Ext.scroll.Scroller#indicators
 * indicators} config of the Scroller.
 */
Ext.define('Ext.scroll.Indicator', {
    extend: 'Ext.Widget',
    xtype: 'scrollindicator',

    config: {
        /**
         * @cfg {String} axis ('x' or 'y')
         * @private
         */
        axis: null,

        /**
         * @cfg {Boolean/Object}
         * @private
         */
        hideAnimation: true,

        /**
         * @cfg {Number} hideDelay
         * Number of milliseconds to delay hiding Indicators when scrolling ends.
         */
        hideDelay: 0,

        /**
         * @cfg {Ext.scroll.TouchScroller} scroller The scroller instance
         * @private
         */
        scroller: null,

        /**
         * @cfg {Number} minLength The minimum length for the indicator. Defaults to the
         * indicator's "size" (the width of vertical or height of horizontal indicators)
         */
        minLength: 24
    },

    defaultHideAnimation: {
        to: {
            opacity: 0
        },
        duration: 300
    },

    names: {
        x: {
            side: 'l',
            getSize: 'getHeight',
            setLength: 'setWidth',
            translate: 'translateX'
        },
        y: {
            side: 't',
            getSize: 'getWidth',
            setLength: 'setHeight',
            translate: 'translateY'
        }
    },

    oppositeAxis: {
        x: 'y',
        y: 'x'
    },

    cls: Ext.baseCSSPrefix + 'scroll-indicator',

    applyHideAnimation: function(hideAnimation) {
        if (hideAnimation) {
            hideAnimation = Ext.mergeIf({
                onEnd: this.onHideAnimationEnd,
                scope: this
            }, this.defaultHideAnimation, hideAnimation);
        }
        return hideAnimation;
    },

    constructor: function(config) {
        var me = this,
            axis;

        me.callParent([config]);

        axis = me.getAxis();

        me.names = me.names[axis];

        me.element.addCls(me.cls + ' ' + me.cls + '-' + axis);
    },

    /**
     * Hides this scroll indicator
     */
    hide: function() {
        var me = this,
            delay = me.getHideDelay();

        if (delay) {
            me._hideTimer = Ext.defer(me.doHide, delay, me);
        } else {
            me.doHide();
        }
    },

    /**
     * Sets the value of this scroll indicator.
     * @param {Number} value The scroll position on the configured {@link #axis}
     */
    setValue: function(value) {
        var me = this,
            el = me.element,
            names = me.names,
            axis = me.getAxis(),
            scroller = me.getScroller(),
            maxScrollPosition = scroller.getMaxUserPosition()[axis],
            elementSize = scroller.getElementSize()[axis],
            baseLength = me.length,
            minLength = me.getMinLength(),
            length = baseLength,
            maxPosition = elementSize - baseLength - me.sizeAdjust,
            round = Math.round,
            max = Math.max,
            position;

        if (value < 0) {
            length = round(max(
                    baseLength + (baseLength * value / elementSize),
                minLength
            ));
            position = 0;
        } else if (value > maxScrollPosition) {
            length = round(max(
                    baseLength - (baseLength *
                    (value - maxScrollPosition) / elementSize),
                minLength
            ));
            position = maxPosition + baseLength - length;
        } else {
            position = round(value / maxScrollPosition * maxPosition);
        }

        me[names.translate](position);
        el[names.setLength](length);
    },

    /**
     * Shows this scroll indicator
     */
    show: function() {
        var me = this,
            el = me.element,
            anim = el.getActiveAnimation();

        if (anim) {
            anim.end();
        }

        if (!me._inDom) {
            // on first show we need to append the indicator to the scroller element
            me.getScroller().getElement().appendChild(el);
            me._inDom = true;

            if (!me.size) {
                me.cacheStyles();
            }
        }

        me.refreshLength();
        clearTimeout(me._hideTimer);
        el.setStyle('opacity', '');
    },

    privates: {
        /**
         * Caches the values that are set via stylesheet rules (size and margin)
         * @private
         */
        cacheStyles: function() {
            var me = this,
                el = me.element,
                names = me.names;

            /**
             * @property {Number} size
             * @private
             * The indicator's size (width if vertical, height if horizontal)
             */
            me.size = el[names.getSize]();

            /**
             * @property {Number} margin
             * @private
             * The indicator's margin (the space between the indicator and the container's edge)
             */
            me.margin = el.getMargin(names.side);
        },

        doHide: function() {
            var animation = this.getHideAnimation(),
                el = this.element;

            if (animation) {
                el.animate(animation);
            } else {
                el.setStyle('opacity', 0);
            }
        },

        /**
         * Returns true if the scroller that this indicator is attached to has scrolling
         * enabled on the opposite axis
         * @private
         * @return {Boolean}
         */
        hasOpposite: function() {
            return this.getScroller().isAxisEnabled(this.oppositeAxis[this.getAxis()]);
        },

        onHideAnimationEnd: function() {
            // When using the touch animation system (css transforms) we don't end up with opacity
            // of 0 on the element at the end of the animation so we have to set it here
            this.element.setStyle('opacity', '0');
        },

        refreshLength: function() {
            var me = this,
                names = me.names,
                axis = me.getAxis(),
                scroller = me.getScroller(),
                scrollSize = scroller.getSize()[axis],
                elementSize = scroller.getElementSize()[axis],
                ratio = elementSize / scrollSize,
                baseSizeAdjust = me.margin * 2,
                sizeAdjust = me.hasOpposite() ? (baseSizeAdjust + me.size) : baseSizeAdjust,
                length = Math.max(Math.round((elementSize - sizeAdjust) * ratio), me.getMinLength());

            me.sizeAdjust = sizeAdjust;

            /**
             * @property {Number} length
             * @private
             * The indicator's "length" (height for vertical indicators, or width for
             * horizontal indicators)
             */
            me.length = length;
            me.element[names.setLength](length);
        },

        translateX: function(value) {
            this.element.translate(value);
        },

        translateY: function(value) {
            this.element.translate(0, value);
        }
    }
});
