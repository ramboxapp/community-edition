/**
 * @class Ext.chart.axis.Numeric3D
 */
Ext.define('Ext.chart.axis.Numeric3D', {
    extend: 'Ext.chart.axis.Axis3D',
    alias: ['axis.numeric3d'],
    type: 'numeric3d',
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