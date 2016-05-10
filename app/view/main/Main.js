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
		}
	]
	,tabBar: {
		cls: 'allow-overflow'
	}
	
	,hideMode: 'visibility'
	,autoRender: true
	,autoShow: true
	,deferredRender: false
	,items: [
		{
			 icon: 'resources/logo_32.png'
			,closable: false
			,layout: 'center'
			,autoScroll: true
			,items: [
				{
					 xtype: 'container'
					,items: [
						{
							 xtype: 'grid'
							,title: 'Enabled Services'
							,store: 'Services'
							,margin: '50 0 0 0'
							,hideHeaders: true
							,width: 500
							,columns: [
								{
									 xtype: 'templatecolumn'
									,width: 50
									,variableRowHeight: true
									,tpl: '<img src="resources/icons/{type}.png" width="32" />'
								}
								,{ text: 'Name', dataIndex: 'name', variableRowHeight: true, flex: 1 }
								,{
									 xtype: 'actioncolumn'
									,width: 60
									,align: 'center'
									,items: [
										{
											 glyph: 0xf1f8
											,tooltip: 'Remove'
											,handler: 'removeService'
											,getClass: function(){ return 'x-hidden-display'; }
										}
										,{
											 glyph: 0xf013
											,tooltip: 'Configure'
											,handler: 'configureService'
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
						,{
							 xtype: 'panel'
							,title: 'Add a new Service'
							,width: 500
							,margin: '50 0 0 0'
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
										change: 'doFilter'
									}
								}
								,{
									 type: 'plus'
									,tooltip: 'Add a custom service (soon...)'
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
									,listeners: {
										itemclick: 'onNewServiceSelect'
									}
								}
							]
						}
						,{
							 xtype: 'toolbar'
							,margin: '50 0 0 0'
							,items: [
								{
									 xtype: 'label'
									,html: '<span class="fa fa-code" style="color:black;"></span> with <span class="fa fa-heart" style="color:red;"></span> from Argentina as an Open Source project.'
								}
								,{
									 text: 'www.rambox.io'
									,href: 'http://www.rambox.io'
								}
							]
						}
					]
				}
			]
		}
	]
});
