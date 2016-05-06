Ext.define('Ext.chart.theme.Category1Gradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.category1-gradients',
        'chart.theme.Category1:gradients'
    ],
    config: {
        colors: ['#f0a50a', '#c20024', '#2044ba', '#810065', '#7eae29'],
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});