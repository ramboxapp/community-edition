Ext.define('Ext.chart.overrides.AbstractChart', {
    override: 'Ext.chart.AbstractChart',

    updateLegend: function (legend) {
        this.callParent(arguments);
        if (legend) {
            this.add(legend);
        }
    },

    setParent: function (parent) {
        this.callParent(arguments);
        if (parent && this.getLegend()) {
            parent.add(this.getLegend());
        }
    },

    onItemRemove: function (item) {
        this.callParent(arguments);
        if (this.surfaceMap) {
            Ext.Array.remove(this.surfaceMap[item.type], item);
            if (this.surfaceMap[item.type].length === 0) {
                delete this.surfaceMap[item.type];
            }
        }
    }
});