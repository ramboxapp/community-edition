Ext.define('Ext.chart.theme.PurpleGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.purple-gradients',
        'chart.theme.Purple:gradients'
    ],
    config: {
        baseColor: '#da5abd',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});