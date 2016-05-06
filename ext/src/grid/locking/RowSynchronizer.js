/**
 * @private
 */
Ext.define('Ext.grid.locking.RowSynchronizer', {
    constructor: function (view, rowEl) {
        var me = this,
            rowTpl;

        me.view = view;
        me.rowEl = rowEl;
        me.els = {};

        me.add('data', view.rowSelector);

        for (rowTpl = view.rowTpl; rowTpl; rowTpl = rowTpl.nextTpl) {
            if (rowTpl.beginRowSync) {
                rowTpl.beginRowSync(me);
            }
        }
    },

    add: function (name, selector) {
        var el = Ext.fly(this.rowEl).down(selector, true);

        if (el) {
            this.els[name] = {
                el: el
            };
        }
    },

    finish: function (other) {
        var me = this,
            els = me.els,
            otherEls = other.els,
            otherEl,
            growth = 0,
            otherGrowth = 0,
            delta, name, otherHeight;

        for (name in els) {
            otherEl = otherEls[name];

            // Partnet RowSynchronizer may not have the element.
            // For example, group summary may not be wanted in locking side.
            otherHeight = otherEl ? otherEl.height : 0;
            delta = otherHeight - els[name].height;

            if (delta > 0) {
                growth += delta;
                Ext.fly(els[name].el).setHeight(otherHeight);
            } else {
                otherGrowth -= delta;
            }
        }

        // Compare the growth to both rows and see if this row is lacking.
        otherHeight = other.rowHeight + otherGrowth;

        if (me.rowHeight + growth < otherHeight) {
            Ext.fly(me.rowEl).setHeight(otherHeight);
        }
    },

    measure: function () {
        var me = this,
            els = me.els,
            name;

        me.rowHeight = me.rowEl.offsetHeight;

        for (name in els) {
            els[name].height = els[name].el.offsetHeight;
        }
    },

    reset: function () {
        var els = this.els,
            name;

        this.rowEl.style.height = '';

        for (name in els) {
            els[name].el.style.height = '';
        }
    }
});
