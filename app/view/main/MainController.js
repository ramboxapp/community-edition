Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,alias: 'controller.main'

	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange: function( tabPanel, newTab, oldTab ) {
		var me = this;
		var webview = newTab.down('component').el.dom;

		// Set Google Analytics event
		ga_storage._trackPageview('/index.html', 'main');

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

	,onRenameService: function(editor, e) {
		var me = this;

		e.record.commit();

		// Change the title of the Tab
		Ext.getCmp('tab_'+e.record.get('id')).setTitle(e.record.get('name'));
	}

	,showSimpleModal: function(record, edit) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: (edit ? 'Edit ' : 'Add ') + record.get('name')
			,modal: true
			,width: 400
			,resizable: false
			,draggable: false
			,bodyPadding: 20
			,icon: 'resources/icons/' + record.get('logo')
			,items: [
				{
					 xtype: 'form'
					,items: [
						{
							 xtype: 'textfield'
							,fieldLabel: 'Name'
							,value: record.get('name')
							,name: 'serviceName'
							,allowBlank: true
							,listeners: {
								specialkey: function(field, e) {
									if(e.getKey() == e.ENTER && field.up('form').isValid()) {
										field.up('window').down('#submit').handler();
									}
								}
							}
						}
						,{
							 xtype: 'fieldset'
							,title: 'Options'
							,margin: '10 0 0 0'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Align to Right'
									,checked: edit ? (record.get('align') === 'right' ? true : false) : false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: edit ? record.get('notifications') : true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: edit ? record.get('muted') : false
									,uncheckedValue: false
									,inputValue: true
								}
							]
						}
						,{
							 xtype: 'fieldset'
							,title: 'Advanced'
							,margin: '10 0 0 0'
							,collapsible: true
							,collapsed: true
							,items: [
								{
									 xtype: 'textarea'
									,fieldLabel: 'Custom Code (<a href="https://github.com/saenzramiro/rambox/wiki/Inject-JavaScript-Code" target="_blank">read more</a>)'
									,allowBlank: true
									,name: 'js_unread'
									,value: edit ? record.get('js_unread') : ''
									,anchor: '100%'
									,height: 120
								}
							]
						}
						,{
							 xtype: 'container'
							,hidden: (edit ? Ext.getStore('ServicesList').getById(record.get('type')).get('note') === '' : record.get('note') === '')
							,data: { note: (edit ? Ext.getStore('ServicesList').getById(record.get('type')).get('note') : record.get('note')) }
							,margin: '10 0 0 0'
							,style: 'background-color:#93CFE0;color:#053767;border-radius:6px;'
							,tpl: [
								 '<i class="fa fa-info-circle" aria-hidden="true" style="font-size:40px;margin:20px;"></i>'
								,'<span style="font-size: 15px;position: absolute;padding: 10px 10px 10px 0;">{note}</span>'
							]
						}
					]
				}
			]
			,buttons: [
				{
					 text: 'Cancel'
					,ui: 'decline'
					,handler: function() {
						win.close();
					}
				}
				,'->'
				,{
					 text: edit ? 'Save' : 'Add service'
					,itemId: 'submit'
					,handler: function() {
						if ( !win.down('form').isValid() ) return false;

						var formValues = win.down('form').getValues();

						if ( edit ) {
							var oldData = record.getData();
							record.set({
								 name: formValues.serviceName
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,js_unread: formValues.js_unread
							});
							// Change the title of the Tab
							Ext.getCmp('tab_'+record.get('id')).setTitle(formValues.serviceName);
							// Change sound of the Tab
							Ext.getCmp('tab_'+record.get('id')).setAudioMuted(formValues.muted);
							// Change notifications of the Tab
							Ext.getCmp('tab_'+record.get('id')).setNotifications(formValues.notifications);
							// Change the align of the Tab
							if ( oldData.align !== formValues.align ) {
								if ( formValues.align === 'left' ) {
									me.getView().moveBefore(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								} else {
									me.getView().moveAfter(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								}
							}

							Ext.getCmp('tab_'+record.get('id')).record = record;
						} else {
							var service = Ext.create('Rambox.model.Service', {
								 type: record.get('id')
								,logo: record.get('logo')
								,name: formValues.serviceName
								,url: record.get('url')
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,js_unread: formValues.js_unread
							});
							service.save();
							Ext.getStore('Services').add(service);

							var tabData = {
								 xtype: 'webview'
								,id: 'tab_'+service.get('id')
								,title: service.get('name')
								,icon: 'resources/icons/'+service.get('logo')
								,src: service.get('url')
								,type: service.get('type')
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,record: service
								,tabConfig: {
									service: service
								}
							};

							if ( formValues.align === 'left' ) {
								var tbfill = me.getView().getTabBar().down('tbfill');
								me.getView().insert(me.getView().getTabBar().items.indexOf(tbfill), tabData).show();
							} else {
								me.getView().add(tabData).show();
							}
						}

						win.close();
					}
				}
			]
		}).show();

		// Make focus to the name field
		win.down('textfield[name="serviceName"]').focus(true, 100);
	}

	,showCustomModal: function(record, edit) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: (edit ? 'Edit ' : 'Add ') + record.get('name')
			,modal: true
			,width: 400
			,resizable: false
			,draggable: false
			,bodyPadding: 20
			,icon: 'resources/icons/' + record.get('logo')
			,items: [
				{
					 xtype: 'form'
					,items: [
						{
							 xtype: 'textfield'
							,fieldLabel: 'Name'
							,value: record.get('name')
							,name: 'serviceName'
							,allowBlank: true
							,listeners: {
								specialkey: function(field, e) {
									if(e.getKey() == e.ENTER && field.up('form').isValid()) {
										field.up('window').down('#submit').handler();
									}
								}
							}
						}
						,{
							 xtype: 'container'
							,layout: 'column'
							,items: [{
								 xtype: 'textfield'
								,fieldLabel: record.get('name') + ' team'
								,name: 'url'
								,allowBlank: false
								,submitEmptyText: false
								,emptyText: record.get('url') === '___' ? 'http://' : ''
								,vtype: record.get('url') === '___' ? 'url' : ''
								,width: 220
								,listeners: {
									specialkey: function(field, e) {
										if(e.getKey() == e.ENTER && field.up('form').isValid()) {
											field.up('window').down('#submit').handler();
										}
									}
								}
							},{
								 xtype: 'displayfield'
								,value: record.get('url').split('___')[1].slice(0, -1) // Get the URL and remove the final slash (/)
								,submitValue: false // Prevent being submitted
							}]
						}
						,{
							 xtype: 'fieldset'
							,title: 'Options'
							,margin: '10 0 0 0'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Align to Right'
									,checked: edit ? (record.get('align') === 'right' ? true : false) : false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: edit ? record.get('notifications') : true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: edit ? record.get('muted') : false
									,uncheckedValue: false
									,inputValue: true
								}
							]
						}
						,{
							 xtype: 'fieldset'
							,title: 'Advanced'
							,margin: '10 0 0 0'
							,collapsible: true
							,collapsed: true
							,items: [
								{
									 xtype: 'textarea'
									,fieldLabel: 'Custom Code (<a href="https://github.com/saenzramiro/rambox/wiki/Inject-JavaScript-Code" target="_blank">read more</a>)'
									,allowBlank: true
									,name: 'js_unread'
									,value: edit ? record.get('js_unread') : ''
									,anchor: '100%'
									,height: 120
								}
							]
						}
						,{
							 xtype: 'container'
							,hidden: (edit ? Ext.getStore('ServicesList').getById(record.get('type')).get('note') === '' : record.get('note') === '')
 							,data: { note: (edit ? Ext.getStore('ServicesList').getById(record.get('type')).get('note') : record.get('note')) }
							,margin: '10 0 0 0'
							,style: 'background-color:#93CFE0;color:#053767;border-radius:6px;'
							,tpl: [
								 '<i class="fa fa-info-circle" aria-hidden="true" style="font-size:40px;margin:20px;"></i>'
								,'<span style="font-size: 15px;position: absolute;padding: 10px 10px 10px 0;">{note}</span>'
							]
						}
					]
				}
			]
			,buttons: [
				{
					 text: 'Cancel'
					,ui: 'decline'
					,handler: function() {
						win.close();
					}
				}
				,'->'
				,{
					 text: edit ? 'Save' : 'Add service'
					,itemId: 'submit'
					,handler: function() {
						if ( !win.down('form').isValid() ) return false;

						var formValues = win.down('form').getValues();

						if ( edit ) {
							var oldData = record.getData();
							record.set({
								 name: formValues.serviceName
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,js_unread: formValues.js_unread
							});
							// Change the title of the Tab
							Ext.getCmp('tab_'+record.get('id')).setTitle(formValues.serviceName);
							// Change sound of the Tab
							Ext.getCmp('tab_'+record.get('id')).setAudioMuted(formValues.muted);
							// Change notifications of the Tab
							Ext.getCmp('tab_'+record.get('id')).setNotifications(formValues.notifications);
							// Change the align of the Tab
							if ( oldData.align !== formValues.align ) {
								if ( formValues.align === 'left' ) {
									me.getView().moveBefore(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								} else {
									me.getView().moveAfter(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								}
							}

							Ext.getCmp('tab_'+record.get('id')).record = record;
						} else {
							var service = Ext.create('Rambox.model.Service', {
								 type: record.get('id')
								,logo: record.get('logo')
								,name: formValues.serviceName
								,url: record.get('url').replace('___', formValues.url)
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,js_unread: formValues.js_unread
							});
							service.save();
							Ext.getStore('Services').add(service);

							var tabData = {
								 xtype: 'webview'
								,id: 'tab_'+service.get('id')
								,title: service.get('name')
								,icon: 'resources/icons/'+service.get('logo')
								,src: service.get('url')
								,type: service.get('type')
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,record: service
								,tabConfig: {
									service: service
								}
							};

							if ( formValues.align === 'left' ) {
								var tbfill = me.getView().getTabBar().down('tbfill');
								me.getView().insert(me.getView().getTabBar().items.indexOf(tbfill), tabData).show();
							} else {
								me.getView().add(tabData).show();
							}
						}

						win.close();
					}
				}
			]
		}).show();

		// Make focus to the name field
		win.down('textfield[name="serviceName"]').focus(true, 100);
	}

	,onNewServiceSelect: function( view, record, item, index, e ) {
		if ( record.get('url').indexOf('___') >= 0 ) {
			this.showCustomModal(record);
		} else if ( record.get('type') === 'custom' ) {
			this.addCustomService(record, false);
		} else {
			this.showSimpleModal(record, false);
		}
	}

	,removeServiceFn: function(serviceId) {
		if ( !serviceId ) return false;

		// Get Tab
		var tab = Ext.getCmp('tab_'+serviceId);

		// Clear all trash data
		tab.down('component').el.dom.getWebContents().session.clearCache(Ext.emptyFn);
		tab.down('component').el.dom.getWebContents().session.clearStorageData({}, Ext.emptyFn);

		// Remove record from localStorage
		Ext.getStore('Services').remove(Ext.getStore('Services').getById(serviceId));

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
		}
	}

	,configureService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		if ( rec.get('type') === 'custom' ) {
			this.addCustomService(rec, true);
		} else {
			this.showSimpleModal(rec, true);
		}
	}

	,addCustomService: function( record, edit ) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: (edit ? 'Edit ' : 'Add ') + 'Custom Service'
			,modal: true
			,width: 400
			,resizable: false
			,draggable: false
			,bodyPadding: 20
			,items: [
				{
					 xtype: 'form'
					,items: [
						{
							 xtype: 'textfield'
							,fieldLabel: 'Name'
							,name: 'serviceName'
							,value: (edit ? record.get('name') : '')
							,allowBlank: true
							,listeners: {
								specialkey: function(field, e) {
									if(e.getKey() == e.ENTER && field.up('form').isValid()) {
										field.up('window').down('#submit').handler();
									}
								}
							}
						}
						,{
							 xtype: 'textfield'
							,fieldLabel: 'URL'
							,emptyText: 'http://service.url.com'
							,name: 'url'
							,vtype: 'url'
							,value: (edit ? record.get('url') : '')
							,allowBlank: false
							,listeners: {
								specialkey: function(field, e) {
									if(e.getKey() == e.ENTER && field.up('form').isValid()) {
										field.up('window').down('#submit').handler();
									}
								}
							}
						}
						,{
							 xtype: 'textfield'
							,fieldLabel: 'Logo'
							,emptyText: 'http://image.url.com/image.png'
							,name: 'logo'
							,vtype: 'url'
							,value: (edit ? record.get('logo') : '')
							,allowBlank: true
							,listeners: {
								specialkey: function(field, e) {
									if(e.getKey() == e.ENTER && field.up('form').isValid()) {
										field.up('window').down('#submit').handler();
									}
								}
							}
						}
						,{
							 xtype: 'fieldset'
							,title: 'Options'
							,margin: '10 0 0 0'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Align to Right'
									,checked: edit ? (record.get('align') === 'right' ? true : false) : false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: edit ? record.get('notifications') : true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: edit ? record.get('muted') : false
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Trust invalid authority certificates'
									,name: 'trust'
									,checked: edit ? record.get('trust') : false
									,uncheckedValue: false
									,inputValue: true
								}
							]
						}
						,{
							 xtype: 'fieldset'
							,title: 'Advanced'
							,margin: '10 0 0 0'
							,collapsible: true
							,collapsed: true
							,items: [
								{
									 xtype: 'textarea'
									,fieldLabel: 'Custom Code (<a href="https://github.com/saenzramiro/rambox/wiki/Add-a-Custom-Service" target="_blank">read more</a>)'
									,allowBlank: true
									,name: 'js_unread'
									,value: (edit ? record.get('js_unread') : '')
									,anchor: '100%'
									,height: 120
								}
							]
						}
					]
				}
			]
			,buttons: [
				{
					 text: 'Cancel'
					,ui: 'decline'
					,handler: function() {
						win.close();
					}
				}
				,'->'
				,{
					 text: (edit ? 'Edit ' : 'Add ') + ' Service'
					,itemId: 'submit'
					,handler: function() {
						if ( !win.down('form').isValid() ) return false;

						var formValues = win.down('form').getValues();

						if ( edit ) {
							var oldData = record.getData();
							// If users change the URL, we change the URL of the Webview
							if ( record.get('url') !== formValues.url ) Ext.getCmp('tab_'+record.get('id')).down('component').el.dom.loadURL(formValues.url);

							// Save the service
							record.set({
								 name: formValues.serviceName
								,url: formValues.url
								,logo: formValues.logo
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,trust: formValues.trust
								,js_unread: formValues.js_unread
							});

							// Change the title of the Tab
							Ext.getCmp('tab_'+record.get('id')).setTitle(formValues.serviceName);
							// Change sound of the Tab
							Ext.getCmp('tab_'+record.get('id')).setAudioMuted(formValues.muted);
							// Change notifications of the Tab
							Ext.getCmp('tab_'+record.get('id')).setNotifications(formValues.notifications);
							// Change the icon of the Tab
							Ext.getCmp('tab_'+record.get('id')).setIcon(record.get('logo') === '' ? 'resources/icons/custom.png' : record.get('logo'));
							// Change the align of the Tab
							if ( oldData.align !== formValues.align ) {
								if ( formValues.align === 'left' ) {
									me.getView().moveBefore(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								} else {
									me.getView().moveAfter(Ext.getCmp('tab_'+record.get('id')), Ext.getCmp('tbfill'));
								}
							}

							Ext.getCmp('tab_'+record.get('id')).record = record;
						} else {
							var service = Ext.create('Rambox.model.Service', {
								 type: 'custom'
								,logo: formValues.logo
								,name: formValues.serviceName
								,url: formValues.url
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,trust: formValues.trust
								,js_unread: formValues.js_unread
							});
							service.save();
							Ext.getStore('Services').add(service);

							var tabData = {
								 xtype: 'webview'
								,id: 'tab_'+service.get('id')
								,title: service.get('name')
								,icon: 'resources/icons/'+service.get('logo')
								,src: service.get('url')
								,type: service.get('type')
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,record: service
								,tabConfig: {
									service: service
								}
							};

							if ( formValues.align === 'left' ) {
								var tbfill = me.getView().getTabBar().down('tbfill');
								me.getView().insert(me.getView().getTabBar().items.indexOf(tbfill), tabData).show();
							} else {
								me.getView().add(tabData).show();
							}
						}

						win.close();
					}
				}
			]
		}).show();

		// Make focus to the name field
		win.down('textfield[name="serviceName"]').focus(true, 100);
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
			tab.setAudioMuted(btn.pressed);

			// Prevent Notifications
			tab.setNotifications(!btn.pressed);
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
			 width: '100%'
			,height: '100%'
			,closable: false
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

		lock.show({
			icon: 'resources/Icon.png'
		}, function(err, profile, id_token) {
			// There was an error logging the user in
			//if (err) return console.error(err);
			console.log('LOGIN', err, profile, id_token);

			// Display a spinner while waiting
			Ext.Msg.wait('Please wait until we get your configuration.', 'Connecting...');

			// Google Analytics Event
			ga_storage._trackEvent('Users', 'loggedIn');

			// Set the options to retreive a firebase delegation token
			var options = {
				id_token : id_token,
				api : 'firebase',
				scope : 'openid name email displayName',
				target: auth0Cfg.clientID
			};

			// Make a call to the Auth0 '/delegate'
			auth0.getDelegationToken(options, function(err, result) {
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
								localStorage.setItem('id_token', id_token);

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
										localStorage.setItem('id_token', id_token);

										// Define Events for Firebase
										Rambox.ux.Firebase.createEvents();
									} else {
										Ext.Msg.confirm('Clear services', 'Do you want to remove all your current services to start over?<br /><br />If <b>NO</b>, you will be logged out.', function(btnId) {
											if ( btnId === 'yes' ) {
												me.removeAllServices(false);
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
										me.removeAllServices(false, function() {
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
								localStorage.setItem('id_token', id_token);
							}
						});
					});
				}
			});

			Ext.cq1('app-main').getViewModel().set('username', profile.name);
			Ext.cq1('app-main').getViewModel().set('avatar', profile.picture);
		}, function() {
			// Error callback
			Ext.Msg.hide();
		});
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

				localStorage.removeItem('profile');
				localStorage.removeItem('id_token');

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
});
