Ext.define('Rambox.ux.Firebase', {
	 singleton: true

	// private
	,eventsDefined: false

	,createEvents: function() {
		//if ( this.eventsDefined || !localStorage.getItem('id_token') ) return;
		if ( !localStorage.getItem('id_token') ) return;

		console.log('Define listeners for Firebase');

		var ref = fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id).child('services');

		// Attach an asynchronous callback to read the data at our posts reference
		ref.on("child_changed", function(snapshot, prevChildKey) {
			console.info('Firebase - Child Changed', snapshot.val(), snapshot.key, prevChildKey);

			Ext.getStore('Services').suspendEvent('update');
			var rec = Ext.getStore('Services').findRecord('firebase_key', snapshot.key);


			Ext.getCmp('tab_'+rec.get('id')).setTitle(snapshot.val().name);

			if ( rec.get('position') !== snapshot.val().position ) {
				var pos = parseInt(snapshot.val().position);
				if ( rec.get('align') === 'right' ) pos++;
				Ext.cq1('app-main').move(Ext.getCmp('tab_'+rec.get('id')), pos);
			}

			rec.set(snapshot.val());
			rec.save();
			Ext.getStore('Services').resumeEvent('update');
			Ext.getStore('Services').load();
		}, function (errorObject) {

		});

		ref.on("child_added", function(snapshot, prevChildKey) {
			console.info('Firebase - Child Added', snapshot.val(), snapshot.key, prevChildKey);

			Ext.getStore('Services').suspendEvents(['add', 'update']);
			var rec = Ext.getStore('Services').findRecord('firebase_key', snapshot.key);

			// For all version of Rambox (0.3.0)
			if ( rec === null ) rec = Ext.getStore('Services').getById(snapshot.val().id);

			var data = snapshot.val();
			
			// Update current services
			if ( rec ) {
				delete data.id;
				data.firebase_key = snapshot.key;
				rec.set(data);
				rec.save();
			} else { // Add new ones if exist
				data.firebase_key = snapshot.key;
				rec = Ext.create('Rambox.model.Service', data);
				rec.save();
				Ext.getStore('Services').add(rec);

				var tabData = {
					 xtype: 'webview'
					,id: 'tab_'+rec.get('id')
					,title: rec.get('name')
					,icon: rec.get('type') !== 'custom' ? 'resources/icons/'+rec.get('logo') : ( rec.get('logo') === '' ? 'resources/icons/custom.png' : rec.get('logo'))
					,src: rec.get('url')
					,type: rec.get('type')
					,align: rec.get('align')
					,notifications: rec.get('notifications')
					,muted: rec.get('muted')
					,record: rec
					,tabConfig: {
						service: rec
					}
				};

				if ( rec.get('align') === 'left' ) {
					var tbfill = Ext.cq1('app-main').getTabBar().down('tbfill');
					Ext.cq1('app-main').insert(Ext.cq1('app-main').getTabBar().items.indexOf(tbfill), tabData);
				} else {
					Ext.cq1('app-main').add(tabData);
				}
			}

			Ext.getStore('Services').resumeEvents(['add', 'update']);
			Ext.getStore('Services').load();
			//rec.commit();
		}, function (errorObject) {

		});

		ref.on("child_removed", function(snapshot) {
			console.info('Firebase - Child Removed', snapshot.val(), snapshot.key);

			var rec = Ext.getStore('Services').findRecord('firebase_key', snapshot.key);

			// Remove record from localStorage
			if ( rec ) {
				Ext.getStore('Services').suspendEvent('remove');
				Ext.getStore('Services').remove(rec);
				Ext.cq1('app-main').suspendEvent('remove');
				Ext.getCmp('tab_'+rec.get('id')).close();
				Ext.cq1('app-main').resumeEvent('remove');
				Ext.getStore('Services').resumeEvent('remove');
				Ext.getStore('Services').load();
			}
		}, function (errorObject) {

		});

		this.eventsDefined = true;
	}

	,removeEvents: function() {
		//if ( !this.eventsDefined ) return;

		console.log('Remove listeners for Firebase');

		var ref = fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id).child('services');

		ref.off('child_changed', function() {
			console.warn('Firebase - Child Changed event removed');
		});

		ref.off('child_added', function() {
			console.warn('Firebase - Child Added event removed');
		});

		ref.off('child_removed', function() {
			console.warn('Firebase - Child Removed event removed');
		});
	}
});
