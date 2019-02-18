Ext.define('Rambox.view.add.AddController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.add-add',

	requires: [
		'Rambox.util.UnreadCounter'
	],

	doCancel: function( btn ) {
		var me = this;

		me.getView().close();
	}

	,doSave: function( btn ) {
		var me = this;

		var win = me.getView();
		if ( !win.down('form').isValid() ) return false;

		var formValues = win.down('form').getValues();

		if ( win.edit ) {
			// Format data
			if ( win.service.get('url').indexOf('___') >= 0 ) {
				formValues.url = formValues.cycleValue === '1' ? win.service.get('url').replace('___', formValues.url) : formValues.url;
			}

			var oldData = win.record.getData();
			win.record.set({
				 logo: formValues.logo
				,name: formValues.serviceName
				,url: formValues.url
				,align: formValues.align
				,notifications: formValues.notifications
				,muted: formValues.muted
				,statusbar: formValues.statusbar
				,tabname: formValues.tabname
				,displayTabUnreadCounter: formValues.displayTabUnreadCounter
				,includeInGlobalUnreadCounter: formValues.includeInGlobalUnreadCounter
				,trust: formValues.trust
				,allow_external_tab: formValues.allowExternalTab
				,js_unread: formValues.js_unread
			});

			var view = Ext.getCmp('tab_'+win.record.get('id'));

			// Change the title of the Tab
			view.setTitle( formValues.tabname ? formValues.serviceName : '' );
			// Change sound of the Tab
			view.setAudioMuted(formValues.muted);
			// Change statusbar of the Tab
			view.setStatusBar(formValues.statusbar);
			// Change notifications of the Tab
			view.setNotifications(formValues.notifications);
			// Change the icon of the Tab
			if ( win.record.get('type') === 'custom' && oldData.logo !== formValues.logo ) Ext.getCmp('tab_'+win.record.get('id')).setConfig('icon', formValues.logo === '' ? 'resources/icons/custom.png' : formValues.logo);
			// Change the URL of the Tab
			if ( oldData.url !== formValues.url ) view.setURL(formValues.url);
			// Change the align of the Tab
			if ( oldData.align !== formValues.align ) {
				if ( formValues.align === 'left' ) {
					Ext.cq1('app-main').moveBefore(view, Ext.getCmp('tbfill'));
				} else {
					Ext.cq1('app-main').moveAfter(view, Ext.getCmp('tbfill'));
				}
			}
			// Apply the JS Code of the Tab
			if ( win.down('textarea').isDirty() ) {
				Ext.Msg.confirm(locale['app.window[8]'].toUpperCase(), 'Rambox needs to reload the service to execute the new JavaScript code. Do you want to do it now?', function( btnId ) {
					if ( btnId === 'yes' ) view.reloadService();
				});
			}

			view.record = win.record;
			view.tabConfig.service = win.record;

			view.refreshUnreadCount();
		} else {
			// Format data
			if ( win.record.get('url').indexOf('___') >= 0 ) {
				formValues.url = formValues.cycleValue === '1' ? win.record.get('url').replace('___', formValues.url) : formValues.url;
			}

			var service = Ext.create('Rambox.model.Service', {
				 type: win.record.get('id')
				,logo: formValues.logo
				,name: formValues.serviceName
				,url: formValues.url
				,align: formValues.align
				,notifications: formValues.notifications
				,muted: formValues.muted
				,tabname: formValues.tabname
				,statusbar: formValues.statusbar
				,displayTabUnreadCounter: formValues.displayTabUnreadCounter
				,includeInGlobalUnreadCounter: formValues.includeInGlobalUnreadCounter
				,trust: formValues.trust
				,allow_external_tab: formValues.allowExternalTab
				,js_unread: formValues.js_unread
			});
			service.save();
			Ext.getStore('Services').add(service);

			var tabData = {
				 xtype: 'webview'
				,id: 'tab_'+service.get('id')
				/*
				,title: service.get('name')
				,icon: service.get('logo')
				,src: service.get('url')
				,type: service.get('type')
				,align: formValues.align
				,notifications: formValues.notifications
				,muted: formValues.muted
				*/
				,record: service
				,tabConfig: {
					service: service
				}
			};

			if ( formValues.align === 'left' ) {
				var tbfill = Ext.cq1('app-main').getTabBar().down('tbfill');
				Ext.cq1('app-main').insert(Ext.cq1('app-main').getTabBar().items.indexOf(tbfill), tabData).show();
			} else {
				var c = 0
				Ext.each(Ext.cq1('app-main').items.items, function(t, i) {
					if ( t.isExternal ) {
						c++
					}
				});
				Ext.cq1('app-main').insert(Ext.cq1('app-main').items.length - c,tabData).show();
			}
		}

		win.close();
	}

	,onEnter: function(field, e) {
		var me = this;

		if ( e.getKey() == e.ENTER && field.up('form').isValid() ) me.doSave();
	}

	,onShow: function(win) {
		var me = this;

		// Make focus to the name field
		win.down('textfield[name="serviceName"]').focus(true, 100);
	}
});
