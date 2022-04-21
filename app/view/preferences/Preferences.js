Ext.define('Rambox.view.preferences.Preferences',{
	 extend: 'Ext.window.Window'
	,xtype: 'preferences'

	,requires: [
		 'Rambox.view.preferences.PreferencesController'
		,'Rambox.view.preferences.PreferencesModel'
		,'Ext.form.field.ComboBox'
		,'Ext.form.field.Checkbox'
	]

	,controller: 'preferences-preferences'
	,viewModel: {
		type: 'preferences-preferences'
	}

	,title: locale['preferences[0]']
	,width: 420
	,height: 500
	,modal: true
	,closable: true
	,minimizable: false
	,maximizable: false
	,draggable: true
	,resizable: false
	,scrollable: 'vertical'
	,bodyStyle: 'margin-right:15px;'
	,buttons: [
		{
			 text: locale['button[1]']
			,ui: 'decline'
			,handler: 'cancel'
		}
		,'->'
		,{
			 text: locale['button[4]']
			,handler: 'save'
		}
	]

	,initComponent: function() {
		var config = ipc.sendSync('getConfig');

		var defaultServiceOptions = [];
		defaultServiceOptions.push({ value: 'ramboxTab', label: 'Rambox Tab' });
		defaultServiceOptions.push({ value: 'last', label: 'Last Active Service' });
		Ext.getStore('Services').each(function(rec) {
			defaultServiceOptions.push({
				 value: rec.get('id')
				,label: rec.get('name')
			});
		});

		this.items = [
			{
				 xtype: 'form'
				,bodyPadding: 20
				,items: [
					{
						xtype: 'container'
						,layout: 'hbox'
						,items: [
							{
								 xtype: 'combo'
								,name: 'locale'
								,fieldLabel: 'Language'
								,labelAlign: 'left'
								,flex: 1
								,labelWidth: 80
								,value: config.locale
								,displayField: 'label'
								,valueField: 'value'
								,editable: false
								,store: Ext.create('Ext.data.Store', {
									 fields: ['value', 'label']
									,data: [
										 { 'value': 'af', 'extjs': 'af', 'label': 'Afrikaans' }
										,{ 'value': 'ar', 'extjs': 'en', 'label': 'Arabic' }
										,{ 'value': 'bs2', 'extjs': 'en', 'label': 'Barndutsch, Switzerland' }
										,{ 'value': 'bn', 'extjs': 'en', 'label': 'Bengali' }
										,{ 'value': 'bg', 'extjs': 'en', 'label': 'Bulgarian' }
										,{ 'value': 'ca', 'extjs': 'ca', 'label': 'Catalan' }
										,{ 'value': 'ceb', 'extjs': 'en', 'label': 'Cebuano' }
										,{ 'value': 'zh-CN', 'extjs': 'zh', 'label': 'Chinese Simplified' }
										,{ 'value': 'zh-TW', 'extjs': 'zh-tw', 'label': 'Chinese Traditional' }
										,{ 'value': 'hr', 'extjs': 'en', 'label': 'Croatian' }
										,{ 'value': 'cs', 'extjs': 'cs', 'label': 'Czech' }
										,{ 'value': 'da', 'extjs': 'da', 'label': 'Danish' }
										,{ 'value': 'nl', 'extjs': 'nl', 'label': 'Dutch' }
										,{ 'value': 'en', 'extjs': 'en', 'label': 'English' }
										,{ 'value': 'fi', 'extjs': 'fi', 'label': 'Finnish' }
										,{ 'value': 'fil', 'extjs': 'en', 'label': 'Filipino' }
										,{ 'value': 'fr', 'extjs': 'fr', 'label': 'French' }
										,{ 'value': 'de', 'extjs': 'de', 'label': 'German' }
										,{ 'value': 'de-CH', 'extjs': 'de', 'label': 'German, Switzerland' }
										,{ 'value': 'el', 'extjs': 'el', 'label': 'Greek' }
										,{ 'value': 'he', 'extjs': 'en', 'label': 'Hebrew' }
										,{ 'value': 'hi', 'extjs': 'en', 'label': 'Hindi' }
										,{ 'value': 'hu', 'extjs': 'hu', 'label': 'Hungarian' }
										,{ 'value': 'id', 'extjs': 'en', 'label': 'Indonesian' }
										,{ 'value': 'it', 'extjs': 'it', 'label': 'Italian' }
										,{ 'value': 'ja', 'extjs': 'ja', 'label': 'Japanese' }
										,{ 'value': 'ko', 'extjs': 'ko', 'label': 'Korean' }
										,{ 'value': 'no', 'extjs': 'no', 'label': 'Norwegian' }
										,{ 'value': 'fa', 'extjs': 'fa', 'label': 'Persian' }
										,{ 'value': 'pl', 'extjs': 'pl', 'label': 'Polish' }
										,{ 'value': 'pt-PT', 'extjs': 'pt-br', 'label': 'Portuguese' }
										,{ 'value': 'pt-BR', 'extjs': 'pt-br', 'label': 'Portuguese (Brazilian)' }
										,{ 'value': 'ro', 'extjs': 'ro', 'label': 'Romanian' }
										,{ 'value': 'ru', 'extjs': 'ru', 'label': 'Russian' }
										,{ 'value': 'sr', 'extjs': 'en', 'label': 'Serbian (Cyrillic)' }
										,{ 'value': 'sk', 'extjs': 'sk', 'label': 'Slovak' }
										,{ 'value': 'es-ES', 'extjs': 'es', 'label': 'Spanish' }
										,{ 'value': 'sv-SE', 'extjs': 'sv', 'label': 'Swedish' }
										,{ 'value': 'tl', 'extjs': 'en', 'label': 'Tagalog' }
										,{ 'value': 'th', 'extjs': 'en', 'label': 'Thai' }
										,{ 'value': 'tr', 'extjs': 'tr', 'label': 'Turkish' }
										,{ 'value': 'uk', 'extjs': 'en', 'label': 'Ukrainian' }
										,{ 'value': 'ur-PK', 'extjs': 'en', 'label': 'Urdu (Pakistan)' }
										,{ 'value': 'vi', 'extjs': 'en', 'label': 'Vietnamese' }
									]
								})
							}
							,{
								 xtype: 'button'
								,text: 'Help us Translate'
								,style: 'border-top-left-radius:0;border-bottom-left-radius:0;'
								,href: 'https://crowdin.com/project/rambox/invite'
							}
						]
					}
					,{
						 xtype: 'label'
						,text: 'English is the only language that has full translation. We are working with all the others, help us!'
						,style: 'display:block;font-size:10px;line-height:15px;'
						,margin: '0 0 10 0'
					}
					,{
						 xtype: 'checkbox'
						,name: 'auto_launch'
						,boxLabel: locale['preferences[5]']
						,value: config.auto_launch
					}
					,{
						 xtype: 'checkbox'
						,name: 'start_minimized'
						,boxLabel: locale['preferences[4]']
						,value: config.start_minimized
					}
					,{
						 xtype: 'checkbox'
						,name: 'hide_menu_bar'
						,boxLabel: locale['preferences[1]']+' (<code>Alt</code> key to display)'
						,value: config.hide_menu_bar
						,hidden: process.platform === 'darwin'
					}
					,{
						 xtype: 'combo'
						,name: 'tabbar_location'
						,fieldLabel: locale['preferences[11]']
						,labelAlign: 'left'
						,width: 380
						,labelWidth: 180
						,value: config.tabbar_location
						,displayField: 'label'
						,valueField: 'value'
						,editable: false
						,store: Ext.create('Ext.data.Store', {
							 fields: ['value', 'label']
							,data: [
								 { 'value': 'top', 'label': 'Top' }
								,{ 'value': 'left', 'label': 'Left' }
								,{ 'value': 'bottom', 'label': 'Bottom' }
								,{ 'value': 'right', 'label': 'Right' }
							]
						})
					}
					,{
						xtype: 'checkbox'
						,name: 'hide_tabbar_labels'
						,boxLabel: locale['preferences[28]']
						,value: config.hide_tabbar_labels
					}
					,{
						 xtype: 'combo'
						,name: 'default_service'
						,fieldLabel: locale['preferences[12]']
						,labelAlign: 'top'
						//,width: 380
						//,labelWidth: 105
						,value: config.default_service
						,displayField: 'label'
						,valueField: 'value'
						,editable: false
						,store: Ext.create('Ext.data.Store', {
							 fields: ['value', 'label']
							,data: defaultServiceOptions
						})
					}
					,{
						 xtype: 'combo'
						,name: 'window_display_behavior'
						,fieldLabel: locale['preferences[13]']
						,labelAlign: 'left'
						,width: 380
						,labelWidth: 105
						,value: config.window_display_behavior
						,displayField: 'label'
						,valueField: 'value'
						,editable: false
						,store: Ext.create('Ext.data.Store', {
							 fields: ['value', 'label']
							,data: [
								 { 'value': 'show_taskbar', 'label': locale['preferences[14]'] }
								,{ 'value': 'show_trayIcon', 'label': locale['preferences[15]'] }
								,{ 'value': 'taskbar_tray', 'label': locale['preferences[16]'] }
							]
						})
						,hidden: process.platform === 'darwin'
					}
					,{
						 xtype: 'combo'
						,name: 'window_close_behavior'
						,fieldLabel: locale['preferences[17]']
						,labelAlign: 'left'
						,width: 380
						,labelWidth: 180
						,value: config.window_close_behavior
						,displayField: 'label'
						,valueField: 'value'
						,editable: false
						,store: Ext.create('Ext.data.Store', {
							 fields: ['value', 'label']
							,data: [
								 { 'value': 'keep_in_tray', 'label': locale['preferences[18]'] }
								,{ 'value': 'keep_in_tray_and_taskbar', 'label': locale['preferences[19]'] }
								,{ 'value': 'quit', 'label': locale['preferences[20]'] }
							]
						})
						,hidden: process.platform === 'darwin'
					}
					,{
						 xtype: 'checkbox'
						,name: 'always_on_top'
						,boxLabel: locale['preferences[21]']
						,value: config.always_on_top
					}
					,{
						 xtype: 'checkbox'
						,name: 'systemtray_indicator'
						,boxLabel: locale['preferences[22]']
						,value: config.systemtray_indicator
						,hidden: process.platform === 'darwin'
					}
					,{
						 xtype: 'checkbox'
						,name: 'flash_frame'
						,boxLabel: process.platform === 'darwin' ? locale['preferences[10]'] : locale['preferences[9]']
						,value: config.flash_frame
					}
					,{
						 xtype: 'checkbox'
						,name: 'disable_gpu'
						,boxLabel: locale['preferences[23]']
						,value: config.disable_gpu
					}
					,{
						 xtype: 'checkbox'
						,name: 'enable_hidpi_support'
						,boxLabel: locale['preferences[8]']
						,value: config.enable_hidpi_support
						,hidden: process.platform !== 'win32'
					},
					{
						 xtype: 'textfield'
						,fieldLabel: 'Override User-Agent for all services (needs to relaunch)'
						,labelAlign: 'top'
						,name: 'user_agent'
						,value: config.user_agent
						,width: 360
						,emptyText: 'Leave blank for default user agent'
					}
					,{
						 xtype: 'fieldset'
						,title: locale['preferences[24]']
						,collapsed: !config.master_password
						,checkboxToggle: true
						,checkboxName: 'master_password'
						,margin: '10 0 0 0'
						,padding: 10
						,layout: 'hbox'
						,defaults: { labelAlign: 'top' }
						,items: [
							{
								 xtype: 'textfield'
								,inputType: 'password'
								,fieldLabel: locale['preferences[25]']
								,name: 'master_password1'
								,itemId: 'pass'
								,flex: 1
								,listeners: {
									validitychange: function(field) {
										field.next().validate();
									},
									blur: function(field) {
										field.next().validate();
									}
								}
							}
							,{
								 xtype: 'textfield'
								,inputType: 'password'
								,fieldLabel: locale['preferences[26]']
								,name: 'master_password2'
								,margin: '0 0 0 10'
								,vtype: 'password'
								,initialPassField: 'pass'
								,flex: 1
							}
						]
					}
					,{
						 xtype: 'fieldset'
						,title: 'Proxy (needs to relaunch) - <a href="https://github.com/saenzramiro/rambox/wiki/FREE-PROXY-SERVERS" target="_blank">Free Proxy Servers</a>'
						,collapsed: !config.proxy
						,checkboxToggle: true
						,checkboxName: 'proxy'
						,margin: '10 0 0 0'
						,padding: 10
						,layout: 'vbox'
						,defaults: { labelAlign: 'left' }
						,items: [
							{
								 xtype: 'textfield'
								,vtype: 'url'
								,fieldLabel: 'Host'
								,name: 'proxyHost'
								,value: config.proxyHost
								//,flex: 1
							}
							,{
								 xtype: 'numberfield'
								,fieldLabel: 'Port'
								,name: 'proxyPort'
								,value: config.proxyPort
							}
							,{
								 xtype: 'textfield'
								,fieldLabel: 'Login'
								,name: 'proxyLogin'
								,value: config.proxyLogin
								,emptyText: 'Optional'
							}
							,{
								 xtype: 'textfield'
								,fieldLabel: 'Password'
								,name: 'proxyPassword'
								,value: config.proxyPassword
								,emptyText: 'Optional'
								,inputType: 'password'
							}
						]
					}
				]
			}
		];

		this.callParent();
	}
});
