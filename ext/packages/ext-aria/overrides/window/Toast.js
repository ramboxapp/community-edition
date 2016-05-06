/** */
Ext.define('Ext.aria.window.Toast', {
    override: 'Ext.window.Toast',
    
    initComponent: function() {
        // Close tool is not really helpful to blind users
        // when Toast window is set to auto-close on timeout
        if (this.autoClose) {
            this.closable = false;
        }
        
        this.callParent();
    }
});
