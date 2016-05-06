Ext.define('Ext.chart.theme.GreenGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.green-gradients',
        'chart.theme.Green:gradients'
    ],
    config: {
        baseColor: '#b1da5a',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});