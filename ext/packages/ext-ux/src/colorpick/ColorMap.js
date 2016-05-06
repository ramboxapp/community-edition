/**
 * The main colorful square for selecting color shades by dragging around the
 * little circle.
 * @private
 */
Ext.define('Ext.ux.colorpick.ColorMap', {
    extend     : 'Ext.container.Container',
    alias      : 'widget.colorpickercolormap',
    controller : 'colorpickercolormapcontroller',

    requires: [
        'Ext.ux.colorpick.ColorMapController'
    ],

    cls  : Ext.baseCSSPrefix + 'colorpicker-colormap',

    // This is the drag "circle"; note it's 1x1 in size to allow full
    // travel around the color map; the inner div has the bigger image
    items: [{
        xtype     : 'component',
        cls       : Ext.baseCSSPrefix + 'colorpicker-colormap-draghandle-container',
        itemId    : 'dragHandle',
        width     : 1,
        height    : 1,
        draggable : true,
        html      : '<div class="' + Ext.baseCSSPrefix + 'colorpicker-colormap-draghandle"></div>'
    }],

    listeners : {
        boxready : {
            single  : true,
            fn      : 'onFirstBoxReady',
            scope   : 'controller'
        },
        colorbindingchanged: {
            fn    : 'onColorBindingChanged',
            scope : 'controller'
        },
        huebindingchanged: {
            fn    : 'onHueBindingChanged',
            scope : 'controller'
        }
    },

    afterRender: function () {
        var me  = this,
            src = me.mapGradientUrl,
            el  = me.el;

        me.callParent();

        if (!src) {
            // We do this trick to allow the Sass to calculate resource image path for
            // our package and pick up the proper image URL here.
            src = el.getStyle('background-image');
            src = src.substring(4, src.length - 1);  // strip off outer "url(...)"

            // In IE8 this path will have quotes around it
            if (src.indexOf('"') === 0) {
                src = src.substring(1, src.length-1);
            }

            // Then remember it on our prototype for any subsequent instances.
            Ext.ux.colorpick.ColorMap.prototype.mapGradientUrl = src;
        }

        // Now clear that style because it will conflict with the background-color
        el.setStyle('background-image', 'none');

        // Create the image with transparent PNG with black and white gradient shades;
        // it blends with the background color (which changes with hue selection). This
        // must be an IMG in order to properly stretch to fit.
        el = me.layout.getElementTarget(); // the el for items and html
        el.createChild({
            tag: 'img',
            cls: Ext.baseCSSPrefix + 'colorpicker-colormap-blender',
            src: src
        });
    },

    // Called via data binding whenever selectedColor changes; fires "colorbindingchanged"
    setPosition: function(data) {
        var me         = this,
            dragHandle = me.down('#dragHandle');

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        me.fireEvent('colorbindingchanged', data);
    },

    // Called via data binding whenever selectedColor.h changes; fires "huebindingchanged" event
    setHue: function(hue) {
        var me = this;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        me.fireEvent('huebindingchanged', hue);
    }
});
