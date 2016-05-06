Ext.define('Ext.chart.theme.Category4Gradients', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.category4-gradients',
        'chart.theme.Category4:gradients'
    ],
    config: {
        colors: ['#ef5773', '#fcbd2a', '#4f770d', '#1d3eaa', '#9b001f'],
        gradients: {
            type: 'linear',
            degrees: 90
        }
    }
});