/**
 * Ext Direct aims to streamline communication between the client and server
 * by providing a single interface that reduces the amount of common code
 * typically required to validate data and handle returned data packets
 * (reading data, error conditions, etc).
 *
 * The Ext.direct namespace includes several classes for a closer integration
 * with the server-side. The Ext.data namespace also includes classes for working
 * with Ext.data.Stores which are backed by data from an Ext Direct method.
 *
 * # Specification
 *
 * For additional information consult the [Ext Direct Specification][1].
 *
 * # Providers
 *
 * Ext Direct uses a provider architecture, where one or more providers are used
 * to transport data to and from the server. There are several providers that exist
 * in the core at the moment:
 *
 * - {@link Ext.direct.JsonProvider JsonProvider} for simple JSON operations
 * - {@link Ext.direct.PollingProvider PollingProvider} for repeated requests
 * - {@link Ext.direct.RemotingProvider RemotingProvider} exposes server side to the client.
 *
 * A provider does not need to be invoked directly, providers are added via
 * {@link Ext.direct.Manager #addProvider}. RemotingProviders' API declarations
 * can also be loaded with {@link Ext.direct.Manager #loadProvider}, with
 * Provider instance created automatically after successful retrieval.
 *
 * # Router
 *
 * Ext Direct RemotingProviders utilize a "router" on the server to direct
 * requests from the client to the appropriate server-side method. Because
 * the Ext Direct API is platform-agnostic, you could completely swap out
 * a Java based server solution and replace it with one that uses C#
 * without changing the client side JavaScript at all, or vice versa.
 *
 * # Server side events
 *
 * Custom events from the server may be handled by the client by adding listeners, for example:
 *
 *     {"type":"event","name":"message","data":"Successfully polled at: 11:19:30 am"}
 *
 *     // add a handler for a 'message' event sent by the server
 *     Ext.direct.Manager.on('message', function(e){
 *         out.append(String.format('<p><i>{0}</i></p>', e.data));
 *         out.el.scrollTo('t', 100000, true);
 *     });
 *
 *    [1]: http://sencha.com/products/extjs/extdirect
 *
 * @singleton
 * @alternateClassName Ext.Direct
 */

