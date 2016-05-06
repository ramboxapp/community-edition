/**
 * @class Ext.chart.axis.Numeric
 * @extends Ext.chart.axis.Axis
 *
 * An axis to handle numeric values. This axis is used for quantitative data as
 * opposed to the category axis. You can set minimum and maximum values to the
 * axis so that the values are bound to that. If no values are set, then the
 * scale will auto-adjust to the values.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'cartesian', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        store: {
 *            fields: ['name', 'data1', 'data2', 'data3'],
 *            data: [{
 *                'name': 1,
 *                'data1': 10,
 *                'data2': 12,
 *                'data3': 14
 *            }, {
 *                'name': 2,
 *                'data1': 7,
 *                'data2': 8,
 *                'data3': 16
 *            }, {
 *                'name': 3,
 *                'data1': 5,
 *                'data2': 2,
 *                'data3': 14
 *            }, {
 *                'name': 4,
 *                'data1': 2,
 *                'data2': 14,
 *                'data3': 6
 *            }, {
 *                'name': 5,
 *                'data1': 27,
 *                'data2': 38,
 *                'data3': 36
 *            }]
 *        },
 *        axes: {
 *            type: 'numeric',
 *            position: 'left',
 *            minimum: 0,
 *            fields: ['data1', 'data2', 'data3'],
 *            title: 'Sample Values',
 *            grid: {
 *                odd: {
 *                    opacity: 1,
 *                    fill: '#F2F2F2',
 *                    stroke: '#DDD',
 *                    'lineWidth': 1
 *                }
 *            }
 *        },
 *        series: {
 *            type: 'area',
 *            subStyle: {
 *                fill: ['#0A3F50', '#30BDA7', '#96D4C6']
 *            },
 *            xField: 'name',
 *            yField: ['data1', 'data2', 'data3']
 *        }
 *     });
 *
 * In this example we create an axis of Numeric type. We set a minimum value so that
 * even if all series have values greater than zero, the grid starts at zero. We bind
 * the axis onto the left part of the surface by setting _position_ to _left_.
 * We bind three different store fields to this axis by setting _fields_ to an array.
 * We set the title of the axis to _Number of Hits_ by using the _title_ property.
 * We use a _grid_ configuration to set odd background rows to a certain style and even rows
 * to be transparent/ignored.
 *
 */
Ext.define('Ext.chart.axis.Numeric', {
    extend: 'Ext.chart.axis.Axis',
    type: 'numeric',
    alias: [
        'axis.numeric',
        'axis.radial' // legacy charts compatibility
    ],
    requires: [
        'Ext.chart.axis.layout.Continuous',
        'Ext.chart.axis.segmenter.Numeric'
    ],
    config: {
        layout: 'continuous',

        segmenter: 'numeric',

        aggregator: 'double'
    }
});
