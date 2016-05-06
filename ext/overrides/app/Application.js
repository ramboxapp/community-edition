/** */
Ext.define('Ext.overrides.app.Application', {
    override: 'Ext.app.Application',
    uses: [
        'Ext.tip.QuickTipManager'
    ],

    // @cmd-auto-dependency {aliasPrefix: "view.", mvc: true, requires: ["Ext.plugin.Viewport"]}
    /**
     * @cfg {Boolean/String} [autoCreateViewport=false]
     * @deprecated 5.1 Instead use {@link #mainView}
     * @member Ext.app.Application
     */
    autoCreateViewport: false,

    config: {
        /**
         * @cfg {Boolean} enableQuickTips
         * True to automatically set up Ext.tip.QuickTip support.
         * @member Ext.app.Application
         */
        enableQuickTips: true
    },

    applyMainView: function(value) {
        var view = this.getView(value),
            proto = view.prototype,
            config, plugins;

        if (!proto.isViewport) {
            plugins = proto.plugins;
            // Need to copy over any plugins defined on the prototype.
            plugins = ['viewport'].concat(plugins ? Ext.Array.from(plugins, true) : []);
            config = {
                plugins: plugins
            };
        }

        return view.create(config);
    },

    getDependencies: function(cls, data, requires) {
        var Controller = Ext.app.Controller,
            proto = cls.prototype,
            namespace = data.$namespace,
            viewportClass = data.autoCreateViewport;

        if (viewportClass) {
            //<debug>
            if (!namespace) {
                Ext.Error.raise("[Ext.app.Application] Can't resolve namespace for " +
                    data.$className + ", did you forget to specify 'name' property?");
            }
            //</debug>

            if (viewportClass === true) {
                viewportClass = 'Viewport';
            } else {
                requires.push('Ext.plugin.Viewport');
            }

            Controller.processDependencies(proto, requires, namespace, 'view', viewportClass);
        }
    },

    onBeforeLaunch: function() {
        var me = this,
            autoCreateViewport = me.autoCreateViewport;

        if (me.getEnableQuickTips()) {
            me.initQuickTips();
        }

        if(autoCreateViewport) {
            me.initViewport();
        }

        this.callParent(arguments);
    },

    getViewportName: function () {
        var name = null,
            autoCreate = this.autoCreateViewport;

        if (autoCreate) {
            name = (autoCreate === true) ? 'Viewport' : autoCreate;
        }

        return name;
    },

    initViewport: function() {
        this.setMainView(this.getViewportName());
    },

    initQuickTips: function() {
        Ext.tip.QuickTipManager.init();
    }
});