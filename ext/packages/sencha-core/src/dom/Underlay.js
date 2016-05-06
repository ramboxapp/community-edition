/**
 * A class that provides an underlay element which displays behind an absolutely positioned
 * target element and tracks its size and position. Abstract base class for
 * {@link Ext.dom.Shadow} and {@link Ext.dom.Shim}
 *  
 * 
 * @private
 * @abstract
 */
Ext.define('Ext.dom.Underlay', {
    requires: [ 'Ext.dom.UnderlayPool' ],

    /**
     * @cfg {Ext.dom.Element} target
     * The target element
     */

    /**
     * @cfg {Number} zIndex
     * The CSS z-index to use for this underlay.  Defaults to the z-index of {@link #target}.
     */

    constructor: function(config) {
        Ext.apply(this, config);
    },

    /**
     * @protected
     * Called before the underlay is shown, immediately after its element is retrieved
     * from the pool
     */
    beforeShow: Ext.emptyFn,

    /**
     * @protected
     * Returns the dom element that this underlay should be inserted before.
     * Defaults to the target element
     * @return {Ext.dom.Element}
     */
    getInsertionTarget: function() {
        return this.target;
    },

    /**
     * @protected
     * @return {Ext.dom.UnderlayPool}
     */
    getPool: function() {
        return this.pool ||
            (this.self.prototype.pool = new Ext.dom.UnderlayPool(this.elementConfig));
    },

    /**
     * Hides the underlay
     */
    hide: function() {
        var me = this,
            el = me.el;
        
        if (el) {
            el.hide();
            me.getPool().checkIn(el);
            me.el = null;
            me.hidden = true;
        }
    },

    /**
     * Aligns the underlay to its target element
     * @param {Number} [x] The x position of the target element.  If not provided, the 
     * x position will be read from the DOM.
     * @param {Number} [y] The y position of the target element.  If not provided, the
     * y position will be read from the DOM.
     * @param {Number} [width] The width of the target element.  If not provided, the
     * width will be read from the DOM.
     * @param {Number} [height] The height of the target element.  If not provided, the
     * height will be read from the DOM.
     */
    realign: function(x, y, width, height) {
        var me = this,
            el = me.el,
            target = me.target,
            offsets = me.offsets,
            max = Math.max;

        if (el) {
            if (x == null) {
                x = target.getX();
            }

            if (y == null) {
                y = target.getY();
            }

            if (width == null) {
                width = target.getWidth();
            }

            if (height == null) {
                height = target.getHeight();
            }

            if (offsets) {
                x = x + offsets.x;
                y = y + offsets.y;
                width = max(width + offsets.w, 0);
                height = max(height + offsets.h, 0);
            }

            el.setXY([x, y]);
            el.setSize(width, height);
        }
    },

    /**
     * Adjust the z-index of this underlay
     * @param {Number} zIndex The new z-index
     */
    setZIndex: function(zIndex) {
        this.zIndex = zIndex;

        if (this.el) {
            this.el.setStyle("z-index", zIndex);
        }
    },

    /**
     * Shows the underlay
     */
    show: function() {
        var me = this,
            target = me.target,
            zIndex = me.zIndex,
            el = me.el,
            insertionTarget = me.getInsertionTarget().dom,
            dom;

        if (!el) {
            el = me.el = me.getPool().checkOut();
        }

        me.beforeShow();

        if (zIndex == null) {
            // For best results, we need the underlay to be as close as possible to its
            // target element in the z-index stacking order without overlaying the target
            // element.  Since the UnderlayPool inserted the underlay as high as possible
            // in the dom tree when we checked the underlay out of the pool, we can assume
            // that it comes before the target element in the dom tree, and therefore can
            // give it the exact same index as the target element.
            zIndex = (parseInt(target.getStyle("z-index"), 10));
        }

        if (zIndex) {
            el.setStyle("z-index", zIndex);
        }

        // Overlay elements are shared, so fix position to match current owner
        el.setStyle('position', me.fixed ? 'fixed' : '');

        dom = el.dom;
        if (dom.nextSibling !== insertionTarget) {
            // inserting the underlay as the previous sibling of the target ensures that
            // it will show behind the target, as long as its z-index is less than or equal
            // to the z-index of the target element.
            target.dom.parentNode.insertBefore(dom, insertionTarget);
        }

        el.show();
        me.realign();
        me.hidden = false;
    }
    
});
