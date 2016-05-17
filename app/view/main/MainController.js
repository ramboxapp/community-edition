Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,requires: [
	]

	,alias: 'controller.main'

	// Make focus on webview every time the user change tabs, to enable the autofocus in websites
	,onTabChange: function( tabPanel, newTab, oldTab ) {
		var me = this;
		var webview = newTab.down('component').el.dom;

		if ( webview ) webview.focus();
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
									,boxLabel: 'Separate'
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
						var formValues = win.down('form').getValues();

						if ( edit ) {
							record.set({
								 name: formValues.serviceName
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
							});
							Ext.getCmp('tab_'+record.get('id')).setTitle(formValues.serviceName);
						} else {
							var service = Ext.create('Rambox.model.Service', {
								 type: record.get('id')
								,name: formValues.serviceName
								,url: record.get('url')
								,align: formValues.align
								,notifications: formValues.notifications
								,muted: formValues.muted
								,js_unread: record.get('js_unread')
							});
							service.save();
							Ext.getStore('Services').add(service);

							var tabData = {
								 xtype: 'webview'
								,id: 'tab_'+service.get('id')
								,title: service.get('name')
								,icon: 'resources/icons/'+record.get('logo')
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

	,showCustomModal: function(record) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: 'Add '+record.get('name')
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
									,boxLabel: 'Separate'
									,checked: false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: false
									,uncheckedValue: false
									,inputValue: true
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
					 text: 'Add service'
					,itemId: 'submit'
					,handler: function() {
						var formValues = win.down('form').getValues();

						var service = Ext.create('Rambox.model.Service', {
							 type: record.get('id')
							,name: formValues.serviceName
							,url: record.get('url').replace('___', formValues.url)
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
							,js_unread: record.get('js_unread')
						});
						service.save();
						Ext.getStore('Services').add(service);

						var tabData = {
							 xtype: 'webview'
							,id: 'tab_'+service.get('id')
							,title: service.get('name')
							,icon: 'resources/icons/'+record.get('logo')
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
		} else {
			this.showSimpleModal(record, false);
		}
	}

	,removeService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		Ext.Msg.confirm('Please confirm...', 'Are you sure you want to remove <b>'+rec.get('name')+'</b>?', function(btnId) {
			if ( btnId === 'yes' ) {
				var tab = Ext.getCmp('tab_'+rec.get('id'));

				// Remove record from localStorage
				gridView.getStore().remove(rec);

				// Clear all trash data
				tab.down('component').el.dom.getWebContents().session.clearCache(Ext.emptyFn);
				tab.down('component').el.dom.getWebContents().session.clearStorageData({}, Ext.emptyFn);

				// Close tab
				tab.close();
			}
		});
	}

	,configureService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		this.showSimpleModal(rec, true);
	}

	,addCustomService: function( event, toolEl, owner, tool ) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: 'Add Custom Service'
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
									,boxLabel: 'Separate'
									,checked: false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: false
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
									,fieldLabel: 'Unread Code'
									,allowBlank: true
									,name: 'js_unread'
									,anchor: '100%'
									,emptyText: 'Write code here if the service don\'t update the page title when have new activity. The code needs to return an integer, for example: document.body.getElementsByClassName("ee").length;'
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
					 text: 'Add service'
					,itemId: 'submit'
					,handler: function() {
						var formValues = win.down('form').getValues();

						var service = Ext.create('Rambox.model.Service', {
							 type: 'custom'
							,logo: formValues.logo
							,name: formValues.serviceName
							,url: formValues.url
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
							,js_unread: 'function checkUnread(){updateBadge(' + formValues.js_unread + ')}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
						});
						service.save();
						Ext.getStore('Services').add(service);

						var tabData = {
							 xtype: 'webview'
							,id: 'tab_'+service.get('id')
							,title: service.get('name')
							,icon: formValues.logo
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

		if ( e.getKey() == e.ENTER && Ext.getStore('ServicesList').getCount() === 1 ) {
			me.onNewServiceSelect(field.up().down('dataview'), Ext.getStore('ServicesList').getAt(0));
			me.onClearClick(field);
		}
	}

	,doTypeFilter: function( cg, newValue, oldValue ) {
		var me = this;

		Ext.getStore('ServicesList').getFilters().replaceAll({
			fn: function(record) {
				return Ext.Array.contains(Ext.Object.getKeys(cg.getValue()), record.get('type'));
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
});
