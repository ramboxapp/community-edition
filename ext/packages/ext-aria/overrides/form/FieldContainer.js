/** */
Ext.define('Ext.aria.form.FieldContainer', {
    override: 'Ext.form.FieldContainer',

    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent(arguments);

        if (me.fieldLabel && me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }

        return attrs;
    }
});
