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

				console.log('LOGIN', err, profile, authResult.idToken);

				// Display a spinner while waiting
				Ext.Msg.wait('Please wait until we get your configuration.', 'Connecting...');

				// Google Analytics Event
				ga_storage._trackEvent('Users', 'loggedIn');

				// Set the options to retreive a firebase delegation token
				var options = {
					 id_token: authResult.idToken
					,api: 'firebase'
					,scope: 'openid name email displayName'
					,target: auth0Cfg.clientID
				};

				// Make a call to the Auth0 '/delegate'
				me.auth0.getDelegationToken(options, function(err, result) {
					if ( !err ) {
						// Exchange the delegate token for a Firebase auth token
						firebase.auth().signInWithCustomToken(result.id_token).then(function(snapshot) {
							fireRef.database().ref('users/' + profile.user_id).child('services').orderByChild('position').once('value', function(snapshot2) {
								Ext.Msg.hide();

								// Import Services function
								var importServices = function(snap) {
									snap.forEach(function(data) {
										var s = data.val();
										s.firebase_key = data.key;
										var service = Ext.create('Rambox.model.Service', s);
										service.save();
										Ext.getStore('Services').add(service);
									});
									Ext.getStore('Services').resumeEvent('load');
									Ext.getStore('Services').load();

									// User is logged in
									// Save the profile and JWT.
									localStorage.setItem('profile', JSON.stringify(profile));
									localStorage.setItem('id_token', authResult.idToken);

									// Define Events for Firebase
									Rambox.ux.Firebase.createEvents();
								}

								// Firebase empty and Have Services
								if ( !snapshot2.hasChildren() && Ext.getStore('Services').getCount() > 0 ) {
									Ext.Msg.confirm('Import', 'You don\'t have any service saved. Do you want to import your current services?', function(btnId) {
										if ( btnId === 'yes' ) {
											var services = [];
											Ext.getStore('Services').each(function(service, index) {
												service.set('firebase_key', index);
												// Prevent saving local ID into Firebase
												var data = Ext.clone(service.data);
												delete data.id;

												services.push(data);
											});
											fireRef.database().ref('users/' + profile.user_id).set({
												services: services
											});

											// User is logged in
											// Save the profile and JWT.
											localStorage.setItem('profile', JSON.stringify(profile));
											localStorage.setItem('id_token', authResult.idToken);

											// Define Events for Firebase
											Rambox.ux.Firebase.createEvents();
										} else {
											Ext.Msg.confirm('Clear services', 'Do you want to remove all your current services to start over?<br /><br />If <b>NO</b>, you will be logged out.', function(btnId) {
												if ( btnId === 'yes' ) {
													Ext.cq1('app-main').getController().removeAllServices(false);
												} else {
													me.logout();
												}
											});
										}
									});
								// Firebase not empty and Have Services
								} else if ( snapshot2.hasChildren() && Ext.getStore('Services').getCount() > 0 ) {
									Ext.Msg.confirm('Confirm', 'To import your configuration, I need to remove all your current services. Do you want to continue?<br /><br />If <b>NO</b>, you will be logged out.', function(btnId) {
										if ( btnId === 'yes' ) {
											Ext.cq1('app-main').getController().removeAllServices(false, function() {
												importServices(snapshot2);
											});
										} else {
											me.logout();
										}
									});
								// Firebase not empty and Have no Services
								} else if ( snapshot2.hasChildren() && Ext.getStore('Services').getCount() === 0 ) {
									importServices(snapshot2);
								} else {
									// Save the profile and JWT.
									localStorage.setItem('profile', JSON.stringify(profile));
									localStorage.setItem('id_token', authResult.idToken);
								}
							});
						}).catch(function(error) {
							Ext.Msg.hide();
							Ext.Msg.show({
								 title: 'Firebug Error'
								,message: error.message+'<br><br>Code: '+error.code+'<br><br>Sorry, try again later.'
								,icon: Ext.Msg.ERROR
								,buttons: Ext.Msg.OK
							});
							me.logout();
							Ext.cq1('app-main').getViewModel().set('username', '');
							Ext.cq1('app-main').getViewModel().set('avatar', '');
						});
					}
				});

				Ext.cq1('app-main').getViewModel().set('username', profile.name);
				Ext.cq1('app-main').getViewModel().set('avatar', profile.picture);
			});
		});
	}

	,login: function() {
		var me = this;

		if ( !me.auth0 ) Rambox.ux.Auth0.init();

		me.lock.show();
	}

	,logout: function() {
		var me = this;

		localStorage.removeItem('profile');
		localStorage.removeItem('id_token');
	}
});
