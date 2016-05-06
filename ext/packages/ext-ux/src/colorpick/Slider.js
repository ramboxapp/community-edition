/**
 * Parent view for the 4 sliders seen on the color picker window.
 * @private
 */
Ext.define('Ext.ux.colorpick.Slider', {
    extend     : 'Ext.container.Container',
    xtype      : 'colorpickerslider',
    controller : 'colorpick-slidercontroller',

    baseCls : Ext.baseCSSPrefix + 'colorpicker-slider',
    layout  : 'center',

    requires: [
        'Ext.layout.container.Center',
        'Ext.ux.colorpick.SliderController'
    ],

    referenceHolder: true,

    listeners : {
        element: 'el',
        mousedown: 'onMouseDown',
        mouseup: 'onMouseUp',
        dragstart: 'onDragStart'
    },

    // Container for the drag handle; needed since the slider
    // is of static size, while the parent container positions
    // it in the center; this is what receives the beautiful
    // color gradients for the visual
    items: {
        xtype     : 'container',
        cls       : Ext.baseCSSPrefix + 'colorpicker-draghandle-container',
        reference : 'dragHandleContainer',
        height    : '100%',

        // This is the drag handle; note it's 100%x1 in size to allow full
        // vertical drag travel; the inner div has the bigger image
        items: {
            xtype     : 'component',
            cls       : Ext.baseCSSPrefix + 'colorpicker-draghandle-outer',
            reference : 'dragHandle',
            width     : '100%',
            height    : 1,
            draggable : true,
            html      : '<div class="' + Ext.baseCSSPrefix + 'colorpicker-draghandle"></div>'
        }
    },

    // <debug>
    // Called via data binding whenever selectedColor.h changes;
    setHue: function () {
        Ext.Error.raise('Must implement setHue() in a child class!');
    },
    // </debug>

    getDragHandle: function () {
        return this.lookupReference('dragHandle');
    },

    getDragContainer: function () {
        return this.lookupReference('dragHandleContainer');
    }
});
