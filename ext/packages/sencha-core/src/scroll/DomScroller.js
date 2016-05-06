/**
 * @class Ext.scroll.DomScroller
 * @private
 */
Ext.define('Ext.scroll.DomScroller', {
    extend: 'Ext.scroll.Scroller',
    alias: 'scroller.dom',

    isDomScroller: true,

    getMaxPosition: function() {
        var element = this.getElement(),
            x = 0,
            y = 0,
            dom;

        if (element && !element.isDestroyed) {
            dom = element.dom;
            x = dom.scrollWidth - dom.clientWidth;
            y = dom.scrollHeight - dom.clientHeight;
        }

        return {
            x: x,
            y: y
        };
    },

    getMaxUserPosition: function() {
        var me = this,
            element = me.getElement(),
            x = 0,
            y = 0,
            dom;

        if (element && !element.isDestroyed) {
            dom = element.dom;
            if (me.getX()) {
                x = dom.scrollWidth - dom.clientWidth;
            }
            if (me.getY()) {
                y = dom.scrollHeight - dom.clientHeight;
            }
        }

        return {
            x: x,
            y: y
        };
    },

    getPosition: function() {
        var element = this.getElement(),
            x = 0,
            y = 0,
            position;

        if (element && !element.isDestroyed) {
            position = this.getElementScroll(element);
            x = position.left;
            y = position.top;
        }

        return {
            x: x,
            y: y
        };
    },

    getSize: function() {
        var element = this.getElement(),
            size, dom;

        if (element && !element.isDestroyed) {
            dom = element.dom;
            size = {
                x: dom.scrollWidth,
                y: dom.scrollHeight
            };
        } else {
            size = {
                x: 0,
                y: 0
            };
        }

        return size;
    },

    setSize: Ext.emptyFn,

    updateElement: function(element, oldElement) {
        this.initXStyle();
        this.initYStyle();
        this.callParent([element, oldElement]);
    },

    updateX: function(x) {
        this.initXStyle();
    },

    updateY: function(y) {
        this.initYStyle();
    },

    privates: {
        doScrollTo: function(x, y, animate) {
            var me = this,
                element = me.getElement(),
                maxPosition, dom, to, xInf, yInf;

            if (element && !element.isDestroyed) {
                dom = this.getElement().dom;

                xInf = (x === Infinity);
                yInf = (y === Infinity);

                if (xInf || yInf) {
                    maxPosition = me.getMaxPosition();
                    if (xInf) {
                        x = maxPosition.x;
                    }
                    if (yInf) {
                        y = maxPosition.y;
                    }
                }

                x = me.convertX(x);

                if (animate) {
                    to = {};

                    if (y != null) {
                        to.scrollTop = y;
                    }

                    if (x != null) {
                        to.scrollLeft = x;
                    }

                    element.animate(Ext.mergeIf({
                        to: {
                            scrollTop: y,
                            scrollLeft: x
                        }
                    }, animate));
                } else {
                    if (y != null) {
                        dom.scrollTop = y;
                    }
                    if (x != null) {
                        dom.scrollLeft = x;
                    }
                }
            }
        },

        // rtl hook
        getElementScroll: function(element) {
            return element.getScroll();
        },

        stopAnimation: function() {
            var anim = this.getElement().getActiveAnimation();
            if (anim) {
                anim.end();
            }
        }
    }
});
