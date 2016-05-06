/**
 * This feature allows to display the grid rows aggregated into groups as specified by the {@link Ext.data.Store#grouper grouper}
 *
 * underneath. The groups can also be expanded and collapsed.
 *
 * ## Extra Events
 *
 * This feature adds several extra events that will be fired on the grid to interact with the groups:
 *
 *  - {@link #groupclick}
 *  - {@link #groupdblclick}
 *  - {@link #groupcontextmenu}
 *  - {@link #groupexpand}
 *  - {@link #groupcollapse}
 *
 * ## Menu Augmentation
 *
 * This feature adds extra options to the grid column menu to provide the user with functionality to modify the grouping.
 * This can be disabled by setting the {@link #enableGroupingMenu} option. The option to disallow grouping from being turned off
 * by the user is {@link #enableNoGroups}.
 *
 * ## Controlling Group Text
 *
 * The {@link #groupHeaderTpl} is used to control the rendered title for each group. It can modified to customized
 * the default display.
 *
 * ## Groupers
 *
 * By default, this feature expects that the data field that is mapped to by the {@link groupField} config is a simple data type
 * such as a String or a Boolean. However, if you intend to group by a data field that is a complex data type such as an Object
 * or Array, it is necessary to define one or more {@link groupers} on the feature that it can then use to lookup internal group
 * information when grouping by different fields.
 *
 *     @example
 *     var feature = Ext.create('Ext.grid.feature.Grouping', {
 *         startCollapsed: true,
 *         groupers: [{
 *             property: 'asset',
 *             groupFn: function (val) {
 *                 return val.data.name;
 *             }
 *         }]
 *     });
 *
 * ## Example Usage
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields: ['name', 'seniority', 'department'],
 *         groupField: 'department',
 *         data: [
 *             { name: 'Michael Scott', seniority: 7, department: 'Management' },
 *             { name: 'Dwight Schrute', seniority: 2, department: 'Sales' },
 *             { name: 'Jim Halpert', seniority: 3, department: 'Sales' },
 *             { name: 'Kevin Malone', seniority: 4, department: 'Accounting' },
 *             { name: 'Angela Martin', seniority: 5, department: 'Accounting' }
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Employees',
 *         store: store,
 *         columns: [
 *             { text: 'Name', dataIndex: 'name' },
 *             { text: 'Seniority', dataIndex: 'seniority' }
 *         ],
 *         features: [{ftype:'grouping'}],
 *         width: 200,
 *         height: 275,
 *         renderTo: Ext.getBody()
 *     });
 *
 * **Note:** To use grouping with a grid that has {@link Ext.grid.column.Column#locked locked columns}, you need to supply
 * the grouping feature as a config object - so the grid can create two instances of the grouping feature.
 */
