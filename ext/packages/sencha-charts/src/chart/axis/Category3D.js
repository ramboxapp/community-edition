/**
 * Category 3D Axis
 */
Ext.define('Ext.chart.axis.Category3D', {
    requires: [
        'Ext.chart.axis.layout.CombineDuplicate',
        'Ext.chart.axis.segmenter.Names'
    ],
    extend: 'Ext.chart.axis.Axis3D',
    alias: 'axis.category3d',
    type: 'category3d',

    config: {
        layout: 'combineDuplicate',

        segmenter: 'names'
    }
});
