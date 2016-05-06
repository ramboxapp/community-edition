Ext.define('Rambox.store.Services', {
	 extend: 'Ext.data.Store'
	,alias: 'store.services'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Rambox.model.Service'

	,autoLoad: true
	,autoSync: true

	,listeners: {
		load: function( store, records, successful ) {
			if ( Ext.isEmpty(records) ) {
				Ext.get('spinner').destroy();
				return;
			}

			var servicesLeft = [];
			var servicesRight = [];
			Ext.each(records, function(service) {
				var cfg = {
					 xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,title: service.get('name')
					,icon: 'resources/icons/'+service.get('type')+'.png'
					,src: service.get('url')
					,type: service.get('type')
					,muted: service.get('muted')
				};

				service.get('align') === 'left' ? servicesLeft.push(cfg) : servicesRight.push(cfg);
			});

			Ext.cq1('app-main').add(servicesLeft);

			if ( !Ext.isEmpty(servicesRight) ) {
				Ext.cq1('app-main').add({ tabConfig : { xtype : 'tbfill' } });
				Ext.cq1('app-main').add(servicesRight);
			}
		}
	}
});
