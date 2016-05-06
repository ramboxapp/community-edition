/**
 * An internally used DataView for {@link Ext.form.field.ComboBox ComboBox}.
 */
Ext.define('Ext.view.BoundList', {
    extend: 'Ext.view.View',
    alias: 'widget.boundlist',
    alternateClassName: 'Ext.BoundList',
    requires: [
        'Ext.view.BoundListKeyNav',
        'Ext.layout.component.BoundList', 
        'Ext.toolbar.Paging'
    ],

    mixins: [
        'Ext.mixin.Queryable'
    ],

    /**
     * @cfg {Number} [pageSize=0]
     * If greater than `0`, a {@link Ext.toolbar.Paging} is displayed at the bottom of the list and store
     * queries will execute with page {@link Ext.data.operation.Read#start start} and
     * {@link Ext.data.operation.Read#limit limit} parameters.
     */
    pageSize: 0,

    /**
     * @cfg {String} [displayField=""]
     * The field from the store to show in the view.
     */

    /**
     * @property {Ext.toolbar.Paging} pagingToolbar
     * A reference to the PagingToolbar instance in this view. Only populated if {@link #pageSize} is greater
     * than zero and the BoundList has been rendered.
     */

    // private overrides
    baseCls: Ext.baseCSSPrefix + 'boundlist',
    itemCls: Ext.baseCSSPrefix + 'boundlist-item',
    listItemCls: '',
    shadow: false,
    trackOver: true,

    preserveScrollOnRefresh: true,
    enableInitialSelection: false,
    refreshSelmodelOnRefresh: true,

    componentLayout: 'boundlist',

    navigationModel: 'boundlist',

    scrollable: true,

    childEls: [
        'listWrap', 'listEl'
    ],

    renderTpl: [
        '<div id="{id}-listWrap" data-ref="listWrap" role="presentation" class="{baseCls}-list-ct ', Ext.dom.Element.unselectableCls, '">',
            '<ul id="{id}-listEl" data-ref="listEl" class="' + Ext.baseCSSPrefix + 'list-plain">',
            '</ul>',
        '</div>',
        '{%',
            'var pagingToolbar=values.$comp.pagingToolbar;',
            'if (pagingToolbar) {',
                'Ext.DomHelper.generateMarkup(pagingToolbar.getRenderTree(), out);',
            '}',
        '%}',
        {
            disableFormats: true
        }
    ],

    /**
     * @cfg {String/Ext.XTemplate} tpl
     * A String or Ext.XTemplate instance to apply to inner template.
     *
     * {@link Ext.view.BoundList} is used for the dropdown list of 
     * {@link Ext.form.field.ComboBox}. To customize the template you can set the tpl on 
     * the combobox config object:
     *
     *     Ext.create('Ext.form.field.ComboBox', {
     *         fieldLabel   : 'State',
     *         queryMode    : 'local',
     *         displayField : 'text',
     *         valueField   : 'abbr',
     *         store        : Ext.create('StateStore', {
     *             fields : ['abbr', 'text'],
     *             data   : [
     *                 {"abbr":"AL", "name":"Alabama"},
     *                 {"abbr":"AK", "name":"Alaska"},
     *                 {"abbr":"AZ", "name":"Arizona"}
     *                 //...
     *             ]
     *         }),
     *         // Template for the dropdown menu.
     *         // Note the use of the "x-list-plain" and "x-boundlist-item" class,
     *         // this is required to make the items selectable.
     *         tpl: Ext.create('Ext.XTemplate',
     *             '<ul class="x-list-plain"><tpl for=".">',
     *                 '<li role="option" class="x-boundlist-item">{abbr} - {name}</li>',
     *             '</tpl></ul>'
     *         ),
     *     });
     *
     * Defaults to:
     *
     *     Ext.create('Ext.XTemplate',
     *         '<ul><tpl for=".">',
     *             '<li role="option" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
     *         '</tpl></ul>'
     *     );
     *
     */

     // Override because on non-touch devices, the bound field
     // retains focus so that typing may narrow the list.
     // Only when the show is triggered by a touch does the BoundList
     // get explicitly focused so that the keyboard does not appear.
    focusOnToFront: false,

    initComponent: function() {
        var me = this,
            baseCls = me.baseCls,
            itemCls = me.itemCls;

        me.selectedItemCls = baseCls + '-selected';
        if (me.trackOver) {
            me.overItemCls = baseCls + '-item-over';
        }
        me.itemSelector = "." + itemCls;
        me.scrollerSelector = 'ul.' + Ext.baseCSSPrefix + 'list-plain';

        if (me.floating) {
            me.addCls(baseCls + '-floating');
        }

        if (!me.tpl) {
            // should be setting aria-posinset based on entire set of data
            // not filtered set
            me.tpl = new Ext.XTemplate(
                '<tpl for=".">',
                    '<li role="option" unselectable="on" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
                '</tpl>'
            );
        } else if (!me.tpl.isTemplate) {
            me.tpl = new Ext.XTemplate(me.tpl);
        }

        if (me.pageSize) {
            me.pagingToolbar = me.createPagingToolbar();
        }

        me.callParent();
    },

    getRefOwner: function() {
        return this.pickerField || this.callParent();
    },

    getRefItems: function() {
        var result = this.callParent(),
            toolbar = this.pagingToolbar;
        
        if (toolbar) {
            result.push(toolbar);
        }
        return result;
    },

    createPagingToolbar: function() {
        return Ext.widget('pagingtoolbar', {
            id: this.id + '-paging-toolbar',
            pageSize: this.pageSize,
            store: this.dataSource,
            border: false,
            ownerCt: this,
            ownerLayout: this.getComponentLayout()
        });
    },

    getNodeContainer: function() {
        return this.listEl;
    },

    refresh: function(){
        var me = this,
            tpl = me.tpl;

        // Allow access to the context for XTemplate scriptlets
        tpl.field = me.pickerField;
        tpl.store = me.store;
        me.callParent();
        tpl.field =  tpl.store = null;

        // The view selectively removes item nodes, so the toolbar
        // will be preserves in the DOM
    },

    bindStore : function(store, initial) {
        var toolbar = this.pagingToolbar;

        this.callParent(arguments);
        if (toolbar) {
            toolbar.bindStore(store, initial);
        }
    },

    /**
     * A method that returns the inner template for displaying items in the list.
     * This method is useful to override when using a more complex display value, for example
     * inserting an icon along with the text.
     *
     * The XTemplate is created with a reference to the owning form field in the `field` property to provide access
     * to context. For example to highlight the currently typed value, the getInnerTpl may be configured into a
     * ComboBox as part of the {@link Ext.form.field.ComboBox#listConfig listConfig}:
     *
     *    listConfig: {
     *        getInnerTpl: function() {
     *            return '{[values.name.replace(this.field.getRawValue(), "<b>" + this.field.getRawValue() + "</b>")]}';
     *        }
     *    }
     * @param {String} displayField The {@link #displayField} for the BoundList.
     * @return {String} The inner template
     */
    getInnerTpl: function(displayField) {
        return '{' + displayField + '}';
    },
    
    onShow: function() {
        this.callParent();

        // If the input field is not focused, then focus the picker.
        if (Ext.Element.getActiveElement() !== this.pickerField.inputEl.dom) {
            this.focus();
        }
    },

    onHide: function() {
        var inputEl = this.pickerField.inputEl.dom;

        // If we're hiding a focused picker, focus must move to the input field unless the instigating
        // browser event is a touch. In that case, the input only focuses when they touch it -
        // we want to avoid an appearing keyboard.
        if (Ext.Element.getActiveElement() !== inputEl && 
            (!Ext.EventObject || Ext.EventObject.pointerType !== 'touch')) {
            inputEl.focus();
        }
        // Call parent (hide the element) *after* focus has been moved out.
        // Maintainer: Component#onHide takes parameters. 
        this.callParent(arguments);
    },

    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        var picker = this.pickerField;

        this.callParent(arguments);

        // Bound list may change size, so realign on layout
        // **if the field is an Ext.form.field.Picker which has alignPicker!**
        if (picker && picker.alignPicker) {
            picker.alignPicker();
        }
    },

    // Clicking on an already selected item collapses the picker
    onItemClick: function(record) {
        // The selection change events won't fire when clicking on the selected element. Detect it here.
        var me = this,
            pickerField = me.pickerField,
            valueField = pickerField.valueField,
            selected = me.getSelectionModel().getSelection();

        if (!pickerField.multiSelect && selected.length) {
            selected = selected[0];
            // Not all pickerField's have a collapse API, i.e. Ext.ux.form.MultiSelect.
            if (selected && pickerField.isEqual(record.get(valueField), selected.get(valueField)) && pickerField.collapse) {
                pickerField.collapse();
            }
        }
    },

    onContainerClick: function(e) {
        // Ext.view.View template method
        // Do not continue to process the event as a container click if it is within the pagingToolbar
        if (this.pagingToolbar && this.pagingToolbar.rendered && e.within(this.pagingToolbar.el)) {
            return false;
        }
    },

    onDestroy: function() {
        this.callParent();
        Ext.destroyMembers(this, 'pagingToolbar', 'listWrap', 'listEl');
    },

    privates: {
        getTargetEl: function() {
            return this.listEl;
        },

        getOverflowEl: function() {
            return this.listWrap;
        },

        // Do the job of a container layout at this point even though we are not a Container.
        finishRenderChildren: function () {
            var toolbar = this.pagingToolbar;

            this.callParent(arguments);

            if (toolbar) {
                toolbar.finishRender();
            }
        }
    }
});
