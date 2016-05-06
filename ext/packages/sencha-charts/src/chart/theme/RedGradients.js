Ext.define('Ext.chart.theme.RedGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.red-gradients',
        'chart.theme.Red:gradients'
    ],
    config: {
        baseColor: '#e84b67',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});