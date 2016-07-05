Ext.define('Rambox.store.Services', {
	 extend: 'Ext.data.Store'
	,alias: 'store.services'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Rambox.model.Service'

	,autoLoad: true
	,autoSync: true

	,sorters: [
		{
			 property: 'position'
			,direction: 'ASC'
		}
	]

	,listeners: {
		load: function( store, records, successful ) {
			if ( Ext.isEmpty(records) ) {
				Ext.cq1('app-main').add({ tabConfig : { xtype : 'tbfill' } });
				return;
			}

			var servicesLeft = [];
			var servicesRight = [];
			store.each(function(service) {
				var cfg = {
					 xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,title: service.get('name')
					,icon: service.get('type') !== 'custom' ? 'resources/icons/'+service.get('logo') : ( service.get('logo') === '' ? 'resources/icons/custom.png' : service.get('logo'))
					,src: service.get('url')
					,type: service.get('type')
					,muted: service.get('muted')
					,record: service
					,tabConfig: {
						service: service
					}
				};

				service.get('align') === 'left' ? servicesLeft.push(cfg) : servicesRight.push(cfg);
			});

			Ext.cq1('app-main').add(servicesLeft);
			Ext.cq1('app-main').add({ tabConfig : { xtype : 'tbfill' } });

			if ( !Ext.isEmpty(servicesRight) ) {
				Ext.cq1('app-main').add(servicesRight);
			}
		}
		,add: function(store, records, index) {
			sync();
		}
		,update: function(store, record, operation, data) {
			if ( operation === 'edit' ) sync();
		}
		,remove: function(store, records, index, isMove) {
			sync();
		}
	}
});
