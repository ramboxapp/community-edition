Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,alias: 'controller.main'

	,initialize( tabPanel ) {
		const config = ipc.sendSync('getConfig');

		tabPanel.setTabPosition(config.tabbar_location);
		tabPanel.setTabRotation(0);

		let reorderer = tabPanel.plugins.find(function(plugin) {
			return plugin.ptype === "tabreorderer";
		});

		if ( reorderer !== undefined ) {
			const names = reorderer.container.getLayout().names;
			reorderer.dd.dim = names.width;
			reorderer.dd.startAttr = names.beforeX;
			reorderer.dd.endAttr = names.afterX;
		}
	}

	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange( tabPanel, newTab, oldTab ) {
		const me = this;

		localStorage.setItem('last_active_service', newTab.id);

		if ( newTab.id === 'ramboxTab' ) {
			if ( Rambox.app.getTotalNotifications() > 0 ) {
				document.title = 'Rambox-OS ('+ Rambox.app.getTotalNotifications() +')';
			} else {
				document.title = 'Rambox-OS';
			}
			return;
		}

		if (!newTab.record.get('enabled') ) {
			return;
		}

		const webview = newTab.getWebView();
		if ( webview ) webview.focus();

		// Update the main window so it includes the active tab title.
		if ( Rambox.app.getTotalNotifications() > 0 ) {
			document.title = 'Rambox-OS ('+ Rambox.app.getTotalNotifications() +') - ' + newTab.record.get('name');
		} else {
			document.title = 'Rambox-OS - ' + newTab.record.get('name');
		}
	}

	,updatePositions(tabPanel, tab) {
		if ( tab.id === 'ramboxTab' || tab.id === 'tbfill' ) return true;

		console.log('Updating Tabs positions...');

		const store = Ext.getStore('Services');
		let align = 'left';
		store.suspendEvent('childmove');
		Ext.each(tabPanel.items.items, function(t, i) {
			if ( t.id !== 'ramboxTab' && t.id !== 'tbfill' && t.record.get('enabled') ) {
				const rec = store.getById(t.record.get('id'));
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
		store.resumeEvent('childmove');
	}

	,showServiceTab( grid, record, tr, rowIndex, e ) {
		if ( e.position.colIdx === 0 ) { // Service Logo
			Ext.getCmp('tab_'+record.get('id')).show();
		}
	}

	,onRenameService(editor, e) {
		const me = this;

		e.record.commit();

		// Change the title of the Tab
		Ext.getCmp('tab_'+e.record.get('id')).setTitle(e.record.get('name'));
	}

	,onEnableDisableService(cc, rowIndex, checked, obj, hideTab) {
		const rec = Ext.getStore('Services').getAt(rowIndex);

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
				,custom_css_complex: rec.get('custom_css_complex')
				,passive_event_listeners: rec.get('passive_event_listeners')
				,slowed_timers: rec.get('slowed_timers')
				,enabled: rec.get('enabled')
				,record: rec
				,hidden: hideTab
				,tabConfig: {
					 service: rec
				}
			});
		}
	}

	,onNewServiceSelect( view, record, item, index, e ) {
		Ext.create('Rambox.view.add.Add', {
			record: record
		});
	}

	,removeServiceFn(serviceId, total, actual, resolve) {
		const me = this;
		if ( !serviceId ) return false;

		// Get Record
		const rec = Ext.getStore('Services').getById(serviceId);

		if ( !rec.get('enabled') ) {
			rec.set('enabled', true);
			me.onEnableDisableService(null, Ext.getStore('Services').indexOf(rec), true, null, true);
			const tab = Ext.getCmp('tab_'+serviceId);
			const webview = tab.getWebView();

			webview.addEventListener("did-start-loading", function() {
				clearData(webview, tab, resolve);
			});
		} else {
			// Get Tab
			// Clear all trash data
			const tab = Ext.getCmp('tab_'+serviceId);
			const webview = tab.getWebView();
			clearData(webview, tab, resolve);
		}

		const config = ipc.sendSync('getConfig');
		if ( config.default_service === rec.get('id') ) ipc.send('setConfig', Ext.apply(config, { default_service: 'ramboxTab' }));

		function clearData(webview, tab, resolve) {
			webview.getWebContents().clearHistory();
			webview.getWebContents().session.flushStorageData();
			webview.getWebContents().session.clearCache(function () {
				webview.getWebContents().session.clearStorageData(function () {
					webview.getWebContents().session.cookies.flushStore(function() {
						// Remove record from localStorage
						Ext.getStore('Services').remove(rec);
						// Close tab
						tab.close();
						if ( Ext.isFunction(resolve) ) resolve();
						// Close waiting message
						if ( total === actual ) Ext.Msg.hide();
					});
				});
			});
		}
	}

	,removeService( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		const me = this;

		Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[13]']+' <b>'+rec.get('name')+'</b>?', function(btnId) {
			if ( btnId === 'yes' ) {
				Ext.Msg.wait('Please wait until we clear all.', 'Removing...');
				me.removeServiceFn(rec.get('id'), 1, 1);
			}
		});
	}

	,removeAllServices(btn, callback) {
		const me = this;

		// Clear counter for unread messaging
		document.title = 'Rambox-OS';

		const store = Ext.getStore('Services');

		if ( btn ) {
			Ext.Msg.confirm(locale['app.window[12]'], locale['app.window[14]'], function(btnId) {
				if ( btnId === 'yes' ) {
					Ext.Msg.wait('Please wait until we clear all.', 'Removing...');
					_removeAllServices(callback);
				}
			});
		} else {
			_removeAllServices(callback);
		}
		function _removeAllServices (callback) {
			store.load(function(records, operation, success) {
				store.suspendEvent('remove');
				store.suspendEvent('childmove');
				const count = store.getCount();
				let i = 1;
				let promises = [];
				Ext.Array.each(store.collect('id'), function(serviceId) {
					promises.push(new Promise(function(resolve) {
						 me.removeServiceFn(serviceId, count, i++, resolve);
					}));
				});
				Promise.all(promises)
				.then(function(resolve) {
					if ( Ext.isFunction(callback) ) callback();
					return resolve;
				})
				.catch(function(err) {
					console.error('Error removing services: ' + err);
					Ext.Msg.alert('Error!','Error removing services: ' + err);
				})
				.finally(function() {
					store.resumeEvent('childmove');
					store.resumeEvent('remove');
					document.title = 'Rambox-OS';
				});
			});
		}
	}

	,configureService( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		Ext.create('Rambox.view.add.Add', {
			 record: rec
			,service: Ext.getStore('ServicesList').getById(rec.get('type'))
			,edit: true
		});
	}

	,onSearchRender( field ) {
		field.focus(false, 1000);
	}

	,onSearchEnter( field, e ) {
		const me = this;

		if ( e.getKey() === e.ENTER && Ext.getStore('ServicesList').getCount() === 2 ) { // Two because we always shows Custom Service option
			me.onNewServiceSelect(field.up().down('dataview'), Ext.getStore('ServicesList').getAt(0));
			me.onClearClick(field);
		}
	}

	,doTypeFilter( cg, newValue, oldValue ) {
		const me = this;

		Ext.getStore('ServicesList').getFilters().replaceAll({
			fn(record) {
				return Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type')) || record.get('type') === 'custom';
			}
		});
	}

	,onSearchServiceChange(field, newValue, oldValue) {
		const me = this;

		const cg = field.up().down('checkboxgroup');
		if ( !Ext.isEmpty(newValue) && newValue.length > 0 ) {
			field.getTrigger('clear').show();

			Ext.getStore('ServicesList').getFilters().replaceAll({
				fn(record) {
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

	,onClearClick(field, trigger, e) {
		const me = this;

		const cg = field.up().down('checkboxgroup');

		field.reset();
		field.getTrigger('clear').hide();
		field.updateLayout();

		Ext.getStore('ServicesList').getFilters().removeAll();
		me.doTypeFilter(cg);
	}

	,dontDisturb(btn, e, called) {
		console.info('Dont Disturb:', btn.pressed ? 'Enabled' : 'Disabled');

		Ext.Array.each(Ext.getStore('Services').collect('id'), function(serviceId) {
			// Get Tab
			const tab = Ext.getCmp('tab_'+serviceId);

			if ( !tab ) return; // Skip disabled services

			// Mute sounds
			tab.setAudioMuted(btn.pressed ? true : tab.record.get('muted'), true);

			// Prevent Notifications
			tab.setNotifications(btn.pressed ? false : tab.record.get('notifications'), true);
		});

		localStorage.setItem('dontDisturb', btn.pressed);

		ipc.send('setDontDisturb', btn.pressed);

		btn.setText(locale['app.main[16]']+': ' + ( btn.pressed ? locale['app.window[20]'] : locale['app.window[21]'] ));

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

	,lockRambox(btn) {
		const me = this;

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
			const msgbox = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[22]'], function(btnId, text) {
				if ( btnId === 'ok' ) {
					const msgbox2 = Ext.Msg.prompt(locale['app.main[19]'], locale['app.window[23]'], function(btnId, text2) {
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
			console.info('Lock Rambox:', 'Enabled');

			// Save encrypted password in localStorage to show locked when app is reopen
			localStorage.setItem('locked', text);

			me.lookupReference('disturbBtn').setPressed(true);
			me.dontDisturb(me.lookupReference('disturbBtn'), false, true);

			me.showLockWindow();
		}
	}

	,showLockWindow() {
		const me = this;

		const validateFn = function() {
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

		const winLock = Ext.create('Ext.window.Window', {
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
								specialkey(field, e){
									if ( e.getKey() === e.ENTER ) {
										validateFn();
									}
								}
							}
						}
						,{
							 xtype: 'button'
							,text: locale['app.window[27]']
							,glyph: 'XF13E@FontAwesome'
							,width: 256
							,scale: 'large'
							,handler: validateFn
						}
					]
				}
			]
			,listeners: {
				render(win) {
					win.getEl().on('click', function() {
						win.down('textfield').focus(100);
					});
				}
			}
		}).show();
		winLock.down('textfield').focus(1000);
	}

	,openPreferences( btn ) {
		const me = this;

		Ext.create('Rambox.view.preferences.Preferences').show();
	}

});
