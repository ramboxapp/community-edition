Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,requires: [
	]

	,alias: 'controller.main'

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
							});
							service.save();

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
						});
						service.save();

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
		Ext.Msg.confirm('Please confirm...', 'Are you sure you want to remove '+rec.get('name')+'?', function(btnId) {
			if ( btnId === 'yes' ) {
				gridView.getStore().remove(rec);
				//webview.webContents.session.clearCache();
				Ext.getCmp('tab_'+rec.get('id')).close();
			}
		});
	}

	,configureService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		this.showSimpleModal(rec, true);
	}

	,doFilter: function( cg, newValue, oldValue ) {
		var values = Ext.cq1('checkboxgroup').getValue();
		Ext.getStore('ServicesList').getFilters().replaceAll({
			fn: function(record) {
				return Ext.Array.contains(Ext.Object.getKeys(values), record.get('type'));
			}
		});
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
						});
						service.save();

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
});
