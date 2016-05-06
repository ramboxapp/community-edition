/**
 * @private
 * Flyweight object to process the attributes of a sprite.
 * A single instance of the AttributeDefinition is created per sprite class.
 * See `onClassCreated` and `onClassExtended` callbacks
 * of the {@link Ext.draw.sprite.Sprite} for more info.
 */
Ext.define('Ext.draw.sprite.AttributeDefinition', {
    requires: [
        'Ext.draw.sprite.AttributeParser',
        'Ext.draw.sprite.AnimationParser'
    ],

    config: {
        /**
         * @cfg {Object} defaults Defines the default values of attributes.
         */
        defaults: {},

        /**
         * @cfg {Object} aliases Defines the alternative names for attributes.
         */
        aliases: {},

        /**
         * @cfg {Object} animationProcessors Defines the process used to animate between attributes.
         * One doesn't have to define animation processors for sprite attributes that use
         * predefined {@link #processors} from the {@link Ext.draw.sprite.AttributeParser} singleton.
         * For such attributes matching animation processors from the {@link Ext.draw.sprite.AnimationParser}
         * singleton will be used automatically.
         * However, if you have a custom processor for an attribute that should support
         * animation, you must provide a corresponding animation processor for it here.
         * For more information on animation processors please see {@link Ext.draw.sprite.AnimationParser}
         * documentation.
         */
        animationProcessors: {},

        /**
         * @cfg {Object} processors Defines the preprocessing used on the attributes.
         * One can define a custom processor function here or use the name of a predefined
         * processor from the {@link Ext.draw.sprite.AttributeParser} singleton.
         */
        processors: {},

        /**
         * @cfg {Object} dirtyTriggers
         * @deprecated Use the {@link #triggers} config instead.
         */
        dirtyTriggers: {},

        /**
         * @cfg {Object} triggers Defines which updaters have to be called when an attribute is changed.
         * For example, the config below indicates that the 'size' updater
         * of a {@link Ext.draw.sprite.Square square} sprite has to be called
         * when the 'size' attribute changes.
         *
         *     triggers: {
         *         size: 'size'   // Use comma-separated values here if multiple updaters have to be called.
         *     }                  // Note that the order is _not_ guaranteed.
         *
         * If any of the updaters to be called (triggered by the {@link Ext.draw.sprite.Sprite#setAttributes call)
         * set attributes themselves and those attributes have triggers defined for them,
         * then their updaters will be called after all current updaters finish execution.
         *
         * The updater functions themselves are defined in the {@link #updaters} config,
         * aside from the 'canvas' updater, which doesn't have to be defined and acts as a flag,
         * indicating that this attribute should be applied to a Canvas context (or whatever emulates it).
         * @since 5.1.0
         */
        triggers: {},

        /**
         * @cfg {Object} updaters Defines the postprocessing used by the attribute.
         * Inside the updater function 'this' refers to the sprite that the attributes belong to.
         * In case of an instancing sprite 'this' will refer to the instancing template.
         * The two parameters passed to the updater function are the attributes object
         * of the sprite or instance, and the names of attributes that triggered this updater call.
         *
         * The example below shows how the 'size' updater changes other attributes
         * of a {@link Ext.draw.sprite.Square square} sprite sprite when its 'size' attribute changes.
         *
         *     updaters: {
         *         size: function (attr) {
         *             var size = attr.size;
         *             this.setAttributes({   // Changes to these attributes will trigger the 'path' updater.
         *                 x: attr.x - size,
         *                 y: attr.y - size,
         *                 height: 2 * size,
         *                 width: 2 * size
         *             });
         *         }
         *     }
         */
        updaters: {}
    },

    inheritableStatics: {
        /**
         * @private
         * Processor declaration in the form of 'processorFactory(argument1,argument2,...)'.
         * E.g.: {@link Ext.draw.sprite.AttributeParser#enums enums},
         * {@link Ext.draw.sprite.AttributeParser#limited limited}.
         */
        processorFactoryRe: /^(\w+)\(([\w\-,]*)\)$/
    },

    constructor: function (config) {
        var me = this;
        me.initConfig(config);
    },

    applyDefaults: function (defaults, oldDefaults) {
        oldDefaults = Ext.apply(oldDefaults || {}, this.normalize(defaults));
        return oldDefaults;
    },

    applyAliases: function (aliases, oldAliases) {
        return Ext.apply(oldAliases || {}, aliases);
    },

    applyProcessors: function (processors, oldProcessors) {
        this.getAnimationProcessors(); // Apply custom animation processors first.
        var result = oldProcessors || {},
            defaultProcessor = Ext.draw.sprite.AttributeParser,
            processorFactoryRe = this.self.processorFactoryRe,
            animationProcessors = {},
            anyAnimationProcessors,
            name, match, fn;

        for (name in processors) {
            fn = processors[name];
            if (!Ext.isFunction(fn)) {
                if (Ext.isString(fn)) {
                    match = fn.match(processorFactoryRe);
                    if (match) {
                        fn = defaultProcessor[match[1]].apply(defaultProcessor, match[2].split(','));
                    } else {
                        // Names of animation parsers match the names of attribute parsers.
                        animationProcessors[name] = fn;
                        anyAnimationProcessors = true;
                        fn = defaultProcessor[fn];
                    }
                } else {
                    continue;
                }
            }
            result[name] = fn;
        }

        if (anyAnimationProcessors) {
            this.setAnimationProcessors(animationProcessors);
        }

        return result;
    },

    applyAnimationProcessors: function (animationProcessors, oldAnimationProcessors) {
        var parser = Ext.draw.sprite.AnimationParser,
            name, item;

        if (!oldAnimationProcessors) {
            oldAnimationProcessors = {};
        }

        for (name in animationProcessors) {
            item = animationProcessors[name];
            if (item === 'none') {
                oldAnimationProcessors[name] = null;
            } else if (Ext.isString(item) && !(name in oldAnimationProcessors)) {
                if (item in parser) {
                    // The while loop is used to resolve aliases, e.g. `num: 'number'`,
                    // where `number` maps to a parser object or is an alias too.
                    while (Ext.isString(parser[item])) {
                        item = parser[item];
                    }
                    oldAnimationProcessors[name] = parser[item];
                }
            } else if (Ext.isObject(item)) {
                oldAnimationProcessors[name] = item;
            }
        }
        return oldAnimationProcessors;
    },

    updateDirtyTriggers: function (dirtyTriggers) {
        this.setTriggers(dirtyTriggers);
    },

    applyTriggers: function (triggers, oldTriggers) {
        if (!oldTriggers) {
            oldTriggers = {};
        }
        for (var name in triggers) {
            oldTriggers[name] = triggers[name].split(',');
        }
        return oldTriggers;
    },

    applyUpdaters: function (updaters, oldUpdaters) {
        return Ext.apply(oldUpdaters || {}, updaters);
    },

    batchedNormalize: function (batchedChanges, keepUnrecognized) {
        if (!batchedChanges) {
            return {};
        }
        var definition = this,
            processors = definition.getProcessors(),
            aliases = definition.getAliases(),
            translation = batchedChanges.translation || batchedChanges.translate,
            normalized = {},
            i, ln, name, val,
            rotation, scaling,
            matrix, subVal, split;

        if ('rotation' in batchedChanges) {
            rotation = batchedChanges.rotation;
        } else {
            rotation = ('rotate' in batchedChanges) ? batchedChanges.rotate : undefined;
        }

        if ('scaling' in batchedChanges) {
            scaling = batchedChanges.scaling;
        } else {
            scaling = ('scale' in batchedChanges) ? batchedChanges.scale : undefined;
        }

        if (typeof scaling !== 'undefined') {
            if (Ext.isNumber(scaling)) {
                normalized.scalingX = scaling;
                normalized.scalingY = scaling;
            } else {
                if ('x' in scaling) {
                    normalized.scalingX = scaling.x;
                }
                if ('y' in scaling) {
                    normalized.scalingY = scaling.y;
                }
                if ('centerX' in scaling) {
                    normalized.scalingCenterX = scaling.centerX;
                }
                if ('centerY' in scaling) {
                    normalized.scalingCenterY = scaling.centerY;
                }
            }
        }

        if (typeof rotation !== 'undefined') {
            if (Ext.isNumber(rotation)) {
                rotation = Ext.draw.Draw.rad(rotation);
                normalized.rotationRads = rotation;
            } else {
                if ('rads' in rotation) {
                    normalized.rotationRads = rotation.rads;
                } else if ('degrees' in rotation) {
                    if (Ext.isArray(rotation.degrees)) {
                        normalized.rotationRads = Ext.Array.map(rotation.degrees, function (deg) {
                            return Ext.draw.Draw.rad(deg);
                        });
                    } else {
                        normalized.rotationRads = Ext.draw.Draw.rad(rotation.degrees);
                    }
                }
                if ('centerX' in rotation) {
                    normalized.rotationCenterX = rotation.centerX;
                }
                if ('centerY' in rotation) {
                    normalized.rotationCenterY = rotation.centerY;
                }
            }
        }
        if (typeof translation !== 'undefined') {
            if ('x' in translation) {
                normalized.translationX = translation.x;
            }
            if ('y' in translation) {
                normalized.translationY = translation.y;
            }
        }

        if ('matrix' in batchedChanges) {
            matrix = Ext.draw.Matrix.create(batchedChanges.matrix);
            split = matrix.split();

            normalized.matrix = matrix;
            normalized.rotationRads = split.rotation;
            normalized.rotationCenterX = 0;
            normalized.rotationCenterY = 0;
            normalized.scalingX = split.scaleX;
            normalized.scalingY = split.scaleY;
            normalized.scalingCenterX = 0;
            normalized.scalingCenterY = 0;
            normalized.translationX = split.translateX;
            normalized.translationY = split.translateY;
        }

        for (name in batchedChanges) {
            val = batchedChanges[name];
            if (typeof val === 'undefined') {
                continue;
            } else if (Ext.isArray(val)) {
                if (name in aliases) {
                    name = aliases[name];
                }
                if (name in processors) {
                    normalized[name] = [];
                    for (i = 0, ln = val.length; i < ln; i++) {
                        subVal = processors[name].call(this, val[i]);
                        if (typeof subVal !== 'undefined') {
                            normalized[name][i] = subVal;
                        }
                    }
                } else if (keepUnrecognized){
                    normalized[name] = val;
                }
            } else {
                if (name in aliases) {
                    name = aliases[name];
                }
                if (name in processors) {
                    val = processors[name].call(this, val);
                    if (typeof val !== 'undefined') {
                        normalized[name] = val;
                    }
                } else if (keepUnrecognized){
                    normalized[name] = val;
                }
            }
        }
        return normalized;
    },

    /**
     * Normalizes the changes given via their processors before they are applied as attributes.
     *
     * @param {Object} changes The changes given.
     * @param {Boolean} keepUnrecognized If 'true', unknown attributes will be passed through as normalized values.
     * @return {Object} The normalized values.
     */
    normalize: function (changes, keepUnrecognized) {
        if (!changes) {
            return {};
        }
        var definition = this,
            processors = definition.getProcessors(),
            aliases = definition.getAliases(),
            translation = changes.translation || changes.translate,
            normalized = {},
            name, val, rotation, scaling, matrix, split;

        if ('rotation' in changes) {
            rotation = changes.rotation;
        } else {
            rotation = ('rotate' in changes) ? changes.rotate : undefined;
        }

        if ('scaling' in changes) {
            scaling = changes.scaling;
        } else {
            scaling = ('scale' in changes) ? changes.scale : undefined;
        }

        if (translation) {
            if ('x' in translation) {
                normalized.translationX = translation.x;
            }
            if ('y' in translation) {
                normalized.translationY = translation.y;
            }
        }

        if (typeof scaling !== 'undefined') {
            if (Ext.isNumber(scaling)) {
                normalized.scalingX = scaling;
                normalized.scalingY = scaling;
            } else {
                if ('x' in scaling) {
                    normalized.scalingX = scaling.x;
                }
                if ('y' in scaling) {
                    normalized.scalingY = scaling.y;
                }
                if ('centerX' in scaling) {
                    normalized.scalingCenterX = scaling.centerX;
                }
                if ('centerY' in scaling) {
                    normalized.scalingCenterY = scaling.centerY;
                }
            }
        }

        if (typeof rotation !== 'undefined') {
            if (Ext.isNumber(rotation)) {
                rotation = Ext.draw.Draw.rad(rotation);
                normalized.rotationRads = rotation;
            } else {
                if ('rads' in rotation) {
                    normalized.rotationRads = rotation.rads;
                } else if ('degrees' in rotation) {
                    normalized.rotationRads = Ext.draw.Draw.rad(rotation.degrees);
                }
                if ('centerX' in rotation) {
                    normalized.rotationCenterX = rotation.centerX;
                }
                if ('centerY' in rotation) {
                    normalized.rotationCenterY = rotation.centerY;
                }
            }
        }

        if ('matrix' in changes) {
            matrix = Ext.draw.Matrix.create(changes.matrix);
            split = matrix.split();

            normalized.matrix = matrix;
            normalized.rotationRads = split.rotation;
            normalized.rotationCenterX = 0;
            normalized.rotationCenterY = 0;
            normalized.scalingX = split.scaleX;
            normalized.scalingY = split.scaleY;
            normalized.scalingCenterX = 0;
            normalized.scalingCenterY = 0;
            normalized.translationX = split.translateX;
            normalized.translationY = split.translateY;
        }

        for (name in changes) {
            val = changes[name];
            if (typeof val === 'undefined') {
                continue;
            }
            if (name in aliases) {
                name = aliases[name];
            }
            if (name in processors) {
                val = processors[name].call(this, val);
                if (typeof val !== 'undefined') {
                    normalized[name] = val;
                }
            } else if (keepUnrecognized){
                normalized[name] = val;
            }
        }
        return normalized;
    },

    setBypassingNormalization: function (attr, modifierStack, changes) {
        return modifierStack.pushDown(attr, changes);
    },

    set: function (attr, modifierStack, changes) {
        changes = this.normalize(changes);
        return this.setBypassingNormalization(attr, modifierStack, changes);
    }
});