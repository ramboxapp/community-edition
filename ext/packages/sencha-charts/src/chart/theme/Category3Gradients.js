Ext.define('Ext.chart.theme.Category3Gradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.category3-gradients',
        'chart.theme.Category3:gradients'
    ],
    config: {
        colors: ['#fbbc29', '#ce2e4e', '#7e0062', '#158b90', '#57880e'],
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});