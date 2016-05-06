/**
 * The Animation modifier.
 *
 * Sencha Charts allow users to use transitional animation on sprites. Simply set the duration
 * and easing in the animation modifier, then all the changes to the sprites will be animated.
 *
 * Also, you can use different durations and easing functions on different attributes by using
 * {@link #customDurations} and {@link #customEasings}.
 *
 * By default, an animation modifier will be created during the initialization of a sprite.
 * You can get the animation modifier of a sprite via `sprite.fx`.
 *
 */
Ext.define('Ext.draw.modifier.Animation', {
    requires: [
        'Ext.draw.TimingFunctions',
        'Ext.draw.Animator'
    ],
    extend: 'Ext.draw.modifier.Modifier',
    alias: 'modifier.animation',

    config: {
        /**
         * @cfg {Function} easing
         * Default easing function.
         */
        easing: function (x) {
            return x;
        },

        /**
         * @cfg {Number} duration
         * Default duration time (ms).
         */
        duration: 0,

        /**
         * @cfg {Object} customEasings Overrides the default easing function for defined attributes. E.g.:
         *
         *     // Assuming the sprite the modifier is applied to is a 'circle'.
         *     customEasings: {
         *         r: 'easeOut',
         *         'fillStyle,strokeStyle': 'linear',
         *         'cx,cy': function (p, n) {
         *             p = 1 - p;
         *             n = n || 1.616;
         *             return 1 - p * p * ((n + 1) * p - n);
         *         }
         *     }
         */
        customEasings: {},

        /**
         * @cfg {Object} customDurations Overrides the default duration for defined attributes. E.g.:
         *
         *     // Assuming the sprite the modifier is applied to is a 'circle'.
         *     customDurations: {
         *         r: 1000,
         *         'fillStyle,strokeStyle': 2000,
         *         'cx,cy': 1000
         *     }
         */
        customDurations: {},

        /**
         * @deprecated Use {@link #customDurations} instead.
         */
        customDuration: null
    },

    constructor: function () {
        this.anyAnimation = false;
        this.anySpecialAnimations = false;
        this.animating = 0;
        this.animatingPool = [];
        this.callParent(arguments);
    },

    /**
     * @inheritdoc
     */
    prepareAttributes: function (attr) {
        if (!attr.hasOwnProperty('timers')) {
            attr.animating = false;
            attr.timers = {};
            // The animationOriginal object is used to hold the target values for the
            // attributes while they are being animated from source to target values.
            // The animationOriginal is pushed down to the lower level modifiers,
            // instead of the actual attr object, to hide the fact that the
            // attributes are being animated.
            attr.animationOriginal = Ext.Object.chain(attr);
            attr.animationOriginal.prototype = attr;
        }
        if (this._previous) {
            this._previous.prepareAttributes(attr.animationOriginal);
        }
    },

    updateSprite: function (sprite) {
        this.setConfig(sprite.config.fx);
    },

    updateDuration: function (duration) {
        this.anyAnimation = duration > 0;
    },

    applyEasing: function (easing) {
        if (typeof easing === 'string') {
            return Ext.draw.TimingFunctions.easingMap[easing];
        } else {
            return easing;
        }
    },

    applyCustomEasings: function (newEasings, oldEasings) {
        oldEasings = oldEasings || {};
        var any, key, attrs, easing, i, ln;

        for (key in newEasings) {
            any = true;
            easing = newEasings[key];
            attrs = key.split(',');
            if (typeof easing === 'string') {
                easing = Ext.draw.TimingFunctions.easingMap[easing];
            }
            for (i = 0, ln = attrs.length; i < ln; i++) {
                oldEasings[attrs[i]] = easing;
            }
        }
        if (any) {
            this.anySpecialAnimations = any;
        }
        return oldEasings;
    },

    /**
     * Set special easings on the given attributes. E.g.:
     *
     *     circleSprite.fx.setEasingOn('r', 'elasticIn');
     *
     * @param {String/Array} attrs The source attribute(s).
     * @param {String} easing The special easings.
     */
    setEasingOn: function (attrs, easing) {
        attrs = Ext.Array.from(attrs).slice();
        var customEasings = {},
            ln = attrs.length,
            i = 0;

        for (; i < ln; i++) {
            customEasings[attrs[i]] = easing;
        }
        this.setCustomEasings(customEasings);
    },

    /**
     * Remove special easings on the given attributes.
     * @param {String/Array} attrs The source attribute(s).
     */
    clearEasingOn: function (attrs) {
        attrs = Ext.Array.from(attrs, true);
        var i = 0, ln = attrs.length;
        for (; i < ln; i++) {
            delete this._customEasings[attrs[i]];
        }
    },

    applyCustomDurations: function (newDurations, oldDurations) {
        oldDurations = oldDurations || {};
        var any, key, duration, attrs, i, ln;

        for (key in newDurations) {
            any = true;
            duration = newDurations[key];
            attrs = key.split(',');
            for (i = 0, ln = attrs.length; i < ln; i++) {
                oldDurations[attrs[i]] = duration;
            }
        }
        if (any) {
            this.anySpecialAnimations = any;
        }
        return oldDurations;
    },

    /**
     * @private
     * @deprecated
     * @since 5.0.1.
     */
    applyCustomDuration: function (newDuration, oldDuration) {
        if (newDuration) {
            this.getCustomDurations();
            this.setCustomDurations(newDuration);
            //<debug>
            Ext.log.warn("'customDuration' config is deprecated. Use 'customDurations' config instead.");
            //</debug>
        }
    },

    /**
     * Set special duration on the given attributes. E.g.:
     *
     *     rectSprite.fx.setDurationOn('height', 2000);
     *
     * @param {String/Array} attrs The source attributes.
     * @param {Number} duration The special duration.
     */
    setDurationOn: function (attrs, duration) {
        attrs = Ext.Array.from(attrs).slice();
        var customDurations = {},
            i = 0,
            ln = attrs.length;

        for (; i < ln; i++) {
            customDurations[attrs[i]] = duration;
        }
        this.setCustomDurations(customDurations);
    },

    /**
     * Remove special easings on the given attributes.
     * @param {Object} attrs The source attributes.
     */
    clearDurationOn: function (attrs) {
        attrs = Ext.Array.from(attrs, true);
        var i = 0, ln = attrs.length;

        for (; i < ln; i++) {
            delete this._customDurations[attrs[i]];
        }
    },

    /**
     * @private
     * Initializes Animator for the animation.
     * @param {Object} attr The source attributes.
     * @param {Boolean} animating The animating flag.
     */
    setAnimating: function (attr, animating) {
        var me = this,
            pool = me.animatingPool;

        if (attr.animating !== animating) {
            attr.animating = animating;
            if (animating) {
                pool.push(attr);
                if (me.animating === 0) {
                    Ext.draw.Animator.add(me);
                }
                me.animating++;
            } else {
                for (var i = pool.length; i--;) {
                    if (pool[i] === attr) {
                        pool.splice(i, 1);
                    }
                }
                me.animating = pool.length;
            }
        }
    },

    /**
     * @private
     * Set the attr with given easing and duration.
     * @param {Object} attr The attributes collection.
     * @param {Object} changes The changes that popped up from lower modifier.
     * @return {Object} The changes to pop up.
     */
    setAttrs: function (attr, changes) {
        var timers = attr.timers,
            parsers = this._sprite.self.def._animationProcessors,
            defaultEasing = this._easing,
            defaultDuration = this._duration,
            customDurations = this._customDurations,
            customEasings = this._customEasings,
            anySpecial = this.anySpecialAnimations,
            any = this.anyAnimation || anySpecial,
            animationOriginal = attr.animationOriginal,
            ignite = false,
            timer, name, newValue, startValue, parser, easing, duration;

        if (!any) {
            // If there is no animation enabled
            // When applying changes to attributes, simply stop current animation
            // and set the value.
            for (name in changes) {
                if (attr[name] === changes[name]) {
                    delete changes[name];
                } else {
                    attr[name] = changes[name];
                }
                delete animationOriginal[name];
                delete timers[name];
            }
            return changes;
        } else {
            // If any animation
            for (name in changes) {
                newValue = changes[name];
                startValue = attr[name];
                if (newValue !== startValue && startValue !== undefined && startValue !== null && (parser = parsers[name])) {
                    // If this property is animating.

                    // Figure out the desired duration and easing.
                    easing = defaultEasing;
                    duration = defaultDuration;
                    if (anySpecial) {
                        // Deducing the easing function and duration
                        if (name in customEasings) {
                            easing = customEasings[name];
                        }
                        if (name in customDurations) {
                            duration = customDurations[name];
                        }
                    }

                    // Transitions betweens color and gradient or between gradients are not supported.
                    if (startValue && startValue.isGradient || newValue && newValue.isGradient) {
                        duration = 0;
                    }

                    // If the property is animating
                    if (duration) {
                        if (!timers[name]) {
                            timers[name] = {};
                        }

                        timer = timers[name];
                        timer.start = 0;
                        timer.easing = easing;
                        timer.duration = duration;
                        timer.compute = parser.compute;
                        timer.serve = parser.serve || Ext.identityFn;
                        timer.remove = changes.removeFromInstance && changes.removeFromInstance[name];

                        if (parser.parseInitial) {
                            var initial = parser.parseInitial(startValue, newValue);
                            timer.source = initial[0];
                            timer.target = initial[1];
                        } else if (parser.parse) {
                            timer.source = parser.parse(startValue);
                            timer.target = parser.parse(newValue);
                        } else {
                            timer.source = startValue;
                            timer.target = newValue;
                        }
                        // The animation started. Change to originalVal.
                        animationOriginal[name] = newValue;
                        delete changes[name];
                        ignite = true;
                        continue;
                    } else {
                        delete animationOriginal[name];
                    }
                } else {
                    delete animationOriginal[name];
                }

                // If the property is not animating.
                delete timers[name];
            }
        }

        if (ignite && !attr.animating) {
            this.setAnimating(attr, true);
        }

        return changes;
    },

    /**
     * @private
     *
     * Update attributes to current value according to current animation time.
     * This method will not affect the values of lower layers, but may delete a
     * value from it.
     * @param {Object} attr The source attributes.
     * @return {Object} The changes to pop up.
     */
    updateAttributes: function (attr) {
        if (!attr.animating) {
            return {};
        }
        var changes = {},
            any = false,
            timers = attr.timers,
            animationOriginal = attr.animationOriginal,
            now = Ext.draw.Animator.animationTime(),
            name, timer, delta;

        // If updated in the same frame, return.
        if (attr.lastUpdate === now) {
            return {};
        }

        for (name in timers) {
            timer = timers[name];
            if (!timer.start) {
                timer.start = now;
                delta = 0;
            } else {
                delta = (now - timer.start) / timer.duration;
            }
            if (delta >= 1) {
                changes[name] = animationOriginal[name];
                delete animationOriginal[name];
                if (timers[name].remove) {
                    changes.removeFromInstance = changes.removeFromInstance || {};
                    changes.removeFromInstance[name] = true;
                }
                delete timers[name];
            } else {
                changes[name] = timer.serve(timer.compute(timer.source, timer.target, timer.easing(delta), attr[name]));
                any = true;
            }
        }
        attr.lastUpdate = now;
        this.setAnimating(attr, any);
        return changes;
    },

    /**
     * @inheritdoc
     */
    pushDown: function (attr, changes) {
        changes = this.callParent([attr.animationOriginal, changes]);
        return this.setAttrs(attr, changes);
    },

    /**
     * @inheritdoc
     */
    popUp: function (attr, changes) {
        attr = attr.prototype;
        changes = this.setAttrs(attr, changes);
        if (this._next) {
            return this._next.popUp(attr, changes);
        } else {
            return Ext.apply(attr, changes);
        }
    },

    // This is called as an animated object in `Ext.draw.Animator`.
    step: function (frameTime) {
        var me = this,
            pool = me.animatingPool.slice(),
            attributes,
            i, ln;

        for (i = 0, ln = pool.length; i < ln; i++) {
            attributes = pool[i];
            var changes = this.updateAttributes(attributes),
                name;

            // Looking for anything in changes
            //noinspection LoopStatementThatDoesntLoopJS
            for (name in changes) {
                if (this._next) {
                    this._next.popUp(attributes, changes);
                }
                break;
            }
        }
    },

    /**
     * Stop all animations affected by this modifier.
     */
    stop: function () {
        this.step();

        var me = this,
            pool = me.animatingPool,
            i, ln;

        for (i = 0, ln = pool.length; i < ln; i++) {
            pool[i].animating = false;
        }
        me.animatingPool.length = 0;
        me.animating = 0;
        Ext.draw.Animator.remove(me);
    },

    destroy: function () {
        var me = this;
        me.animatingPool.length = 0;
        me.animating = 0;
    }
});