Ext.define('Ext.grid.feature.Grouping', {
    extend: 'Ext.grid.feature.Feature',
    mixins: {
        summary: 'Ext.grid.feature.AbstractSummary'
    },
    requires: ['Ext.grid.feature.GroupStore'],

    alias: 'feature.grouping',

    eventPrefix: 'group',
    eventSelector: '.' + Ext.baseCSSPrefix + 'grid-group-hd',

    refreshData: {},
    wrapsItem: true,

    /**
     * @event groupclick
     * @param {Ext.view.Table} view
     * @param {HTMLElement} node
     * @param {String} group The name of the group
     * @param {Ext.event.Event} e
     */

    /**
     * @event groupdblclick
     * @param {Ext.view.Table} view
     * @param {HTMLElement} node
     * @param {String} group The name of the group
     * @param {Ext.event.Event} e
     */

    /**
     * @event groupcontextmenu
     * @param {Ext.view.Table} view
     * @param {HTMLElement} node
     * @param {String} group The name of the group
     * @param {Ext.event.Event} e
     */

    /**
     * @event groupcollapse
     * @param {Ext.view.Table} view
     * @param {HTMLElement} node
     * @param {String} group The name of the group
     */

    /**
     * @event groupexpand
     * @param {Ext.view.Table} view
     * @param {HTMLElement} node
     * @param {String} group The name of the group
     */

    /**
     * @cfg {String/Array/Ext.Template} groupHeaderTpl
     * A string Template snippet, an array of strings (optionally followed by an object containing Template methods) to be used to construct a Template, or a Template instance.
     *
     * - Example 1 (Template snippet):
     *
     *       groupHeaderTpl: 'Group: {name}'
     *
     * - Example 2 (Array):
     *
     *       groupHeaderTpl: [
     *           'Group: ',
     *           '<div>{name:this.formatName}</div>',
     *           {
     *               formatName: function(name) {
     *                   return Ext.String.trim(name);
     *               }
     *           }
     *       ]
     *
     * - Example 3 (Template Instance):
     *
     *       groupHeaderTpl: Ext.create('Ext.XTemplate',
     *           'Group: ',
     *           '<div>{name:this.formatName}</div>',
     *           {
     *               formatName: function(name) {
     *                   return Ext.String.trim(name);
     *               }
     *           }
     *       )
     *
     * @cfg {String}           groupHeaderTpl.groupField         The field name being grouped by.
     * @cfg {String}           groupHeaderTpl.columnName         The column header associated with the field being grouped by *if there is a column for the field*, falls back to the groupField name.
     * @cfg {Mixed}            groupHeaderTpl.groupValue         The value of the {@link Ext.data.Store#groupField groupField} for the group header being rendered.
     * @cfg {String}           groupHeaderTpl.renderedGroupValue The rendered value of the {@link Ext.data.Store#groupField groupField} for the group header being rendered, as produced by the column renderer.
     * @cfg {String}           groupHeaderTpl.name               An alias for renderedGroupValue
     * @cfg {Ext.data.Model[]} groupHeaderTpl.rows               Deprecated - use children instead. An array containing the child records for the group being rendered. *Not available if the store is a {@link Ext.data.BufferedStore BufferedStore}*
     * @cfg {Ext.data.Model[]} groupHeaderTpl.children           An array containing the child records for the group being rendered. *Not available if the store is a {@link Ext.data.BufferedStore BufferedStore}*
     */
    groupHeaderTpl: '{columnName}: {name}',

    /**
     * @cfg {Number} [depthToIndent=17]
     * Number of pixels to indent per grouping level
     */
    depthToIndent: 17,

    collapsedCls: Ext.baseCSSPrefix + 'grid-group-collapsed',
    hdCollapsedCls: Ext.baseCSSPrefix + 'grid-group-hd-collapsed',
    hdNotCollapsibleCls: Ext.baseCSSPrefix + 'grid-group-hd-not-collapsible',
    collapsibleCls: Ext.baseCSSPrefix + 'grid-group-hd-collapsible',
    ctCls: Ext.baseCSSPrefix  + 'group-hd-container',

    //<locale>
    /**
     * @cfg {String} [groupByText="Group by this field"]
     * Text displayed in the grid header menu for grouping by header.
     */
    groupByText: 'Group by this field',
    //</locale>
    //<locale>
    /**
     * @cfg {String} [showGroupsText="Show in groups"]
     * Text displayed in the grid header for enabling/disabling grouping.
     */
    showGroupsText: 'Show in groups',
    //</locale>

    /**
     * @cfg {Boolean} [hideGroupedHeader=false]
     * True to hide the header that is currently grouped.
     */
    hideGroupedHeader: false,

    /**
     * @cfg {Boolean} [startCollapsed=false]
     * True to start all groups collapsed.
     */
    startCollapsed: false,

    /**
     * @cfg {Boolean} [enableGroupingMenu=true]
     * True to enable the grouping control in the header menu.
     */
    enableGroupingMenu: true,

    /**
     * @cfg {Boolean} [enableNoGroups=true]
     * True to allow the user to turn off grouping.
     */
    enableNoGroups: true,

    /**
     * @cfg {Boolean} [collapsible=true]
     * Set to `false` to disable collapsing groups from the UI.
     *
     * This is set to `false` when the associated {@link Ext.data.Store store} is
     * a {@link Ext.data.BufferedStore BufferedStore}.
     */
    collapsible: true,

    /**
     * @cfg {Array} [groupers=null]
     * These are grouper objects defined for the feature. If the group names are derived
     * from complex data types, it is necessary to convert them as a store would.
     *
     * However, since only one grouper can be defined on the store at a time and
     * this feature clears the current grouper when a new one is added, it is
     * necessary to define a cache of groupers that the feature can lookup as needed.
     *
     * Expected grouper object properties are `property` and `groupFn`.
     */
    groupers: null,

    //<locale>
    expandTip: 'Click to expand. CTRL key collapses all others',
    //</locale>

    //<locale>
    collapseTip: 'Click to collapse. CTRL/click collapses all others',
    //</locale>

    showSummaryRow: false,

    outerTpl: [
        '{%',
            // Set up the grouping unless we are disabled, or it's just a summary record
            'if (!(this.groupingFeature.disabled || values.rows.length === 1 && values.rows[0].isSummary)) {',
                'this.groupingFeature.setup(values.rows, values.view.rowValues);',
            '}',

            // Process the item
            'this.nextTpl.applyOut(values, out, parent);',

            // Clean up the grouping unless we are disabled, or it's just a summary record
            'if (!(this.groupingFeature.disabled || values.rows.length === 1 && values.rows[0].isSummary)) {',
                'this.groupingFeature.cleanup(values.rows, values.view.rowValues);',
            '}',
        '%}',
    {
        priority: 200
    }],

    groupRowTpl: [
        '{%',
            'var me = this.groupingFeature,',
                'colspan = "colspan=" + values.columns.length;',

            // If grouping is disabled or it's just a summary record, do not call setupRowData, and do not wrap
            'if (me.disabled || parent.rows.length === 1 && parent.rows[0].isSummary) {',
                'values.needsWrap = false;',
            '} else {',
                // setupRowData requires the index in the data source, not the index in the real store
                'me.setupRowData(values.record, values.rowIndex, values);',
            '}',
        '%}',
        '<tpl if="needsWrap">',
            '<tpl if="isFirstRow">',
                // MUST output column sizing elements because the first row in this table
                // contains one colspanning TD, and that overrides subsequent column width settings.
                '{% values.view.renderColumnSizer(values, out); %}',
                '<tr data-boundView="{view.id}" data-recordId="{record.internalId:htmlEncode}" data-recordIndex="{[values.isCollapsedGroup ? -1 : values.recordIndex]}" class="{groupHeaderCls}">',
                    '<td class="{[me.ctCls]}" {[colspan]}>',
                        '{%',
                            // Group title is visible if not locking, or we are the locked side, or the locked side has no columns/
                            // Use visibility to keep row heights synced without intervention.
                            'var groupTitleStyle = (!values.view.lockingPartner || (values.view.ownerCt === values.view.ownerCt.ownerLockable.lockedGrid) || (values.view.lockingPartner.headerCt.getVisibleGridColumns().length === 0)) ? "" : "visibility:hidden";',
                        '%}',
                        // TODO. Make the group header tabbable with tabIndex="0" and enable grid navigation "Action Mode"
                        // to activate it.
                        '<div data-groupname="{groupName:htmlEncode}" class="', Ext.baseCSSPrefix, 'grid-group-hd {collapsibleCls}" nottabindex="0" hidefocus="on" {ariaCellInnerAttr}>',
                            '<div class="', Ext.baseCSSPrefix, 'grid-group-title" style="{[groupTitleStyle]}" {ariaGroupTitleAttr}>',
                                '{[values.groupHeaderTpl.apply(values.metaGroupCache, parent) || "&#160;"]}',
                            '</div>',
                        '</div>',
                    '</td>',
                '</tr>',
            '</tpl>',

            // Only output the first row if this is *not* a collapsed group
            '<tpl if="!isCollapsedGroup">',
                '{%',
                    'values.itemClasses.length = 0;',
                    'this.nextTpl.applyOut(values, out, parent);',
                '%}',
            '</tpl>',
            '<tpl if="summaryRecord">',
                '{%me.outputSummaryRecord(values.summaryRecord, values, out, parent);%}',
            '</tpl>',

        '<tpl else>',
            '{%this.nextTpl.applyOut(values, out, parent);%}',
        '</tpl>', {
            priority: 200,

            beginRowSync: function (rowSync) {
                var owner = this.owner;

                rowSync.add('header', owner.eventSelector);
                rowSync.add('summary', owner.summaryRowSelector);
            },

            syncContent: function(destRow, sourceRow, columnsToUpdate) {
                destRow = Ext.fly(destRow, 'syncDest');
                sourceRow = Ext.fly(sourceRow, 'sycSrc');
                var owner = this.owner,
                    destHd = destRow.down(owner.eventSelector, true),
                    sourceHd = sourceRow.down(owner.eventSelector, true),
                    destSummaryRow = destRow.down(owner.summaryRowSelector, true),
                    sourceSummaryRow = sourceRow.down(owner.summaryRowSelector, true);

                // Sync the content of header element.
                if (destHd && sourceHd) {
                    Ext.fly(destHd).syncContent(sourceHd);
                }

                // Sync just the updated columns in the summary row.
                if (destSummaryRow && sourceSummaryRow) {

                    // If we were passed a column set, only update them
                    if (columnsToUpdate) {
                        this.groupingFeature.view.updateColumns(destSummaryRow, sourceSummaryRow, columnsToUpdate);
                    }

                    // Else simply sync the content
                    else {
                        Ext.fly(destSummaryRow).syncContent(sourceSummaryRow);
                    }
                }
            }
        }
    ],

    init: function (grid) {
        var me = this,
            view = me.view,
            store = me.getGridStore(),
            lockPartner, dataSource;

        view.isGrouping = store.isGrouped();

        me.mixins.summary.init.call(me);

        me.callParent([grid]);

        view.headerCt.on({
            columnhide: me.onColumnHideShow,
            columnshow: me.onColumnHideShow,
            columnmove: me.onColumnMove,
            scope: me
        });

        // Add a table level processor
        view.addTpl(Ext.XTemplate.getTpl(me, 'outerTpl')).groupingFeature = me;

        // Add a row level processor
        view.addRowTpl(Ext.XTemplate.getTpl(me, 'groupRowTpl')).groupingFeature = me;

        view.preserveScrollOnRefresh = true;

        // Sparse store - we can never collapse groups
        if (store.isBufferedStore) {
            me.collapsible = false;
        }
        // If it's a local store we can build a grouped store for use as the view's dataSource
        else {

            // Share the GroupStore between both sides of a locked grid
            lockPartner = me.lockingPartner;
            if (lockPartner && lockPartner.dataSource) {
                me.dataSource = view.dataSource = dataSource = lockPartner.dataSource;
            } else {
                me.dataSource = view.dataSource = dataSource = new Ext.grid.feature.GroupStore(me, store);
            }
        }

        grid = grid.ownerLockable || grid;

        // Before the reconfigure, rebind our GroupStore dataSource to the new store
        grid.on('beforereconfigure', me.beforeReconfigure, me);

        view.on({
            afterrender: me.afterViewRender,
            scope: me,
            single: true
        });

        if (dataSource) {
            // Listen to dataSource groupchange so it has a chance to do any processing
            // before we react to it
            dataSource.on('groupchange', me.onGroupChange, me);
        } else {
            me.setupStoreListeners(store);
        }
    },

    getGridStore: function () {
        return this.view.getStore();
    },

    indexOf: function(record) {
        return this.dataSource.indexOf(record);
    },

    isInCollapsedGroup: function(record) {
        var me = this,
            store = me.getGridStore(),
            result = false,
            metaGroup;

        if (store.isGrouped() && (metaGroup = me.getMetaGroup(record))) {
            result = !!(metaGroup && metaGroup.isCollapsed);
        }

        return result;
    },

    createCache: function () {
        var metaGroupCache = this.metaGroupCache = {},
            lockingPartner = this.lockingPartner;

        if (lockingPartner) {
            lockingPartner.metaGroupCache = metaGroupCache;
        }

        return metaGroupCache;
    },

    getCache: function () {
        return this.metaGroupCache || this.createCache();
    },

    invalidateCache: function() {
        var lockingPartner = this.lockingPartner;

        this.metaGroupCache = null;

        if (lockingPartner) {
            lockingPartner.metaGroupCache = null;
        }
    },

    vetoEvent: function(record, row, rowIndex, e) {
        // Do not veto mouseover/mouseout
        if (e.type !== 'mouseover' && e.type !== 'mouseout'  && e.type !== 'mouseenter' && e.type !== 'mouseleave' && e.getTarget(this.eventSelector)) {
            return false;
        }
    },

    enable: function () {
        var me = this,
            view = me.view,
            store = me.getGridStore(),
            currentGroupedHeader = me.hideGroupedHeader && me.getGroupedHeader(),
            groupToggleMenuItem;

        view.isGrouping = true;
        if (view.lockingPartner) {
            view.lockingPartner.isGrouping = true;
        }

        me.callParent();

        if (me.lastGrouper) {
            store.group(me.lastGrouper);
            me.lastGrouper = null;
        }

        // Update the UI.
        if (currentGroupedHeader) {
            currentGroupedHeader.hide();
        }

        groupToggleMenuItem = me.view.headerCt.getMenu().down('#groupToggleMenuItem');
        if (groupToggleMenuItem) {
            groupToggleMenuItem.setChecked(true, true);
        }
    },

    disable: function () {
        var me = this,
            view = me.view,
            store = me.getGridStore(),
            currentGroupedHeader = me.hideGroupedHeader && me.getGroupedHeader(),
            lastGrouper = store.getGrouper(),
            groupToggleMenuItem;


        view.isGrouping = false;
        if (view.lockingPartner) {
            view.lockingPartner.isGrouping = false;
        }

        me.callParent();

        if (lastGrouper) {
            me.lastGrouper = lastGrouper;
            store.clearGrouping();
        }

        // Update the UI.
        if (currentGroupedHeader) {
            currentGroupedHeader.show();
        }

        groupToggleMenuItem = me.view.headerCt.getMenu().down('#groupToggleMenuItem');
        if (groupToggleMenuItem) {
            groupToggleMenuItem.setChecked(false, true);
            groupToggleMenuItem.disable();
        }
    },

    // Attach events to view
    afterViewRender: function() {
        var me = this,
            view = me.view;

        view.on({
            scope: me,
            groupclick: me.onGroupClick
        });

        if (me.enableGroupingMenu) {
            me.injectGroupingMenu();
        }

        me.pruneGroupedHeader();

        me.lastGrouper = me.getGridStore().getGrouper();

        // If disabled in the config, disable now so the store load won't
        // send the grouping query params in the request.
        if (me.disabled) {
            me.disable();
        }

    },

    injectGroupingMenu: function() {
        var me = this,
            headerCt = me.view.headerCt;

        headerCt.showMenuBy = me.showMenuBy;
        headerCt.getMenuItems = me.getMenuItems();
    },

    onColumnHideShow: function(headerOwnerCt, header) {
        var me = this,
            view = me.view,
            headerCt = view.headerCt,
            menu = headerCt.getMenu(),
            activeHeader = menu.activeHeader,
            groupMenuItem  = menu.down('#groupMenuItem'),
            groupMenuMeth,
            colCount = me.grid.getVisibleColumnManager().getColumns().length,
            items,
            len,
            i;

        // "Group by this field" must be disabled if there's only one column left visible.
        if (activeHeader && groupMenuItem) {
            groupMenuMeth = activeHeader.groupable === false || !activeHeader.dataIndex || me.view.headerCt.getVisibleGridColumns().length < 2 ?  'disable' : 'enable';
            groupMenuItem[groupMenuMeth]();
        }

        // header containing TDs have to span all columns, hiddens are just zero width
        // Also check the colCount on the off chance that they are all hidden
        if (view.rendered && colCount) {
            items = view.el.query('.' + me.ctCls);
            for (i = 0, len = items.length; i < len; ++i) {
                items[i].colSpan = colCount;
            }
        }
    },

    // Update first and last records in groups when column moves
    // Because of the RowWrap template, this will update the groups' headers and footers
    onColumnMove: function() {
        var me = this,
            view = me.view,
            groupName, groupNames, group, firstRec, lastRec, metaGroup;

        if (view.getStore().isGrouped()) {
            groupNames = me.getCache().map;

            Ext.suspendLayouts();
            for (groupName in groupNames) {
                group = me.getGroup(groupName);
                firstRec = group.first();
                lastRec = group.last();

                metaGroup = me.getMetaGroup(groupName);

                if (metaGroup.isCollapsed) {
                    firstRec = lastRec = me.dataSource.getGroupPlaceholder(groupName);
                }

                // Must pass the modifiedFields parameter as null so that the
                // listener options does not take that place in the arguments list
                view.refreshNode(firstRec);
                if (me.showSummaryRow && lastRec !== firstRec) {
                    view.refreshNode(lastRec);
                }
            }
            Ext.resumeLayouts(true);
        }
    },

    showMenuBy: function(clickEvent, t, header) {
        var me = this,
            menu = me.getMenu(),
            groupMenuItem = menu.down('#groupMenuItem'),
            groupMenuMeth = header.groupable === false || !header.dataIndex || me.view.headerCt.getVisibleGridColumns().length < 2 ?  'disable' : 'enable',
            groupToggleMenuItem  = menu.down('#groupToggleMenuItem'),
            isGrouped = me.grid.getStore().isGrouped();

        groupMenuItem[groupMenuMeth]();
        if (groupToggleMenuItem) {
            groupToggleMenuItem.setChecked(isGrouped, true);
            groupToggleMenuItem[isGrouped ?  'enable' : 'disable']();
        }
        Ext.grid.header.Container.prototype.showMenuBy.apply(me, arguments);
    },

    getMenuItems: function() {
        var me = this,
            groupByText = me.groupByText,
            disabled = me.disabled || !me.getGroupField(),
            showGroupsText = me.showGroupsText,
            enableNoGroups = me.enableNoGroups,
            getMenuItems = me.view.headerCt.getMenuItems;

        // runs in the scope of headerCt
        return function() {

            // We cannot use the method from HeaderContainer's prototype here
            // because other plugins or features may already have injected an implementation
            var o = getMenuItems.call(this);
            o.push('-', {
                iconCls: Ext.baseCSSPrefix + 'group-by-icon',
                itemId: 'groupMenuItem',
                text: groupByText,
                handler: me.onGroupMenuItemClick,
                scope: me
            });
            if (enableNoGroups) {
                o.push({
                    itemId: 'groupToggleMenuItem',
                    text: showGroupsText,
                    checked: !disabled,
                    checkHandler: me.onGroupToggleMenuItemClick,
                    scope: me
                });
            }
            return o;
        };
    },

    /**
     * Group by the header the user has clicked on.
     * @private
     */
    onGroupMenuItemClick: function(menuItem, e) {
        var me = this,
            menu = menuItem.parentMenu,
            hdr  = menu.activeHeader,
            view = me.view,
            store = me.getGridStore();

        if (me.disabled) {
            me.lastGrouper = null;
            me.block();
            me.enable();
            me.unblock();
        }
        view.isGrouping = true;

        // First check if there is a grouper defined for the feature. This is necessary
        // when the value is a complex type.
        store.group(me.getGrouper(hdr.dataIndex) || hdr.dataIndex);
        me.pruneGroupedHeader();
    },

    block: function(fromPartner) {
        var me = this;
        me.blockRefresh = me.view.blockRefresh = true;
        if (me.lockingPartner && !fromPartner) {
            me.lockingPartner.block(true);
        }
    },

    unblock: function(fromPartner) {
        var me = this;
        me.blockRefresh = me.view.blockRefresh = false;
        if (me.lockingPartner && !fromPartner) {
            me.lockingPartner.unblock(true);
        }
    },

    /**
     * Turn on and off grouping via the menu
     * @private
     */
    onGroupToggleMenuItemClick: function(menuItem, checked) {
        this[checked ? 'enable' : 'disable']();
    },

    /**
     * Prunes the grouped header from the header container
     * @private
     */
    pruneGroupedHeader: function() {
        var me = this,
            header = me.getGroupedHeader();

        if (me.hideGroupedHeader && header) {
            Ext.suspendLayouts();
            if (me.prunedHeader && me.prunedHeader !== header) {
                me.prunedHeader.show();
            }
            me.prunedHeader = header;
            if (header.rendered) {
                header.hide();
            }
            Ext.resumeLayouts(true);
        }
    },

    getHeaderNode: function(groupName) {
        var el = this.view.getEl(),
            nodes, i, len, node;


        if (el) {
            groupName = Ext.htmlEncode(groupName);
            nodes = el.query(this.eventSelector);
            for (i = 0, len = nodes.length; i < len; ++i) {
                node = nodes[i];
                if (node.getAttribute('data-groupName') === groupName) {
                    return node;
                }
            }
        }
    },

    getGroup: function (name) {
        var store = this.getGridStore(),
            value = name,
            group;

        if (store.isGrouped()) {
            if (name.isModel) {
                name = name.get(store.getGroupField());
            }

            // If a complex type let's try to get the string from a groupFn.
            if (typeof name !== 'string') {
                name = store.getGrouper().getGroupString(value);
            }

            group = store.getGroups().getByKey(name);
        }

        return group;
    },

    // Groupers may be defined on the feature itself if the datIndex is a complex type.
    // @private
    getGrouper: function (dataIndex) {
        var groupers = this.groupers;

        if (!groupers) {
            return null;
        }

        return Ext.Array.findBy(groupers, function (grouper) {
            return grouper.property === dataIndex;
        });
    },

    getGroupField: function(){
        return this.getGridStore().getGroupField();
    },

    getMetaGroup: function (group) {
        var metaGroupCache = this.metaGroupCache || this.createCache(),
            key, metaGroup;

        if (group.isModel) {
            group = this.getGroup(group);
        }

        if (group) {
            key = (typeof group === 'string') ? group : group.getGroupKey();
            metaGroup = metaGroupCache[key];

            if (!metaGroup) {
                // TODO: Break this out into its own method?
                metaGroup = metaGroupCache[key] = {
                    isCollapsed: false,
                    lastGroup: null,
                    lastGroupGeneration: null,
                    lastFilterGeneration: null,
                    aggregateRecord: new Ext.data.Model()
                };

                if (!metaGroupCache.map) {
                    metaGroupCache.map = {};
                }

                metaGroupCache.map[key] = true;
            }
        }

        return metaGroup;
    },

    /**
     * Returns `true` if the named group is expanded.
     * @param {String} groupName The group name. This is the value of
     * the {@link Ext.data.Store#groupField groupField}.
     * @return {Boolean} `true` if the group defined by that value is expanded.
     */
    isExpanded: function(groupName) {
        return !this.getMetaGroup(groupName).isCollapsed;
    },

    /**
     * Expand a group
     * @param {String} groupName The group name
     * @param {Boolean} focus Pass `true` to focus the group after expand.
     */
    expand: function(groupName, focus) {
        this.doCollapseExpand(false, groupName, focus);
    },

    /**
     * Expand all groups
     */
    expandAll: function() {
        var me = this,
            metaGroupCache = me.getCache(),
            lockingPartner = me.lockingPartner,
            groupName;

        // Clear all collapsed flags.
        // metaGroupCache is shared between two lockingPartners
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                metaGroupCache[groupName].isCollapsed = false;
            }
        }
        Ext.suspendLayouts();
        me.dataSource.onRefresh();
        Ext.resumeLayouts(true);

        // Fire event for all groups post expand
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                me.afterCollapseExpand(false, groupName);
                if (lockingPartner) {
                    lockingPartner.afterCollapseExpand(false, groupName);
                }
            }
        }
    },

    /**
     * Collapse a group
     * @param {String} groupName The group name
     * @param {Boolean} focus Pass `true` to focus the group after expand.
     */
    collapse: function(groupName, focus) {
        this.doCollapseExpand(true, groupName, focus);
    },

    // private
    // Returns true if all groups are collapsed
    isAllCollapsed: function() {
        var me = this,
            metaGroupCache = me.getCache(),
            groupName;

        // Clear all collapsed flags.
        // metaGroupCache is shared between two lockingPartners
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                if (!metaGroupCache[groupName].isCollapsed) {
                    return false;
                }
            }
        }
        return true;
    },

    // private
    // Returns true if all groups are expanded
    isAllExpanded: function() {
        var me = this,
            metaGroupCache = me.getCache(),
            groupName;

        // Clear all collapsed flags.
        // metaGroupCache is shared between two lockingPartners
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                if (metaGroupCache[groupName].isCollapsed) {
                    return false;
                }
            }
        }
        return true;
    },

    /**
     * Collapse all groups
     */
    collapseAll: function() {
        var me = this,
            metaGroupCache = me.getCache(),
            groupName,
            lockingPartner = me.lockingPartner;

        // Set all collapsed flags
        // metaGroupCache is shared between two lockingPartners
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                metaGroupCache[groupName].isCollapsed = true;
            }
        }
        Ext.suspendLayouts();
        me.dataSource.onRefresh();

        if (lockingPartner && !lockingPartner.isAllCollapsed()) {
            lockingPartner.collapseAll();
        }
        Ext.resumeLayouts(true);

        // Fire event for all groups post collapse
        for (groupName in metaGroupCache) {
            if (metaGroupCache.hasOwnProperty(groupName)) {
                me.afterCollapseExpand(true, groupName);
                if (lockingPartner) {
                    lockingPartner.afterCollapseExpand(true, groupName);
                }
            }
        }

    },

    doCollapseExpand: function(collapsed, groupName, focus) {
        var me = this,
            lockingPartner = me.lockingPartner,
            group = me.getGroup(groupName);

        // metaGroupCache is shared between two lockingPartners.
        if (me.getMetaGroup(group).isCollapsed !== collapsed) {

            // The GroupStore is shared by partnered Grouping features, so this will refresh both sides.
            // We only want one layout as a result though, so suspend layouts while refreshing.
            Ext.suspendLayouts();
            if (collapsed) {
                me.dataSource.collapseGroup(group);
            } else {
                me.dataSource.expandGroup(group);
            }
            Ext.resumeLayouts(true);

            // Sync the group state and focus the row if requested.
            me.afterCollapseExpand(collapsed, groupName, focus);

            // Sync the lockingPartner's group state.
            // Do not pass on focus flag. If we were told to focus, we must focus, not the other side.
            if (lockingPartner) {
                lockingPartner.afterCollapseExpand(collapsed, groupName, false);
            }
        }
    },

    afterCollapseExpand: function(collapsed, groupName, focus) {
        var me = this,
            view = me.view,
            bufferedRenderer = view.bufferedRenderer,
            header;

        header = me.getHeaderNode(groupName);

        view.fireEvent(collapsed ? 'groupcollapse' : 'groupexpand', view, header, groupName);
        if (focus) {
            if (header) {
                view.scrollElIntoView(Ext.fly(header).up(view.getItemSelector()), false, true);
            }
            // The header might be outside the rendered range if we are buffer rendering
            else if (bufferedRenderer) {
                // Find the first record in the group and ask the buffered renderer to take us there
                bufferedRenderer.scrollTo(me.getGroup(groupName).getAt(0));
            }
        }
    },

    onGroupChange: function(store, grouper) {
        // If changed to a non-null grouper, the Store will be sorted (either remotely or locally), and therefore fire a refresh.
        // If changed to a null grouper - setGrouper(null) - that causes no mutation to a store, so we must refresh the view to remove the group headers/footers.
        if (!grouper) {
            this.view.ownerGrid.getView().refresh();
        } else {
            this.lastGrouper = grouper;
        }
    },

    /**
     * Gets the related menu item for a dataIndex
     * @private
     * @return {Ext.grid.header.Container} The header
     */
    getMenuItem: function(dataIndex){
        var view = this.view,
            header = view.headerCt.down('gridcolumn[dataIndex=' + dataIndex + ']'),
            menu = view.headerCt.getMenu();

        return header ? menu.down('menuitem[headerId='+ header.id +']') : null;
    },

    onGroupKey: function(keyCode, event) {
        var me = this,
            groupName = me.getGroupName(event.target);

        if (groupName) {
            me.onGroupClick(me.view, event.target, groupName, event);
        }
    },

    /**
     * Toggle between expanded/collapsed state when clicking on
     * the group.
     * @private
     */
    onGroupClick: function(view, rowElement, groupName, e) {
        var me = this,
            metaGroupCache = me.getCache(),
            groupNames = metaGroupCache.map,
            groupIsCollapsed = !me.isExpanded(groupName),
            g;

        if (me.collapsible) {
            // CTRL means collapse all others.
            if (e.ctrlKey) {
                Ext.suspendLayouts();
                for (g in groupNames) {
                    if (g === groupName) {
                        if (groupIsCollapsed) {
                            me.expand(groupName);
                        }
                    } else if (!metaGroupCache[g].isCollapsed) {
                        me.doCollapseExpand(true, g, false);
                    }
                }
                Ext.resumeLayouts(true);
                return;
            }

            if (groupIsCollapsed) {
               me.expand(groupName);
            } else {
                me.collapse(groupName);
            }
        }
    },

    setupRowData: function(record, idx, rowValues) {
        var me = this,
            recordIndex = rowValues.recordIndex,
            data = me.refreshData,
            metaGroupCache = me.getCache(),
            header = data.header,
            groupField = data.groupField,
            store = me.getGridStore(),
            dataSource = me.view.dataSource,
            column = me.grid.columnManager.getHeaderByDataIndex(groupField),
            hasRenderer = !!(column && column.renderer),
            grouper, groupName, prev, next, items;

        rowValues.isCollapsedGroup = false;
        rowValues.summaryRecord = rowValues.groupHeaderCls = null;

        if (data.doGrouping) {
            grouper = store.getGrouper();

            // This is a placeholder record which represents a whole collapsed group
            // It is a special case.
            if (record.isCollapsedPlaceholder) {
                groupName = record.group.getGroupKey();
                items = record.group.items;

                rowValues.isFirstRow = rowValues.isLastRow = true;
                rowValues.groupHeaderCls = me.hdCollapsedCls;
                rowValues.isCollapsedGroup = rowValues.needsWrap = true;
                rowValues.groupName = groupName;
                rowValues.metaGroupCache = metaGroupCache;
                metaGroupCache.groupField = groupField;
                metaGroupCache.name = metaGroupCache.renderedGroupValue = hasRenderer ? column.renderer(metaGroupCache[groupName].raw, {}, record) : groupName;
                metaGroupCache.groupValue = items[0].get(groupField);
                metaGroupCache.columnName = header ? header.text : groupField;
                rowValues.collapsibleCls = me.collapsible ? me.collapsibleCls : me.hdNotCollapsibleCls;
                metaGroupCache.rows = metaGroupCache.children = items;
                if (me.showSummaryRow) {
                    rowValues.summaryRecord = data.summaryData[groupName];
                }
                return;
            }

            groupName = grouper.getGroupString(record);

            // If caused by an update event on the first or last records of a group fired by a GroupStore, the record's group will be attached.
            if (record.group) {
                items = record.group.items;
                rowValues.isFirstRow = record === items[0];
                rowValues.isLastRow  = record === items[items.length - 1];
            }

            else {
                // See if the current record is the last in the group
                rowValues.isFirstRow = recordIndex === 0;
                if (!rowValues.isFirstRow) {
                    prev = store.getAt(recordIndex - 1);
                    // If the previous row is of a different group, then we're at the first for a new group
                    if (prev) {
                        // Must use Model's comparison because Date objects are never equal
                        rowValues.isFirstRow = !prev.isEqual(grouper.getGroupString(prev), groupName);
                    }
                }

                // See if the current record is the last in the group
                rowValues.isLastRow = recordIndex === (store.isBufferedStore ? store.getTotalCount() : store.getCount()) - 1;
                if (!rowValues.isLastRow) {
                    next = store.getAt(recordIndex + 1);
                    if (next) {
                        // Must use Model's comparison because Date objects are never equal
                        rowValues.isLastRow = !next.isEqual(grouper.getGroupString(next), groupName);
                    }
                }
            }

            if (rowValues.isFirstRow) {
                metaGroupCache.groupField = groupField;
                metaGroupCache.name = metaGroupCache.renderedGroupValue = hasRenderer ? column.renderer(metaGroupCache[groupName].raw, {}, record) : groupName;
                metaGroupCache.groupValue = record.get(groupField);
                metaGroupCache.columnName = header ? header.text : groupField;
                rowValues.collapsibleCls = me.collapsible ? me.collapsibleCls : me.hdNotCollapsibleCls;
                rowValues.groupName = groupName;

                if (!me.isExpanded(groupName)) {
                    rowValues.itemClasses.push(me.hdCollapsedCls);
                    rowValues.isCollapsedGroup = true;
                }

                // We only get passed a GroupStore if the store is not buffered
                if (dataSource.isBufferedStore) {
                    metaGroupCache.rows = metaGroupCache.children = [];
                } else {
                    metaGroupCache.rows = metaGroupCache.children = me.getRecordGroup(record).items;
                }
                rowValues.metaGroupCache = metaGroupCache;
            }

            if (rowValues.isLastRow) {
                // Add the group's summary record to the last record in the group
                if (me.showSummaryRow) {
                    rowValues.summaryRecord = data.summaryData[groupName];
                    rowValues.itemClasses.push(Ext.baseCSSPrefix + 'grid-group-last');
                }
            }
            rowValues.needsWrap = (rowValues.isFirstRow || rowValues.summaryRecord);
        }
    },

    setup: function(rows, rowValues) {
        var me = this,
            data = me.refreshData,
            view = rowValues.view,
            // Need to check if groups have been added since init(), such as in the case of stateful grids.
            isGrouping = view.isGrouping = !me.disabled && me.getGridStore().isGrouped(),
            bufferedRenderer = view.bufferedRenderer;

        me.skippedRows = 0;
        if (bufferedRenderer) {
            bufferedRenderer.variableRowHeight = view.bufferedRenderer.variableRowHeight || isGrouping;
        }
        data.groupField = me.getGroupField();
        data.header = me.getGroupedHeader(data.groupField);
        data.doGrouping = isGrouping;
        rowValues.groupHeaderTpl = Ext.XTemplate.getTpl(me, 'groupHeaderTpl');

        if (isGrouping && me.showSummaryRow) {
            data.summaryData = me.generateSummaryData();
        }
    },

    cleanup: function(rows, rowValues) {
        var data = this.refreshData;

        rowValues.metaGroupCache = rowValues.groupHeaderTpl = rowValues.isFirstRow = null;
        data.groupField = data.header = null;
    },

    getAggregateRecord: function (metaGroup, forceNew) {
        var rec;

        if (forceNew === true || !metaGroup.aggregateRecord) {
            rec = new Ext.data.Model();
            metaGroup.aggregateRecord = rec;
            rec.isNonData = rec.isSummary = true;
        }

        return metaGroup.aggregateRecord;
    },

    /**
     * Used by the Grouping Feature when {@link #showSummaryRow} is `true`.
     *
     * Generates group summary data for the whole store.
     * @private
     * @return {Object} An object hash keyed by group name containing summary records.
     */
    generateSummaryData: function(){
        var me = this,
            store = me.getGridStore(),
            filters = store.getFilters(),
            groups = store.getGroups().items,
            reader = store.getProxy().getReader(),
            groupField = me.getGroupField(),
            lockingPartner = me.lockingPartner,
            updateNext = me.updateNext,
            data = {},
            ownerCt = me.view.ownerCt,
            i, len, group, metaGroup, record, hasRemote, remoteData;

        /**
         * @cfg {String} [remoteRoot=undefined]
         * The name of the property which contains the Array of summary objects.
         * It allows to use server-side calculated summaries.
         */
        if (me.remoteRoot && reader.rawData) {
            hasRemote = true;
            remoteData = me.mixins.summary.generateSummaryData.call(me, groupField);
        }

        for (i = 0, len = groups.length; i < len; ++i) {
            group = groups[i];
            metaGroup = me.getMetaGroup(group);

            // Something has changed or it doesn't exist, populate it.
            if (updateNext || hasRemote || store.updating || me.didGroupChange(group, metaGroup, filters)) {
                record = me.populateRecord(group, metaGroup, remoteData);

                // Clear the dirty state of the group if this is the only Summary, or this is the right hand (normal grid's) summary.
                if (!lockingPartner || (ownerCt === ownerCt.ownerLockable.normalGrid)) {
                    metaGroup.lastGroup = group;
                    metaGroup.lastGroupGeneration = group.generation;
                    metaGroup.lastFilterGeneration = filters.generation;
                }

            } else {
                record = me.getAggregateRecord(metaGroup);
            }

            data[group.getGroupKey()] = record;
        }

        me.updateNext = false;

        return data;
    },

    getGroupName: function(element) {
        var me = this,
            view = me.view,
            eventSelector = me.eventSelector,
            targetEl, row;

        // See if element is, or is within a group header. If so, we can extract its name
        targetEl = Ext.fly(element).findParent(eventSelector);

        if (!targetEl) {
            // Otherwise, navigate up to the row and look down to see if we can find it
            row = Ext.fly(element).findParent(view.itemSelector);
            if (row) {
                targetEl = row.down(eventSelector, true);
            }
        }

        if (targetEl) {
            return Ext.htmlDecode(targetEl.getAttribute('data-groupname'));
        }
    },

    /**
     * Returns the group data object for the group to which the passed record belongs **if the Store is grouped**.
     *
     * @param {Ext.data.Model} record The record for which to return group information.
     * @return {Object} A single group data block as returned from {@link Ext.data.Store#getGroups Store.getGroups}. Returns
     * `undefined` if the Store is not grouped.
     *
     */
    getRecordGroup: function (record) {
        var store = this.getGridStore(),
            grouper = store.getGrouper();

        if (grouper) {
            return store.getGroups().getByKey(grouper.getGroupString(record));
        }
    },

    getGroupedHeader: function(groupField) {
        var me = this,
            headerCt = me.view.headerCt,
            partner = me.lockingPartner,
            selector, header;

        groupField = groupField || me.getGroupField();

        if (groupField) {
            selector = '[dataIndex=' + groupField + ']';
            header = headerCt.down(selector);
            // The header may exist in the locking partner, so check there as well
            if (!header && partner) {
                header = partner.view.headerCt.down(selector);
            }
        }
        return header || null;
    },

    getFireEventArgs: function(type, view, targetEl, e) {
        return [type, view, targetEl, this.getGroupName(targetEl), e];
    },

    destroy: function() {
        var me = this,
            dataSource = me.dataSource;

        me.storeListeners = Ext.destroy(me.storeListeners);
        me.view = me.prunedHeader = me.grid = me.dataSource = me.groupers = null;
        me.invalidateCache();

        me.callParent();

        if (dataSource) {
            dataSource.bindStore(null);
            Ext.destroy(dataSource);
        }
    },

    beforeReconfigure: function(grid, store, columns, oldStore, oldColumns) {
        var me = this,
            view = me.view,
            dataSource = me.dataSource,
            bufferedStore;

        if (store && store !== oldStore) {
            bufferedStore = store.isBufferedStore;

            if (!dataSource) {
                Ext.destroy(me.storeListeners);
                me.setupStoreListeners(store);
            }

            // Grouping involves injecting a dataSource in early
            if (bufferedStore !== oldStore.isBufferedStore) {
                Ext.Error.raise('Cannot reconfigure grouping switching between buffered and non-buffered stores');
            }

            view.isGrouping = !!store.getGrouper();
            dataSource.bindStore(store);
        }
    },

    populateRecord: function (group, metaGroup, remoteData) {
        var me = this,
            view = me.grid.ownerLockable ? me.grid.ownerLockable.view : me.view,
            store = me.getGridStore(),
            record = me.getAggregateRecord(metaGroup),
            // Use the full column set, regardless of locking
            columns = view.headerCt.getGridColumns(),
            len = columns.length,
            groupName = group.getGroupKey(),
            groupData, field, i, column, fieldName, summaryValue;

        record.beginEdit();

        if (remoteData) {
            // Remote summary grouping provides the grouping totals so there's no need to
            // iterate throught the columns to map the column's dataIndex to the field name.
            // Instead, enumerate the grouping record and set the field in the aggregate
            // record for each one.
            groupData = remoteData[groupName];
            for (field in groupData) {
                if (groupData.hasOwnProperty(field)) {
                    if (field !== record.idProperty) {
                        record.set(field, groupData[field]);
                    }
                }
            }
        }

        // Here we iterate through the columns with two objectives:
        //    1. For local grouping, get the summary for each column and update the record.
        //    2. For both local and remote grouping, set the summary data object
        //       which is passed to the summaryRenderer (if defined).
        for (i = 0; i < len; ++i) {
            column = columns[i];
            // Use the column id if there's no mapping, could be a calculated field
            fieldName = column.dataIndex || column.getItemId();

            // We need to capture the summary value because it could get overwritten when
            // setting on the model if there is a convert() method on the model.
            if (!remoteData) {
                summaryValue = me.getSummary(store, column.summaryType, fieldName, group);
                record.set(fieldName, summaryValue);
            } else {
                // For remote groupings, just get the value from the model.
                summaryValue = record.get(column.dataIndex);
            }

            // Capture the columnId:value for the summaryRenderer in the summaryData object.
            me.setSummaryData(record, column.getItemId(), summaryValue, groupName);
        }

        // Poke on the owner group for easy lookup in this.createRenderer().
        record.ownerGroup = groupName;

        record.endEdit(true);
        record.commit();

        return record;
    },

    privates: {
        didGroupChange: function(group, metaGroup, filters) {
            var ret = true;
            if (group === metaGroup.lastGroup) {
                ret = metaGroup.lastGroupGeneration !== group.generation || metaGroup.lastFilterGeneration !== filters.generation;
            }
            return ret;
        },

        setupStoreListeners: function(store) {
            var me = this;

            me.storeListeners = store.on({
                groupchange: me.onGroupChange,
                scope: me,
                destroyable: true
            });
        }
    }
});
