Ext.define('Ext.chart.theme.DefaultGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.default-gradients',
        'chart.theme.Base:gradients'
    ],
    config: {
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});