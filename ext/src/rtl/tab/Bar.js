Ext.define('Ext.rtl.tab.Bar', {
    override: 'Ext.tab.Bar',

    privates: {
        // rtl hook
        _getTabAdjustProp: function() {
            return this.getInherited().rtl ? 'right' : 'left';
        },

        getCloseXY: function(closeEl, tabX, tabY, tabWidth, tabHeight, closeWidth, closeHeight, direction) {
            var closeXY, closeX, closeY, xy;

            if (this.isOppositeRootDirection()) {
                closeXY = closeEl.getXY();
                if (direction === 'right') {
                    closeX = tabX + closeXY[1] - tabY;
                    closeY = tabY + tabHeight - (closeXY[0] - (tabX + tabWidth - tabHeight)) - closeWidth;
                } else {
                    closeX = tabX + tabWidth - (closeXY[1] - tabY) - closeHeight;
                    closeY = tabY + (closeXY[0] - (tabX + tabWidth - tabHeight));
                }
                xy = [closeX, closeY];
            } else {
                xy = this.callParent(arguments);
            }

            return xy;
        }
    }
});
