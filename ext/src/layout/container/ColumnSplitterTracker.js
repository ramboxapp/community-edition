/**
 */
Ext.define('Ext.layout.container.ColumnSplitterTracker', {
    extend: 'Ext.resizer.SplitterTracker',

    // We move the splitter el. Add the proxy class.
    onStart: function(e) {
        Ext.apply(this.getSplitter().el.dom.style, { top : 0, left : 0} );
        this.callParent(arguments);
    },

    endDrag: function () {
        var me = this;
        me.callParent(arguments); // this calls onEnd
        me.getSplitter().el.dom.style.left = 0;
    },

    performResize: function(e, offset) {
        var me        = this,
            prevCmp   = me.getPrevCmp(),
            nextCmp   = me.getNextCmp(),
            splitter  = me.getSplitter(),
            owner     = splitter.ownerCt,
            delta     = offset[0],
            prevWidth, nextWidth, ratio;

        if (prevCmp && nextCmp) {
            prevCmp.width = prevWidth = me.prevBox.width + delta;
            nextCmp.width = nextWidth = me.nextBox.width - delta;

            ratio = (prevCmp.columnWidth + nextCmp.columnWidth) / (prevWidth + nextWidth);

            prevCmp.columnWidth = prevWidth * ratio;
            nextCmp.columnWidth = nextWidth * ratio;
        }

        owner.updateLayout();
    }
});
