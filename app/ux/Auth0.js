Ext.define('Rambox.ux.Auth0', {
	 singleton: true

	// private
	,lock: null
	,auth0: null
	,authService: null
	,backupCurrent: false

	,init: function() {
		var me = this;

		var Auth0 = require('auth0-js');
		var _AuthService = require('./resources/js/AuthService');

		me.authService = new _AuthService.default({
			clientId: auth0Cfg.clientID,
			authorizeEndpoint: 'https://'+auth0Cfg.domain+'/authorize',
			audience: 'https://'+auth0Cfg.domain+'/userinfo',
			scope: 'openid profile offline_access',
			redirectUri: 'https://'+auth0Cfg.domain+'/mobile',
			tokenEndpoint: 'https://'+auth0Cfg.domain+'/oauth/token'
		});

		me.auth0 = new Auth0.WebAuth({ clientID: auth0Cfg.clientID, domain : auth0Cfg.domain });

		//me.defineEvents();
	}

	,onLogin: function(token, authWindow) {
		var me = this;

		authWindow.close();

		me.auth0.client.userInfo(token.access_token, function(err, profile) {
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

			profile.user_metadata = profile['https://rambox.pro/user_metadata'];
			delete profile['https://rambox.pro/user_metadata'];

			// Display a spinner while waiting
			Ext.Msg.wait(locale['app.window[29]'], locale['app.window[28]']);

			// Google Analytics Event
			ga_storage._trackEvent('Users', 'loggedIn');

			// Set cookies to help Tooltip.io messages segmentation
			Ext.util.Cookies.set('auth0', true);

			// User is logged in
			// Save the profile and JWT.
			localStorage.setItem('profile', JSON.stringify(profile));
			localStorage.setItem('access_token', token.access_token);
			localStorage.setItem('id_token', token.id_token);
			localStorage.setItem('refresh_token', token.refresh_token);

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
			 url: 'https://rambox.auth0.com/api/v2/users/'+Ext.decode(localStorage.getItem('profile')).sub
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

		me.auth0.client.userInfo(localStorage.getItem('access_token'), function(err, profile) {
			if ( err ) {
				if ( err.code === 401 ) return me.renewToken(me.restoreConfiguration);
				return Ext.Msg.show({
					 title: 'Error'
					,message: 'There was an error getting the profile: ' + err.description
					,icon: Ext.Msg.ERROR
					,buttons: Ext.Msg.OK
				});
			}

			profile.user_metadata = profile['https://rambox.pro/user_metadata'];
			delete profile['https://rambox.pro/user_metadata'];

			// First we remove all current services
			Ext.cq1('app-main').getController().removeAllServices(false, function() {
				if ( !profile.user_metadata || !profile.user_metadata.services ) return;
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

		me.auth0.client.userInfo(localStorage.getItem('access_token'), function(err, profile) {
			if ( err ) {
				if ( err.code === 401 ) return me.renewToken(me.checkConfiguration);
				return Ext.Msg.show({
					 title: 'Error'
					,message: 'There was an error getting the profile: ' + err.description
					,icon: Ext.Msg.ERROR
					,buttons: Ext.Msg.OK
				});
			}

			profile.user_metadata = profile['https://rambox.pro/user_metadata'];
			delete profile['https://rambox.pro/user_metadata'];

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
					 html: '<i class="fa fa-check fa-3x fa-pull-left" aria-hidden="true"></i> Latest backup is already applied.'
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
			 url: 'https://rambox.auth0.com/oauth/token'
			,method: 'POST'
			,jsonData: {
				 grant_type: 'refresh_token'
				,client_id: auth0Cfg.clientID
				,client_secret: auth0Cfg.clientSecret
				,refresh_token: localStorage.getItem('refresh_token')
				,api_type: 'app'
			}
			,success: function(response) {
				var json = Ext.decode(response.responseText);
				localStorage.setItem('access_token', json.access_token);
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

		var electron = require('electron').remote;
		var authWindow = new electron.BrowserWindow({
			 title: 'Rambox - Login'
			,width: 400
			,height: 600
			,maximizable: false
			,minimizable: false
			,resizable: false
			,center: true
			,autoHideMenuBar: true
			,skipTaskbar: true
			,fullscreenable: false
			,modal: true
			,parent: require('electron').remote.getCurrentWindow()
			,webPreferences: {
				partition: 'persist:rambox'
			}
		});

		authWindow.on('closed', function() {
			authWindow = null;
		});

		authWindow.loadURL(me.authService.requestAuthCode());

		authWindow.webContents.on('did-navigate', function(e, url) {
			me.authService.requestAccessCode(url, me.onLogin.bind(me), authWindow);
		});
	}

	,logout: function() {
		var me = this;

		localStorage.removeItem('profile');
		localStorage.removeItem('id_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('access_token');

		// Set cookies to help Tooltip.io messages segmentation
		Ext.util.Cookies.set('auth0', false);
	}
});
