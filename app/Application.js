Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Rambox'

	,requires: [
		 'Rambox.ux.Firebase'
		,'Rambox.util.MD5'
		,'Ext.window.Toast'
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
		lock = new Auth0Lock(auth0Cfg.clientID, auth0Cfg.domain);
		auth0 = new Auth0({ clientID: auth0Cfg.clientID, domain : auth0Cfg.domain });

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
					 key: [Ext.event.Event.NUM_PLUS, Ext.event.Event.NUM_MINUS, 187, 189]
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

						key === Ext.event.Event.NUM_PLUS || key === 187 ? tabPanel.getActiveTab().zoomIn() : tabPanel.getActiveTab().zoomOut();
					}
				}
				,{
					 key: [Ext.event.Event.NUM_ZERO, '0']
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

						tabPanel.getActiveTab().resetZoom();
					}
				}
				,{
					 key: "123456789"
					,ctrl: true
					,alt: false
					,handler: function(key) {
						Ext.cq1('app-main').setActiveTab(key - 48);
					}
				}
				,{
					 key: 188 // comma
					,ctrl: true
					,alt: false
					,handler: function(key) {
						Ext.cq1('app-main').setActiveTab(0);
					}
				}
				,{
					 key: Ext.event.Event.F1
					,ctrl: false
					,alt: false
					,shift: false
					,handler: function(key) {
						var btn = Ext.getCmp('disturbBtn');
						btn.toggle();
						Ext.cq1('app-main').getController().dontDisturb(btn, true);
					}
				}
				,{
					 key: Ext.event.Event.F2
					,ctrl: false
					,alt: false
					,shift: false
					,handler: function(key) {
						var btn = Ext.getCmp('lockRamboxBtn');
						Ext.cq1('app-main').getController().lockRambox(btn);
					}
				}
			]
		});

		if ( process.platform !== 'win32' ) {
			this.checkUpdate(true);
		}

		if ( localStorage.getItem('locked') ) {
			console.info('Lock Rambox:', 'Enabled');
			Ext.cq1('app-main').getController().showLockWindow();
		}

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

	,checkUpdate: function(silence) {
		fireRef.database().ref('config').once('value', function(snapshot) {
			var appVersion = new Ext.Version(require('electron').remote.app.getVersion());
			if ( appVersion.isLessThan(snapshot.val().latestVersion) ) {
				console.info('New version is available', snapshot.val().latestVersion);
				Ext.cq1('app-main').addDocked({
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
							,href: 'https://getrambox.herokuapp.com/download/'+process.platform+'_'+process.arch
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
			} else if ( !silence ) {
				Ext.Msg.show({
					 title: 'You are up to date!'
					,message: 'You have the latest version of Rambox.'
					,icon: Ext.Msg.INFO
					,buttons: Ext.Msg.OK
				});
			}

			console.info('Your version is the latest. No need to update.');
		});
	}
});
