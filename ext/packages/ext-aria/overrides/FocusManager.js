/**
 * The FocusManager is responsible for managing the following according to WAI ARIA practices:
 *
 * 1. Component focus
 * 2. Keyboard navigation
 * 3. Provide a visual cue for focused components, in the form of a focus ring/frame.
 *
 */
Ext.define('Ext.aria.FocusManager', {
    singleton: true,

    requires: [
        'Ext.util.KeyNav',
        'Ext.util.Observable'
    ],

    mixins: {
        observable: 'Ext.util.Observable'
    },

    /**
     * @property {Boolean} enabled
     * Whether or not the FocusManager is currently enabled
     */
    enabled: false,

    /**
     * @event disable
     * Fires when the FocusManager is disabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */

    /**
     * @event enable
     * Fires when the FocusManager is enabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */
    
    // Array to keep track of open windows
    windows: [],

    constructor: function(config) {
        var me = this,
            whitelist = me.whitelist,
            cache, i, len;

        me.mixins.observable.constructor.call(me, config);
    },
    
    /**
     * @private
     * Enables the FocusManager by turning on window management and keyboard navigation
     */
    enable: function() {
        var me = this,
            doc = Ext.getDoc();

        if (me.enabled) {
            return;
        }

        // initDom will call addFocusListener which needs the FocusManager to be enabled
        me.enabled = true;
        
        // map F6 to toggle focus among open windows
        me.toggleKeyMap = new Ext.util.KeyMap({
            target: doc,
            scope: me,
            defaultEventAction: 'stopEvent',
            key: Ext.event.Event.F6,
            fn: me.toggleWindow
        });
        
        me.fireEvent('enable', me);
    },
    
    onComponentBlur: function(cmp, e) {
        var me = this;

        if (me.focusedCmp === cmp) {
            me.previousFocusedCmp = cmp;
        }

        Ext.globalEvents.fireEvent('componentblur', me, cmp, me.previousFocusedCmp);
        
        return false;
    },

    onComponentFocus: function(cmp, e) {
        var me = this;
        
        if (Ext.globalEvents.fireEvent('beforecomponentfocus', me, cmp, me.previousFocusedCmp) === false) {
            me.clearComponent(cmp);
            
            return;
        }
        
        me.focusedCmp = cmp;
        
        return false;
    },
    
    // This should be fixed in https://sencha.jira.com/browse/EXTJS-14124
    onComponentHide: Ext.emptyFn,

    toggleWindow: function(key, e) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            focusedCmp = me.focusedCmp,
            curIndex = 0,
            newIndex = 0,
            current;

        if (length === 1) {
            return;
        }
        
        current = focusedCmp.isWindow ? focusedCmp : focusedCmp.up('window');
        
        if (current) {
            curIndex = me.findWindowIndex(current);
        }

        if (e.shiftKey) {
            newIndex = curIndex - 1;
            
            if (newIndex < 0) {
                newIndex = length - 1;
            }
        } else {
            newIndex = curIndex + 1;
            
            if (newIndex === length) {
                newIndex = 0;
            }
        }
        
        current = windows[newIndex];
        
        if (current.cmp.isWindow) {
            current.cmp.toFront();
        }
        
        current.cmp.focus(false, 100);
        
        return false;
    },

    addWindow: function(window) {
        var me = this,
            win = {
                cmp: window
            };

        me.windows.push(win);
    },

    removeWindow: function(window) {
        var me = this,
            windows = me.windows,
            current;
        
        if (windows.length === 1) {
            return;
        }
        
        current = me.findWindowIndex(window);
        
        if (current >= 0) {
            Ext.Array.erase(windows, current, 1);
        }
    },

    findWindowIndex: function(window) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            curIndex = -1,
            i;
        
        for (i = 0; i < length; i++) {
            if (windows[i].cmp === window) {
                curIndex = i;
                
                break;
            }
        }
        
        return curIndex;
    }
},

function() {
    var mgr = Ext['FocusManager'] = Ext.aria.FocusManager;
    
    Ext.onReady(function() {
        mgr.enable();
    });
});
