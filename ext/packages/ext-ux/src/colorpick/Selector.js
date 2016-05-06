/**
 * Sencha Pro Services presents xtype "colorselector".
 * API has been kept as close to the regular colorpicker as possible. The Selector can be
 * rendered to any container.
 *
 * The defaul selected color is configurable via {@link #value} config. Usually used in
 * forms via {@link Ext.ux.colorpick.Button} or {@link Ext.ux.colorpick.Field}.
 *
 * Typically you will need to listen for the change event to be notified when the user
 * chooses a color. Alternatively, you can bind to the "value" config
 *
 *     @example
 *     Ext.create('Ext.ux.colorpick.Selector', {
 *         value     : '993300',  // initial selected color
 *         renderTo  : Ext.getBody(),
 *         listeners: {
 *             change: function (colorselector, color) {
 *                 console.log('New color: ' + color);
 *             }
 *         }
 *     });
 */
Ext.define('Ext.ux.colorpick.Selector', {
    extend: 'Ext.container.Container',
    xtype: 'colorselector',

    mixins: [
        'Ext.ux.colorpick.Selection'
    ],

    controller : 'colorpick-selectorcontroller',

    requires: [
        'Ext.layout.container.HBox',
        'Ext.form.field.Text',
        'Ext.form.field.Number',
        'Ext.ux.colorpick.ColorMap',
        'Ext.ux.colorpick.SelectorModel',
        'Ext.ux.colorpick.SelectorController',
        'Ext.ux.colorpick.ColorPreview',
        'Ext.ux.colorpick.Slider',
        'Ext.ux.colorpick.SliderAlpha',
        'Ext.ux.colorpick.SliderSaturation',
        'Ext.ux.colorpick.SliderValue',
        'Ext.ux.colorpick.SliderHue'
    ],

    width: 580, // default width and height gives 255x255 color map in Crisp
    height: 337,

    cls: Ext.baseCSSPrefix + 'colorpicker',
    padding: 10,

    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    defaultBindProperty: 'value',
    twoWayBindable: [
        'value'
    ],

    /**
     * @cfg fieldWidth {Number} Width of the text fields on the container (excluding HEX);
     * since the width of the slider containers is the same as the text field under it 
     * (it's the same vbox column), changing this value will also affect the spacing between
     * the sliders.
     */
    fieldWidth: 50,

    /**
     * @cfg fieldPad {Number} padding between the sliders and HEX/R/G/B fields.
     */    
    fieldPad: 5,

    /**
     * @cfg {Boolean} [showPreviousColor]
     * Whether "previous color" region (in upper right, below the selected color preview) should be shown;
     * these are relied upon by the {@link Ext.ux.colorpick.Button} and the {@link Ext.ux.colorpick.Field}.
     */
    showPreviousColor: false,

    /**
     * @cfg {Boolean} [showOkCancelButtons]
     * Whether Ok and Cancel buttons (in upper right, below the selected color preview) should be shown;
     * these are relied upon by the {@link Ext.ux.colorpick.Button} and the {@link Ext.ux.colorpick.Field}.
     */
    showOkCancelButtons: false,

    /**
     * @event change
     * Fires when a color is selected. Simply dragging sliders around will trigger this.
     * @param {Ext.ux.colorpick.Selector} this
     * @param {String} color The value of the selected color as per specified {@link #format}.
     * @param {String} previousColor The previous color value.
     */

    /**
     * @event ok
     * Fires when OK button is clicked (see {@link #showOkCancelButtons}).
     * @param {Ext.ux.colorpick.Selector} this
     * @param {String} color The value of the selected color as per specified {@link #format}.
     */

    /**
     * @event cancel
     * Fires when Cancel button is clicked (see {@link #showOkCancelButtons}).
     * @param {Ext.ux.colorpick.Selector} this
     */

    listeners: {
        resize: 'onResize'
    },

    constructor: function (config) {
        var me             = this,
            childViewModel = Ext.Factory.viewModel('colorpick-selectormodel');

        // Since this component needs to present its value as a thing to which users can
        // bind, we create an internal VM for our purposes.
        me.childViewModel = childViewModel;
        me.items = [
            me.getMapAndHexRGBFields(childViewModel),
            me.getSliderAndHField(childViewModel),
            me.getSliderAndSField(childViewModel),
            me.getSliderAndVField(childViewModel),
            me.getSliderAndAField(childViewModel),
            me.getPreviewAndButtons(childViewModel, config)
        ];

        me.callParent(arguments);
    },

    updateColor: function (color) {
        var me = this;

        me.mixins.colorselection.updateColor.call(me, color);

        me.childViewModel.set('selectedColor', color);
    },

    updatePreviousColor: function (color) {
        this.childViewModel.set('previousColor', color);
    },

    // Splits up view declaration for readability
    // "Map" and HEX/R/G/B fields
    getMapAndHexRGBFields: function (childViewModel) {
        var me = this,
            fieldMargin = { top: 0, right: me.fieldPad, bottom: 0, left: 0 },
            fieldWidth = me.fieldWidth;

        return {
            xtype     : 'container',
            viewModel : childViewModel,
            cls       : Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            flex      : 1,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            },
            margin : '0 10 0 0',
            items  : [
                // "MAP"
                {
                    xtype : 'colorpickercolormap',
                    reference: 'colorMap',
                    flex  : 1,
                    bind  : {
                        position: {
                            bindTo : '{selectedColor}',
                            deep   : true
                        },
                        hue: '{selectedColor.h}'
                    },
                    listeners : {
                        handledrag: 'onColorMapHandleDrag'
                    }
                },
                // HEX/R/G/B FIELDS
                {
                    xtype    : 'container',
                    layout   : 'hbox',

                    defaults : {
                        labelAlign: 'top',
                        labelSeparator: '',
                        allowBlank: false,

                        onChange: function () { // prevent data binding propagation if bad value
                            if (this.isValid()) {
                                // this is kind of dirty and ideally we would extend these fields
                                // and override the method, but works for now
                                Ext.form.field.Base.prototype.onChange.apply(this, arguments);
                            }
                        }
                    },

                    items: [{
                        xtype      : 'textfield',
                        fieldLabel : 'HEX',
                        flex       : 1,
                        bind       : '{hex}',
                        margin     : fieldMargin,
                        readOnly   : true
                    }, {
                        xtype       : 'numberfield',
                        fieldLabel  : 'R',
                        bind        : '{red}',
                        width       : fieldWidth,
                        hideTrigger : true,
                        maxValue    : 255,
                        minValue    : 0,
                        margin      : fieldMargin
                    }, {
                        xtype       : 'numberfield',
                        fieldLabel  : 'G',
                        bind        : '{green}',
                        width       : fieldWidth,
                        hideTrigger : true,
                        maxValue    : 255,
                        minValue    : 0,
                        margin      : fieldMargin
                    }, {
                        xtype       : 'numberfield',
                        fieldLabel  : 'B',
                        bind        : '{blue}',
                        width       : fieldWidth,
                        hideTrigger : true,
                        maxValue    : 255,
                        minValue    : 0,
                        margin      : 0
                    }]
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and H field 
    getSliderAndHField: function (childViewModel) {
        var me = this;
        return {
            xtype     : 'container',
            viewModel : childViewModel,
            cls       : Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width     : me.fieldWidth,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            },
            items  : [
                {
                    xtype: 'colorpickersliderhue',
                    reference: 'hueSlider',
                    flex  : 1,
                    bind: {
                        hue: '{selectedColor.h}'
                    },
                    listeners: {
                        handledrag: 'onHueSliderHandleDrag'
                    }
                },
                {
                    xtype          : 'numberfield',
                    fieldLabel     : 'H',
                    labelAlign     : 'top',
                    width          : me.fieldWidth,
                    labelSeparator : '',
                    bind           : '{hue}',
                    hideTrigger    : true,
                    maxValue       : 360,
                    minValue       : 0,
                    allowBlank     : false,
                    margin         : 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and S field 
    getSliderAndSField: function (childViewModel) {
        var me = this;
        return {
            xtype     : 'container',
            viewModel : childViewModel,
            cls       : Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width     : me.fieldWidth,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            },
            margin: {
                right  : me.fieldPad,
                left   : me.fieldPad
            },
            items: [
                {
                    xtype : 'colorpickerslidersaturation',
                    reference: 'satSlider',
                    flex  : 1,
                    bind  : {
                        saturation : '{saturation}',
                        hue        : '{selectedColor.h}'
                    },
                    listeners : {
                        handledrag: 'onSaturationSliderHandleDrag'
                    }
                },
                {
                    xtype          : 'numberfield',
                    fieldLabel     : 'S',
                    labelAlign     : 'top',
                    labelSeparator : '',
                    bind           : '{saturation}',
                    hideTrigger    : true,
                    maxValue       : 100,
                    minValue       : 0,
                    allowBlank     : false,
                    margin         : 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and V field 
    getSliderAndVField: function (childViewModel) {
        var me = this;
        return {
            xtype     : 'container',
            viewModel : childViewModel,
            cls       : Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width     : me.fieldWidth,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            },
            items: [
                {
                    xtype : 'colorpickerslidervalue',
                    reference: 'valueSlider',
                    flex  : 1,
                    bind  : {
                        value : '{value}',
                        hue   : '{selectedColor.h}'
                    },
                    listeners : {
                        handledrag: 'onValueSliderHandleDrag'
                    }
                },
                {
                    xtype          : 'numberfield',
                    fieldLabel     : 'V',
                    labelAlign     : 'top',
                    labelSeparator : '',
                    bind           : '{value}',
                    hideTrigger    : true,
                    maxValue       : 100,
                    minValue       : 0,
                    allowBlank     : false,
                    margin         : 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and A field 
    getSliderAndAField: function (childViewModel) {
        var me = this;
        return {
            xtype     : 'container',
            viewModel : childViewModel,
            cls       : Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width     : me.fieldWidth,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            },
            margin: {
                left: me.fieldPad
            },
            items: [
                {
                    xtype : 'colorpickerslideralpha',
                    reference: 'alphaSlider',
                    flex  : 1,
                    bind  : {
                        alpha : '{alpha}',
                        color : {
                            bindTo: '{selectedColor}',
                            deep: true
                        }
                    },
                    listeners : {
                        handledrag: 'onAlphaSliderHandleDrag'
                    }
                },
                {
                    xtype          : 'numberfield',
                    fieldLabel     : 'A',
                    labelAlign     : 'top',
                    labelSeparator : '',
                    bind           : '{alpha}',
                    hideTrigger    : true,
                    maxValue       : 100,
                    minValue       : 0,
                    allowBlank     : false,
                    margin         : 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Preview current/previous color squares and OK and Cancel buttons
    getPreviewAndButtons: function (childViewModel, config) {
        // selected color preview is always shown
        var items = [{
            xtype : 'colorpickercolorpreview',
            flex  : 1,
            bind  : {
                color: {
                    bindTo : '{selectedColor}',
                    deep   : true
                }
            }
        }];

        // previous color preview is optional
        if (config.showPreviousColor) {
            items.push({
                xtype  : 'colorpickercolorpreview',
                flex   : 1,
                bind   : {
                    color: {
                        bindTo : '{previousColor}',
                        deep   : true
                    }
                },
                listeners: {
                    click: 'onPreviousColorSelected'
                }
            });
        }

        // Ok/Cancel buttons are optional
        if (config.showOkCancelButtons) {
            items.push({
                xtype   : 'button',
                text    : 'OK',
                margin  : '10 0 0 0',
                handler : 'onOK'
            },
            {
                xtype   : 'button',
                text    : 'Cancel',
                margin  : '10 0 0 0',
                handler : 'onCancel'
            });
        }

        return {
            xtype     : 'container',
            viewModel : childViewModel,
            width     : 70,
            margin    : '0 0 0 10',
            items     : items,
            layout    : {
                type  : 'vbox',
                align : 'stretch'
            }
        };
    }
});
