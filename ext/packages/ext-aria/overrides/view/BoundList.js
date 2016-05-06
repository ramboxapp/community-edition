/** */
Ext.define('Ext.aria.view.BoundList', {
    override: 'Ext.view.BoundList',

    onHide: function() {
        this.ariaUpdate({
            "aria-activedescendant": Ext.emptyString
        });
        
        // Maintainer: onHide takes arguments
        this.callParent(arguments);
    }
});
