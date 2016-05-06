/**
 * @abstract
 * @class Ext.chart.series.Cartesian
 * @extends Ext.chart.series.Series
 *
 * Common base class for series implementations that plot values using cartesian coordinates.
 *
 * @constructor
 */
Ext.define('Ext.chart.series.Cartesian', {
    extend: 'Ext.chart.series.Series',
    config: {
        /**
         * @cfg {String} xField
         * The field used to access the x axis value from the items from the data source.
         */
        xField: null,

        /**
         * @cfg {String|String[]} yField
         * The field(s) used to access the y-axis value(s) of the items from the data source.
         */
        yField: null,

        /**
         * @cfg {Ext.chart.axis.Axis|Number|String}
         * xAxis The chart axis the series is bound to in the 'X' direction.
         * Normally, this would be set automatically by the series.
         * For charts with multiple x-axes, this defines which x-axis is used by the series.
         * It refers to either axis' ID or the (zero-based) index of the axis
         * in the chart's {@link Ext.chart.AbstractChart#axes axes} config.
         */
        xAxis: null,

        /**
         * @cfg {Ext.chart.axis.Axis|Number|String}
         * yAxis The chart axis the series is bound to in the 'Y' direction.
         * Normally, this would be set automatically by the series.
         * For charts with multiple y-axes, this defines which y-axis is used by the series.
         * It refers to either axis' ID or the (zero-based) index of the axis
         * in the chart's {@link Ext.chart.AbstractChart#axes axes} config.
         */
        yAxis: null
    },

    directions: ['X', 'Y'],

    /**
     * @private
     *
     * Tells which store record fields should be used for a specific axis direction. E.g. for
     *
     *     fieldCategory<direction>: ['<fieldConfig1>', '<fieldConfig2>', ...]
     *
     * the field names from the following configs will be used:
     *
     *     series.<fieldConfig1>Field, series.<fieldConfig2>Field, ...
     *
     */
    fieldCategoryX: ['X'],
    fieldCategoryY: ['Y'],

    applyXAxis: function (newAxis, oldAxis) {
        return this.getChart().getAxis(newAxis) || oldAxis;
    },

    applyYAxis: function (newAxis, oldAxis) {
        return this.getChart().getAxis(newAxis) || oldAxis;
    },

    updateXAxis: function (axis) {
        axis.processData(this);
    },

    updateYAxis: function (axis) {
        axis.processData(this);
    },

    coordinateX: function () {
        return this.coordinate('X', 0, 2);
    },

    coordinateY: function () {
        return this.coordinate('Y', 1, 2);
    },

    getItemForPoint: function (x, y) {
        if (this.getSprites()) {
            var me = this,
                sprite = me.getSprites()[0],
                store = me.getStore(),
                item, index;

            if (me.getHidden()) {
                return null;
            }
            if (sprite) {
                index = sprite.getIndexNearPoint(x, y);
                if (index !== -1) {
                    item = {
                        series: me,
                        category: me.getItemInstancing() ? 'items' : 'markers',
                        index: index,
                        record: store.getData().items[index],
                        field: me.getYField(),
                        sprite: sprite
                    };
                    return item;
                }
            }
        }
    },

    createSprite: function () {
        var me = this,
            sprite = me.callParent(),
            chart = me.getChart(),
            xAxis = me.getXAxis();

        sprite.setAttributes({
            flipXY: chart.getFlipXY(),
            xAxis: xAxis
        });
        if (sprite.setAggregator && xAxis && xAxis.getAggregator) {
            if (xAxis.getAggregator) {
                sprite.setAggregator({strategy: xAxis.getAggregator()});
            } else {
                sprite.setAggregator({});
            }
        }
        return sprite;
    },

    getSprites: function () {
        var me = this,
            chart = this.getChart(),
            animation = me.getAnimation() || chart && chart.getAnimation(),
            itemInstancing = me.getItemInstancing(),
            sprites = me.sprites, sprite;

        if (!chart) {
            return [];
        }

        if (!sprites.length) {
            sprite = me.createSprite();
        } else {
            sprite = sprites[0];
        }

        if (animation) {
            if (itemInstancing) {
                sprite.itemsMarker.getTemplate().fx.setConfig(animation);
            }
            sprite.fx.setConfig(animation);
        }
        return sprites;
    },

    provideLegendInfo: function (target) {
        var me = this,
            style = me.getSubStyleWithTheme(),
            fill = style.fillStyle;

        if (Ext.isArray(fill)) {
            fill = fill[0];
        }
        target.push({
            name: me.getTitle() || me.getYField() || me.getId(),
            mark: (Ext.isObject(fill) ? fill.stops && fill.stops[0].color : fill) || style.strokeStyle || 'black',
            disabled: me.getHidden(),
            series: me.getId(),
            index: 0
        });
    },

    getXRange: function () {
        return [this.dataRange[0], this.dataRange[2]];
    },

    getYRange: function () {
        return [this.dataRange[1], this.dataRange[3]];
    }
})
;