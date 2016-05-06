/**
 * @class Ext.scroll.TouchScroller
 * @private
 * Momentum scrolling is one of the most important parts of the user experience on touch-screen
 * devices.  Depending on the device and browser, Ext JS will select one of several different
 * scrolling implementations for best performance.
 *
 * Scroller settings can be changed using the {@link Ext.Container#scrollable scrollable}
 * configuration on {@link Ext.Component}. Here is a simple example of how to adjust the
 * scroller settings when using a Component (or anything that extends it).
 *
 *     @example
 *     Ext.create('Ext.Component', {
 *         renderTo: Ext.getBody(),
 *         height: 100,
 *         width: 100,
 *         // this component is scrollable vertically but not horizontally
 *         scrollable: 'y',
 *         html: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque convallis lorem et magna tempus fermentum.'
 *     });
 */
Ext.define('Ext.scroll.TouchScroller', {
    extend: 'Ext.scroll.Scroller',
    alias: 'scroller.touch',

    requires: [
        'Ext.fx.easing.BoundMomentum',
        'Ext.fx.easing.EaseOut',
        'Ext.util.Translatable',
        'Ext.scroll.Indicator',
        'Ext.GlobalEvents'
    ],

    isTouchScroller: true,

    config: {
        /**
         * @cfg autoRefresh
         * @private
         */
        autoRefresh: true,

        /**
         * @cfg bounceEasing
         * @private
         */
        bounceEasing: {
            duration: 400
        },

        /**
         * @cfg
         * @private
         */
        elementSize: undefined,

        indicators: true,

        /**
         * @cfg fps
         * @private
         */
        fps: 'auto',

        /**
         * @cfg maxAbsoluteVelocity
         * @private
         */
        maxAbsoluteVelocity: 6,

        /**
         * @cfg {Object} momentumEasing
         * @inheritdoc
         * The default value is:
         *
         *     {
         *         momentum: {
         *             acceleration: 30,
         *             friction: 0.5
         *         },
         *         bounce: {
         *             acceleration: 30,
         *             springTension: 0.3
         *         }
         *     }
         *
         * Note that supplied object will be recursively merged with the default object. For example, you can simply
         * pass this to change the momentum acceleration only:
         *
         *     {
         *         momentum: {
         *             acceleration: 10
         *         }
         *     }
         */
        momentumEasing: {
            momentum: {
                acceleration: 30,
                friction: 0.5
            },

            bounce: {
                acceleration: 30,
                springTension: 0.3
            },

            minVelocity: 1
        },

        /**
         * @cfg outOfBoundRestrictFactor
         * @private
         */
        outOfBoundRestrictFactor: 0.5,

        /**
         * @cfg {Ext.dom.Element}
         * @private
         * The element that wraps the content of {@link #element} and is translated in
         * response to user interaction.  If not configured, one will be automatically
         * generated.
         */
        innerElement: null,

        size: undefined,

        /**
         * @cfg
         * @private
         */
        slotSnapEasing: {
            duration: 150
        },

        /**
         * @cfg {Number/Object} slotSnapSize
         * The size of each slot to snap to in 'px', can be either an object with `x` and `y` values, i.e:
         *
         *      {
         *          x: 50,
         *          y: 100
         *      }
         *
         * or a number value to be used for both directions. For example, a value of `50` will be treated as:
         *
         *      {
         *          x: 50,
         *          y: 50
         *      }
         *
         * @accessor
         */
        slotSnapSize: {
            x: 0,
            y: 0
        },

        /**
         * @cfg slotSnapOffset
         * @private
         */
        slotSnapOffset: {
            x: 0,
            y: 0
        },

        /**
         * @cfg startMomentumResetTime
         * @private
         */
        startMomentumResetTime: 300,

        /**
         * @cfg translatable
         * @private
         */
        translatable: {
            translationMethod: 'auto',
            useWrapper: false
        }
    },

    cls: Ext.baseCSSPrefix + 'scroll-container',
    scrollerCls: Ext.baseCSSPrefix + 'scroll-scroller',

    dragStartTime: 0,

    dragEndTime: 0,

    isDragging: false,

    isAnimating: false,

    isMouseEvent: {
        mousedown: 1,
        mousemove: 1,
        mouseup: 1
    },

    listenerMap: {
        touchstart: 'onTouchStart',
        touchmove: 'onTouchMove',
        dragstart: 'onDragStart',
        drag: 'onDrag',
        dragend: 'onDragEnd'
    },

    refreshCounter: 0,

    constructor: function(config) {
        var me = this,
            onEvent = 'onEvent';

        me.elementListeners = {
            touchstart: onEvent,
            touchmove: onEvent,
            dragstart: onEvent,
            drag: onEvent,
            dragend: onEvent,
            scope: me
        };

        me.minPosition = { x: 0, y: 0 };

        me.startPosition = { x: 0, y: 0 };

        me.position = { x: 0, y: 0 };

        me.velocity = { x: 0, y: 0 };

        me.isAxisEnabledFlags = { x: false, y: false };

        me.flickStartPosition = { x: 0, y: 0 };

        me.flickStartTime = { x: 0, y: 0 };

        me.lastDragPosition = { x: 0, y: 0 };

        me.dragDirection = { x: 0, y: 0};

        Ext.GlobalEvents.on('idle', me.onIdle, me);

        me.callParent([config]);

        me.refreshAxes();
    },

    applyBounceEasing: function(easing) {
        var defaultClass = Ext.fx.easing.EaseOut;

        return {
            x: Ext.factory(easing, defaultClass),
            y: Ext.factory(easing, defaultClass)
        };
    },

    applyElementSize: function(size) {
        var el = this.getElement(),
            dom, x, y;

        if (!el) {
            return null;
        }

        dom = el.dom;

        if (!dom) {
            return;
        }

        if (size == null) { // null or undefined
            x = dom.clientWidth;
            y = dom.clientHeight;
        } else {
            x = size.x;
            y = size.y;
        }

        return {
            x: x,
            y: y
        };
    },

    applyIndicators: function(indicators, oldIndicators) {
        var me = this,
            xIndicator, yIndicator, x, y;

        if (indicators) {
            if (indicators === true) {
                xIndicator = yIndicator = {};
            } else {
                x = indicators.x;
                y = indicators.y;
                if (x || y) {
                    // handle an object with x/y keys for configuring the indicators
                    // individually.  undfined/null/true are all the same, only false
                    // can prevent the indicator from being created
                    xIndicator = (x == null || x === true) ? {} : x;
                    yIndicator = (x == null || y === true) ? {} : y;
                } else {
                    // not an object with x/y keys, handle as a single indicators config
                    // that applies to both axes
                    xIndicator = yIndicator = indicators;
                }
            }

            if (oldIndicators) {
                if (xIndicator) {
                    oldIndicators.x.setConfig(xIndicator);
                } else {
                    oldIndicators.x.destroy();
                    oldIndicators.x = null;
                }
                if (yIndicator) {
                    oldIndicators.y.setConfig(yIndicator);
                } else {
                    oldIndicators.y.destroy();
                    oldIndicators.y = null;
                }
                indicators = oldIndicators;
            } else {
                indicators = { x: null, y: null };
                if (xIndicator) {
                    indicators.x = new Ext.scroll.Indicator(Ext.applyIf({
                        axis: 'x',
                        scroller: me
                    }, xIndicator));
                }
                if (yIndicator) {
                    indicators.y = new Ext.scroll.Indicator(Ext.applyIf({
                        axis: 'y',
                        scroller: me
                    }, yIndicator));
                }
            }
        } else if (oldIndicators) {
            oldIndicators.x.destroy();
            oldIndicators.y.destroy();
            oldIndicators.x = null;
            oldIndicators.y = null;
        }

        return indicators;
    },

    applyMomentumEasing: function(easing) {
        var defaultClass = Ext.fx.easing.BoundMomentum;

        return {
            x: Ext.factory(easing, defaultClass),
            y: Ext.factory(easing, defaultClass)
        };
    },

    applyInnerElement: function(innerElement) {
        if (innerElement && !innerElement.isElement) {
            innerElement = Ext.get(innerElement);
        }

        //<debug>
        if (this.isConfiguring && !innerElement) {
            Ext.Error.raise("Cannot create Ext.scroll.TouchScroller instance with null innerElement");
        }
        //</debug>

        return innerElement;
    },

    applySize: function(size) {
        var el, dom, scrollerDom, x, y;

        if (size == null) { // null or undefined
            el = this.getElement();

            if (!el) {
                return null;
            }

            dom = el.dom;
            scrollerDom = this.getInnerElement().dom;

            // using scrollWidth/scrollHeight instead of offsetWidth/offsetHeight ensures
            // that the size includes any contained absolutely positioned items
            x = Math.max(scrollerDom.scrollWidth, dom.clientWidth);
            y = Math.max(scrollerDom.scrollHeight, dom.clientHeight);
        } else if (typeof size === 'number') {
            x = size;
            y = size;
        } else {
            x = size.x;
            y = size.y;
        }

        return {
            x: x,
            y: y
        };
    },

    applySlotSnapOffset: function(snapOffset) {
        if (typeof snapOffset === 'number') {
            return {
                x: snapOffset,
                y: snapOffset
            };
        }

        return snapOffset;
    },

    applySlotSnapSize: function(snapSize) {
        if (typeof snapSize === 'number') {
            return {
                x: snapSize,
                y: snapSize
            };
        }

        return snapSize;
    },

    applySlotSnapEasing: function(easing) {
        var defaultClass = Ext.fx.easing.EaseOut;

        return {
            x: Ext.factory(easing, defaultClass),
            y: Ext.factory(easing, defaultClass)
        };
    },

    applyTranslatable: function(config, translatable) {
        return Ext.factory(config, Ext.util.Translatable, translatable);
    },

    destroy: function() {
        var me = this,
            element = me.getElement(),
            innerElement = me.getInnerElement(),
            sizeMonitors = me.sizeMonitors;

        if (sizeMonitors) {
            sizeMonitors.element.destroy();
            sizeMonitors.container.destroy();
        }

        if (element && !element.isDestroyed) {
            element.removeCls(me.cls);
        }

        if (innerElement && !innerElement.isDestroyed) {
            innerElement.removeCls(me.scrollerCls);
        }

        if (me._isWrapped) {
            if (!element.isDestroyed) {
                me.unwrapContent();
            }

            innerElement.destroy();
            if (me.FixedHBoxStretching) {
                innerElement.parent().destroy();
            }
        }

        me.setElement(null);
        me.setInnerElement(null);

        Ext.GlobalEvents.un('idle', me.onIdle, me);

        Ext.destroy(me.getTranslatable());

        me.callParent(arguments);
    },

    getPosition: function() {
        return this.position;
    },

    refresh: function(immediate, /* private */ options) {
        ++this.refreshCounter;
        if (immediate) {
            this.doRefresh(options);
        }
    },

    updateAutoRefresh: function(autoRefresh) {
        this.toggleResizeListeners(autoRefresh);
    },

    updateBounceEasing: function(easing) {
        this.getTranslatable().setEasingX(easing.x).setEasingY(easing.y);
    },

    updateElementSize: function() {
        if (!this.isConfiguring) {
            // to avoid multiple calls to refreshAxes() during initialization we will
            // call it once after initConfig has finished.
            this.refreshAxes();
        }
    },

    updateDisabled: function(disabled) {
        // attachment of listeners is handled by updateElement during initial config
        if (!this.isConfiguring) {
            if (disabled) {
                this.detachListeners();
            } else {
                this.attachListeners();
            }
        }
    },

    updateElement: function(element, oldElement) {
        var me = this,
            // first check if the user configured a innerElement
            innerElement = me.getInnerElement(),
            fixedHBoxStretching = this.FixedHBoxStretching,
            listeners;

        if (!innerElement) {
            // if no configured scroller element, check if the first child has the
            // scrollerCls, if so we can assume that the user already wrapped the content
            // in a scrollerEl (this is true of both Ext and Touch Components).
            innerElement = element.dom.firstChild;

            if (fixedHBoxStretching && innerElement) {
                innerElement = innerElement.dom.firstChild;
            }

            if (!innerElement || innerElement.nodeType !== 1 ||
                    !Ext.fly(innerElement).hasCls(me.scrollerCls)) {
                // no scrollerEl found, generate one now
                innerElement = me.wrapContent(element);
            }

            me.setInnerElement(innerElement);
        }

        if (!fixedHBoxStretching) {
            element.addCls(me.cls);
        }

        if (me.isConfiguring) {
            if (!me.getTranslatable().isScrollParent) {
                // If using full virtual scrolling attach a mousewheel listener for moving
                // the scroll position.  Otherwise we use native scrolling when interacting
                // using the mouse and so do not want to override the native behavior
                listeners = me.elementListeners;
                listeners.mousewheel = 'onMouseWheel';
                listeners.scroll = {
                    fn: 'onElementScroll',
                    delegated: false,
                    scope: me
                };
            }
        }

        if (!me.getDisabled()) {
            me.attachListeners();
        }

        if (!me.isConfiguring) {
            // setting element after initial construction of Scroller
            // sync up configs that depend on element
            if (me.getAutoRefresh()) {
                me.toggleResizeListeners(true);
            }
            // setting null size and elementSize will cause them to be updated from the DOM
            me.setSize(null);
            me.setElementSize(null);
        }

        me.callParent([element, oldElement]);
    },

    updateFps: function(fps) {
        if (fps !== 'auto') {
            this.getTranslatable().setFps(fps);
        }
    },

    updateMaxUserPosition: function() {
        this.snapToBoundary();
    },

    updateMinUserPosition: function() {
        this.snapToBoundary();
    },

    updateInnerElement: function(innerElement) {
        if (innerElement) {
            innerElement.addCls(this.scrollerCls);
        }

        this.getTranslatable().setElement(innerElement);
    },

    updateSize: function() {
        if (!this.isConfiguring) {
            // to avoid multiple calls to refreshAxes() during initialization we will
            // call it once after initConfig has finished.
            this.refreshAxes();
        }
    },

    updateTranslatable: function(translatable) {
        translatable.setElement(this.getInnerElement());
        translatable.on({
            animationframe: 'onAnimationFrame',
            animationend: 'onAnimationEnd',
            scope: this
        });
    },

    updateX: function() {
        if (!this.isConfiguring) {
            // to avoid multiple calls to refreshAxes() during initialization we will
            // call it once after initConfig has finished.
            this.refreshAxes();
        }
    },

    updateY: function() {
        if (!this.isConfiguring) {
            // to avoid multiple calls to refreshAxes() during initialization we will
            // call it once after initConfig has finished.
            this.refreshAxes();
        }
    },

    privates: {
        attachListeners: function() {
            this.getElement().on(this.elementListeners);
        },

        constrainX: function(x) {
            return Math.min(this.getMaxPosition().x, Math.max(x, 0));
        },

        constrainY: function(y) {
            return Math.min(this.getMaxPosition().y, Math.max(y, 0));
        },

        // overridden in RTL mode to swap min/max momentum values
        convertEasingConfig: function(config) {
            return config;
        },

        detachListeners: function() {
            this.getElement().un(this.elementListeners);
        },

        // private
        doRefresh: function(options) {
            var me = this,
                size, elementSize;

            if (me.refreshCounter && me.getElement()) {
                me.stopAnimation();

                me.getTranslatable().refresh();

                if (options) {
                    // refresh called due to resize handler on element or innerElement.
                    // Do not bother to read the DOM to determine sizing info, just set the size
                    // given by the resize handler
                    size = options.size;
                    elementSize = options.elementSize;

                    if (size) {
                        me.setSize(size);
                    }

                    if (elementSize) {
                        me.setElementSize(elementSize);
                    }
                } else {
                    // calling doRefresh() without options will cause both size and
                    // elementSize to be measured from the DOM.
                    me.setSize(null);
                    me.setElementSize(null);
                }

                me.fireEvent('refresh', me);
                me.refreshCounter = 0;
            }
        },

        doScrollTo: function(x, y, animation, /* private */ allowOverscroll) {
            var me = this,
                isDragging = me.isDragging,
                fireScrollCallback;

            if (me.isDestroyed || !me.getElement()) {
                return me;
            }

            // Normally the scroll position is constrained to the max scroll position, but
            // during a drag operation or during reflectio the scroller is allowed to overscroll.
            allowOverscroll = allowOverscroll || me.isDragging;

            var translatable = me.getTranslatable(),
                position = me.position,
                positionChanged = false,
                translationX, translationY;

            if (!isDragging || me.isAxisEnabled('x')) {
                if (isNaN(x) || typeof x !== 'number') {
                    x = position.x;
                } else {

                    if (!allowOverscroll) {
                        x = me.constrainX(x);
                    }

                    if (position.x !== x) {
                        position.x = x;
                        positionChanged = true;
                    }
                }

                translationX = me.convertX(-x);
            }

            if (!isDragging || me.isAxisEnabled('y')) {
                if (isNaN(y) || typeof y !== 'number') {
                    y = position.y;
                } else {
                    if (!allowOverscroll) {
                        y = me.constrainY(y);
                    }

                    if (position.y !== y) {
                        position.y = y;
                        positionChanged = true;
                    }
                }

                translationY = -y;
            }

            if (positionChanged) {
                if (animation) {

                    // We need a callback to fire it after the animation
                    fireScrollCallback = function() {
                        me.onScroll();
                    };

                    // If they passed a boolean, create an object to hold the callback.
                    if (animation === true) {
                        animation = {
                            callback: fireScrollCallback
                        };
                    }
                    // They want a callback, so we need to create a sequence on it.
                    else if (animation.callback) {
                        animation.callback = Ext.Function.createSequence(animation.callback, fireScrollCallback);
                    }
                    // We can just use the callback for our own purpose
                    else {
                        animation.callback = fireScrollCallback;
                    }
                    translatable.translateAnimated(translationX, translationY, animation);
                }
                else {
                    translatable.translate(translationX, translationY);
                    me.onScroll();
                }
            }

            return me;
        },

        /**
         * @private
         */
        getAnimationEasing: function(axis, e) {
            if (!this.isAxisEnabled(axis)) {
                return null;
            }

            var me = this,
                currentPosition = me.position[axis],
                minPosition = me.getMinUserPosition()[axis],
                maxPosition = me.getMaxUserPosition()[axis],
                maxAbsVelocity = me.getMaxAbsoluteVelocity(),
                boundValue = null,
                dragEndTime = me.dragEndTime,
                velocity = e.flick.velocity[axis],
                isX = axis === 'x',
                easingConfig, easing;

            if (currentPosition < minPosition) {
                boundValue = minPosition;
            }
            else if (currentPosition > maxPosition) {
                boundValue = maxPosition;
            }

            if (isX) {
                currentPosition = me.convertX(currentPosition);
                boundValue = me.convertX(boundValue);
            }

            // Out of bound, to be pulled back
            if (boundValue !== null) {
                easing = me.getBounceEasing()[axis];
                easing.setConfig({
                    startTime: dragEndTime,
                    startValue: -currentPosition,
                    endValue: -boundValue
                });

                return easing;
            }

            if (velocity === 0) {
                return null;
            }

            if (velocity < -maxAbsVelocity) {
                velocity = -maxAbsVelocity;
            }
            else if (velocity > maxAbsVelocity) {
                velocity = maxAbsVelocity;
            }

            if (Ext.browser.is.IE) {
                velocity *= 2;
            }

            easing = me.getMomentumEasing()[axis];
            easingConfig = {
                startTime: dragEndTime,
                startValue: -currentPosition,
                startVelocity: velocity * 1.5,
                minMomentumValue: -maxPosition,
                maxMomentumValue: 0
            };

            if (isX) {
                me.convertEasingConfig(easingConfig);
            }

            easing.setConfig(easingConfig);

            return easing;
        },

        /**
         * @private
         * @return {Number/null}
         */
        getSnapPosition: function(axis) {
            var me = this,
                snapSize = me.getSlotSnapSize()[axis],
                snapPosition = null,
                position, snapOffset, maxPosition, mod;

            if (snapSize !== 0 && me.isAxisEnabled(axis)) {
                position = me.position[axis];
                snapOffset = me.getSlotSnapOffset()[axis];
                maxPosition = me.getMaxUserPosition()[axis];

                mod = Math.floor((position - snapOffset) % snapSize);

                if (mod !== 0) {
                    if (position !== maxPosition) {
                        if (Math.abs(mod) > snapSize / 2) {
                            snapPosition = Math.min(maxPosition, position + ((mod > 0) ? snapSize - mod : mod - snapSize));
                        }
                        else {
                            snapPosition = position - mod;
                        }
                    }
                    else {
                        snapPosition = position - mod;
                    }
                }
            }

            return snapPosition;
        },

        hideIndicators: function() {
            var me = this,
                indicators = me.getIndicators(),
                xIndicator, yIndicator;

            if (indicators) {
                if (me.isAxisEnabled('x')) {
                    xIndicator = indicators.x;
                    if (xIndicator) {
                        xIndicator.hide();
                    }
                }

                if (me.isAxisEnabled('y')) {
                    yIndicator = indicators.y;
                    if (yIndicator) {
                        yIndicator.hide();
                    }
                }
            }
        },

        /**
         * Returns `true` if a specified axis is enabled.
         * @private
         * @param {String} axis The axis to check (`x` or `y`).
         * @return {Boolean} `true` if the axis is enabled.
         */
        isAxisEnabled: function(axis) {
            this.getX();
            this.getY();

            return this.isAxisEnabledFlags[axis];
        },

        onAnimationEnd: function() {
            this.snapToBoundary();
            this.onScrollEnd();
        },

        onAnimationFrame: function(translatable, x, y) {
            var position = this.position;

            position.x = this.convertX(-x);
            position.y = -y;

            this.onScroll();
        },

        onAxisDrag: function(axis, delta) {
            if (!this.isAxisEnabled(axis)) {
                return;
            }

            var me = this,
                flickStartPosition = me.flickStartPosition,
                flickStartTime = me.flickStartTime,
                lastDragPosition = me.lastDragPosition,
                dragDirection = me.dragDirection,
                old = me.position[axis],
                min = me.getMinUserPosition()[axis],
                max = me.getMaxUserPosition()[axis],
                start = me.startPosition[axis],
                last = lastDragPosition[axis],
                current = start - delta,
                lastDirection = dragDirection[axis],
                restrictFactor = me.getOutOfBoundRestrictFactor(),
                startMomentumResetTime = me.getStartMomentumResetTime(),
                now = Ext.Date.now(),
                distance;

            if (current < min) {
                current *= restrictFactor;
            }
            else if (current > max) {
                distance = current - max;
                current = max + distance * restrictFactor;
            }

            if (current > last) {
                dragDirection[axis] = 1;
            }
            else if (current < last) {
                dragDirection[axis] = -1;
            }

            if ((lastDirection !== 0 && (dragDirection[axis] !== lastDirection)) ||
                    (now - flickStartTime[axis]) > startMomentumResetTime) {
                flickStartPosition[axis] = old;
                flickStartTime[axis] = now;
            }

            lastDragPosition[axis] = current;
        },

        // In "hybrid" touch scroll mode where the TouchScroller is used to control the
        // scroll position of a naturally overflowing element, we need to sync the scroll
        // position of the TouchScroller when the element is scrolled
        onDomScroll: function() {
            var me = this,
                dom, position;

            if (me.getTranslatable().isScrollParent) {
                dom = me.getElement().dom;
                position = me.position;

                position.x = dom.scrollLeft;
                position.y = dom.scrollTop;
            }
            me.callParent();
        },

        onDrag: function(e) {
            var me = this,
                lastDragPosition = me.lastDragPosition;

            if (!me.isDragging) {
                return;
            }

            me.onAxisDrag('x', me.convertX(e.deltaX));
            me.onAxisDrag('y', e.deltaY);

            me.doScrollTo(lastDragPosition.x, lastDragPosition.y);
        },

        onDragEnd: function(e) {
            var me = this,
                easingX, easingY;

            if (!me.isDragging) {
                return;
            }

            me.dragEndTime = Ext.Date.now();

            me.onDrag(e);

            me.isDragging = false;

            easingX = me.getAnimationEasing('x', e);
            easingY = me.getAnimationEasing('y', e);

            if (easingX || easingY) {
                me.getTranslatable().animate(easingX, easingY);
            } else {
                me.onScrollEnd();
            }
        },

        onDragStart: function(e) {
            var me = this,
                direction = me.getDirection(),
                absDeltaX = e.absDeltaX,
                absDeltaY = e.absDeltaY,
                directionLock = me.getDirectionLock(),
                startPosition = me.startPosition,
                flickStartPosition = me.flickStartPosition,
                flickStartTime = me.flickStartTime,
                lastDragPosition = me.lastDragPosition,
                currentPosition = me.position,
                dragDirection = me.dragDirection,
                x = currentPosition.x,
                y = currentPosition.y,
                now = Ext.Date.now();

            me.isDragging = true;

            if (directionLock && direction !== 'both') {
                if ((direction === 'horizontal' && absDeltaX > absDeltaY) ||
                    (direction === 'vertical' && absDeltaY > absDeltaX)) {
                    e.stopPropagation();
                }
                else {
                    me.isDragging = false;
                    return;
                }
            }

            lastDragPosition.x = x;
            lastDragPosition.y = y;

            flickStartPosition.x = x;
            flickStartPosition.y = y;

            startPosition.x = x;
            startPosition.y = y;

            flickStartTime.x = now;
            flickStartTime.y = now;

            dragDirection.x = 0;
            dragDirection.y = 0;

            me.dragStartTime = now;

            me.isDragging = true;

            me.onScrollStart();
        },

        onElementResize: function(element, info) {
            this.refresh(true, {
                elementSize: {
                    x: info.width,
                    y: info.height
                }
            });
        },

        onElementScroll: function(event, targetEl) {
            targetEl.scrollTop = targetEl.scrollLeft = 0;
        },

        onEvent: function(e) {
            // use browserEvent to get the "real" type of DOM event that was fired, not a
            // potentially translated (or recognized) type
            var me = this,
                browserEvent = e.browserEvent;

            if ((!me.self.isTouching || me.isTouching) && // prevents nested scrolling
                    // prevents scrolling in response to mouse input on multi-input devices
                    // such as windows 8 laptops with touch screens.
                    // Don't bother checking the event type if we are on a device that uses
                    // full virtual scrolling (!isScrollParent)
                    // TODO: this should be handled by the event system once EXTJSIV-12840
                    // is implemented
                    ((!me.getTranslatable().isScrollParent) || (!me.isMouseEvent[browserEvent.type] &&
                        browserEvent.pointerType !== 'mouse')) &&
                        (me.getY() || me.getX())) {
                me[me.listenerMap[e.type]](e);
            }
        },

        onIdle: function() {
            this.doRefresh();
        },

        onInnerElementResize: function(element, info) {
            this.refresh(true, {
                size: {
                    x: info.width,
                    y: info.height
                }
            });
        },

        onMouseWheel: function(e) {
            var me = this,
                delta = e.getWheelDeltas(),
                deltaX = -delta.x,
                deltaY = -delta.y,
                position = me.position,
                maxPosition = me.getMaxUserPosition(),
                minPosition = me.getMinUserPosition(),
                max = Math.max,
                min = Math.min,
                positionX = max(min(position.x + deltaX, maxPosition.x), minPosition.x),
                positionY = max(min(position.y + deltaY, maxPosition.y), minPosition.y);

            deltaX = positionX - position.x;
            deltaY = positionY - position.y;

            if (!deltaX && !deltaY) {
                return;
            }
            e.stopEvent();

            me.onScrollStart();
            me.scrollBy(deltaX, deltaY);
            me.onScroll();
            me.onScrollEnd();
        },

        onPartnerScrollEnd: function() {
            this.hideIndicators();
        },

        onPartnerScrollStart: function() {
            this.showIndicators();
        },

        onScroll: function() {
            var me = this,
                position = me.position,
                x = position.x,
                y = position.y,
                indicators = me.getIndicators(),
                xIndicator, yIndicator;

            if (indicators) {
                if (me.isAxisEnabled('x')) {
                    xIndicator = indicators.x;
                    if (xIndicator) {
                        xIndicator.setValue(x);
                    }
                }
                if (me.isAxisEnabled('y')) {
                    yIndicator = indicators.y;
                    if (yIndicator) {
                        yIndicator.setValue(y);
                    }
                }
            }

            me.fireScroll(x, y);
        },

        onScrollEnd: function() {
            var me = this,
                position = me.position;

            if (!me.isTouching && !me.snapToSlot()) {
                me.hideIndicators();
                Ext.isScrolling = false;
                me.fireScrollEnd(position.x, position.y);
            }
        },

        onScrollStart: function() {
            var me = this,
                position = me.position;

            me.showIndicators();

            Ext.isScrolling = true;
            me.fireScrollStart(position.x, position.y);
        },

        onTouchEnd: function() {
            var me = this;

            me.isTouching = me.self.isTouching = false;

            if (!me.isDragging && me.snapToSlot()) {
                me.onScrollStart();
            }
        },

        onTouchMove: function(e) {
            // Prevents the page from scrolling while an element is being scrolled using
            // the TouchScroller.  Only needed when inside a page that does not use a
            // Viewport, since the Viewport already prevents default behavior of touchmove
            e.preventDefault();
        },

        onTouchStart: function() {
            var me = this;

            me.isTouching = me.self.isTouching = true;

            Ext.getDoc().on({
                touchend: 'onTouchEnd',
                scope: me,
                single: true
            });

            me.stopAnimation();
        },

        refreshAxes: function() {
            var me = this,
                flags = me.isAxisEnabledFlags,
                size = me.getSize(),
                elementSize = me.getElementSize(),
                indicators = me.getIndicators(),
                maxX, maxY, x, y, xIndicator, yIndicator;

            if (!size || !elementSize) {
                return;
            }

            maxX = Math.max(0, size.x - elementSize.x);
            maxY = Math.max(0, size.y - elementSize.y);
            x = me.getX();
            y = me.getY();

            me.setMaxPosition({
                x: maxX,
                y: maxY
            });

            if (x === true || x === 'auto') {
                // auto scroll - axis is only enabled if the content is overflowing in the
                // same direction
                flags.x = !!maxX;
            } else if (x === false) {
                flags.x = false;
                xIndicator = indicators && indicators.x;
                if (xIndicator) {
                    // hide the x indicator if the x axis is disabled, just in case we
                    // are refreshing during a scroll
                    xIndicator.hide();
                }
            } else if (x === 'scroll') {
                flags.x = true;
            }

            if (y === true || y === 'auto') {
                // auto scroll - axis is only enabled if the content is overflowing in the
                // same direction
                flags.y = !!maxY;
            } else if (y === false) {
                flags.y = false;
                yIndicator = indicators && indicators.y;
                if (yIndicator) {
                    // hide the y indicator if the y axis is disabled, just in case we
                    // are refreshing during a scroll
                    yIndicator.hide();
                }
            } else if (y === 'scroll') {
                flags.y = true;
            }

            me.setMaxUserPosition({
                x: flags.x ? maxX : 0,
                y: flags.y ? maxY : 0
            });

            // If we are using regular DOM ovberflow scrolling, sync the element styles.
            if (Ext.supports.touchScroll === 1) {
                me.initXStyle();
                me.initYStyle();
            }
        },

        showIndicators: function() {
            var me = this,
                indicators = me.getIndicators(),
                xIndicator, yIndicator;

            if (indicators) {
                if (me.isAxisEnabled('x')) {
                    xIndicator = indicators.x;
                    if (xIndicator) {
                        xIndicator.show();
                    }
                }

                if (me.isAxisEnabled('y')) {
                    yIndicator = indicators.y;
                    if (yIndicator) {
                        yIndicator.show();
                    }
                }
            }
        },

        snapToBoundary: function() {
            if (this.isConfiguring) {
                return;
            }

            var me = this,
                position = me.position,
                minPosition = me.getMinUserPosition(),
                maxPosition = me.getMaxUserPosition(),
                minX = minPosition.x,
                minY = minPosition.y,
                maxX = maxPosition.x,
                maxY = maxPosition.y,
                x = Math.round(position.x),
                y = Math.round(position.y);

            if (x < minX) {
                x = minX;
            }
            else if (x > maxX) {
                x = maxX;
            }

            if (y < minY) {
                y = minY;
            }
            else if (y > maxY) {
                y = maxY;
            }

            me.doScrollTo(x, y);
        },

        /**
         * @private
         * @return {Boolean}
         */
        snapToSlot: function() {
            var me = this,
                snapX = me.getSnapPosition('x'),
                snapY = me.getSnapPosition('y'),
                easing = me.getSlotSnapEasing();

            if (snapX !== null || snapY !== null) {
                me.doScrollTo(snapX, snapY, {
                    easingX: easing.x,
                    easingY: easing.y
                });

                return true;
            }

            return false;
        },

        /**
         * @private
         * Stops the animation of the scroller at any time.
         */
        stopAnimation: function() {
            this.getTranslatable().stopAnimation();
        },

        toggleResizeListeners: function(on) {
            var me = this,
                element = me.getElement(),
                method = on ? 'on' : 'un';

            if (element) {
                element[method]('resize', 'onElementResize', me);
                me.getInnerElement()[method]('resize', 'onInnerElementResize', me);
            }
        },

        unwrapContent: function() {
            var innerDom = this.getInnerElement().dom,
                dom = this.getElement().dom,
                child;

            while ((child = innerDom.firstChild)) {
                dom.insertBefore(child, innerDom);
            }
        },

        /**
         * Wraps the element's content in a innerElement
         * @param {Ext.dom.Element} element
         * @return {Ext.dom.Element} the innerElement
         * @private
         */
        wrapContent: function(element) {
            var wrap = document.createElement('div'),
                dom = element.dom,
                child;

            while (child = dom.lastChild) { // jshint ignore:line
                wrap.insertBefore(child, wrap.firstChild);
            }

            dom.appendChild(wrap);

            this.setInnerElement(wrap);

            // Set a flag that indiacates the element's content was not already pre-wrapped
            // when the scroller was instanced.  This means we had to wrap the content
            // and so must unwrap when we destroy the scroller.
            this._isWrapped = true;

            return this.getInnerElement();
        }
    }
});
