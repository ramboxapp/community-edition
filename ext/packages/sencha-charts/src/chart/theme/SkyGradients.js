Ext.define('Ext.chart.theme.SkyGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.sky-gradients',
        'chart.theme.Sky:gradients'
    ],
    config: {
        baseColor: '#4ce0e7',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});