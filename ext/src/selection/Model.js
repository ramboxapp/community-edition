/**
 * Tracks what records are currently selected in a data-bound component.
 *
 * This is an abstract class and is not meant to be directly used. Databound UI widgets such as
 * {@link Ext.grid.Panel Grid} and {@link Ext.tree.Panel Tree} should subclass Ext.selection.Model
 * and provide a way to binding to the component.
 *
 * The abstract method `onSelectChange` should be implemented in these
 * subclasses to update the UI widget.
 */
Ext.define('Ext.selection.Model', {
    extend: 'Ext.mixin.Observable',
    alternateClassName: 'Ext.AbstractSelectionModel',
    mixins: [
        'Ext.util.StoreHolder',
        'Ext.mixin.Factoryable'
    ],
    alias: 'selection.abstract',

    factoryConfig: {
        // Need to override the defaultType, otherwise this class would be the default, and it is an abstract base.
        defaultType: 'dataviewmodel'
    },

    // We do not want "_hidden" style backing properties.
    $configPrefixed: false,
    // We also want non-config system properties to go to the instance.
    $configStrict: false,

    config: {
        /**
         * @private
         * The {@link Ext.data.Store store} in which this selection model represents the selected subset.
         */
        store: null,

        /**
         * @private
         * The {@link Ext.util.Collection} to use as the collection of selected records.
         */
        selected: {}
    },

    // lastSelected

    /**
     * @property {Boolean} isSelectionModel
     * `true` in this class to identify an object as an instantiated {@link Ext.selection.Model selection model}, or subclass thereof.
     */
    isSelectionModel: true,

    /**
     * @cfg {"SINGLE"/"SIMPLE"/"MULTI"} mode
     * Mode of selection.  Valid values are:
     *
     * - **"SINGLE"** - Only allows selecting one item at a time.  Use {@link #allowDeselect} to allow
     *   deselecting that item.  Also see {@link #toggleOnClick}. This is the default.
     * - **"SIMPLE"** - Allows simple selection of multiple items one-by-one. Each click in grid will either
     *   select or deselect an item.
     * - **"MULTI"** - Allows complex selection of multiple items using Ctrl and Shift keys.
     */

    /**
     * @cfg {Boolean} allowDeselect
     * Allow users to deselect a record in a DataView, List or Grid.
     * Only applicable when the {@link #mode} is 'SINGLE'.
     */
    allowDeselect: undefined,
    
    /**
     * @cfg {Boolean} toggleOnClick
     * `true` to toggle the selection state of an item when clicked.
     * Only applicable when the {@link #mode} is 'SINGLE'.
     * Only applicable when the {@link #allowDeselect} is 'true'.
     */
    toggleOnClick: true,

    /**
     * @private
     * @property {Ext.util.Collection} selected
     * A MixedCollection that maintains all of the currently selected records.
     * @readonly
     */
    selected: null,

    /**
     * @cfg {Boolean} [pruneRemoved=true]
     * Remove records from the selection when they are removed from the store.
     *
     * **Important:** When using {@link Ext.toolbar.Paging paging} or a {@link Ext.data.BufferedStore},
     * records which are cached in the Store's {@link Ext.data.Store#property-data data collection} may be removed from the Store when pages change,
     * or when rows are scrolled out of view. For this reason `pruneRemoved` should be set to `false` when using a buffered Store.
     *
     * Also, when previously pruned pages are returned to the cache, the records objects in the page will be
     * *new instances*, and will not match the instances in the selection model's collection. For this reason,
     * you MUST ensure that the Model definition's {@link Ext.data.Model#idProperty idProperty} references a unique
     * key because in this situation, records in the Store have their **IDs** compared to records in the SelectionModel
     * in order to re-select a record which is scrolled back into view.
     */
    pruneRemoved: true,
    
    suspendChange: 0,

    /**
     * @cfg {Boolean} [ignoreRightMouseSelection=false]
     * True to ignore selections that are made when using the right mouse button if there are
     * records that are already selected. If no records are selected, selection will continue
     * as normal
     */
    ignoreRightMouseSelection: false,

    /**
     * @event selectionchange
     * Fired after a selection change has occurred
     * @param {Ext.selection.Model} this
     * @param {Ext.data.Model[]} selected The selected records
     */

    /**
     * @event focuschange
     * Fired when a row is focused
     * @param {Ext.selection.Model} this
     * @param {Ext.data.Model} oldFocused The previously focused record
     * @param {Ext.data.Model} newFocused The newly focused record
     */
    
    constructor: function(cfg) {
        var me = this;
        
        me.modes = {
            SINGLE: true,
            SIMPLE: true,
            MULTI: true
        };

        me.callParent([cfg]);

        // sets this.selectionMode
        me.setSelectionMode(me.mode);
        if (me.selectionMode !== 'SINGLE') {		
            me.allowDeselect = true;		
        }
    },

    updateStore: function(store, oldStore) {
        this.bindStore(store, !oldStore);
    },

    applySelected: function(selected) {
        if (!selected.isCollection) {
            selected = new Ext.util.Collection(Ext.apply({
                rootProperty: 'data'
            }, selected));
        }
        return selected;
    },

    // On bind of a new store, we need to refresh against what is in the new store.
    onBindStore: function(store, initial) {
        var me = this;

        me.mixins.storeholder.onBindStore.call(me, [store, initial]);
        if (store && !me.preventRefresh) {
            me.refresh();
        }
    },

    getStoreListeners: function() {
        var me = this;
        return {
            add: me.onStoreAdd,
            clear: me.onStoreClear,
            remove: me.onStoreRemove,
            update: me.onStoreUpdate,
            idchanged: me.onIdChanged,
            load: me.onStoreLoad,
            refresh: me.onStoreRefresh,

            // BufferedStore events
            pageadd: me.onPageAdd,
            pageremove: me.onPageRemove
        };
    },
    
    suspendChanges: function(){
        ++this.suspendChange;
    },
    
    resumeChanges: function(){
        if (this.suspendChange) {
            --this.suspendChange;
        }
    },

    /**
     * Selects all records in the view.
     * @param {Boolean} suppressEvent True to suppress any select events
     */
    selectAll: function(suppressEvent) {
        var me = this,
            selections = me.store.getRange(),
            start = me.getSelection().length;

        me.suspendChanges();
        me.doSelect(selections, true, suppressEvent);
        me.resumeChanges();
        // fire selection change only if the number of selections differs
        if (!suppressEvent && !me.isDestroyed) {
            me.maybeFireSelectionChange(me.getSelection().length !== start);
        }
    },

    /**
     * Deselects all records in the view.
     * @param {Boolean} [suppressEvent] True to suppress any deselect events
     */
    deselectAll: function(suppressEvent) {
        var me = this,
            selections = me.getSelection(),
            selIndexes = {},
            store = me.store,
            start = selections.length,
            i, l, rec;

        // Cache selection records' indexes first to avoid
        // looking them up on every sort comparison below.
        // We can't rely on store.indexOf being fast because
        // for whatever reason the Store in question may force
        // sequential index lookup, which will result in O(n^2)
        // sort performance below.
        for (i = 0, l = selections.length; i < l; i++) {
            rec = selections[i];
            
            selIndexes[rec.id] = store.indexOf(rec);
        }
        
        // Sort the selections so that the events fire in
        // a predictable order like selectAll
        selections = Ext.Array.sort(selections, function(r1, r2){
            var idx1 = selIndexes[r1.id],
                idx2 = selIndexes[r2.id];
            
            // Don't check for equality since indexes will be unique
            return idx1 < idx2 ? -1 : 1;
        });
        
        me.suspendChanges();
        me.doDeselect(selections, suppressEvent);
        me.resumeChanges();
        // fire selection change only if the number of selections differs
        if (!suppressEvent && !me.isDestroyed) {
            me.maybeFireSelectionChange(me.getSelection().length !== start);
        }
    },

    getSelectionStart: function () {
        return this.selectionStart;
    },

    setSelectionStart: function (selection) {
        this.selectionStart = selection;
    },

    // Provides differentiation of logic between MULTI, SIMPLE and SINGLE
    // selection modes. Requires that an event be passed so that we can know
    // if user held ctrl or shift.
    selectWithEvent: function(record, e) {
        var me = this,
            isSelected = me.isSelected(record),
            shift = e.shiftKey;

        switch (me.selectionMode) {
            case 'MULTI':
                me.selectWithEventMulti(record, e, isSelected);
                break;
            case 'SIMPLE':
                me.selectWithEventSimple(record, e, isSelected);
                break;
            case 'SINGLE':
                me.selectWithEventSingle(record, e, isSelected);
                break;
        }

        // selectionStart is a start point for shift/mousedown to create a range from.
        // If the mousedowned record was not already selected, then it becomes the
        // start of any range created from now on.
        // If we drop to no records selected, then there is no range start any more.
        if (!shift) {
            if (me.isSelected(record)) {
                me.selectionStart = record;
            } else {
                me.selectionStart = null;
            }
        }
    },

    /**
     * Checks whether a selection should proceed based on the ignoreRightMouseSelection
     * option.
     * @private
     * @param {Ext.event.Event} e The event
     * @return {Boolean} `true` if the selection should not proceed.
     */
    vetoSelection: function(e) {
        if (e.type !== 'keydown' && e.button !== 0) {
            if (this.ignoreRightMouseSelection || this.isSelected(e.record)) {
                return true;
            }
        } else {
            return e.type === 'mousedown';
        }
    },

    // Private
    // Called in response to a FocusModel's navigate event when a new record has been navigated to.
    // Event is passed so that shift and ctrl can be handled.
    onNavigate: function(e) {
        // Enforce the ignoreRightMouseSelection setting.
        // Enforce presence of a record.
        // Enforce selection upon click, not mousedown.
        if (!e.record || this.vetoSelection(e.keyEvent)) {
            return;
        }

        this.onBeforeNavigate(e);

        var me = this,
            keyEvent = e.keyEvent,
            // ctrlKey may be set on the event if we want to treat it like a ctrlKey so
            // we don't mutate the original event object
            ctrlKey = keyEvent.ctrlKey || e.ctrlKey,
            recIdx = e.recordIndex,
            record = e.record,
            lastFocused = e.previousRecord,
            isSelected = me.isSelected(record),
            from = (me.selectionStart && me.isSelected(e.previousRecord)) ? me.selectionStart : (me.selectionStart = e.previousRecord),
            fromIdx = e.previousRecordIndex,
            key = keyEvent.getCharCode(),
            isSpace = key === keyEvent.SPACE,
            direction = key === keyEvent.UP || key === keyEvent.PAGE_UP ? 'up' : (key === keyEvent.DOWN || key === keyEvent.DOWN ? 'down' : null);

        switch (me.selectionMode) {
            case 'MULTI':
                me.setSelectionStart(e.selectionStart);

                if (key === keyEvent.A && ctrlKey) {
                    // Listening to endUpdate on the Collection will be more efficient
                    me.selected.beginUpdate();
                    me.selectRange(0, me.store.getCount() - 1);
                    me.selected.endUpdate();
                }
                else if (isSpace) {
                    // SHIFT+SPACE, select range
                    if (keyEvent.shiftKey) {
                        me.selectRange(from, record, ctrlKey);
                    } else {
                        // SPACE pressed on a selected item: deselect.
                        if (isSelected) {
                            if (me.allowDeselect) {
                                me.doDeselect(record);
                            }
                        }
                        // SPACE on an unselected item: select it
                        // keyEvent.ctrlKey means "keep existing"
                        else {
                            me.doSelect(record, ctrlKey);
                        }
                    }
                }

                // SHIFT-navigate selects intervening rows from the last selected (or last focused) item and target item
                else if (keyEvent.shiftKey && from) {

                    // If we are heading back TOWARDS the start rec - deselect skipped range...
                    if (direction === 'up' && fromIdx <= recIdx) {
                        me.deselectRange(lastFocused, recIdx + 1);
                    }
                    else if (direction === 'down' && fromIdx >= recIdx) {
                        me.deselectRange(lastFocused, recIdx - 1);
                    }

                    // If we are heading AWAY from start point, or no CTRL key, so just select the range and let the CTRL control "keepExisting"...
                    else if (from !== record) {
                        me.selectRange(from, record, ctrlKey);
                    }
                    me.lastSelected = record;
                }

                else if (key) {
                    if (!ctrlKey) {
                        me.doSelect(record, false);
                    }
                } else {
                    me.selectWithEvent(record, keyEvent);
                }
                break;
            case 'SIMPLE':
                if (key === keyEvent.A && ctrlKey) {
                    // Listening to endUpdate on the Collection will be more efficient
                    me.selected.beginUpdate();
                    me.selectRange(0, me.store.getCount() - 1);
                    me.selected.endUpdate();
                } else if (isSelected) {
                    me.doDeselect(record);
                } else {
                    me.doSelect(record, true);
                }
                break;
            case 'SINGLE':
                // Arrow movement
                if (direction) {
                    // CTRL-navigation does not select
                    if (!ctrlKey) {
                        me.doSelect(record, false);
                    }
                }
                // Space or click
                else {
                    if (isSelected) {
                        // Deselect if we're allowed
                        if (me.allowDeselect) {
                            me.doDeselect(record);
                        }
                    } else {
                        // select the record and do NOT maintain existing selections
                        me.doSelect(record);
                    }
                }
        }

        // selectionStart is a start point for shift/mousedown to create a range from.
        // If the mousedowned record was not already selected, then it becomes the
        // start of any range created from now on.
        // If we drop to no records selected, then there is no range start any more.
        if (!keyEvent.shiftKey && !me.isDestroyed) {
            if (me.isSelected(record)) {
                me.selectionStart = record;
            }
        }
    },

    /**
     * Selects a range of rows if the selection model {@link #isLocked is not locked}.
     * All rows in between startRow and endRow are also selected.
     * @param {Ext.data.Model/Number} startRow The record or index of the first row in the range
     * @param {Ext.data.Model/Number} endRow The record or index of the last row in the range
     * @param {Boolean} keepExisting (optional) True to retain existing selections
     */
    selectRange: function(startRow, endRow, keepExisting) {
        var me = this,
            store = me.store,
            selected = me.selected.items,
            result, i, len, toSelect, toDeselect, idx, rec;

        if (me.isLocked()){
            return;
        }

        result = me.normalizeRowRange(startRow, endRow);
        startRow = result[0];
        endRow = result[1];

        toSelect = [];
        for (i = startRow; i <= endRow; i++){
            if (!me.isSelected(store.getAt(i))) {
                toSelect.push(store.getAt(i));
            }
        }
        
        if (!keepExisting) {
            // prevent selectionchange from firing
            toDeselect = [];
            me.suspendChanges();
            
            for (i = 0, len = selected.length; i < len; ++i) {
                rec = selected[i];
                idx = store.indexOf(rec);
                if (idx < startRow || idx > endRow) {
                    toDeselect.push(rec);
                }
            }
            
            for (i = 0, len = toDeselect.length; i < len; ++i) {
                me.doDeselect(toDeselect[i]);
            }
            me.resumeChanges();
        }
        
        if (!me.isDestroyed) {
            if (toSelect.length) {
                me.doMultiSelect(toSelect, true);
            } else if (toDeselect) {
                me.maybeFireSelectionChange(toDeselect.length > 0);
            }
        }
    },

    /**
     * Deselects a range of rows if the selection model {@link #isLocked is not locked}.
     * @param {Ext.data.Model/Number} startRow The record or index of the first row in the range
     * @param {Ext.data.Model/Number} endRow The record or index of the last row in the range
     */
    deselectRange : function(startRow, endRow) {
        var me = this,
            store = me.store,
            result, i, toDeselect, record;

        if (me.isLocked()){
            return;
        }

        result = me.normalizeRowRange(startRow, endRow);
        startRow = result[0];
        endRow = result[1];

        toDeselect = [];
        for (i = startRow; i <= endRow; i++) {
            record = store.getAt(i);
            if (me.isSelected(record)) {
                toDeselect.push(record);
            }
        }
        if (toDeselect.length) {
            me.doDeselect(toDeselect);
        }
    },
    
    normalizeRowRange: function(startRow, endRow) {
        var store = this.store,
            tmp;
        
        if (!Ext.isNumber(startRow)) {
            startRow = store.indexOf(startRow);
        }
        startRow = Math.max(0, startRow);
        
        if (!Ext.isNumber(endRow)) {
            endRow = store.indexOf(endRow);
        }
        endRow = Math.min(endRow, store.getCount() - 1);
        
        // swap values
        if (startRow > endRow){
            tmp = endRow;
            endRow = startRow;
            startRow = tmp;
        }    
        
        return [startRow, endRow];
    },

    /**
     * Selects a record instance by record instance or index.
     * @param {Ext.data.Model[]/Number} records An array of records or an index
     * @param {Boolean} [keepExisting=false] True to retain existing selections
     * @param {Boolean} [suppressEvent=false] True to not fire a select event
     */
    select: function(records, keepExisting, suppressEvent) {
        // Automatically selecting eg store.first() or store.last() will pass undefined, so that must just return;
        if (Ext.isDefined(records) && !(Ext.isArray(records) && !records.length)) {
            this.doSelect(records, keepExisting, suppressEvent);
        }
    },

    /**
     * Deselects a record instance by record instance or index.
     * @param {Ext.data.Model[]/Number} records An array of records or an index
     * @param {Boolean} [suppressEvent=false] True to not fire a deselect event
     */
    deselect: function(records, suppressEvent) {
        this.doDeselect(records, suppressEvent);
    },

    doSelect: function(records, keepExisting, suppressEvent) {
        var me = this,
            record;

        if (me.locked) {
            return;
        }
        if (typeof records === "number") {
            record = me.store.getAt(records);
            // No matching record, jump out
            if (!record) {
                return;
            }
            records = [record];
        }
        if (me.selectionMode === "SINGLE" && records) {
            record = records.length ? records[0] : records;
            me.doSingleSelect(record, suppressEvent);
        } else {
            me.doMultiSelect(records, keepExisting, suppressEvent);
        }
    },

    doMultiSelect: function(records, keepExisting, suppressEvent) {
        var me = this,
            selected = me.selected,
            change = false,
            result, i, len, record, commit;

        if (me.locked) {
            return;
        }

        records = !Ext.isArray(records) ? [records] : records;
        len = records.length;
        if (!keepExisting && selected.getCount() > 0) {
            result = me.deselectDuringSelect(records, suppressEvent);
            if (me.isDestroyed) {
                return;
            }
            if (result[0]) {
                // We had a failure during selection, so jump out
                // Fire selection change if we did deselect anything
                me.maybeFireSelectionChange(result[1] > 0 && !suppressEvent);
                return;
            } else {
                // Means something has been deselected, so we've had a change
                change = result[1] > 0;
            }
        }

        commit = function() {
            if (!selected.getCount()) {
                me.selectionStart = record;
            }
            selected.add(record);
            change = true;
        };

        for (i = 0; i < len; i++) {
            record = records[i];
            if (me.isSelected(record)) {
                continue;
            }

            me.onSelectChange(record, true, suppressEvent, commit);
            if (me.isDestroyed) {
                return;
            }
        }
        me.lastSelected = record;

        // fire selchange if there was a change and there is no suppressEvent flag
        me.maybeFireSelectionChange(change && !suppressEvent);
    },
    
    deselectDuringSelect: function(toSelect, suppressEvent) {
        var me = this,
            selected = me.selected.getRange(),
            len = selected.length,
            changed = 0,
            failed = false,
            item, i;
            
        // Prevent selection change events from firing, will happen during select
        me.suspendChanges();
        me.deselectingDuringSelect = true;
        for (i = 0; i < len; ++i) {
            item = selected[i];
            if (!Ext.Array.contains(toSelect, item)) {
                if (me.doDeselect(item, suppressEvent)) {
                    ++changed;
                } else {
                    failed = true;
                }
            }
            if (me.isDestroyed) {
                failed = true;
                changed = 0;
                break;
            }
        }
        me.deselectingDuringSelect = false;
        me.resumeChanges();
        
        return [failed, changed];
    },

    // records can be an index, a record or an array of records
    doDeselect: function(records, suppressEvent) {
        var me = this,
            selected = me.selected,
            i = 0,
            len, record,
            attempted = 0,
            accepted = 0,
            commit;

        if (me.locked || !me.store) {
            return false;
        }

        if (typeof records === "number") {
            // No matching record, jump out
            record = me.store.getAt(records);
            if (!record) {
                return false;
            }
            records = [record];
        } else if (!Ext.isArray(records)) {
            records = [records];
        }

        commit = function() {
            ++accepted;
            selected.remove(record);
            if (record === me.selectionStart) {
                me.selectionStart = null;
            }
        };

        len = records.length;

        me.suspendChanges();
        for (; i < len; i++) {
            record = records[i];
            if (me.isSelected(record)) {
                if (me.lastSelected === record) {
                    me.lastSelected = selected.last();
                }
                ++attempted;
                me.onSelectChange(record, false, suppressEvent, commit);
                if (me.isDestroyed) {
                    return false;
                }
            }
        }
        me.resumeChanges();

        // fire selchange if there was a change and there is no suppressEvent flag
        me.maybeFireSelectionChange(accepted > 0 && !suppressEvent);
        return accepted === attempted;
    },

    doSingleSelect: function(record, suppressEvent) {
        var me = this,
            changed = false,
            selected = me.selected,
            commit;

        if (me.locked) {
            return;
        }
        // already selected.
        // should we also check beforeselect?
        if (me.isSelected(record)) {
            return;
        }

        commit = function() {
            // Deselect previous selection.
            if (selected.getCount()) {
                me.suspendChanges();
                var result = me.deselectDuringSelect([record], suppressEvent);
                if (me.isDestroyed) {
                    return;
                }
                me.resumeChanges();
                if (result[0]) {
                    // Means deselection failed, so abort
                    return false;
                }
            }

            me.lastSelected = record;
            if (!selected.getCount()) {
                me.selectionStart = record;
            }
            selected.add(record);
            changed = true;
        };

        me.onSelectChange(record, true, suppressEvent, commit);

        if (changed && !me.isDestroyed) {
            me.maybeFireSelectionChange(!suppressEvent);
        }
    },

    // fire selection change as long as true is not passed
    // into maybeFireSelectionChange
    maybeFireSelectionChange: function(fireEvent) {
        var me = this;
        if (fireEvent && !me.suspendChange) {
            me.fireEvent('selectionchange', me, me.getSelection());
        }
    },

    /**
     * @private
     * @return {Ext.data.Model} Returns the last selected record.
     */
    getLastSelected: function() {
        return this.lastSelected;
    },

    /**
     * Returns an array of the currently selected records.
     * @return {Ext.data.Model[]} The selected records
     */
    getSelection: function() {
        return this.selected.getRange();
    },

    /**
     * Returns the current selectionMode.
     * @return {String} The selectionMode: 'SINGLE', 'MULTI' or 'SIMPLE'.
     */
    getSelectionMode: function() {
        return this.selectionMode;
    },

    /**
     * Sets the current selectionMode.
     * @param {String} selMode 'SINGLE', 'MULTI' or 'SIMPLE'.
     */
    setSelectionMode: function(selMode) {
        selMode = selMode ? selMode.toUpperCase() : 'SINGLE';
        // set to mode specified unless it doesnt exist, in that case
        // use single.
        this.selectionMode = this.modes[selMode] ? selMode : 'SINGLE';
    },

    /**
     * Returns true if the selections are locked.
     * @return {Boolean}
     */
    isLocked: function() {
        return this.locked;
    },

    /**
     * Locks the current selection and disables any changes from happening to the selection.
     * @param {Boolean} locked  True to lock, false to unlock.
     */
    setLocked: function(locked) {
        this.locked = !!locked;
    },

    /**
     * Returns true if the specified row is selected.
     * @param {Ext.data.Model/Number} from The start of the range to check.
     * @param {Ext.data.Model/Number} to The end of the range to check.
     * @return {Boolean}
     */
    isRangeSelected: function(startRow, endRow) {
        var me = this,
            store = me.store,
            i, result;

        result = me.normalizeRowRange(startRow, endRow);
        startRow = result[0];
        endRow = result[1];

        // Loop through. If any of the range is not selected, the answer is false.
        for (i = startRow; i <= endRow; i++) {
            if (!me.isSelected(store.getAt(i))) {
                return false;
            }
        }
        return true;
    },

    /**
     * Returns true if the specified row is selected.
     * @param {Ext.data.Model/Number} record The record or index of the record to check
     * @return {Boolean}
     */
    isSelected: function (record) {
        record = Ext.isNumber(record) ? this.store.getAt(record) : record;
        return this.selected.contains(record);
    },

    /**
     * Returns true if there are any a selected records.
     * @return {Boolean}
     */
    hasSelection: function() {
        var selected = this.getSelected();
        return !!(selected && selected.getCount());
    },

    refresh: function() {
        var me = this,
            store = me.store,
            toBeSelected = [],
            toBeReAdded = [],
            oldSelections = me.getSelection(),
            len = oldSelections.length,

            // Will be a Collection in this and DataView classes.
            // Will be an Ext.grid.selection.Rows instance for Spreadsheet (does not callParent for other modes).
            // API used in here, getCount() and add() are common.
            selected = me.getSelected(),
            change, d, storeData, selection, rec, i;

        // Not been bound yet, or we have never selected anything.
        if (!store || !(selected.isCollection || selected.isRows) || !selected.getCount()) {
            return;
        }

        // We need to look beneath any filtering to see if the selected records are still owned by the store
        storeData = store.getData();

        // Attempt to get the underlying source collection to avoid filtering
        if (storeData.getSource) {
            d = storeData.getSource();
            if (d) {
                storeData = d;
            }
        }
        me.refreshing = true;

        // Inhibit update notifications during refresh of the selected collection.
        selected.beginUpdate();
        me.suspendChanges();

        // Add currently records to the toBeSelected list if present in the Store
        // If they are not present, and pruneRemoved is false, we must still retain the record
        for (i = 0; i < len; i++) {
            selection = oldSelections[i];
            rec = storeData.get(selection.getId());
            if (rec) {
                toBeSelected.push(rec);
            }

            // Selected records no longer represented in Store must be retained
            else if (!me.pruneRemoved) {
                toBeReAdded.push(selection);
            }

            // In single select mode, only one record may be selected
            if (me.mode === 'SINGLE' && toBeReAdded.length) {
                break;
            }
        }

        // there was a change from the old selected and
        // the new selection
        if (selected.getCount() !== (toBeSelected.length + toBeReAdded.length)) {
            change = true;
        }

        me.clearSelections();

        if (toBeSelected.length) {
            // perform the selection again
            me.doSelect(toBeSelected, false, true);
        }

        // If some of the selections were not present in the Store, but pruneRemoved is false, we must add them back
        if (toBeReAdded.length) {
            selected.add(toBeReAdded);

            // No records reselected.
            if (!me.lastSelected) {
                me.lastSelected = toBeReAdded[toBeReAdded.length - 1];
            }
        }

        me.resumeChanges();

        // If the new data caused the selection to change, announce the update using endUpdate,
        // Otherwise, end the update silently.
        // Bindings may be attached to selection - we need to coalesce changes.
        if (change) {
            selected.endUpdate();
        } else {
            selected.updating--;
        }
        me.refreshing = false;

        me.maybeFireSelectionChange(change);
    },

    /**
     * A fast reset of the selections without firing events, updating the ui, etc.
     * For private usage only.
     * @private
     */
    clearSelections: function() {
        // Will be a Collection in this and DataView classes.
        // Will be an Ext.grid.selection.Selection instance for Spreadsheet.
        // API used in here, clear() is common.
        var selected = this.getSelected();

        // reset the entire selection to nothing
        if (selected) {
            selected.clear();
        }
        this.lastSelected = null;
    },

    // when a record is added to a store
    onStoreAdd: Ext.emptyFn,

    // when a store is cleared remove all selections
    // (if there were any)
    onStoreClear: function() {
        if (!this.store.isLoading() && this.hasSelection()) {
            this.clearSelections();
            this.maybeFireSelectionChange(true);
        }
    },

    // prune records from the SelectionModel if
    // they were selected at the time they were
    // removed.
    onStoreRemove: function(store, records, index, isMove) {
        var me = this,
            toDeselect = records,
            i, len, rec, moveMap;

        // If the selection start point is among records being removed, we no longer have a selection start point.
        if (me.selectionStart && Ext.Array.contains(records, me.selectionStart)) {
            me.selectionStart = null;
        }

        if (isMove || me.locked || !me.pruneRemoved) {
            return;
        }

        // Do a cheap check to see if the store is doing any moves before we branch into here
        moveMap = store.isMoving(null, true);
        if (moveMap) {
            toDeselect = null;
            for (i = 0, len = records.length; i < len; ++i) {
                rec = records[i];
                if (!moveMap[rec.id]) {
                    (toDeselect || (toDeselect = [])).push(rec); 
                }
            }
        }

        if (toDeselect) {
            me.deselect(toDeselect);
        }
    },

    // Page evicted from BufferedStore.
    // Remove any selections in that page unless pruneRemoved is false
    onPageRemove: function(pageMap, pageNumber, records) {
        this.onStoreRemove(this.store, records);
    },

    // Page added to BufferedStore.
    // Check for return of already selected records
    onPageAdd: function(pageMap, pageNumber, records) {
        var len = records.length,
            i,
            record;

        for (i = 0; i < len; i++) {
            record = records[i];
            if (this.selected.get(record.id)) {
                this.selected.replace(record);
            }
        }
    },

    /**
     * Returns the count of selected records.
     * @return {Number} The number of selected records
     */
    getCount: function() {
        return this.selected.getCount();
    },

    // Called when the contents of the node are updated, perform any processing here.
    onUpdate: Ext.emptyFn,

    // cleanup.
    destroy: function() {
        var me = this;
        me.clearListeners();    
        me.clearSelections();
        me.bindStore(null);
        me.selected = Ext.destroy(me.selected);
        me.callParent();
    },

    // if records are updated
    onStoreUpdate: Ext.emptyFn,

    onIdChanged: function(store, rec, oldId, newId) {
        this.selected.updateKey(rec, oldId);
    },

    onStoreRefresh: function() {
        this.updateSelectedInstances(this.selected);
    },

    /**
     * @private
     * Called when the store is refreshed.
     * Selected records which are no longer present in the store are removed if {@link #pruneRemoved} is `true`.
     * 
     * Selected records which are still present have their instances in the passed collection updated.
     * @param {Ext.util.Collection} selected A Collection representing the currently selected records.
     */
    updateSelectedInstances: function(selected) {
        var me = this,
            store = me.getStore(),
            lastSelected = me.lastSelected,
            removeCount = 0,
            prune = me.pruneRemovedOnRefresh(),
            items, length, i, selectedRec, rec,
            lastSelectedChanged;
            
        if (store.isBufferedStore) {
            return;
        }

        items = selected.getRange();
        length = items.length;
         
        if (lastSelected) {
            me.lastSelected = store.getById(lastSelected.id);
            lastSelectedChanged = me.lastSelected !== lastSelected;
        }

        // Flag so that reactors to collectionEndUpdate know that the collection is not really changing
        me.refreshing = true;
        for (i = 0; i < length; ++i) {
            selectedRec = items[i];

            // Is the selected record ID still present in the store?
            rec = store.getById(selectedRec.id);

            // Yes, ensure the instance is correct
            if (rec) {
                if (rec !== selectedRec) {
                    // Silently replace the stale record instance with the new record by the same ID
                    selected.replace(rec);
                }
            }
            // No, remove it from the selection if we are configured to prune removed records
            else if (prune) {
                selected.remove(selectedRec);
                ++removeCount;
            }
        }   
        me.refreshing = false;
        me.maybeFireSelectionChange(removeCount > 0);
        if (lastSelectedChanged) {
            // Private event for now
            me.fireEvent('lastselectedchanged', me, me.getSelection(), me.lastSelected);
        }
    },

    // onStoreRefresh asks if it should remove from the selection any selected records which are no
    // longer findable in the store after the refresh.
    // Subclasses may override this.
    // TreeModel does not use the pruneRemoved flag because records are being added and removed
    // from TreeStores on expand and collapse. It uses the pruneRemovedNodes flag.
    pruneRemovedOnRefresh: function() {
        return this.pruneRemoved;
    },

    /**
     * @abstract
     * @private
     */
    onStoreLoad: Ext.emptyFn,

    // @abstract
    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
        var me = this,
            eventName = isSelected ? 'select' : 'deselect';

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record)) !== false &&
           commitFn() !== false) {

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record);
            }
        }   
    },

    // @abstract
    onEditorKey: Ext.emptyFn,

    /**
     * @protected
     * @template
     * Allows multiple views to be controlled by one selection model.
     * Called by AbstractView's beforeRender method.
     * @param {Ext.view.View} view The View passes itself
     */
    beforeViewRender: function(view) {
        Ext.Array.include(this.views || (this.views = []), view);
    },
    
    /**
     * @protected
     * @template
     * Called by the owning grid's {@link Ext.grid.header.Container header container}
     * when a column header is activated by the UI (clicked, or receives a `SPACE` or `ENTER` key event).
     */
    onHeaderClick: Ext.emptyFn,

    resolveListenerScope: function(defaultScope) {
        var view = this.view,
            scope;
            
        if (view) {
            scope = view.resolveSatelliteListenerScope(this, defaultScope);
        }  
        return scope || this.callParent([defaultScope]);
    },

    // @abstract
    bindComponent: Ext.emptyFn,

    privates: {
        onBeforeNavigate: Ext.privateFn,

        selectWithEventMulti: function(record, e, isSelected) {
            var me = this,
                shift = e.shiftKey,
                ctrl = e.ctrlKey,
                start = shift ? (me.getSelectionStart()) : null,
                selected = me.getSelection(),
                len = selected.length,
                toDeselect, i, item;

            if (shift && start) {
                me.selectRange(start, record, ctrl);
            } else if (ctrl && isSelected) {
                if (me.allowDeselect) {
                    me.doDeselect(record, false);
                }
            } else if (ctrl) {
                me.doSelect(record, true, false);
            } else if (isSelected && !shift && !ctrl && len > 1) {
                if (me.allowDeselect) {
                    toDeselect = [];

                    for (i = 0; i < len; ++i) {
                        item = selected[i];
                        if (item !== record) {
                            toDeselect.push(item);    
                        }
                    }

                    me.doDeselect(toDeselect);
                }
            } else if (!isSelected) {
                me.doSelect(record, false);
            }
        },

        selectWithEventSimple: function(record, e, isSelected) {
            if (isSelected) {
                this.doDeselect(record);
            } else {
                this.doSelect(record, true);
            }
        },

        selectWithEventSingle: function(record, e, isSelected) {
            var me = this,
                allowDeselect = me.allowDeselect;

            if (allowDeselect && !e.ctrlKey) {
                allowDeselect = me.toggleOnClick;
            }
            if (allowDeselect && isSelected) {
                me.doDeselect(record);
            } else {
                me.doSelect(record, false);
            }
        }
    }
});
