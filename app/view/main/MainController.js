const darkreader = require('darkreader');

Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,alias: 'controller.main'

	,initialize: function( tabPanel ) {
		const config = ipc.sendSync('getConfig');

		if (config.darkreader) {
			darkreader.enable();
		} else {
			darkreader.disable();
		}
		tabPanel.setTabPosition(config.tabbar_location);
		tabPanel.setTabRotation(0);

		var reorderer = tabPanel.plugins.find(function(plugin) { return plugin.ptype == "tabreorderer"});

		if ( reorderer !== undefined ) {
			const names = reorderer.container.getLayout().names;
			reorderer.dd.dim = names.width;
			reorderer.dd.startAttr = names.beforeX;
			reorderer.dd.endAttr = names.afterX;
		}
	}

	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange: function( tabPanel, newTab, oldTab ) {
		var me = this;

		// Set Google Analytics event
		ga_storage._trackPageview('/index.html', 'main');

		localStorage.setItem('last_active_service', newTab.id);

		if ( newTab.id === 'ramboxTab' ) {
			if ( Rambox.app.getTotalNotifications() > 0 ) {
				document.title = 'Rambox ('+ Rambox.app.getTotalNotifications() +')';
			} else {
				document.title = 'Rambox';
			}
			return;
		}

		if (!newTab.record.get('enabled') ) {
			return;
		}

		var webview = newTab.down('component').el.dom;

		setTimeout(function () {
			if ( webview ) {
				tabPanel.getActiveTab().getWebView().blur();
				tabPanel.getActiveTab().getWebView().focus();
			}
		}, 300);

		// Update the main window so it includes the active tab title.
		if ( Rambox.app.getTotalNotifications() > 0 ) {
			document.title = 'Rambox ('+ Rambox.app.getTotalNotifications() +') - ' + newTab.record.get('name');
		} else {
			document.title = 'Rambox - ' + newTab.record.get('name');
		}
	}

	,updatePositions: function(tabPanel, tab) {
		if ( tab.id === 'ramboxTab' || tab.id === 'tbfill' ) return true;

		console.log('Updating Tabs positions...');

		var store = Ext.getStore('Services');
		var align = 'left';
		store.suspendEvent('remove');
		Ext.each(tabPanel.items.items, function(t, i) {
			if ( t.id !== 'ramboxTab' && t.id !== 'tbfill' && t.record.get('enabled') ) {
				var rec = store.getById(t.record.get('id'));
				if ( align === 'right' ) i--;
				rec.set('align', align);
				rec.set('position', i);
				rec.save();
			}
			else if ( t.id === 'tbfill' ) {
				align = 'right';
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

	,onEnableDisableService: function(cc, rowIndex, checked, obj, hideTab) {
		var rec = Ext.getStore('Services').getAt(rowIndex);

		if ( !checked ) {
			Ext.getCmp('tab_'+rec.get('id')).destroy();
		} else {
			Ext.cq1('app-main').insert(rec.get('align') === 'left' ? rec.get('position') : rec.get('position')+1, {
				 xtype: 'webview'
				,id: 'tab_'+rec.get('id')
				,title: rec.get('name')
				,icon: rec.get('type') !== 'custom' ? 'resources/icons/'+rec.get('logo') : ( rec.get('logo') === '' ? 'resources/icons/custom.png' : rec.get('logo'))
				,src: rec.get('url')
				,type: rec.get('type')
				,muted: rec.get('muted')
				,includeInGlobalUnreadCounter: rec.get('includeInGlobalUnreadCounter')
				,displayTabUnreadCounter: rec.get('displayTabUnreadCounter')
				,enabled: rec.get('enabled')
				,record: rec
				,useragent: ipc.sendSync('getConfig').user_agent
				,hidden: hideTab
				,tabConfig: {
					 service: rec
				}
			});
		}
	}

	,onNewServiceSelect: function( view, record, item, index, e ) {
		Ext.create('Rambox.view.add.Add', {
			record: record
		});
	}

	,removeServiceFn: function(serviceId, total, actual, callback) {
		var me = this;
		if ( !serviceId ) return false;

		// Get Record
		var rec = Ext.getStore('Services').getById(serviceId);

		if ( !rec.get('enabled') ) {
			rec.set('enabled', true);
			me.onEnableDisableService(null, Ext.getStore('Services').indexOf(rec), true, null, true);

			// Get Tab
			var tab = Ext.getCmp('tab_'+serviceId);
			// Clear all trash data
			const webview = tab.getWebView();
			webview.addEventListener("did-start-loading", function() {
				clearData(webview, tab);
			});
		} else {
			// Get Tab
			var tab = Ext.getCmp('tab_'+serviceId);
			// Clear all trash data
			const webview = tab.getWebView();
			clearData(webview, tab);
		}

		const config = ipc.sendSync('getConfig');
		if ( config.default_service === rec.get('id') ) ipc.send('setConfig', Ext.apply(config, { default_service: 'ramboxTab' }));

		function clearData(webview, tab) {
			webview.getWebContents().clearHistory();
			webview.getWebContents().session.flushStorageData();
			webview.getWebContents().session.clearCache().then(() => {
				webview.getWebContents().session.clearStorageData().then(() => {
					webview.getWebContents().session.cookies.flushStore().then(() => {
						// Remove record from localStorage
						Ext.getStore('Services').remove(rec);
						// Close tab
						tab.close();
						// Close waiting message
						if ( total === actual ) {
							Ext.Msg.hide();
							if ( Ext.isFunction(callback) ) callback();
						}
					}).catch(err => { console.log(err) })
				}).catch(err => { console.log(err) })
			}).catch(err => { console.log(err) })
		}
	}

	,removeService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		var me = this;

		Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[13]']+' <b>'+rec.get('name')+'</b>?', function(btnId) {
			if ( btnId === 'yes' ) {
				Ext.Msg.wait('Please wait until we clear all.', 'Removing...');
				me.removeServiceFn(rec.get('id'), 1, 1);
			}
		});
	}

	,removeAllServices: function(btn, callback) {
		var me = this;

		if ( btn ) {
			Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[14]'], function(btnId) {
				if ( btnId === 'yes' ) {
					// Clear counter for unread messaging
					document.title = 'Rambox';

					Ext.cq1('app-main').suspendEvent('remove');
					Ext.getStore('Services').load();
					Ext.Msg.wait('Please wait until we clear all.', 'Removing...');
					const count = Ext.getStore('Services').getCount();
					var i = 1;
					Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
						me.removeServiceFn(serviceId, count, i++, callback || false);
					});
					if ( count === 0 && Ext.isFunction(callback) ) callback();
					Ext.cq1('app-main').resumeEvent('remove');
				}
			});
		} else {
			Ext.cq1('app-main').suspendEvent('remove');
			Ext.getStore('Services').load();
			const count = Ext.getStore('Services').getCount();
			var i = 1;
			Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
				me.removeServiceFn(serviceId, count, i++, callback || false);
			});
			if ( count === 0 && Ext.isFunction(callback) ) callback();
			Ext.cq1('app-main').resumeEvent('remove');
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

			if ( !tab ) return; // Skip disabled services

			// Mute sounds
			tab.setAudioMuted(btn.pressed ? true : tab.record.get('muted'), true);

			// Prevent Notifications
			tab.setNotifications(btn.pressed ? false : tab.record.get('notifications'), true);
		});

		localStorage.setItem('dontDisturb', btn.pressed);

		ipc.send('setDontDisturb', btn.pressed);

		btn.setText(locale['app.main[16]']+': ' + ( btn.pressed ? locale['app.window[20]'] : locale['app.window[21]'] ));

		// var btn_icon = document.getElementById('disturbBtn-btnIconEl');
		// btn_icon.innerHTML = btn.pressed ? "" : "";

		btn.pressed ? btn.setGlyph('xf1f7@FontAwesome') : btn.setGlyph('xf0f3@FontAwesome');

		Ext.getCmp('mainTabBar').getEl().toggleCls('dontdisturb');

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

		if ( ipc.sendSync('getConfig').master_password ) {
			Ext.Msg.confirm(locale['app.main[19]'], 'Do you want to use the Master Password as your temporal password?', function(btnId) {
				if ( btnId === 'yes' ) {
					setLock(ipc.sendSync('getConfig').master_password);
				} else {
					showTempPass();
				}
			});
		} else {
			showTempPass();
		}

		function showTempPass() {
			var msgbox = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[22]'], function(btnId, text) {
				if ( btnId === 'ok' ) {
					var msgbox2 = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[23]'], function(btnId, text2) {
						if ( btnId === 'ok' ) {
							if ( text !== text2 ) {
								Ext.Msg.show({
									 title: locale['app.window[24]']
									,message: locale['app.window[25]']
									,icon: Ext.Msg.WARNING
									,buttons: Ext.Msg.OK
									,fn: me.lockRambox
								});
								return false;
							}

							setLock(Rambox.util.MD5.encypt(text));
						}
					});
					msgbox2.textField.inputEl.dom.type = 'password';
				}
			});
			msgbox.textField.inputEl.dom.type = 'password';
		}

		function setLock(text) {
			var ramboxTab = Ext.cq1('#ramboxTab');

			// Related to issue #2065. Focusing in an sub frame is a workaround
			if (ramboxTab.getWebView) {
				ramboxTab.down('component').el.dom.executeJavaScript(`
				var iframeFix = document.createElement('iframe');
				document.body.appendChild(iframeFix);
				iframeFix.focus();
				document.body.removeChild(iframeFix);
				`);
			}
			console.info('Lock Rambox:', 'Enabled');

			// Save encrypted password in localStorage to show locked when app is reopen
			localStorage.setItem('locked', text);

			// Google Analytics Event
			ga_storage._trackEvent('Usability', 'locked');

			me.lookupReference('disturbBtn').setPressed(true);
			me.dontDisturb(me.lookupReference('disturbBtn'), false, true);

			me.showLockWindow();
		}
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
								,html: locale['app.window[26]']
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
							,text: locale['app.window[27]']
							,glyph: 'xf13e@FontAwesome'
							,width: 256
							,scale: 'large'
							,handler: validateFn
						}
					]
				}
			]
			,listeners: {
				render: function(win) {
					win.getEl().on('click', function() {
						win.down('textfield').focus(100);
					});
				}
			}
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
			Ext.Msg.wait(locale['app.window[37]'], locale['app.main[21]']);

			// Google Analytics Event
			ga_storage._trackEvent('Users', 'loggedOut');

			// Logout from Auth0
			Rambox.ux.Auth0.logout();

			Ext.cq1('app-main').getViewModel().set('username', '');
			Ext.cq1('app-main').getViewModel().set('avatar', '');

			if ( Ext.isFunction(callback) ) {
				callback(false, function() {
					Ext.Msg.hide();
				});
			} else {
				Ext.Msg.hide();
			}
		}

		if ( btn ) {
			Ext.Msg.confirm(locale['app.main[21]'], locale['app.window[38]'], function(btnId) {
				if ( btnId === 'yes' ) {
					logoutFn(me.removeAllServices.bind(me));
				}
			});
		} else {
			logoutFn();
		}
	}

	,showDonate: function( btn ) {
		Signalayer.API.show('tChaoq3PwSG9wswhn');
	}
});
