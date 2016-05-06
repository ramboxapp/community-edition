/**
 * Filter type for {@link Ext.grid.column.Number number columns}.
 *
 *     @example
 *     var shows = Ext.create('Ext.data.Store', {
 *           fields: ['id','show'],
 *           data: [
 *               {id: 0, show: 'Battlestar Galactica'},
 *               {id: 1, show: 'Doctor Who'},
 *               {id: 2, show: 'Farscape'},
 *               {id: 3, show: 'Firefly'},
 *               {id: 4, show: 'Star Trek'},
 *               {id: 5, show: 'Star Wars: Christmas Special'}
 *           ]
 *        });
 *       
 *       Ext.create('Ext.grid.Panel', {
 *           renderTo: Ext.getBody(),
 *           title: 'Sci-Fi Television',
 *           height: 250,
 *           width: 250,
 *           store: shows,
 *           plugins: 'gridfilters',
 *           columns: [{
 *               dataIndex: 'id',
 *               text: 'ID',
 *               width: 50,
 *               filter: 'number' // May also be 'numeric'
 *           },{
 *               dataIndex: 'show',
 *               text: 'Show',
 *               flex: 1                  
 *           }]
 *       });
 * 
 */
Ext.define('Ext.grid.filters.filter.Number', {
    extend: 'Ext.grid.filters.filter.TriFilter',
    alias: ['grid.filter.number', 'grid.filter.numeric'],

    uses: ['Ext.form.field.Number'],

    type: 'number',

    config: {
        /**
         * @cfg {Object} [fields]
         * Configures field items individually. These properties override those defined
         * by `{@link #itemDefaults}`.
         *
         * Example usage:
         *
         *      fields: {
         *          // Override itemDefaults for one field:
         *          gt: {
         *              width: 200
         *          }
         *
         *          // "lt" and "eq" fields retain all itemDefaults
         *      },
         */
        fields: {
            gt: {
                iconCls: Ext.baseCSSPrefix + 'grid-filters-gt',
                margin: '0 0 3px 0'
            },
            lt: {
                iconCls: Ext.baseCSSPrefix + 'grid-filters-lt',
                margin: '0 0 3px 0'
            },
            eq: {
                iconCls: Ext.baseCSSPrefix + 'grid-filters-eq',
                margin: 0
            }
        }
    },

    //<locale>
    /**
     * @cfg {String} emptyText
     * The empty text to show for each field.
     */
    emptyText: 'Enter Number...',
    //</locale>

    itemDefaults: {
        xtype: 'numberfield',
        enableKeyEvents: true,
        hideEmptyLabel: false,
        labelSeparator: '',
        labelWidth: 29,
        selectOnFocus: false
    },

    menuDefaults: {
        // A menu with only form fields needs some body padding. Normally this padding
        // is managed by the items, but we have no normal menu items.
        bodyPadding: 3,
        showSeparator: false
    },

    createMenu: function () {
        var me = this,
            listeners = {
                scope: me,
                keyup: me.onValueChange,
                spin: {
                    fn: me.onInputSpin,
                    buffer: 200
                },
                el: {
                    click: me.stopFn
                }
            },
            itemDefaults = me.getItemDefaults(),
            menuItems = me.menuItems,
            fields = me.getFields(),
            field, i, len, key, item, cfg;

        me.callParent();

        me.fields = {};

        for (i = 0, len = menuItems.length; i < len; i++) {
            key = menuItems[i];
            if (key !== '-') {
                field = fields[key];

                cfg = {
                    labelClsExtra: Ext.baseCSSPrefix + 'grid-filters-icon ' + field.iconCls
                };

                if (itemDefaults) {
                    Ext.merge(cfg, itemDefaults);
                }

                Ext.merge(cfg, field);
                cfg.emptyText = cfg.emptyText || me.emptyText;
                delete cfg.iconCls;

                me.fields[key] = item = me.menu.add(cfg);

                item.filter = me.filter[key];
                item.filterKey = key;
                item.on(listeners);
            } else {
                me.menu.add(key);
            }
        }
    },

    getValue: function (field) {
        var value = {};
        value[field.filterKey] = field.getValue();
        return value;
    },

    /**
     * @private
     * Handler method called when there is a spin event on a NumberField
     * item of this menu.
     */
    onInputSpin: function (field, direction) {
        var value = {};

        value[field.filterKey] = field.getValue();

        this.setValue(value);
    },

    stopFn: function(e) {
        e.stopPropagation();
    }
});
