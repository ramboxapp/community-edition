Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,alias: 'controller.main'

	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange: function( tabPanel, newTab, oldTab ) {
		var me = this;

		// Set Google Analytics event
		ga_storage._trackPageview('/index.html', 'main');

		if ( newTab.id === 'ramboxTab' || !newTab.record.get('enabled') ) return;

		var webview = newTab.down('component').el.dom;
		if ( webview ) webview.focus();
	}

	,updatePositions: function(tabPanel, tab) {
		if ( tab.id === 'ramboxTab' || tab.id === 'tbfill' ) return true;

		console.log('Updating Tabs positions...');

		var store = Ext.getStore('Services');
		store.suspendEvent('remove');
		Ext.each(tabPanel.items.items, function(t, i) {
			if ( t.id !== 'ramboxTab' && t.id !== 'tbfill' ) {
				var rec = store.getById(t.record.get('id'));
				if ( rec.get('align') === 'right' ) i--;
				rec.set('position', i);
				rec.save();
			}
		});

		store.load();
		store.resumeEvent('remove');
	}

	,showServiceTab: function( grid, record, tr, rowIndex, e ) {
		if ( e.position.colIdx === 0 ) { // Service Logo
			Ext.getCmp('tab_'+record.get('id')).show();
		}
	}

	,onRenameService: function(editor, e) {
		var me = this;

		e.record.commit();

		// Change the title of the Tab
		Ext.getCmp('tab_'+e.record.get('id')).setTitle(e.record.get('name'));
	}

	,onEnableDisableService: function(cc, rowIndex, checked) {
		var rec = Ext.getStore('Services').getAt(rowIndex);

		Ext.getCmp('tab_'+rec.get('id')).setEnabled(checked);
	}

	,onNewServiceSelect: function( view, record, item, index, e ) {
		Ext.create('Rambox.view.add.Add', {
			record: record
		});
	}

	,removeServiceFn: function(serviceId) {
		if ( !serviceId ) return false;

		// Get Tab
		var tab = Ext.getCmp('tab_'+serviceId);
		// Get Record
		var rec = Ext.getStore('Services').getById(serviceId);

		// Clear all trash data
		if ( rec.get('enabled') && tab.down('component').el ) {
			tab.down('component').el.dom.getWebContents().session.clearCache(Ext.emptyFn);
			tab.down('component').el.dom.getWebContents().session.clearStorageData({}, Ext.emptyFn);
		}

		// Remove record from localStorage
		Ext.getStore('Services').remove(rec);

		// Close tab
		tab.close();
	}

	,removeService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		var me = this;

		Ext.Msg.confirm('Please confirm...', 'Are you sure you want to remove <b>'+rec.get('name')+'</b>?', function(btnId) {
			if ( btnId === 'yes' ) me.removeServiceFn(rec.get('id'));
		});
	}

	,removeAllServices: function(btn, callback) {
		var me = this;

		// Clear counter for unread messaging
		document.title = 'Rambox';

		if ( btn ) {
			Ext.Msg.confirm('Please confirm...', 'Are you sure you want to remove all services?', function(btnId) {
				if ( btnId === 'yes' ) {
					Ext.cq1('app-main').suspendEvent('remove');
					Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
						me.removeServiceFn(serviceId);
					});
					Ext.getStore('Services').load();
					if ( Ext.isFunction(callback) ) callback();
					Ext.cq1('app-main').resumeEvent('remove');
					document.title = 'Rambox';
				}
			});
		} else {
			Ext.cq1('app-main').suspendEvent('remove');
			Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
				me.removeServiceFn(serviceId);
			});
			Ext.getStore('Services').load();
			if ( Ext.isFunction(callback) ) callback();
			Ext.cq1('app-main').resumeEvent('remove');
			document.title = 'Rambox';
		}
	}

	,configureService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		Ext.create('Rambox.view.add.Add', {
			 record: rec
			,service: Ext.getStore('ServicesList').getById(rec.get('type'))
			,edit: true
		});
	}

	,onSearchRender: function( field ) {
		field.focus(false, 1000);
	}

	,onSearchEnter: function( field, e ) {
		var me = this;

		if ( e.getKey() == e.ENTER && Ext.getStore('ServicesList').getCount() === 2 ) { // Two because we always shows Custom Service option
			me.onNewServiceSelect(field.up().down('dataview'), Ext.getStore('ServicesList').getAt(0));
			me.onClearClick(field);
		}
	}

	,doTypeFilter: function( cg, newValue, oldValue ) {
		var me = this;

		Ext.getStore('ServicesList').getFilters().replaceAll({
			fn: function(record) {
				return Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type')) || record.get('type') === 'custom';
			}
		});
	}

	,onSearchServiceChange: function(field, newValue, oldValue) {
		var me = this;

		var cg = field.up().down('checkboxgroup');
		if ( !Ext.isEmpty(newValue) && newValue.length > 0 ) {
			field.getTrigger('clear').show();

			Ext.getStore('ServicesList').getFilters().replaceAll({
				fn: function(record) {
					if ( record.get('type') === 'custom' ) return true;
					if ( !Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type')) ) return false;
					return record.get('name').toLowerCase().indexOf(newValue.toLowerCase()) > -1 ? true : false;
				}
			});
		} else {
			field.getTrigger('clear').hide();
			Ext.getStore('ServicesList').getFilters().removeAll();
			me.doTypeFilter(cg);
		}
		field.updateLayout();
	}

	,onClearClick: function(field, trigger, e) {
		var me = this;

		var cg = field.up().down('checkboxgroup');

		field.reset();
		field.getTrigger('clear').hide();
		field.updateLayout();

		Ext.getStore('ServicesList').getFilters().removeAll();
		me.doTypeFilter(cg);
	}

	,dontDisturb: function(btn, e, called) {
		console.info('Dont Disturb:', btn.pressed ? 'Enabled' : 'Disabled');

		// Google Analytics Event
		if ( !called ) ga_storage._trackEvent('Usability', 'dontDisturb', ( btn.pressed ? 'on' : 'off' ));

		Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
			// Get Tab
			var tab = Ext.getCmp('tab_'+serviceId);

			// Mute sounds
			tab.setAudioMuted(btn.pressed ? true : tab.record.get('muted'), true);

			// Prevent Notifications
			tab.setNotifications(btn.pressed ? false : tab.record.get('notifications'), true);
		});

		localStorage.setItem('dontDisturb', btn.pressed);

		btn.setText('Don\'t Disturb: ' + ( btn.pressed ? 'ON' : 'OFF' ));

		// If this method is called from Lock method, prevent showing toast
		if ( !e ) return;
		Ext.toast({
			 html: btn.pressed ? 'ENABLED' : 'DISABLED'
			,title: 'Don\'t Disturb'
			,width: 200
			,align: 't'
			,closable: false
		});
	}

	,lockRambox: function(btn) {
		var me = this;

		var msgbox = Ext.Msg.prompt('Lock Rambox', 'Enter a temporal password to unlock it later', function(btnId, text) {
			if ( btnId === 'ok' ) {
				var msgbox2 = Ext.Msg.prompt('Lock Rambox', 'Repeat the temporal password', function(btnId, text2) {
					if ( btnId === 'ok' ) {
						if ( text !== text2 ) {
							Ext.Msg.show({
								 title: 'Warning'
								,message: 'Passwords are not the same. Please try again...'
								,icon: Ext.Msg.WARNING
								,buttons: Ext.Msg.OK
								,fn: me.lockRambox
							});
							return false;
						}

						console.info('Lock Rambox:', 'Enabled');

						// Save encrypted password in localStorage to show locked when app is reopen
						localStorage.setItem('locked', Rambox.util.MD5.encypt(text));

						// Google Analytics Event
						ga_storage._trackEvent('Usability', 'locked');

						me.lookupReference('disturbBtn').setPressed(true);
						me.dontDisturb(me.lookupReference('disturbBtn'), false, true);

						me.showLockWindow();
					}
				});
				msgbox2.textField.inputEl.dom.type = 'password';
			}
		});
		msgbox.textField.inputEl.dom.type = 'password';
	}

	,showLockWindow: function() {
		var me = this;

		var validateFn = function() {
			if ( localStorage.getItem('locked') === Rambox.util.MD5.encypt(winLock.down('textfield').getValue()) ) {
				console.info('Lock Rambox:', 'Disabled');
				localStorage.removeItem('locked');
				winLock.close();
				me.lookupReference('disturbBtn').setPressed(false);
				me.dontDisturb(me.lookupReference('disturbBtn'), false);
			} else {
				winLock.down('textfield').reset();
				winLock.down('textfield').markInvalid('Unlock password is invalid');
			}
		};

		var winLock = Ext.create('Ext.window.Window', {
			 maximized: true
			,closable: false
			,resizable: false
			,minimizable: false
			,maximizable: false
			,draggable: false
			,onEsc: Ext.emptyFn
			,layout: 'center'
			,bodyStyle: 'background-color:#2e658e;'
			,items: [
				{
					 xtype: 'container'
					,layout: 'vbox'
					,items: [
						{
							 xtype: 'image'
							,src: 'resources/Icon.png'
							,width: 256
							,height: 256
						}
						,{
							 xtype: 'component'
							,autoEl: {
								 tag: 'h1'
								,html: 'Rambox is locked'
								,style: 'text-align:center;width:256px;'
						   }
						}
						,{
							 xtype: 'textfield'
							,inputType: 'password'
							,width: 256
							,listeners: {
								specialkey: function(field, e){
									if ( e.getKey() == e.ENTER ) {
										validateFn();
									}
								}
							}
						}
						,{
							 xtype: 'button'
							,text: 'UNLOCK'
							,glyph: 'xf13e@FontAwesome'
							,width: 256
							,scale: 'large'
							,handler: validateFn
						}
					]
				}
			]
		}).show();
		winLock.down('textfield').focus(1000);
	}

	,openPreferences: function( btn ) {
		var me = this;

		Ext.create('Rambox.view.preferences.Preferences').show();
	}

	,login: function(btn) {
		var me = this;

		Rambox.ux.Auth0.login();
	}

	,logout: function(btn) {
		var me = this;

		var logoutFn = function(callback) {
			Ext.Msg.wait('Closing you session...', 'Logout');

			// Google Analytics Event
			ga_storage._trackEvent('Users', 'loggedOut');

			firebase.auth().signOut().then(function() {
				// Remove Events for Firebase
				Rambox.ux.Firebase.removeEvents();

				// Logout from Auth0
				Rambox.ux.Auth0.logout();

				Ext.cq1('app-main').getViewModel().set('username', '');
				Ext.cq1('app-main').getViewModel().set('avatar', '');

				if ( Ext.isFunction(callback) ) callback();

				Ext.Msg.hide();
			}, function(error) {
				console.error(error);
			});
		}

		if ( btn ) {
			Ext.Msg.confirm('Logout', 'Are you sure you want to logout?', function(btnId) {
				if ( btnId === 'yes' ) {
					logoutFn(function() {
						me.removeAllServices();
					});
				}
			});
		} else {
			logoutFn();
		}
	}

	,showDonate: function( btn ) {
		Tooltip.API.show('zxzKWZfcmgRtHXgth');
	}
});
