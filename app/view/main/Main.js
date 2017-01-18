Ext.define('Rambox.view.main.Main', {
	 extend: 'Ext.tab.Panel'
	,requires: [
		 'Rambox.view.main.MainController'
		,'Rambox.view.main.MainModel'
		,'Rambox.ux.WebView'
		,'Rambox.ux.mixin.Badge'
		,'Rambox.view.add.Add'
		,'Ext.ux.TabReorderer'
	]

	,xtype: 'app-main'

	,controller: 'main'
	,viewModel: {
		type: 'main'
	}

	,plugins: [
		{
			 ptype: 'tabreorderer'
		}
	]

	,autoRender: true
	,autoShow: true
	,deferredRender: false
	,items: [
		{
			 icon: 'resources/IconTray@2x.png'
			,id: 'ramboxTab'
			,closable: false
			,reorderable: false
			,autoScroll: true
			,layout: 'hbox'
			,tabConfig: {} // Created empty for Keyboard Shortcuts
			,items: [
				{
					 xtype: 'panel'
					,title: 'Add a new Service'
					,margin: '0 5 0 0'
					,flex: 1
					,header: { height: 50 }
					,tools: [
						{
							 xtype: 'checkboxgroup'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Messaging'
									,name: 'messaging'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Email'
									,margin: '0 10 0 10'
									,name: 'email'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
							]
							,listeners: {
								change: 'doTypeFilter'
							}
						}
						,{
							 xtype: 'textfield'
							,grow: true
							,growMin: 120
							,growMax: 170
							,triggers: {
								 clear: {
									 weight: 0
									,cls: Ext.baseCSSPrefix + 'form-clear-trigger'
									,hidden: true
									,handler: 'onClearClick'
								}
								,search: {
									 weight: 1
									,cls: Ext.baseCSSPrefix + 'form-search-trigger search-trigger'
								}
							}
							,listeners: {
								 change: 'onSearchServiceChange'
								,afterrender: 'onSearchRender'
								,specialkey: 'onSearchEnter'
							}
						}
					]
					,items: [
						{
							 xtype: 'dataview'
							,store: 'ServicesList'
							,itemSelector: 'div.service'
							,tpl: [
								 '<tpl for=".">'
									,'<div class="service" data-qtip="{description}">'
										,'<img src="resources/icons/{logo}" width="48" />'
										,'<span>{name}</span>'
									,'</div>'
								,'</tpl>'
							]
							,emptyText: '<div style="padding: 20px;">No services found... Try another search.</div>'
							,listeners: {
								itemclick: 'onNewServiceSelect'
							}
						}
					]
				}
				,{
					 xtype: 'grid'
					,title: 'Enabled Services'
					,store: 'Services'
					,hideHeaders: true
					,margin: '0 0 0 5'
					,flex: 1
					,header: { height: 50 }
					,features: [
						{
							 ftype:'grouping'
							,collapsible: false
							,groupHeaderTpl: '{columnName:uppercase}: {name:capitalize} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})'
						}
					]
					,plugins: {
						 ptype: 'cellediting'
						,clicksToEdit: 2
					}
					,tools: [
						{
							 xtype: 'button'
							,glyph: 'xf1f8@FontAwesome'
							,baseCls: ''
							,tooltip: 'Remove all Services'
							,handler: 'removeAllServices'
						}
					]
					,columns: [
						{
							 xtype: 'templatecolumn'
							,width: 50
							,variableRowHeight: true
							,tpl: '<img src="{[ values.type !== \"custom\" ? \"resources/icons/\"+values.logo : (values.logo == \"\" ? \"resources/icons/custom.png\" : values.logo) ]}" data-qtip="{type:capitalize}" width="32" />'
						}
						,{
							 dataIndex: 'name'
							,variableRowHeight: true
							,flex: 1
							,editor: {
								 xtype: 'textfield'
								,allowBlank: true
							}
						}
						,{
							 xtype: 'actioncolumn'
							,width: 60
							,align: 'right'
							,items: [
								{
									 glyph: 0xf1f7
									,tooltip: 'Prevent notifications'
									,getClass: function( value, metaData, record, rowIndex, colIndex, store, view ){
										if ( record.get('notifications') ) return 'x-hidden';
									}
								}
								,{
									 glyph: 0xf026
									,tooltip: 'Muted'
									,getClass: function( value, metaData, record, rowIndex, colIndex, store, view ){
										if ( !record.get('muted') ) return 'x-hidden';
									}
								}
							]
						}
						,{
							 xtype: 'actioncolumn'
							,width: 60
							,align: 'center'
							,items: [
								{
									 glyph: 0xf013
									,tooltip: 'Configure'
									,handler: 'configureService'
									,getClass: function(){ return 'x-hidden-display'; }
								}
								,{
									 glyph: 0xf1f8
									,tooltip: 'Remove'
									,handler: 'removeService'
									,getClass: function(){ return 'x-hidden-display'; }
								}
							]
						}
						,{
							 xtype: 'checkcolumn'
							,width: 40
							,dataIndex: 'enabled'
							,renderer: function(value, metaData) {
								metaData.tdAttr = 'data-qtip="Service '+(value ? 'Enabled' : 'Disabled')+'"';
								return this.defaultRenderer(value, metaData);
							}
							,listeners: {
								checkchange: 'onEnableDisableService'
							}
						}
					]
					,viewConfig: {
						 emptyText: 'No services added...'
						,forceFit: true
						,stripeRows: true
					}
					,listeners: {
						 edit: 'onRenameService'
						,rowdblclick: 'showServiceTab'
					}
				}
			]
			,tbar: {
				 xtype: 'toolbar'
				,height: 42
				,ui: 'main'
				,enableOverflow: true
				,overflowHandler: 'menu'
				,items: [
					{
						 glyph: 'xf1f7@FontAwesome'
						,text: 'Don\'t Disturb: '+(JSON.parse(localStorage.getItem('dontDisturb')) ? 'ON' : 'OFF')
						,tooltip: 'Disable notifications and sounds in all services. Perfect to be concentrated and focused.<br/><b>Shortcut key: F1</b>'
						,enableToggle: true
						,handler: 'dontDisturb'
						,reference: 'disturbBtn'
						,id: 'disturbBtn'
						,pressed: JSON.parse(localStorage.getItem('dontDisturb'))
					}
					,{
						 glyph: 'xf023@FontAwesome'
						,text: 'Lock Rambox'
						,tooltip: 'Lock this app if you will be away for a period of time.<br/><b>Shortcut key: F2</b>'
						,handler: 'lockRambox'
						,id: 'lockRamboxBtn'
					}
					,'->'
					,{
						 xtype: 'image'
						,id: 'avatar'
						,bind: {
							 src: '{avatar}'
							,hidden: '{!avatar}'
						}
						,width: 30
						,height: 30
						,style: 'border-radius: 50%;border:2px solid #d8d8d8;'
					}
					,{
						 id: 'usernameBtn'
						,bind: {
							 text: '{username}'
							,hidden: '{!username}'
						}
						,menu: [
							{
								 text: 'Synchronize Configuration'
								,glyph: 'xf0c2@FontAwesome'
								,menu: [
									{
										 xtype: 'label'
										,bind: {
											html: '<b class="menu-title">Last Sync: {last_sync}</b>'
										}
									}
									,{
										 text: 'Backup'
										,glyph: 'xf0ee@FontAwesome'
										,scope: Rambox.ux.Auth0
										,handler: Rambox.ux.Auth0.backupConfiguration
									}
									,{
										 text: 'Restore'
										,glyph: 'xf0ed@FontAwesome'
										,scope: Rambox.ux.Auth0
										,handler: Rambox.ux.Auth0.restoreConfiguration
									}
									,{
										 text: 'Check for updated backup'
										,glyph: 'xf021@FontAwesome'
										,scope: Rambox.ux.Auth0
										,handler: Rambox.ux.Auth0.checkConfiguration
									}
								]
							}
							,'-'
							,{
								 text: 'Logout'
								,glyph: 'xf08b@FontAwesome'
								,handler: 'logout'
							}
						]
					}
					,{
						 text: 'Login'
						,icon: 'resources/auth0.png'
						,id: 'loginBtn'
						,tooltip: 'Login to save your configuration (no credentials stored) to sync with all your computers.<br /><br /><i>Powered by Auth0 (http://auth0.com)</i>'
						,bind: {
							hidden: '{username}'
						}
						,handler: 'login'
					}
					,{
						 tooltip: 'Preferences'
						,glyph: 'xf013@FontAwesome'
						,handler: 'openPreferences'
					}
				]
			}
			,bbar: [
				{
					 xtype: 'segmentedbutton'
					,allowToggle: false
					,items: [
						{
							 text: '<b>Help us</b> with'
							,pressed: true
						}
						,{
							 text: 'Donation'
							,glyph: 'xf21e@FontAwesome'
							,handler: 'showDonate'
						}
						,{
							 text: 'Translation'
							,glyph: 'xf0ac@FontAwesome'
							,href: 'https://crowdin.com/project/rambox/invite'
						}
					]
				}
				,'->'
				,{
					 xtype: 'label'
					,html: '<span class="fa fa-code" style="color:black;"></span> with <span class="fa fa-heart" style="color:red;"></span> from <img src="resources/flag.png" alt="Argentina" data-qtip="Argentina" /> as an Open Source project.'
				}
				,'->'
				,{
					xtype: 'segmentedbutton'
					,allowToggle: false
					,items: [
						{
							 text: '<b>Follow us</b>'
							,pressed: true
						}
						,{
							 glyph: 'xf082@FontAwesome'
							,href: 'https://www.facebook.com/ramboxapp'
						}
						,{
							 glyph: 'xf099@FontAwesome'
							,href: 'https://www.twitter.com/ramboxapp'
						}
						,{
							 glyph: 'xf09b@FontAwesome'
							,href: 'https://www.github.com/saenzramiro/rambox'
						}
					]
				}
			]
		}
		,{ id: 'tbfill', tabConfig : { xtype : 'tbfill' } }
	]

	,listeners: {
		 tabchange: 'onTabChange'
		,add: 'updatePositions'
		,remove: 'updatePositions'
		,childmove: 'updatePositions'
	}
});
