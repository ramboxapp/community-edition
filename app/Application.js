Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'
	 ,requires: [
 		'Rambox.util.Format'
 	]

	,name: 'Rambox'

	,stores: [
		 'ServicesList'
		,'Services'
	]

	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}

	,launch: function () {
		lock = new Auth0Lock('y9am0DVawe2tvlA3ucD7OufpJHZZMjsO', 'rambox.auth0.com');
		auth0 = new Auth0({ domain : 'rambox.auth0.com', clientID: 'y9am0DVawe2tvlA3ucD7OufpJHZZMjsO'})

		// Add shortcuts to switch services using CTRL + Number
		var map = new Ext.util.KeyMap({
			 target: document
			,binding: [
				{
					 key: "\t"
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						if ( !tabPanel.items.items[activeIndex + 1] ) {
							activeIndex = -1;
						} else if ( tabPanel.items.items[activeIndex + 1].tabConfig.xtype === 'tbfill' ) {
							activeIndex++;
						}
						tabPanel.setActiveTab( activeIndex + 1 );
					}
				}
				,{
					 key: "\t"
					,ctrl: true
 					,alt: false
 					,shift: true
 					,handler: function(key) {
 						var tabPanel = Ext.cq1('app-main');
 						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
 						if ( !tabPanel.items.items[activeIndex - 1] ) {
 							activeIndex = tabPanel.items.length;
 						} else if ( tabPanel.items.items[activeIndex - 1].tabConfig.xtype === 'tbfill' ) {
 							activeIndex--;
 						}
 						tabPanel.setActiveTab( activeIndex - 1 );
 					}
				}
				,{
					 key: [Ext.event.Event.NUM_PLUS, Ext.event.Event.NUM_MINUS]
					,ctrl: true
 					,alt: false
 					,shift: false
 					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;
						var currentLevel = tabPanel.getActiveTab().zoomLevel;
						if ( key === Ext.event.Event.NUM_PLUS ) { // Plus key
							currentLevel = currentLevel + 0.25;
						} else { // Minus Key
							currentLevel = currentLevel - 0.25;
						}
 						tabPanel.getActiveTab().down('component').el.dom.getWebContents().setZoomLevel(currentLevel);
						tabPanel.getActiveTab().zoomLevel = currentLevel;
 					}
				}
				,{
					 key: Ext.event.Event.NUM_ZERO
					,ctrl: true
 					,alt: false
 					,shift: false
 					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;
 						tabPanel.getActiveTab().down('component').el.dom.getWebContents().setZoomLevel(0);
						tabPanel.getActiveTab().zoomLevel = 0;
 					}
				}
				,{
					 key: "0123456789"
					,ctrl: true
					,alt: false
					,handler: function(key) {
						Ext.cq1('app-main').setActiveTab(key - 48);
					}
				}
			]
		});

		// Remove spinner after 3 secs
		Ext.defer(function() { Ext.get('spinner').destroy(); }, 3000);
	}

	,updateTotalNotifications: function( newValue, oldValue ) {
		newValue = parseInt(newValue);
		if ( newValue > 0 )	{
			document.title = 'Rambox (' + Rambox.util.Format.formatNumber(newValue) + ')';
		} else {
			document.title = 'Rambox';
		}
	}
});
