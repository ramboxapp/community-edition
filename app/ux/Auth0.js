Ext.define('Rambox.ux.Auth0', {
	 singleton: true

	// private
	,lock: null
	,auth0: null
	,backupCurrent: false

	,init: function() {
		var me = this;

		var Auth0Lock = require('auth0-lock')['default'];
		var Auth0 = require('auth0-js');

		// Auth0 Config
		me.lock = new Auth0Lock(auth0Cfg.clientID, auth0Cfg.domain, {
			 autoclose: true
			,autofocus: true
			,auth: {
				 redirect: false
				,params: {scope: 'openid offline_access'}
			}
			,theme: {
				 logo: 'resources/Icon.png'
				,primaryColor: '#0675A0'
			}
			,languageDictionary: {
				title: 'Rambox Account'
			}
			,popupOptions: {
				nodeIntegration: 'no'
			}
			,language: localStorage.getItem('locale-auth0') === null ? 'en' : localStorage.getItem('locale-auth0')
		});

		me.auth0 = new Auth0.WebAuth({ clientID: auth0Cfg.clientID, domain : auth0Cfg.domain });

		me.defineEvents();
	}

	,defineEvents: function() {
		var me = this;

		me.lock.on("authenticated", function(authResult) {
			me.lock.getProfile(authResult.idToken, function(err, profile) {
				if ( err ) {
					if ( err.error === 401 || err.error === 'Unauthorized' ) return me.renewToken(me.checkConfiguration);
					Ext.Msg.hide();
					return Ext.Msg.show({
						 title: 'Error'
						,message: 'There was an error getting the profile: ' + err.error_description
						,icon: Ext.Msg.ERROR
						,buttons: Ext.Msg.OK
					});
				}

				// Display a spinner while waiting
				Ext.Msg.wait(locale['app.window[29]'], locale['app.window[28]']);

				// Google Analytics Event
				ga_storage._trackEvent('Users', 'loggedIn');

				// Set cookies to help Tooltip.io messages segmentation
				Ext.util.Cookies.set('auth0', true);

				// User is logged in
				// Save the profile and JWT.
				localStorage.setItem('profile', JSON.stringify(profile));
				localStorage.setItem('id_token', authResult.idToken);
				localStorage.setItem('refresh_token', authResult.refreshToken);

				if ( !Ext.isEmpty(profile.user_metadata) && !Ext.isEmpty(profile.user_metadata.services) && !me.backupCurrent ) {
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

	,backupConfiguration: function(callback) {
		var me = this;

		Ext.Msg.wait('Saving backup...', 'Please wait...');

		// Getting all services
		var lastupdate = (new Date()).toJSON();
		var services = [];
		Ext.getStore('Services').each(function(service) {
			var s = Ext.clone(service);
			delete s.data.id;
			delete s.data.zoomLevel;
			services.push(s.data);
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
				if ( !profile.user_metadata ) profile.user_metadata = {};
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

				if ( Ext.isFunction(callback) ) callback.bind(me)();
			}
			,failure: function(response) {
				if ( response.status === 401 ) return me.renewToken(me.backupConfiguration);

				Ext.Msg.hide();
				Ext.toast({
					 html: '<i class="fa fa-times fa-3x fa-pull-left" aria-hidden="true"></i> Error occurred when trying to backup your configuration.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});

				if ( Ext.isFunction(callback) ) callback.bind(me)();

				console.error(response);
			}
		});
	}

	,restoreConfiguration: function() {
		var me = this;

		me.lock.getProfile(localStorage.getItem('id_token'), function (err, profile) {
			if ( err ) {
				if ( err.error === 401 || err.error === 'Unauthorized' ) return me.renewToken(me.checkConfiguration);
				return Ext.Msg.show({
					 title: 'Error'
					,message: 'There was an error getting the profile: ' + err.error_description
					,icon: Ext.Msg.ERROR
					,buttons: Ext.Msg.OK
				});
			}

			// First we remove all current services
			Ext.cq1('app-main').getController().removeAllServices(false, function() {
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
			if ( err ) {
				if ( err.error === 401 || err.error === 'Unauthorized' ) return me.renewToken(me.checkConfiguration);
				return Ext.Msg.show({
					 title: 'Error'
					,message: 'There was an error getting the profile: ' + err.error_description
					,icon: Ext.Msg.ERROR
					,buttons: Ext.Msg.OK
				});
			}

			if ( !profile.user_metadata ) {
				Ext.toast({
					 html: 'You don\'t have any backup yet.'
					,title: 'Synchronize Configuration'
					,width: 300
					,align: 't'
					,closable: false
				});
				return;
			}

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

	,renewToken: function(callback) {
		var me = this;

		Ext.Ajax.request({
			 url: 'https://rambox.auth0.com/delegation'
			,method: 'POST'
			,jsonData: {
				 grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
				,client_id: auth0Cfg.clientID
				,refresh_token: localStorage.getItem('refresh_token')
				,api_type: 'app'
			}
			,success: function(response) {
				var json = Ext.decode(response.responseText);
				localStorage.setItem('id_token', json.id_token);

				if ( Ext.isFunction(callback) ) callback.bind(me)();
			}
			,failure: function(response) {
				console.error(response);
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
		localStorage.removeItem('refresh_token');

		// Set cookies to help Tooltip.io messages segmentation
		Ext.util.Cookies.set('auth0', false);
	}
});
