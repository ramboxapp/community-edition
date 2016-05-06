/**
 * @class Ext.view.NavigationModel
 * @private
 * This class listens for key events fired from a {@link Ext.view.View DataView}, and moves the currently focused item
 * by adding the class {@link #focusCls}.
 */
Ext.define('Ext.view.NavigationModel', {
    mixins: [
        'Ext.util.Observable',
        'Ext.mixin.Factoryable'
    ],

    alias: 'view.navigation.default',

    /**
     * @event navigate Fired when a key has been used to navigate around the view.
     * @param {Object} event
     * @param {Ext.event.Event} keyEvent The key event which caused the navigation.
     * @param {Number} event.previousRecordIndex The previously focused record index.
     * @param {Ext.data.Model} event.previousRecord The previously focused record.
     * @param {HTMLElement} event.previousItem The previously focused view item.
     * @param {Number} event.recordIndex The newly focused record index.
     * @param {Ext.data.Model} event.record the newly focused record.
     * @param {HTMLElement} event.item the newly focused view item.
     */

    /**
     * @private
     */
    focusCls: Ext.baseCSSPrefix + 'view-item-focused',

    constructor: function() {
        this.mixins.observable.constructor.call(this);
    },

    bindComponent: function(view) {
        if (this.view !== view) {
            this.view = view;
            this.bindView(view);
        }
    },

    bindView: function(view) {
        var me = this,
            dataSource = view.dataSource,
            listeners;


        me.initKeyNav(view);
        if (me.dataSource !== dataSource) {
            me.dataSource = dataSource;
            listeners = me.getStoreListeners();
            listeners.destroyable = true;
            me.dataSourceListeners = view.dataSource.on(listeners);
        }
        listeners = me.getViewListeners();
        listeners.destroyable = true;
        me.viewListeners = me.viewListeners || [];
        me.viewListeners.push(view.on(listeners));
    },

    getStoreListeners: function() {
        var me = this;

        return {
            clear: me.onStoreClear,
            remove: me.onStoreRemove,
            scope: me
        };
    },

    getViewListeners: function() {
        var me = this;

        return {
            containermousedown: me.onContainerMouseDown,
            itemmousedown: me.onItemMouseDown,

            // We focus on click if the mousedown handler did not focus because it was a translated "touchstart" event.
            itemclick: me.onItemClick,
            itemcontextmenu: me.onItemMouseDown,
            scope: me
        };
    },

    initKeyNav: function(view) {
        var me = this;

        // Drive the KeyNav off the View's itemkeydown event so that beforeitemkeydown listeners may veto.
        // By default KeyNav uses defaultEventAction: 'stopEvent', and this is required for movement keys
        // which by default affect scrolling.
        me.keyNav = new Ext.util.KeyNav({
            target: view,
            ignoreInputFields: true,
            eventName: 'itemkeydown',
            defaultEventAction: 'stopEvent',
            processEvent: me.processViewEvent,
            up: me.onKeyUp,
            down: me.onKeyDown,
            right: me.onKeyRight,
            left: me.onKeyLeft,
            pageDown: me.onKeyPageDown,
            pageUp: me.onKeyPageUp,
            home: me.onKeyHome,
            end: me.onKeyEnd,
            tab: me.onKeyTab,
            space: me.onKeySpace,
            enter: me.onKeyEnter,
            A: {
                ctrl: true,
                // Need a separate function because we don't want the key
                // events passed on to selectAll (causes event suppression).
                handler: me.onSelectAllKeyPress
            },
            scope: me
        });
    },

    processViewEvent: function(view, record, node, index, event) {
        return event;
    },

    addKeyBindings: function(binding) {
        this.keyNav.addBindings(binding);
    },

    enable: function() {
        this.keyNav.enable();
        this.disabled = false;
    },

    disable: function() {
        this.keyNav.disable();
        this.disabled = true;
    },

    onContainerMouseDown: function(view, mousedownEvent) {
        // If already focused, do not disturb the focus.
        if (this.view.containsFocus) {
            mousedownEvent.preventDefault();
        }
    },

    onItemMouseDown: function(view, record, item, index, mousedownEvent) {
        var parentEvent = mousedownEvent.parentEvent;

        // If the ExtJS mousedown event is a translated touchstart, leave it until the click to focus
        if (!parentEvent || parentEvent.type !== 'touchstart') {
            this.setPosition(index);
        }
    },

    onItemClick: function(view, record, item, index, clickEvent) {
        // If the mousedown that initiated the click has navigated us to the correct spot, just fire the event
        if (this.record === record) {
            this.fireNavigateEvent(clickEvent);
        } else {
            this.setPosition(index, clickEvent);
        }
    },

    /**
     * @template
     * @protected
     * Called by {@link Ext.view.AbstractView#method-refresh} before refresh to allow
     * the current focus position to be cached.
     */
    beforeViewRefresh: function() {
        this.focusRestorePosition = this.view.dataSource.isBufferedStore ? this.recordIndex : this.record;
    },

    /**
     * @template
     * @protected
     * Called by {@link Ext.view.AbstractView#method-refresh} after refresh to allow
     * cached focus position to be restored.
     */
    onViewRefresh: function() {
        if (this.focusRestorePosition != null) {
            this.setPosition(this.focusRestorePosition);
            this.focusRestorePosition = null;
        }
    },

    // Store clearing removes focus
    onStoreClear: function() {
        this.setPosition();
    },

    // On record remove, it might have bumped the selection upwards.
    // Pass the "preventSelection" flag.
    onStoreRemove: function() {
        this.setPosition(this.getRecord(), null, null, true);
    },

    setPosition: function(recordIndex, keyEvent, suppressEvent, preventNavigation) {
        var me = this,
            view = me.view,
            selModel = view.getSelectionModel(),
            dataSource = view.dataSource,
            newRecord,
            newRecordIndex;

        if (recordIndex == null || !view.all.getCount()) {
            me.record = me.recordIndex = null;
        } else {
            if (typeof recordIndex === 'number') {
                newRecordIndex = Math.max(Math.min(recordIndex, dataSource.getCount() - 1), 0);
                newRecord = dataSource.getAt(recordIndex);
            }
            // row is a Record
            else if (recordIndex.isEntity) {
                newRecord = dataSource.getById(recordIndex.id);
                newRecordIndex = dataSource.indexOf(newRecord);

                // Previous record is no longer present; revert to first.
                if (newRecordIndex === -1) {
                    newRecord = dataSource.getAt(0);
                    newRecordIndex = 0;
                }
            }
            // row is a view item
            else if (recordIndex.tagName) {
                newRecord = view.getRecord(recordIndex);
                newRecordIndex = dataSource.indexOf(newRecord);
            }
            else {
                newRecord = newRecordIndex = null;
            }
        }

        // No change; just ensure the correct item is focused and return early.
        // Do not push current position into previous position, do not fire events.
        // We must check record instances, not indices because of store reloads (combobox remote filtering).
        // If there's a new record, focus it. Note that the index may be different even though
        // the record is the same (filtering, sorting)
        if (newRecord === me.record) {
            me.recordIndex = newRecordIndex;
            return me.focusPosition(newRecordIndex);
        }

        if (me.item) {
            me.item.removeCls(me.focusCls);
        }

        // Track the last position.
        // Used by SelectionModels as the navigation "from" position.
        me.previousRecordIndex = me.recordIndex;
        me.previousRecord = me.record;
        me.previousItem = me.item;

        // Update our position
        me.recordIndex = newRecordIndex;
        me.record      = newRecord;

        // Prevent navigation if focus has not moved
        preventNavigation = preventNavigation || me.record === me.lastFocused;

        // Maintain lastFocused, so that on non-specific focus of the View, we can focus the correct descendant.
        if (newRecord) {
            me.focusPosition(me.recordIndex);
        } else {
            me.item = null;
        }

        if (!suppressEvent) {
            selModel.fireEvent('focuschange', selModel, me.previousRecord, me.record);
        }

        // If we have moved, fire an event
        if (!preventNavigation && keyEvent) {
            me.fireNavigateEvent(keyEvent);
        }
    },

    /**
     * @private
     * Focuses the currently active position.
     * This is used on view refresh and on replace.
     */
    focusPosition: function(recordIndex) {
        var me = this;

        if (recordIndex != null && recordIndex !== -1) {
            if (recordIndex.isEntity) {
                recordIndex = me.view.dataSource.indexOf(recordIndex);
            }
            me.item = me.view.all.item(recordIndex);
            if (me.item) {
                me.lastFocused = me.record;
                me.lastFocusedIndex = me.recordIndex;
                me.focusItem(me.item);
            } else {
                me.record = null;
            }
        } else {
            me.item = null;
        }
    },

    /**
     * @template
     * @protected
     * Called to focus an item in the client {@link Ext.view.View DataView}.
     * The default implementation adds the {@link #focusCls} to the passed item focuses it.
     * Subclasses may choose to keep focus in another target.
     *
     * For example {@link Ext.view.BoundListKeyNav} maintains focus in the input field.
     * @param {Ext.dom.Element} item
     * @return {undefined}
     */
    focusItem: function(item) {
        item.addCls(this.focusCls);
        item.focus();
    },

    getPosition: function() {
        return this.record ? this.recordIndex : null;
    },

    getRecordIndex: function() {
        return this.recordIndex;
    },

    getItem: function() {
        return this.item;
    },

    getRecord: function() {
        return this.record;
    },

    getLastFocused: function() {
        // No longer there. The caller must fall back to a default.
        if (this.view.dataSource.indexOf(this.lastFocused) === -1) {
            return null;
        }
        return this.lastFocused;
    },

    onKeyUp: function(keyEvent) {
        var newPosition = this.recordIndex - 1;
        if (newPosition < 0) {
            newPosition = this.view.all.getCount() - 1;
        }
        this.setPosition(newPosition, keyEvent);
    },

    onKeyDown: function(keyEvent) {
        var newPosition = this.recordIndex + 1;
        if (newPosition > this.view.all.getCount() - 1) {
            newPosition = 0;
        }
        this.setPosition(newPosition, keyEvent);
    },
    
    onKeyRight: function(keyEvent) {
        var newPosition = this.recordIndex + 1;
        if (newPosition > this.view.all.getCount() - 1) {
            newPosition = 0;
        }
        this.setPosition(newPosition, keyEvent);
    },
    
    onKeyLeft: function(keyEvent) {
        var newPosition = this.recordIndex - 1;
        if (newPosition < 0) {
            newPosition = this.view.all.getCount() - 1;
        }
        this.setPosition(newPosition, keyEvent);
    },
    
    onKeyPageDown: Ext.emptyFn,
    
    onKeyPageUp: Ext.emptyFn,
    
    onKeyHome: function(keyEvent) {
        this.setPosition(0, keyEvent);
    },
    
    onKeyEnd: function(keyEvent) {
        this.setPosition(this.view.all.getCount() - 1, keyEvent);
    },
    
    // As per WAI-ARIA requirements, a grid should support two modes: Navigable (default),
    // and Actionable. In Navigable mode, pressing Tab key inside the grid should move focus
    // to the next tabbable element outside the grid. In Actionable mode, pressing Tab key
    // should move focus to the next tabbable/actionable element within the grid, wrapping over
    // row end to the next row, and over last row end to the first row.
    // See http://www.w3.org/TR/2013/WD-wai-aria-practices-20130307/#grid
    // In this method we implement the first (Navigable) part, which is shared between
    // Grids and Views.
    onKeyTab: function(keyEvent) {
        var view = this.view;
        
        // To prevent Tab key from moving focus to the next element inside the grid
        // in Navigable mode, we make all elements untabbable so the focus flows out
        // following the natural tab order.
        view.toggleChildrenTabbability(false);
        
        // Enable further event propagation
        return true;
    },
    
    onKeySpace: function(keyEvent) {
        this.fireNavigateEvent(keyEvent);
    },

    // ENTER emulates an itemclick event at the View level
    onKeyEnter: function(keyEvent) {
        // Stop the keydown event so that an ENTER keyup does not get delivered to
        // any element which focus is transferred to in a click handler.
        keyEvent.stopEvent();
        keyEvent.view.fireEvent('itemclick', keyEvent.view, keyEvent.record, keyEvent.item, keyEvent.recordIndex, keyEvent);
    },

    onSelectAllKeyPress: function(keyEvent) {
        this.fireNavigateEvent(keyEvent);
    },

    fireNavigateEvent: function(keyEvent) {
        var me = this;

        me.fireEvent('navigate', {
            navigationModel: me,
            keyEvent: keyEvent,
            previousRecordIndex: me.previousRecordIndex,
            previousRecord: me.previousRecord,
            previousItem: me.previousItem, 
            recordIndex: me.recordIndex,
            record: me.record,
            item: me.item
        });
    },

    destroy: function() {
        var me = this;
        Ext.destroy(me.dataSourceListeners, me.viewListeners, me.keyNav);
        me.keyNav = me.dataSourceListeners = me.viewListeners = me.dataSource = null;
        me.callParent();
    }
});