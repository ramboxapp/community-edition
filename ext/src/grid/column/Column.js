/**
 * This class specifies the definition for a column inside a {@link Ext.grid.Panel}. It encompasses
 * both the grid header configuration as well as displaying data within the grid itself. If the
 * {@link #columns} configuration is specified, this column will become a column group and can
 * contain other columns inside. In general, this class will not be created directly, rather
 * an array of column configurations will be passed to the grid:
 *
 *     @example
 *     Ext.create('Ext.data.Store', {
 *         storeId:'employeeStore',
 *         fields:['firstname', 'lastname', 'seniority', 'dep', 'hired'],
 *         data:[
 *             {firstname:"Michael", lastname:"Scott", seniority:7, dep:"Management", hired:"01/10/2004"},
 *             {firstname:"Dwight", lastname:"Schrute", seniority:2, dep:"Sales", hired:"04/01/2004"},
 *             {firstname:"Jim", lastname:"Halpert", seniority:3, dep:"Sales", hired:"02/22/2006"},
 *             {firstname:"Kevin", lastname:"Malone", seniority:4, dep:"Accounting", hired:"06/10/2007"},
 *             {firstname:"Angela", lastname:"Martin", seniority:5, dep:"Accounting", hired:"10/21/2008"}
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Column Demo',
 *         store: Ext.data.StoreManager.lookup('employeeStore'),
 *         columns: [
 *             {text: 'First Name',  dataIndex:'firstname'},
 *             {text: 'Last Name',  dataIndex:'lastname'},
 *             {text: 'Hired Month',  dataIndex:'hired', xtype:'datecolumn', format:'M'},
 *             {text: 'Department (Yrs)', xtype:'templatecolumn', tpl:'{dep} ({seniority})'}
 *         ],
 *         width: 400,
 *         forceFit: true,
 *         renderTo: Ext.getBody()
 *     });
 *
 * # Convenience Subclasses
 *
 * There are several column subclasses that provide default rendering for various data types
 *
 *  - {@link Ext.grid.column.Action}: Renders icons that can respond to click events inline
 *  - {@link Ext.grid.column.Boolean}: Renders for boolean values
 *  - {@link Ext.grid.column.Date}: Renders for date values
 *  - {@link Ext.grid.column.Number}: Renders for numeric values
 *  - {@link Ext.grid.column.Template}: Renders a value using an {@link Ext.XTemplate} using the record data
 *
 * # Setting Sizes
 *
 * The columns are laid out by a {@link Ext.layout.container.HBox} layout, so a column can either
 * be given an explicit width value or a flex configuration. If no width is specified the grid will
 * automatically the size the column to 100px. For column groups, the size is calculated by measuring
 * the width of the child columns, so a width option should not be specified in that case.
 *
 * # Header Options
 *
 *  - {@link #text}: Sets the header text for the column
 *  - {@link #sortable}: Specifies whether the column can be sorted by clicking the header or using the column menu
 *  - {@link #hideable}: Specifies whether the column can be hidden using the column menu
 *  - {@link #menuDisabled}: Disables the column header menu
 *  - {@link #cfg-draggable}: Specifies whether the column header can be reordered by dragging
 *  - {@link #groupable}: Specifies whether the grid can be grouped by the column dataIndex. See also {@link Ext.grid.feature.Grouping}
 *
 * # Data Options
 *
 *  - {@link #dataIndex}: The dataIndex is the field in the underlying {@link Ext.data.Store} to use as the value for the column.
 *  - {@link Ext.grid.column.Column#renderer renderer}: Allows the underlying store
 * value to be transformed before being displayed in the grid
 */
