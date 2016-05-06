/** */
Ext.define('Ext.aria.form.RadioGroup', {
    override: 'Ext.form.RadioGroup',
    
    requires: [
        'Ext.aria.form.CheckboxGroup'
    ],
    
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent();
        
        if (me.allowBlank !== undefined) {
            attrs['aria-required'] = !me.allowBlank;
        }

        return attrs;
    },

    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent();

        if (me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }
        
        return attrs;
    }
});
