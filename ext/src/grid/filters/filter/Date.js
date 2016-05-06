/**
 * The date grid filter allows you to create a filter selection that limits results
 * to values matching specific date constraints.  The filter can be set programmatically or via 
 * user input with a configurable {@link Ext.picker.DatePicker DatePicker menu} in the filter section 
 * of the column header.
 * 
 * Example Date Filter Usage:
 * 
 *     @example 
 *     var shows = Ext.create('Ext.data.Store', {
 *         fields: ['id','show', {
 *               name: 'airDate',
 *               type: 'date',
 *               dateFormat: 'Y-m-d'
 *         }],
 *         data: [
 *             {id: 0, show: 'Battlestar Galactica', airDate: '1978-09-17'},
 *             {id: 1, show: 'Doctor Who', airDate: '1963-11-23'},
 *             {id: 2, show: 'Farscape', airDate: '1999-03-19'},
 *             {id: 3, show: 'Firefly', airDate: '2002-12-20'},
 *             {id: 4, show: 'Star Trek', airDate: '1966-09-08'},
 *             {id: 5, show: 'Star Wars: Christmas Special', airDate: '1978-11-17'}
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
 *             xtype: 'datecolumn',
 *             dataIndex: 'airDate',
 *             text: 'Original Air Date',
 *             width: 125,
 *             filter: {
 *                 type: 'date',
 *                 
 *                 // optional picker config
 *                 pickerDefaults: {
 *                     // any DatePicker configs
 *                 } 
 *             }
 *         }]
 *     }); 
 */
Ext.define('Ext.grid.filters.filter.Date', {
    extend: 'Ext.grid.filters.filter.TriFilter',
    alias: 'grid.filter.date',
    uses: ['Ext.picker.Date', 'Ext.menu.Menu'],

    type: 'date',

    config: {
        //<locale type="object">
        /**
         * @cfg {Object} [fields]
         * Configures field items individually. These properties override those defined
         * by `{@link #itemDefaults}`.
         *
         * Example usage:
         *      fields: {
         *          gt: { // override fieldCfg options
         *              width: 200
         *          }
         *      },
         */
        fields: {
            lt: {text: 'Before'},
            gt: {text: 'After'},
            eq: {text: 'On'}
        },
        //</locale>

        /**
         * @cfg {Object} pickerDefaults
         * Configuration options for the date picker associated with each field.
         */
        pickerDefaults: {
            xtype: 'datepicker',
            border: 0
        },

        updateBuffer: 0,

        /**
        * @cfg {String} dateFormat
        * The date format to return when using getValue.
        * Defaults to {@link Ext.Date#defaultFormat}.
        */
        dateFormat: undefined
    },

    itemDefaults: {
        xtype: 'menucheckitem',
        selectOnFocus: true,
        width: 125,
        menu: {
            layout: 'auto',
            plain: true
        }
    },

    /**
     * @cfg {Date} maxDate
     * Allowable date as passed to the Ext.DatePicker
     * Defaults to undefined.
     */

    /**
     * @cfg {Date} minDate
     * Allowable date as passed to the Ext.DatePicker
     * Defaults to undefined.
     */

    applyDateFormat: function(dateFormat) {
        return dateFormat || Ext.Date.defaultFormat;
    },

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    createMenu: function (config) {
        var me = this,
            listeners = {
                scope: me,
                checkchange: me.onCheckChange
            },
            menuItems = me.menuItems,
            fields, itemDefaults, pickerCfg, i, len,
            key, item, cfg, field;

        me.callParent(arguments);

        itemDefaults = me.getItemDefaults();
        fields = me.getFields();

        pickerCfg = Ext.apply({
            minDate: me.minDate,
            maxDate: me.maxDate,
            format:  me.dateFormat,
            listeners: {
                scope: me,
                select: me.onMenuSelect
            }
        }, me.getPickerDefaults());

        me.fields = {};

        for (i = 0, len = menuItems.length; i < len; i++) {
            key = menuItems[i];
            if (key !== '-') {
                cfg = {
                    menu: {
                        items: [
                            Ext.apply({
                                itemId: key
                            }, pickerCfg)
                        ]
                    }
                };

                if (itemDefaults) {
                    Ext.merge(cfg, itemDefaults);
                }

                if (fields) {
                    Ext.merge(cfg, fields[key]);
                }

                item = me.menu.add(cfg);
                // Date filter types need the field to be the datepicker in TriFilter.setValue().
                field = me.fields[key] = item.down('datepicker');
                field.filter = me.filter[key];
                field.filterKey = key;

                item.on(listeners);
            } else {
                me.menu.add(key);
            }
        }
    },

    /**
     * Gets the menu picker associated with the passed field
     * @param {String} item The field identifier ('lt', 'gt', 'eq')
     * @return {Object} The menu picker
     */
    getPicker: function (item){
        return this.fields[item];
    },

    /**
     * @private
     * Remove the filter from the store but don't update its value or the field UI.
    */
    onCheckChange: function (field, checked) {
        // Only do something if unchecked.  If checked, it doesn't mean anything at this point since the column's store filter won't have
        // any value (i.e., if a user checked this from an unchecked state, the corresponding field won't have a value for its filter).
        var filter = field.down('datepicker').filter,
            v;

        // Only proceed if unchecked AND there's a filter value (i.e., there's something to do!).
        if (!checked && filter.getValue()) {
            // Normally we just want to remove the filter from the store, not also to null out the filter value. But, we want to call setValue()
            // which will take care of unchecking the top-level menu item if it's been determined that Date* doesn't have any filters.
            v = {};
            v[filter.getOperator()] = null;
            this.setValue(v);
        }
    },

    onFilterRemove: function (operator) {
        var v = {};

        v[operator] = null;
        this.setValue(v);
        this.fields[operator].up('menuitem').setChecked(false, /*suppressEvents*/ true);
    },

    onStateRestore: function(filter) {
        filter.setSerializer(this.getSerializer());
        filter.setConvert(this.convertDateOnly);
    },

    getFilterConfig: function(config, key) {
        config = this.callParent([config, key]);
        config.serializer = this.getSerializer();
        config.convert = this.convertDateOnly;
        return config;
    },

    convertDateOnly: function(v) {
        var result = null;
        if (v) {
            result = Ext.Date.clearTime(v, true).getTime();
        }
        return result;
    },

    getSerializer: function() {
        var me = this;
        return function(data) {
            var value = data.value;
            if (value) {
                data.value = Ext.Date.format(value, me.getDateFormat());
            }
        };
    },

    /**
     * Handler for when the DatePicker for a field fires the 'select' event
     * @param {Ext.picker.Date} picker
     * @param {Object} date
     */
    onMenuSelect: function (picker, date) {
        var fields = this.fields,
            field = fields[picker.itemId],
            gt = fields.gt,
            lt = fields.lt,
            eq = fields.eq,
            v = {};

        field.up('menuitem').setChecked(true, /*suppressEvents*/ true);

        if (field === eq) {
            lt.up('menuitem').setChecked(false, true);
            gt.up('menuitem').setChecked(false, true);
        } else {
            eq.up('menuitem').setChecked(false, true);
            if (field === gt && (+lt.value < +date)) {
                lt.up('menuitem').setChecked(false, true);
                // Null so filter will be removed from store.
                v.lt = null;
            } else if (field === lt && (+gt.value > +date)) {
                gt.up('menuitem').setChecked(false, true);
                // Null so filter will be removed from store.
                v.gt = null;
            }
        }

        v[field.filterKey] = date;
        this.setValue(v);

        picker.up('menu').hide();
      }
});
