/** */
Ext.define('Ext.aria.grid.header.Container', {
    override: 'Ext.grid.header.Container',
    
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent();

        delete attrs['aria-label'];
        
        return attrs;
    }
});
