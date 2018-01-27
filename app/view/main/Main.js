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
					,title: locale['app.main[0]']
					,margin: '0 5 0 0'
					,flex: 2
					,header: { height: 50 }
					,tools: [
						{
							 xtype: 'checkboxgroup'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: locale['app.main[1]']
									,name: 'messaging'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: locale['app.main[2]']
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
							,emptyText: '<div style="padding: 20px;">'+locale['app.main[3]']+'</div>'
							,listeners: {
								itemclick: 'onNewServiceSelect'
							}
						}
					]
				}
				,{
					 xtype: 'grid'
					,title: locale['app.main[4]']
					,store: 'Services'
					,hideHeaders: true
					,margin: '0 0 0 5'
					,flex: 1
					,header: { height: 50 }
					,features: [
						{
							 ftype:'grouping'
							,collapsible: false
							,groupHeaderTpl: '{columnName:uppercase}: {name:capitalize} ({rows.length} {[values.rows.length > 1 ? "'+locale['app.main[9]']+'" : "'+locale['app.main[8]']+'"]})'
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
							,tooltip: locale['app.main[10]']
							,handler: 'removeAllServices'
						}
					]
					,columns: [
						{
							 xtype: 'templatecolumn'
							,width: 50
							,variableRowHeight: true
							,tpl: '<img src="{[ values.type !== \"custom\" ? \"resources/icons/\"+values.logo : (values.logo == \"\" ? \"resources/icons/custom.png\" : values.logo) ]}" data-qtip="{type:capitalize}" width="32" style="{[ values.enabled ? \"-webkit-filter: grayscale(0)\" : \"-webkit-filter: grayscale(1)\" ]}" />'
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
									,tooltip: locale['app.main[11]']
									,getClass: function( value, metaData, record, rowIndex, colIndex, store, view ){
										if ( record.get('notifications') ) return 'x-hidden';
									}
								}
								,{
									 glyph: 0xf026
									,tooltip: locale['app.main[12]']
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
									,tooltip: locale['app.main[13]']
									,handler: 'configureService'
									,getClass: function(){ return 'x-hidden-display'; }
								}
								,{
									 glyph: 0xf1f8
									,tooltip: locale['app.main[14]']
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
						 emptyText: locale['app.main[15]']
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
						,text: locale['app.main[16]']+': '+(JSON.parse(localStorage.getItem('dontDisturb')) ? locale['app.window[20]'] : locale['app.window[21]'])
						,tooltip: locale['app.main[17]']+'<br/><b>'+locale['app.main[18]']+': F1</b>'
						,enableToggle: true
						,handler: 'dontDisturb'
						,reference: 'disturbBtn'
						,id: 'disturbBtn'
						,pressed: JSON.parse(localStorage.getItem('dontDisturb'))
					}
					,{
						 glyph: 'xf023@FontAwesome'
						,text: locale['app.main[19]']
						,tooltip: locale['app.main[20]']+'<br/><b>'+locale['app.main[18]']+': F2</b>'
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
								 text: locale['app.main[21]']
								,glyph: 'xf08b@FontAwesome'
								,handler: 'logout'
							}
						]
					}
					,{
						 text: locale['app.main[22]']
						,icon: 'resources/auth0.png'
						,id: 'loginBtn'
						,tooltip: locale['app.main[23]']+'<br /><br /><i>'+locale['app.main[24]']+' Auth0 (http://auth0.com)</i>'
						,bind: {
							hidden: '{username}'
						}
						,handler: 'login'
					}
					,{
						 tooltip: locale['preferences[0]']
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
							 text: locale['app.main[25]']
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
					,html: '<span class="fa fa-code" style="color:black;"></span> '+locale['app.main[26]']+' <span class="fa fa-heart" style="color:red;"></span> '+locale['app.main[27]'].replace('Argentina', '<img src="resources/flag.png" alt="Argentina" data-qtip="Argentina" />')
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
