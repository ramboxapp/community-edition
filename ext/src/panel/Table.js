/**
 * This class is the base class for both {@link Ext.tree.Panel TreePanel} and
 * {@link Ext.grid.Panel GridPanel}.
 *
 * TablePanel aggregates:
 *
 *  - a Selection Model
 *  - a View
 *  - a Store
 *  - Ext.grid.header.Container
 * 
 * @mixins Ext.grid.locking.Lockable
 */
Ext.define('Ext.panel.Table', {
    extend: 'Ext.panel.Panel',

    alias: 'widget.tablepanel',
    
    requires: [
        'Ext.layout.container.Fit'
    ],

    uses: [
        'Ext.selection.RowModel',
        'Ext.selection.CellModel',
        'Ext.selection.CheckboxModel',
        'Ext.grid.plugin.BufferedRenderer',
        'Ext.grid.header.Container',
        'Ext.grid.locking.Lockable',
        'Ext.grid.NavigationModel'
    ],

    extraBaseCls: Ext.baseCSSPrefix + 'grid',
    extraBodyCls: Ext.baseCSSPrefix + 'grid-body',

    defaultBindProperty: 'store',

    layout: 'fit',
    
    ariaRole: 'grid',

    config: {
        /**
         * @cfg {Ext.data.Model} selection
         * The selected model. Typically used with {@link #bind binding}.
         */
        selection: null
    },

    publishes: ['selection'],
    twoWayBindable: ['selection'],

    /**
     * @cfg {Boolean} [autoLoad=false]
     * Use `true` to load the store as soon as this component is fully constructed. It is
     * best to initiate the store load this way to allow this component and potentially
     * its plugins (such as `{@link Ext.grid.filters.Filters}` to be ready to load.
     */
    autoLoad: false,

    /**
     * @cfg {Boolean} [variableRowHeight=false]
     * @deprecated 5.0.0 Use {@link Ext.grid.column.Column#variableRowHeight} instead.
     * Configure as `true` if the row heights are not all the same height as the first row.
     */
    variableRowHeight: false,

    /**
     * @cfg {Number}
     * This configures the zone which causes new rows to be appended to the view. As soon as the edge
     * of the rendered grid is this number of rows from the edge of the viewport, the view is moved.
     */
    numFromEdge: 2,

    /**
     * @cfg {Number}
     * TableViews are buffer rendered in 5.x which means that only the visible subset of data rows
     * are rendered into the DOM. These are removed and added as scrolling demands.
     *
     * This configures the number of extra rows to render on the trailing side of scrolling
     * **outside the {@link #numFromEdge}** buffer as scrolling proceeds.
     */
    trailingBufferZone: 10,

    /**
     * @cfg {Number}
     * TableViews are buffer rendered in 5.x which means that only the visible subset of data rows
     * are rendered into the DOM. These are removed and added as scrolling demands.
     *
     * This configures the number of extra rows to render on the leading side of scrolling
     * **outside the {@link #numFromEdge}** buffer as scrolling proceeds.
     */
    leadingBufferZone: 20,

    /**
     * @property {Boolean} hasView
     * True to indicate that a view has been injected into the panel.
     */
    hasView: false,

    /**
     * @property items
     * @hide
     */

    /**
     * @cfg {String} viewType
     * An xtype of view to use. This is automatically set to 'tableview' by {@link Ext.grid.Panel Grid}
     * and to 'treeview' by {@link Ext.tree.Panel Tree}.
     * @protected
     */
    viewType: null,

    /**
     * @cfg {Object} viewConfig
     * A config object that will be applied to the grid's UI view. Any of the config options available for
     * {@link Ext.view.Table} can be specified here. This option is ignored if {@link #view} is specified.
     */

    /**
     * @cfg {Ext.view.Table} view
     * The {@link Ext.view.Table} used by the grid. Use {@link #viewConfig} to just supply some config options to
     * view (instead of creating an entire View instance).
     */

    /**
     * @cfg {String} [selType]
     * An xtype of selection model to use. This is used to create selection model if just
     * a config object or nothing at all given in {@link #selModel} config.
     *
     * @deprecated 5.1.0 Use the {@link #selModel}'s `type` property. Or, if no other
     * configs are required, use the string form of selModel.
     */

    /**
     * @cfg {Ext.selection.Model/Object/String} [selModel=rowmodel]
     * A {@link Ext.selection.Model selection model} instance or config object, or the selection model class's alias string.
     *
     * In latter case its `type` property determines to which type of selection model this config is applied.
     */

    /**
     * @cfg {Boolean} [multiSelect=false]
     * True to enable 'MULTI' selection mode on selection model.
     * @deprecated 4.1.1 Use {@link Ext.selection.Model#mode} 'MULTI' instead.
     */

    /**
     * @cfg {Boolean} [simpleSelect=false]
     * True to enable 'SIMPLE' selection mode on selection model.
     * @deprecated 4.1.1 Use {@link Ext.selection.Model#mode} 'SIMPLE' instead.
     */

    /**
     * @cfg {Ext.data.Store/String/Object} store (required)
     * The data source to which the grid / tree is bound. Acceptable values for this 
     * property are:
     *
     *   - **any {@link Ext.data.Store Store} class / subclass**
     *   - **an {@link Ext.data.Store#storeId ID of a store}**
     *   - **a {@link Ext.data.Store Store} config object**.  When passing a config you can 
     *   specify the store type by alias.  Passing a config object with a store type will 
     *   dynamically create a new store of that type when the grid / tree is instantiated.
     *
     * For example:
     * 
     *     Ext.define('MyApp.store.Customers', {
     *         extend: 'Ext.data.Store',
     *         alias: 'store.customerstore',
     *         fields: ['name']
     *     });
     *     
     *     Ext.create({
     *         xtype: 'gridpanel',
     *         renderTo: document.body,
     *         store: {
     *             type: 'customerstore',
     *             data: [{
     *                 name: 'Foo'
     *             }]
     *         },
     *         columns: [{
     *             text: 'Name',
     *             dataIndex: 'name'
     *         }]
     *     });
     */

    /**
     * @cfg {String/Boolean} scroll
     * Scrollers configuration. Valid values are 'both', 'horizontal' or 'vertical'.
     * True implies 'both'. False implies 'none'.
     * @deprecated 5.1.0 Use {@link #scrollable} instead
     */

    /**
     * @cfg {Boolean} [reserveScrollbar=false]
     * Set this to true to **always** leave a scrollbar sized space at the end of the grid content when
     * fitting content into the width of the grid.
     *
     * If the grid's record count fluctuates enough to hide and show the scrollbar regularly, this setting
     * avoids the multiple layouts associated with switching from scrollbar present to scrollbar not present.
     */

    /**
     * @cfg {Ext.grid.column.Column[]/Object} columns
     * An array of {@link Ext.grid.column.Column column} definition objects which define all columns that appear in this
     * grid. Each column definition provides the header text for the column, and a definition of where the data for that
     * column comes from.
     *
     * This can also be a configuration object for a {@link Ext.grid.header.Container HeaderContainer} which may override
     * certain default configurations if necessary. For example, the special layout may be overridden to use a simpler
     * layout, or one can set default values shared by all columns:
     * 
     *     columns: {
     *         items: [
     *             {
     *                 text: "Column A",
     *                 dataIndex: "field_A"
     *             },{
     *                 text: "Column B",
     *                 dataIndex: "field_B"
     *             }, 
     *             ...
     *         ],
     *         defaults: {
     *             flex: 1
     *         }
     *     }
     */

    /**
     * @cfg {Boolean} forceFit
     * True to force the columns to fit into the available width. Headers are first sized according to configuration,
     * whether that be a specific width, or flex. Then they are all proportionally changed in width so that the entire
     * content width is used. For more accurate control, it is more optimal to specify a flex setting on the columns
     * that are to be stretched & explicit widths on columns that are not.
     */

    /**
     * @cfg {Ext.grid.feature.Feature[]/Object[]/Ext.enums.Feature[]} features
     * An array of grid Features to be added to this grid. Can also be just a single feature instead of array.
     *
     * Features config behaves much like {@link #plugins}.
     * A feature can be added by either directly referencing the instance:
     *
     *     features: [Ext.create('Ext.grid.feature.GroupingSummary', {groupHeaderTpl: 'Subject: {name}'})],
     *
     * By using config object with ftype:
     *
     *     features: [{ftype: 'groupingsummary', groupHeaderTpl: 'Subject: {name}'}],
     *
     * Or with just a ftype:
     *
     *     features: ['grouping', 'groupingsummary'],
     *
     * See {@link Ext.enums.Feature} for list of all ftypes.
     */

    /**
     * @cfg {Boolean} [hideHeaders=false]
     * True to hide column headers.
     */

    /**
     * @cfg {Boolean} [deferRowRender=false]
     * Configure as `true` to enable deferred row rendering.
     *
     * This allows the View to execute a refresh quickly, with the update of the row structure deferred so
     * that layouts with GridPanels appear, and lay out more quickly.
     */
    deferRowRender: false,
     
    /**
     * @cfg {Boolean} [sortableColumns=true]
     * False to disable column sorting via clicking the header and via the Sorting menu items.
     */
    sortableColumns: true,

    /**
     * @cfg {Boolean} [multiColumnSort=false]
     * Configure as `true` to have columns remember their sorted state after other columns have been clicked upon to sort.
     *
     * As subsequent columns are clicked upon, they become the new primary sort key.
     *
     * The maximum number of sorters allowed in a Store is configurable via its underlying data collection. See {@link Ext.util.Collection#multiSortLimit}
     */
    multiColumnSort: false,

    /**
     * @cfg {Boolean} [enableLocking=false]
     * Configure as `true` to enable locking support for this grid. Alternatively, locking will also be automatically
     * enabled if any of the columns in the {@link #columns columns} configuration contain a {@link Ext.grid.column.Column#locked locked} config option.
     * 
     * A locking grid is processed in a special way. The configuration options are cloned and *two* grids are created to be the locked (left) side
     * and the normal (right) side. This Panel becomes merely a {@link Ext.container.Container container} which arranges both in an {@link Ext.layout.container.HBox HBox} layout.
     * 
     * {@link #plugins Plugins} may be targeted at either locked, or unlocked grid, or, both, in which case the plugin is cloned and used on both sides.
     * 
     * Plugins may also be targeted at the containing locking Panel.
     * 
     * This is configured by specifying a `lockableScope` property in your plugin which may have the following values:
     * 
     *  * `"both"` (the default) - The plugin is added to both grids
     *  * `"top"` - The plugin is added to the containing Panel
     *  * `"locked"` - The plugin is added to the locked (left) grid
     *  * `"normal"` - The plugin is added to the normal (right) grid
     *
     * If `both` is specified, then each copy of the plugin gains a property `lockingPartner` which references its sibling on the other side so that they
     * can synchronize operations is necessary.
     * 
     * {@link #features Features} may also be configured with `lockableScope` and may target the locked grid, the normal grid or both grids. Features
     * also get a `lockingPartner` reference injected.
     */
    enableLocking: false,

    // private property used to determine where to go down to find views
    // this is here to support locking.
    scrollerOwner: true,

    /**
     * @cfg {Boolean} [enableColumnMove=true]
     * False to disable column dragging within this grid.
     */
    enableColumnMove: true,
    
    /**
     * @cfg {Boolean} [sealedColumns=false]
     * True to constrain column dragging so that a column cannot be dragged in or out of it's
     * current group. Only relevant while {@link #enableColumnMove} is enabled.
     */
    sealedColumns: false,

    /**
     * @cfg {Boolean} [enableColumnResize=true]
     * False to disable column resizing within this grid.
     */
    enableColumnResize: true,

    /**
     * @cfg {Boolean} [enableColumnHide=true]
     * False to disable column hiding within this grid.
     */

    /**
     * @cfg {Boolean} columnLines Adds column line styling
     */

    /**
     * @cfg {Boolean} [rowLines=true] Adds row line styling
     */
    rowLines: true,

    /**
     * @cfg {Boolean} [disableSelection=false]
     * True to disable selection model.
     */

    /**
     * @cfg {String} emptyText Default text (HTML tags are accepted) to display in the 
     * Panel body when the Store is empty. When specified, and the Store is empty, the 
     * text will be rendered inside a DIV with the CSS class "x-grid-empty". The emptyText 
     * will not display until the first load of the associated store by default. If you 
     * want the text to be displayed prior to the first store load use the 
     * {@link Ext.view.Table#deferEmptyText deferEmptyText} config in the {@link #viewConfig} config.
     */
    
    /**
     * @cfg {Boolean} [allowDeselect=false]
     * True to allow deselecting a record. This config is forwarded to {@link Ext.selection.Model#allowDeselect}.
     */
    
    /**
     * @cfg {Boolean} [bufferedRenderer=true]
     * Buffered rendering is enabled by default.
     * 
     * Configure as `false` to disable buffered rendering. See {@link Ext.grid.plugin.BufferedRenderer}.
     *
     * @since 5.0.0
     */
    bufferedRenderer: true,

    /**
     * @property {Boolean} optimizedColumnMove
     * If you are writing a grid plugin or a {Ext.grid.feature.Feature Feature} which creates a column-based structure which
     * needs a view refresh when columns are moved, then set this property in the grid.
     *
     * An example is the built in {@link Ext.grid.feature.AbstractSummary Summary} Feature. This creates summary rows, and the
     * summary columns must be in the same order as the data columns. This plugin sets the `optimizedColumnMove` to `false.
     */

    /**
     * @property {Ext.panel.Table} ownerGrid
     * A reference to the top-level owning grid component.
     * 
     * This is a reference to this GridPanel if this GridPanel is not part of a locked grid arrangement.
     * @readonly
     * @private
     * @since 5.0.0
     */
    ownerGrid: null,

    colLinesCls: Ext.baseCSSPrefix + 'grid-with-col-lines',
    rowLinesCls: Ext.baseCSSPrefix + 'grid-with-row-lines',
    noRowLinesCls: Ext.baseCSSPrefix + 'grid-no-row-lines',
    hiddenHeaderCtCls: Ext.baseCSSPrefix + 'grid-header-ct-hidden',
    hiddenHeaderCls: Ext.baseCSSPrefix + 'grid-header-hidden',
    resizeMarkerCls: Ext.baseCSSPrefix + 'grid-resize-marker',
    emptyCls: Ext.baseCSSPrefix + 'grid-empty',

    // The TablePanel claims to be focusable, but it does not place a tabIndex
    // on any of its elements.
    // Its focus implementation delegates to its view. TableViews are focusable.
    focusable: true,

    /**
     * @event viewready
     * Fires when the grid view is available (use this for selecting a default row).
     * @param {Ext.panel.Table} this
     */

    constructor: function (config) {
        var me = this,
            store;

        me.ownerGrid = (config && config.ownerGrid) || me;

        me.callParent([config]);

        store = this.store;

        // Any further changes become stateful.
        store.trackStateChanges = true;

        if (me.autoLoad) {
            store.unblockLoad();
            store.load();
        }
    },

    initComponent: function() {
        //<debug>
        if (this.verticalScroller) {
            Ext.Error.raise("The verticalScroller config is not supported.");
        }
        if (!this.viewType) {
            Ext.Error.raise("You must specify a viewType config.");
        }
        if (this.headers) {
            Ext.Error.raise("The headers config is not supported. Please specify columns instead.");
        }
        //</debug>

        var me = this,
            headerCtCfg = me.columns || me.colModel || [],
            view,
            i, len,
            bufferedRenderer,
            // Look up the configured Store. If none configured, use the fieldless, empty Store defined in Ext.data.Store.
            store       = me.store = Ext.data.StoreManager.lookup(me.store || 'ext-empty-store'),
            columns, viewScroller;

        me.enableLocking = me.enableLocking || me.hasLockedColumns(headerCtCfg);

        // Block store loads during construction or initialization of plugins!
        if (me.autoLoad) {
            me.store.blockLoad();
        }

        // Construct the plugins now rather than in the constructor of AbstractComponent because the component may have a subclass
        // that has overridden initComponent and defined plugins in it. For plugins like RowExpander that rely upon a grid feature,
        // this is a problem because the view needs to know about all its features before it's constructed. Constructing the plugins
        // now ensures that plugins defined in the instance config or in initComponent are all constructed before the view.
        // See EXTJSIV-11927.
        //
        // Note that any components that do not inherit from this class will still have their plugins constructed in
        // AbstractComponent:initComponent.
        if (me.plugins) {
            me.plugins = me.constructPlugins();
        }

        // Add the row/column line classes to the body element so that the settings are not inherited by docked grids (https://sencha.jira.com/browse/EXTJSIV-9263).
        if (me.columnLines) {
            me.addBodyCls(me.colLinesCls);
        }

        me.addBodyCls(me.rowLines ? me.rowLinesCls : me.noRowLinesCls);
        me.addBodyCls(me.extraBodyCls);


        // If any of the Column objects contain a locked property, and are not processed, this is a lockable TablePanel, a
        // special view will be injected by the Ext.grid.locking.Lockable mixin, so no processing of .
        if (me.enableLocking) {
            me.self.mixin('lockable', Ext.grid.locking.Lockable);
            me.injectLockable();
        }
        // Not lockable - create the HeaderContainer
        else {
            // It's a fully instantiated HeaderContainer
            if (headerCtCfg.isRootHeader) {
                if (me.hideHeaders) {
                    headerCtCfg.setHeight(0);
                    // don't set the hidden property, we still need these to layout
                    headerCtCfg.hiddenHeaders = true;
                }

                me.headerCt = headerCtCfg;

                me.headerCt.grid = me;
                me.headerCt.forceFit = !!me.forceFit;

                // If it's an instance then the column managers were already created and bound to the headerCt.
                me.columnManager = headerCtCfg.columnManager;
                me.visibleColumnManager = headerCtCfg.visibleColumnManager;
            }
            // It's an array of Column definitions, or a config object of a HeaderContainer
            else {
                if (Ext.isArray(headerCtCfg)) {
                    headerCtCfg = {
                        items: headerCtCfg
                    };
                }
                Ext.apply(headerCtCfg, {
                    grid: me,
                    forceFit: me.forceFit,
                    sortable: me.sortableColumns,
                    enableColumnMove: me.enableColumnMove,
                    enableColumnResize: me.enableColumnResize,
                    columnLines: me.columnLines,
                    sealed: me.sealedColumns
                });
                if (me.hideHeaders) {
                    headerCtCfg.height = 0;
                    // don't set the hidden property, we still need these to layout
                    headerCtCfg.hiddenHeaders = true;
                }

                if (Ext.isDefined(me.enableColumnHide)) {
                    headerCtCfg.enableColumnHide = me.enableColumnHide;
                }
                me.headerCt = new Ext.grid.header.Container(headerCtCfg);
            }

            // the header container is not user scrollable, but it has a scroller instance
            // so that we can sync its scroll position with that of the grid view
            me.headerCt.setScrollable({
                x: false,
                y: false
            });
        }

        // Maintain backward compatibiliy by providing the initial leaf column set as a property.
        me.columns = columns = me.headerCt.getGridColumns();

        me.scrollTask = new Ext.util.DelayedTask(me.syncHorizontalScroll, me);

        me.cls = (me.cls || '') + (' ' + me.extraBaseCls);

        // autoScroll is not a valid configuration
        delete me.autoScroll;

        bufferedRenderer = me.plugins && Ext.Array.findBy(me.plugins, function(p) {
            return p.isBufferedRenderer;
        });

        // If we find one in the plugins, just use that.
        if (bufferedRenderer) {
            me.bufferedRenderer = bufferedRenderer;
        }

        // If this TablePanel is lockable (Either configured lockable, or any of the defined columns has a 'locked' property)
        // then a special lockable view containing 2 side-by-side grids will have been injected so we do not need to set up any UI.
        if (!me.hasView) {

            // If the Store is paging blocks of the dataset in, then it can only be sorted remotely.
            if (store.isBufferedStore && !store.getRemoteSort()) {
                for (i = 0, len = columns.length; i < len; i++) {
                    columns[i].sortable = false;
                }
            }

            if (me.hideHeaders) {
                me.headerCt.addCls(me.hiddenHeaderCtCls);
                me.addCls(me.hiddenHeaderCls);
            }

            me.relayHeaderCtEvents(me.headerCt);
            me.features = me.features || [];
            if (!Ext.isArray(me.features)) {
                me.features = [me.features];
            }
            me.dockedItems = [].concat(me.dockedItems || []);
            me.dockedItems.unshift(me.headerCt);
            me.viewConfig = me.viewConfig || {};

            // AbstractDataView will look up a Store configured as an object
            // getView converts viewConfig into a View instance
            view = me.getView();

            me.items = [view];
            me.hasView = true;

            // Add a listener to synchronize the horizontal scroll position of the headers
            // with the table view's element... Unless we are not showing headers!
            if (!me.hideHeaders) {
                // sync the horizontal scroll position of the headerCt as the view is scrolled.
                viewScroller = view.getScrollable();
                if (viewScroller) {
                    me.headerCt.getScrollable().addPartner(viewScroller, 'x');
                }
            }

            // Attach this Panel to the Store
            me.bindStore(store, true);

            me.mon(view, {
                viewready: me.onViewReady,
                refresh: me.onRestoreHorzScroll,
                scope: me
            });
        }

        // Whatever kind of View we have, be it a TableView, or a LockingView, we are interested in the selection model
        me.selModel = me.view.getSelectionModel();
        if (me.selModel.isRowModel) {
            me.selModel.on({
                scope: me,
                lastselectedchanged: me.updateBindSelection,
                selectionchange: me.updateBindSelection
            });
        }

        // Relay events from the View whether it be a LockingView, or a regular GridView
        me.relayEvents(me.view, [
            /**
             * @event beforeitemmousedown
             * @inheritdoc Ext.view.View#beforeitemmousedown
             */
            'beforeitemmousedown',
            /**
             * @event beforeitemmouseup
             * @inheritdoc Ext.view.View#beforeitemmouseup
             */
            'beforeitemmouseup',
            /**
             * @event beforeitemmouseenter
             * @inheritdoc Ext.view.View#beforeitemmouseenter
             */
            'beforeitemmouseenter',
            /**
             * @event beforeitemmouseleave
             * @inheritdoc Ext.view.View#beforeitemmouseleave
             */
            'beforeitemmouseleave',
            /**
             * @event beforeitemclick
             * @inheritdoc Ext.view.View#beforeitemclick
             */
            'beforeitemclick',
            /**
             * @event beforeitemdblclick
             * @inheritdoc Ext.view.View#beforeitemdblclick
             */
            'beforeitemdblclick',
            /**
             * @event beforeitemcontextmenu
             * @inheritdoc Ext.view.View#beforeitemcontextmenu
             */
            'beforeitemcontextmenu',
            /**
             * @event itemmousedown
             * @inheritdoc Ext.view.View#itemmousedown
             */
            'itemmousedown',
            /**
             * @event itemmouseup
             * @inheritdoc Ext.view.View#itemmouseup
             */
            'itemmouseup',
            /**
             * @event itemmouseenter
             * @inheritdoc Ext.view.View#itemmouseenter
             */
            'itemmouseenter',
            /**
             * @event itemmouseleave
             * @inheritdoc Ext.view.View#itemmouseleave
             */
            'itemmouseleave',
            /**
             * @event itemclick
             * @inheritdoc Ext.view.View#itemclick
             */
            'itemclick',
            /**
             * @event itemdblclick
             * @inheritdoc Ext.view.View#itemdblclick
             */
            'itemdblclick',
            /**
             * @event itemcontextmenu
             * @inheritdoc Ext.view.View#itemcontextmenu
             */
            'itemcontextmenu',
            /**
             * @event beforecellclick
             * @inheritdoc Ext.view.Table#beforecellclick
             */
            'beforecellclick',
            /**
             * @event cellclick
             * @inheritdoc Ext.view.Table#cellclick
             */
            'cellclick',
            /**
             * @event beforecelldblclick
             * @inheritdoc Ext.view.Table#beforecelldblclick
             */
            'beforecelldblclick',
            /**
             * @event celldblclick
             * @inheritdoc Ext.view.Table#celldblclick
             */
            'celldblclick',
            /**
             * @event beforecellcontextmenu
             * @inheritdoc Ext.view.Table#beforecellcontextmenu
             */
            'beforecellcontextmenu',
            /**
             * @event cellcontextmenu
             * @inheritdoc Ext.view.Table#cellcontextmenu
             */
            'cellcontextmenu',
            /**
             * @event beforecellmousedown
             * @inheritdoc Ext.view.Table#beforecellmousedown
             */
            'beforecellmousedown',
            /**
             * @event cellmousedown
             * @inheritdoc Ext.view.Table#cellmousedown
             */
            'cellmousedown',
            /**
             * @event beforecellmouseup
             * @inheritdoc Ext.view.Table#beforecellmouseup
             */
            'beforecellmouseup',
            /**
             * @event cellmouseup
             * @inheritdoc Ext.view.Table#cellmouseup
             */
            'cellmouseup',
            /**
             * @event beforecellkeydown
             * @inheritdoc Ext.view.Table#beforecellkeydown
             */
            'beforecellkeydown',
            /**
             * @event cellkeydown
             * @inheritdoc Ext.view.Table#cellkeydown
             */
            'cellkeydown',
            /**
             * @event rowclick
             * @inheritdoc Ext.view.Table#rowclick
             */
            'rowclick',
            /**
             * @event rowdblclick
             * @inheritdoc Ext.view.Table#rowdblclick
             */
            'rowdblclick',
            /**
             * @event rowcontextmenu
             * @inheritdoc Ext.view.Table#rowcontextmenu
             */
            'rowcontextmenu',
            /**
             * @event rowmousedown
             * @inheritdoc Ext.view.Table#rowmousedown
             */
            'rowmousedown',
            /**
             * @event rowmouseup
             * @inheritdoc Ext.view.Table#rowmouseup
             */
            'rowmouseup',
            /**
             * @event rowkeydown
             * @inheritdoc Ext.view.Table#rowkeydown
             */
            'rowkeydown',
            /**
             * @event beforeitemkeydown
             * @inheritdoc Ext.view.Table#beforeitemkeydown
             */
            'beforeitemkeydown',
            /**
             * @event itemkeydown
             * @inheritdoc Ext.view.Table#itemkeydown
             */
            'itemkeydown',
            /**
             * @event beforeitemkeyup
             * @inheritdoc Ext.view.Table#beforeitemkeyup
             */
            'beforeitemkeyup',
            /**
             * @event itemkeyup
             * @inheritdoc Ext.view.Table#itemkeyup
             */
            'itemkeyup',
            /**
             * @event beforeitemkeypress
             * @inheritdoc Ext.view.Table#beforeitemkeypress
             */
            'beforeitemkeypress',
            /**
             * @event itemkeypress
             * @inheritdoc Ext.view.Table#itemkeypress
             */
            'itemkeypress',
            /**
             * @event beforecontainermousedown
             * @inheritdoc Ext.view.View#beforecontainermousedown
             */
            'beforecontainermousedown',
            /**
             * @event beforecontainermouseup
             * @inheritdoc Ext.view.View#beforecontainermouseup
             */
            'beforecontainermouseup',
            /**
             * @event beforecontainermouseover
             * @inheritdoc Ext.view.View#beforecontainermouseover
             */
            'beforecontainermouseover',
            /**
             * @event beforecontainermouseout
             * @inheritdoc Ext.view.View#beforecontainermouseout
             */
            'beforecontainermouseout',
            /**
             * @event beforecontainerclick
             * @inheritdoc Ext.view.View#beforecontainerclick
             */
            'beforecontainerclick',
            /**
             * @event beforecontainerdblclick
             * @inheritdoc Ext.view.View#beforecontainerdblclick
             */
            'beforecontainerdblclick',
            /**
             * @event beforecontainercontextmenu
             * @inheritdoc Ext.view.View#beforecontainercontextmenu
             */
            'beforecontainercontextmenu',
            /**
             * @event beforecontainerkeydown
             * @inheritdoc Ext.view.View#beforecontainerkeydown
             */
            'beforecontainerkeydown',
            /**
             * @event beforecontainerkeyup
             * @inheritdoc Ext.view.View#beforecontainerkeyup
             */
            'beforecontainerkeyup',
            /**
             * @event beforecontainerkeypress
             * @inheritdoc Ext.view.View#beforecontainerkeypress
             */
            'beforecontainerkeypress',
            /**
             * @event containermouseup
             * @inheritdoc Ext.view.View#containermouseup
             */
            'containermouseup',
            /**
             * @event containermousedown
             * @inheritdoc Ext.view.View#containermousedown
             */
            'containermousedown',
            /**
             * @event containermouseover
             * @inheritdoc Ext.view.View#containermouseover
             */
            'containermouseover',
            /**
             * @event containermouseout
             * @inheritdoc Ext.view.View#containermouseout
             */
            'containermouseout',
            /**
             * @event containerclick
             * @inheritdoc Ext.view.View#containerclick
             */
            'containerclick',
            /**
             * @event containerdblclick
             * @inheritdoc Ext.view.View#containerdblclick
             */
            'containerdblclick',
            /**
             * @event containercontextmenu
             * @inheritdoc Ext.view.View#containercontextmenu
             */
            'containercontextmenu',
            /**
             * @event containerkeydown
             * @inheritdoc Ext.view.View#containerkeydown
             */
            'containerkeydown',
            /**
             * @event containerkeyup
             * @inheritdoc Ext.view.View#containerkeyup
             */
            'containerkeyup',
            /**
             * @event containerkeypress
             * @inheritdoc Ext.view.View#containerkeypress
             */
            'containerkeypress',
            /**
             * @event selectionchange
             * @inheritdoc Ext.selection.Model#selectionchange
             */
            'selectionchange',
            /**
             * @event beforeselect
             * @inheritdoc Ext.selection.RowModel#beforeselect
             */
            'beforeselect',
            /**
             * @event select
             * @inheritdoc Ext.selection.RowModel#select
             */
            'select',
            /**
             * @event beforedeselect
             * @inheritdoc Ext.selection.RowModel#beforedeselect
             */
            'beforedeselect',
            /**
             * @event deselect
             * @inheritdoc Ext.selection.RowModel#deselect
             */
            'deselect'
        ]);

        me.callParent(arguments);
        me.addStateEvents(['columnresize', 'columnmove', 'columnhide', 'columnshow', 'sortchange', 'filterchange', 'groupchange']);
    },

    beforeRender: function() {
        var me = this,
            bufferedRenderer = me.bufferedRenderer;

        // Don't create a buffered renderer for a locked grid.
        if (!me.lockable) {
            // If we're auto heighting, we can't buffered render, so don't create it
            if (bufferedRenderer && me.getSizeModel().height.auto) {
                //<debug>
                if (bufferedRenderer.isBufferedRenderer) {
                    Ext.Error.raise('Cannot use buffered rendering with auto height');
                }
                //</debug>
                me.bufferedRenderer = bufferedRenderer = false;
            }
        
            if (bufferedRenderer && !bufferedRenderer.isBufferedRenderer) {
                // Create a BufferedRenderer as a plugin if we have not already configured with one.
                bufferedRenderer = {
                    xclass: 'Ext.grid.plugin.BufferedRenderer'
                };
                Ext.copyTo(bufferedRenderer, me, 'variableRowHeight,numFromEdge,trailingBufferZone,leadingBufferZone,scrollToLoadBuffer');
                me.bufferedRenderer = me.addPlugin(bufferedRenderer);
            }
        }
        me.callParent(arguments);
    },

    /**
     * Gets the {@link Ext.grid.header.Container headercontainer} for this grid / tree.
     * @return {Ext.grid.header.Container} headercontainer
     *
     * **Note:** While a locked grid / tree will return an instance of
     * {@link Ext.grid.locking.HeaderContainer} you will code to the
     * {@link Ext.grid.header.Container} API.
     */
    getHeaderContainer: function () {
        return this.getView().getHeaderCt();
    },

    /**
     * @inheritdoc Ext.grid.header.Container#getGridColumns
     */
    getColumns: function () {
        return this.getHeaderContainer().getGridColumns();
    },

    /**
     * @inheritdoc Ext.grid.header.Container#getVisibleGridColumns
     */
    getVisibleColumns: function () {
        return this.getHeaderContainer().getVisibleGridColumns();
    },

    focus: function() {
        // TablePanel is not focusable, but allow a call to delegate into the view
        this.getView().focus();
    },
    
    /**
     * Disables interaction with, and masks this grid's column headers.
     */
    disableColumnHeaders: function() {
        this.headerCt.disable();
    },

    /**
     * Enables interaction with, and unmasks this grid's column headers after a call to {#disableColumnHeaders}.
     */
    enableColumnHeaders: function() {
        this.headerCt.enable();
    },

    /*
     * @private
     * Determine if there are any columns with a locked configuration option.
     */
    hasLockedColumns: function(columns) {
        var i,
            len,
            column;

        // Fully instantiated HeaderContainer
        if (columns.isRootHeader) {
            columns = columns.items.items;
        }
        // Config object with items
        else if (Ext.isObject(columns)) {
            columns = columns.items;
        }
        for (i = 0, len = columns.length; i < len; i++) {
            column = columns[i];
            if (!column.processed && column.locked) {
                return true;
            }
        }
    },

    relayHeaderCtEvents: function (headerCt) {
        this.relayEvents(headerCt, [
            /**
             * @event columnresize
             * @inheritdoc Ext.grid.header.Container#columnresize
             */
            'columnresize',
            /**
             * @event columnmove
             * @inheritdoc Ext.grid.header.Container#columnmove
             */
            'columnmove',
            /**
             * @event columnhide
             * @inheritdoc Ext.grid.header.Container#columnhide
             */
            'columnhide',
            /**
             * @event columnshow
             * @inheritdoc Ext.grid.header.Container#columnshow
             */
            'columnshow',
            /**
             * @event columnschanged
             * @inheritdoc Ext.grid.header.Container#columnschanged
             */
            'columnschanged',
            /**
             * @event sortchange
             * @inheritdoc Ext.grid.header.Container#sortchange
             */
            'sortchange',
            /**
             * @event headerclick
             * @inheritdoc Ext.grid.header.Container#headerclick
             */
            'headerclick',
            /**
             * @event headercontextmenu
             * @inheritdoc Ext.grid.header.Container#headercontextmenu
             */
            'headercontextmenu',
            /**
             * @event headertriggerclick
             * @inheritdoc Ext.grid.header.Container#headertriggerclick
             */
            'headertriggerclick'
        ]);
    },

    getState: function(){
        var me = this,
            state = me.callParent(),
            storeState = me.store.getState();

        state = me.addPropertyToState(state, 'columns', me.headerCt.getColumnsState());

        if (storeState) {
            state.storeState = storeState;
        }
        return state;
    },

    applyState: function (state) {
        var me = this,
            sorter = state.sort,
            storeState = state.storeState,
            store = me.store,
            columns = state.columns;

        delete state.columns;

        // Ensure superclass has applied *its* state.
        // Component saves dimensions (and anchor/flex) plus collapsed state.
        me.callParent(arguments);

        if (columns) {
            me.headerCt.applyColumnsState(columns);
        }

        // Old stored sort state. Deprecated and will die out.
        if (sorter) {
            if (store.getRemoteSort()) {
                // Pass false to prevent a sort from occurring.
                store.sort({
                    property: sorter.property,
                    direction: sorter.direction,
                    root: sorter.root
                }, null, false);
            } else {
                store.sort(sorter.property, sorter.direction);
            }
        }
        // New storeState which encapsulates groupers, sorters and filters.
        else if (storeState) {
            store.applyState(storeState);
        }
    },

    /**
     * Returns the store associated with this Panel.
     * @return {Ext.data.Store} The store
     */
    getStore: function(){
        return this.store;
    },

    /**
     * Gets the view for this panel.
     * @return {Ext.view.Table}
     */
    getView: function() {
        var me = this,
            scroll, scrollable, viewConfig;

        if (!me.view) {
            viewConfig = me.viewConfig;
            scroll = viewConfig.scroll || me.scroll;
            scrollable = me.scrollable;

            if (scrollable == null && viewConfig.scrollable == null && scroll !== null) {
                // transform deprecated scroll config into scrollable config
                if (scroll === true || scroll === 'both') {
                    scrollable = true;
                } else if (scroll === false || scroll === 'none') {
                    scrollable = false;
                } else if (scroll === 'vertical') {
                    scrollable = {
                        x: false,
                        y: true
                    };
                } else if (scroll === 'horizontal') {
                    scrollable = {
                        x: true,
                        y: false
                    };
                }
            }

            viewConfig = Ext.apply({
                // TableView injects the view reference into this grid so that we have a reference as early as possible
                // and Features need a reference to the grid.
                // For these reasons, we configure a reference to this grid into the View
                grid: me,
                ownerGrid: me.ownerGrid,
                deferInitialRefresh: me.deferRowRender,
                variableRowHeight: me.variableRowHeight,
                preserveScrollOnRefresh: true,
                trackOver: me.trackMouseOver !== false,
                throttledUpdate: me.throttledUpdate === true,
                xtype: me.viewType,
                store: me.store,
                headerCt: me.headerCt,
                columnLines: me.columnLines,
                rowLines: me.rowLines,
                navigationModel: 'grid',
                features: me.features,
                panel: me,
                emptyText: me.emptyText || ''
            }, me.viewConfig);

            if (scrollable != null) {
                viewConfig.scrollable = scrollable;
                me.scrollable = null;
            }

            Ext.create(viewConfig);

            // Normalize the application of the markup wrapping the emptyText config.
            // `emptyText` can now be defined on the grid as well as on its viewConfig, and this led to the emptyText not
            // having the wrapping markup when it was defined in the viewConfig. It should be backwards compatible.
            // Note that in the unlikely event that emptyText is defined on both the grid config and the viewConfig that the viewConfig wins.
            if (me.view.emptyText) {
                me.view.emptyText = '<div class="' + me.emptyCls + '">' + me.view.emptyText + '</div>';
            }

            // TableView's custom component layout, Ext.view.TableLayout requires a reference to the headerCt because it depends on the headerCt doing its work.
            me.view.getComponentLayout().headerCt = me.headerCt;

            me.mon(me.view, {
                uievent: me.processEvent,
                scope: me
            });
            me.headerCt.view = me.view;

            // Plugins and features may need to access the view as soon as it is created.
            if (me.hasListeners.viewcreated) {
                me.fireEvent('viewcreated', me, me.view);
            }
        }
        return me.view;
    },

    getColumnManager: function() {
        return this.columnManager;
    },

    getVisibleColumnManager: function() {
        return this.visibleColumnManager;
    },

    getTopLevelColumnManager: function() {
        return this.ownerGrid.getColumnManager();
    },

    getTopLevelVisibleColumnManager: function() {
        return this.ownerGrid.getVisibleColumnManager();
    },

    /**
     * @private
     * autoScroll is never valid for all classes which extend TablePanel.
     */
    setAutoScroll: Ext.emptyFn,

    applyScrollable: function(scrollable) {
        if (this.view) {
            this.view.setScrollable(scrollable);
        }

        return scrollable;
    },

    getScrollable: function() {
        return null;
    },

    /**
     * @private
     * Processes UI events from the view. Propagates them to whatever internal Components need to process them.
     * @param {String} type Event type, eg 'click'
     * @param {Ext.view.Table} view TableView Component
     * @param {HTMLElement} cell Cell HTMLElement the event took place within
     * @param {Number} recordIndex Index of the associated Store Model (-1 if none)
     * @param {Number} cellIndex Cell index within the row
     * @param {Ext.event.Event} e Original event
     */
    processEvent: function(type, view, cell, recordIndex, cellIndex, e, record, row) {
        var header = e.position.column;

        if (header) {
            return header.processEvent.apply(header, arguments);
        }
    },

    /**
     * Scrolls the specified record into view.
     * @param {Number/String/Ext.data.Model} record The record, record id,  or the zero-based position in the dataset to scroll to.
     * @param {Object}          [options] An object containing options to modify the operation.
     * @param {Boolean}         [options.animate] Pass `true` to animate the row into view.
     * @param {Boolean}         [options.highlight] Pass `true` to highlight the row with a glow animation when it is in view.
     * @param {Boolean}         [options.select] Pass as `true` to select the specified row.
     * @param {Boolean}         [options.focus] Pass as `true` to focus the specified row.
     * @param {Function}        [options.callback] A function to execute when the record is in view. This may be necessary if the
     *                          first parameter is a record index and the view is backed by a {@link Ext.data.BufferedStore buffered store}
     *                          which does not contain that record.
     * @param {Boolean}         options.callback.success `true` if acquiring the record's view node was successful.
     * @param {Ext.data.Model}  options.callback.record If successful, the target record.
     * @param {HTMLElement}     options.callback.node If successful, the record's view node.
     * @param {Object}          [options.scope] The scope (`this` reference) in which the callback function is executed.
     */
    ensureVisible: function(record, options) {
        this.doEnsureVisible(record, options);
    },

    scrollByDeltaY: function(yDelta, animate) {
        this.getView().scrollBy(0, yDelta, animate);
    },

    scrollByDeltaX: function(xDelta, animate) {
        this.getView().scrollBy(xDelta, 0, animate);
    },

    afterCollapse: function() {
        this.saveScrollPos();
        this.callParent(arguments);
    },

    afterExpand: function() {
        this.callParent(arguments);
        this.restoreScrollPos();
    },

    saveScrollPos: Ext.emptyFn,

    restoreScrollPos: Ext.emptyFn,

    onHeaderResize: function() {
        var scroller = this.view.getScrollable(),
            size;

        if (scroller) {
            size = scroller.getSize();
            if (size) {
                scroller.setSize({
                    x: this.headerCt.getTableWidth(),
                    y: size.y
                });
            }
        }
    },

    // Update the view when a header moves
    onHeaderMove: function(headerCt, header, colsToMove, fromIdx, toIdx) {
        var me = this;

        // If there are Features or Plugins which create DOM which must match column order, they set the optimizedColumnMove flag to false.
        // In this case we must refresh the view on column move.
        if (me.optimizedColumnMove === false) {
            me.view.refreshView();
        }

        // Simplest case for default DOM structure is just to swap the columns round in the view.
        else {
            me.view.moveColumn(fromIdx, toIdx, colsToMove);
        }
        me.delayScroll();
    },

    // Section onHeaderHide is invoked after view.
    onHeaderHide: function(headerCt, header, complete) {
        var view = this.view;
        // The headerCt may be hiding multiple children if a leaf level column
        // causes a parent (and possibly other parents) to be hidden. Only run the refresh
        // once we're done
        if (!headerCt.childHideCount && view.refreshCounter) {
            view.refreshView();
        }
    },

    onHeaderShow: function(headerCt, header) {
        var view = this.view;
        if (view.refreshCounter) {
            view.refreshView();
        }
    },

    // To be triggered on add/remove/move for a leaf header
    onHeadersChanged: function(headerCt, header) {
        var me = this;
        if (me.rendered && !me.reconfiguring) {
            me.view.refreshView();
            me.delayScroll();
        }
    },

    delayScroll: function(){
        var target = this.view;
        if (target) {
            // Do not cause a layout by reading scrollX now.
            // It must be read from the target when the task finally executes.
            this.scrollTask.delay(10, null, null, [target]);
        }
    },

    /**
     * @private
     * Fires the TablePanel's viewready event when the view declares that its internal DOM is ready
     */
    onViewReady: function() {
         this.fireEvent('viewready', this);   
    },

    /**
     * @private
     * Tracks when things happen to the view and preserves the horizontal scroll position.
     */
    onRestoreHorzScroll: function() {
        var me = this,
            x = me.scrollXPos;

        if (x) {
            // We need to restore the body scroll position here
            me.syncHorizontalScroll(me, true);
        }
    },

    getScrollerOwner: function() {
        var rootCmp = this;
        if (!this.scrollerOwner) {
            rootCmp = this.up('[scrollerOwner]');
        }
        return rootCmp;
    },

    /**
     * Gets left hand side marker for header resizing.
     * @private
     */
    getLhsMarker: function() {
        var me = this;
        return me.lhsMarker || (me.lhsMarker = Ext.DomHelper.append(me.el, {
            role: 'presentation',
            cls: me.resizeMarkerCls
        }, true));
    },

    /**
     * Gets right hand side marker for header resizing.
     * @private
     */
    getRhsMarker: function() {
        var me = this;

        return me.rhsMarker || (me.rhsMarker = Ext.DomHelper.append(me.el, {
            role: 'presentation',
            cls: me.resizeMarkerCls
        }, true));
    },

    /**
     * Returns the grid's selection. See `{@link Ext.selection.Model#getSelection}`.
     * @inheritdoc Ext.selection.Model#getSelection
     */
    getSelection: function () {
        return this.getSelectionModel().getSelection();
    },

    updateSelection: function(selection) {
        var me = this,
            sm;

        if (!me.ignoreNextSelection) {
            me.ignoreNextSelection = true;
            sm = me.getSelectionModel();
            if (selection) {
                sm.select(selection);
            } else {
                sm.deselectAll();
            }
            me.ignoreNextSelection = false;
        }
    },

    updateBindSelection: function(selModel, selection) {
        var me = this,
            selected = null;

        if (!me.ignoreNextSelection) {
            me.ignoreNextSelection = true;
            if (selection.length) {
                selected = selModel.getLastSelected();
                me.hasHadSelection = true;
            }
            if (me.hasHadSelection) {
                me.setSelection(selected);
            }
            me.ignoreNextSelection = false;
        }
    },

    getNavigationModel: function() {
        return this.getView().getNavigationModel();
    },

    /**
     * Returns the selection model being used by this grid's {@link Ext.view.Table view}.
     * @return {Ext.selection.Model} The selection model being used by this grid's {@link Ext.view.Table view}.
     */
    getSelectionModel: function() {
        return this.getView().getSelectionModel();
    },

    getScrollTarget: function(){
        var items = this.getScrollerOwner().query('tableview');

        // Last view has the scroller
        return items[items.length - 1];
    },

    syncHorizontalScroll: function(target, setBody) {
        var me = this,
            x = me.view.getScrollX(),
            scrollTarget;

        setBody = setBody === true;
        // Only set the horizontal scroll if we've changed position,
        // so that we don't set this on vertical scrolls
        if (me.rendered && (setBody || x !== me.scrollXPos)) {
            // Only set the body position if we're reacting to a refresh, otherwise
            // we just need to set the header.
            if (setBody) {   
                scrollTarget = me.getScrollTarget();
                scrollTarget.setScrollX(x);
            }
            me.headerCt.setScrollX(x);
            me.scrollXPos = x;
        }
    },

    // template method meant to be overriden
    onStoreLoad: Ext.emptyFn,

    getEditorParent: function() {
        return this.body;
    },

    bindStore: function(store, initial) {
        var me = this,
            view = me.getView();

        // Normally, this method will always be called with a valid store (because there is a symmetric
        // .unbindStore method), but there are cases where this method will be called and passed a null
        // value, i.e., a panel is used as a pickerfield. See EXTJS-13089.
        if (store) {
            // Bind to store immediately because subsequent processing looks for grid's store property
            me.store = store;

            if (view.store !== store) {
                // If coming from a reconfigure, we need to set the actual store property on the view. Setting the
                // store will then also set the dataSource.
                //
                // Note that if it's a grid feature then this is sorted out in view.bindStore(), and it's own
                // implementation of .bindStore() will be called.
                view.bindStore(store, false);

            }

            me.mon(store, {
                load: me.onStoreLoad,
                scope: me
            });
            me.storeRelayers = me.relayEvents(store, [
                /**
                 * @event filterchange
                 * @inheritdoc Ext.data.Store#filterchange
                 */
                'filterchange',
                /**
                 * @event groupchange
                 * @inheritdoc Ext.data.Store#groupchange
                 */
                'groupchange'
            ]);
        } else {
            me.unbindStore();
        }
    },

    unbindStore: function() {
        var me = this,
            store = me.store,
            view;

        if (store) {
            me.store = null;

            me.mun(store, {
                load: me.onStoreLoad,
                scope: me
            });

            Ext.destroy(me.storeRelayers);

            view = me.view;
            if (view.store) {
                view.bindStore(null);
            }
        }
    },

    setColumns: function(columns) {
        // If being reconfigured from zero columns to zero columns, skip operation.
        // This can happen if columns are being set from a binding and the initial value
        // of the bound data in the ViewModel is []
        if (columns.length || this.getColumnManager().getColumns().length) {
            this.reconfigure(undefined, columns);
        }
    },

    /**
     * A convenience method that fires {@link #reconfigure} with the store param.  To set the store AND change columns,
     * use the {@link #reconfigure reconfigure method}.
     *
     * @param {Ext.data.Store} [store] The new store.
     */
    setStore: function (store) {
        this.reconfigure(store);
    },

    /**
     * Reconfigures the grid or tree with a new store and/or columns. Stores and columns 
     * may also be passed as params.
     *
     *     grid.reconfigure(store, columns);
     *
     * Additionally, you can pass just a store or columns.
     *
     *     tree.reconfigure(store);
     *     // or
     *     grid.reconfigure(columns);
     *     // or
     *     tree.reconfigure(null, columns);
     *
     * If you're using locked columns, the {@link #enableLocking} config should be set 
     * to `true` before the reconfigure method is executed.
     *
     * @param {Ext.data.Store/Object} [store] The new store instance or store config. You can 
     * pass `null` if no new store.
     * @param {Object[]} [columns] An array of column configs
     */
    reconfigure: function(store, columns) {
        var me = this,
            oldStore = me.store,
            headerCt = me.headerCt,
            lockable = me.lockable,
            oldColumns = headerCt ? headerCt.items.getRange() : me.columns,
            view = me.getView(),
            block, refreshCounter;

        // Allow optional store argument to be fully omitted, and the columns argument to be solo
        if (arguments.length === 1 && Ext.isArray(store)) {
            columns = store;
            store = null;
        }

        // Make copy in case the beforereconfigure listener mutates it.
        if (columns) {
            columns = Ext.Array.slice(columns);
        }

        me.reconfiguring = true;
        if (store) {
            store = Ext.StoreManager.lookup(store);
        }
        me.fireEvent('beforereconfigure', me, store, columns, oldStore, oldColumns);

        Ext.suspendLayouts();

        if (lockable) {
            me.reconfigureLockable(store, columns);
        } else {
            // Prevent the view from refreshing until we have resumed layouts and any columns are rendered
            block = view.blockRefresh;
            view.blockRefresh = true;

            // The following test compares the result of an assignment of the store var with the oldStore var.
            // This saves a large amount of code.
            //
            // Note that we need to process the store first in case one or more passed columns (if there are any)
            // have active gridfilters with values which would filter the currently-bound store.
            if (store && store !== oldStore) {
                me.unbindStore();
                me.bindStore(store);
            }

            if (columns) {
                // new columns, delete scroll pos
                delete me.scrollXPos;
                headerCt.removeAll();
                headerCt.add(columns);
            }

            view.blockRefresh = block;
            refreshCounter = view.refreshCounter;
        }

        Ext.resumeLayouts(true);
        if (lockable) {
            me.afterReconfigureLockable();
        } else if (view.refreshCounter === refreshCounter) {
            // If the layout resumption didn't trigger the view to refresh, do it here
            view.refreshView();
        }

        me.fireEvent('reconfigure', me, store, columns, oldStore, oldColumns);
        delete me.reconfiguring;
    },

    beforeDestroy: function(){
        var me = this,
            task = me.scrollTask;
            
        if (task) {
            task.cancel();
            me.scrollTask = null;
        }
        Ext.destroy(me.focusEnterLeaveListeners);
        me.callParent();
    },

    onDestroy: function(){
        var me = this;
        if (me.lockable) {
            me.destroyLockable();
        }
        me.unbindStore();
        me.callParent();
        me.columns = me.storeRelayers = me.columnManager = me.visibleColumnManager = null;
    },
    
    destroy: function() {
        // Clear out references here because other things (plugins/features) may need to know about them during destruction
        var me = this;
        me.callParent();
        if (me.isDestroyed) {
            me.view = me.selModel = me.headerCt = null;
        }
    },

    privates: {
        // The focusable flag is set, but there is no focusable element.
        // Focus is delegated to the view by the focus implementation.
        initFocusableElement: function() {},

        doEnsureVisible: function(record, options) {
            // Handle the case where this is a lockable assembly
            if (this.lockable) {
                return this.ensureLockedVisible(record, options);
            }

            // Allow them to pass the record id.
            if (typeof record !== 'number' && !record.isEntity) {
                record = this.store.getById(record);
            }
            var me = this,
                callback,
                scope,
                animate,
                highlight,
                select,
                doFocus,
                view = me.getView(),
                domNode = view.getNode(record);

            if (!me.rendered || !view.refreshCounter) {
                return;
            }

            if (options) {
                callback = options.callback;
                scope = options.scope;
                animate = options.animate;
                highlight = options.highlight;
                select = options.select;
                doFocus = options.focus;
            }

            // We found the DOM node associated with the record
            if (domNode) {
                view.getScrollable().scrollIntoView(domNode, null, animate, highlight);
                if (!record.isEntity) {
                    record = view.getRecord(domNode);
                }
                if (select) {
                    view.getSelectionModel().select(record);
                }
                if (doFocus) {
                    view.getNavigationModel().setPosition(record, 0);
                }
                Ext.callback(callback, scope || me, [true, record, domNode]);
            }
            // If we didn't find it, it's probably because of buffered rendering
            else if (view.bufferedRenderer) {
                view.bufferedRenderer.scrollTo(record, {
                    animate: animate,
                    highlight: highlight,
                    select: select,
                    focus: doFocus,
                    callback: function(recordIdx, record, domNode) {
                        Ext.callback(callback, scope || me, [true, record, domNode]);
                    }
                });
            } else {
                Ext.callback(callback, scope || me, [false, null]);
            }
        },
        
        getFocusEl: function() {
            return this.getView().getFocusEl();
        }
    }
});
