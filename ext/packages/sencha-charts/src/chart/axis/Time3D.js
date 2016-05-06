/**
 * @class Ext.chart.axis.Time3D
 */
Ext.define('Ext.chart.axis.Time3D', {
    extend: 'Ext.chart.axis.Numeric3D',
    alias: 'axis.time3d',
    type: 'time3d',
    requires: [
        'Ext.chart.axis.layout.Continuous',
        'Ext.chart.axis.segmenter.Time'
    ],
    config: {
        /**
         * @cfg {Boolean} calculateByLabelSize
         * The minimum value drawn by the axis. If not set explicitly, the axis
         * minimum will be calculated automatically.
         */
        calculateByLabelSize: true,

        /**
         * @cfg {String/Boolean} dateFormat
         * Indicates the format the date will be rendered on.
         * For example: 'M d' will render the dates as 'Jan 30', etc.
         */
        dateFormat: null,

        /**
         * @cfg {Date} fromDate The starting date for the time axis.
         */
        fromDate: null,

        /**
         * @cfg {Date} toDate The ending date for the time axis.
         */
        toDate: null,

        /**
         * @cfg {Array} [step=[Ext.Date.DAY, 1]] An array with two components:
         *
         * - The unit of the step (Ext.Date.DAY, Ext.Date.MONTH, etc).
         * - The number of units for the step (1, 2, etc).
         *
         */
        step: [Ext.Date.DAY, 1],

        layout: 'continuous',

        segmenter: 'time',

        aggregator: 'time'
    },

    updateDateFormat: function (format) {
        this.setRenderer(function (date) {
            return Ext.Date.format(new Date(date), format);
        });
    },

    updateFromDate: function (date) {
        this.setMinimum(+date);
    },

    updateToDate: function (date) {
        this.setMaximum(+date);
    },

    getCoordFor: function (value) {
        if (Ext.isString(value)) {
            value = new Date(value);
        }
        return +value;
    }
});
