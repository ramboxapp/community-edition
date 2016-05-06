Ext.define('Ext.rtl.scroll.Indicator', {
    override: 'Ext.scroll.Indicator',

    privates: {
        translateX: function(value) {
            if (this.getScroller().getRtl()) {
                value = -value;
            }
            this.callParent([value]);
        }
    }
});
