/**
 * A simple class that renders text directly into a toolbar.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         title: 'Panel with TextItem',
 *         width: 300,
 *         height: 200,
 *         tbar: [
 *             { xtype: 'tbtext', html: 'Sample Text Item' }
 *         ],
 *         renderTo: Ext.getBody()
 *     });
 *
 */
Ext.define('Ext.toolbar.TextItem', {
    extend: 'Ext.toolbar.Item',
    // Toolbar required here because we'll try to decorate it's alternateClassName
    // with this class' alternate name
    requires: ['Ext.toolbar.Toolbar', 'Ext.XTemplate'],
    alias: 'widget.tbtext',
    alternateClassName: 'Ext.Toolbar.TextItem',

    /**
     * @cfg {String} text
     * The text to be used as innerHTML (html tags are accepted).
     *
     * @deprecated 5.1.0 Use {@link #html}
     */
    text: '',

    baseCls: Ext.baseCSSPrefix + 'toolbar-text',
    
    ariaRole: null,

    beforeRender : function() {
        var text = this.text;

        this.callParent();

        if (text) {
            this.html = text;
        }
    },

    /**
     * Updates this item's text, setting the text to be used as innerHTML.
     * @param {String} text The text to display (html accepted).
     *
     * @deprecated 5.1.0 Use {@link #update}
     */
    setText : function(text) {
        this.update(text);
    }
});