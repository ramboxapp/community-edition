/**
 * An extended {@link Ext.dom.Element} object that supports a shadow and shim
 *
 * @deprecated 5.1.0 Ext.dom.Element now includes support for shadow and shim
 * see {@link Ext.dom.Element#enableShadow enableShadow} and
 * {@link Ext.dom.Element#enableShim enableShim}
 */
Ext.define('Ext.dom.Layer', {
    extend: 'Ext.Element',
    alternateClassName: 'Ext.Layer',

    /**
     * @cfg {String/Boolean} [shadow=false]
     * True to automatically create an {@link Ext.Shadow}, or a string indicating the
     * shadow's display {@link Ext.Shadow#mode}. False to disable the shadow.
     */

    /**
     * @cfg {String/Boolean} [shim=false]
     * True to automatically create a {@link Ext.dom.Shim}.
     */

    /**
     * @cfg {Object} [dh={tag: 'div', cls: 'x-layer'}]
     * DomHelper object config to create element with.
     */

    /**
     * @cfg {Boolean} [constrain=true]
     * False to disable constrain to viewport.
     */

    /**
     * @cfg {String} cls
     * CSS class to add to the element
     */

    /**
     * @cfg {Number} [zindex=11000]
     * Starting z-index.
     */

    /**
     * @cfg {Number} [shadowOffset=4]
     * Number of pixels to offset the shadow
     */

    /**
     * @cfg {Boolean} [useDisplay=false]
     * Defaults to use css offsets to hide the Layer. Specify <tt>true</tt>
     * to use css style <tt>'display:none;'</tt> to hide the Layer.
     */

    /**
     * @cfg {String} visibilityCls
     * The CSS class name to add in order to hide this Layer if this layer
     * is configured with <code>{@link #hideMode}: 'asclass'</code>
     */

    /**
     * @cfg {String} hideMode
     * A String which specifies how this Layer will be hidden.
     * Values may be:
     *
     * - `'display'` : The Component will be hidden using the `display: none` style.
     * - `'visibility'` : The Component will be hidden using the `visibility: hidden` style.
     * - `'offsets'` : The Component will be hidden by absolutely positioning it out of the visible area
     *   of the document. This is useful when a hidden Component must maintain measurable dimensions.
     *   Hiding using `display` results in a Component having zero dimensions.
     */

    isLayer: true,

    /**
     * Creates new Layer.
     * @param {Object} [config] An object with config options.
     * @param {String/HTMLElement} [existingEl] Uses an existing DOM element.
     * If the element is not found it creates it.
     */
    constructor: function(config, existingEl) {
        config = config || {};
        var me = this,
            dh = Ext.DomHelper,
            cp = config.parentEl,
            pel = cp ? Ext.getDom(cp) : document.body,
            hm = config.hideMode,
            cls = Ext.baseCSSPrefix + (config.fixed ? 'fixed-layer' : 'layer'),
            dom, id, element, shadowConfig;

        if (existingEl) {
            dom = Ext.getDom(existingEl);
            if (!dom.parentNode) {
                pel.appendChild(dom);
            }
        }

        if (!dom) {
            dom = dh.append(pel, config.dh || {
                tag: 'div',
                cls: cls // primarily to give el 'position:absolute' or, if fixed, 'position:fixed'
            });
        }

        if (config.id) {
            dom.id = config.id;
        }
        id = dom.id;

        if (id) {
            element = Ext.cache[id];
            if (element) {
                // if we have an existing Ext.Element in the cache for this same dom
                // element, delete it, so that it can be replaced by this layer instance
                // when we callParent below.
                delete Ext.cache[id];
                element.dom = null;
            }
        }
        this.callParent([dom]);

        if (existingEl) {
            me.addCls(cls);
        }

        if (config.preventSync) {
            me.preventSync = true;
        }

        if (config.cls) {
            me.addCls(config.cls);
        }
        me.constrain = config.constrain !== false;

        // Allow Components to pass their hide mode down to the Layer if they are floating.
        // Otherwise, allow useDisplay to override the default hiding method which is visibility.
        // TODO: Have ExtJS's Element implement visibilityMode by using classes as in Mobile.
        if (hm) {
            me.setVisibilityMode(Ext.Element[hm.toUpperCase()]);
        } else if (config.useDisplay) {
            me.setVisibilityMode(Ext.Element.DISPLAY);
        } else {
            me.setVisibilityMode(Ext.Element.VISIBILITY);
        }

        if (config.shadow) {
            me.shadowOffset = config.shadowOffset || 4;
            shadowConfig = {
                offset: me.shadowOffset,
                fixed: config.fixed
            };

            if (config.shadow !== true) {
                shadowConfig.mode = config.shadow;
            }

            me.enableShadow(shadowConfig);
        } else {
            me.shadowOffset = 0;
        }

        if (config.shim) {
            me.enableShim({
                fixed: config.fixed
            });
        }

        // Keep the following only for cases where Ext.Layer would be instantiated
        // directly.  We don't ever pass hidden in the config in the framework
        // since this is handled by the Component lifecycle.
        if (config.hidden === true) {
            me.hide();
        } else if (config.hidden === false) {
            me.show();
        }
    }
});
