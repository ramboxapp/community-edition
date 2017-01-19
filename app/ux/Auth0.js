Ext.define('Rambox.ux.Auth0', {
	 singleton: true

	// private
	,lock: null
	,auth0: null

	,init: function() {
		var me = this;

		// Auth0 Config
		me.lock = new Auth0Lock(auth0Cfg.clientID, auth0Cfg.domain, {
			 autoclose: true
			,autofocus: true
			,auth: {
				redirect: false
			}
			,theme: {
				 logo: 'resources/Icon.png'
				,primaryColor: '#0675A0'
			}
			,languageDictionary: {
				title: 'Rambox Account'
			}
			//,language: 'en'
		});

		me.auth0 = new Auth0({ clientID: auth0Cfg.clientID, domain : auth0Cfg.domain });

		me.defineEvents();
	}

	,defineEvents: function() {
		var me = this;

		me.lock.on("authenticated", function(authResult) {
			me.lock.getProfile(authResult.idToken, function(err, profile) {
				if (err) {
					// Handle error
					Ext.Msg.hide();
					return;
				}

				// Display a spinner while waiting
				Ext.Msg.wait('Please wait until we get your configuration.', 'Connecting...');

				// Google Analytics Event
				ga_storage._trackEvent('Users', 'loggedIn');

				// User is logged in
				// Save the profile and JWT.
				localStorage.setItem('profile', JSON.stringify(profile));
				localStorage.setItem('id_token', authResult.idToken);

				if ( !Ext.isEmpty(profile.user_metadata.services) ) {
					Ext.each(profile.user_metadata.services, function(s) {
						var service = Ext.create('Rambox.model.Service', s);
						service.save();
						Ext.getStore('Services').add(service);
					});

					require('electron').remote.getCurrentWindow().reload();
				}

				Ext.Msg.hide();
				Ext.cq1('app-main').getViewModel().set('username', profile.name);
				Ext.cq1('app-main').getViewModel().set('avatar', profile.picture);
			});
		});
	}

	,backupConfiguration: function() {
		var me = this;

		Ext.Msg.wait('Saving backup...', 'Please wait...');

		// Getting all services
		var lastupdate = (new Date()).toJSON();
		var services = [];
		Ext.getStore('Services').each(function(service) {
			delete service.data.id;
			delete service.data.zoomLevel;
			services.push(service.data);
		});

		Ext.Ajax.request({
			 url: 'https://rambox.auth0.com/api/v2/users/'+Ext.decode(localStorage.getItem('profile')).user_id
			,method: 'PATCH'
			,headers: { authorization: "Bearer " + localStorage.getItem('id_token') }
			,jsonData: { user_metadata: { services: services, services_lastupdate: lastupdate } }
			,success: function(response) {
				Ext.Msg.hide();
				// Save the last update in localStorage
				var profile = Ext.decode(localStorage.getItem('profile'));
				profile.user_metadata.services_lastupdate = lastupdate;
				localStorage.setItem('profile', Ext.encode(profile));
				Ext.cq1('app-main').getViewModel().set('last_sync', new Date(lastupdate).toUTCString());

				Ext.toast({
					 html: '<i class="fa fa-check fa-3x fa-pull-left" aria-hidden="true"></i> Your configuration were successfully backed up.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});
			}
			,failure: function(response) {
				Ext.Msg.hide();
				Ext.toast({
					 html: '<i class="fa fa-times fa-3x fa-pull-left" aria-hidden="true"></i> Error ocurred when trying to backup your configuration.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});
				console.error(response);
			}
		});
	}

	,restoreConfiguration: function() {
		var me = this;

		Ext.cq1('app-main').getController().removeAllServices(false, function() {
			me.lock.getProfile(localStorage.getItem('id_token'), function (err, profile) {
				if (err) return alert('There was an error getting the profile: ' + err.message);

				Ext.each(profile.user_metadata.services, function(s) {
					var service = Ext.create('Rambox.model.Service', s);
					service.save();
					Ext.getStore('Services').add(service);
				});

				require('electron').remote.getCurrentWindow().reload();
			});
		});
	}

	,checkConfiguration: function() {
		var me = this;

		me.lock.getProfile(localStorage.getItem('id_token'), function (err, profile) {
			if (err) return alert('There was an error getting the profile: ' + err.message);

			if ( Math.floor(new Date(profile.user_metadata.services_lastupdate) / 1000) > Math.floor(new Date(Ext.decode(localStorage.getItem('profile')).user_metadata.services_lastupdate) / 1000) ) {
				Ext.toast({
					 html: 'Your settings are out of date.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});
			} else {
				Ext.toast({
					 html: 'Latest backup is already applied.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});
			}
		});
	}

	,login: function() {
		var me = this;

		me.lock.show();
	}

	,logout: function() {
		var me = this;

		localStorage.removeItem('profile');
		localStorage.removeItem('id_token');
	}
});
