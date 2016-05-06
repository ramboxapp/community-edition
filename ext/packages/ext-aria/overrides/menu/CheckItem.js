/** */
Ext.define('Ext.aria.menu.CheckItem', {
    override: 'Ext.menu.CheckItem',
    
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent();
        
        attrs['aria-checked'] = me.menu ? 'mixed' : !!me.checked;
        
        return attrs;
    },

    setChecked: function(checked, suppressEvents) {
        this.callParent([checked, suppressEvents]);
        this.ariaUpdate({
            'aria-checked': checked
        });
    }
});
