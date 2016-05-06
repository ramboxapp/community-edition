/**
 * A widget column is configured with a {@link #widget} config object which specifies an
 * {@link Ext.Component#cfg-xtype xtype} to indicate which type of Widget or Component belongs
 * in the cells of this column.
 *
 * When a widget cell is rendered, a {@link Ext.Widget Widget} or {@link Ext.Component Component} of the specified type
 * is rendered into that cell. Its {@link Ext.Component#defaultBindProperty defaultBindProperty} is set using this
 * column's {@link #dataIndex} field from the associated record.
 *
 * In the example below we are monitoring the throughput of electricity substations. The capacity being
 * used as a proportion of the maximum rated capacity is displayed as a progress bar. As new data arrives and the
 * instantaneous usage value is updated, the `capacityUsed` field updates itself, and
 * that is used as the {@link #dataIndex} for the `WidgetColumn` which contains the
 * progress bar. The progress Bar's
 * {@link Ext.ProgressBarWidget#defaultBindProperty defaultBindProperty} (which is
 * "value") is set to the calculated `capacityUsed`.
 *
 *     @example
 *     var grid = new Ext.grid.Panel({
 *         title: 'Substation power monitor',
 *         width: 600,
 *         columns: [{
 *             text: 'Id',
 *             dataIndex: 'id',
 *             width: 120
 *         }, {
 *             text: 'Rating',
 *             dataIndex: 'maxCapacity',
 *             width: 80
 *         }, {
 *             text: 'Avg.',
 *             dataIndex: 'avg',
 *             width: 85,
 *             formatter: 'number("0.00")'
 *         }, {
 *             text: 'Max',
 *             dataIndex: 'max',
 *             width: 80
 *         }, {
 *             text: 'Instant',
 *             dataIndex: 'instant',
 *             width: 80
 *         }, {
 *             text: '%Capacity',
 *             width: 150,
 *
 *             // This is our Widget column
 *             xtype: 'widgetcolumn',
 *             dataIndex: 'capacityUsed',
 *
 *             // This is the widget definition for each cell.
 *             // Its "value" setting is taken from the column's dataIndex
 *             widget: {
 *             xtype: 'progressbarwidget',
 *                 textTpl: [
 *                     '{percent:number("0")}% capacity'
 *                 ]
 *             }
 *         }],
 *         renderTo: document.body,
 *         disableSelection: true,
 *         store: {
 *            fields: [{
 *                name: 'id',
 *                type: 'string'
 *            }, {
 *                name: 'maxCapacity',
 *                type: 'int'
 *            }, {
 *                name: 'avg',
 *                type: 'int',
 *                calculate: function(data) {
 *                    // Make this depend upon the instant field being set which sets the sampleCount and total.
 *                    // Use subscript format to access the other pseudo fields which are set by the instant field's converter
 *                    return data.instant && data['total'] / data['sampleCount'];
 *                }
 *            }, {
 *                name: 'max',
 *                type: 'int',
 *                calculate: function(data) {
 *                    // This will be seen to depend on the "instant" field.
 *                    // Use subscript format to access this field's current value to avoid circular dependency error.
 *                    return (data['max'] || 0) < data.instant ? data.instant : data['max'];
 *                }
 *            }, {
 *                name: 'instant',
 *                type: 'int',
 *
 *                // Upon every update of instantaneous power throughput,
 *                // update the sample count and total so that the max field can calculate itself
 *                convert: function(value, rec) {
 *                    rec.data.sampleCount = (rec.data.sampleCount || 0) + 1;
 *                    rec.data.total = (rec.data.total || 0) + value;
 *                    return value;
 *                },
 *               depends: []
 *            }, {
 *                name: 'capacityUsed',
 *                calculate: function(data) {
 *                    return data.instant / data.maxCapacity;
 *                }
 *            }],
 *            data: [{
 *                id: 'Substation A',
 *                maxCapacity: 1000,
 *                avg: 770,
 *                max: 950,
 *                instant: 685
 *            }, {
 *                id: 'Substation B',
 *                maxCapacity: 1000,
 *                avg: 819,
 *                max: 992,
 *                instant: 749
 *            }, {
 *                id: 'Substation C',
 *                maxCapacity: 1000,
 *                avg: 588,
 *                  max: 936,
 *                instant: 833
 *            }, {
 *                id: 'Substation D',
 *                maxCapacity: 1000,
 *                avg: 639,
 *                max: 917,
 *                instant: 825
 *            }]
 *        }
 *     });
 *
 *     // Fake data updating...
 *     // Change one record per second to a random power value
 *     Ext.interval(function() {
 *         var recIdx = Ext.Number.randomInt(0, 3),
 *             newPowerReading = Ext.Number.randomInt(500, 1000);
 *
 *         grid.store.getAt(recIdx).set('instant', newPowerReading);
 *     }, 1000);
 *
 * @since 5.0.0
 */
