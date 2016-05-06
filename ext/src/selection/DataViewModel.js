/**
 * @private
 */
Ext.define('Ext.selection.DataViewModel', {
    extend: 'Ext.selection.Model',

    alias: 'selection.dataviewmodel',

    requires: ['Ext.util.KeyNav'],

    deselectOnContainerClick: true,

    /**
     * @cfg {Boolean} [enableKeyNav=true]
     *
     * @deprecated 5.1.0 Keyboard navigation is a function of the view's {@link Ext.view.NavigationModel navigation model},
     * and is enabled for accessibilty purposes.
     */

    /**
     * @event beforedeselect
     * Fired before a record is deselected. If any listener returns false, the
     * deselection is cancelled.
     * @param {Ext.selection.DataViewModel} this
     * @param {Ext.data.Model} record The deselected record.
     * @param {Number} The index within the store of the deselected record.
     */

    /**
     * @event beforeselect
     * Fired before a record is selected. If any listener returns false, the
     * selection is cancelled.
     * @param {Ext.selection.DataViewModel} this
     * @param {Ext.data.Model} record The selected record.
     * @param {Number} The index within the store of the selected record.
     */

    /**
     * @event deselect
     * Fired after a record is deselected
     * @param {Ext.selection.DataViewModel} this
     * @param  {Ext.data.Model} record The deselected record
     */

    /**
     * @event select
     * Fired after a record is selected
     * @param {Ext.selection.DataViewModel} this
     * @param  {Ext.data.Model} record The selected record.
     * @param {Number} The index within the store of the selected record.
     */

    bindComponent: function(view) {
        var me = this,
            viewListeners;

        if (me.view !== view) {
            if (me.view) {
                me.navigationModel = null;
                Ext.destroy(me.viewListeners, me.navigationListeners);
            }
            me.view = view;
            if (view) {
                viewListeners = me.getViewListeners();
                viewListeners.scope = me;
                viewListeners.destroyable = true;
                me.navigationModel = view.getNavigationModel();
                me.viewListeners = view.on(viewListeners);
                me.navigationListeners = me.navigationModel.on({
                    navigate: me.onNavigate,
                    scope: me,
                    destroyable: true
                });
            }
        }
    },

    getViewListeners: function() {
        var me = this,
            eventListeners = {};

        eventListeners[me.view.triggerCtEvent] = me.onContainerClick;
        return eventListeners;
    },
    
    onUpdate: function(record){
        var view = this.view;
        if (view && this.isSelected(record)) {
            view.onItemSelect(record);
        }
    },

    onContainerClick: function() {
        if (this.deselectOnContainerClick) {
            this.deselectAll();
        }
    },

    // Allow the DataView to update the ui
    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
        var me = this,
            view = me.view,
            eventName = isSelected ? 'select' : 'deselect',
            recordIndex = me.store.indexOf(record);

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record, recordIndex)) !== false &&
                commitFn() !== false) {

            if (view) {
                if (isSelected) {
                    view.onItemSelect(record);
                } else {
                    view.onItemDeselect(record);
                }
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record, recordIndex);
            }
        }
    },

    destroy: function() {
        this.bindComponent();
        Ext.destroy(this.keyNav);
        this.callParent();
    }
});
