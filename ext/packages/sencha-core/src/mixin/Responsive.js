/**
 * This mixin provides its user with a `responsiveConfig` config that allows the class
 * to conditionally control config properties.
 *
 * For example:
 *
 *      Ext.define('ResponsiveClass', {
 *          mixin: [
 *              'Ext.mixin.Responsive'
 *          ],
 *
 *          responsiveConfig: {
 *              portrait: {
 *              },
 *
 *              landscape: {
 *              }
 *          }
 *      });
 *
 * For a config to participate as a responsiveConfig it must have a "setter" method. In
 * the below example, a "setRegion" method must exist.
 *
 *      Ext.create({
 *          xtype: 'viewport',
 *          layout: 'border',
 *
 *          items: [{
 *              title: 'Some Title',
 *              plugins: 'responsive',
 *
 *              responsiveConfig: {
 *                  'width < 800': {
 *                      region: 'north'
 *                  },
 *                  'width >= 800': {
 *                      region: 'west'
 *                  }
 *              }
 *          }]
 *      });
 *
 * To use responsiveConfig the class must be defined using the Ext.mixin.Responsive mixin.
 *
 *      Ext.define('App.view.Foo', {
 *          extend: 'Ext.panel.Panel',
 *          xtype: 'foo',
 *          mixins: [
 *               'Ext.mixin.Responsive'
 *          ],
 *          ...
 *      });
 *
 * Otherwise, you will need to use the responsive plugin if the class is not one you authored.
 *
 *      Ext.create('Ext.panel.Panel', {
 *          renderTo: document.body,
 *          plugins: 'responsive',
 *          ...
 *      });
 * 
 *  _Note:_ There is the exception of `Ext.container.Viewport` or other classes using `Ext.plugin.Viewport`.
 *  In those cases, the viewport plugin inherits from `Ext.plugin.Responsive`.
 *
 * For details see `{@link #responsiveConfig}`.
 * @since 5.0.0
 */
