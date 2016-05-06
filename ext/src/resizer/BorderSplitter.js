/**
 * Private utility class for Ext.layout.container.Border.
 * @private
 */
Ext.define('Ext.resizer.BorderSplitter', {
    extend: 'Ext.resizer.Splitter',

    uses: ['Ext.resizer.BorderSplitterTracker'],

    alias: 'widget.bordersplitter',

    // must be configured in by the border layout:
    collapseTarget: null,

    getTrackerConfig: function () {
        var trackerConfig = this.callParent();

        trackerConfig.xclass = 'Ext.resizer.BorderSplitterTracker';

        return trackerConfig;
    },

    onTargetCollapse: function(target) {
        this.callParent([target]);
        if (this.performCollapse !== false && target.collapseMode == 'mini') {
            target.addCls(target.baseCls + '-' + target.collapsedCls + '-mini');
        }
    },

    onTargetExpand: function(target) {
        this.callParent([target]);
        if (this.performCollapse !== false && target.collapseMode == 'mini') {
            target.removeCls(target.baseCls + '-' + target.collapsedCls + '-mini');
        }
    }
});
