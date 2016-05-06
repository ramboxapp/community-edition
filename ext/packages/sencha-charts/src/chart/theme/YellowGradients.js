Ext.define('Ext.chart.theme.YellowGradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.yellow-gradients',
        'chart.theme.Yellow:gradients'
    ],
    config: {
        baseColor: '#fec935',
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});