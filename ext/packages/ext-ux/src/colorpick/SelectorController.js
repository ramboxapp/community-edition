Ext.define('Ext.ux.colorpick.SelectorController', {
    extend : 'Ext.app.ViewController',
    alias  : 'controller.colorpick-selectorcontroller',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    initViewModel: function () {
        var me = this,
            view = me.getView();

        // And ensure that the
        view.childViewModel.bind('{selectedColor}', function (color) {
            view.setColor(color);
        });
    },

    destroy: function () {
        var me = this,
            view = me.getView(),
            childViewModel = view.childViewModel;

        if (childViewModel) {
            childViewModel.destroy();
            view.childViewModel = null;
        }

        me.callParent();
    },

    changeHSV: function (hsv) {
        var view = this.getView(),
            color = view.getColor(),
            rgb;

        // Put in values we are not changing (like A, but also missing HSV values)
        Ext.applyIf(hsv, color);

        // Now that HSV is complete, recalculate RGB and combine them
        rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hsv.h, hsv.s, hsv.v);
        Ext.apply(hsv, rgb);

        view.setColor(hsv);
    },

    // Updates Saturation/Value in the model based on ColorMap; params:
    // xPercent - where is the handle relative to the color map width
    // yPercent - where is the handle relative to the color map height
    onColorMapHandleDrag: function(xPercent, yPercent) {
        this.changeHSV({
            s: xPercent,
            v: 1 - yPercent
        });
    },

    // Updates HSV Value in the model and downstream RGB settings
    onValueSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            v: 1 - yPercent
        });
    },

    // Updates HSV Saturation in the model and downstream RGB settings
    onSaturationSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            s: 1 - yPercent
        });
    },

    // Updates Hue in the model and downstream RGB settings
    onHueSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            h: 1 - yPercent
        });
    },

    onAlphaSliderHandleDrag: function (yPercent) {
        var view = this.getView(),
            color = view.getColor(),
            newColor = Ext.applyIf({
                a: 1 - yPercent
            }, color);

        view.setColor(newColor);
        view.el.repaint();
    },

    onPreviousColorSelected: function (comp, color) {
        var view = this.getView();

        view.setColor(color);
    },

    onOK: function () {
        var me   = this,
            view = me.getView();

        view.fireEvent('ok', view, view.getValue());
    },

    onCancel: function () {
        this.fireViewEvent('cancel', this.getView());
    },

    onResize: function() {
        var me   = this,
            view = me.getView(),
            vm   = view.childViewModel,
            refs = me.getReferences(),
            h, s, v, a;

        // Skip initial rendering resize
        if (!me.hasResizedOnce) {
            me.hasResizedOnce = true;
            return;
        }

        h = vm.get('hue');
        s = vm.get('saturation');
        v = vm.get('value');
        a = vm.get('alpha');
console.log('h=' + h);
        // Reposition the colormap's & sliders' drag handles
        refs.colorMap.setPosition(vm.getData());
        refs.hueSlider.setHue(h);
        refs.satSlider.setSaturation(s);
        refs.valueSlider.setValue(v);
        refs.alphaSlider.setAlpha(a);
    }
});
