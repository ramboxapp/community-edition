Ext.define('Hamsket.view.main.Main', {
	 extend: 'Ext.tab.Panel'
	,requires: [
		 'Hamsket.view.main.MainController'
		,'Hamsket.view.main.MainModel'
		,'Hamsket.ux.WebView'
		,'Hamsket.ux.mixin.Badge'
		,'Hamsket.view.add.Add'
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
	,tabBar: {
		items: [
			{
				 xtype: 'button'
				,html: '<span class="fa fa-heart" style="color:red;font-size:16px;cursor:pointer;padding:0 5px;"></span>'
				,baseCls: ''
				,tooltip: locale['app.main[25]']
				,href: 'https://www.gofundme.com/Hamsket'
			},
			{
				 xtype: 'button'
				,html: '<span class="fa fa-user-plus" style="color:red;font-size:16px;cursor:pointer;padding:0 5px;"></span>'
				,baseCls: ''
				,tooltip: 'Sponsor'
				,href: 'https://github.com/sponsors/TheGoddessInari/'
			}
		]
	}
	,items: [
		{
			 icon: 'resources/IconTray@2x.png'
			,id: 'hamsketTab'
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
							,glyph: 'XF1F8@FontAwesome'
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
							,tpl: `<img src='{[ values.type !== "custom" ? "resources/icons/"+values.logo : (values.logo == "" ? "resources/icons/custom.png" : values.logo) ]}' data-qtip='{type:capitalize}' width='32' style='{[ values.enabled ? "-webkit-filter: grayscale(0)" : "-webkit-filter: grayscale(1)" ]}' />`
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
									 glyph: 0xF1F7
									,tooltip: locale['app.main[11]']
									,getClass( value, metaData, record, rowIndex, colIndex, store, view ){
										if ( record.get('notifications') ) return 'x-hidden';
									}
								}
								,{
									 glyph: 0xF026
									,tooltip: locale['app.main[12]']
									,getClass( value, metaData, record, rowIndex, colIndex, store, view ){
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
									 glyph: 0xF013
									,tooltip: locale['app.main[13]']
									,handler: 'configureService'
									,getClass(){ return 'x-hidden-display'; }
								}
								,{
									 glyph: 0xF1F8
									,tooltip: locale['app.main[14]']
									,handler: 'removeService'
									,getClass(){ return 'x-hidden-display'; }
								}
							]
						}
						,{
							 xtype: 'checkcolumn'
							,width: 40
							,dataIndex: 'enabled'
							,renderer(value, metaData) {
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
						 glyph: 'XF1F7@FontAwesome'
						,text: locale['app.main[16]']+': '+(JSON.parse(localStorage.getItem('dontDisturb')) ? locale['app.window[20]'] : locale['app.window[21]'])
						,tooltip: locale['app.main[17]']+'<br/><b>'+locale['app.main[18]']+': Alt+F1</b>'
						,enableToggle: true
						,handler: 'dontDisturb'
						,reference: 'disturbBtn'
						,id: 'disturbBtn'
						,pressed: JSON.parse(localStorage.getItem('dontDisturb'))
					}
					,{
						 glyph: 'XF023@FontAwesome'
						,text: locale['app.main[19]']
						,tooltip: locale['app.main[20]']+'<br/><b>'+locale['app.main[18]']+': Alt+F2</b>'
						,handler: 'lockHamsket'
						,id: 'lockHamsketBtn'
					}
					,'->'
					,{
						 text: 'Backup'
						,glyph: 'XF0C7@FontAwesome'
						,id: 'backupBtn'
						,tooltip: 'Backup services to disk'
						,scope: Hamsket.ux.FileBackup
						,handler: Hamsket.ux.FileBackup.backupConfiguration
					}
					,{
						text: 'Restore'
					   ,glyph: 'XF115@FontAwesome'
					   ,id: 'restoreBtn'
					   ,tooltip: 'Restore services from disk'
					   ,scope: Hamsket.ux.FileBackup
					   ,handler: Hamsket.ux.FileBackup.restoreConfiguration
				   }
				   ,{
						 tooltip: locale['preferences[0]']
						,glyph: 'XF013@FontAwesome'
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
							 text: '<b>Help out</b> with'
							,pressed: true
						}
						,{
							 text: locale['app.main[25]']
							,glyph: 'XF21E@FontAwesome'
							,href: 'https://www.gofundme.com/Hamsket'
						}
						,{
							 text: 'Sponsor'
							,glyph: 'XF234@FontAwesome'
							,href: 'https://github.com/sponsors/TheGoddessInari'
						}
					]
					 /* TODO: Translation
						,{
							 text: 'Translation'
							,glyph: 'XF0AC@FontAwesome'
							,href: 'https://crowdin.com/project/hamsket/invite'
						}
					]*/
				}
				,'->'
				,{
					 xtype: 'label'
					,html: '<span class="fa fa-code-fork" style="color:black;"></span> '+locale['app.main[26]']+' <span class="fa fa-meh-o" style="color:red;"></span> '+locale['app.main[27]'].replace('USA', '<img src="resources/flag.png" alt="United States" data-qtip="United States" />')
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
							 glyph: 'XF082@FontAwesome'
							,href: 'https://www.facebook.com/TheGoddessInari'
						}
						,{
							 glyph: 'XF099@FontAwesome'
							,href: 'https://www.twitter.com/TheGoddessInari'
						}
						,{
							 glyph: 'XF09B@FontAwesome'
							,href: 'https://www.github.com/TheGoddessInari/hamsket'
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
		,boxready: 'initialize'
	}
});