Ext.define('Ext.mixin.Responsive', function (Responsive) { return {
    extend: 'Ext.Mixin',
    requires: [
        'Ext.GlobalEvents'
    ],

    mixinConfig: {
        id: 'responsive',

        after: {
            destroy: 'destroy'
        }
    },

    config: {
        /**
         * @cfg {Object} responsiveConfig
         * This object consists of keys that represent the conditions on which configs
         * will be applied. For example:
         *
         *      responsiveConfig: {
         *          landscape: {
         *              region: 'west'
         *          },
         *          portrait: {
         *              region: 'north'
         *          }
         *      }
         *
         * In this case the keys ("landscape" and "portrait") are the criteria (or "rules")
         * and the object to their right contains the configs that will apply when that
         * rule is true.
         *
         * These rules can be any valid JavaScript expression but the following values
         * are considered in scope:
         *
         *  * `landscape` - True if the device orientation is landscape (always `true` on
         *   desktop devices).
         *  * `portrait` - True if the device orientation is portrait (always `false` on
         *   desktop devices).
         *  * `tall` - True if `width` < `height` regardless of device type.
         *  * `wide` - True if `width` > `height` regardless of device type.
         *  * `width` - The width of the viewport
         *  * `height` - The height of the viewport.
         *  * `platform` - An object containing various booleans describing the platform
         *  (see `{@link Ext#platformTags Ext.platformTags}`). The properties of this
         *  object are also available implicitly (without "platform." prefix) but this
         *  sub-object may be useful to resolve ambiguity (for example, if one of the
         *  `{@link #responsiveFormulas}` overlaps and hides any of these properties).
         *  Previous to Ext JS 5.1, the `platformTags` were only available using this
         *  prefix.
         *
         * A more complex example:
         *
         *      responsiveConfig: {
         *          'desktop || width > 800': {
         *              region: 'west'
         *          },
         *
         *          '!(desktop || width > 800)': {
         *              region: 'north'
         *          }
         *      }
         *
         * **NOTE**: If multiple rules set a single config (like above), it is important
         * that the rules be mutually exclusive. That is, only one rule should set each
         * config. If multiple rules are actively setting a single config, the order of
         * these (and therefore the config's value) is unspecified.
         *
         * For a config to participate as a `responsiveConfig` it must have a "setter"
         * method. In the above example, a "setRegion" method must exist.
         *
         * @since 5.0.0
         */
        responsiveConfig: {
            $value: undefined,

            merge:  function (newValue, oldValue, target, mixinClass) {
                if (!newValue) {
                    return oldValue;
                }

                var ret = oldValue ? Ext.Object.chain(oldValue) : {},
                    rule;

                for (rule in newValue) {
                    if (!mixinClass || !(rule in ret)) {
                        ret[rule] = {
                            fn: null, // created on first evaluation of this rule
                            config: newValue[rule]
                        };
                    }
                }

                return ret;
            }
        },

        /**
         * @cfg {Object} responsiveFormulas
         * It is common when using `responsiveConfig` to have recurring expressions that
         * make for complex configurations. Using `responsiveFormulas` allows you to cut
         * down on this repetition by adding new properties to the "scope" for the rules
         * in a `responsiveConfig`.
         *
         * For example:
         *
         *      Ext.define('MyApp.view.main.Main', {
         *          extend: 'Ext.container.Container',
         *
         *          mixins: [
         *              'Ext.mixin.Responsive'
         *          ],
         *
         *          responsiveFormulas: {
         *              small: 'width < 600',
         *
         *              medium: 'width >= 600 && width < 800',
         *
         *              large: 'width >= 800',
         *
         *              tuesday: function (context) {
         *                  return (new Date()).getDay() === 2;
         *              }
         *          }
         *      });
         *
         * With the above declaration, any `responsiveConfig` can now use these values
         * like so:
         *
         *      responsiveConfig: {
         *          small: {
         *              hidden: true
         *          },
         *          medium: {
         *              hidden: false,
         *              region: 'north'
         *          },
         *          large: {
         *              hidden: false,
         *              region: 'west'
         *          }
         *      }
         *
         * @since 5.0.1
         */
        responsiveFormulas: {
            $value: 0,

            merge: function (newValue, oldValue, target, mixinClass) {
                return this.mergeNew(newValue, oldValue, target, mixinClass);
            }
        }
    },

    /**
     * This method removes this instance from the Responsive collection.
     */
    destroy: function () {
        Responsive.unregister(this);
        this.callParent();
    },

    privates: {
        statics: {
            /**
             * @property {Boolean} active
             * @static
             * @private
             */
            active: false,

            /**
             * @property {Object} all
             * The collection of all `Responsive` instances. These are the instances that
             * will be notified when dynamic conditions change.
             * @static
             * @private
             */
            all: {},

            /**
             * @property {Object} context
             * This object holds the various context values passed to the rule evaluation
             * functions.
             * @static
             * @private
             */
            context: Ext.Object.chain(Ext.platformTags),

            /**
             * @property {Number} count
             * The number of instances in the `all` collection.
             * @static
             * @private
             */
            count: 0,

            /**
             * @property {Number} nextId
             * The seed value used to assign `Responsive` instances a unique id for keying
             * in the `all` collection.
             * @static
             * @private
             */
            nextId: 0,

            /**
             * Activates event listeners for all `Responsive` instances. This method is
             * called when the first instance is registered.
             * @private
             */
            activate: function () {
                Responsive.active = true;
                Responsive.updateContext();
                Ext.on('resize', Responsive.onResize, Responsive);
            },

            /**
             * Deactivates event listeners. This method is called when the last instance
             * is destroyed.
             * @private
             */
            deactivate: function () {
                Responsive.active = false;
                Ext.un('resize', Responsive.onResize, Responsive);
            },

            /**
             * Updates all registered the `Responsive` instances (found in the `all`
             * collection).
             * @private
             */
            notify: function () {
                var all = Responsive.all,
                    context = Responsive.context,
                    globalEvents = Ext.GlobalEvents,
                    timer = Responsive.timer,
                    id;

                if (timer) {
                    Responsive.timer = null;
                    Ext.Function.cancelAnimationFrame(timer);
                }

                Responsive.updateContext();

                Ext.suspendLayouts();

                globalEvents.fireEvent('beforeresponsiveupdate', context);

                for (id in all) {
                    all[id].setupResponsiveContext();
                }

                globalEvents.fireEvent('beginresponsiveupdate', context);

                for (id in all) {
                    all[id].updateResponsiveState();
                }

                globalEvents.fireEvent('responsiveupdate', context);

                Ext.resumeLayouts(true);
            },

            /**
             * Handler of the window resize event. Schedules a timer so that we eventually
             * call `notify`.
             * @private
             */
            onResize: function () {
                if (!Responsive.timer) {
                    Responsive.timer = Ext.Function.requestAnimationFrame(Responsive.onTimer);
                }
            },

            /**
             * This method is the timer handler. When called this removes the timer and
             * calls `notify`.
             * @private
             */
            onTimer: function () {
                Responsive.timer = null;
                Responsive.notify();
            },

            /**
             * This method is called to update the internal state of a given config since
             * the config is needed prior to `initConfig` processing the `instanceConfig`.
             *
             * @param {Ext.Base} instance The instance to configure.
             * @param {Object} instanceConfig The config for the instance.
             * @param {String} name The name of the config to process.
             * @private
             * @since 5.0.1
             */
            processConfig: function (instance, instanceConfig, name) {
                var value = instanceConfig && instanceConfig[name],
                    config = instance.config,
                    cfg, configurator;

                // Good news is that both configs we have to handle have custom merges
                // so we just need to get the Ext.Config instance and call it.
                if (value) {
                    configurator = instance.getConfigurator();
                    cfg = configurator.configs[name]; // the Ext.Config instance

                    // Update "this.config" which is the storage for this instance.
                    config[name] = cfg.merge(value, config[name], instance);
                }
            },

            register: function (responder) {
                var id = responder.$responsiveId;

                if (!id) {
                    responder.$responsiveId = id = ++Responsive.nextId;

                    Responsive.all[id] = responder;

                    if (++Responsive.count === 1) {
                        Responsive.activate();
                    }
                }
            },

            unregister: function (responder) {
                var id = responder.$responsiveId;

                if (id in Responsive.all) {
                    responder.$responsiveId = null;

                    delete Responsive.all[id];

                    if (--Responsive.count === 0) {
                        Responsive.deactivate();
                    }
                }
            },

            /**
             * Updates the `context` object base on the current environment.
             * @private
             */
            updateContext: function () {
                var El = Ext.Element,
                    width = El.getViewportWidth(),
                    height = El.getViewportHeight(),
                    context = Responsive.context;

                context.width = width;
                context.height = height;
                context.tall = width < height;
                context.wide = !context.tall;

                context.landscape = context.portrait = false;
                if (!context.platform) {
                    context.platform = Ext.platformTags;
                }

                context[Ext.dom.Element.getOrientation()] = true;
            }
        }, // private static

        //--------------------------------------------------------------------------

        /**
         * This class system hook method is called at the tail end of the mixin process.
         * We need to see if the `targetClass` has already got a `responsiveConfig` and
         * if so, we must add its value to the real config.
         * @param {Ext.Class} targetClass
         * @private
         */
        afterClassMixedIn: function (targetClass) {
            var proto = targetClass.prototype,
                responsiveConfig = proto.responsiveConfig,
                responsiveFormulas = proto.responsiveFormulas,
                config;

            if (responsiveConfig || responsiveFormulas) {
                config = {};

                if (responsiveConfig) {
                    delete proto.responsiveConfig;
                    config.responsiveConfig = responsiveConfig;
                }

                if (responsiveFormulas) {
                    delete proto.responsiveFormulas;
                    config.responsiveFormulas = responsiveFormulas;
                }

                targetClass.getConfigurator().add(config);
            }
        },

        // The reason this method exists is so to convince the config system to put the
        // "responsiveConfig" and "responsiveFormulas" in the initList. This needs to be
        // done so that the initGetter is setup prior to calling transformInstanceConfig
        // when we need to call the getters.

        applyResponsiveConfig: function (rules) {
            for (var rule in rules) {
                rules[rule].fn = Ext.createRuleFn(rule);
            }
            return rules;
        },

        applyResponsiveFormulas: function (formulas) {
            var ret = {},
                fn, name;

            if (formulas) {
                for (name in formulas) {
                    if (Ext.isString(fn = formulas[name])) {
                        fn = Ext.createRuleFn(fn);
                    }
                    ret[name] = fn;
                }
            }

            return ret;
        },

        /**
         * Evaluates and returns the configs based on the `responsiveConfig`. This
         * method relies on the state being captured by the `updateContext` method.
         * @private
         */
        getResponsiveState: function () {
            var context = Responsive.context,
                rules = this.getResponsiveConfig(),
                ret = {},
                entry, rule;

            if (rules) {
                for (rule in rules) {
                    entry = rules[rule];
                    if (entry.fn.call(this, context)) {
                        Ext.merge(ret, entry.config);
                    }
                }
            }

            return ret;
        },

        setupResponsiveContext: function () {
            var formulas = this.getResponsiveFormulas(),
                context = Responsive.context,
                name;

            if (formulas) {
                for (name in formulas) {
                    context[name] = formulas[name].call(this, context);
                }
            }
        },

        /**
         * This config system hook method is called just prior to processing the specified
         * "instanceConfig". This hook returns the instanceConfig that will actually be
         * processed by the config system.
         * @param {Object} instanceConfig The user-supplied instance config object.
         * @private
         */
        transformInstanceConfig: function (instanceConfig) {
            var me = this,
                ret;

            Responsive.register(me);

            // Since we are called immediately prior to the Configurator looking at the
            // instanceConfig, that incoming value has not yet been merged on to
            // "this.config". We need to call getResponsiveConfig and getResponsiveFormulas
            // and still get all that merged goodness, so we have to do the merge here.

            if (instanceConfig) {
                Responsive.processConfig(me, instanceConfig, 'responsiveConfig');
                Responsive.processConfig(me, instanceConfig, 'responsiveFormulas');
            }

            // For updates this is done in bulk prior to updating all of the responsive
            // objects, but for instantiation, we have to do this for ourselves now.
            me.setupResponsiveContext();

            // Now we can merge the current responsive state with the incoming config.
            // The responsiveConfig takes priority.
            ret = me.getResponsiveState();

            if (instanceConfig) {
                ret = Ext.merge({}, instanceConfig, ret);

                // We don't want these to remain since we've already handled them.
                delete ret.responsiveConfig;
                delete ret.responsiveFormulas;
            }

            return ret;
        },

        /**
         * Evaluates and applies the `responsiveConfig` to this instance. This is called
         * by `notify` automatically.
         * @private
         */
        updateResponsiveState: function () {
            var config = this.getResponsiveState();
            this.setConfig(config);
        }
    } // private
}});
