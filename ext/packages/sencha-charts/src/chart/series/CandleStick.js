/**
 * @class Ext.chart.series.CandleStick
 * @extends Ext.chart.series.Cartesian
 * 
 * Creates a candlestick or OHLC Chart.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'cartesian', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        insetPadding: 40,
 *        store: {
 *            fields: ['time', 'open', 'high', 'low', 'close'],
 *            data: [{
 *                'time': new Date('Jan 1 2010').getTime(),
 *                'open': 600,
 *                'high': 614,
 *                'low': 578,
 *                'close': 590
 *            }, {
 *                'time': new Date('Jan 2 2010').getTime(),
 *                'open': 590,
 *                'high': 609,
 *                'low': 580,
 *                'close': 580
 *            }, {
 *                'time': new Date('Jan 3 2010').getTime(),
 *                'open': 580,
 *                'high': 602,
 *                'low': 578,
 *                'close': 602
 *            }, {
 *                'time': new Date('Jan 4 2010').getTime(),
 *                'open': 602,
 *                'high': 614,
 *                'low': 586,
 *                'close': 586
 *            }, {
 *                'time': new Date('Jan 5 2010').getTime(),
 *                'open': 586,
 *                'high': 602,
 *                'low': 565,
 *                'close': 565
 *            }]
 *        },
 *        axes: [{
 *            type: 'numeric',
 *            position: 'left',
 *            fields: ['open', 'high', 'low', 'close'],
 *            title: {
 *                text: 'Sample Values',
 *                fontSize: 15
 *            },
 *            grid: true,
 *            minimum: 560,
 *            maximum: 640
 *        }, {
 *            type: 'time',
 *            position: 'bottom',
 *            fields: ['time'],
 *            fromDate: new Date('Dec 31 2009'),
 *            toDate: new Date('Jan 6 2010'),
 *            title: {
 *                text: 'Sample Values',
 *                fontSize: 15
 *            },
 *            style: {
 *                axisLine: false
 *            }
 *        }],
 *        series: {
 *            type: 'candlestick',
 *            xField: 'time',
 *            openField: 'open',
 *            highField: 'high',
 *            lowField: 'low',
 *            closeField: 'close',
 *            style: {
 *                dropStyle: {
 *                    fill: 'rgb(222, 87, 87)',
 *                    stroke: 'rgb(222, 87, 87)',
 *                    lineWidth: 3
 *                },
 *                raiseStyle: {
 *                    fill: 'rgb(48, 189, 167)',
 *                    stroke: 'rgb(48, 189, 167)',
 *                    lineWidth: 3
 *                }
 *            }
 *        }
 *     });
 */
Ext.define('Ext.chart.series.CandleStick', {
    extend: 'Ext.chart.series.Cartesian',
    requires: ['Ext.chart.series.sprite.CandleStick'],
    alias: 'series.candlestick',
    type: 'candlestick',
    seriesType: 'candlestickSeries',
    config: {
        /**
         * @cfg {String} openField
         * The store record field name that represents the opening value of the given period.
         */
        openField: null,
        /**
         * @cfg {String} highField
         * The store record field name that represents the highest value of the time interval represented.
         */
        highField: null,
        /**
         * @cfg {String} lowField
         * The store record field name that represents the lowest value of the time interval represented.
         */
        lowField: null,
        /**
         * @cfg {String} closeField
         * The store record field name that represents the closing value of the given period.
         */
        closeField: null
    },

    fieldCategoryY: ['Open', 'High', 'Low', 'Close'],

    themeColorCount: function() {
        return 2;
    }

});
