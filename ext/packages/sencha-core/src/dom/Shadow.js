/**
 * Simple class that can provide a shadow effect for any absolutely positioned {@link
 * Ext.dom.Element Element}.
 * 
 * Not meant to be used directly. To apply a shadow to an Element use the 
 * {@link Ext.dom.Element#enableShadow enableShadow} method.
 * 
 * @private
 */
Ext.define('Ext.dom.Shadow', {
    extend: 'Ext.dom.Underlay',
    alternateClassName: 'Ext.Shadow',

    /**
     * @cfg {String} mode
     * The shadow display mode.  Supports the following options:
     *
     * - sides : Shadow displays on both sides and bottom only
     * - frame : Shadow displays equally on all four sides
     * - drop : Traditional bottom-right drop shadow
     */
    mode: 'drop',

    /**
     * @cfg {Number} offset
     * The number of pixels to offset the shadow from the element
     */
    offset: 4,

    cls: Ext.baseCSSPrefix + (!Ext.supports.CSS3BoxShadow ? 'ie' : 'css') + '-shadow',

    /**
     * Creates new Shadow.
     * @param {Object} config (optional) Config object.
     */
    constructor: function(config) {
        var me = this,
            outerOffsets, offsets, offset, rad;

        me.callParent([config]);

        me.elementConfig = {
            cls: me.cls,
            role: 'presentation'
        };

        offset = me.offset;
        rad = Math.floor(offset / 2);
        me.opacity = 50;
        switch (me.mode.toLowerCase()) {
            case "drop":
                outerOffsets = {
                    x: 0,
                    y: 0,
                    w: offset,
                    h: offset
                };
                if (Ext.supports.CSS3BoxShadow) {
                    offsets = {
                        x: offset,
                        y: offset,
                        h: -offset,
                        w: -offset
                    };
                }
                else {
                    offsets = {
                        x: -rad,
                        y: -rad,
                        h: -rad,
                        w: -rad
                    };
                }
                break;
            case "sides":
                outerOffsets = {
                    x: -offset,
                    y: 0,
                    w: offset * 2,
                    h: offset
                };
                if (Ext.supports.CSS3BoxShadow) {
                    offsets = {
                        x: 0,
                        y: offset,
                        h: -offset,
                        w: 0
                    };
                }
                else {
                    offsets = {
                        x: 1 + rad - 2 * offset,
                        y: - (1 + rad),
                        h: -1,
                        w: rad - 1
                    };
                }
                break;
            case "frame":
                outerOffsets = {
                    x: -offset,
                    y: -offset,
                    w: offset * 2,
                    h: offset * 2
                };
                if (Ext.supports.CSS3BoxShadow) {
                    offsets = {
                        x: 0,
                        y: 0,
                        h: 0,
                        w: 0
                    };
                }
                else {
                    offsets = {
                        x: 1 + rad - 2 * offset,
                        y: 1 + rad - 2 * offset,
                        h: offset - rad - 1,
                        w: offset - rad - 1
                    };
                }
                break;
            case "bottom":
                outerOffsets = {
                    x: -offset,
                    y: 0,
                    w: offset * 2,
                    h: offset
                };
                if (Ext.supports.CSS3BoxShadow) {
                    offsets = {
                        x: 0,
                        y: offset,
                        h: -offset,
                        w: 0
                    };
                }
                else {
                    offsets = {
                        x: 0,
                        y: offset,
                        h: 0,
                        w: 0
                    };
                }
                break;
        }

        /**
         * @property {Object} offsets The offsets used for positioning the shadow element
         * relative to its target element
         */
        me.offsets = offsets;

        /**
         * @property {Object} outerOffsets Offsets that represent the union of the areas
         * of the target element and the shadow combined.  Used by Ext.dom.Element for
         * ensuring that the shim (if present) extends under the full area of both elements.
         */
        me.outerOffsets = outerOffsets;
    },

    /**
     * @private
     * Returns the shadow size on each side of the element in standard CSS order: top, right, bottom, left;
     * @return {Number[]} Top, right, bottom and left shadow size.
     */
    getShadowSize: function() {
        var me = this,
            offset = me.el ? me.offset : 0,
            result = [offset, offset, offset, offset],
            mode = me.mode.toLowerCase();

        // There are only offsets if the shadow element is present.
        if (me.el && mode !== 'frame') {
            result[0] = 0;
            if (mode == 'drop') {
                result[3] = 0;
            }
        }
        return result;
    },


    // private - CSS property to use to set the box shadow
    boxShadowProperty: (function() {
        var property = 'boxShadow',
            style = document.documentElement.style;

        if (!('boxShadow' in style)) {
            if ('WebkitBoxShadow' in style) {
                // Safari prior to version 5.1 and Chrome prior to version 10
                property = 'WebkitBoxShadow';
            }
            else if ('MozBoxShadow' in style) {
                // FF 3.5 & 3.6
                property = 'MozBoxShadow';
            }
        }

        return property;
    }()),

    beforeShow: function() {
        var me = this,
            style = me.el.dom.style,
            shim = me.shim;

        if (Ext.supports.CSS3BoxShadow) {
            style[me.boxShadowProperty] = '0 0 ' + (me.offset + 2) + 'px #888';
        } else {
            style.filter = "progid:DXImageTransform.Microsoft.alpha(opacity=" + me.opacity + ") progid:DXImageTransform.Microsoft.Blur(pixelradius=" + (me.offset) + ")";
        }

        // if we are showing a shadow, and we already have a visible shim, we need to
        // realign the shim to ensure that it includes the size of target and shadow els
        if (shim) {
            shim.realign();
        }
    },

    /**
     * Sets the opacity of the shadow
     * @param {Number} opacity The opacity
     */
    setOpacity: function(opacity){
        var el = this.el;

        if (el) {
            if (Ext.isIE && !Ext.supports.CSS3BoxShadow) {
                opacity = Math.floor(opacity * 100 / 2) / 100;
            }
            this.opacity = opacity;
            el.setOpacity(opacity);
        }
    }
});