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
			// Disable duplicate actions when user edit a service
			var rec = Ext.getStore('Services').findRecord('firebase_key', snapshot.key);
			var recData = Ext.clone(rec.data);
			delete recData.id;
			delete recData.firebase_key;
			if ( Ext.Object.equals(recData, snapshot.val()) ) return;

			console.info('Firebase - Child Changed', snapshot.val(), snapshot.key, prevChildKey);

			// Suspend events
			Ext.getStore('Services').suspendEvent('update');

			// Change the title of the Tab
			Ext.getCmp('tab_'+rec.get('id')).setTitle(snapshot.val().name);
			// Change sound of the Tab
			Ext.getCmp('tab_'+rec.get('id')).setAudioMuted(snapshot.val().muted);
			// Change notifications of the Tab
			Ext.getCmp('tab_'+rec.get('id')).setNotifications(snapshot.val().notifications);
			// Change the icon of the Tab
			if ( rec.get('type') === 'custom' && rec.get('logo') !== snapshot.val().logo ) Ext.getCmp('tab_'+rec.get('id')).setConfig('icon', snapshot.val().logo === '' ? 'resources/icons/custom.png' : snapshot.val().logo);
			// Change the URL of the Tab
			if ( rec.get('url') !== snapshot.val().url ) Ext.getCmp('tab_'+rec.get('id')).setURL(snapshot.val().url);

			// Change the align of the Tab
			if ( rec.get('align') !== snapshot.val().align ) {
				if ( rec.get('align') === 'left' ) {
					Ext.cq1('app-main').moveBefore(Ext.getCmp('tab_'+rec.get('id')), Ext.getCmp('tbfill'));
				} else {
					Ext.cq1('app-main').moveAfter(Ext.getCmp('tab_'+rec.get('id')), Ext.getCmp('tbfill'));
				}
			}
			// Apply the JS Code of the Tab
			if ( rec.get('js_unread') !== snapshot.val().js_unread ) {
				Ext.Msg.confirm('CUSTOM CODE', 'Rambox needs to reload the service to execute the new JavaScript code. Do you want to do it now?', function( btnId ) {
					if ( btnId === 'yes' ) Ext.getCmp('tab_'+rec.get('id')).reloadService();
				});
			}
			// Position
			if ( rec.get('position') !== snapshot.val().position ) {
				var pos = parseInt(snapshot.val().position);
				if ( rec.get('align') === 'right' ) pos++;
				Ext.cq1('app-main').move(Ext.getCmp('tab_'+rec.get('id')), pos);
			}

			rec.set(snapshot.val());
			rec.save();
			Ext.getCmp('tab_'+rec.get('id')).record = rec;
			Ext.getCmp('tab_'+rec.get('id')).tabConfig.service = rec;

			// Enable/Disable
			if ( recData.enabled !== snapshot.val().enabled ) Ext.getCmp('tab_'+rec.get('id')).setEnabled(snapshot.val().enabled);

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
