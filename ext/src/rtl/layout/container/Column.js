Ext.define('Ext.rtl.layout.container.Column', {
    override: 'Ext.layout.container.Column',

    // Override to put the RTL class onto the innerCt so that columns can have a rule which switches float direction
    getRenderData: function () {
        var renderData = this.callParent();

        if (this.owner.getInherited().rtl) {

            // If the owning Component is RTL direction, then ensure that the clearSide property
            // clears the correct edge.
            // Tall items would block it as below.
            // "Item 4" requires clear:right to begin at column zero (on the RIGHT side).
            // +------------------------------- +
            // |+--------+ +--------+ +--------+|
            // ||        | |        | |        ||
            // || Item 3 | | Item 2 | | Item 1 ||
            // |+--------+ +--------+ |        ||
            // |           +--------+ |        ||
            // |           |        | +--------+|
            // |           | Item 4 |           |
            // |           |        |           |
            // |           +--------+           |
            // +--------------------------------+
            this.clearSide = 'right';
            renderData.innerCtCls =
                (renderData.innerCtCls || '') + ' ' + Ext.baseCSSPrefix + 'rtl';
        }
        
        return renderData;
    }
});
