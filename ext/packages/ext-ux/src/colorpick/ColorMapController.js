Ext.define('Ext.ux.colorpick.ColorMapController', {
    extend : 'Ext.app.ViewController',
    alias: 'controller.colorpickercolormapcontroller',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    // After the component is rendered
    onFirstBoxReady: function() {
        var me         = this,
            colorMap   = me.getView(),
            dragHandle = colorMap.down('#dragHandle'),
            dd         = dragHandle.dd;

        // configure draggable constraints 
        dd.constrain = true;
        dd.constrainTo = colorMap.getEl();
        dd.initialConstrainTo = dd.constrainTo; // needed otheriwse error EXTJS-13187

        // event handlers
        dd.on('drag', Ext.bind(me.onHandleDrag, me));
        me.mon(colorMap.getEl(), {
            mousedown: me.onMouseDown,
            dragstart: me.onDragStart,
            scope: me
        });
    },

    // Fires when handle is dragged; propagates "handledrag" event on the ColorMap
    // with parameters "percentX" and "percentY", both 0-1, representing the handle
    // position on the color map, relative to the container
    onHandleDrag: function(componentDragger, e) {
        var me              = this,
            container       = me.getView(), // the Color Map
            dragHandle      = container.down('#dragHandle'),
            x               = dragHandle.getX() - container.getX(),
            y               = dragHandle.getY() - container.getY(),
            containerEl     = container.getEl(),
            containerWidth  = containerEl.getWidth(),
            containerHeight = containerEl.getHeight(),
            xRatio          = x/containerWidth,
            yRatio          = y/containerHeight;

        // Adjust x/y ratios for dragger always being 1 pixel from the edge on the right
        if (xRatio > 0.99) {
            xRatio = 1;
        }
        if (yRatio > 0.99) {
            yRatio = 1;
        }
        
        container.fireEvent('handledrag', xRatio, yRatio);
    },

    // Whenever we mousedown over the colormap area
    onMouseDown: function(e) {
        var me         = this,
            container  = me.getView(),
            dragHandle = container.down('#dragHandle');

        // position drag handle accordingly
        dragHandle.setY(e.getY());
        dragHandle.setX(e.getX());
        me.onHandleDrag();

        // tie into the default dd mechanism
        dragHandle.dd.onMouseDown(e, dragHandle.dd.el);
    },

    // Whenever we start a drag over the colormap area
    onDragStart: function(e) {
        var me         = this,
            container  = me.getView(),
            dragHandle = container.down('#dragHandle');

        // tie into the default dd mechanism
        dragHandle.dd.onDragStart(e, dragHandle.dd.el);
    },

    // Whenever the map is clicked (but not the drag handle) we need to position
    // the drag handle to the point of click
    onMapClick: function (e) {
        var me          = this,
            container   = me.getView(), // the Color Map
            dragHandle  = container.down('#dragHandle'),
            cXY         = container.getXY(),
            eXY         = e.getXY(),
            left, top;

        left = eXY[0] - cXY[0];
        top  = eXY[1] - cXY[1];

        dragHandle.getEl().setStyle({
            left : left + 'px',
            top  : top + 'px'
        });

        me.onHandleDrag();
    },

    // Whenever the underlying binding data is changed we need to 
    // update position of the dragger; active drag state has been
    // accounted for earlier
    onColorBindingChanged: function(selectedColor) {
        var me              = this,
            vm              = me.getViewModel(),
            rgba            = vm.get('selectedColor'),
            hsv,
            container       = me.getView(), // the Color Map
            dragHandle      = container.down('#dragHandle'),
            containerEl     = container.getEl(),
            containerWidth  = containerEl.getWidth(),
            containerHeight = containerEl.getHeight(),
            xRatio,
            yRatio,
            left,
            top;

        // Color map selection really only depends on saturation and value of the color
        hsv = Ext.ux.colorpick.ColorUtils.rgb2hsv(rgba.r, rgba.g, rgba.b);

        // x-axis of color map with value 0-1 translates to saturation
        xRatio = hsv.s;
        left = containerWidth*xRatio;

        // y-axis of color map with value 0-1 translates to reverse of "value"
        yRatio = 1-hsv.v;
        top = containerHeight*yRatio;

        // Position dragger
        dragHandle.getEl().setStyle({
            left : left + 'px',
            top  : top + 'px'
        });
    },

    // Whenever only Hue changes we can update the 
    // background color of the color map
    // Param "hue" has value of 0-1
    onHueBindingChanged: function(hue) {
        var me            = this,
            vm            = me.getViewModel(),
            fullColorRGB,
            hex;

        fullColorRGB = Ext.ux.colorpick.ColorUtils.hsv2rgb(hue, 1, 1);
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(fullColorRGB.r, fullColorRGB.g, fullColorRGB.b);
        me.getView().getEl().applyStyles({ 'background-color': '#' + hex });
    }
});
