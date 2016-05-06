Ext.define('Ext.ux.colorpick.ButtonController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.colorpick-buttoncontroller',

    requires: [
        'Ext.window.Window',
        'Ext.layout.container.Fit',
        'Ext.ux.colorpick.Selector',
        'Ext.ux.colorpick.ColorUtils'
    ],

    afterRender: function (view) {
        view.updateColor(view.getColor());
    },

    destroy: function () {
        var view = this.getView(),
            colorPickerWindow = view.colorPickerWindow;

        if (colorPickerWindow) {
            colorPickerWindow.destroy();
            view.colorPickerWindow = view.colorPicker = null;
        }

        this.callParent();
    },

    getPopup: function () {
        var view = this.getView(),
            popup = view.colorPickerWindow,
            selector;

        if (!popup) {
            popup = Ext.create(view.getPopup());

            view.colorPickerWindow = popup;
            popup.colorPicker = view.colorPicker = selector = popup.lookupReference('selector');
            selector.setFormat(view.getFormat());
            selector.on({
                ok: 'onColorPickerOK',
                cancel: 'onColorPickerCancel',
                scope: this
            });
        }

        return popup;
    },

    // When button is clicked show the color picker window
    onClick: function() {
        var me = this,
            view = me.getView(),
            color = view.getColor(),
            popup = me.getPopup(),
            colorPicker = popup.colorPicker;

        colorPicker.setColor(color);
        colorPicker.setPreviousColor(color);

        popup.showBy(view, 'tl-br?');
    },

    onColorPickerOK: function (picker) {
        var view  = this.getView(),
            color = picker.getColor(),
            cpWin = view.colorPickerWindow;

        cpWin.hide();

        view.setColor(color);
    },

    onColorPickerCancel: function () {
        var view  = this.getView(),
            cpWin = view.colorPickerWindow;

        cpWin.hide();
    },

    syncColor: function (color) {
        var view = this.getView();

        Ext.ux.colorpick.ColorUtils.setBackground(view.filterEl, color);
    }
});
