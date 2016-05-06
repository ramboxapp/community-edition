Ext.define('Ext.chart.theme.Midnight', {
    extend: 'Ext.chart.theme.Base',
    singleton: true,
    alias: [
        'chart.theme.midnight',
        'chart.theme.Midnight'
    ],
    config: {
        colors: [
            '#A837FF',
            '#4AC0F2',
            '#FF4D35',
            '#FF8809',
            '#61C102',
            '#FF37EA'
        ],

        chart: {
            defaults: {
                background: 'rgb(52, 52, 53)'
            }
        },

        axis: {
            defaults: {
                style: {
                    strokeStyle: 'rgb(224, 224, 227)'
                },
                label: {
                    fillStyle: 'rgb(224, 224, 227)'
                },
                title: {
                    fillStyle: 'rgb(224, 224, 227)'
                },
                grid: {
                    strokeStyle: 'rgb(112, 112, 115)'
                }
            }
        },

        series: {
            defaults: {
                label: {
                    fillStyle: 'rgb(224, 224, 227)'
                }
            }
        },

        sprites: {
            text: {
                fillStyle: 'rgb(224, 224, 227)'
            }
        }
    }
});