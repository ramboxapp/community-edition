/**
 * @class Ext.chart.LegendBase
 */
Ext.define('Ext.chart.LegendBase', {
    extend: 'Ext.view.View',
    config: {
        tpl: [
            '<div class="', Ext.baseCSSPrefix, 'legend-container">',
                '<tpl for=".">',
                    '<div class="', Ext.baseCSSPrefix, 'legend-item">',
                        '<span ',
                            'class="', Ext.baseCSSPrefix, 'legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + \'legend-inactive\' : \'\' ]}" ',
                            'style="background:{mark};">',
                        '</span>{name}',
                    '</div>',
                '</tpl>',
            '</div>'
        ],
        nodeContainerSelector: 'div.' + Ext.baseCSSPrefix + 'legend-container',
        itemSelector: 'div.' + Ext.baseCSSPrefix + 'legend-item',
        docked: 'bottom'
    },

    setDocked: function (docked) {
        var me = this,
            panel = me.ownerCt,
            layout;

        me.docked = docked;

        switch (docked) {
            case 'top':
            case 'bottom':
                me.addCls(Ext.baseCSSPrefix + 'horizontal');
                layout = 'hbox';
                break;
            case 'left':
            case 'right':
                me.removeCls(Ext.baseCSSPrefix + 'horizontal');
                layout = 'vbox';
                break;
        }

        if (panel) {
            panel.setDocked(docked);
        }
    },

    setStore: function (store) {
        this.bindStore(store);
    },

    clearViewEl: function () {
        this.callParent(arguments);
        // The legend-container div is not removed automatically.
        Ext.removeNode(this.getNodeContainer());
    },

    onItemClick: function (record, item, index, e) {
        this.callParent(arguments);
        this.toggleItem(index);
    }
});
