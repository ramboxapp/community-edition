/** */
Ext.define('Ext.aria.tab.Bar', {
    override: 'Ext.tab.Bar',
    
    requires: [
        'Ext.aria.tab.Tab'
    ],
    
    findNextActivatable: function(toClose) {
        var me = this,
            next;
        
        next = me.callParent(arguments);
        
        // If the default algorithm can't find the next tab to activate,
        // fall back to the currently active tab. We need to have a focused
        // tab at all times.
        if (!next) {
            next = me.activeTab;
        }
        
        return next;
    }
});
