Ext.define('Rambox.store.Services', {
	 extend: 'Ext.data.Store'
	,alias: 'store.services'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Rambox.model.Service'

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
		load: function( store, records, successful ) {
			Ext.cq1('app-main').suspendEvent('add');

			var servicesLeft = [];
			var servicesRight = [];
			store.each(function(service) {
				// Fix some services with bad IDs
				// TODO: Remove in next release
				switch ( service.get('type') ) {
					case 'office365':
						service.set('type', 'outlook365');
						break;
					case ' irccloud':
						service.set('type', 'irccloud');
						break;
					default:
						break;
				}

				var cfg = {
					 xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,title: service.get('name')
					,icon: service.get('type') !== 'custom' ? 'resources/icons/'+service.get('logo') : ( service.get('logo') === '' ? 'resources/icons/custom.png' : service.get('logo'))
					,src: service.get('url')
					,type: service.get('type')
					,muted: service.get('muted')
					,includeInGlobalUnreadCounter: service.get('includeInGlobalUnreadCounter')
					,displayTabUnreadCounter: service.get('displayTabUnreadCounter')
					,enabled: service.get('enabled')
					,record: service
					,tabConfig: {
						service: service
					}
				};

				service.get('align') === 'left' ? servicesLeft.push(cfg) : servicesRight.push(cfg);
			});

			if ( !Ext.isEmpty(servicesLeft) ) Ext.cq1('app-main').insert(1, servicesLeft);
			if ( !Ext.isEmpty(servicesRight) ) Ext.cq1('app-main').add(servicesRight);

			store.suspendEvent('load');
			Ext.cq1('app-main').resumeEvent('add');
		}
		,add: function(store, records, index) {
			var record = records[0];
			if ( !localStorage.getItem('id_token') || (!Ext.isEmpty(record.previousValues) && !Ext.isEmpty(record.previousValues.position)) ) return true;

			console.info('Saving into Firebase...', record.data);

			var ref = fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id).child('services');

			ref.once('value', function(snap) {
				// Generate Key
				var i = 0;
				while ( snap.child(i).exists() ) { i++; }

				// Save Firebase Key into record
				record.set('firebase_key', i);

				// Prevent saving local ID and Firebase Key into Firebase
				var data = Ext.clone(record.data);
				delete data.id;
				delete data.firebase_key;

				// Make the call
				ref.child(i).set(data);
			});
		}
		,update: function(store, record, operation, data) {
			// Is not logged, Skip
			if ( !localStorage.getItem('id_token') || operation === 'commit' ) return;

			if ( operation === 'edit' && data[0] !== 'firebase_key' ) {
				var obj = {};
				Ext.each(data, function(prop) {
					obj[prop] = record.get(prop);
				});

				fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id + '/services').child(record.get('firebase_key')).update(obj);
			}
		}
		,remove: function(store, records, index, isMove) {
			if ( !localStorage.getItem('id_token') ) return;

			Ext.each(records, function(rec) {
				fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id).child('services').child(rec.get('firebase_key')).remove();
			});
		}
	}
});
