/**
 * This plugin can be applied to any `Component` (although almost always to a `Container`)
 * to make it fill the browser viewport. This plugin is used internally by the more familiar
 * `Ext.container.Viewport` class.
 *
 * The `Viewport` container is commonly used but it can be an issue if you need to fill the
 * viewport with a container that derives from another class (e.g., `Ext.tab.Panel`). Prior
 * to this plugin, you would have to do this:
 *
 *      Ext.create('Ext.container.Viewport', {
 *          layout: 'fit', // full the viewport with the tab panel
 *
 *          items: [{
 *              xtype: 'tabpanel',
 *              items: [{
 *                  ...
 *              }]
 *          }]
 *      });
 *
 * With this plugin you can create the `tabpanel` as the viewport:
 *
 *      Ext.create('Ext.tab.Panel', {
 *          plugins: 'viewport',
 *
 *          items: [{
 *              ...
 *          }]
 *      });
 *
 * More importantly perhaps is that as a plugin, the view class can be reused in other
 * contexts such as the content of a `{@link Ext.window.Window window}`.
 *
 * The Viewport renders itself to the document body, and automatically sizes itself to the size of
 * the browser viewport and manages window resizing. There may only be one Viewport created
 * in a page.
 *
 * ## Responsive Design
 *
 * This plugin enables {@link Ext.mixin.Responsive#responsiveConfig} for the target component.
 *
 * @since 5.0.0
 */
Ext.define('Ext.plugin.Viewport', {
    extend: 'Ext.plugin.Responsive',

    alias: 'plugin.viewport',

    setCmp: function (cmp) {
        this.cmp = cmp;

        if (cmp && !cmp.isViewport) {
            this.decorate(cmp);
            if (cmp.renderConfigs) {
                cmp.flushRenderConfigs();
            }
            cmp.setupViewport();
        }
    },

    statics: {
        decorate: function (target) {
            Ext.applyIf(target.prototype || target, {
                ariaRole: 'application',

                viewportCls: Ext.baseCSSPrefix + 'viewport'
            });

            Ext.override(target, {
                isViewport: true,

                preserveElOnDestroy: true,

                initComponent : function() {
                    this.callParent();
                    this.setupViewport();
                },

                // Because we don't stamp the size until onRender, our size model
                // won't return correctly. As we're always going to be configured,
                // just return the value here
                getSizeModel: function() {
                    var configured = Ext.layout.SizeModel.configured;
                    return configured.pairsByHeightOrdinal[configured.ordinal];
                },

                handleViewportResize: function () {
                    var me = this,
                        Element = Ext.dom.Element,
                        width = Element.getViewportWidth(),
                        height = Element.getViewportHeight();

                    if (width !== me.width || height !== me.height) {
                        me.setSize(width, height);
                    }
                },

                setupViewport : function() {
                    var me = this,
                        el = document.body;

                    // Here in the (perhaps unlikely) case that the body dom el doesn't yet have an id,
                    // we want to give it the same id as the viewport component so getCmp lookups will
                    // be able to find the owner component.
                    //
                    // Note that nothing says that components that use configured elements have to have
                    // matching ids (they probably won't), but this is at least making the attempt so that
                    // getCmp *may* be able to find the component. However, in these cases, it's really
                    // better to use Component#fromElement to find the owner component.
                    if (!el.id) {
                        el.id = me.id;
                    }

                    // In addition, let's stamp on the componentIdAttribute so lookups using Component's
                    // fromElement will work.
                    el.setAttribute(Ext.Component.componentIdAttribute, me.id);

                    el = me.el = Ext.getBody();

                    Ext.fly(document.documentElement).addCls(me.viewportCls);
                    el.setHeight = el.setWidth = Ext.emptyFn;
                    el.dom.scroll = 'no';
                    me.allowDomMove = false;
                    me.renderTo = el;

                    if (Ext.supports.Touch) {
                        me.addMeta('apple-mobile-web-app-capable', 'yes');
                    }

                    // Get the DOM disruption over with before the Viewport renders and begins a layout
                    Ext.getScrollbarSize();

                    // Clear any dimensions, we will size later on in onRender
                    me.width = me.height = undefined;
                    
                    // ... but take the measurements now because doing that in onRender
                    // will cause a costly reflow which we just forced with getScrollbarSize()
                    me.initialViewportHeight = Ext.Element.getViewportHeight();
                    me.initialViewportWidth  = Ext.Element.getViewportWidth();
                },

                afterLayout: function(layout) {
                    if (Ext.supports.Touch) {
                        document.body.scrollTop = 0;
                    }
                    this.callParent([layout]);
                },

                onRender: function() {
                    var me = this;

                    me.callParent(arguments);

                    // Important to start life as the proper size (to avoid extra layouts)
                    // But after render so that the size is not stamped into the body,
                    // although measurement has to take place before render to avoid
                    // causing a reflow.
                    me.width  = me.initialViewportWidth;
                    me.height = me.initialViewportHeight;
                    
                    me.initialViewportWidth = me.initialViewportHeight = null;

                    // prevent touchmove from panning the viewport in mobile safari
                    if (Ext.supports.TouchEvents) {
                        me.mon(Ext.getDoc(), {
                            touchmove: function(e) {
                                e.preventDefault();
                            },
                            translate: false,
                            delegated: false
                        });
                    }
                },

                initInheritedState: function (inheritedState, inheritedStateInner) {
                    var me = this,
                        root = Ext.rootInheritedState;

                    if (inheritedState !== root) {
                        // We need to go at this again but with the rootInheritedState object. Let
                        // any derived class poke on the proper object!
                        me.initInheritedState(me.inheritedState = root,
                            me.inheritedStateInner = Ext.Object.chain(root));
                    } else {
                        me.callParent([inheritedState, inheritedStateInner]);
                    }
                },

                beforeDestroy: function(){
                    var me = this,
                        root = Ext.rootInheritedState,
                        key;

                    // Clear any properties from the inheritedState so we don't pollute the
                    // global namespace. If we have a rtl flag set, leave it alone because it's
                    // likely we didn't write it
                    for (key in root) {
                        if (key !== 'rtl') {
                            delete root[key];
                        }
                    }

                    me.removeUIFromElement();
                    me.el.removeCls(me.baseCls);
                    Ext.fly(document.body.parentNode).removeCls(me.viewportCls);
                    me.callParent();
                },

                addMeta: function(name, content) {
                    var meta = document.createElement('meta');

                    meta.setAttribute('name', name);
                    meta.setAttribute('content', content);
                    Ext.getHead().appendChild(meta);
                },

                privates: {
                    // override here to prevent an extraneous warning
                    applyTargetCls: function (targetCls) {
                        this.el.addCls(targetCls);
                    },
                    
                    // Override here to prevent tabIndex set/reset on the body
                    disableTabbing: function() {
                        var el = this.el;
                        
                        if (el) {
                            el.saveChildrenTabbableState();
                        }
                    },
                    
                    enableTabbing: function() {
                        var el = this.el;
                        
                        if (el) {
                            el.restoreChildrenTabbableState();
                        }
                    },

                    getOverflowEl: function() {
                        return Ext.get(document.documentElement);
                    }
                }
            });
        }
    },

    privates: {
        updateResponsiveState: function () {
            // By providing this method we are in sync with the layout suspend/resume as
            // well as other changes to configs that need to happen during this pulse of
            // size change.

            // This plugin instance is response, but the cmp is what needs to be handling
            // the resize:
            this.cmp.handleViewportResize();

            this.callParent();
        }
    }
},
function (Viewport) {
    Viewport.prototype.decorate = Viewport.decorate;
});
