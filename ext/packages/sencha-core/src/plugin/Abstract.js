/**
 * The AbstractPlugin class is the base class from which user-implemented plugins should inherit.
 *
 * This class defines the essential API of plugins as used by Components by defining the following methods:
 *
 *   - `init` : The plugin initialization method which the owning Component calls at Component initialization time.
 *
 *     The Component passes itself as the sole parameter.
 *
 *     Subclasses should set up bidirectional links between the plugin and its client Component here.
 *
 *   - `destroy` : The plugin cleanup method which the owning Component calls at Component destruction time.
 *
 *     Use this method to break links between the plugin and the Component and to free any allocated resources.
 */
Ext.define('Ext.plugin.Abstract', {
    alternateClassName: 'Ext.AbstractPlugin',

    /**
     * @property {Boolean} isPlugin
     * `true` in this class to identify an object as an instantiated Plugin, or subclass thereof.
     */
    isPlugin: true,

    /**
     * Instantiates the plugin.
     * @param {Object} [config] Configuration object.
     */
    constructor: function(config) {
        if (config) {
            this.pluginConfig = config;
            this.initConfig(config);
        }
    },

    /**
     * Creates clone of the plugin.
     * @param {Object} [overrideCfg] Additional config for the derived plugin.
     */
    clonePlugin: function(overrideCfg) {
        return new this.self(Ext.apply({}, overrideCfg, this.pluginConfig));
    },

    /**
     * Sets the component to which this plugin is attached.
     * @param {Ext.Component} cmp Owner component.
     */
    setCmp: function(cmp) {
        this.cmp = cmp;
    },

    /**
     * Returns the component to which this plugin is attached.
     * @return {Ext.Component} Owner component.
     */
    getCmp: function() {
        return this.cmp;
    },

    /**
     * @cfg {String} pluginId
     * A name for the plugin that can be set at creation time to then retrieve the plugin
     * through {@link Ext.Component#getPlugin getPlugin} method.  For example:
     *
     *     var grid = Ext.create('Ext.grid.Panel', {
     *         plugins: [{
     *             ptype: 'cellediting',
     *             clicksToEdit: 2,
     *             pluginId: 'cellplugin'
     *         }]
     *     });
     *
     *     // later on:
     *     var plugin = grid.getPlugin('cellplugin');
     */

    /**
     * @method
     * The init method is invoked after initComponent method has been run for the client Component.
     *
     * The supplied implementation is empty. Subclasses should perform plugin initialization, and set up bidirectional
     * links between the plugin and its client Component in their own implementation of this method.
     * @param {Ext.Component} client The client Component which owns this plugin.
     */
    init: Ext.emptyFn,

    /**
     * The destroy method is invoked by the owning Component at the time the Component is
     * being destroyed.
     *
     * The supplied implementation is empty. Subclasses should perform plugin cleanup in
     * their own implementation of this method.
     * @method destroy
     */

    // Private.
    // Inject a ptype property so that Component.findPlugin(ptype) works.
    onClassExtended: function(cls, data, hooks) {
        var alias = data.alias;

        // No ptype built into the class
        if (alias && !data.ptype) {
            if (Ext.isArray(alias)) {
                alias = alias[0];
            }
            cls.prototype.ptype = alias.split('plugin.')[1];
        }
    },

    resolveListenerScope: function(defaultScope) {
        var me = this,
            cmp = me.getCmp(),
            scope;

        if (cmp) {
            scope = cmp.resolveSatelliteListenerScope(me, defaultScope);
        }

        // If this method was called, it means the plugin subclass must
        // have mixed in Observable, so we can rely on there being
        // a "this.mixins.observable" even though Ext.plugin.Abstract
        // does not mix it in directly
        return scope || me.mixins.observable.resolveListenerScope.call(me, defaultScope);
    }
});
