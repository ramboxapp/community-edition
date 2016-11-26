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

	,title: 'Preferences'
	,width: 400
	,modal: true
	,closable: true
	,minimizable: false
	,maximizable: false
	,draggable: true
	,buttons: [
		{
			 text: 'Cancel'
			,ui: 'decline'
			,handler: 'cancel'
		}
		,'->'
		,{
			 text: 'Save'
			,handler: 'save'
		}
	]

	,initComponent: function() {
		var config = ipc.sendSync('getConfig');

		this.items = [
			{
				 xtype: 'form'
				,bodyPadding: 20
				,items: [
					{
						 xtype: 'checkbox'
						,name: 'auto_launch'
						,boxLabel: 'Start automatically on system startup'
						,value: config.auto_launch
					}
					,{
						 xtype: 'checkbox'
						,name: 'start_minimized'
						,boxLabel: 'Start minimized'
						,value: config.start_minimized
					}
					,{
						 xtype: 'checkbox'
						,name: 'hide_menu_bar'
						,boxLabel: 'Auto-hide Menu bar (<code>Alt</code> key to display)'
						,value: config.hide_menu_bar
						,hidden: process.platform !== 'win32'
					}
					,{
						 xtype: 'checkbox'
						,name: 'skip_taskbar'
						,boxLabel: 'Show in Taskbar'
						,value: config.skip_taskbar
						,reference: 'skipTaskbar'
						,hidden: process.platform === 'darwin'
					},
					{
						xtype: 'combo',
						name: 'window_close_behavior',
						fieldLabel: 'When closing the main window',
						labelAlign: 'top',
						value: config.window_close_behavior,
						displayField: 'label',
						valueField: 'value',
						editable: false,
						store: Ext.create('Ext.data.Store', {
							fields: ['value', 'label'],
							data : [
								{ 'value': 'keep_in_tray', 'label': 'Keep in tray' },
								{ 'value': 'keep_in_tray_and_taskbar', 'label': 'Keep in tray and taskbar' },
								{ 'value': 'quit', 'label': 'Quit' }
							]
						}),
						hidden: process.platform === 'darwin'
					},
					{
						 xtype: 'checkbox'
						,name: 'always_on_top'
						,boxLabel: 'Always on top'
						,value: config.always_on_top
					}
					,{
						 xtype: 'checkbox'
						,name: 'systemtray_indicator'
						,boxLabel: 'Show System Tray indicator on unread messages'
						,value: config.systemtray_indicator
						,hidden: process.platform === 'darwin'
					}
					,{
						 xtype: 'checkbox'
						,name: 'disable_gpu'
						,boxLabel: 'Disable Hardware Acceleration (needs to relaunch)'
						,value: config.disable_gpu
					}
					,{
						 xtype: 'fieldset'
						,title: 'Master Password - Ask for password on startup'
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
								,fieldLabel: 'Password'
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
								,fieldLabel: 'Repeat Password'
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
						,title: 'Proxy (needs to relaunch) - <a href="http://proxylist.hidemyass.com/" target="_blank">Free IP:PORT Proxy List</a>'
						,collapsed: !config.proxy
						,checkboxToggle: true
						,checkboxName: 'proxy'
						,margin: '10 0 0 0'
						,padding: 10
						,layout: 'hbox'
						,defaults: { labelAlign: 'top' }
						,items: [
							{
								 xtype: 'textfield'
								,vtype: 'url'
								,fieldLabel: 'Host'
								,name: 'proxyHost'
								,value: config.proxyHost
								,flex: 1
							}
							,{
								 xtype: 'numberfield'
								,fieldLabel: 'Port'
								,name: 'proxyPort'
								,width: 100
								,value: config.proxyPort
								,margin: '0 0 0 10'
							}
						]
					}
				]
			}
		];

		this.callParent();
	}
});