Ext.define('Ext.grid.column.Widget', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.widgetcolumn',

    config: {
        /**
         * @cfg defaultWidgetUI
         * A map of xtype to {@link Ext.Component#ui} names to use when using Components in this column.
         *
         * Currently {@link Ext.Button Button} and all subclasses of {@link Ext.form.field.Text TextField} default
         * to using `ui: "default"` when in a WidgetColumn except for in the "classic" theme, when they use ui "grid-cell".
         */
        defaultWidgetUI: {}
    },

    /**
     * @cfg
     * @inheritdoc
     */
    sortable: false,

    /**
     * @cfg {Object} renderer
     * @hide
     */

    /**
     * @cfg {Object} scope
     * @hide
     */

    /**
     * @cfg {Object} widget
     * A config object containing an {@link Ext.Component#cfg-xtype xtype}.
     *
     * This is used to create the widgets or components which are rendered into the cells of this column.
     *
     * This column's {@link #dataIndex} is used to update the widget/component's {@link Ext.Component#defaultBindProperty defaultBindProperty}.
     *
     * The widget will be decorated with 2 methods:
     * `getWidgetRecord` - Returns the {@link Ext.data.Model record} the widget is associated with.
     * `getWidgetColumn` - Returns the {@link Ext.grid.column.Widget column} the widget 
     * was associated with.
     */
    
    /**
     * @cfg {Function/String} onWidgetAttach
     * A function that will be called when a widget is attached to a record. This may be useful for
     * doing any post-processing.
     * @param {Ext.grid.column.Column} column The column.
     * @param {Ext.Component/Ext.Widget} widget The {@link #widget} rendered to each cell.
     * @param {Ext.data.Model} record The record used with the current widget (cell).
     * @declarativeHandler
     */
    onWidgetAttach: null,
    
    /**
     * @cfg {Boolean} [stopSelection=true]
     * Prevent grid selection upon click on the widget.
     */
    stopSelection: true,
     
    preventUpdate: true,

    initComponent: function() {
        var me = this,
            widget;

        me.callParent(arguments);

        widget = me.widget;
        //<debug>
        if (!widget || widget.isComponent) {
            Ext.Error.raise('column.Widget requires a widget configuration.');
        }
        //</debug>
        me.widget = widget = Ext.apply({}, widget);

        // Apply the default UI for the xtype which is going to feature in this column.
        if (!widget.ui) {
            widget.ui = me.getDefaultWidgetUI()[widget.xtype] || 'default';
        }
        me.isFixedSize = Ext.isNumber(widget.width);
    },

    processEvent : function(type, view, cell, recordIndex, cellIndex, e, record, row) {
        var selector = view.innerSelector,
            target;
         
        if (this.stopSelection && type === 'click') {
            // Grab the target that matches the cell inner selector. If we have a target, then,
            // that means we either clicked on the inner part or the widget inside us. If 
            // target === e.target, then it was on the cell, so it's ok. Otherwise, inside so
            // prevent the selection from happening
            target = e.getTarget(selector);
            if (target && target !== e.target) {
                return false;
            }
        }
    },

    beforeRender: function() {
        var me = this,
            tdCls = me.tdCls,
            widget;

        me.listenerScopeFn = function (defaultScope) {
            if (defaultScope === 'this') {
                return this;
            }
            return me.resolveListenerScope(defaultScope);
        };

        me.liveWidgets = {};
        me.cachedStyles = {};
        me.freeWidgetStack = [widget = me.getFreeWidget()];

        tdCls = tdCls ? tdCls + ' ' : '';
        me.tdCls = tdCls + widget.getTdCls();
        me.setupViewListeners(me.getView());
        me.callParent();
    },

    afterRender: function() {
        var view = this.getView();

        this.callParent();
        // View already ready, means we were added later so go and set up our widgets, but if the grid
        // is reconfiguring, then the column will be rendered & the view will be ready, so wait until
        // the reconfigure forces a refresh
        if (view && view.viewReady && !view.ownerGrid.reconfiguring) {
            this.onViewRefresh(view, view.getViewRange());
        }
    },

    // Cell must be left blank
    defaultRenderer: Ext.emptyFn, 

    updater: function(cell, value, record) {
        this.updateWidget(record);
    },

    onResize: function(newWidth) {
        var me = this,
            liveWidgets = me.liveWidgets,
            view = me.getView(),
            id, cell;

        if (!me.isFixedSize && me.rendered && view && view.viewReady) {
            cell = view.getEl().down(me.getCellInnerSelector());
            if (cell) {
                // Subtract innerCell padding width
                newWidth -= parseInt(me.getCachedStyle(cell, 'padding-left'), 10) + parseInt(me.getCachedStyle(cell, 'padding-right'), 10);

                for (id in liveWidgets) {
                    liveWidgets[id].setWidth(newWidth);
                }
            }
        }
    },

    onAdded: function() {
        var me = this,
            view;

        me.callParent(arguments);

        view = me.getView();

        // If we are being added to a rendered HeaderContainer
        if (view) {
            me.setupViewListeners(view);

            if (view && view.viewReady && me.rendered && view.getEl().down(me.getCellSelector())) {
                // If the view is ready, it means we're already rendered.
                // At this point the view may refresh "soon", however we don't have
                // a way of knowing that the view is pending a refresh, so we need
                // to ensure the widgets get hooked up correctly here
                me.onViewRefresh(view, view.getViewRange());
            }
        }
    },

    onRemoved: function(isDestroying) {
        var me = this,
            liveWidgets = me.liveWidgets,
            viewListeners = me.viewListeners,
            id;

        if (me.rendered) {
            me.viewListeners = viewListeners && Ext.destroy(viewListeners);

            // If we are being removed, we have to move all widget elements into the detached body
            if (!isDestroying) {
                for (id in liveWidgets) {
                    liveWidgets[id].detachFromBody();
                }
            }
        }
        me.callParent(arguments);
    },

    onDestroy: function() {
        var me = this,
            oldWidgetMap = me.liveWidgets,
            freeWidgetStack = me.freeWidgetStack,
            id, widget, i, len;

        if (me.rendered) {
            for (id in oldWidgetMap) {
                widget = oldWidgetMap[id];
                widget.$widgetRecord = widget.$widgetColumn = null;
                delete widget.getWidgetRecord;
                delete widget.getWidgetColumn;
                widget.destroy();
            }
        
            for (i = 0, len = freeWidgetStack.length; i < len; ++i) {
                freeWidgetStack[i].destroy();
            }
        }
        
        me.freeWidgetStack = me.liveWidgets = null;
        
        me.callParent();
    },

    getWidget: function(record) {
        var liveWidgets = this.liveWidgets,
            widget;

        if (record && liveWidgets) {
            widget = liveWidgets[record.internalId];
        }
        return widget || null;
    },

    privates: {
        getCachedStyle: function(el, style) {
            var cachedStyles = this.cachedStyles;
          return cachedStyles[style] || (cachedStyles[style] = Ext.fly(el).getStyle(style));
        },

        getFreeWidget: function() {
            var me = this,
                result = me.freeWidgetStack ? me.freeWidgetStack.pop() : null;

            if (!result) {
                result = Ext.widget(me.widget);

                result.resolveListenerScope = me.listenerScopeFn;
                result.getWidgetRecord = me.widgetRecordDecorator;
                result.getWidgetColumn = me.widgetColumnDecorator;
                result.dataIndex = me.dataIndex;
                result.measurer = me;
                result.ownerCmp = me;
                // The ownerCmp of the widget is the column, which means it will be considered
                // as a layout child, but it isn't really, we always need the layout on the
                // component to run if asked.
                result.isLayoutChild = me.returnFalse;
            }
            return result;
        },

        onBeforeRefresh: function () {
            var liveWidgets = this.liveWidgets,
                id;

            // Because of a memory leak bug in IE 8, we need to handle the dom node here before
            // it is destroyed.
            // See EXTJS-14874.
            for (id in liveWidgets) {
                liveWidgets[id].detachFromBody();
            }
        },

        onItemAdd: function(records, index, items) {
            var me = this,
                view = me.getView(),
                hasAttach = !!me.onWidgetAttach,
                dataIndex = me.dataIndex,
                isFixedSize = me.isFixedSize,
                len = records.length, i,
                record,
                row,
                cell,
                widget,
                el,
                width;

            // Loop through all records added, ensuring that our corresponding cell in each item
            // has a Widget of the correct type in it, and is updated with the correct value from the record.
            if (me.isVisible(true)) {
                for (i = 0; i < len; i++) {
                    record = records[i];
                    if (record.isNonData) {
                        continue;
                    }

                    row = view.getRowFromItem(items[i]);

                    // May be a placeholder with no data row
                    if (row) {
                        cell = row.cells[me.getVisibleIndex()].firstChild;
                        if (!isFixedSize && !width) {
                            width = me.lastBox.width - parseInt(me.getCachedStyle(cell, 'padding-left'), 10) - parseInt(me.getCachedStyle(cell, 'padding-right'), 10);
                        }

                        widget = me.liveWidgets[record.internalId] = me.getFreeWidget();
                        widget.$widgetColumn = me;
                        widget.$widgetRecord = record;

                        // Render/move a widget into the new row
                        Ext.fly(cell).empty();

                        // Call the appropriate setter with this column's data field
                        if (widget.defaultBindProperty && dataIndex) {
                            widget.setConfig(widget.defaultBindProperty, record.get(dataIndex));
                        }
                        
                        if (hasAttach) {
                            Ext.callback(me.onWidgetAttach, me.scope, [me, widget, record], 0, me);
                        }

                        el = widget.el || widget.element;
                        if (el) {
                            cell.appendChild(el.dom);
                            if (!isFixedSize) {
                                widget.setWidth(width);
                            }
                            widget.reattachToBody();
                        } else {
                            if (!isFixedSize) {
                                widget.width = width;
                            }
                            widget.render(cell);
                        }
                    }
                }
            }
        },

        onItemRemove: function(records, index, items) {
            var me = this,
                liveWidgets = me.liveWidgets,
                widget, item, id, len, i;

            if (me.rendered) {

                // Single item or Array.
                items = Ext.Array.from(items);
                len = items.length;

                for (i = 0; i < len; i++) {
                    item = items[i];

                    // If there was a record ID (collapsed placeholder will no longer be 
                    // accessible)... return ousted widget to free stack, and move its element 
                    // to the detached body
                    id = item.getAttribute('data-recordId');
                    if (id && (widget = liveWidgets[id])) {
                        delete liveWidgets[id];
                        me.freeWidgetStack.unshift(widget);
                        widget.$widgetRecord = widget.$widgetColumn = null;
                        widget.detachFromBody();
                    }
                }
            }
        },

        onItemUpdate: function(record, recordIndex, oldItemDom) {
            this.updateWidget(record);
        },

        onViewRefresh: function(view, records) {
            var me = this,
                rows = view.all,
                hasAttach = !!me.onWidgetAttach,
                oldWidgetMap = me.liveWidgets,
                dataIndex = me.dataIndex,
                isFixedSize = me.isFixedSize,
                cell, widget, el, width, recordId,
                itemIndex, recordIndex, record, id, lastBox, dom;

            if (me.isVisible(true)) {
                me.liveWidgets = {};
                Ext.suspendLayouts();
                for (itemIndex = rows.startIndex, recordIndex = 0; itemIndex <= rows.endIndex; itemIndex++, recordIndex++) {
                    record = records[recordIndex];
                    if (record.isNonData) {
                        continue;
                    }

                    recordId = record.internalId;
                    cell = view.getRow(rows.item(itemIndex)).cells[me.getVisibleIndex()].firstChild;

                    // Attempt to reuse the existing widget for this record.
                    widget = me.liveWidgets[recordId] = oldWidgetMap[recordId] || me.getFreeWidget();
                    widget.$widgetRecord = record;
                    widget.$widgetColumn = me;
                    delete oldWidgetMap[recordId];

                    lastBox = me.lastBox;
                    if (lastBox && !isFixedSize && width === undefined) {
                        width = lastBox.width - parseInt(me.getCachedStyle(cell, 'padding-left'), 10) - parseInt(me.getCachedStyle(cell, 'padding-right'), 10);
                    }

                    // Call the appropriate setter with this column's data field
                    if (widget.defaultBindProperty && dataIndex) {
                        widget.setConfig(widget.defaultBindProperty, records[recordIndex].get(dataIndex));
                    }
                    if (hasAttach) {
                        Ext.callback(me.onWidgetAttach, me.scope, [me, widget, record], 0, me);
                    }

                    el = widget.el || widget.element;
                    if (el) {
                        dom = el.dom;
                        if (dom.parentNode !== cell) {
                            Ext.fly(cell).empty();
                            cell.appendChild(el.dom);
                        }
                        if (!isFixedSize) {
                            widget.setWidth(width);
                        }
                        widget.reattachToBody();
                    } else {
                        if (!isFixedSize) {
                            widget.width = width;
                        }
                        Ext.fly(cell).empty();
                        widget.render(cell);
                    }
                }

                Ext.resumeLayouts(true);

                // Free any unused widgets from the old live map.
                // Move them into detachedBody.
                for (id in oldWidgetMap) {
                    widget = oldWidgetMap[id];
                    widget.$widgetRecord = widget.$widgetColumn = null;
                    me.freeWidgetStack.unshift(widget);
                    widget.detachFromBody();
                }
            }
        },

        returnFalse: function() {
            return false;
        },

        setupViewListeners: function(view) {
            var me = this;

            me.viewListeners = view.on({
                refresh: me.onViewRefresh,
                itemupdate: me.onItemUpdate,
                itemadd: me.onItemAdd,
                itemremove: me.onItemRemove,
                scope: me,
                destroyable: true
            });

            if (Ext.isIE8) {
                view.on('beforerefresh', me.onBeforeRefresh, me);
            }
        },

        updateWidget: function(record) {
            var dataIndex = this.dataIndex,
                widget;

            if (this.rendered) {
                widget = this.liveWidgets[record.internalId];
                // Call the appropriate setter with this column's data field
                if (widget && widget.defaultBindProperty && dataIndex) {
                    widget.setConfig(widget.defaultBindProperty, record.get(dataIndex));
                }
            }
        }, 
        
        widgetRecordDecorator: function() {
            return this.$widgetRecord;
        },
        
        widgetColumnDecorator: function() {
            return this.$widgetColumn;
        }
    }
});
