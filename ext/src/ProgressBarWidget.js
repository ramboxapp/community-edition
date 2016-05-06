/**
 * An update-able progress bar widget.
 *
 * In manual mode, you are responsible for showing, updating (via {@link #setValue})
 * and clearing the progress bar as needed from your own code. This method is most
 * appropriate when you want to show progress throughout an operation that has predictable
 * points of interest at which you can update the control.
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields: ['name', 'progress'],
 *         data: [
 *             { name: 'Lisa', progress: .159 },
 *             { name: 'Bart', progress: .216 },
 *             { name: 'Homer', progress: .55 },
 *             { name: 'Maggie', progress: .167 },
 *             { name: 'Marge', progress: .145 }
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Simpsons',
 *         store: store,
 *         columns: [
 *             { text: 'Name',  dataIndex: 'name' },
 *             {
 *                 text: 'Progress',
 *                 xtype: 'widgetcolumn',
 *                 width: 120,
 *                 dataIndex: 'progress',
 *                 widget: {
 *                     xtype: 'progressbarwidget'
 *                 }
 *             }
 *         ],
 *         height: 200,
 *         width: 400,
 *         renderTo: Ext.getBody()
 *     });
 *
 */
Ext.define('Ext.ProgressBarWidget', {
    extend: 'Ext.Widget',
    alias: 'widget.progressbarwidget',

    // Required to pull in the styles
    requires: [
        'Ext.ProgressBar'
    ],

    config: {
        /**
         * @cfg {String} [text]
         * The background text
         */
        text: null,

        /**
         * @cfg {Number} [value=0]
         * A floating point value between 0 and 1 (e.g., .5)
         */
        value: 0,

        /**
         * @cfg {Boolean} [animate=false]
         * Specify as `true` to have this progress bar animate to new extent when updated.
         */
        animate: false,

        /**
         * @cfg {String/Ext.XTemplate} [textTpl]
         * A template used to create this ProgressBar's background text given two values:
         *
         *    `value  ' - The raw progress value between 0 and 1
         *    'percent' - The value as a percentage between 0 and 100
         */
        textTpl: null
    },

    cachedConfig: {
        /**
         * @cfg {String} [baseCls='x-progress']
         * The base CSS class to apply to the progress bar's wrapper element.
         */
        baseCls: Ext.baseCSSPrefix + 'progress',

        textCls: Ext.baseCSSPrefix + 'progress-text',

        ui: 'default'
    },

    template: [{
        reference: 'backgroundEl'
    }, {
        reference: 'barEl',
        children: [{
            reference: 'textEl'
        }]
    }],

    defaultBindProperty: 'value',

    doSetWidth: function(width) {
        var me = this;

        me.callParent([width]);
        width -= me.element.getBorderWidth('lr');
        me.backgroundEl.setWidth(width);
        me.textEl.setWidth(width);
    },
            
    updateUi: function(ui, oldUi) {
        var element = this.element,
            barEl = this.barEl,
            baseCls = this.getBaseCls() + '-';

        if (oldUi) {
            element.removeCls(baseCls + oldUi);
            barEl.removeCls(baseCls + 'bar-' + oldUi);
        }

        element.addCls(baseCls + ui);
        barEl.addCls(baseCls + 'bar-' + ui);
    },

    updateBaseCls: function(baseCls, oldBaseCls) {
        //<debug>
        if (oldBaseCls) {
            Ext.Error.raise('You cannot configure baseCls - use a subclass');
        }
        //</debug>
        this.element.addCls(baseCls);
        this.barEl.addCls(baseCls + '-bar');
    },

    updateTextCls: function(textCls) {
        this.backgroundEl.addCls(textCls + ' ' + textCls + '-back');
        this.textEl.addCls(textCls);
    },

    applyValue: function(value) {
        return value || 0;
    },

    updateValue: function(value, oldValue) {
        var me = this,
            barEl = me.barEl,
            textTpl = me.getTextTpl();

        if (textTpl) {
            me.setText(textTpl.apply({
                value: value,
                percent: Math.round(value * 100)
            }));
        }
        if (me.getAnimate()) {
            barEl.stopAnimation();
            barEl.animate(Ext.apply({
                from: {
                    width: (oldValue * 100) + '%'
                },
                to: {
                    width: (value * 100) + '%'
                }
            }, me.animate));
        } else {
            barEl.setStyle('width', (value * 100) + '%');
        }
    },

    updateText: function(text) {
        this.backgroundEl.setHtml(text);
        this.textEl.setHtml(text);
    },

    applyTextTpl: function(textTpl) {
        if (!textTpl.isTemplate) {
            textTpl = new Ext.XTemplate(textTpl);
        }
        return textTpl;
    }
});
