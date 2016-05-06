/** */
Ext.define('Ext.aria.tab.Tab', {
    override: 'Ext.tab.Tab',
    
    //<locale>
    closeText: 'closable',
    //</locale>
    
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent(arguments);
        
        attrs['aria-selected'] = !!me.active;

        if (me.card && me.card.getEl()) {
            attrs['aria-controls'] = me.card.getEl().id;
        }
        
        return attrs;
    },
    
    activate: function(suppressEvent) {
        this.callParent([suppressEvent]);
        
        this.ariaUpdate({ 'aria-selected': true });
    },
    
    deactivate: function(suppressEvent) {
        this.callParent([suppressEvent]);
        
        this.ariaUpdate({ 'aria-selected': false });
    }
});
