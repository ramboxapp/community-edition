/**
 * @deprecated Please use {@link Ext.data.field.Field field types} instead.
 */
Ext.define('Ext.data.Types', {
    singleton: true,
    requires: ['Ext.data.SortTypes']
}, function(Types) {
    var SortTypes = Ext.data.SortTypes;

    Ext.apply(Types, {
        /**
         * @property {RegExp} stripRe
         * A regular expression for stripping non-numeric characters from a numeric value.
         * This should be overridden for localization.
         */
        stripRe: /[\$,%]/g,

        /**
         * @property {Object} AUTO
         * This data type means that no conversion is applied to the raw data before it is placed into a Record.
         */
        AUTO: {
            sortType: SortTypes.none,
            type: 'auto'
        },

        /**
         * @property {Object} STRING
         * This data type means that the raw data is converted into a String before it is placed into a Record.
         */
        STRING: {
            convert: function(v) {
                var defaultValue = this.getAllowNull() ? null : '';
                return (v === undefined || v === null) ? defaultValue : String(v);
            },
            sortType: SortTypes.asUCString,
            type: 'string'
        },

        /**
         * @property {Object} INT
         * This data type means that the raw data is converted into an integer before it is placed into a Record.
         *
         * The synonym `INTEGER` is equivalent.
         */
        INT: {
            convert: function(v) {
                // Handle values which are already numbers.
                // Value truncation behaviour of parseInt is historic and must be maintained.
                // parseInt(35.9)  and parseInt("35.9") returns 35
                if (typeof v === 'number') {
                    return parseInt(v, 10);
                }
                return v !== undefined && v !== null && v !== '' ?
                    parseInt(String(v).replace(Types.stripRe, ''), 10) : (this.getAllowNull() ? null : 0);
            },
            sortType: SortTypes.none,
            type: 'int'
        },

        /**
         * @property {Object} FLOAT
         * This data type means that the raw data is converted into a number before it is placed into a Record.
         *
         * The synonym `NUMBER` is equivalent.
         */
        FLOAT: {
            convert: function(v) {
                if (typeof v === 'number') {
                    return v;
                }
                return v !== undefined && v !== null && v !== '' ?
                    parseFloat(String(v).replace(Types.stripRe, ''), 10) : (this.getAllowNull() ? null : 0);
            },
            sortType: SortTypes.none,
            type: 'float'
        },

        /**
         * @property {Object} BOOL
         * This data type means that the raw data is converted into a boolean before it is placed into
         * a Record. The string "true" and the number 1 are converted to boolean true.
         *
         * The synonym `BOOLEAN` is equivalent.
         */
        BOOL: {
            convert: function(v) {
                if (typeof v === 'boolean') {
                    return v;
                }
                if (this.getAllowNull() && (v === undefined || v === null || v === '')) {
                    return null;
                }
                return v === 'true' || v == 1;
            },
            sortType: SortTypes.none,
            type: 'bool'
        },

        /**
         * @property {Object} DATE
         * This data type means that the raw data is converted into a Date before it is placed into a Record.
         * The date format is specified in the constructor of the {@link Ext.data.Field} to which this type is
         * being applied.
         */
        DATE: {
            convert: function(v) {
                var df = this.getDateReadFormat() || this.getDateFormat(),
                    parsed;

                if (!v) {
                    return null;
                }
                // instanceof check ~10 times faster than Ext.isDate. Values here will not be cross-document objects
                if (v instanceof Date) {
                    return v;
                }
                if (df) {
                    return Ext.Date.parse(v, df);
                }

                parsed = Date.parse(v);
                return parsed ? new Date(parsed) : null;
            },
            sortType: SortTypes.asDate,
            type: 'date'
        }
    });

    /**
     * @property {Object} BOOLEAN
     * This data type means that the raw data is converted into a boolean before it is placed into
     * a Record. The string "true" and the number 1 are converted to boolean `true`.
     *
     * The synonym `BOOL` is equivalent.
     */
    Types.BOOLEAN = Types.BOOL;

    /**
     * @property {Object} INTEGER
     * This data type means that the raw data is converted into an integer before it is placed into a Record.
     *
     * The synonym `INT` is equivalent.
     */
    Types.INTEGER = Types.INT;

    /**
     * @property {Object} NUMBER
     * This data type means that the raw data is converted into a number before it is placed into a Record.
     *
     * The synonym `FLOAT` is equivalent.
     */
    Types.NUMBER = Types.FLOAT;
});
