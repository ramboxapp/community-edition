Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Rambox'

	,requires: [
		'Rambox.ux.Firebase'
	]

	,stores: [
		 'ServicesList'
		,'Services'
	]

	,profiles: [
		 'Offline'
		,'Online'
	]

	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}

	,launch: function () {
		// Set Google Analytics events
		ga_storage._setAccount('UA-80680424-1');
		ga_storage._trackPageview('/index.html', 'main');

		// Auth0 Config
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
						if ( tabPanel.items.items[activeIndex + 1] && tabPanel.items.items[activeIndex + 1].id === 'tbfill' ) activeIndex++;
						if ( !tabPanel.items.items[activeIndex + 1] ) activeIndex = -1;
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
						if ( tabPanel.items.items[activeIndex - 1] && tabPanel.items.items[activeIndex - 1].id === 'tbfill' ) activeIndex--;
						if ( !tabPanel.items.items[activeIndex - 1] && tabPanel.items.items.length !== 2 ) activeIndex = tabPanel.items.items.length;
						if ( tabPanel.items.items.length === 2 ) activeIndex = 1;
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

		fireRef.database().ref('config').on('value', function(snapshot) {
			var appVersion = new Ext.Version(require('electron').remote.app.getVersion());
			if ( appVersion.isLessThan(snapshot.val().latestVersion) ) {
				console.info('New version is available', snapshot.val().latestVersion);
				var newVersionTB = Ext.cq1('app-main').addDocked({
					 xtype: 'toolbar'
					,dock: 'top'
					,ui: 'newversion'
					,items: [
						'->'
						,{
							 xtype: 'label'
							,html: '<b>New version is available!</b> ('+snapshot.val().latestVersion+')'
						}
						,{
							 xtype: 'button'
							,text: 'Download'
							,href: 'https://getrambox.herokuapp.com/download'
						}
						,{
							 xtype: 'button'
							,text: 'Changelog'
							,href: 'https://github.com/saenzramiro/rambox/releases/tag/'+snapshot.val().latestVersion
						}
						,'->'
						,{
							 glyph: 'xf00d@FontAwesome'
							,baseCls: ''
							,style: 'cursor:pointer;'
							,handler: function(btn) { Ext.cq1('app-main').removeDocked(btn.up('toolbar'), true); }
						}
					]
				});
				return;
			}

			console.info('Your version is the latest. No need to update.')
		});

		// Remove spinner
		Ext.get('spinner').destroy();
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
