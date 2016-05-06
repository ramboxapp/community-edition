Ext.define('Ext.rtl.layout.container.boxOverflow.Menu', {
    override: 'Ext.layout.container.boxOverflow.Menu',

    getPrefixConfig: function(isFromRTL) {
        if (isFromRTL || !this.layout.owner.getInherited().rtl) {
            return this.callParent();
        } else {
            return this.getSuffixConfig(true);
        }
    },

    getSuffixConfig: function(isFromRTL) {
        if (isFromRTL || !this.layout.owner.getInherited().rtl) {
            return this.callParent();
        } else {
            return this.getPrefixConfig(true);
        }
    }
});
