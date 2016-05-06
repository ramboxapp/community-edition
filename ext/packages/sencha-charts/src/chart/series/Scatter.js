/**
 * @class Ext.chart.series.Scatter
 * @extends Ext.chart.series.Cartesian
 *
 * Creates a Scatter Chart. The scatter plot is useful when trying to display more than two variables in the same visualization.
 * These variables can be mapped into x, y coordinates and also to an element's radius/size, color, etc.
 * As with all other series, the Scatter Series must be appended in the *series* Chart array configuration. See the Chart
 * documentation for more information on creating charts. A typical configuration object for the scatter could be:
 *
 *     @example
 *     Ext.create({
 *        xtype: 'cartesian', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        insetPadding: 40,
 *        interactions: ['itemhighlight'],
 *        store: {
 *            fields: ['name', 'data1', 'data2'],
 *            data: [{
 *                'name': 'metric one',
 *                'data1': 10,
 *                'data2': 14
 *            }, {
 *                'name': 'metric two',
 *                'data1': 7,
 *                'data2': 16
 *            }, {
 *                'name': 'metric three',
 *                'data1': 5,
 *                'data2': 14
 *            }, {
 *                'name': 'metric four',
 *                'data1': 2,
 *                'data2': 6
 *            }, {
 *                'name': 'metric five',
 *                'data1': 27,
 *                'data2': 36
 *            }]
 *        },
 *        axes: [{
 *            type: 'numeric',
 *            position: 'left',
 *            fields: ['data1'],
 *            title: {
 *                text: 'Sample Values',
 *                fontSize: 15
 *            },
 *            grid: true,
 *            minimum: 0
 *        }, {
 *            type: 'category',
 *            position: 'bottom',
 *            fields: ['name'],
 *            title: {
 *                text: 'Sample Values',
 *                fontSize: 15
 *            }
 *        }],
 *        series: {
 *            type: 'scatter',
 *            highlight: {
 *                size: 12,
 *                radius: 12,
 *                fill: '#96D4C6',
 *                stroke: '#30BDA7'
 *            },
 *            fill: true,
 *            xField: 'name',
 *            yField: 'data2',
 *            marker: {
 *                type: 'circle',
 *                fill: '#30BDA7',
 *                radius: 10,
 *                lineWidth: 0
 *            }
 *        }
 *     });
 *
 * In this configuration we add three different categories of scatter series. Each of them is bound to a different field of the same data store,
 * `data1`, `data2` and `data3` respectively. All x-fields for the series must be the same field, in this case `name`.
 * Each scatter series has a different styling configuration for markers, specified by the `marker` object. Finally we set the left axis as
 * axis to show the current values of the elements.
 *
 */
Ext.define('Ext.chart.series.Scatter', {

    extend: 'Ext.chart.series.Cartesian',

    alias: 'series.scatter',

    type: 'scatter',
    seriesType: 'scatterSeries',

    requires: [
        'Ext.chart.series.sprite.Scatter'
    ],

    config: {
        itemInstancing: {
            fx: {
                customDurations: {
                    translationX: 0,
                    translationY: 0
                }
            }
        }
    },

    themeMarkerCount: function() {
        return 1;
    },

    applyMarker: function (marker, oldMarker) {
        this.getItemInstancing();
        this.setItemInstancing(marker);
        return this.callParent(arguments);
    },

    provideLegendInfo: function (target) {
        var me = this,
            style = me.getMarkerStyleByIndex(0),
            fill = style.fillStyle;

        target.push({
            name: me.getTitle() || me.getYField() || me.getId(),
            mark: (Ext.isObject(fill) ? fill.stops && fill.stops[0].color : fill) || style.strokeStyle || 'black',
            disabled: me.getHidden(),
            series: me.getId(),
            index: 0
        });
    }
});

