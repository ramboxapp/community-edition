/**
 * @class Ext.chart.Legend
 */
Ext.define('Ext.chart.Legend', {
    xtype: 'legend',
    extend: 'Ext.chart.LegendBase',
    config: {
        baseCls: Ext.baseCSSPrefix + 'legend',
        padding: 5,

        /**
         * @cfg {Array}
         * The rect of the legend related to its container.
         */
        rect: null,

        disableSelection: true,

        /**
         * @cfg {Boolean} toggleable
         * `true` to allow series items to have their visibility
         * toggled by interaction with the legend items.
         */
        toggleable: true
    },

    toggleItem: function (index) {
        if (!this.getToggleable()) {
            return;
        }
        var store = this.getStore(),
            disabledCount = 0, disabled,
            canToggle = true,
            i, count, record;

        if (store) {
            count = store.getCount();
            for (i = 0; i < count; i++) {
                record = store.getAt(i);
                if (record.get('disabled')) {
                    disabledCount++;
                }
            }
            canToggle = count - disabledCount > 1;

            record = store.getAt(index);
            if (record) {
                disabled = record.get('disabled');
                if (disabled || canToggle) {
                    record.set('disabled', !disabled);
                }
            }
        }
    }

});
