/**
 * Simple class that provides an iframe shim for any absolutely positioned {@link
 * Ext.dom.Element Element} to prevent windowed objects from showing through.
 * 
 * Not meant to be used directly. Internally shims are applied to Elements using
 * {@link Ext.dom.Element#enableShim enableShim}.  Developers should use the
 * {@link Ext.util.Floating#shim shim} config to add shims to their
 * {@link Ext.Component Components} or set {@link Ext#useShims Ext.useShims}=true.
 * @private
 */
Ext.define('Ext.dom.Shim', {
    extend: 'Ext.dom.Underlay',
    
    cls: Ext.baseCSSPrefix + 'shim',
    
    constructor: function(config) {
        this.callParent([config]);

        this.elementConfig = {
            tag: 'iframe',
            cls: this.cls,
            role: 'presentation',
            frameBorder: '0',
            src: Ext.SSL_SECURE_URL,
            // tabIndex of -1 ensures that the iframe is not focusable by the user
            tabindex: '-1'
        };
    },

    getInsertionTarget: function() {
        // ensure that the shim is inserted before the shadow in the dom, so that the
        // shadow will be stacked on top of it.
        var shadow = this.shadow;
        return (shadow && shadow.el) || this.target;
    }

});
