Ext.define('Ext.rtl.scroll.Scroller', {
    override: 'Ext.scroll.Scroller',

    config: {
        /**
         * @cfg {Boolean} [rtl=false]
         * `true` to enable scrolling of "right-to-left" content.  This is typically
         * configured automatically by an {@link Ext.Component} based on its inherited
         * {@link Ext.Component#rtl rtl} state
         * @member Ext.scroll.Scroller
         */
        rtl: null
    },

    // Empty updater - workaround for https://sencha.jira.com/browse/EXTJS-14574
    updateRtl: Ext.emptyFn
});
