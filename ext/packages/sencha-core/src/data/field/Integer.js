/**
 */
Ext.define('Ext.data.field.Integer', {
    extend: 'Ext.data.field.Field',

    alias: [
        'data.field.int',
        'data.field.integer'
    ],

    isNumeric: true,
    isIntegerField: true,
    numericType: 'int',

    convert: function(v) {
        // Handle values which are already numbers.
        // Value truncation behaviour of parseInt is historic and must be maintained.
        // parseInt(35.9)  and parseInt("35.9") returns 35
        if (typeof v === 'number') {
            return this.getNumber(v);
        }

        var empty = v === undefined || v === null || v === '',
            allowNull = this.allowNull,
            out;

        if (empty) {
            out = allowNull ? null : 0;
        }  else {
            out = this.parse(v);
            if (allowNull && isNaN(out)) {
                out = null;
            }
        }
        return out;
    },

    getNumber: function (v) {
        return parseInt(v, 10);
    },

    getType: function() {
        return this.numericType;
    },

    parse: function(v) {
        return parseInt(String(v).replace(this.stripRe, ''), 10);
    },

    sortType: function (s) {
        // If allowNull, null values needed to be sorted last.
        if (s == null) {
            s = Infinity;
        }

        return s;
    }
});
