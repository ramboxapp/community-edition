/** */
Ext.define('Ext.overrides.Widget', {
    override: 'Ext.Widget',

    uses: ['Ext.Component'],

    $configStrict: false,

    isComponent: true,

    liquidLayout: true,

    // in Ext JS the rendered flag is set as soon as a component has its element.  Since
    // widgets always have an element when constructed, they are always considered to be
    // "rendered"
    rendered: true,

    rendering: true,

    config: {
        renderTo: null
    },

    cachedConfig: {
        baseCls: Ext.baseCSSPrefix + 'widget'
    },

    constructor: function(config) {
        var me = this,
            renderTo;
            
        me.callParent([config]);

        // initialize the component layout
        me.getComponentLayout();
        renderTo = me.getRenderTo();
        if (renderTo) {
            me.render(renderTo);
        }
    },

    addCls: function(cls) {
        this.el.addCls(cls);
    },

    addClsWithUI: function(cls) {
        this.el.addCls(cls);
    },

    afterComponentLayout: Ext.emptyFn,

    finishRender: function () {
        this.rendering = false;
        this.initBindable();
    },

    getComponentLayout: function() {
        var me = this,
            layout = me.componentLayout;

        if (!layout) {
            layout = me.componentLayout = new Ext.layout.component.Auto();
            layout.setOwner(me);
        }

        return layout;
    },

    /**
     * @private
     * Needed for when widget is rendered into a grid cell. The class to add to the cell element.
     * @member Ext.Widget
     */
    getTdCls: function() {
        return Ext.baseCSSPrefix + this.getTdType() + '-' + (this.ui || 'default') + '-cell';
    },

    /**
     * @private
     * Partner method to {@link #getTdCls}.
     *
     * Returns the base type for the component. Defaults to return `this.xtype`, but
     * All derived classes of {@link Ext.form.field.Text TextField} can return the type 'textfield',
     * and all derived classes of {@link Ext.button.Button Button} can return the type 'button'
     * @member Ext.Widget
     */
    getTdType: function() {
        return this.xtype;
    },

    getItemId: function() {
        return this.itemId || this.id;
    },

    getSizeModel: function() {
        return Ext.Component.prototype.getSizeModel.apply(this, arguments);
    },

    onAdded: function (container, pos, instanced) {
        var me = this,
            inheritedState = me.inheritedState;

        me.ownerCt = container;

        // The container constructed us, so it's not possible for our
        // inheritedState to be invalid, so we only need to clear it
        // if we've been added as an instance
        if (inheritedState && instanced) {
            me.invalidateInheritedState();
        }

        if (me.reference) {
            me.fixReference();
        }
    },

    onRemoved: function(destroying) {
        var me = this,
            refHolder;

        if (me.reference) {
            refHolder = me.lookupReferenceHolder();
            if (refHolder) {
                refHolder.clearReference(me);
            }
        }

        if (!destroying) {
            me.removeBindings();
        }

        if (me.inheritedState && !destroying) {
            me.invalidateInheritedState();
        }

        me.ownerCt = me.ownerLayout = null;
    },

    parseBox: function(box) {
        return Ext.Element.parseBox(box);
    },

    removeCls: function(cls) {
        this.el.removeCls(cls);
    },

    removeClsWithUI: function(cls) {
        this.el.removeCls(cls);
    },
    
    render: function(container, position) {
        var me = this,
            element = me.element,
            proto = Ext.Component.prototype,
            nextSibling;

        if (!me.ownerCt || me.floating) {
            if (Ext.scopeCss) {
                element.addCls(proto.rootCls);
            }
            element.addCls(proto.borderBoxCls);
        }

        if (position) {
            nextSibling = container.childNodes[position];
            if (nextSibling) {
                Ext.fly(container).insertBefore(element, nextSibling);
                return;
            }
        }

        Ext.fly(container).appendChild(element);
    },

    setPosition: function(x, y) {
        this.el.setLocalXY(x, y);
    },

    up: function() {
        return Ext.Component.prototype.up.apply(this, arguments);
    },
    
    isAncestor: function() {
        return Ext.Component.prototype.isAncestor.apply(this, arguments);
    },
    
    onFocusEnter: function() {
        return Ext.Component.prototype.onFocusEnter.apply(this, arguments);
    },
    
    onFocusLeave: function() {
        return Ext.Component.prototype.onFocusLeave.apply(this, arguments);
    },

    // Widgets are not yet focusable as of 5.1
    focus: Ext.emptyFn,
    isFocusable: Ext.emptyFn
}, function(Cls) {
    var prototype = Cls.prototype;

    if (Ext.isIE8) {
        // Since IE8 does not support Object.defineProperty we can't add the reference
        // node on demand, so we just fall back to adding all references up front.
        prototype.addElementReferenceOnDemand = prototype.addElementReference;
    }
});
