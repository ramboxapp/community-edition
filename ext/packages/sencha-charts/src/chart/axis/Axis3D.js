/**
 * @class Ext.chart.axis.Axis3D
 * @extends Ext.chart.axis.Axis
 * @xtype axis3d
 *
 * Defines a 3D axis for charts.
 *
 * A 3D axis has the same properties as the regular {@link Ext.chart.axis.Axis axis},
 * plus a notion of depth. The depth of the 3D axis is determined automatically
 * based on the depth of the bound series.
 *
 * This type of axis has the following limitations compared to the regular axis class:
 * - supported {@link Ext.chart.axis.Axis#position positions} are 'left' and 'bottom' only;
 * - floating axes are not supported.
 *
 * At the present moment only {@link Ext.chart.series.Bar3D} series can make use of the 3D axis.
 */
Ext.define('Ext.chart.axis.Axis3D', {
    extend: 'Ext.chart.axis.Axis',
    xtype: 'axis3d',

    config: {
        /**
         * @private
         * The depth of the axis. Determined automatically.
         */
        depth: 0

        /**
         * @cfg {String} position
         * Where to set the axis. Available options are `left` and `bottom`.
         */
    },

    onSeriesChange: function (chart) {
        var me = this,
            eventName = 'depthchange',
            listenerName = 'onSeriesDepthChange',
            i, series;

        function toggle(action) {
            var boundSeries = me.boundSeries;
            for (i = 0; i < boundSeries.length; i++) {
                series = boundSeries[i];
                series[action](eventName, listenerName, me);
            }
        }

        // Remove 'depthchange' listeners from old bound series, if any.
        toggle('un');

        me.callParent(arguments);

        // Add 'depthchange' listeners to new bound series.
        toggle('on');
    },

    onSeriesDepthChange: function (series, depth) {
        var me = this,
            maxDepth = depth,
            boundSeries = me.boundSeries,
            i, item;

        if (depth > me.getDepth()) {
            maxDepth = depth;
        } else {
            for (i = 0; i < boundSeries.length; i++) {
                item = boundSeries[i];
                if (item !== series && item.getDepth) {
                    depth = item.getDepth();
                    if (depth > maxDepth) {
                        maxDepth = depth;
                    }
                }
            }
        }
        me.setDepth(maxDepth);
    },

    updateDepth: function (depth) {
        var me = this,
            sprites = me.getSprites(),
            attr = {depth: depth};

        if (sprites && sprites.length) {
            sprites[0].setAttributes(attr);
        }
        if (me.gridSpriteEven && me.gridSpriteOdd) {
            me.gridSpriteEven.getTemplate().setAttributes(attr);
            me.gridSpriteOdd.getTemplate().setAttributes(attr);
        }
    },

    getGridAlignment: function () {
        switch (this.getPosition()) {
            case 'left':
            case 'right':
                return 'horizontal3d';
            case 'top':
            case 'bottom':
                return 'vertical3d';
        }
    }

});