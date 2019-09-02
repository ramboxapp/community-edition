Ext.define('Hamsket.view.add.AddController', {
	extend: 'Ext.app.ViewController',
	alias: 'controller.add-add',

	requires: [
		'Hamsket.util.UnreadCounter'
	],

	doCancel( btn ) {
		const me = this;

		me.getView().close();
	}

	,doSave( btn ) {
		const me = this;

		const win = me.getView();
		if ( !win.down('form').isValid() ) return false;

		const formValues = win.down('form').getValues();

		if ( win.edit ) {
			// Format data
			if ( win.service.get('url').indexOf('___') >= 0 ) {
				formValues.url = formValues.cycleValue === '1' ? win.service.get('url').replace('___', formValues.url) : formValues.url;
			}

			const oldData = win.record.getData();
			win.record.set({
				 logo: formValues.logo
				,name: formValues.serviceName
				,url: formValues.url
				,align: formValues.align
				,notifications: formValues.notifications
				,muted: formValues.muted
				,tabname: formValues.tabname
				,displayTabUnreadCounter: formValues.displayTabUnreadCounter
				,includeInGlobalUnreadCounter: formValues.includeInGlobalUnreadCounter
				,trust: formValues.trust
				,js_unread: formValues.js_unread
				,custom_js: formValues.custom_js
				,custom_css: formValues.custom_css
				,custom_css_complex: formValues.custom_css_complex
				,passive_event_listeners: formValues.passive_event_listeners
				,slowed_timers: formValues.slowed_timers
				,userAgent: formValues.userAgent
				,os_override: formValues.os_override
				,chrome_version: formValues.chrome_version
			});

			const view = Ext.getCmp('tab_'+win.record.get('id'));

			// Change the title of the Tab
			view.setTitle( formValues.tabname ? formValues.serviceName : '' );
			// Change sound of the Tab
			view.setAudioMuted(formValues.muted);
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
			let showNotify=false;
			const standard_form_names = [
				 'custom_js'
				,'custom_css_complex'
				,'custom_css'
				,'js_unread'
				,'passive_event_listeners'
				,'slowed_timers'
			];
			for (form_name of standard_form_names) {
				const form =  win.down('[name=' + form_name + ']');
				if (form.isDirty()) {
					showNotify = true;
					break;
				}
			}
			const ua_form_names = [
				'os_override',
				'userAgent',
				'chrome_version'
			];
			for (form_name of ua_form_names) {
				const form =  win.down('[name=' + form_name + ']');
				if (form.isDirty()) {
					showNotify = true;
					view.updateUserAgent();
					break;
				}
			}

			if ( showNotify ) {
				Ext.Msg.confirm(locale['app.window[8]'].toUpperCase(), 'Hamsket needs to reload the service to apply your changes. Do you want to do it now?', function( btnId ) {
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

			const service = Ext.create('Hamsket.model.Service', {
				 type: win.record.get('id')
				,logo: formValues.logo
				,name: formValues.serviceName
				,url: formValues.url
				,align: formValues.align
				,notifications: formValues.notifications
				,muted: formValues.muted
				,tabname: formValues.tabname
				,displayTabUnreadCounter: formValues.displayTabUnreadCounter
				,includeInGlobalUnreadCounter: formValues.includeInGlobalUnreadCounter
				,trust: formValues.trust
				,js_unread: formValues.js_unread
				,custom_js: formValues.custom_js
				,custom_css: formValues.custom_css
				,custom_css_complex: formValues.custom_css_complex
				,passive_event_listeners: formValues.passive_event_listeners
				,slowed_timers: formValues.slowed_timers
				,userAgent: formValues.userAgent
				,os_override: formValues.os_override
				,chrome_version: formValues.chrome_version
			});
			service.save();
			Ext.getStore('Services').add(service);

			const tabData = {
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
				const tbfill = Ext.cq1('app-main').getTabBar().down('tbfill');
				Ext.cq1('app-main').insert(Ext.cq1('app-main').getTabBar().items.indexOf(tbfill), tabData).show();
			} else {
				Ext.cq1('app-main').add(tabData).show();
			}
		}

		win.close();
	}

	,onEnter(field, e) {
		const me = this;

		if ( e.getKey() === e.ENTER && field.up('form').isValid() ) me.doSave();
	}

	,onShow(win) {
		const me = this;

		// Make focus to the name field
		win.down('textfield[name="serviceName"]').focus(true, 100);
	}
});
