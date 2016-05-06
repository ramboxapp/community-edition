/**
 */
Ext.define('Ext.data.field.Number', {
    extend: 'Ext.data.field.Integer',

    alias: [
        'data.field.float',
        'data.field.number'
    ],

    isIntegerField: false,
    isNumberField: true,
    numericType: 'float',

    getNumber: Ext.identityFn,

    parse: function(v) {
        return parseFloat(String(v).replace(this.stripRe, ''));
    }
});
