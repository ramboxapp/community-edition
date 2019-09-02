Ext.define('Hamsket.store.Services', {
	 extend: 'Ext.data.Store'
	,alias: 'store.services'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Hamsket.model.Service'

	,autoLoad: true
	,autoSync: true

	,groupField: 'align'
	,sorters: [
		{
			 property: 'position'
			,direction: 'ASC'
		}
	]

	,listeners: {
		load( store, records, successful ) {
			Ext.cq1('app-main').suspendEvent('add');

			let servicesLeft = [];
			let servicesRight = [];
			store.each(function(service) {
				// If the service is disabled, we dont add it to tab bar
				if ( !service.get('enabled') ) return;

				const cfg = {
					 xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,title: service.get('name')
					,icon: service.get('type') !== 'custom' ? 'resources/icons/'+service.get('logo') : ( service.get('logo') === '' ? 'resources/icons/custom.png' : service.get('logo'))
					,src: service.get('url')
					,type: service.get('type')
					,muted: service.get('muted')
					,includeInGlobalUnreadCounter: service.get('includeInGlobalUnreadCounter')
					,displayTabUnreadCounter: service.get('displayTabUnreadCounter')
					,custom_css_complex: service.get('custom_css_complex')
					,passive_event_listeners: service.get('passive_event_listeners')
					,slowed_timers: service.get('slowed_timers')
					,userAgent: service.get('userAgent')
					,os_override: service.get('os_override')
					,chrome_version: service.get('chrome_version')
					,enabled: service.get('enabled')
					,record: service
					,tabConfig: {
						service: service
					}
				};

				if (service.get('align') === 'left') {
					servicesLeft.push(cfg);
				} else {
					servicesRight.push(cfg);
				}
			});

			if ( !Ext.isEmpty(servicesLeft) ) Ext.cq1('app-main').insert(1, servicesLeft);
			if ( !Ext.isEmpty(servicesRight) ) Ext.cq1('app-main').add(servicesRight);

			// Set default active service
			const config = ipc.sendSync('getConfig');
			switch ( config.default_service ) {
				case 'last':
					Ext.cq1('app-main').setActiveTab(localStorage.getItem('last_active_service'));
					break;
				case 'hamsketTab':
					break;
				default:
					if ( Ext.getCmp('tab_'+config.default_service) ) Ext.cq1('app-main').setActiveTab('tab_'+config.default_service);
					break;
			}

			store.suspendEvent('load');
			Ext.cq1('app-main').resumeEvent('add');
		}
	}
});
