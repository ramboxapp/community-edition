/**
 * Validates that the length of the value is between a {@link #min} and {@link #max}.
 */
Ext.define('Ext.data.validator.Length', {
    extend: 'Ext.data.validator.Bound',
    alias: 'data.validator.length',
    
    type: 'length',
    
    config: {
        /**
         * @cfg {Number} min
         * The minimum length value.
         */
        
        /**
         * @cfg {Number} max
         * The maximum length value.
         */
        
        /**
         * @cfg {String} minOnlyMessage
         * The error message to return when the value is less than the minimum
         * length and only a minimum is specified.
         */
        minOnlyMessage: 'Length must be at least {0}',
        
        /**
         * @cfg {String} maxOnlyMessage
         * The error message to return when the value is more than the maximum
         * length and only a maximum is specified.
         */
        maxOnlyMessage: 'Length must be no more than {0}',
        
        /**
         * @cfg {String} bothMessage
         * The error message to return when the value length is not in the specified 
         * range and both the minimum and maximum are specified.
         */
        bothMessage: 'Length must be between {0} and {1}'
    },
    
    getValue: function(v) {
        return String(v).length;
    }
});
