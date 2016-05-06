/** */
Ext.define('Ext.aria.grid.NavigationModel', {
    override: 'Ext.grid.NavigationModel',
    
    // WAI-ARIA recommends no wrapping around row ends in navigation mode
    preventWrap: true
});
