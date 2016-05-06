/**
 * Ext.FocusManager singleton is deprecated since Ext JS 5.1.
 * Focus management is always on and does not need any further steps to enable.
 * @deprecated
 */
Ext.define('Ext.FocusManager', {
    singleton: true,
    alternateClassName: ['Ext.FocusMgr'],

    /**
     * @property {Boolean} enabled
     * Whether or not the FocusManager is currently enabled
     */
    enabled: true,
    
    enable: Ext.emptyFn,
    disable: Ext.emptyFn
});
