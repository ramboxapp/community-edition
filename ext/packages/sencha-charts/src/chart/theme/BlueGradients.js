Ext.define('Ext.chart.theme.BlueGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.blue-gradients',
        'chart.theme.Blue:gradients'
    ],
    config: {
        baseColor: '#4d7fe6',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});