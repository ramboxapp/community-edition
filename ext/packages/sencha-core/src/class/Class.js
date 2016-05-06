/**
 * @class Ext.Class
 *
 * This is a low level factory that is used by {@link Ext#define Ext.define} and should not be used
 * directly in application code.
 * 
 * The configs of this class are intended to be used in `Ext.define` calls to describe the class you
 * are declaring. For example:
 * 
 *     Ext.define('App.util.Thing', {
 *         extend: 'App.util.Other',
 * 
 *         alias: 'util.thing',
 * 
 *         config: {
 *             foo: 42
 *         }
 *     });
 *
 * Ext.Class is the factory and **not** the superclass of everything. For the base class that **all**
 * classes inherit from, see {@link Ext.Base}.
 */
(function() {
// @tag class
// @define Ext.Class
// @require Ext.Base
// @require Ext.Util
// @require Ext.util.Cache
    var ExtClass,
        Base = Ext.Base,
        baseStaticMembers = Base.$staticMembers,
        ruleKeySortFn = function (a, b) {
            // longest to shortest, by text if names are equal
            return (a.length - b.length) || ((a < b) ? -1 : ((a > b) ? 1 : 0));
        };

    // Creates a constructor that has nothing extra in its scope chain.
    function makeCtor (className) {
        function constructor () {
            // Opera has some problems returning from a constructor when Dragonfly isn't running. The || null seems to
            // be sufficient to stop it misbehaving. Known to be required against 10.53, 11.51 and 11.61.
            return this.constructor.apply(this, arguments) || null;
        }
        //<debug>
        if (className) {
            constructor.name = className;
        }
        //</debug>
        return constructor;
    }

    /**
     * @method constructor
     * Create a new anonymous class.
     *
     * @param {Object} data An object represent the properties of this class
     * @param {Function} onCreated Optional, the callback function to be executed when this class is fully created.
     * Note that the creation process can be asynchronous depending on the pre-processors used.
     *
     * @return {Ext.Base} The newly created class
     */
    Ext.Class = ExtClass = function(Class, data, onCreated) {
        if (typeof Class != 'function') {
            onCreated = data;
            data = Class;
            Class = null;
        }

        if (!data) {
            data = {};
        }

        Class = ExtClass.create(Class, data);

        ExtClass.process(Class, data, onCreated);

        return Class;
    };

    Ext.apply(ExtClass, {
        
        makeCtor: makeCtor,
        
        /**
         * @private
         */
        onBeforeCreated: function(Class, data, hooks) {
            //<debug>
            Ext.classSystemMonitor && Ext.classSystemMonitor(Class, '>> Ext.Class#onBeforeCreated', arguments);
            //</debug>
        
            Class.addMembers(data);

            hooks.onCreated.call(Class, Class);

            //<debug>
            Ext.classSystemMonitor && Ext.classSystemMonitor(Class, '<< Ext.Class#onBeforeCreated', arguments);
            //</debug>
        },

        /**
         * @private
         */
        create: function (Class, data) {
            var i = baseStaticMembers.length,
                name;

            if (!Class) {
                Class = makeCtor(
                    //<debug>
                    data.$className
                    //</debug>
                );
            }

            while (i--) {
                name = baseStaticMembers[i];
                Class[name] = Base[name];
            }

            return Class;
        },

        /**
         * @private
         */
        process: function(Class, data, onCreated) {
            var preprocessorStack = data.preprocessors || ExtClass.defaultPreprocessors,
                registeredPreprocessors = this.preprocessors,
                hooks = {
                    onBeforeCreated: this.onBeforeCreated
                },
                preprocessors = [],
                preprocessor, preprocessorsProperties,
                i, ln, j, subLn, preprocessorProperty;

            delete data.preprocessors;
            Class._classHooks = hooks;

            for (i = 0,ln = preprocessorStack.length; i < ln; i++) {
                preprocessor = preprocessorStack[i];

                if (typeof preprocessor == 'string') {
                    preprocessor = registeredPreprocessors[preprocessor];
                    preprocessorsProperties = preprocessor.properties;

                    if (preprocessorsProperties === true) {
                        preprocessors.push(preprocessor.fn);
                    }
                    else if (preprocessorsProperties) {
                        for (j = 0,subLn = preprocessorsProperties.length; j < subLn; j++) {
                            preprocessorProperty = preprocessorsProperties[j];

                            if (data.hasOwnProperty(preprocessorProperty)) {
                                preprocessors.push(preprocessor.fn);
                                break;
                            }
                        }
                    }
                }
                else {
                    preprocessors.push(preprocessor);
                }
            }

            hooks.onCreated = onCreated ? onCreated : Ext.emptyFn;
            hooks.preprocessors = preprocessors;

            this.doProcess(Class, data, hooks);
        },
        
        doProcess: function(Class, data, hooks) {
            var me = this,
                preprocessors = hooks.preprocessors,
                preprocessor = preprocessors.shift(),
                doProcess = me.doProcess;

            for ( ; preprocessor ; preprocessor = preprocessors.shift()) {
                // Returning false signifies an asynchronous preprocessor - it will call doProcess when we can continue
                if (preprocessor.call(me, Class, data, hooks, doProcess) === false) {
                    return;
                }
            }
            hooks.onBeforeCreated.apply(me, arguments);
        },

        /** @private */
        preprocessors: {},

        /**
         * Register a new pre-processor to be used during the class creation process
         *
         * @param {String} name The pre-processor's name
         * @param {Function} fn The callback function to be executed. Typical format:
         *
         *     function(cls, data, fn) {
         *         // Your code here
         *
         *         // Execute this when the processing is finished.
         *         // Asynchronous processing is perfectly ok
         *         if (fn) {
         *             fn.call(this, cls, data);
         *         }
         *     });
         *
         * @param {Function} fn.cls The created class
         * @param {Object} fn.data The set of properties passed in {@link Ext.Class} constructor
         * @param {Function} fn.fn The callback function that **must** to be executed when this
         * pre-processor finishes, regardless of whether the processing is synchronous or asynchronous.
         * @return {Ext.Class} this
         * @private
         * @static
         */
        registerPreprocessor: function(name, fn, properties, position, relativeTo) {
            if (!position) {
                position = 'last';
            }

            if (!properties) {
                properties = [name];
            }

            this.preprocessors[name] = {
                name: name,
                properties: properties || false,
                fn: fn
            };

            this.setDefaultPreprocessorPosition(name, position, relativeTo);

            return this;
        },

        /**
         * Retrieve a pre-processor callback function by its name, which has been registered before
         *
         * @param {String} name
         * @return {Function} preprocessor
         * @private
         * @static
         */
        getPreprocessor: function(name) {
            return this.preprocessors[name];
        },

        /**
         * @private
         */
        getPreprocessors: function() {
            return this.preprocessors;
        },

        /**
         * @private
         */
        defaultPreprocessors: [],

        /**
         * Retrieve the array stack of default pre-processors
         * @return {Function[]} defaultPreprocessors
         * @private
         * @static
         */
        getDefaultPreprocessors: function() {
            return this.defaultPreprocessors;
        },

        /**
         * Set the default array stack of default pre-processors
         *
         * @private
         * @param {Array} preprocessors
         * @return {Ext.Class} this
         * @static
         */
        setDefaultPreprocessors: function(preprocessors) {
            this.defaultPreprocessors = Ext.Array.from(preprocessors);

            return this;
        },

        /**
         * Insert this pre-processor at a specific position in the stack, optionally relative to
         * any existing pre-processor. For example:
         *
         *     Ext.Class.registerPreprocessor('debug', function(cls, data, fn) {
         *         // Your code here
         *
         *         if (fn) {
         *             fn.call(this, cls, data);
         *         }
         *     }).setDefaultPreprocessorPosition('debug', 'last');
         *
         * @private
         * @param {String} name The pre-processor name. Note that it needs to be registered with
         * {@link Ext.Class#registerPreprocessor registerPreprocessor} before this
         * @param {String} offset The insertion position. Four possible values are:
         * 'first', 'last', or: 'before', 'after' (relative to the name provided in the third argument)
         * @param {String} relativeName
         * @return {Ext.Class} this
         * @static
         */
        setDefaultPreprocessorPosition: function(name, offset, relativeName) {
            var defaultPreprocessors = this.defaultPreprocessors,
                index;

            if (typeof offset == 'string') {
                if (offset === 'first') {
                    defaultPreprocessors.unshift(name);

                    return this;
                }
                else if (offset === 'last') {
                    defaultPreprocessors.push(name);

                    return this;
                }

                offset = (offset === 'after') ? 1 : -1;
            }

            index = Ext.Array.indexOf(defaultPreprocessors, relativeName);

            if (index !== -1) {
                Ext.Array.splice(defaultPreprocessors, Math.max(0, index + offset), 0, name);
            }

            return this;
        }
    });

    /**
     * @cfg {String} extend
     * The parent class that this class extends. For example:
     *
     *     Ext.define('Person', {
     *         say: function(text) { alert(text); }
     *     });
     *
     *     Ext.define('Developer', {
     *         extend: 'Person',
     *         say: function(text) { this.callParent(["print "+text]); }
     *     });
     */
    ExtClass.registerPreprocessor('extend', function(Class, data, hooks) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#extendPreProcessor', arguments);
        //</debug>
        
        var Base = Ext.Base,
            basePrototype = Base.prototype,
            extend = data.extend,
            Parent, parentPrototype, i;

        delete data.extend;

        if (extend && extend !== Object) {
            Parent = extend;
        }
        else {
            Parent = Base;
        }

        parentPrototype = Parent.prototype;

        if (!Parent.$isClass) {
            for (i in basePrototype) {
                if (!parentPrototype[i]) {
                    parentPrototype[i] = basePrototype[i];
                }
            }
        }

        Class.extend(Parent);

        Class.triggerExtended.apply(Class, arguments);

        if (data.onClassExtended) {
            Class.onExtended(data.onClassExtended, Class);
            delete data.onClassExtended;
        }

    }, true); // true to always run this preprocessor even w/o "extend" keyword

    /**
     * @cfg {Object} privates
     * The `privates` config is a list of methods intended to be used internally by the 
     * framework.  Methods are placed in a `privates` block to prevent developers from 
     * accidentally overriding framework methods in custom classes.
     *
     *     Ext.define('Computer', {
     *         privates: {
     *             runFactory: function(brand) {
     *                 // internal only processing of brand passed to factory
     *                 this.factory(brand);
     *             }
     *         },
     *     
     *         factory: function (brand) {}
     *     });
     * 
     * In order to override a method from a `privates` block, the overridden method must 
     * also be placed in a `privates` block within the override class.
     * 
     *     Ext.define('Override.Computer', {
     *         override: 'Computer',
     *         privates: {
     *             runFactory: function() {
     *                 // overriding logic
     *             }
     *         }
     *     });
     */
    ExtClass.registerPreprocessor('privates', function(Class, data) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#privatePreprocessor', arguments);
        //</debug>

        var privates = data.privates,
            statics = privates.statics,
            privacy = privates.privacy || true;

        delete data.privates;
        delete privates.statics;

        // We have to add this preprocessor so that private getters/setters are picked up
        // by the config system. This also catches duplication in the public part of the
        // class since it is an error to override a private method with a public one.
        Class.addMembers(privates, false, privacy);
        if (statics) {
            Class.addMembers(statics, true, privacy);
        }
    });

    //<feature classSystem.statics>
    /**
     * @cfg {Object} statics
     * List of static methods for this class. For example:
     *
     *     Ext.define('Computer', {
     *          statics: {
     *              factory: function(brand) {
     *                  // 'this' in static methods refer to the class itself
     *                  return new this(brand);
     *              }
     *          },
     *
     *          constructor: function() { ... }
     *     });
     *
     *     var dellComputer = Computer.factory('Dell');
     */
    ExtClass.registerPreprocessor('statics', function(Class, data) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#staticsPreprocessor', arguments);
        //</debug>
        
        Class.addStatics(data.statics);

        delete data.statics;
    });
    //</feature>

    //<feature classSystem.inheritableStatics>
    /**
     * @cfg {Object} inheritableStatics
     * List of inheritable static methods for this class.
     * Otherwise just like {@link #statics} but subclasses inherit these methods.
     */
    ExtClass.registerPreprocessor('inheritableStatics', function(Class, data) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#inheritableStaticsPreprocessor', arguments);
        //</debug>
        
        Class.addInheritableStatics(data.inheritableStatics);

        delete data.inheritableStatics;
    });
    //</feature>

    Ext.createRuleFn = function (code) {
        return new Function('$c', 'with($c) { return (' + code + '); }');
    };
    Ext.expressionCache = new Ext.util.Cache({
        miss: Ext.createRuleFn
    });

    Ext.ruleKeySortFn = ruleKeySortFn;
    Ext.getPlatformConfigKeys = function (platformConfig) {
        var ret = [],
            platform, rule;

        for (platform in platformConfig) {
            rule = Ext.expressionCache.get(platform);
            if (rule(Ext.platformTags)) {
                ret.push(platform);
            }
        }

        ret.sort(ruleKeySortFn);
        return ret;
    };

    //<feature classSystem.platformConfig>
    /**
     * @cfg {Object} platformConfig
     * Allows setting config values for a class based on specific platforms. The value
     * of this config is an object whose properties are "rules" and whose values are
     * objects containing config values.
     *
     * For example:
     *
     *      Ext.define('App.view.Foo', {
     *          extend: 'Ext.panel.Panel',
     *
     *          platformConfig: {
     *              desktop: {
     *                  title: 'Some Rather Descriptive Title'
     *              },
     *
     *              '!desktop': {
     *                  title: 'Short Title'
     *              }
     *          }
     *      });
     *
     * In the above, "desktop" and "!desktop" are (mutually exclusive) rules. Whichever
     * evaluates to `true` will have its configs applied to the class. In this case, only
     * the "title" property, but the object can contain any number of config properties.
     * In this case, the `platformConfig` is evaluated as part of the class and there is
     * not cost for each instance created.
     *
     * The rules are evaluated expressions in the context of the platform tags contained
     * in `{@link Ext#platformTags Ext.platformTags}`. Any properties of that object are
     * implicitly usable (as shown above).
     *
     * If a `platformConfig` specifies a config value, it will replace any values declared
     * on the class itself.
     *
     * Use of `platformConfig` on instances is handled by the config system when classes
     * call `{@link Ext.Base#initConfig initConfig}`. For example:
     *
     *      Ext.create({
     *          xtype: 'panel',
     *
     *          platformConfig: {
     *              desktop: {
     *                  title: 'Some Rather Descriptive Title'
     *              },
     *
     *              '!desktop': {
     *                  title: 'Short Title'
     *              }
     *          }
     *      });
     *
     * The following is equivalent to the above:
     *
     *      if (Ext.platformTags.desktop) {
     *          Ext.create({
     *              xtype: 'panel',
     *              title: 'Some Rather Descriptive Title'
     *          });
     *      } else {
     *          Ext.create({
     *              xtype: 'panel',
     *              title: 'Short Title'
     *          });
     *      }
     *
     * To adjust configs based on dynamic conditions, see `{@link Ext.mixin.Responsive}`.
     */
    ExtClass.registerPreprocessor('platformConfig', function(Class, data, hooks) {
        var platformConfigs = data.platformConfig,
            config = data.config,
            added, classConfigs, configs, configurator, hoisted, keys, name, value,
            platform, theme, platformConfig, i, ln, j , ln2, themeName;

        delete data.platformConfig;

        if (platformConfigs instanceof Array) {
            /*
             * Originally platformConfig was added to Sencha Touch and accepted an array
             * of objects to filter by platforms or device themes.
             *
             *     Ext.define('MyComponent', {
             *          config: {
             *              top: 0
             *          },
             *
             *          platformConfig: [{
             *              platform: ['ie10'],
             *              theme: ['Windows'],
             *              top: null,
             *              bottom: 0
             *          }]
             *     });
             */
            config = config || {};
            themeName = (Ext.theme || (Ext.theme = {
                name: 'Default'
            })).name;

            for (i = 0, ln = platformConfigs.length; i < ln; i++) {
                platformConfig = platformConfigs[i];

                platform = platformConfig.platform;
                delete platformConfig.platform;

                theme = [].concat(platformConfig.theme);
                ln2 = theme.length;
                delete platformConfig.theme;

                if (platform && Ext.filterPlatform(platform)) {
                    Ext.merge(config, platformConfig);
                }

                if (ln2) {
                    for (j = 0; j < ln2; j++) {
                        if (themeName === theme[j]) {
                            Ext.merge(config, platformConfig);
                        }
                    }
                }
            }
        } else {
            configurator = Class.getConfigurator();
            classConfigs = configurator.configs;

            // Get the keys shortest to longest (ish).
            keys = Ext.getPlatformConfigKeys(platformConfigs);

            // To leverage the Configurator#add method, we want to generate potentially
            // two objects to pass in: "added" and "hoisted". For any properties in an
            // active platformConfig rule that set proper Configs in the base class, we
            // need to put them in "added". If instead of the proper Config coming from
            // a base class, it comes from this class's config block, we still need to
            // put that config in "added" but we also need move the class-level config
            // out of "config" and into "hoisted".
            //
            // This will ensure that the config defined at the class level is added to
            // the Configurator first.
            for (i = 0, ln = keys.length; i < ln; ++i) {
                configs = platformConfigs[keys[i]];
                hoisted = added = null;

                for (name in configs) {
                    value = configs[name];

                    // We have a few possibilities for each config name:

                    if (config && name in config) {
                        //  It is a proper Config defined by this class.

                        (added || (added = {}))[name] = value;
                        (hoisted || (hoisted = {}))[name] = config[name];
                        delete config[name];
                    } else if (name in classConfigs) {
                        //  It is a proper Config defined by a base class.

                        (added || (added = {}))[name] = value;
                    } else {
                        //  It is just a property to put on the prototype.

                        data[name] = value;
                    }
                }

                if (hoisted) {
                    configurator.add(hoisted);
                }
                if (added) {
                    configurator.add(added);
                }
            }
        }
    });
    //</feature>

    //<feature classSystem.config>
    /**
     * @cfg {Object} config
     *
     * List of configuration options with their default values.
     *
     * __Note:__ You need to make sure {@link Ext.Base#initConfig} is called from your constructor if you are defining
     * your own class or singleton, unless you are extending a Component. Otherwise the generated getter and setter
     * methods will not be initialized.
     *
     * Each config item will have its own setter and getter method automatically generated inside the class prototype
     * during class creation time, if the class does not have those methods explicitly defined.
     *
     * As an example, let's convert the name property of a Person class to be a config item, then add extra age and
     * gender items.
     *
     *     Ext.define('My.sample.Person', {
     *         config: {
     *             name: 'Mr. Unknown',
     *             age: 0,
     *             gender: 'Male'
     *         },
     *
     *         constructor: function(config) {
     *             this.initConfig(config);
     *
     *             return this;
     *         }
     *
     *         // ...
     *     });
     *
     * Within the class, this.name still has the default value of "Mr. Unknown". However, it's now publicly accessible
     * without sacrificing encapsulation, via setter and getter methods.
     *
     *     var jacky = new Person({
     *         name: "Jacky",
     *         age: 35
     *     });
     *
     *     alert(jacky.getAge());      // alerts 35
     *     alert(jacky.getGender());   // alerts "Male"
     *
     *     jacky.walk(10);             // alerts "Jacky is walking 10 steps"
     *
     *     jacky.setName("Mr. Nguyen");
     *     alert(jacky.getName());     // alerts "Mr. Nguyen"
     *
     *     jacky.walk(10);             // alerts "Mr. Nguyen is walking 10 steps"
     *
     * Notice that we changed the class constructor to invoke this.initConfig() and pass in the provided config object.
     * Two key things happened:
     *
     *  - The provided config object when the class is instantiated is recursively merged with the default config object.
     *  - All corresponding setter methods are called with the merged values.
     *
     * Beside storing the given values, throughout the frameworks, setters generally have two key responsibilities:
     *
     *  - Filtering / validation / transformation of the given value before it's actually stored within the instance.
     *  - Notification (such as firing events) / post-processing after the value has been set, or changed from a
     *    previous value.
     *
     * By standardize this common pattern, the default generated setters provide two extra template methods that you
     * can put your own custom logics into, i.e: an "applyFoo" and "updateFoo" method for a "foo" config item, which are
     * executed before and after the value is actually set, respectively. Back to the example class, let's validate that
     * age must be a valid positive number, and fire an 'agechange' if the value is modified.
     *
     *     Ext.define('My.sample.Person', {
     *         config: {
     *             // ...
     *         },
     *
     *         constructor: {
     *             // ...
     *         },
     *
     *         applyAge: function(age) {
     *             if (typeof age !== 'number' || age < 0) {
     *                 console.warn("Invalid age, must be a positive number");
     *                 return;
     *             }
     *
     *             return age;
     *         },
     *
     *         updateAge: function(newAge, oldAge) {
     *             // age has changed from "oldAge" to "newAge"
     *             this.fireEvent('agechange', this, newAge, oldAge);
     *         }
     *
     *         // ...
     *     });
     *
     *     var jacky = new Person({
     *         name: "Jacky",
     *         age: 'invalid'
     *     });
     *
     *     alert(jacky.getAge());      // alerts 0
     *
     *     alert(jacky.setAge(-100));  // alerts 0
     *     alert(jacky.getAge());      // alerts 0
     *
     *     alert(jacky.setAge(35));    // alerts 0
     *     alert(jacky.getAge());      // alerts 35
     *
     * In other words, when leveraging the config feature, you mostly never need to define setter and getter methods
     * explicitly. Instead, "apply*" and "update*" methods should be implemented where necessary. Your code will be
     * consistent throughout and only contain the minimal logic that you actually care about.
     *
     * When it comes to inheritance, the default config of the parent class is automatically, recursively merged with
     * the child's default config. The same applies for mixins.
     */
    ExtClass.registerPreprocessor('config', function(Class, data) {
        // Need to copy to the prototype here because that happens after preprocessors
        if (data.hasOwnProperty('$configPrefixed')) {
            Class.prototype.$configPrefixed = data.$configPrefixed;
        }
        Class.addConfig(data.config);

        // We need to remove this or it will be applied by addMembers and smash the
        // "config" placed on the prototype by Configurator (which includes *all* configs
        // such as cachedConfigs).
        delete data.config;
    });
    //</feature>
    
    //<feature classSystem.cachedConfig>
    /**
     * @cfg {Object} cachedConfig
     * 
     * This configuration works in a very similar manner to the {@link #config} option.
     * The difference is that the configurations are only ever processed when the first instance
     * of that class is created. The processed value is then stored on the class prototype and
     * will not be processed on subsequent instances of the class. Getters/setters will be generated
     * in exactly the same way as {@link #config}.
     * 
     * This option is useful for expensive objects that can be shared across class instances. 
     * The class itself ensures that the creation only occurs once.
     */
    ExtClass.registerPreprocessor('cachedConfig', function(Class, data) {
        // Need to copy to the prototype here because that happens after preprocessors
        if (data.hasOwnProperty('$configPrefixed')) {
            Class.prototype.$configPrefixed = data.$configPrefixed;
        }
        Class.addCachedConfig(data.cachedConfig);

        // Remove this so it won't be placed on the prototype.
        delete data.cachedConfig;
    });
    //</feature>

    //<feature classSystem.mixins>
    /**
     * @cfg {String[]/Object} mixins
     * List of classes to mix into this class. For example:
     *
     *     Ext.define('CanSing', {
     *          sing: function() {
     *              alert("For he's a jolly good fellow...")
     *          }
     *     });
     *
     *     Ext.define('Musician', {
     *          mixins: ['CanSing']
     *     })
     *
     * In this case the Musician class will get a `sing` method from CanSing mixin.
     *
     * But what if the Musician already has a `sing` method? Or you want to mix
     * in two classes, both of which define `sing`?  In such a cases it's good
     * to define mixins as an object, where you assign a name to each mixin:
     *
     *     Ext.define('Musician', {
     *          mixins: {
     *              canSing: 'CanSing'
     *          },
     * 
     *          sing: function() {
     *              // delegate singing operation to mixin
     *              this.mixins.canSing.sing.call(this);
     *          }
     *     })
     *
     * In this case the `sing` method of Musician will overwrite the
     * mixed in `sing` method. But you can access the original mixed in method
     * through special `mixins` property.
     */
    ExtClass.registerPreprocessor('mixins', function(Class, data, hooks) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#mixinsPreprocessor', arguments);
        //</debug>
        
        var mixins = data.mixins,
            onCreated = hooks.onCreated;

        delete data.mixins;

        hooks.onCreated = function() {
            //<debug>
            Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#mixinsPreprocessor#beforeCreated', arguments);
            //</debug>

            // Put back the original onCreated before processing mixins. This allows a
            // mixin to hook onCreated by access Class._classHooks.
            hooks.onCreated = onCreated;

            Class.mixin(mixins);

            // We must go back to hooks.onCreated here because it may have changed during
            // calls to onClassMixedIn.
            return hooks.onCreated.apply(this, arguments);
        };
    });
    //</feature>


    //<feature classSystem.backwardsCompatible>
    // Backwards compatible
    Ext.extend = function(Class, Parent, members) {
        //<debug>
        Ext.classSystemMonitor && Ext.classSystemMonitor(Class, 'Ext.Class#extend-backwards-compatible', arguments);
        //</debug>
            
        if (arguments.length === 2 && Ext.isObject(Parent)) {
            members = Parent;
            Parent = Class;
            Class = null;
        }

        var cls;

        if (!Parent) {
            throw new Error("[Ext.extend] Attempting to extend from a class which has not been loaded on the page.");
        }

        members.extend = Parent;
        members.preprocessors = [
            'extend'
            //<feature classSystem.statics>
            ,'statics'
            //</feature>
            //<feature classSystem.inheritableStatics>
            ,'inheritableStatics'
            //</feature>
            //<feature classSystem.mixins>
            ,'mixins'
            //</feature>
            //<feature classSystem.platformConfig>
            ,'platformConfig'
            //</feature>
            //<feature classSystem.config>
            ,'config'
            //</feature>
        ];

        if (Class) {
            cls = new ExtClass(Class, members);
            // The 'constructor' is given as 'Class' but also needs to be on prototype
            cls.prototype.constructor = Class;
        } else {
            cls = new ExtClass(members);
        }

        cls.prototype.override = function(o) {
            for (var m in o) {
                if (o.hasOwnProperty(m)) {
                    this[m] = o[m];
                }
            }
        };

        return cls;
    };
    //</feature>

    /**
     * This object contains properties that describe the current device or platform. These
     * values can be used in `{@link Ext.Class#platformConfig platformConfig}` as well as
     * `{@link Ext.mixin.Responsive#responsiveConfig responsiveConfig}` statements.
     *
     * This object can be modified to include tags that are useful for the application. To
     * add custom properties, it is advisable to use a sub-object. For example:
     *
     *      Ext.platformTags.app = {
     *          mobile: true
     *      };
     *
     * @property {Object} platformTags
     * @property {Boolean} platformTags.phone
     * @property {Boolean} platformTags.tablet
     * @property {Boolean} platformTags.desktop
     * @property {Boolean} platformTags.touch Indicates touch inputs are available.
     * @property {Boolean} platformTags.safari
     * @property {Boolean} platformTags.chrome
     * @property {Boolean} platformTags.windows
     * @property {Boolean} platformTags.firefox
     * @property {Boolean} platformTags.ios True for iPad, iPhone and iPod.
     * @property {Boolean} platformTags.android
     * @property {Boolean} platformTags.blackberry
     * @property {Boolean} platformTags.tizen
     * @member Ext
     */
}());
