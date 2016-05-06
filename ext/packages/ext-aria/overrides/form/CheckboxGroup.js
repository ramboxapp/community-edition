/** */
Ext.define('Ext.aria.form.CheckboxGroup', {
    override: 'Ext.form.CheckboxGroup',
    
    requires: [
        'Ext.aria.form.FieldContainer',
        'Ext.aria.form.field.Base'
    ],
    
    msgTarget: 'side',
    
    setReadOnly: function(readOnly) {
        var me = this;
        
        me.callParent(arguments);
        
        me.ariaUpdate({ 'aria-readonly': !!readOnly });
    },
    
    markInvalid: function(f, isValid) {
        var me = this;
        
        me.callParent(arguments);
        
        me.ariaUpdate({ 'aria-invalid': !!isValid });
    },
    
    clearInvalid: function() {
        var me = this;
        
        me.callParent(arguments);
        
        me.ariaUpdate({ 'aria-invalid': false });
    }
});
