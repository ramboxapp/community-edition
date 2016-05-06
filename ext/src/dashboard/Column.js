/**
 * This class manages columns in a `Dashboard`. The primary role here is the `defaultType`
 * config which points to `Ext.dashboard.Panel` and the self-destruct mechanism to get
 * rid of empty columns.
 * @protected
 */
Ext.define('Ext.dashboard.Column', {
    extend: 'Ext.container.Container',
    xtype: 'dashboard-column',

    requires: [
        'Ext.layout.container.Anchor',
        'Ext.dashboard.Panel'
    ],

    layout: 'anchor',

    isDashboardColumn : true,

    defaultType: 'dashboard-panel',

    cls: Ext.baseCSSPrefix + 'dashboard-column',

    synthetic: true, // not user-defined

    onRemove: function (dashPanel, isDestroying) {
        var me = this,
            ownerCt = me.ownerCt,
            remainingSiblings,
            numRemaining,
            totalColumnWidth = 0,
            i;

        // If we've just emptied this column.
        if (ownerCt && me.items.getCount() === 0) {
            // Collect remaining column siblings of the same row, when this one has gone.
            remainingSiblings = Ext.Array.filter(ownerCt.query('>' + me.xtype+ '[rowIndex=' + me.rowIndex + ']'), function(c){
                return c !== me;
            });
            numRemaining = remainingSiblings.length;

            // If this column is not destroyed, then remove this column (unless it is the last one!)
            if (!me.destroying && !me.isDestroyed) {
                ownerCt.remove(me);

                // Down to just one column; it must take up full width
                if (numRemaining === 1) {
                    remainingSiblings[0].columnWidth = 1;
                }
                // If more than one remaining sibling, redistribute columnWidths proportionally so that they
                // still total 1.0
                else {
                    for (i = 0; i < numRemaining; i++) {
                        totalColumnWidth += remainingSiblings[i].columnWidth || 0;
                    }
                    for (i = 0; i < numRemaining; i++) {
                        remainingSiblings[i].columnWidth = remainingSiblings[i].columnWidth / totalColumnWidth;
                    }
                }

                // Needed if user is *closing* the last portlet in a column as opposed to just dragging it to another place
                // The destruction will not force a layout
                if (isDestroying) {
                    ownerCt.updateLayout();
                }
            }
        }
    }
});