Ext.define('Ext.grid.column.Column', {
    extend: 'Ext.grid.header.Container',
    xtype: 'gridcolumn',

    requires: [
        'Ext.grid.ColumnComponentLayout',
        'Ext.grid.ColumnLayout',
        'Ext.app.bind.Template' // for "format" support
    ],

    alternateClassName: 'Ext.grid.Column',
    
    config: {
        triggerVisible: false
    },

// TODO: Implement visible triggers for touch.
// Styling will need tweaking - looks a bit ugly with all triggers always visible.
//    platformConfig: [{
//        platform: 'tablet',
//        triggerVisible: 'true'
//    }],

    baseCls: Ext.baseCSSPrefix + 'column-header',

    // Not the standard, automatically applied overCls because we must filter out overs of child headers.
    hoverCls: Ext.baseCSSPrefix + 'column-header-over',

    handleWidth: Ext.supports.Touch ? 10 : 4,

    ariaRole: 'columnheader',

    enableFocusableContainer: false,

    sortState: null,

    possibleSortStates: ['ASC', 'DESC'],

    childEls: [
        'titleEl', 'triggerEl', 'textEl', 'textContainerEl'
    ],

    /**
     * @private
     * @cfg {Boolean} [headerWrap=false]
     * The default setting indicates that external CSS rules dictate that the title is `white-space: nowrap` and
     * therefore, width cannot affect the measured height by causing text wrapping. This is what the Sencha-supplied
     * styles set. If you change those styles to allow text wrapping, you must set this to `true`.
     */
    headerWrap: false,

    renderTpl: [
        '<div id="{id}-titleEl" data-ref="titleEl" {tipMarkup}class="', Ext.baseCSSPrefix, 'column-header-inner<tpl if="!$comp.isContainer"> ', Ext.baseCSSPrefix, 'leaf-column-header</tpl>',
            '<tpl if="empty"> ', Ext.baseCSSPrefix, 'column-header-inner-empty</tpl>">',
            //
            // TODO:
            // When IE8 retires, revisit https://jsbin.com/honawo/quiet for better way to center header text
            //
            '<span id="{id}-textContainerEl" data-ref="textContainerEl" class="', Ext.baseCSSPrefix, 'column-header-text-container">',
                '<span class="', Ext.baseCSSPrefix, 'column-header-text-wrapper">',
                    '<span id="{id}-textEl" data-ref="textEl" class="', Ext.baseCSSPrefix, 'column-header-text',
                        '{childElCls}">',
                        '{text}',
                    '</span>',
                '</span>',
            '</span>',
            '<tpl if="!menuDisabled">',
                '<div id="{id}-triggerEl" data-ref="triggerEl" role="presentation" class="', Ext.baseCSSPrefix, 'column-header-trigger',
                '{childElCls}" style="{triggerStyle}"></div>',
            '</tpl>',
        '</div>',
        '{%this.renderContainer(out,values)%}'
    ],

    /**
     * @cfg {Object[]} columns
     * An optional array of sub-column definitions. This column becomes a group, and houses the columns defined in the
     * `columns` config.
     *
     * Group columns may not be sortable. But they may be hideable and moveable. And you may move headers into and out
     * of a group. Note that if all sub columns are dragged out of a group, the group is destroyed.
     */

    /**
     * @cfg {String} stateId
     * An identifier which identifies this column uniquely within the owning grid's {@link #stateful state}.
     *
     * This does not have to be *globally* unique. A column's state is not saved standalone. It is encapsulated within
     * the owning grid's state.
     */

    /**
     * @cfg {String} dataIndex
     * The name of the field in the grid's {@link Ext.data.Store}'s {@link Ext.data.Model} definition from
     * which to draw the column's value. **Required.**
     */
    dataIndex: null,

    /**
     * @cfg {String} text
     * The header text to be used as innerHTML (html tags are accepted) to display in the Grid.
     * **Note**: to have a clickable header with no text displayed you can use the default of `&#160;` aka `&nbsp;`.
     */
    text: '&#160;',

    /**
     * @cfg {String} header
     * The header text.
     * @deprecated 4.0 Use {@link #text} instead.
     */

    /**
     * @cfg {String} menuText
     * The text to render in the column visibility selection menu for this column.  If not
     * specified, will default to the text value.
     */
    menuText: null,

    /**
     * @cfg {String} [emptyCellText=undefined]
     * The text to display in empty cells (cells with a value of `undefined`, `null`, or `''`).
     *
     * Defaults to `&#160;` aka `&nbsp;`.
     */
    emptyCellText: '&#160;',

    /**
     * @cfg {Boolean} sortable
     * False to disable sorting of this column. Whether local/remote sorting is used is specified in
     * `{@link Ext.data.Store#remoteSort}`.
     */
    sortable: true,

    /**
     * @cfg {Boolean} lockable
     * If the grid is configured with {@link Ext.panel.Table#enableLocking enableLocking}, or has columns which are
     * configured with a {@link #locked} value, this option may be used to disable user-driven locking or unlocking
     * of this column. This column will remain in the side into which its own {@link #locked} configuration placed it.
     */

    /**
     * @cfg {Boolean} groupable
     * If the grid uses a {@link Ext.grid.feature.Grouping}, this option may be used to disable the header menu
     * item to group by the column selected. By default, the header menu group option is enabled. Set to false to
     * disable (but still show) the group option in the header menu for the column.
     */

    /**
     * @cfg {Boolean} fixed
     * True to prevent the column from being resizable.
     * @deprecated 4.0 Use {@link #resizable} instead.
     */

    /**
     * @cfg {Boolean} [locked=false]
     * True to lock this column in place.  Implicitly enables locking on the grid.
     * See also {@link Ext.grid.Panel#enableLocking}.
     */

    /**
     * @cfg {Boolean} [cellWrap=false]
     * True to allow whitespace in this column's cells to wrap, and cause taller column height where
     * necessary.
     *
     * This implicitly sets the {@link #variableRowHeight} config to `true`
     */

    /**
     * @cfg {Boolean} [variableRowHeight=false]
     * True to indicate that data in this column may take on an unpredictable height, possibly differing from row to row.
     *
     * If this is set, then View refreshes, and removal and addition of new rows will result in an ExtJS layout of the grid
     * in order to adjust for possible addition/removal of scrollbars in the case of data changing height.
     *
     * This config also tells the View's buffered renderer that row heights are unpredictable, and must be remeasured as the view is refreshed.
     */

    /**
     * @cfg {Boolean} resizable
     * False to prevent the column from being resizable.
     */
    resizable: true,

    /**
     * @cfg {Boolean} hideable
     * False to prevent the user from hiding this column.
     */
    hideable: true,

    /**
     * @cfg {Boolean} menuDisabled
     * True to disable the column header menu containing sort/hide options.
     */
    menuDisabled: false,

    /**
     * @cfg {Function/String} renderer
     * A renderer is an 'interceptor' method which can be used to transform data (value, 
     * appearance, etc.) before it is rendered. Example:
     * 
     * **NOTE:** In previous releases, a string was treated as a method on 
     * `Ext.util.Format` but that is now handled by the {@link #formatter} config.
     *
     * @param {Object} value The data value for the current cell
     * 
     *     renderer: function(value){
     *         // evaluates `value` to append either `person' or `people`
     *         return Ext.util.Format.plural(value, 'person', 'people');
     *     }
     * 
     * @param {Object} metaData A collection of metadata about the current cell; can be 
     * used or modified by the renderer. Recognized properties are: `tdCls`, `tdAttr`, 
     * and `tdStyle`.
     *
     * To add style attributes to the `&lt;td>` element, you must use the `tdStyle` 
     * property. Using a style attribute in the `tdAttr` property will override the 
     * styles the column sets, such as the width which will break the rendering. 
     *
     * You can see an example of using the metaData parameter below.
     *
     *      Ext.create('Ext.data.Store', {
     *           storeId: 'simpsonsStore',
     *           fields: ['class', 'attr', 'style'],
     *           data: {
     *               'class': 'red-bg',
     *               'attr': 'lightyellow',
     *               'style': 'red'
     *           }
     *      });
     *
     *      Ext.create('Ext.grid.Panel', {
     *           title: 'Simpsons',
     *           store: Ext.data.StoreManager.lookup('simpsonsStore'),
     *           columns: [{
     *               text: 'Name',
     *               dataIndex: 'class',
     *               renderer: function (value, metaData) {
     *                   metaData.tdCls = value;
     *                   return value;
     *               }
     *           }, {
     *               text: 'Email',
     *               dataIndex: 'attr',
     *               flex: 1,
     *               renderer: function (value, metaData) {
     *                   metaData.tdAttr = 'bgcolor="' + value + '"';
     *                   return value;
     *               }
     *           }, {
     *               text: 'Phone',
     *               dataIndex: 'style',
     *               renderer: function (value, metaData) {
     *                   metaData.tdStyle = 'color:' + value;
     *                   return value;
     *               }
     *           }],
     *           height: 200,
     *           width: 400,
     *           renderTo: Ext.getBody()
     *       });
     *
     * @param {Ext.data.Model} record The record for the current row
     *
     *     renderer: function (value, metaData, record) {
     *         // evaluate the record's `updated` field and if truthy return the value 
     *         // from the `newVal` field, else return value
     *         var updated = record.get('updated');
     *         return updated ? record.get('newVal') : value;
     *     }
     * 
     * @param {Number} rowIndex The index of the current row
     * 
     *     renderer: function (value, metaData, record, rowIndex) {
     *         // style the cell differently for even / odd values
     *         var odd = (rowIndex % 2 === 0);
     *         metaData.tdStyle = 'color:' + (odd ? 'gray' : 'red');
     *     }
     * 
     * @param {Number} colIndex The index of the current column
     * 
     *     var myRenderer = function(value, metaData, record, rowIndex, colIndex) {
     *         if (colIndex === 0) {
     *             metaData.tdAttr = 'data-qtip=' + value;
     *         }
     *         // additional logic to apply to values in all columns
     *         return value;
     *     }
     *     
     *     // using the same renderer on all columns you can process the value for
     *     // each column with the same logic and only set a tooltip on the first column
     *     renderer: myRenderer
     * 
     * _See also {@link Ext.tip.QuickTipManager}_
     * 
     * @param {Ext.data.Store} store The data store
     * 
     *     renderer: function (value, metaData, record, rowIndex, colIndex, store) {
     *         // style the cell differently depending on how the value relates to the 
     *         // average of all values
     *         var average = store.average('grades');
     *         metaData.tdCls = (value < average) ? 'needsImprovement' : 'satisfactory';
     *         return value;
     *     }
     * 
     * @param {Ext.view.View} view The data view
     * 
     *     renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
     *         // style the cell using the dataIndex of the column
     *         var headerCt = this.getHeaderContainer(),
     *             column = headerCt.getHeaderAtIndex(colIndex);
     * 
     *         metaData.tdCls = 'app-' + column.dataIndex;
     *         return value;
     *     }
     * 
     * @return {String}
     * The HTML string to be rendered.
     * @declarativeHandler
     */
    renderer: false,

    /**
     * @cfg {Function/String} updater
     * An updater is a method which is used when records are updated, and an *existing* grid row needs updating.
     * The method is passed the cell element and may manipulate it in any way.
     *
     * **Note**: The updater is required to insert the {@link #emptyCellText} if there 
     * is no value in the cell.
     * 
     *     Ext.create('Ext.grid.Panel', {
     *         title: 'Grades',
     *         store: {
     *             fields: ['originalScore', 'newScore'],
     *             data: [{
     *                 originalScore: 70,
     *                 newScore: 70
     *             }]
     *         },
     *         columns: [{
     *             text: 'Score',
     *             dataIndex: 'newScore',
     *             editor: 'numberfield',
     *             flex: 1,
     *             updater: function (cell, value, record, view) {
     *                 var inner = Ext.get(cell).first(),
     *                     originalScore = record.get('originalScore'),
     *                     color = (value === originalScore) ? 'black' : (value > originalScore) ? 'green' : 'red';
     *     
     *                 // set the color based on the current value relative to the originalScore value
     *                 // * same   = black
     *                 // * higher = green
     *                 // * less   = red
     *                 inner.applyStyles({
     *                     color: color
     *                 });
     *                 // pass the value to the cell's inner el
     *                 inner.setHtml(value);
     *             }
     *         }],
     *         height: 200,
     *         width: 400,
     *         renderTo: document.body,
     *         tbar: [{
     *             xtype: 'numberfield',
     *             fieldLabel: 'New Score',
     *             value: 70,
     *             listeners: {
     *                 change: function (field, newValue) {
     *                     this.up('grid').getStore().first().set('newScore', newValue);
     *                 }
     *             }
     *         }]
     *     });
     *
     * If a string is passed it is assumed to be the name of a method defined by the
     * {@link #method-getController ViewController} or an ancestor component configured as {@link #defaultListenerScope}.
     * @cfg {HTMLElement} updater.cell The HTML cell element to update.
     * @cfg {Object} updater.value The data value for the current cell
     * @cfg {Ext.data.Model} updater.record The record for the current row
     * @cfg {Ext.view.View} updater.view The current view
     *
     * **Note**: The updater is required to insert the {@link #emptyCellText} if there is no value in the cell.
     * 
     * @declarativeHandler
     */

    /**
     * @cfg {Object} scope
     * The scope to use when calling the
     * {@link Ext.grid.column.Column#renderer renderer} function.
     */

    /**
     * @method defaultRenderer
     * When defined this will take precedence over the
     * {@link Ext.grid.column.Column#renderer renderer} config.
     * This is meant to be defined in subclasses that wish to supply their own renderer.
     * @protected
     * @template
     */

    /**
     * @cfg {Function/String} editRenderer
     * A renderer to be used in conjunction with 
     * {@link Ext.grid.plugin.RowEditing RowEditing}. This renderer is used to display a 
     * custom value for non-editable fields.
     * 
     * **Note:** The editRenderer is called when the roweditor is initially shown.  
     * Changes to the record during editing will not call editRenderer.
     * 
     *     var store = Ext.create('Ext.data.Store', {
     *         fields: ['name', 'email'],
     *         data: [{
     *             "name": "Finn",
     *             "email": "finn@adventuretime.com"
     *         }, {
     *             "name": "Jake",
     *             "email": "jake@adventuretime.com"
     *         }]
     *     });
     *     
     *     Ext.create('Ext.grid.Panel', {
     *         title: 'Land Of Ooo',
     *         store: store,
     *         columns: [{
     *             text: 'Name',
     *             dataIndex: 'name',
     *             editRenderer: function(value){
     *                 return '<span style="color:gray;">' + value + '</span>';
     *               }
     *         }, {
     *             text: 'Email',
     *             dataIndex: 'email',
     *             flex: 1,
     *             editor: {
     *                 xtype: 'textfield',
     *                 allowBlank: false
     *             }
     *         }],
     *         plugins: {
     *             ptype: 'rowediting',
     *             clicksToEdit: 1
     *         },
     *         height: 200,
     *         width: 400,
     *         renderTo: document.body
     *     });
     * 
     * @param {Object} value The data value for the current cell
     * 
     *     editRenderer: function(value){
     *         // evaluates `value` to append either `person' or `people`
     *         return Ext.util.Format.plural(value, 'person', 'people');
     *     }
     * 
     * @param {Object} metaData **Note:** The metadata param is passed to the 
     * editRenderer, but is not used.
     *
     * @param {Ext.data.Model} record The record for the current row
     *
     *     editRenderer: function (value, metaData, record) {
     *         // evaluate the record's `updated` field and if truthy return the value 
     *         // from the `newVal` field, else return value
     *         var updated = record.get('updated');
     *         return updated ? record.get('newVal') : value;
     *     }
     * 
     * @param {Number} rowIndex The index of the current row
     * 
     *     editRenderer: function (value, metaData, record, rowIndex) {
     *         // style the value differently for even / odd values
     *         var odd = (rowIndex % 2 === 0),
     *             color = (odd ? 'gray' : 'red');
     *         return '<span style="color:' + color + ';">' + value + '</span>';
     *     }
     * 
     * @param {Number} colIndex The index of the current column
     * 
     * @param {Ext.data.Store} store The data store
     * 
     *     editRenderer: function (value, metaData, record, rowIndex, colIndex, store) {
     *         // style the cell differently depending on how the value relates to the 
     *         // average of all values
     *         var average = store.average('grades'),
     *             status = (value < average) ? 'needsImprovement' : 'satisfactory';
     *         return '<span class="' + status + '">' + value + '</span>';
     *     }
     * 
     * @param {Ext.view.View} view The data view
     * 
     *     editRenderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
     *         // style the value using the dataIndex of the column
     *         var headerCt = this.getHeaderContainer(),
     *             column = headerCt.getHeaderAtIndex(colIndex);
     * 
     *         return '<span class="app-' + column.dataIndex + '">' + value + '</span>';
     *     }
     * 
     * @return {String}
     * The HTML string to be rendered.
     * @declarativeHandler
     */

    /**
     * @cfg {Function/String} summaryRenderer
     * A renderer to be used in conjunction with the {@link Ext.grid.feature.Summary Summary} or
     * {@link Ext.grid.feature.GroupingSummary GroupingSummary} features. This renderer is used to
     * display a summary value for this column.
     * @declarativeHandler
     */

    /**
     * @cfg {String} align
     * Sets the alignment of the header and rendered columns.
     * Possible values are: `'left'`, `'center'`, and `'right'`.
     */
    align: 'left',

    /**
     * @cfg {Boolean} draggable
     * False to disable drag-drop reordering of this column.
     */
    draggable: true,

    /**
     * @cfg {String} tooltip
     * A tooltip to display for this column header
     */

    /**
     * @cfg {String} [tooltipType="qtip"]
     * The type of {@link #tooltip} to use. Either 'qtip' for QuickTips or 'title' for title attribute.
     */
    tooltipType: 'qtip',

    // Header does not use the typical ComponentDraggable class and therefore we
    // override this with an emptyFn. It is controlled at the HeaderDragZone.
    initDraggable: Ext.emptyFn,

    /**
     * @cfg {String} tdCls
     * A CSS class names to apply to the table cells for this column.
     */
    tdCls: '',

    /**
     * @cfg {Object/String} editor
     * An optional xtype or config object for a {@link Ext.form.field.Field Field} to use for editing.
     * Only applicable if the grid is using an {@link Ext.grid.plugin.Editing Editing} plugin.
     */

    /**
     * @cfg {Object/String} field
     * Alias for {@link #editor}.
     * @deprecated 4.0.5 Use {@link #editor} instead.
     */
    
    /**
     * @cfg {Boolean} producesHTML
     * This flag indicates that the renderer produces HTML.
     *
     * If this column is going to be updated rapidly, and the
     * {@link Ext.grid.column.Column#renderer renderer} or {@link #cfg-updater} only produces
     * text, then to avoid the expense of HTML parsing and element production during the
     * update, this property may be configured as `false`.
     */
    producesHTML: true,

    /**
     * @property {Ext.dom.Element} triggerEl
     * Element that acts as button for column header dropdown menu.
     */

    /**
     * @property {Ext.dom.Element} textEl
     * Element that contains the text in column header.
     */

    /**
     * @property {Boolean} isHeader
     * @deprecated see isColumn
     * Set in this class to identify, at runtime, instances which are not instances of the
     * HeaderContainer base class, but are in fact, the subclass: Header.
     */
    isHeader: true,

    /**
     * @property {Boolean} isColumn
     * @readonly
     * Set in this class to identify, at runtime, instances which are not instances of the
     * HeaderContainer base class, but are in fact simple column headers.
     */
    isColumn: true,
    
    tabIndex: -1,

    ascSortCls: Ext.baseCSSPrefix + 'column-header-sort-ASC',
    descSortCls: Ext.baseCSSPrefix + 'column-header-sort-DESC',

    componentLayout: 'columncomponent',

    groupSubHeaderCls: Ext.baseCSSPrefix + 'group-sub-header',

    groupHeaderCls: Ext.baseCSSPrefix + 'group-header',

    clickTargetName: 'titleEl',

    // So that when removing from group headers which are then empty and then get destroyed, there's no child DOM left
    detachOnRemove : true,

    // We need to override the default component resizable behaviour here
    initResizable: Ext.emptyFn,

    // Property names to reference the different types of renderers and formatters that 
    // we can use.
    rendererNames: {
        column: 'renderer',
        edit: 'editRenderer',
        summary: 'summaryRenderer'
    },
    formatterNames: {
        column: 'formatter',
        edit: 'editFormatter',
        summary: 'summaryFormatter'
    },

    initComponent: function() {
        var me = this;

        // Preserve the scope to resolve a custom renderer.
        // Subclasses (TreeColumn) may insist on scope being this.
        me.rendererScope = me.initialConfig.scope;

        if (me.header != null) {
            me.text = me.header;
            me.header = null;
        }

        if (me.cellWrap) {
            me.tdCls = (me.tdCls || '') + ' ' + Ext.baseCSSPrefix + 'wrap-cell';
        }

        // A group header; It contains items which are themselves Headers
        if (me.columns != null) {
            me.isGroupHeader = true;

            //<debug>
            if (me.dataIndex) {
                Ext.Error.raise('Ext.grid.column.Column: Group header may not accept a dataIndex');
            }
            if ((me.width && me.width !== Ext.grid.header.Container.prototype.defaultWidth) || me.flex) {
                Ext.Error.raise('Ext.grid.column.Column: Group header does not support setting explicit widths or flexs. The group header width is calculated by the sum of its children.');
            }
            //</debug>

            // The headers become child items
            me.items = me.columns;
            me.columns = me.flex = me.width = null;
            me.cls = (me.cls||'') + ' ' + me.groupHeaderCls;

            // A group cannot be sorted, or resized - it shrinkwraps its children
            me.sortable = me.resizable = false;
            me.align = 'center';
        } else {
            // Flexed Headers need to have a minWidth defined so that they can never be squeezed out of existence by the
            // HeaderContainer's specialized Box layout, the ColumnLayout. The ColumnLayout's overridden calculateChildboxes
            // method extends the available layout space to accommodate the "desiredWidth" of all the columns.
            if (me.flex) {
                me.minWidth = me.minWidth || Ext.grid.plugin.HeaderResizer.prototype.minColWidth;
            }
        }
        me.addCls(Ext.baseCSSPrefix + 'column-header-align-' + me.align);

        // Set up the renderer types: 'renderer', 'editRenderer', and 'summaryRenderer'
        me.setupRenderer();
        me.setupRenderer('edit');
        me.setupRenderer('summary');

        // Initialize as a HeaderContainer
        me.callParent(arguments);
    },

    bindFormatter: function (format) {
        var me = this;

        return function (v) {
            return format.format(v, format.scope || me.rendererScope || me.resolveListenerScope());
        };
    },

    bindRenderer: function (renderer) {
        var me = this;

        //<debug>
        if (renderer in Ext.util.Format) {
            Ext.log.warn('Use "formatter" config instead of "renderer" to use ' +
                         'Ext.util.Format to format cell values');
        }
        //</debug>

        me.hasCustomRenderer = true;

        return function () {
            return Ext.callback(renderer, me.rendererScope, arguments, 0, me);
        };
    },

    // type can be null or 'edit', or 'summary'
    setupRenderer: function (type) {
        type = type || 'column';

        var me = this,
            format   = me[me.formatterNames[type]],
            renderer = me[me.rendererNames[type]],
            isColumnRenderer = type === 'column',
            scoped;

        if (!format) {
            if (renderer) {
                // Resolve a string renderer into the correct property: 'renderer', 'editRenderer', or 'summaryRenderer'
                if (typeof renderer === 'string') {
                    renderer = me[me.rendererNames[type]] = me.bindRenderer(renderer);
                }

                // If we are setting up a normal column renderer, detect if it's a custom one (reads more than one parameter)
                if (isColumnRenderer) {
                    me.hasCustomRenderer = renderer.length > 1;
                }
            }
            // Column renderer could not be resolved: use the default one.
            else if (isColumnRenderer && me.defaultRenderer) {
                me.renderer = me.defaultRenderer;
                me.usingDefaultRenderer = true;
            }
        } else {
            scoped = format.indexOf('this.') === 0;
            if (scoped) {
                format = format.substring(5);
            }

            /**
             * @cfg {String} formatter
             * This config accepts a format specification as would be used in a `Ext.Template`
             * formatted token. For example `'round(2)'` to round numbers to 2 decimal places
             * or `'date("Y-m-d")'` to format a Date.
             *
             * In previous releases the `renderer` config had limited abilities to use one
             * of the `Ext.util.Format` methods but `formatter` now replaces that usage and
             * can also handle formatting parameters.
             *
             * When the value begins with `"this."` (for example, `"this.foo(2)"`), the
             * implied scope on which "foo" is found is the `scope` config for the column.
             *
             * If the `scope` is not given, or implied using a prefix of `"this"`, then either the
             * {@link #method-getController ViewController} or the closest ancestor component configured
             * as {@link #defaultListenerScope} is assumed to be the object with the method.
             * @since 5.0.0
             */
            format = Ext.app.bind.Template.prototype.parseFormat(format);
            me[me.formatterNames[type]] = null; // processed - trees come back here to add its renderer

            if (scoped) {
                format.scope = null; // not Ext.util.Format
            }
            //<debug>
            else if (!Ext.util.Format[format.fmt]) {
                Ext.Error.raise('Invalid formatter specified: "' + format.fmt + '"');
            }
            //</debug>

            // Set up the correct property: 'renderer', 'editRenderer', or 'summaryRenderer'
            me[me.rendererNames[type]] = me.bindFormatter(format);
        }
    },

    getView: function() {
        var rootHeaderCt = this.getRootHeaderCt();

        if (rootHeaderCt) {
            return rootHeaderCt.view;
        }
    },

    onResize: function(width, height, oldWidth, oldHeight) {
        var me = this,
            view,
            bufferedRenderer;

        me.callParent(arguments);
        if (oldWidth && me.cellWrap) {
            view = me.getView();
            if (view) {
                bufferedRenderer = view.bufferedRenderer;

                // Changing the width of a wrapping column may affect the data height which might mean that
                // The current position of the rendered block might be wrong. The BufferedRenderer must fix that.
                if (bufferedRenderer) {
                    bufferedRenderer.onWrappedColumnWidthChange(oldWidth, width);
                }
            }
        }
    },

    onFocusLeave: function(e) {
        this.callParent([e]);
        if (this.activeMenu) {
            this.activeMenu.hide();
        }
    },

    initItems: function() {
        var me = this;

        me.callParent(arguments);

        if (me.isGroupHeader) {
            // We need to hide the groupheader straightaway if it's configured as hidden or all its children are.
            if (me.config.hidden || !me.hasVisibleChildColumns()) {
                me.hide();
            }
        }
    },

    hasVisibleChildColumns: function() {
        var items = this.items.items,
            len = items.length,
            i, item;

        for (i = 0; i < len; ++i) {
            item = items[i];
            if (item.isColumn && !item.hidden) {
                return true;
            }
        }
        return false;
    },

    onAdd: function (child) {
        var me = this;

        if (child.isColumn) {
            child.isSubHeader = true;
            child.addCls(me.groupSubHeaderCls);
        }

        if (me.isGroupHeader && me.hidden && me.hasVisibleChildColumns()) {
            me.show();
        }

        me.callParent([child]);
    },

    onRemove: function(child) {
        var me = this;

        if (child.isSubHeader) {
            child.isSubHeader = false;
            child.removeCls(me.groupSubHeaderCls);
        }

        me.callParent([child]);

        // By this point, the component will be removed from the items collection.
        //
        // Note that we don't want to remove any grouped headers that have a descendant that is currently the drag target of an even lower stacked
        // grouped header.  See the comments in Ext.grid.header.Container#isNested.
        if (!(me.isDestroyed || me.destroying) && !me.hasVisibleChildColumns() && !me.ownerCt.isNested()) {
            me.hide();
        }
    },

    initRenderData: function() {
        var me = this,
            tipMarkup = '',
            tip = me.tooltip,
            text = me.text,
            attr = me.tooltipType === 'qtip' ? 'data-qtip' : 'title';

        if (!Ext.isEmpty(tip)) {
            tipMarkup = attr + '="' + tip + '" ';
        }

        return Ext.applyIf(me.callParent(arguments), {
            text: text,
            empty: text === '&#160;' || text === ' ' || text === '',
            menuDisabled: me.menuDisabled,
            tipMarkup: tipMarkup,
            triggerStyle: this.getTriggerVisible() ? 'display:block' : ''
        });
    },

    applyColumnState: function (state) {
        var me = this;

        // apply any columns
        me.applyColumnsState(state.columns);

        // Only state properties which were saved should be restored.
        // (Only user-changed properties were saved by getState)
        if (state.hidden != null) {
            me.hidden = state.hidden;
        }
        if (state.locked != null) {
            me.locked = state.locked;
        }
        if (state.sortable != null) {
            me.sortable = state.sortable;
        }
        if (state.width != null) {
            me.flex = null;
            me.width = state.width;
        } else if (state.flex != null) {
            me.width = null;
            me.flex = state.flex;
        }
    },

    getColumnState: function () {
        var me = this,
            items = me.items.items,
            // Check for the existence of items, since column.Action won't have them
            iLen = items ? items.length : 0,
            i,
            columns = [],
            state = {
                id: me.stateId || me.getStateId()
            };

        me.savePropsToState(['hidden', 'sortable', 'locked', 'flex', 'width'], state);

        if (me.isGroupHeader) {
            for (i = 0; i < iLen; i++) {
                columns.push(items[i].getColumnState());
            }

            if (columns.length) {
                state.columns = columns;
            }
        }

        if ('width' in state) {
            delete state.flex; // width wins
        }
        return state;
    },

    getStateId: function () {
        return (this.stateId = this.stateId || this.headerId);
    },

    /**
     * Sets the header text for this Column.
     * @param {String} text The header to display on this Column.
     */
    setText: function(text) {
        this.text = text;
        if (this.rendered) {
            this.textEl.setHtml(text);
        }
    },

    /**
     * Returns the index of this column only if this column is a base level Column. If it
     * is a group column, it returns `false`.
     * @return {Number}
     */
    getIndex: function() {
        return this.isGroupColumn ? false : this.getRootHeaderCt().getHeaderIndex(this);
    },

    /**
     * Returns the index of this column in the list of *visible* columns only if this column is a base level Column. If it
     * is a group column, it returns `false`.
     * @return {Number}
     */
    getVisibleIndex: function() {
        // Note that the visibleIndex property is assigned by the owning HeaderContainer 
        // when assembling the visible column set for the view.
        return this.visibleIndex != null ? this.visibleIndex : this.isGroupColumn ? false : Ext.Array.indexOf(this.getRootHeaderCt().getVisibleGridColumns(), this);
    },

    beforeRender: function() {
        var me = this,
            rootHeaderCt = me.getRootHeaderCt();

        me.callParent();

        // Disable the menu if there's nothing to show in the menu, ie:
        // Column cannot be sorted, grouped or locked, and there are no grid columns which may be hidden
        if (!me.isSortable() && !me.groupable &&
                 !me.lockable && (rootHeaderCt.grid.enableColumnHide === false ||
                 !rootHeaderCt.getHideableColumns().length)) {
            me.menuDisabled = true;
        }
        // Wrapping text may cause unpredictable line heights.
        // variableRowHeight is interrogated by the View for all visible columns to determine whether
        // addition of new rows should cause an ExtJS layout.
        // The View's summation of the presence of visible variableRowHeight columns is also used by
        // any buffered renderer to determine how row height should be calculated when determining scroll range.
        if (me.cellWrap) {
            me.variableRowHeight = true;
        }

        me.protoEl.unselectable();
    },

    getTriggerElWidth: function() {
        var me = this,
            triggerEl = me.triggerEl,
            width = me.self.triggerElWidth;
        
        if (triggerEl && width === undefined) {
            triggerEl.setStyle('display', 'block');
            width = me.self.triggerElWidth = triggerEl.getWidth();
            triggerEl.setStyle('display', '');
        }
        
        return width;
    },

    // private
    // Inform the header container about the resize
    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        var me = this,
            rootHeaderCt = me.getRootHeaderCt();

        me.callParent(arguments);

        if (rootHeaderCt && (oldWidth != null || me.flex) && width !== oldWidth) {
            rootHeaderCt.onHeaderResize(me, width);
        }
    },

    onDestroy: function() {
        var me = this;
        // force destroy on the textEl, IE reports a leak
        Ext.destroy(me.field);
        me.field = null;
        me.callParent(arguments);
    },

    onTitleMouseOver: function() {
        this.titleEl.addCls(this.hoverCls);
    },

    onTitleMouseOut: function() {
        this.titleEl.removeCls(this.hoverCls);
    },

    onDownKey: function(e) {
        if (this.triggerEl) {
            this.onTitleElClick(e, this.triggerEl.dom || this.el.dom);
        }
    },

    onEnterKey: function(e) {
        this.onTitleElClick(e, this.el.dom);
    },

    /**
     * @private
     * Double click handler which, if on left or right edges, auto-sizes the column to the left.
     * @param e The dblclick event
     */
    onTitleElDblClick: function(e) {
        var me = this,
            prev,
            leafColumns,
            headerCt;

        // On left edge, resize previous *leaf* column in the grid
        if (me.isAtStartEdge(e)) {

            // Look for the previous visible column header which is a leaf
            // Note: previousNode can walk out of the container (this may be first child of a group)
            prev = me.previousNode('gridcolumn:not([hidden]):not([isGroupHeader])');

            // If found in the same grid, auto-size it
            if (prev && prev.getRootHeaderCt() === me.getRootHeaderCt()) {
                prev.autoSize();
            }
        }
        // On right edge, resize this column, or last sub-column within it
        else if (me.isAtEndEdge(e)) {

            // Click on right but in child container - auto-size last leaf column
            if (me.isGroupHeader && e.getPoint().isContainedBy(me.layout.innerCt)) {
                leafColumns = me.query('gridcolumn:not([hidden]):not([isGroupHeader])');
                me.getRootHeaderCt().autoSizeColumn(leafColumns[leafColumns.length - 1]);
                return;
            } else {
                headerCt = me.getRootHeaderCt();

                // Cannot resize the only column in a forceFit grid.
                if (headerCt.visibleColumnManager.getColumns().length === 1 && headerCt.forceFit) {
                    return;
                }
            }
            me.autoSize();
        }
    },

    /**
     * Sizes this Column to fit the max content width.
     * *Note that group columns shrink-wrap around the size of leaf columns. Auto sizing 
     * a group column auto-sizes descendant leaf columns.*
     */
    autoSize: function() {
        var me = this,
            leafColumns,
            numLeaves, i,
            headerCt;

        // Group headers are shrinkwrap width, so auto-sizing one means auto-sizing leaf 
        // descendants.
        if (me.isGroupHeader) {
            leafColumns = me.query('gridcolumn:not([hidden]):not([isGroupHeader])');
            numLeaves = leafColumns.length;
            headerCt = me.getRootHeaderCt();
            Ext.suspendLayouts();
            for (i = 0; i < numLeaves; i++) {
                headerCt.autoSizeColumn(leafColumns[i]);
            }
            Ext.resumeLayouts(true);
            return;
        }

        me.getRootHeaderCt().autoSizeColumn(me);
    },

    onTitleElClick: function(e, t, sortOnClick) {
        var me = this,
            activeHeader,
            prevSibling;

        // Tap on the resize zone triggers the menu
        if (Ext.supports.Touch) {
            prevSibling = me.previousSibling(':not([hidden])');

            // Tap on right edge, activate this header
            if (!me.menuDisabled && me.isAtEndEdge(e, parseInt(me.triggerEl.getStyle('width'), 10))) {
                if (!me.menuDisabled) {
                    activeHeader = me;
                }
            }

            // Tap on left edge, activate previous header
            else if (prevSibling && !prevSibling.menuDisabled && me.isAtStartEdge(e)) {
                activeHeader = prevSibling;
            }
        }
        else {
            // Firefox doesn't check the current target in a within check.
            // Therefore we check the target directly and then within (ancestors)
            activeHeader = me.triggerEl && (e.target === me.triggerEl.dom || t === me.triggerEl || e.within(me.triggerEl)) ? me : null;
        }

        // If it's not a click on the trigger or extreme edges. Or if we are called from a key handler, sort this column.
        if (sortOnClick !== false && (!activeHeader && !me.isAtStartEdge(e) && !me.isAtEndEdge(e) || e.getKey())) {
            me.toggleSortState();
        }
        return activeHeader;
    },

    /**
     * @private
     * Process UI events from the view. The owning TablePanel calls this method, relaying events from the TableView
     * @param {String} type Event type, eg 'click'
     * @param {Ext.view.Table} view TableView Component
     * @param {HTMLElement} cell Cell HTMLElement the event took place within
     * @param {Number} recordIndex Index of the associated Store Model (-1 if none)
     * @param {Number} cellIndex Cell index within the row
     * @param {Ext.event.Event} e Original event
     */
    processEvent: function(type, view, cell, recordIndex, cellIndex, e) {
        return this.fireEvent.apply(this, arguments);
    },

    isSortable: function() {
        var rootHeader = this.getRootHeaderCt(),
            grid = rootHeader ? rootHeader.grid : null, 
            sortable = this.sortable;

        if (grid && grid.sortableColumns === false) {
            sortable = false;
        }
        return sortable;
    },

    toggleSortState: function() {
        if (this.isSortable()) {
            this.sort();
        }
    },

    sort: function(direction) {
        var me = this,
            grid = me.up('tablepanel'),
            store = grid.store;

        // Maintain backward compatibility.
        // If the grid is NOT configured with multi column sorting, then specify "replace".
        // Only if we are doing multi column sorting do we insert it as one of a multi set.
        // Suspend layouts in case multiple views depend upon this grid's store (eg lockable assemblies)
        Ext.suspendLayouts();
        me.sorting = true;
        store.sort(me.getSortParam(), direction, grid.multiColumnSort ? 'multi' : 'replace');
        delete me.sorting;
        Ext.resumeLayouts(true);
    },

    /**
     * Returns the parameter to sort upon when sorting this header. By default this returns the dataIndex and will not
     * need to be overridden in most cases.
     * @return {String}
     */
    getSortParam: function() {
        return this.dataIndex;
    },

    // Private
    // Set the UI state to reflect the state of any passed Sorter
    // Called by the grid's HeaderContainer on view refresh
    setSortState: function(sorter) {
        var me = this,
            direction = sorter && sorter.getDirection(),
            ascCls = me.ascSortCls,
            descCls = me.descSortCls,
            rootHeaderCt = me.getRootHeaderCt(),
            changed;

        switch (direction) {
            case 'DESC':
                if (!me.hasCls(descCls)) {
                    me.addCls(descCls);
                    me.sortState = 'DESC';
                    changed = true;
                }
                me.removeCls(ascCls);
                break;
            case 'ASC':
                if (!me.hasCls(ascCls)) {
                    me.addCls(ascCls);
                    me.sortState = 'ASC';
                    changed = true;
                }
                me.removeCls(descCls);
                break;
            default:
                me.removeCls([ascCls, descCls]);
                me.sortState = null;
                break;
        }
        // we only want to fire the event if we have actually sorted
        if (changed) {
            rootHeaderCt.fireEvent('sortchange', rootHeaderCt, me, direction);
        }
    },

    /**
     * Determines whether the UI should be allowed to offer an option to hide this column.
     *
     * A column may *not* be hidden if to do so would leave the grid with no visible columns.
     *
     * This is used to determine the enabled/disabled state of header hide menu items.
     */
    isHideable: function() {
        var result = {
                hideCandidate: this,
                result: this.hideable
            };

        if (result.result) {
            this.ownerCt.bubble(this.hasOtherMenuEnabledChildren, null, [result]);
        }
        return result.result;
    },

    // Private bubble function used in determining whether this column is hideable.
    // Executes in the scope of each component in the bubble sequence
    hasOtherMenuEnabledChildren: function(result) {
        var visibleChildren,
            count;

        // If we've bubbled out the top of the topmost HeaderContainer without finding a level with at least one visible,
        // menu-enabled child *which is not the hideCandidate*, no hide!
        if (!this.isXType('headercontainer')) {
            result.result = false;
            return false;
        }

        // If we find an ancestor level with at least one visible, menu-enabled child 
        // *which is not the hideCandidate*, then the hideCandidate is hideable.
        // Note that we are not using CQ #id matchers - ':not(#' + result.hideCandidate.id + ')' - to exclude
        // the hideCandidate because CQ queries are cached for the document's lifetime.
        visibleChildren = this.query('>:not([hidden]):not([menuDisabled])');
        count = visibleChildren.length;
        if (Ext.Array.contains(visibleChildren, result.hideCandidate)) {
            count--;
        }
        if (count) {
            return false;
        }
        // If we go up, it's because the hideCandidate was the only hideable child, so *this* becomes the hide candidate.
        result.hideCandidate = this;
    },

    /**
     * Determines whether the UI should be allowed to offer an option to lock or unlock this column. Note
     * that this includes dragging a column into the opposite side of a {@link Ext.panel.Table#enableLocking lockable} grid.
     *
     * A column may *not* be moved from one side to the other of a {@link Ext.panel.Table#enableLocking lockable} grid
     * if to do so would leave one side with no visible columns.
     *
     * This is used to determine the enabled/disabled state of the lock/unlock
     * menu item used in {@link Ext.panel.Table#enableLocking lockable} grids, and to determine droppabilty when dragging a header.
     */
    isLockable: function() {
        var result = {
                result: this.lockable !== false
            };

        if (result.result) {
            this.ownerCt.bubble(this.hasMultipleVisibleChildren, null, [result]);
        }
        return result.result;
    },

    /*
     * Determines whether this column is in the locked side of a grid. It may be a descendant node of a locked column
     * and as such will *not* have the {@link #locked} flag set.
     */
    isLocked: function() {
        return this.locked || !!this.up('[isColumn][locked]', '[isRootHeader]');
    },

    // Private bubble function used in determining whether this column is lockable.
    // Executes in the scope of each component in the bubble sequence
    hasMultipleVisibleChildren: function(result) {
        // If we've bubbled out the top of the topmost HeaderContainer without finding a level with more than one visible child, no hide!
        if (!this.isXType('headercontainer')) {
            result.result = false;
            return false;
        }
        // If we find an ancestor level with more than one visible child, it's fine to hide
        if (this.query('>:not([hidden])').length > 1) {
            return false;
        }
    },

    hide: function () {
        var me = this,
            rootHeaderCt = me.getRootHeaderCt(),
            owner = me.getRefOwner();

        // During object construction, so just set the hidden flag and jump out
        if (owner.constructing) {
            me.callParent();
            return me;
        }

        if (me.rendered && !me.isVisible()) {
            // Already hidden
            return me;
        }

        // Save our last shown width so we can gain space when shown back into fully flexed HeaderContainer.
        // If we are, say, flex: 1 and all others are fixed width, then removing will do a layout which will
        // convert all widths to flexes which will mean this flex value is too small.
        if (rootHeaderCt.forceFit) {
            me.visibleSiblingCount = rootHeaderCt.getVisibleGridColumns().length - 1;
            if (me.flex) {
                me.savedWidth = me.getWidth();
                me.flex = null;
            }
        }

        rootHeaderCt.beginChildHide();
        Ext.suspendLayouts();

        // owner is a group, hide call didn't come from the owner
        if (owner.isGroupHeader) {
            // The owner only has one item that isn't hidden and it's me; hide the owner.
            if (me.isNestedGroupHeader()) {
                owner.hide();
            }

            if (me.isSubHeader && !me.isGroupHeader && owner.query('>:not([hidden])').length === 1) {
                // We need to remember the last headerId to be unchecked in able to to restore its checked
                // status in HeaderContainer#onHeaderCheckChange.
                owner.lastCheckedHeaderId = me.id;
            }
        }

        me.callParent();

        // Notify owning HeaderContainer. Will trigger a layout and a view refresh.
        rootHeaderCt.endChildHide();
        rootHeaderCt.onHeaderHide(me);

        Ext.resumeLayouts(true);
        return me;
    },

    show: function () {
        var me = this,
            rootHeaderCt = me.getRootHeaderCt(),
            ownerCt = me.ownerCt;

        if (me.isVisible()) {
            return me;
        }

        if (me.rendered) {
            // Size all other columns to accommodate re-shown column.
            if (rootHeaderCt.forceFit) {
                rootHeaderCt.applyForceFit(me);
            }
        }

        Ext.suspendLayouts();

        // If a sub header, ensure that the group header is visible
        if (me.isSubHeader && ownerCt.hidden) {
            ownerCt.show(false, true);
        }

        me.callParent(arguments);

        if (me.isGroupHeader) {
            me.maybeShowNestedGroupHeader();
        }

        // Notify owning HeaderContainer. Will trigger a layout and a view refresh.
        ownerCt = me.getRootHeaderCt();

        if (ownerCt) {
            ownerCt.onHeaderShow(me);
        }

        Ext.resumeLayouts(true);
        return me;

    },

    getCellWidth: function() {
        var me = this,
            result;

        if (me.rendered && me.componentLayout && me.componentLayout.lastComponentSize) {
            // headers always have either a width or a flex
            // because HeaderContainer sets a defaults width
            // therefore we can ignore the natural width
            // we use the componentLayout's tracked width so that
            // we can calculate the desired width when rendered
            // but not visible because its being obscured by a layout
            result = me.componentLayout.lastComponentSize.width;
        } else if (me.width) {
            result = me.width;
        }
        
        // This is a group header.
        // Use getTableWidth and remember that getTableWidth adjusts for column lines and box model
        else if (!me.isColumn) {
            result = me.getTableWidth();
        }

        return result;
    },
    
    getCellId: function() {
        return Ext.baseCSSPrefix + 'grid-cell-' + this.getItemId();
    },

    getCellSelector: function() {
        return '.' + this.getCellId();
    },

    getCellInnerSelector: function() {
        return this.getCellSelector() + ' .' + Ext.baseCSSPrefix + 'grid-cell-inner';
    },

    isAtStartEdge: function(e) {
        return (e.getXY()[0] - this.getX() < this.handleWidth);
    },

    isAtEndEdge: function(e, margin) {
        return (this.getX() + this.getWidth() - e.getXY()[0] <= (margin || this.handleWidth));
    },

    // Called when the column menu is activated/deactivated.
    // Change the UI to indicate active/inactive menu
    setMenuActive: function(menu) {
        this.activeMenu = menu;
        this.titleEl[menu ? 'addCls' : 'removeCls'](this.headerOpenCls);
    },

    deprecated: {
        5: {
            methods: {
                bindRenderer: function (renderer) {
                    // This method restores the pre-5 meaning of "renderer" as a string:
                    // a method in Ext.util.Format. But at least we don't send all of 
                    // the renderer arguments at the poor thing!
                    return function (value) {
                        return Ext.util.Format[renderer](value);
                    };
                }
            }
        }
    }

    // intentionally omit getEditor and setEditor definitions bc we applyIf into columns
    // when the editing plugin is injected

    /**
     * @method getEditor
     * Retrieves the editing field for editing associated with this header.  If the 
     * field has not been instantiated it will be created. 
     * 
     * **Note:** These methods only have an implementation if an Editing plugin has been 
     * enabled on the grid ({@link Ext.grid.plugin.CellEditing cellediting} / 
     * {@link Ext.grid.plugin.RowEditing rowediting}).
     * @param {Object} [record] The {@link Ext.data.Model Model} instance being edited.
     * @param {Object/String} [defaultField] An xtype or config object for a 
     * {@link Ext.form.field.Field Field} to be created as the default editor if it does 
     * not already exist
     * @return {Ext.form.field.Field/Boolean} The editor field associated with 
     * this column.  Returns false if there is no field associated with the 
     * {@link Ext.grid.column.Column Column}.
     */
    /**
     * @method setEditor
     * Sets the form field to be used for editing. Note: This method only has an implementation if an Editing plugin has
     * been enabled on the grid.
     * @param {Object} field An object representing a field to be created. If no xtype is specified a 'textfield' is
     * assumed.
     */
});
