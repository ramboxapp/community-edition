Ext.define('Rambox.view.main.Main', {
	 extend: 'Ext.tab.Panel'
	,requires: [
		 'Rambox.view.main.MainController'
		,'Rambox.view.main.MainModel'
		,'Rambox.ux.WebView'
		,'Rambox.ux.mixin.Badge'
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
			,listeners: {
				// I put the code here because it cannot be listened into the Controller
				Drop: function( box, tabBar, tab, startIdx, index ) {
					var idx = 0;
					Ext.each(tabBar.items.items, function(t) {
						if ( idx > 0 && t.xtype !== 'tbfill' ) { // Skip first tab because is the configuration tab
							t.card.record.set('position', idx);
						} else if ( t.xtype === 'tbfill' ) {
							idx--;
						}
						idx++;
					});
				}
			}
		}
	]

	,autoRender: true
	,autoShow: true
	,deferredRender: false
	,items: [
		{
			 icon: 'resources/IconTray@2x.png'
			,closable: false
			,reorderable: false
			,autoScroll: true
			,layout: 'hbox'
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
									,'<div class="service">'
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
					,tools: [
						{
							 xtype: 'button'
							,glyph: 'xf1f8@FontAwesome'
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
						,{ text: 'Name', dataIndex: 'name', variableRowHeight: true, flex: 1 }
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
					]
					,viewConfig: {
						 emptyText: 'No services added...'
						,forceFit: true
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
						,text: 'Don\'t Disturb: OFF'
						,tooltip: 'Lock this app if you will be away for a period of time.'
						,enableToggle: true
						,handler: 'dontDisturb'
						,reference: 'disturbBtn'
					}
					,{
						 glyph: 'xf023@FontAwesome'
						,text: 'Lock Rambox'
						,tooltip: 'Lock this app if you will be away for a period of time.'
						,handler: 'lockRambox'
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
								 text: 'Logout'
								,glyph: 'xf08b@FontAwesome'
								,handler: 'logout'
							}
						]
					}
					,{
						 xtype: 'label'
						,id: 'explanationLabel'
						,html: 'Login to save your configuration (no credentials stored) to sync with all your computers. <b>All current services will be removed.</b>'
						,bind: {
							hidden: '{username}'
						}
					}
					,{
						 text: 'Login'
						,icon: 'resources/auth0.png'
						,id: 'loginBtn'
						,tooltip: 'Powered by Auth0 (http://auth0.com)'
						,bind: {
							hidden: '{username}'
						}
						,handler: 'login'
					}
				]
			}
			,bbar: [
				'->'
				,{
					 xtype: 'label'
					,html: '<span class="fa fa-code" style="color:black;"></span> with <span class="fa fa-heart" style="color:red;"></span> from Argentina as an Open Source project.'
				}
				,'->'
			]
		}
	]

	,listeners: {
		tabchange: 'onTabChange'
	}
});
