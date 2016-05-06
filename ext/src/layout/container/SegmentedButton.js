/**
 * This class is used internally to manage the layout of `Ext.button.Segmented`.
 * @private
 */
Ext.define('Ext.layout.container.SegmentedButton', {
    extend: 'Ext.layout.container.Container',
    alias: 'layout.segmentedbutton',

    needsItemSize: false,
    setsItemSize: false,

    _btnRowCls: Ext.baseCSSPrefix + 'segmented-button-row',

    getRenderTree: function() {
        var me = this,
            result = me.callParent(),
            i, ln;

        if (me.owner.getVertical()) {
            for (i = 0, ln = result.length; i< ln; i++) {
                result[i] = {
                    cls: me._btnRowCls,
                    cn: result[i]
                };
            }
        }

        return result;
    },

    getItemLayoutEl: function(item) {
        var dom = item.el.dom;

        return this.owner.getVertical() ? dom.parentNode : dom;
    },

    onDestroy: function() {
        // The items of a Segmented Button create an Ext.dom.Element reference
        // to their "container" element (see Ext.util.Renderable#finishRender)
        // for vertical Segmented Buttons this container ends up being the
        // 'segmented-button-row' element, which is not a childEl of either the container
        // or the layout and so it does not get automatically cleaned up upon destruction,
        // leaving the element orphaned, unless we destroy it now.
        if (this.rendered) {
            var targetEl = this.getRenderTarget(),
                row;

            while ((row = targetEl.last())) {
                row.destroy();
            }
        }
    }
});
