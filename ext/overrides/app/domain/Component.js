Ext.define('Ext.overrides.app.domain.Component', {
    override: 'Ext.app.domain.Component',
    requires: [
        'Ext.Component'
    ]
}, function(ComponentDomain) {
    // The core Component domain monitors events on the Ext.Widget class
    // in Ext Components are not widgets so we need to monitor Ext.Component as well.
    ComponentDomain.monitor(Ext.Component);
});
