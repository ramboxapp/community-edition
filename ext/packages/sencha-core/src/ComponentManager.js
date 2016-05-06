/**
 * Provides a registry of all Components (instances of {@link Ext.Component} or any subclass
 * thereof) on a page so that they can be easily accessed by {@link Ext.Component component}
 * {@link Ext.Component#id id} (see {@link #get}, or the convenience method
 * {@link Ext#getCmp Ext.getCmp}).
 *
 * This object also provides a registry of available Component *classes* indexed by a
 * mnemonic code known as the Component's {@link Ext.Component#xtype xtype}. The `xtype`
 * provides a way to avoid instantiating child Components when creating a full, nested
 * config object for a complete Ext page.
 *
 * A child Component may be specified simply as a *config object* as long as the correct
 * `{@link Ext.Component#xtype xtype}` is specified so that if and when the Component
 * needs rendering, the correct type can be looked up for lazy instantiation.
 * 
 * @singleton
 */
Ext.define('Ext.ComponentManager', {
    alternateClassName: 'Ext.ComponentMgr',
    
    singleton: true,

    count: 0,
    
    typeName: 'xtype',

    /**
     * @private
     */
    constructor: function(config) {
        var me = this;
        
        Ext.apply(me, config || {});
        me.all = {};
        me.references = {};
        me.onAvailableCallbacks = {};
    },
    
    /**
     * Creates a new Component from the specified config object using the config object's
     * `xtype` to determine the class to instantiate.
     *
     * @param {Object} config A configuration object for the Component you wish to create.
     * @param {String} [defaultType] The `xtype` to use if the config object does not
     * contain a `xtype`. (Optional if the config contains a `xtype`).
     * @return {Ext.Component} The newly instantiated Component.
     */
    create: function (config, defaultType) {
        if (typeof config === 'string') {
            return Ext.widget(config);
        }
        if (config.isComponent) {
            return config;
        }
        
        if ('xclass' in config) {
            return Ext.create(config.xclass, config);
        }

        return Ext.widget(config.xtype || defaultType, config);
    },

    /**
     * Returns an item by id.
     * @param {String} id The id of the item
     * @return {Object} The item, undefined if not found.
     */
    get: function(id) {
        return this.all[id];
    },

    register: function(component) {
        var me = this,
            all = me.all,
            key = component.getId(),
            onAvailableCallbacks = me.onAvailableCallbacks;

        //<debug>
        if (key === undefined) {
            Ext.Error.raise('Component id is undefined. Please ensure the component has an id.');
        }
        if (key in all) {
            Ext.Error.raise('Registering duplicate component id "' + key + '"');
        }
        //</debug>

        all[key] = component;

        if (component.reference) {
            me.references[key] = component;
        }

        ++me.count;
        
        if (!me.hasFocusListener) {
            Ext.on('focus', me.onGlobalFocus, me);
            me.hasFocusListener = true;
        }

        onAvailableCallbacks = onAvailableCallbacks && onAvailableCallbacks[key];
        if (onAvailableCallbacks && onAvailableCallbacks.length) {
            me.notifyAvailable(component);
        }
    },

    unregister: function(component) {
        var id = component.getId();

        if (component.reference) {
            delete this.references[id];
        }
        delete this.all[id];

        this.count--;
    },
    
    markReferencesDirty: function() {
        this.referencesDirty = true;
    },
    
    fixReferences: function() {
        var me = this,
            references = me.references,
            key;
            
        if (me.referencesDirty) {
            for (key in references) {
                if (references.hasOwnProperty(key)) {
                    references[key].fixReference();        
                }
            }
            me.referencesDirty = false;
        }
    },

    /**
     * Registers a function that will be called (a single time) when an item with the specified id is added to the manager.
     * This will happen on instantiation.
     * @param {String} id The item id
     * @param {Function} fn The callback function. Called with a single parameter, the item.
     * @param {Object} scope The scope ('this' reference) in which the callback is executed.
     * Defaults to the item.
     */
    onAvailable : function(id, fn, scope){
        var me = this,
            callbacks = me.onAvailableCallbacks,
            all = me.all,
            item;

        if (id in all) {    //if already an instance, callback immediately
            item = all[id];
            fn.call(scope || item, item);

        } else if (id) {    // otherwise, queue for dispatch

            if (!Ext.isArray(callbacks[id])) {
                callbacks[id] = [ ];
            }
            callbacks[id].push( function(item) { fn.call(scope || item, item);} );
        }
    },

    // @private
    notifyAvailable : function(item) {
        var callbacks = this.onAvailableCallbacks[item && item.getId()] || [];
        while (callbacks.length) {
            (callbacks.shift())(item);
        }
    },

    /**
     * Executes the specified function once for each item in the collection.
     * @param {Function} fn The function to execute.
     * @param {String} fn.key The key of the item
     * @param {Number} fn.value The value of the item
     * @param {Number} fn.length The total number of items in the collection ** Removed
     * in 5.0 **
     * @param {Boolean} fn.return False to cease iteration.
     * @param {Object} scope The scope to execute in. Defaults to `this`.
     */
    each: function(fn, scope){
        return Ext.Object.each(this.all, fn, scope);
    },

    /**
     * Gets the number of items in the collection.
     * @return {Number} The number of items in the collection.
     */
    getCount: function() {
        return this.count;
    },

    /**
     * Returns an array of all components
     * @return {Array}
     */
    getAll: function() {
        return Ext.Object.getValues(this.all);
    },

    /**
     * Return the currently active (focused) Component
     *
     * @return {Ext.Component/null} Active Component, or null
     * @private
     */
    getActiveComponent: function() {
        return Ext.Component.fromElement(Ext.dom.Element.getActiveElement());
    },

    // Deliver focus events to Component
    onGlobalFocus: function(e) {
        var me = this,
            toElement = e.toElement,
            fromElement = e.fromElement,
            toComponent = Ext.Component.fromElement(toElement),
            fromComponent = Ext.Component.fromElement(fromElement),
            commonAncestor = me.getCommonAncestor(fromComponent, toComponent),
            event,
            targetComponent;

        if (fromComponent && !(fromComponent.isDestroyed || fromComponent.destroying)) {
            // Call the Blurred Component's blur event handler directly with a synthesized blur event.
            if (fromComponent.focusable && fromElement === fromComponent.getFocusEl().dom) {
                event = new Ext.event.Event(e.event);
                event.type = 'blur';
                event.target = fromElement;
                event.relatedTarget = toElement;
                fromComponent.onBlur(event);
            }

            // Call onFocusLeave on the component axis from which focus is exiting
            for (targetComponent = fromComponent; targetComponent && targetComponent !== commonAncestor; targetComponent = targetComponent.getRefOwner()) {
                if (!(targetComponent.isDestroyed || targetComponent.destroying)) {
                    targetComponent.onFocusLeave({
                        event: e.event,
                        type: 'focusleave',
                        target: fromElement,
                        relatedTarget: toElement,
                        fromComponent: fromComponent,
                        toComponent: toComponent
                    });
                }
            }
        }
        if (toComponent && !toComponent.isDestroyed) {
            // Call the Focused Component's focus event handler directly with a synthesized focus event.
            if (toComponent.focusable && toElement === toComponent.getFocusEl().dom) {
                event = new Ext.event.Event(e.event);
                event.type = 'focus';
                event.relatedTarget = fromElement;
                event.target = toElement;
                toComponent.onFocus(event);
            }

            // Call onFocusEnter on the component axis to which focus is entering
            for (targetComponent = toComponent; targetComponent && targetComponent !== commonAncestor; targetComponent = targetComponent.getRefOwner()) {
                targetComponent.onFocusEnter({
                    event: e.event,
                    type: 'focusenter',
                    relatedTarget: fromElement,
                    target: toElement,
                    fromComponent: fromComponent,
                    toComponent: toComponent
                });
            }
        }
    },

    getCommonAncestor: function(compA, compB) {
        if (compA === compB) {
            return compA;
        }
        while (compA && !(compA.isAncestor(compB) || compA === compB)) {
            compA = compA.getRefOwner();
        }
        return compA;
    },

    deprecated: {
        5: {
            methods: {
                /**
                 * Checks if an item is registered.
                 * @param {String} component The mnemonic string by which the class may be looked up.
                 * @return {Boolean} Whether the type is registered.
                 * @deprecated 5.0
                 */
                isRegistered: null,

                /**
                 * Registers a new item constructor, keyed by a type key.
                 * @param {String} type The mnemonic string by which the class may be looked up.
                 * @param {Function} cls The new instance class.
                 * @deprecated 5.0
                 */
                registerType: null
            }
        }
    }
},
function () {
    /**
     * This is shorthand reference to {@link Ext.ComponentManager#get}.
     * Looks up an existing {@link Ext.Component Component} by {@link Ext.Component#id id}
     *
     * @param {String} id The component {@link Ext.Component#id id}
     * @return Ext.Component The Component, `undefined` if not found, or `null` if a
     * Class was found.
     * @member Ext
    */
    Ext.getCmp = function(id) {
        return Ext.ComponentManager.get(id);
    };
});
