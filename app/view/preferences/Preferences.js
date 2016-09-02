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
						,name: 'hide_menu_bar'
						,boxLabel: 'Auto-hide Menu bar (<code>Alt</code> key to display)'
						,value: config.hide_menu_bar
						,hidden: Ext.os.is.MacOS
					}
					,{
						 xtype: 'checkbox'
						,name: 'skip_taskbar'
						,boxLabel: 'Show in Taskbar'
						,value: config.skip_taskbar
						,reference: 'skipTaskbar'
						,hidden: Ext.os.is.MacOS
					}
					,{
						 xtype: 'checkbox'
						,name: 'keep_in_taskbar_on_close'
						,boxLabel: 'Keep Rambox in the Taskbar when close it'
						,value: config.keep_in_taskbar_on_close
						,bind: { disabled: '{!skipTaskbar.checked}' }
						,hidden: Ext.os.is.MacOS
					}
					,{
						 xtype: 'checkbox'
						,name: 'always_on_top'
						,boxLabel: 'Always on top'
						,value: config.always_on_top
					}
					,{
						 xtype: 'checkbox'
						,name: 'start_minimized'
						,boxLabel: 'Start minimized'
						,value: config.start_minimized
					}
					,{
						 xtype: 'checkbox'
						,name: 'auto_launch'
						,boxLabel: 'Start automatically on system startup'
						,value: config.auto_launch
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
