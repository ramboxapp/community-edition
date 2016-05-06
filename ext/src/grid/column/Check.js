/**
 * A Column subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.
 *
 * Example usage:
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields: ['name', 'email', 'phone', 'active'],
 *         data: [
 *             { name: 'Lisa', email: 'lisa@simpsons.com', phone: '555-111-1224', active: true },
 *             { name: 'Bart', email: 'bart@simpsons.com', phone: '555-222-1234', active: true },
 *             { name: 'Homer', email: 'homer@simpsons.com', phone: '555-222-1244', active: false },
 *             { name: 'Marge', email: 'marge@simpsons.com', phone: '555-222-1254', active: true }
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Simpsons',
 *         height: 200,
 *         width: 400,
 *         renderTo: Ext.getBody(),
 *         store: store,
 *         columns: [
 *             { text: 'Name', dataIndex: 'name' },
 *             { text: 'Email', dataIndex: 'email', flex: 1 },
 *             { text: 'Phone', dataIndex: 'phone' },
 *             { xtype: 'checkcolumn', text: 'Active', dataIndex: 'active' }
 *         ]
 *     });
 *
 * The check column can be at any index in the columns array.
 */
Ext.define('Ext.grid.column.Check', {
    extend: 'Ext.grid.column.Column',
    alternateClassName: ['Ext.ux.CheckColumn', 'Ext.grid.column.CheckColumn'],
    alias: 'widget.checkcolumn',

    /**
     * @cfg
     * @hide
     * Overridden from base class. Must center to line up with editor.
     */
    align: 'center',

    /**
     * @cfg {Boolean} [stopSelection=true]
     * Prevent grid selection upon mousedown.
     */
    stopSelection: true,

    tdCls: Ext.baseCSSPrefix + 'grid-cell-checkcolumn',
    innerCls: Ext.baseCSSPrefix + 'grid-cell-inner-checkcolumn',

    clickTargetName: 'el',

    defaultFilterType: 'boolean',

    /**
     * @event beforecheckchange
     * Fires when before checked state of a row changes.
     * The change may be vetoed by returning `false` from a listener.
     * @param {Ext.ux.CheckColumn} this CheckColumn
     * @param {Number} rowIndex The row index
     * @param {Boolean} checked True if the box is to be checked
     */

    /**
     * @event checkchange
     * Fires when the checked state of a row changes
     * @param {Ext.ux.CheckColumn} this CheckColumn
     * @param {Number} rowIndex The row index
     * @param {Boolean} checked True if the box is now checked
     */

    constructor: function() {
        this.scope = this;
        this.callParent(arguments);
    },

    /**
     * @private
     * Process and refire events routed from the GridView's processEvent method.
     */
    processEvent: function(type, view, cell, recordIndex, cellIndex, e, record, row) {
        var me = this,
            key = type === 'keydown' && e.getKey(),
            mousedown = type === 'mousedown',
            disabled = me.disabled,
            ret = false,
            checked;


        if (!disabled && (mousedown || (key === e.ENTER || key === e.SPACE))) {
            checked = !me.isRecordChecked(record);

            // Allow apps to hook beforecheckchange
            if (me.fireEvent('beforecheckchange', me, recordIndex, checked) !== false) {
                me.setRecordCheck(record, checked, cell, row, e);
                me.fireEvent('checkchange', me, recordIndex, checked);

                // Mousedown on the now nonexistent cell causes the view to blur, so stop it continuing.
                if (mousedown) {
                    e.stopEvent();
                }

                // Selection may not proceed after this because of the DOM update caused by the record modification,
                // this depends on whether or not we overwrite the DOM element, which may prevent the click event. Regardless,
                // we'll veto the click event below and just do the selection here if needed.
                if (!me.stopSelection) {
                    view.selModel.selectByPosition({
                        row: recordIndex,
                        column: cellIndex
                    });
                }
            }
        } else if (!disabled && type === 'click') {
            ret = false;
        } else {
            ret = me.callParent(arguments);
        }
        return ret;
    },

    /**
     * Enables this CheckColumn.
     */
    onEnable: function() {
        this.callParent(arguments);
        this._setDisabled(false);
    },

    /**
     * Disables this CheckColumn.
     */
    onDisable: function() {
        this._setDisabled(true);
    },

    // Don't want to conflict with the Component method
    _setDisabled: function(disabled) {
        var me = this,
            cls = me.disabledCls,
            items;

        items = me.up('tablepanel').el.select(me.getCellSelector());
        if (disabled) {
            items.addCls(cls);
        } else {
            items.removeCls(cls);
        }
    },

    // Note: class names are not placed on the prototype bc renderer scope
    // is not in the header.
    defaultRenderer : function(value, cellValues) {
        var cssPrefix = Ext.baseCSSPrefix,
            cls = cssPrefix + 'grid-checkcolumn';

        if (this.disabled) {
            cellValues.tdCls += ' ' + this.disabledCls;
        }
        if (value) {
            cls += ' ' + cssPrefix + 'grid-checkcolumn-checked';
        }
        return '<img class="' + cls + '" src="' + Ext.BLANK_IMAGE_URL + '"/>';
    },

    isRecordChecked: function (record) {
        var prop = this.property;
        if (prop) {
            return record[prop];
        }
        return record.get(this.dataIndex);
    },

    setRecordCheck: function (record, checked, cell, row, e) {
        var me = this,
            prop = me.property;

        if (prop) {
            record[prop] = checked;
            me.updater(cell, checked);
        } else {
            record.set(me.dataIndex, checked);
        }
    },

    updater: function (cell, value) {
        var cellValues = {},
            tdCls;
        cell.firstChild.innerHTML = this.defaultRenderer(value, cellValues);
        tdCls = cellValues.tdCls;
        if (tdCls) {
            Ext.fly(cell).addCls(tdCls);
        }
    }
});
