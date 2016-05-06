/**
 * A simple color swatch that can be clicked to bring up the color selector.
 *
 * The selected color is configurable via {@link #value}.
 *
 *     @example
 *     Ext.create('Ext.ux.colorpick.Button', {
 *         value: '993300',  // initial selected color
 *         renderTo: Ext.getBody(),
 *
 *         listeners: {
 *             select: function(picker, selColor) {
 *                 Ext.Msg.alert('Color', selColor);
 *             }
 *         }
 *     });
 */
Ext.define('Ext.ux.colorpick.Button', {
    extend: 'Ext.Component',
    xtype: 'colorbutton',

    controller: 'colorpick-buttoncontroller',

    mixins: [
        'Ext.ux.colorpick.Selection'
    ],

    requires: [
        'Ext.ux.colorpick.ButtonController'
    ],

    baseCls: Ext.baseCSSPrefix + 'colorpicker-button',

    width: 20,
    height: 20,

    childEls: [
        'btnEl', 'filterEl'
    ],

    config: {
        /**
         * @cfg {Object} popup
         * This object configures the popup window and colorselector component displayed
         * when this button is clicked. Applications should not need to configure this.
         * @private
         */
        popup: {
            lazy: true,
            $value: {
                xtype: 'window',
                referenceHolder: true,
                minWidth: 540,
                minHeight: 200,
                layout: 'fit',
                header: false,
                resizable: true,
                items: {
                    xtype: 'colorselector',
                    reference: 'selector',
                    showPreviousColor: true,
                    showOkCancelButtons: true
                }
            }
        }
    },

    defaultBindProperty: 'value',
    twoWayBindable: 'value',

    // Solve issue with IE, when applying a filter the click listener is not being fired.
    renderTpl:
        '<div id="{id}-filterEl" data-ref="filterEl" style="height:100%; width:100%; position: absolute;"></div>'+
        '<a id="{id}-btnEl" data-ref="btnEl" style="height:100%; width:100%; position: absolute;"></a>',

    listeners: {
        click: 'onClick',
        element: 'btnEl'
    },

    /**
     * @event change
     * Fires when a color is selected.
     * @param {Ext.ux.colorpick.Selector} this
     * @param {String} color The value of the selected color as per specified {@link #format}.
     * @param {String} previousColor The previous color value.
     */

    updateColor: function (color) {
        var me = this,
            cp = me.colorPicker;

        me.mixins.colorselection.updateColor.call(me, color);

        Ext.ux.colorpick.ColorUtils.setBackground(me.filterEl, color);

        if (cp) {
            cp.setColor(color);
        }
    },

    // Sets this.format and color picker's setFormat()
    updateFormat: function(format) {
        var cp = this.colorPicker;

        if (cp) {
            cp.setFormat(format);
        }
    }
});
