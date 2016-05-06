// @tag core
/**
 * Base class that provides a common interface for publishing events. Subclasses are
 * expected to have a property "events" which is populated as event listeners register,
 * and, optionally, a property "listeners" with configured listeners defined.
 *
 * *Note*: This mixin requires the constructor to be called, which is typically done
 * during the construction of your object. The Observable constructor will call 
 * {@link #initConfig}, so it does not need to be called a second time.
 *
 * For example:
 *
 *     Ext.define('Employee', {
 *         mixins: ['Ext.mixin.Observable'],
 *
 *         config: {
 *             name: ''
 *         },
 *
 *         constructor: function (config) {
 *             // The `listeners` property is processed to add listeners and the config
 *             // is applied to the object.
 *             this.mixins.observable.constructor.call(this, config);
 *             // Config has been initialized
 *             console.log(this.getEmployeeName());
 *         }
 *     });
 *
 * This could then be used like this:
 *
 *     var newEmployee = new Employee({
 *         name: employeeName,
 *         listeners: {
 *             quit: function() {
 *                 // By default, "this" will be the object that fired the event.
 *                 alert(this.getName() + " has quit!");
 *             }
 *         }
 *     });
 */
Ext.define('Ext.mixin.Observable', function(Observable) {

    var emptyFn = Ext.emptyFn,
        emptyArray = [],
        arrayProto = Array.prototype,
        arraySlice = arrayProto.slice,
        // Private Destroyable class which removes listeners
        ListenerRemover = function(observable) {

            // Passed a ListenerRemover: return it
            if (observable instanceof ListenerRemover) {
                return observable;
            }

            this.observable = observable;

            // Called when addManagedListener is used with the event source as the second arg:
            // (owner, eventSource, args...)
            if (arguments[1].isObservable) {
                this.managedListeners = true;
            }
            this.args = arraySlice.call(arguments, 1);
        };

    ListenerRemover.prototype.destroy = function() {
        this.destroy = Ext.emptyFn;
        var observable = this.observable;
        observable[this.managedListeners ? 'mun' : 'un'].apply(observable, this.args);
    };

    return {
        extend: 'Ext.Mixin',
        mixinConfig: {
            id: 'observable',
            after: {
                destroy: 'clearListeners'
            }
        },

        requires: [
            'Ext.util.Event'
        ],

        mixins: ['Ext.mixin.Identifiable'],

        statics: {
            /**
            * Removes **all** added captures from the Observable.
            *
            * @param {Ext.util.Observable} o The Observable to release
            * @static
            */
            releaseCapture: function(o) {
                o.fireEventArgs = this.prototype.fireEventArgs;
            },

            /**
            * Starts capture on the specified Observable. All events will be passed to the supplied function with the event
            * name + standard signature of the event **before** the event is fired. If the supplied function returns false,
            * the event will not fire.
            *
            * @param {Ext.util.Observable} o The Observable to capture events from.
            * @param {Function} fn The function to call when an event is fired.
            * @param {Object} scope (optional) The scope (`this` reference) in which the function is executed. Defaults to
            * the Observable firing the event.
            * @static
            */
            capture: function(o, fn, scope) {
                // We're capturing calls to fireEventArgs to avoid duplication of events;
                // however fn expects fireEvent's signature so we have to convert it here.
                // To avoid unnecessary conversions, observe() below is aware of the changes
                // and will capture fireEventArgs instead.
                var newFn = function(eventName, args) {
                    return fn.apply(scope, [eventName].concat(args));
                };
                
                this.captureArgs(o, newFn, scope);
            },
            
            /**
             * @private
             */
            captureArgs: function(o, fn, scope) {
                o.fireEventArgs = Ext.Function.createInterceptor(o.fireEventArgs, fn, scope);
            },

            /**
            * Sets observability on the passed class constructor.
            *
            * This makes any event fired on any instance of the passed class also fire a single event through
            * the **class** allowing for central handling of events on many instances at once.
            *
            * Usage:
            *
            *     Ext.util.Observable.observe(Ext.data.Connection);
            *     Ext.data.Connection.on('beforerequest', function(con, options) {
            *         console.log('Ajax request made to ' + options.url);
            *     });
            *
            * @param {Function} c The class constructor to make observable.
            * @param {Object} listeners An object containing a series of listeners to add. See {@link #addListener}.
            * @static
            */
            observe: function(cls, listeners) {
                if (cls) {
                    if (!cls.isObservable) {
                        Ext.applyIf(cls, new this());
                        this.captureArgs(cls.prototype, cls.fireEventArgs, cls);
                    }
                    if (Ext.isObject(listeners)) {
                        cls.on(listeners);
                    }
                }
                return cls;
            },

            /**
            * Prepares a given class for observable instances. This method is called when a
            * class derives from this class or uses this class as a mixin.
            * @param {Function} T The class constructor to prepare.
            * @param {Ext.util.Observable} mixin The mixin if being used as a mixin.
            * @param {Object} data The raw class creation data if this is an extend.
            * @private
            */
            prepareClass: function (T, mixin, data) {
                // T.hasListeners is the object to track listeners on class T. This object's
                // prototype (__proto__) is the "hasListeners" of T.superclass.

                // Instances of T will create "hasListeners" that have T.hasListeners as their
                // immediate prototype (__proto__).

                var listeners = T.listeners = [],
                    // If this function was called as a result of an "onExtended", it will
                    // receive the class as "T", but the members will not yet have been
                    // applied to the prototype. If this is the case, just grab listeners
                    // off of the raw data object.
                    target = data || T.prototype,
                    targetListeners = target.listeners,
                    superListeners = mixin ? mixin.listeners : T.superclass.self.listeners,
                    name, scope, namedScope;

                // Process listeners that have been declared on the class body. These
                // listeners must not override each other, but each must be added
                // separately. This is accomplished by maintaining a nested array
                // of listeners for the class and it's superclasses/mixins
                if (superListeners) {
                    listeners.push(superListeners);
                }

                if (targetListeners) {
                    // Allow listener scope resolution mechanism to know if the listeners
                    // were declared on the class.  This is only necessary when scope
                    // is unspecified, or when scope is 'controller'.  We use special private
                    // named scopes of "self" and "self.controller" to indicate either
                    // unspecified scope, or scope declared as controller on the class
                    // body.  To avoid iterating the listeners object multiple times, we
                    // only put this special scope on the outermost object at this point
                    // and allow addListener to handle scope:'controller' declared on
                    // inner objects of the listeners config.
                    scope = targetListeners.scope;
                    if (!scope) {
                        targetListeners.scope = 'self';
                    } else {
                        namedScope = Ext._namedScopes[scope];
                        if (namedScope && namedScope.isController) {
                            targetListeners.scope = 'self.controller';
                        }
                    }

                    listeners.push(targetListeners);

                    // After adding the target listeners to the declared listeners array
                    // we can delete it off of the prototype (or data object).  This ensures
                    // that we don't attempt to add the listeners twice, once during
                    // addDeclaredListeners, and again when we add this.listeners in the
                    // constructor.
                    target.listeners = null;
                }

                if (!T.HasListeners) {
                    // We create a HasListeners "class" for this class. The "prototype" of the
                    // HasListeners class is an instance of the HasListeners class associated
                    // with this class's super class (or with Observable).
                    var HasListeners = function () {},
                        SuperHL = T.superclass.HasListeners || (mixin && mixin.HasListeners) ||
                                Observable.HasListeners;

                    // Make the HasListener class available on the class and its prototype:
                    T.prototype.HasListeners = T.HasListeners = HasListeners;

                    // And connect its "prototype" to the new HasListeners of our super class
                    // (which is also the class-level "hasListeners" instance).
                    HasListeners.prototype = T.hasListeners = new SuperHL();
                }
            }
        },

        /* End Definitions */

        /**
        * @cfg {Object} listeners
        *
        * A config object containing one or more event handlers to be added to this object during initialization. This
        * should be a valid listeners config object as specified in the {@link #addListener} example for attaching multiple
        * handlers at once.
        *
        * **DOM events from Ext JS {@link Ext.Component Components}**
        *
        * While _some_ Ext JS Component classes export selected DOM events (e.g. "click", "mouseover" etc), this is usually
        * only done when extra value can be added. For example the {@link Ext.view.View DataView}'s **`{@link
        * Ext.view.View#itemclick itemclick}`** event passing the node clicked on. To access DOM events directly from a
        * child element of a Component, we need to specify the `element` option to identify the Component property to add a
        * DOM listener to:
        *
        *     new Ext.panel.Panel({
        *         width: 400,
        *         height: 200,
        *         dockedItems: [{
        *             xtype: 'toolbar'
        *         }],
        *         listeners: {
        *             click: {
        *                 element: 'el', //bind to the underlying el property on the panel
        *                 fn: function(){ console.log('click el'); }
        *             },
        *             dblclick: {
        *                 element: 'body', //bind to the underlying body property on the panel
        *                 fn: function(){ console.log('dblclick body'); }
        *             }
        *         }
        *     });
        */

        /**
        * @property {Boolean} isObservable
        * `true` in this class to identify an object as an instantiated Observable, or subclass thereof.
        */
        isObservable: true,
        
        /**
        * @private
        * Initial suspended call count. Incremented when {@link #suspendEvents} is called, decremented when {@link #resumeEvents} is called.
        */
        eventsSuspended: 0,

        /**
        * @property {Object} hasListeners
        * @readonly
        * This object holds a key for any event that has a listener. The listener may be set
        * directly on the instance, or on its class or a super class (via {@link #observe}) or
        * on the {@link Ext.app.EventBus MVC EventBus}. The values of this object are truthy
        * (a non-zero number) and falsy (0 or undefined). They do not represent an exact count
        * of listeners. The value for an event is truthy if the event must be fired and is
        * falsy if there is no need to fire the event.
        * 
        * The intended use of this property is to avoid the expense of fireEvent calls when
        * there are no listeners. This can be particularly helpful when one would otherwise
        * have to call fireEvent hundreds or thousands of times. It is used like this:
        * 
        *      if (this.hasListeners.foo) {
        *          this.fireEvent('foo', this, arg1);
        *      }
        */

        constructor: function(config) {
            var me = this,
                self = me.self,
                declaredListeners, listeners, 
                bubbleEvents, len, i;

            // Observable can be extended and/or mixed in at multiple levels in a Class
            // hierarchy, and may have its constructor invoked multiple times for a given
            // instance.  The following ensures we only perform initialization the first
            // time the constructor is called.
            if (me.$observableInitialized) {
                return;
            }
            me.$observableInitialized = true;

            me.hasListeners = new me.HasListeners();

            me.events = me.events || {};

            declaredListeners = self.listeners;
            if (declaredListeners && !me._addDeclaredListeners(declaredListeners)) {
                // Nulling out declared listeners allows future instances to avoid
                // recursing into the declared listeners arrays if the first instance
                // discovers that there are no declarative listeners in its hierarchy
                self.listeners = null;
            }

            listeners = (config && config.listeners) || me.listeners;

            if (listeners) {
                if (listeners instanceof Array) {
                    // Support for listeners declared as an array:
                    //
                    //     listeners: [
                    //         { foo: fooHandler },
                    //         { bar: barHandler }
                    //     ]
                    for (i = 0, len = listeners.length; i < len; ++i) {
                        me.addListener(listeners[i]);
                    }
                } else {
                    me.addListener(listeners);
                }
            }

            bubbleEvents = (config && config.bubbleEvents) || me.bubbleEvents;

            if (bubbleEvents) {
                me.enableBubble(bubbleEvents);
            }

            if (me.$applyConfigs) {
                // Ext.util.Observable applies config properties directly to the instance
                Ext.apply(me, config);
            } else {
                // Ext.mixin.Observable uses the config system
                me.initConfig(config);
            }

            if (listeners) {
                // Set as an instance property to preempt the prototype in case any are set there.
                // Prevents listeners from being added multiple times if this constructor
                // is called more than once by multiple parties in the inheritance hierarchy
                me.listeners = null;
            }
        },

        onClassExtended: function (T, data) {
            if (!T.HasListeners) {
                // Some classes derive from us and some others derive from those classes. All
                // of these are passed to this method.
                Observable.prepareClass(T, T.prototype.$observableMixedIn ? undefined : data);
            }
        },

        // @private
        // Matches options property names within a listeners specification object  - property names which are never used as event names.
        $eventOptions: {
            scope: 1,
            delay: 1,
            buffer: 1,
            onFrame: 1,
            single: 1,
            args: 1,
            destroyable: 1,
            priority: 1,
            order: 1
        },

        $orderToPriority: {
            before: 100,
            current: 0,
            after: -100
        },

        /**
         * Adds declarative listeners as nested arrays of listener objects.
         * @private
         * @param {Array} listeners
         * @return {Boolean} `true` if any listeners were added
         */
        _addDeclaredListeners: function(listeners) {
            var me = this;

            if (listeners instanceof Array) {
                Ext.each(listeners, me._addDeclaredListeners, me);
            } else {
                me._addedDeclaredListeners = true;
                me.addListener(listeners);
            }

            return me._addedDeclaredListeners;
        },

        /**
        * The addManagedListener method is used when some object (call it "A") is listening 
        * to an event on another observable object ("B") and you want to remove that listener 
        * from "B" when "A" is destroyed. This is not an issue when "B" is destroyed because
        * all of its listeners will be removed at that time.
        *
        * Example:
        *
        *     Ext.define('Foo', {
        *         extend: 'Ext.Component',
        *     
        *         initComponent: function () {
        *             this.addManagedListener(MyApp.SomeGlobalSharedMenu, 'show', this.doSomething);
        *             this.callParent();
        *         }
        *     });
        *
        * As you can see, when an instance of Foo is destroyed, it ensures that the 'show' 
        * listener on the menu (`MyApp.SomeGlobalSharedMenu`) is also removed.
        *
        * As of version 5.1 it is no longer necessary to use this method in most cases because
        * listeners are automatically managed if the scope object provided to {@link #addListener}
        * is an Observable instance. However, if the observable instance and scope are not the
        * same object you still need to use `mon` or `addManagedListener` if you want the listener
        * to be managed.
        *
        * @param {Ext.util.Observable/Ext.dom.Element} item The item to which to add a listener/listeners.
        * @param {Object/String} ename The event name, or an object containing event name properties.
        * @param {Function/String} fn (optional) If the `ename` parameter was an event 
        * name, this is the handler function or the name of a method on the specified 
        * `scope`.
        * @param {Object} scope (optional) If the `ename` parameter was an event name, this is the scope (`this` reference)
        * in which the handler function is executed.
        * @param {Object} options (optional) If the `ename` parameter was an event name, this is the
        * {@link Ext.util.Observable#addListener addListener} options.
        * @return {Object} **Only when the `destroyable` option is specified. **
        *
        *  A `Destroyable` object. An object which implements the `destroy` method which removes all listeners added in this call. For example:
        *
        *     this.btnListeners = myButton.mon({
        *         destroyable: true
        *         mouseover:   function() { console.log('mouseover'); },
        *         mouseout:    function() { console.log('mouseout'); },
        *         click:       function() { console.log('click'); }
        *     });
        *
        * And when those listeners need to be removed:
        *
        *     Ext.destroy(this.btnListeners);
        *
        * or
        *
        *     this.btnListeners.destroy();
        */
        addManagedListener: function(item, ename, fn, scope, options, /* private */ noDestroy) {
            var me = this,
                managedListeners = me.managedListeners = me.managedListeners || [],
                config, passedOptions;

            if (typeof ename !== 'string') {
                // When creating listeners using the object form, allow caller to override the default of
                // using the listeners object as options.
                // This is used by relayEvents, when adding its relayer so that it does not contribute
                // a spurious options param to the end of the arg list.
                passedOptions = arguments.length > 4 ? options : ename;

                options = ename;
                for (ename in options) {
                    if (options.hasOwnProperty(ename)) {
                        config = options[ename];
                        if (!item.$eventOptions[ename]) {
                            // recurse, but pass the noDestroy parameter as true so that lots of individual Destroyables are not created.
                            // We create a single one at the end if necessary.
                            me.addManagedListener(item, ename, config.fn || config, config.scope || options.scope || scope, config.fn ? config : passedOptions, true);
                        }
                    }
                }
                if (options && options.destroyable) {
                    return new ListenerRemover(me, item, options);
                }
            }
            else {
                if (fn !== emptyFn) {
                    item.doAddListener(ename, fn, scope, options, null, me, me);

                    // The 'noDestroy' flag is sent if we're looping through a hash of listeners passing each one to addManagedListener separately
                    if (!noDestroy && options && options.destroyable) {
                        return new ListenerRemover(me, item, ename, fn, scope);
                    }
                }
            }
        },

        /**
        * Removes listeners that were added by the {@link #mon} method.
        *
        * @param {Ext.util.Observable/Ext.dom.Element} item The item from which to remove a listener/listeners.
        * @param {Object/String} ename The event name, or an object containing event name properties.
        * @param {Function} fn (optional) If the `ename` parameter was an event name, this is the handler function.
        * @param {Object} scope (optional) If the `ename` parameter was an event name, this is the scope (`this` reference)
        * in which the handler function is executed.
        */
        removeManagedListener: function(item, ename, fn, scope) {
            var me = this,
                options,
                config,
                managedListeners,
                length,
                i;

            if (typeof ename !== 'string') {
                options = ename;
                for (ename in options) {
                    if (options.hasOwnProperty(ename)) {
                        config = options[ename];
                        if (!item.$eventOptions[ename]) {
                            me.removeManagedListener(item, ename, config.fn || config, config.scope || options.scope || scope);
                        }
                    }
                }
            } else {
                managedListeners = me.managedListeners ? me.managedListeners.slice() : [];

                ename = Ext.canonicalEventName(ename);

                for (i = 0, length = managedListeners.length; i < length; i++) {
                    me.removeManagedListenerItem(false, managedListeners[i], item, ename, fn, scope);
                }
            }
        },

        /**
        * Fires the specified event with the passed parameters (minus the event name, plus the `options` object passed
        * to {@link #addListener}).
        *
        * An event may be set to bubble up an Observable parent hierarchy (See {@link Ext.Component#getBubbleTarget}) by
        * calling {@link #enableBubble}.
        *
        * @param {String} eventName The name of the event to fire.
        * @param {Object...} args Variable number of parameters are passed to handlers.
        * @return {Boolean} returns false if any of the handlers return false otherwise it returns true.
        */
        fireEvent: function(eventName) {
            return this.fireEventArgs(eventName, arraySlice.call(arguments, 1));
        },
        
        /**
         * Gets the default scope for firing late bound events (string names with
         * no scope attached) at runtime.
         * @param {Object} [defaultScope=this] The default scope to return if none is found.
         * @return {Object} The default event scope
         * @protected
         */
        resolveListenerScope: function (defaultScope) {
            var namedScope = Ext._namedScopes[defaultScope];
            if (namedScope) {
                //<debug>
                if (namedScope.isController) {
                    Ext.Error.raise('scope: "controller" can only be specified on classes that derive from Ext.Component or Ext.Widget');
                }
                //</debug>

                if (namedScope.isSelf || namedScope.isThis) {
                    defaultScope = null;
                }
            }
            return defaultScope || this;
        },

        /**
        * Fires the specified event with the passed parameter list.
        *
        * An event may be set to bubble up an Observable parent hierarchy (See {@link Ext.Component#getBubbleTarget}) by
        * calling {@link #enableBubble}.
        *
        * @param {String} eventName The name of the event to fire.
        * @param {Object[]} args An array of parameters which are passed to handlers.
        * @return {Boolean} returns false if any of the handlers return false otherwise it returns true.
        */
        fireEventArgs: function(eventName, args) {
            eventName = Ext.canonicalEventName(eventName);
            var me = this,
                // no need to make events since we need an Event with listeners
                events = me.events,
                event = events && events[eventName],
                ret = true;

            // Only continue firing the event if there are listeners to be informed.
            // Bubbled events will always have a listener count, so will be fired.
            if (me.hasListeners[eventName]) {
                ret = me.doFireEvent(eventName, args || emptyArray, event ? event.bubble : false);
            }
            return ret;
        },

        /**
         * Fires the specified event with the passed parameters and executes a function (action).
         * By default, the action function will be executed after any "before" event handlers
         * (as specified using the `order` option of `{@link #addListener}`), but before any
         * other handlers are fired.  This gives the "before" handlers an opportunity to
         * cancel the event by returning `false`, and prevent the action function from being
         * called.
         *
         * The action can also be configured to run after normal handlers, but before any "after"
         * handlers (as specified using the `order` event option) by passing `'after'`
         * as the `order` parameter.  This configuration gives any event handlers except
         * for "after" handlers the opportunity to cancel the event and prevent the action
         * function from being called.
         *
         * @param {String} eventName The name of the event to fire.
         * @param {Array} args Arguments to pass to handlers and to the action function.
         * @param {Function} fn The action function.
         * @param {Object} [scope] The scope (`this` reference) in which the handler function is
         * executed. **If omitted, defaults to the object which fired the event.**
         * @param {Object} [options] Event options for the action function.  Accepts any
         * of the options of `{@link #addListener}`
         * @param {String} [order='before'] The order to call the action function relative
         * too the event handlers (`'before'` or `'after'`).  Note that this option is
         * simply used to sort the action function relative to the event handlers by "priority".
         * An order of `'before'` is equivalent to a priority of `99.5`, while an order of
         * `'after'` is equivalent to a priority of `-99.5`.  See the `priority` option
         * of `{@link #addListener}` for more details.
         */
        fireAction: function(eventName, args, fn, scope, options, order) {
            // chain options to avoid mutating the user's options object
            options = options ? Ext.Object.chain(options) : {};
            options.single = true;
            options.priority = ((order === 'after') ? -99.5 : 99.5);

            this.doAddListener(eventName, fn, scope, options);
            this.fireEventArgs(eventName, args);
        },

        /**
        * Continue to fire event.
        * @private
        *
        * @param {String} eventName
        * @param {Array} args
        * @param {Boolean} bubbles
        */
        doFireEvent: function(eventName, args, bubbles) {
            var target = this,
                queue, event,
                ret = true;

            do {
                if (target.eventsSuspended) {
                    if ((queue = target.eventQueue)) {
                        queue.push([eventName, args]);
                    }
                    return ret;
                } else {
                    event = target.events && target.events[eventName];
                    // Continue bubbling if event exists and it is `true` or the handler didn't returns false and it
                    // configure to bubble.
                    if (event && event !== true) {
                        if ((ret = event.fire.apply(event, args)) === false) {
                            break;
                        }
                    }
                }
            } while (bubbles && (target = target.getBubbleParent()));
            return ret;
        },

        /**
        * Gets the bubbling parent for an Observable
        * @private
        * @return {Ext.util.Observable} The bubble parent. null is returned if no bubble target exists
        */
        getBubbleParent: function() {
            var me = this, parent = me.getBubbleTarget && me.getBubbleTarget();
            if (parent && parent.isObservable) {
                return parent;
            }
            return null;
        },

        /**
         * The {@link #on} method is shorthand for {@link #addListener}.
         *
         * Appends an event handler to this object.  For example:
         *
         *     myGridPanel.on("itemclick", this.onItemClick, this);
         *
         * The method also allows for a single argument to be passed which is a config object
         * containing properties which specify multiple events. For example:
         *
         *     myGridPanel.on({
         *         cellclick: this.onCellClick,
         *         select: this.onSelect,
         *         viewready: this.onViewReady,
         *         scope: this // Important. Ensure "this" is correct during handler execution
         *     });
         *
         * One can also specify options for each event handler separately:
         *
         *     myGridPanel.on({
         *         cellclick: {fn: this.onCellClick, scope: this, single: true},
         *         viewready: {fn: panel.onViewReady, scope: panel}
         *     });
         *
         * *Names* of methods in a specified scope may also be used:
         *
         *     myGridPanel.on({
         *         cellclick: {fn: 'onCellClick', scope: this, single: true},
         *         viewready: {fn: 'onViewReady', scope: panel}
         *     });
         *
         * @param {String/Object} eventName The name of the event to listen for.
         * May also be an object who's property names are event names.
         *
         * @param {Function/String} [fn] The method the event invokes or the *name* of 
         * the method within the specified `scope`.  Will be called with arguments
         * given to {@link Ext.util.Observable#fireEvent} plus the `options` parameter described 
         * below.
         *
         * @param {Object} [scope] The scope (`this` reference) in which the handler function is
         * executed. **If omitted, defaults to the object which fired the event.**
         *
         * @param {Object} [options] An object containing handler configuration.
         *
         * **Note:** The options object will also be passed as the last argument to every 
         * event handler.
         *
         * This object may contain any of the following properties:
         *
         * @param {Object} options.scope
         *   The scope (`this` reference) in which the handler function is executed. **If omitted,
         *   defaults to the object which fired the event.**
         *
         * @param {Number} options.delay
         *   The number of milliseconds to delay the invocation of the handler after the event 
         *   fires.
         *
         * @param {Boolean} options.single
         *   True to add a handler to handle just the next firing of the event, and then remove 
         *   itself.
         *
         * @param {Number} options.buffer
         *   Causes the handler to be scheduled to run in an {@link Ext.util.DelayedTask} delayed
         *   by the specified number of milliseconds. If the event fires again within that time,
         *   the original handler is _not_ invoked, but the new handler is scheduled in its place.
         *
         * @param {Number} options.onFrame
         *   Causes the handler to be scheduled to run at the next 
         *   {@link Ext.Function#requestAnimationFrame animation frame event}. If the
         *   event fires again before that time, the handler is not rescheduled - the handler
         *   will only be called once when the next animation frame is fired, with the last set
         *   of arguments passed.
         *
         * @param {Ext.util.Observable} options.target
         *   Only call the handler if the event was fired on the target Observable, _not_ if the 
         *   event was bubbled up from a child Observable.
         *
         * @param {String} options.element
         *   **This option is only valid for listeners bound to {@link Ext.Component Components}.**
         *   The name of a Component property which references an {@link Ext.dom.Element element} 
         *   to add a listener to.
         *
         *   This option is useful during Component construction to add DOM event listeners to 
         *   elements of {@link Ext.Component Components} which will exist only after the 
         *   Component is rendered.
         *   
         *   For example, to add a click listener to a Panel's body:
         *
         *       var panel = new Ext.panel.Panel({
         *           title: 'The title',
         *           listeners: {
         *               click: this.handlePanelClick,
         *               element: 'body'
         *           }
         *       });
         *       
         * In order to remove listeners attached using the element, you'll need to reference
         * the element itself as seen below.  
         *
         *      panel.body.un(...)
         * 
         * @param {String} [options.delegate]
         *   A simple selector to filter the event target or look for a descendant of the target.  
         *   
         *   The "delegate" option is only available on Ext.dom.Element instances (or 
         *   when attaching a listener to a Ext.dom.Element via a Component using the 
         *   element option). 
         *   
         *   See the *delegate* example below.
         *
         * @param {Boolean} [options.stopPropagation]
         *   **This option is only valid for listeners bound to {@link Ext.dom.Element Elements}.**
         *   `true` to call {@link Ext.event.Event#stopPropagation stopPropagation} on the event object
         *   before firing the handler.
         *
         * @param {Boolean} [options.preventDefault]
         *   **This option is only valid for listeners bound to {@link Ext.dom.Element Elements}.**
         *   `true` to call {@link Ext.event.Event#preventDefault preventDefault} on the event object
         *   before firing the handler.
         *
         * @param {Boolean} [options.stopEvent]
         *   **This option is only valid for listeners bound to {@link Ext.dom.Element Elements}.**
         *   `true` to call {@link Ext.event.Event#stopEvent stopEvent} on the event object
         *   before firing the handler.
         *
         * @param {Array} [options.args]
         *   Optional arguments to pass to the handler function. Any additional arguments
         *   passed to {@link #fireEvent} will be appended to these arguments.
         *
         * @param {Boolean} [options.destroyable=false]
         *   When specified as `true`, the function returns a `destroyable` object. An object 
         *   which implements the `destroy` method which removes all listeners added in this call.
         *   This syntax can be a helpful shortcut to using {@link #un}; particularly when 
         *   removing multiple listeners.  *NOTE* - not compatible when using the _element_
         *   option.  See {@link #un} for the proper syntax for removing listeners added using the
         *   _element_ config.
         *   
         * @param {Number} [options.priority]
         *   An optional numeric priority that determines the order in which event handlers
         *   are run. Event handlers with no priority will be run as if they had a priority
         *   of 0. Handlers with a higher priority will be prioritized to run sooner than
         *   those with a lower priority.  Negative numbers can be used to set a priority
         *   lower than the default. Internally, the framework uses a range of 1000 or
         *   greater, and -1000 or lesser for handlers that are intended to run before or
         *   after all others, so it is recommended to stay within the range of -999 to 999
         *   when setting the priority of event handlers in application-level code.
         *   A priority must be an integer to be valid.  Fractional values are reserved for
         *   internal framework use.
         *
         * @param {String} [options.order='current']
         *   A legacy option that is provided for backward compatibility.
         *   It is recommended to use the `priority` option instead.  Available options are:
         *
         *   - `'before'`: equal to a priority of `100`
         *   - `'current'`: equal to a priority of `0` or default priority
         *   - `'after'`: equal to a priority of `-100`
         *
         * @param {String} [order='current']
         *   A shortcut for the `order` event option.  Provided for backward compatibility.
         *   Please use the `priority` event option instead.
         *
         * **Combining Options**
         *
         * Using the options argument, it is possible to combine different types of listeners:
         *
         * A delayed, one-time listener.
         *
         *     myPanel.on('hide', this.handleClick, this, {
         *         single: true,
         *         delay: 100
         *     });
         *
         * **Attaching multiple handlers in 1 call**
         *
         * The method also allows for a single argument to be passed which is a config object 
         * containing properties which specify multiple handlers and handler configs.
         *
         *     grid.on({
         *         itemclick: 'onItemClick',
         *         itemcontextmenu: grid.onItemContextmenu,
         *         destroy: {
         *             fn: function () {
         *                 // function called within the 'altCmp' scope instead of grid
         *             },
         *             scope: altCmp // unique scope for the destroy handler
         *         },
         *         scope: grid       // default scope - provided for example clarity
         *     });
         *
         * **Delegate**
         *
         * This is a configuration option that you can pass along when registering a handler for 
         * an event to assist with event delegation. By setting this configuration option 
         * to a simple selector, the target element will be filtered to look for a 
         * descendant of the target. For example:
         *
         *     var panel = Ext.create({
         *         xtype: 'panel',
         *         renderTo: document.body,
         *         title: 'Delegate Handler Example',
         *         frame: true,
         *         height: 220,
         *         width: 220,
         *         html: '<h1 class="myTitle">BODY TITLE</h1>Body content'
         *     });
         *
         *     // The click handler will only be called when the click occurs on the
         *     // delegate: h1.myTitle ("h1" tag with class "myTitle")
         *     panel.on({
         *         click: function (e) {
         *             console.log(e.getTarget().innerHTML);
         *         },
         *         element: 'body',
         *         delegate: 'h1.myTitle'
         *      });
         *
         * @return {Object} **Only when the `destroyable` option is specified. **
         *
         *  A `Destroyable` object. An object which implements the `destroy` method which removes 
         *  all listeners added in this call. For example:
         *
         *     this.btnListeners =  = myButton.on({
         *         destroyable: true
         *         mouseover:   function() { console.log('mouseover'); },
         *         mouseout:    function() { console.log('mouseout'); },
         *         click:       function() { console.log('click'); }
         *     });
         *
         * And when those listeners need to be removed:
         *
         *     Ext.destroy(this.btnListeners);
         *
         * or
         *
         *     this.btnListeners.destroy();
         */  
        addListener: function(ename, fn, scope, options, order, /* private */ caller) {
            var me = this,
                namedScopes = Ext._namedScopes,
                config, namedScope, isClassListener, innerScope, eventOptions;

            // Object listener hash passed
            if (typeof ename !== 'string') {
                options = ename;
                scope = options.scope;
                namedScope = scope && namedScopes[scope];
                isClassListener = namedScope && namedScope.isSelf;
                // give subclasses the opportunity to switch the valid eventOptions
                // (Ext.Component uses this when the "element" option is used)
                eventOptions = ((me.isComponent || me.isWidget) && options.element) ?
                    me.$elementEventOptions : me.$eventOptions;

                for (ename in options) {
                    config = options[ename];
                    if (!eventOptions[ename]) {
                        /* This would be an API change so check removed until https://sencha.jira.com/browse/EXTJSIV-7183 is fully implemented in 4.2
                        // Test must go here as well as in the simple form because of the attempted property access here on the config object.
                        //<debug>
                        if (!config || (typeof config !== 'function' && !config.fn)) {
                            Ext.Error.raise('No function passed for event ' + me.$className + '.' + ename);
                        }
                        //</debug>
                        */

                        innerScope = config.scope;
                        // for proper scope resolution, scope:'controller' specified on an
                        // inner object, must be translated to 'self.controller' if the
                        // listeners object was declared on the class body.
                        // see also Ext.util.Observable#prepareClass and
                        // Ext.mixin.Inheritable#resolveListenerScope
                        if (innerScope && isClassListener) {
                            namedScope = namedScopes[innerScope];
                            if (namedScope && namedScope.isController) {
                                innerScope = 'self.controller';
                            }
                        }

                        me.doAddListener(ename, config.fn || config, innerScope || scope, config.fn ? config : options, order, caller);
                    }

                }
                if (options && options.destroyable) {
                    return new ListenerRemover(me, options);
                }
            } else {
                me.doAddListener(ename, fn, scope, options, order, caller);

                if (options && options.destroyable) {
                    return new ListenerRemover(me, ename, fn, scope, options);
                }
            }
            return me;
        },

        /**
         * Removes an event handler.
         *
         * @param {String} eventName The type of event the handler was associated with.
         * @param {Function} fn The handler to remove. **This must be a reference to the function 
         * passed into the
         * {@link #addListener} call.**
         * @param {Object} scope (optional) The scope originally specified for the handler. It 
         * must be the same as the scope argument specified in the original call to 
         * {@link Ext.util.Observable#addListener} or the listener will not be removed.
         * 
         * **Convenience Syntax**
         *
         * You can use the {link #addListener addListener destroyable: true} config option in
         * place of calling un().  For example:
         *
         *     var listeners = cmp.on({
         *         scope: cmp,
         *         afterrender: cmp.onAfterrender,
         *         beforehide: cmp.onBeforeHide,
         *         destroyable: true
         *     });
         *
         *     // Remove listeners
         *     listeners.destroy();
         *     // or
         *     cmp.un(
         *         scope: cmp,
         *         afterrender: cmp.onAfterrender,
         *         beforehide: cmp.onBeforeHide
         *     );
         *
         * **Exception - DOM event handlers using the element config option**
         *
         * You must go directly through the element to detach an event handler attached using
         * the {@link #addListener} _element_ option.
         *
         *     panel.on({
         *         element: 'body',
         *         click: 'onBodyCLick'
         *     });
         *
         *     panel.body.un({
         *         click: 'onBodyCLick'
         *     });
         */
        removeListener: function(ename, fn, scope, /* private */ eventOptions) {
            var me = this,
                config, options;

            if (typeof ename !== 'string') {
                options = ename;
                // give subclasses the opportunity to switch the valid eventOptions
                // (Ext.Component uses this when the "element" option is used)
                eventOptions = eventOptions || me.$eventOptions;
                for (ename in options) {
                    if (options.hasOwnProperty(ename)) {
                        config = options[ename];
                        if (!me.$eventOptions[ename]) {
                            me.doRemoveListener(ename, config.fn || config, config.scope || options.scope);
                        }
                    }
                }
            } else {
                me.doRemoveListener(ename, fn, scope);
            }

            return me;
        },

        /**
        * Removes all listeners for this object including the managed listeners
        */
        clearListeners: function() {
            var me = this,
                events = me.events,
                hasListeners = me.hasListeners,
                event,
                key;

            if (events) {
                for (key in events) {
                    if (events.hasOwnProperty(key)) {
                        event = events[key];
                        if (event.isEvent) {
                            delete hasListeners[key];
                            event.clearListeners();
                        }
                    }
                }
            }

            me.clearManagedListeners();
        },

        //<debug>
        purgeListeners : function() {
            if (Ext.global.console) {
                Ext.global.console.warn('Observable: purgeListeners has been deprecated. Please use clearListeners.');
            }
            return this.clearListeners.apply(this, arguments);
        },
        //</debug>

        /**
        * Removes all managed listeners for this object.
        */
        clearManagedListeners : function() {
            var me = this,
                managedListeners = me.managedListeners ? me.managedListeners.slice() : [],
                i = 0,
                len = managedListeners.length;

            for (; i < len; i++) {
                me.removeManagedListenerItem(true, managedListeners[i]);
            }

            me.managedListeners = [];
        },

        /**
        * Remove a single managed listener item
        * @private
        * @param {Boolean} isClear True if this is being called during a clear
        * @param {Object} managedListener The managed listener item
        * See removeManagedListener for other args
        */
        removeManagedListenerItem: function(isClear, managedListener, item, ename, fn, scope){
            if (isClear || (managedListener.item === item && managedListener.ename === ename && (!fn || managedListener.fn === fn) && (!scope || managedListener.scope === scope))) {
                // Pass along the options for mixin.Observable, for example if using delegate
                managedListener.item.doRemoveListener(managedListener.ename, managedListener.fn, managedListener.scope, managedListener.options);
                if (!isClear) {
                    Ext.Array.remove(this.managedListeners, managedListener);
                }
            }
        },

        //<debug>
        purgeManagedListeners : function() {
            if (Ext.global.console) {
                Ext.global.console.warn('Observable: purgeManagedListeners has been deprecated. Please use clearManagedListeners.');
            }
            return this.clearManagedListeners.apply(this, arguments);
        },
        //</debug>
        
        /**
        * Checks to see if this object has any listeners for a specified event, or whether the event bubbles. The answer
        * indicates whether the event needs firing or not.
        *
        * @param {String} eventName The name of the event to check for
        * @return {Boolean} `true` if the event is being listened for or bubbles, else `false`
        */
        hasListener: function(ename) {
            ename = Ext.canonicalEventName(ename);
            return !!this.hasListeners[ename];
        },
        
        /**
         * Checks if all events, or a specific event, is suspended.
         * @param {String} [event] The name of the specific event to check
         * @return {Boolean} `true` if events are suspended
         */
        isSuspended: function(event) {
            var suspended = this.eventsSuspended > 0,
                events = this.events;
                
            if (!suspended && event && events) {
                event = events[event];
                if (event && event.isEvent) {
                    return event.isSuspended();
                }
            }
            return suspended;
        },

        /**
        * Suspends the firing of all events. (see {@link #resumeEvents})
        *
        * @param {Boolean} queueSuspended `true` to queue up suspended events to be fired
        * after the {@link #resumeEvents} call instead of discarding all suspended events.
        */
        suspendEvents: function(queueSuspended) {
            ++this.eventsSuspended;
            if (queueSuspended && !this.eventQueue) {
                this.eventQueue = [];
            }
        },

        /**
         * Suspends firing of the named event(s).
         *
         * After calling this method to suspend events, the events will no longer fire when requested to fire.
         *
         * **Note that if this is called multiple times for a certain event, the converse method
         * {@link #resumeEvent} will have to be called the same number of times for it to resume firing.**
         *
         * @param  {String...} eventName Multiple event names to suspend.
         */
        suspendEvent: function() {
            var me = this,
                events = me.events,
                len = arguments.length,
                i, event, ename;

            for (i = 0; i < len; i++) {
                ename = arguments[i];
                ename = Ext.canonicalEventName(ename);
                event = events[ename];
                // we need to spin up the Event instance so it can hold the suspend count
                if (!event || !event.isEvent) {
                    event = me._initEvent(ename);
                }
                event.suspend();
            }
        },

        /**
         * Resumes firing of the named event(s).
         *
         * After calling this method to resume events, the events will fire when requested to fire.
         *
         * **Note that if the {@link #suspendEvent} method is called multiple times for a certain event,
         * this converse method will have to be called the same number of times for it to resume firing.**
         *
         * @param  {String...} eventName Multiple event names to resume.
         */
        resumeEvent: function() {
            var events = this.events || 0,
                len = events && arguments.length,
                i, event;

            for (i = 0; i < len; i++) {
                // If it exists, and is an Event object (not still a boolean placeholder), resume it
                event = events[arguments[i]];
                if (event && event.resume) {
                    event.resume();
                }
            }
        },

        /**
        * Resumes firing events (see {@link #suspendEvents}).
        *
        * If events were suspended using the `queueSuspended` parameter, then all events fired
        * during event suspension will be sent to any listeners now.
        * 
        * @param {Boolean} [discardQueue] `true` to prevent any previously queued events from firing
        * while we were suspended. See {@link #suspendEvents}.
        */
        resumeEvents: function(discardQueue) {
            var me = this,
                queued = me.eventQueue,
                qLen, q;

            if (me.eventsSuspended && ! --me.eventsSuspended) {
                delete me.eventQueue;

                if (!discardQueue && queued) {
                    qLen = queued.length;
                    for (q = 0; q < qLen; q++) {
                        // Important to call fireEventArgs here so MVC can hook in
                        me.fireEventArgs.apply(me, queued[q]);
                    }
                }
            }
        },

        /**
        * Relays selected events from the specified Observable as if the events were fired by `this`.
        *
        * For example if you are extending Grid, you might decide to forward some events from store.
        * So you can do this inside your initComponent:
        *
        *     this.relayEvents(this.getStore(), ['load']);
        *
        * The grid instance will then have an observable 'load' event which will be passed 
        * the parameters of the store's load event and any function fired with the grid's 
        * load event would have access to the grid using the this keyword (unless the event 
        * is handled by a controller's control/listen event listener in which case 'this' 
        * will be the controller rather than the grid).
        *
        * @param {Object} origin The Observable whose events this object is to relay.
        * @param {String[]} events Array of event names to relay.
        * @param {String} [prefix] A common prefix to prepend to the event names. For example:
        *
        *     this.relayEvents(this.getStore(), ['load', 'clear'], 'store');
        *
        * Now the grid will forward 'load' and 'clear' events of store as 'storeload' and 'storeclear'.
        *
        * @return {Object} A `Destroyable` object. An object which implements the `destroy` method which, when destroyed, removes all relayers. For example:
        *
        *     this.storeRelayers = this.relayEvents(this.getStore(), ['load', 'clear'], 'store');
        *
        * Can be undone by calling
        *
        *     Ext.destroy(this.storeRelayers);
        *
        * or
        *     this.store.relayers.destroy();
        */
        relayEvents : function(origin, events, prefix) {
            var me = this,
                len = events.length,
                i = 0,
                oldName,
                relayers = {};

            for (; i < len; i++) {
                oldName = events[i];

                // Build up the listener hash.
                relayers[oldName] = me.createRelayer(prefix ? prefix + oldName : oldName);
            }
            // Add the relaying listeners as ManagedListeners so that they are removed when this.clearListeners is called (usually when _this_ is destroyed)
            // Explicitly pass options as undefined so that the listener does not get an extra options param
            // which then has to be sliced off in the relayer.
            me.mon(origin, relayers, null, null, undefined);

            // relayed events are always destroyable.
            return new ListenerRemover(me, origin, relayers);
        },

        /**
        * @private
        * Creates an event handling function which re-fires the event from this object as the passed event name.
        * @param {String} newName The name under which to re-fire the passed parameters.
        * @param {Array} beginEnd (optional) The caller can specify on which indices to slice.
        * @return {Function}
        */
        createRelayer: function(newName, beginEnd) {
            var me = this;
            return function() {
                return me.fireEventArgs.call(me, newName, beginEnd ? arraySlice.apply(arguments, beginEnd) : arguments);
            };
        },

        /**
        * Enables events fired by this Observable to bubble up an owner hierarchy by calling `this.getBubbleTarget()` if
        * present. There is no implementation in the Observable base class.
        *
        * This is commonly used by Ext.Components to bubble events to owner Containers.
        * See {@link Ext.Component#getBubbleTarget}. The default implementation in Ext.Component returns the
        * Component's immediate owner. But if a known target is required, this can be overridden to access the
        * required target more quickly.
        *
        * Example:
        *
        *     Ext.define('Ext.overrides.form.field.Base', {
        *         override: 'Ext.form.field.Base',
        *
        *         //  Add functionality to Field's initComponent to enable the change event to bubble
        *         initComponent: function () {
        *             this.callParent();
        *             this.enableBubble('change');
        *         }
        *     });
        *
        *     var myForm = Ext.create('Ext.form.Panel', {
        *         title: 'User Details',
        *         items: [{
        *             ...
        *         }],
        *         listeners: {
        *             change: function() {
        *                 // Title goes red if form has been modified.
        *                 myForm.header.setStyle('color', 'red');
        *             }
        *         }
        *     });
        *
        * @param {String/String[]} eventNames The event name to bubble, or an Array of event names.
        */
        enableBubble: function(eventNames) {
            if (eventNames) {
                var me = this,
                    names = (typeof eventNames == 'string') ? arguments : eventNames,
                    // we must create events now if we have not yet
                    events = me.events,
                    length = events && names.length,
                    ename, event, i;

                for (i = 0; i < length; ++i) {
                    ename = names[i];
                    ename = Ext.canonicalEventName(ename);
                    event = events[ename];

                    if (!event || !event.isEvent) {
                        event = me._initEvent(ename);
                    }

                    // Event must fire if it bubbles (We don't know if anyone up the
                    // bubble hierarchy has listeners added)
                    me.hasListeners._incr_(ename);

                    event.bubble = true;
                }
            }
        },

        destroy: function() {
            this.clearListeners();
            this.callParent();
        },

        privates: {
            doAddListener: function(ename, fn, scope, options, order, caller, manager) {
                var me = this,
                    event, managedListeners, priority;

                order = order || (options && options.order);

                if (order) {
                    priority = (options && options.priority);

                    if (!priority) { // priority option takes precedence over order
                        // do not mutate the user's options
                        options = options ? Ext.Object.chain(options) : {};
                        options.priority = me.$orderToPriority[order];
                    }
                }

                ename = Ext.canonicalEventName(ename);

                //<debug>
                if (!fn) {
                    Ext.Error.raise("Cannot add '" + ename + "' listener to " + me.$className +
                        " instance.  No function specified.");
                }
                //</debug>

                if (!manager && (scope && scope.isObservable && (scope !== me))) {
                    manager = scope;
                }

                if (manager) {
                    // if scope is an observable, the listener will be automatically managed
                    // this eliminates the need to call mon() in a majority of cases
                    managedListeners = manager.managedListeners = manager.managedListeners || [];

                    managedListeners.push({
                        item: me,
                        ename: ename,
                        fn: fn,
                        scope: scope,
                        options: options
                    });
                }

                event = (me.events || (me.events = {}))[ename];
                if (!event || !event.isEvent) {
                    event = me._initEvent(ename);
                }

                if (fn !== emptyFn) {
                    if (event.addListener(fn, scope, options, caller, manager)) {
                        // If a new listener has been added (Event.addListener rejects duplicates of the same fn+scope)
                        // then increment the hasListeners counter
                        me.hasListeners._incr_(ename);
                    }
                }
            },

            doRemoveListener: function(ename, fn, scope) {
                var me = this,
                    events = me.events,
                    event;

                ename = Ext.canonicalEventName(ename);
                event = events && events[ename];

                //<debug>
                if (!fn) {
                    Ext.Error.raise("Cannot remove '" + ename + "' listener to " + me.$className +
                        " instance.  No function specified.");
                }
                //</debug>

                if (event && event.isEvent) {
                    if (event.removeListener(fn, scope)) {
                        me.hasListeners._decr_(ename);
                    }
                }
            },

            _initEvent: function(eventName) {
                return (this.events[eventName] = new Ext.util.Event(this, eventName));
            }
        },

        deprecated: {
            '5.0': {
                methods: {
                    addEvents: null
                }
            },
            '5.1': {
                methods: {
                    /**
                     * Appends a before-event handler.  Returning `false` from the handler will stop the event.
                     *
                     * Same as {@link #addListener} with `order` set to `'before'`.
                     *
                     * @param {String/String[]/Object} eventName The name of the event to listen for.
                     * @param {Function/String} fn The method the event invokes.
                     * @param {Object} [scope] The scope for `fn`.
                     * @param {Object} [options] An object containing handler configuration.
                     * @deprecated 5.1 Use {@link #addListener} with the `priority` option instead.
                     */
                    addBeforeListener: function(eventName, fn, scope, options) {
                        return this.addListener(eventName, fn, scope, options, 'before');
                    },

                    /**
                     * Appends an after-event handler.
                     *
                     * Same as {@link #addListener} with `order` set to `'after'`.
                     *
                     * @param {String/String[]/Object} eventName The name of the event to listen for.
                     * @param {Function/String} fn The method the event invokes.
                     * @param {Object} [scope] The scope for `fn`.
                     * @param {Object} [options] An object containing handler configuration.
                     * @deprecated 5.1 Use {@link #addListener} with the `priority` option instead.
                     */
                    addAfterListener: function(eventName, fn, scope, options) {
                        return this.addListener(eventName, fn, scope, options, 'after');
                    },

                    /**
                     * Removes a before-event handler.
                     *
                     * Same as {@link #removeListener} with `order` set to `'before'`.
                     *
                     * @param {String/String[]/Object} eventName The name of the event the handler was associated with.
                     * @param {Function/String} fn The handler to remove.
                     * @param {Object} [scope] The scope originally specified for `fn`.
                     * @param {Object} [options] Extra options object.
                     * @deprecated 5.1 Use {@link #removeListener} instead.
                     */
                    removeBeforeListener: function(eventName, fn, scope, options) {
                        return this.removeListener(eventName, fn, scope, options, 'before');
                    },

                    /**
                     * Removes a before-event handler.
                     *
                     * Same as {@link #removeListener} with `order` set to `'after'`.
                     *
                     * @param {String/String[]/Object} eventName The name of the event the handler was associated with.
                     * @param {Function/String} fn The handler to remove.
                     * @param {Object} [scope] The scope originally specified for `fn`.
                     * @param {Object} [options] Extra options object.
                     * @deprecated 5.1 Use {@link #removeListener} instead.
                     */
                    removeAfterListener: function(eventName, fn, scope, options) {
                        return this.removeListener(eventName, fn, scope, options, 'after');
                    },

                    /**
                     * @method
                     * Alias for {@link #addBeforeListener}.
                     * @inheritdoc Ext.mixin.Observable#addBeforeListener
                     * @deprecated 5.1 Use {@link #on} instead.
                     */
                    onBefore: 'addBeforeListener',
                    /**
                     * @method
                     * Alias for {@link #addAfterListener}.
                     * @inheritdoc Ext.mixin.Observable#addAfterListener
                     * @deprecated 5.1 Use {@link #on} instead.
                     */
                    onAfter: 'addAfterListener',
                    /**
                     * @method
                     * Alias for {@link #removeBeforeListener}.
                     * @inheritdoc Ext.mixin.Observable#removeBeforeListener
                     * @deprecated 5.1 Use {@link #un} instead.
                     */
                    unBefore: 'removeBeforeListener',
                    /**
                     * @method
                     * Alias for {@link #removeAfterListener}.
                     * @inheritdoc Ext.mixin.Observable#removeAfterListener
                     * @deprecated 5.1 Use {@link #un} instead.
                     */
                    unAfter: 'removeAfterListener'
                }
            }
        }
    };
}, function() {
    var Observable = this,
        proto = Observable.prototype,
        HasListeners = function () {},
        prepareMixin = function (T) {
            if (!T.HasListeners) {
                var proto = T.prototype;
                // Keep track of whether we were added via a mixin or not, this becomes
                // important later when discovering merged listeners on the class.
                proto.$observableMixedIn = 1;
                // Classes that use us as a mixin (best practice) need to be prepared.
                Observable.prepareClass(T, this);

                // Now that we are mixed in to class T, we need to watch T for derivations
                // and prepare them also.
                T.onExtended(function (U, data) {
                    //<debug>
                    Ext.classSystemMonitor && Ext.classSystemMonitor('extend mixin', arguments);
                    //</debug>

                    Observable.prepareClass(U, null, data);
                });

                // Also, if a class uses us as a mixin and that class is then used as
                // a mixin, we need to be notified of that as well.
                if (proto.onClassMixedIn) {
                    // play nice with other potential overrides...
                    Ext.override(T, {
                        onClassMixedIn: function (U) {
                            prepareMixin.call(this, U);
                            this.callParent(arguments);
                        }
                    });
                } else {
                    // just us chickens, so add the method...
                    proto.onClassMixedIn = function (U) {
                        prepareMixin.call(this, U);
                    };
                }
            }

            superOnClassMixedIn.call(this, T);
        },
        // We are overriding the onClassMixedIn of Ext.Mixin. Save a reference to it
        // so we can call it after our onClassMixedIn.
        superOnClassMixedIn = proto.onClassMixedIn;

    HasListeners.prototype = {
        //$$: 42  // to make sure we have a proper prototype
        _decr_: function (ev) {
            if (! --this[ev]) {
                // Delete this entry, since 0 does not mean no one is listening, just
                // that no one is *directly* listening. This allows the eventBus or
                // class observers to "poke" through and expose their presence.
                delete this[ev];
            }
        },
        _incr_: function (ev) {
            if (this.hasOwnProperty(ev)) {
                // if we already have listeners at this level, just increment the count...
                ++this[ev];
            } else {
                // otherwise, start the count at 1 (which hides whatever is in our prototype
                // chain)...
                this[ev] = 1;
            }
        }
    };

    proto.HasListeners = Observable.HasListeners = HasListeners;

    Observable.createAlias({
        /**
         * @method
         * @inheritdoc Ext.util.Observable#addListener
         */
        on: 'addListener',
        /**
         * @method
         * Shorthand for {@link #removeListener}.
         * @inheritdoc Ext.util.Observable#removeListener
         */
        un: 'removeListener',
        /**
         * @method
         * Shorthand for {@link #addManagedListener}.
         * @inheritdoc Ext.util.Observable#addManagedListener
         */
        mon: 'addManagedListener',
        /**
         * @method
         * Shorthand for {@link #removeManagedListener}.
         * @inheritdoc Ext.util.Observable#removeManagedListener
         */
        mun: 'removeManagedListener',
        /**
         * @method
         * An alias for {@link #addListener}.  In versions prior to 5.1, {@link #listeners}
         * had a generated setter which could be called to add listeners.  In 5.1 the listeners
         * config is not processed using the config system and has no generated setter, so
         * this method is provided for backward compatibility.  The preferred way of
         * adding listeners is to use the {@link #on} method.
         * @param {Object} listeners The listeners
         */
        setListeners: 'addListener'
    });

    //deprecated, will be removed in 5.0
    Observable.observeClass = Observable.observe;

    // this is considered experimental (along with beforeMethod, afterMethod, removeMethodListener?)
    // allows for easier interceptor and sequences, including cancelling and overwriting the return value of the call
    // private
    function getMethodEvent(method){
        var e = (this.methodEvents = this.methodEvents || {})[method],
            returnValue,
            v,
            cancel,
            obj = this,
            makeCall;

        if (!e) {
            this.methodEvents[method] = e = {};
            e.originalFn = this[method];
            e.methodName = method;
            e.before = [];
            e.after = [];

            makeCall = function(fn, scope, args){
                if((v = fn.apply(scope || obj, args)) !== undefined){
                    if (typeof v == 'object') {
                        if(v.returnValue !== undefined){
                            returnValue = v.returnValue;
                        }else{
                            returnValue = v;
                        }
                        cancel = !!v.cancel;
                    }
                    else
                        if (v === false) {
                            cancel = true;
                        }
                        else {
                            returnValue = v;
                        }
                }
            };

            this[method] = function(){
                var args = Array.prototype.slice.call(arguments, 0),
                    b, i, len;
                returnValue = v = undefined;
                cancel = false;

                for(i = 0, len = e.before.length; i < len; i++){
                    b = e.before[i];
                    makeCall(b.fn, b.scope, args);
                    if (cancel) {
                        return returnValue;
                    }
                }

                if((v = e.originalFn.apply(obj, args)) !== undefined){
                    returnValue = v;
                }

                for(i = 0, len = e.after.length; i < len; i++){
                    b = e.after[i];
                    makeCall(b.fn, b.scope, args);
                    if (cancel) {
                        return returnValue;
                    }
                }
                return returnValue;
            };
        }
        return e;
    }

    Ext.apply(proto, {
        onClassMixedIn: prepareMixin,

        // these are considered experimental
        // allows for easier interceptor and sequences, including cancelling and overwriting the return value of the call
        // adds an 'interceptor' called before the original method
        beforeMethod : function(method, fn, scope){
            getMethodEvent.call(this, method).before.push({
                fn: fn,
                scope: scope
            });
        },

        // adds a 'sequence' called after the original method
        afterMethod : function(method, fn, scope){
            getMethodEvent.call(this, method).after.push({
                fn: fn,
                scope: scope
            });
        },

        removeMethodListener: function(method, fn, scope){
            var e = this.getMethodEvent(method),
                i, len;
            for(i = 0, len = e.before.length; i < len; i++){
                if(e.before[i].fn == fn && e.before[i].scope == scope){
                    Ext.Array.erase(e.before, i, 1);
                    return;
                }
            }
            for(i = 0, len = e.after.length; i < len; i++){
                if(e.after[i].fn == fn && e.after[i].scope == scope){
                    Ext.Array.erase(e.after, i, 1);
                    return;
                }
            }
        },

        toggleEventLogging: function(toggle) {
            Ext.util.Observable[toggle ? 'capture' : 'releaseCapture'](this, function(en) {
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.log(en, arguments);
                }
            });
        }
    });
});
