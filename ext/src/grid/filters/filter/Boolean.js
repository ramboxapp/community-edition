/**
 * The boolean grid filter allows you to create a filter selection that limits results
 * to values matching true or false.  The filter can be set programmatically or via 
 * user input with a configurable {@link Ext.form.field.Radio radio field} in the filter section 
 * of the column header.
 * 
 * Boolean filters use unique radio group IDs, so you may utilize more than one.
 *
 * Example Boolean Filter Usage:
 * 
 *     @example
 *     var shows = Ext.create('Ext.data.Store', {
 *         fields: ['id','show', 'visible'],
 *         data: [
 *             {id: 0, show: 'Battlestar Galactica', visible: true},
 *             {id: 1, show: 'Doctor Who', visible: true},
 *             {id: 2, show: 'Farscape', visible: false},
 *             {id: 3, show: 'Firefly', visible: true},
 *             {id: 4, show: 'Star Trek', visible: true},
 *             {id: 5, show: 'Star Wars: Christmas Special', visible: false}
 *         ]
 *     });
 *   
 *     Ext.create('Ext.grid.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'Sci-Fi Television',
 *         height: 250,
 *         width: 375,
 *         store: shows,
 *         plugins: 'gridfilters',
 *         columns: [{
 *             dataIndex: 'id',
 *             text: 'ID',
 *             width: 50
 *         },{
 *             dataIndex: 'show',
 *             text: 'Show',
 *             flex: 1                  
 *         },{
 *             dataIndex: 'visible',
 *             text: 'Visibility',
 *             width: 125,
 *             filter: {
 *                 type: 'boolean',
 *                 value: 'true',
 *                 yesText: 'True',
 *                 noText: 'False'
 *             }
 *         }]
 *     });  
 */
Ext.define('Ext.grid.filters.filter.Boolean', {
    extend: 'Ext.grid.filters.filter.SingleFilter',
    alias: 'grid.filter.boolean',

    type: 'boolean',

    operator: '=',

    /**
     * @cfg {Boolean} defaultValue
     * Set this to null if you do not want either option to be checked by default. Defaults to false.
     */
    defaultValue: false,

    //<locale>
    /**
     * @cfg {String} yesText
     * Defaults to 'Yes'.
     */
    yesText: 'Yes',
    //</locale>

    //<locale>
    /**
     * @cfg {String} noText
     * Defaults to 'No'.
     */
    noText: 'No',
    //</locale>

    updateBuffer: 0,

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    createMenu: function (config) {
        var me = this,
            gId = Ext.id(),
            listeners = {
                scope: me,
                click: me.onClick
            },
            itemDefaults = me.getItemDefaults();

        me.callParent(arguments);

        me.menu.add([Ext.apply({
            text: me.yesText,
            filterKey: 1,
            group: gId,
            checked: !!me.defaultValue,
            listeners: listeners
        }, itemDefaults), Ext.apply({
            text: me.noText,
            filterKey: 0,
            group: gId,
            checked: !me.defaultValue,
            listeners: listeners
        }, itemDefaults)]);
    },

    /**
     * @private
     */
    onClick: function (field) {
        this.setValue(!!field.filterKey);
    },

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter.
     */
    setValue: function (value) {
        var me = this;

        me.filter.setValue(value);

        if (value !== undefined && me.active) {
            me.value = value;
            me.updateStoreFilter();
        } else {
            me.setActive(true);
        }
    },

    // This is supposed to be just a stub.
    activateMenu: Ext.emptyFn
});
