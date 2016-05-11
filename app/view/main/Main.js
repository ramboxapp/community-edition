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
							console.log(t, idx);
							t.service.set('position', idx);
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
			 icon: 'resources/IconTray.png'
			,closable: false
			,reorderable: false
			,autoScroll: true
			,layout: 'center'
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
									,tpl: '<img src="{[ values.type !== \"custom\" ? \"resources/icons/\" : \"\" ]}{logo}" data-qtip="{type:capitalize}" width="32" />'
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
									,tooltip: 'Add a custom service'
									,handler: 'addCustomService'
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
