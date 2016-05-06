Ext.define('Ext.rtl.button.Segmented', {
    override: 'Ext.button.Segmented',

    privates: {
        _getFirstCls: function() {
            var cls = this._firstCls;
            if (!this.getVertical() && this.getInherited().rtl) {
                cls = this._lastCls;
            }
            return cls;
        },

        _getLastCls: function() {
            var cls = this._lastCls;
            if (!this.getVertical() && this.getInherited().rtl) {
                cls = this._firstCls;
            }
            return cls;
        }
    }
});