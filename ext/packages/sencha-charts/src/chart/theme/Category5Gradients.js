Ext.define('Ext.chart.theme.Category5Gradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.category5-gradients',
        'chart.theme.Category5:gradients'
    ],
    config: {
        colors: ['#7eae29', '#fdbe2a', '#910019', '#27b4bc', '#d74dbc'],
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});