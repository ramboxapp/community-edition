/**
 * Used for "Alpha" slider.
 * @private
 */
Ext.define('Ext.ux.colorpick.SliderAlpha', {
    extend : 'Ext.ux.colorpick.Slider',
    alias  : 'widget.colorpickerslideralpha',
    cls    : Ext.baseCSSPrefix + 'colorpicker-alpha',

    requires: [
        'Ext.XTemplate'
    ],

    gradientStyleTpl: Ext.create('Ext.XTemplate',
        Ext.isIE && Ext.ieVersion < 10
        ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=\'#FF{hex}\', endColorstr=\'#00{hex}\');' /* IE6-9 */
        : 'background: -mox-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +   /* FF3.6+ */
          'background: -webkit-linear-gradient(top,rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' + /* Chrome10+,Safari5.1+ */
          'background: -o-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +      /* Opera 11.10+ */
          'background: -ms-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +     /* IE10+ */
          'background: linear-gradient(to bottom, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);'     /* W3C */
    ),

    // Called via data binding whenever selectedColor.a changes; param is 0-100
    setAlpha: function (value) {
        var me              = this,
            container       = me.getDragContainer(),
            dragHandle      = me.getDragHandle(),
            containerEl     = container.getEl(),
            containerHeight = containerEl.getHeight(),
            el, top;

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        // y-axis of slider with value 0-1 translates to reverse of "value"
        top = containerHeight * (1 - (value / 100));

        // Position dragger
        el = dragHandle.getEl();
        el.setStyle({
            top: top
        });
    },

    // Called via data binding whenever selectedColor.h changes; hue param is 0-1
    setColor: function(color) {
        var me = this,
            container = me.getDragContainer(),
            hex, el;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        // Determine HEX for new hue and set as background based on template
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(color.r, color.g, color.b);

        el = container.getEl().down('.x-autocontainer-innerCt');
        el.applyStyles(me.gradientStyleTpl.apply({hex: hex, r: color.r, g: color.g, b: color.b}));
    }
});
