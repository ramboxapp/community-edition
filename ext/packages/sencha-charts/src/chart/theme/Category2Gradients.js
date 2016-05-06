Ext.define('Ext.chart.theme.Category2Gradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.category2-gradients',
        'chart.theme.Category2:gradients'
    ],
    config: {
        colors: ['#6d9824', '#87146e', '#2a9196', '#d39006', '#1e40ac'],
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});