Ext.define('Ext.direct.Manager', {
    singleton: true,

    requires: [
        'Ext.util.MixedCollection'
    ],

    mixins: [
        'Ext.mixin.Observable'
    ],

    /**
     * Exception types.
     */
    exceptions: {
        TRANSPORT: 'xhr',
        PARSE: 'parse',
        DATA: 'data',
        LOGIN: 'login',
        SERVER: 'exception'
    },
    
    // Classes of Providers available to the application
    providerClasses: {},
    
    // Remoting Methods registered with the Manager
    remotingMethods: {},
    
    config: {
        /**
         * @cfg {String} [varName="Ext.app.REMOTING_API"]
         * Default variable name to use for Ext.Direct API declaration.
         */
        varName: 'Ext.app.REMOTING_API'
    },
    
    apiNotFoundError: 'Ext Direct API was not found at {0}',
    
    /**
     * @event event
     *
     * Fires after an event.
     *
     * @param {Ext.direct.Event} event The {@link Ext.direct.Event Event} that occurred.
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}
     * that provided the event.
     */

    /**
     * @event exception
     *
     * Fires after an event exception.
     *
     * @param {Ext.direct.Event} event The {@link Ext.direct.Event Event} that occurred.
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}
     * that provided the event.
     */
    
    /**
     * @event providerload
     *
     * Fired by {@link #loadProvider} after successfully loading RemotingProvider API
     * declaration and creating a new Provider instance.
     *
     * @param {String} url The URL used to retrieve remoting API.
     * @param {Ext.direct.Provider} provider The {@link Ext.direct.Provider Provider}
     * instance that was created.
     */
    
    /**
     * @event providerloaderror
     * 
     * Fired by {@link #loadProvider} when remoting API could not be loaded, or
     * Provider instance could not be created.
     *
     * @param {String} url The URL used to retrieve remoting API.
     * @param {String} error The error that occured.
     */

    constructor: function() {
        var me = this;
        
        me.mixins.observable.constructor.call(me);

        me.transactions = new Ext.util.MixedCollection();
        me.providers    = new Ext.util.MixedCollection();
    },

    /**
     * Adds an Ext Direct Provider and creates the proxy or stub methods to execute
     * server-side methods for RemotingProviders. If the provider is not already connected,
     * it will auto-connect.
     *
     *      var pollProv = new Ext.direct.PollingProvider({
     *          url: 'php/poll2.php'
     *      });
     *
     *      Ext.direct.Manager.addProvider({
     *          type: 'remoting',           // create a Ext.direct.RemotingProvider
     *          url:  'php/router.php',     // url to connect to the Ext Direct server-side router.
     *          actions: {                  // each property within the actions object represents an Action
     *              TestAction: [{          // array of Methods within each server side Action
     *                  name: 'doEcho',     // name of method
     *                  len:  1
     *              }, {
     *                  name: 'multiply',
     *                  len:  1
     *              }, {
     *                  name: 'doForm',
     *                  formHandler: true   // handle form on server with Ext.direct.Transaction
     *              }]
     *          },
     *          namespace: 'myApplication', // namespace to create the Remoting Provider in
     *      }, {
     *          type: 'polling',            // create an Ext.direct.PollingProvider
     *          url:  'php/poll.php'
     *      },
     *      pollProv);                      // reference to previously created instance
     *
     * @param {Ext.direct.Provider/Object...} provider
     *
     * Accepts any number of Provider descriptions (an instance or config object for
     * a Provider). Each Provider description instructs Ext Direct how to create
     * client-side stub methods.
     */
    addProvider: function(provider) {
        var me = this,
            args = arguments,
            relayers = me.relayers || (me.relayers = {}),
            i, len;

        if (args.length > 1) {
            for (i = 0, len = args.length; i < len; ++i) {
                me.addProvider(args[i]);
            }
            
            return;
        }

        // if provider has not already been instantiated
        if (!provider.isProvider) {
            provider = Ext.create('direct.' + provider.type + 'provider', provider);
        }
        
        me.providers.add(provider);
        provider.on('data', me.onProviderData, me);
        
        if (provider.relayedEvents) {
            relayers[provider.id] = me.relayEvents(provider, provider.relayedEvents);
        }

        if (!provider.isConnected()) {
            provider.connect();
        }

        return provider;
    },
    
    /**
     * Load Ext Direct Provider API declaration from the server and construct
     * a new Provider instance. The new Provider will then auto-connect and
     * create stub functions for the methods exposed by the server side. See 
     * {@link #addProvider}.
     * 
     *      Ext.direct.Manager.loadProvider({
     *          url: 'php/api.php',
     *          varName: 'MY_REMOTING_API' // defaults to 'Ext.app.REMOTING_API'
     *      });
     *
     * @param {Object} config Remoting API configuration.
     * @param {String} config.url URL to retrieve remoting API declaration from.
     * @param {String} config.varName Name of the variable that will hold 
     * RemotingProvider configuration block, including its Actions.
     * @param {Function} [callback] Optional callback to execute when
     * Provider is created, or when an error has occured.
     * @param {Object} [scope] Optional scope to execute callback function in.
     *
     * For additional information see the [Ext Direct specification][1].
     */
    loadProvider: function(config, callback, scope) {
        var me = this,
            classes = me.providerClasses,
            type, url, varName, provider, i, len;
        
        if (Ext.isArray(config)) {
            for (i = 0, len = config.length; i < len; i++) {
                me.loadProvider(config[i], callback, scope);
            }
            
            return;
        }
        
        // We may have been passed config object containing enough
        // information to create a Provider without further ado.
        type = config.type;
        url  = config.url;
        
        if (classes[type] && classes[type].checkConfig(config)) {
            provider = me.addProvider(config);
            
            me.fireEventArgs('providerload', [url, provider]);
            Ext.callback(callback, scope, [url, provider]);
            
            // We're deliberately not returning the provider here
            // to make way for the future Promises based implementation
            // that should be consistent with the remote API declaration
            // retrieval below.
            return;
        }
        
        // For remote API declaration retrieval we need to know the
        // service discovery URL and variable name, at the minimum.
        // We have a default for the variable name but not for URL.
        varName = config.varName || me.getVarName();
        delete config.varName;
        
        //<debug>
        if (!url) {
            Ext.Error.raise("Need API discovery URL to load a Remoting provider!");
        }
        //</debug>
        
        // The URL we are requesting API from is not the same as the
        // service URL, and we don't need them to mix.
        delete config.url;
        
        // Have to use closures here as Loader does not allow passing
        // options object from caller to callback.
        Ext.Loader.loadScript({
            url: url,
            scope: me,
            
            onLoad: function() {
                this.onApiLoadSuccess({
                    url: url,
                    varName: varName,
                    config: config,
                    callback: callback,
                    scope: scope
                });
            },
            
            onError: function() {
                this.onApiLoadFailure({
                    url: url,
                    callback: callback,
                    scope: scope
                });
            }
        });
    },
    
    /**
     * Retrieves a {@link Ext.direct.Provider provider} by the id specified when the
     * provider is added.
     *
     * @param {String/Ext.direct.Provider} id The id of the provider, or the provider instance.
     */
    getProvider: function(id) {
        return id.isProvider ? id : this.providers.get(id);
    },

    /**
     * Removes the provider.
     *
     * @param {String/Ext.direct.Provider} provider The provider instance or the id of the provider.
     *
     * @return {Ext.direct.Provider} The provider, null if not found.
     */
    removeProvider: function(provider) {
        var me = this,
            providers = me.providers,
            relayers = me.relayers,
            id;

        provider = provider.isProvider ? provider : providers.get(provider);

        if (provider) {
            provider.un('data', me.onProviderData, me);

            id = provider.id;
            
            if (relayers[id]) {
                relayers[id].destroy();
                delete relayers[id];
            }
            
            providers.remove(provider);
            
            return provider;
        }
        
        return null;
    },

    /**
     * Adds a transaction to the manager.
     *
     * @param {Ext.direct.Transaction} transaction The transaction to add
     *
     * @return {Ext.direct.Transaction} transaction
     *
     * @private
     */
    addTransaction: function(transaction) {
        this.transactions.add(transaction);
        
        return transaction;
    },

    /**
     * Removes a transaction from the manager.
     *
     * @param {String/Ext.direct.Transaction} transaction The transaction/id of transaction to remove
     *
     * @return {Ext.direct.Transaction} transaction
     *
     * @private
     */
    removeTransaction: function(transaction) {
        var me = this;
        
        transaction = me.getTransaction(transaction);
        me.transactions.remove(transaction);
        
        return transaction;
    },

    /**
     * Gets a transaction
     *
     * @param {String/Ext.direct.Transaction} transaction The transaction/id of transaction to get
     *
     * @return {Ext.direct.Transaction}
     *
     * @private
     */
    getTransaction: function(transaction) {
        return typeof transaction === 'object' ? transaction : this.transactions.get(transaction);
    },

    onProviderData: function(provider, event) {
        var me = this,
            i, len;

        if (Ext.isArray(event)) {
            for (i = 0, len = event.length; i < len; ++i) {
                me.onProviderData(provider, event[i]);
            }
            
            return;
        }
        
        if (event.name && event.name !== 'event' && event.name !== 'exception') {
            me.fireEvent(event.name, event);
        }
        else if (event.status === false) {
            me.fireEvent('exception', event);
        }
        
        me.fireEvent('event', event, provider);
    },
    
    /**
     * Parses a direct function. It may be passed in a string format, for example:
     * "MyApp.Person.read".
     *
     * @param {String/Function} fn The direct function
     *
     * @return {Function} The function to use in the direct call. Null if not found
     */
    parseMethod: function(fn) {
        var current = Ext.global,
            i = 0,
            resolved, parts, len;
        
        if (Ext.isFunction(fn)) {
            resolved = fn;
        }
        else if (Ext.isString(fn)) {
            resolved = this.remotingMethods[fn];
            
            // Support legacy resolution as top-down lookup
            // from the window scope
            if (!resolved) {
                parts = fn.split('.');
                len   = parts.length;

                while (current && i < len) {
                    current = current[parts[i]];
                    ++i;
                }
            
                resolved = Ext.isFunction(current) ? current : null;
            }
        }
        
        return resolved || null;
    },
    
    privates: {
        addProviderClass: function(type, cls) {
            this.providerClasses[type] = cls;
        },
        
        onApiLoadSuccess: function(options) {
            var me = this,
                url = options.url,
                varName = options.varName,
                api, provider, error;
            
            try {
                // Variable name could be nested (default is Ext.app.REMOTING_API),
                // so we use eval() to get the actual value.
                api = Ext.apply(options.config, eval(varName));
                
                provider = me.addProvider(api);
            }
            catch (e) {
                error = e + '';
            }
            
            if (error) {
                me.fireEventArgs('providerloaderror', [url, error]);
                Ext.callback(options.callback, options.scope, [url, error]);
            }
            else {
                me.fireEventArgs('providerload', [url, provider]);
                Ext.callback(options.callback, options.scope, [url, provider]);
            }
        },
        
        onApiLoadFailure: function(options) {
            var url = options.url,
                error;
            
            error = Ext.String.format(this.apiNotFoundError, url);
            
            this.fireEventArgs('providerloaderror', [url, error]);
            Ext.callback(options.callback, options.scope, [url, error]);
        },
        
        registerMethod: function(name, method) {
            this.remotingMethods[name] = method;
        },
        
        // Used for testing
        clearAllMethods: function() {
            this.remotingMethods = {};
        }
    }
}, function() {
    // Backwards compatibility
    Ext.Direct = Ext.direct.Manager;
});
