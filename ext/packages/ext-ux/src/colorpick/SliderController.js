Ext.define('Ext.ux.colorpick.SliderController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.colorpick-slidercontroller',

    // After the component is rendered
    boxReady: function (view) {
        var me         = this,
            container  = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            dd         = dragHandle.dd;

        // configure draggable constraints 
        dd.constrain = true;
        dd.constrainTo = container.getEl();
        dd.initialConstrainTo = dd.constrainTo; // needed otheriwse error EXTJS-13187
        
        // event handlers
        dd.on('drag', me.onHandleDrag, me);
    },

    getDragHandle: function () {
        return this.view.lookupReference('dragHandle');
    },

    getDragContainer: function () {
        return this.view.lookupReference('dragHandleContainer');
    },

    // Fires when handle is dragged; fires "handledrag" event on the slider
    // with parameter  "percentY" 0-1, representing the handle position on the slider
    // relative to the height
    onHandleDrag: function(e) {
        var me              = this,
            view            = me.getView(),
            container       = me.getDragContainer(),
            dragHandle      = me.getDragHandle(),
            y               = dragHandle.getY() - container.getY(),
            containerEl     = container.getEl(),
            containerHeight = containerEl.getHeight(),
            yRatio          = y/containerHeight;

        // Adjust y ratio for dragger always being 1 pixel from the edge on the bottom
        if (yRatio > 0.99) {
            yRatio = 1;
        }

        view.fireEvent('handledrag', yRatio);
    },

    // Whenever we mousedown over the slider area
    onMouseDown: function(e) {
        var me         = this,
            dragHandle = me.getDragHandle(),
            y = e.getY();

        // position drag handle accordingly
        dragHandle.setY(y);
        me.onHandleDrag();

        dragHandle.el.repaint();
        // tie into the default dd mechanism
        dragHandle.dd.onMouseDown(e, dragHandle.dd.el);
    },

    // Whenever we start a drag over the colormap area
    onDragStart: function(e) {
        var me         = this,
            dragHandle = me.getDragHandle();

        // tie into the default dd mechanism
        dragHandle.dd.onDragStart(e, dragHandle.dd.el);
    },

    onMouseUp: function () {
        var dragHandle = this.getDragHandle();

        dragHandle.dd.dragEnded = true; // work around DragTracker bug
    }
});
