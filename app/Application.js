Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Rambox'

	,requires: [
		 'Rambox.ux.Auth0'
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
	,getStoredServices: function () {
		var stored = Ext.getStore('Services').load();
		stored = stored.data.items;
		stored = stored.map(g => g.data);
		return stored;
	}
	,defaultServices: function () {
		const stored = this.getStoredServices();
		console.log("STORED SERVICES", stored);
		if (stored.length === 0) {
			console.log('KEINE SERVICES');
			const defaults =[
					{
						"position": 1,
						"type": "custom",
						"logo": "",
						"name": "Info",
						"url": "https://tools.diehumanisten.de",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": false,
						"includeInGlobalUnreadCounter": false,
						"trust": false,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 11
					},
					{
						"position": 2,
						"type": "slack",
						"logo": "slack.png",
						"name": "Chat (Slack)",
						"url": "https://pgs-diehumanisten.slack.com/",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 1
					},
					{
						"position": 3,
						"type": "trello",
						"logo": "trello.png",
						"name": "Trello",
						"url": "https://trello.com/login",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 10
					},
					{
						"position": 4,
						"type": "custom",
						"logo": "",
						"name": "Disk",
						"url": "https://disk.diehumanisten.de",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 2
					},
					{
						"position": 5,
						"type": "custom",
						"logo": "",
						"name": "Wiki",
						"url": "https://wiki.diehumanisten.de",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 7
					},
					{
						"position": 6,
						"type": "custom",
						"logo": "",
						"name": "Facebook",
						"url": "https://facebook.com",
						"align": "left",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": true,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 8
					},
					{
						"position": 7,
						"type": "roundcube",
						"logo": "roundcube.png",
						"name": "Mail",
						"url": "https://webmail.diehumanisten.de",
						"align": "right",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": false,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 3
					},
					{
						"position": 8,
						"type": "hangouts",
						"logo": "hangouts.png",
						"name": "Hangouts",
						"url": "https://hangouts.google.com/",
						"align": "right",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": false,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 4
					},
					{
						"position": 9,
						"type": "tweetdeck",
						"logo": "tweetdeck.png",
						"name": "Twitter",
						"url": "https://tweetdeck.twitter.com/",
						"align": "right",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": false,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 5
					},
					{
						"position": 10,
						"type": "custom",
						"logo": "",
						"name": "Facebook Manager",
						"url": "https://facebook.com",
						"align": "right",
						"notifications": true,
						"muted": false,
						"displayTabUnreadCounter": true,
						"includeInGlobalUnreadCounter": true,
						"trust": true,
						"enabled": false,
						"js_unread": "",
						"zoomLevel": 0,
						"id": 9
					}
				];

			defaults.forEach( function(s) {
				var service = Ext.create('Rambox.model.Service', s);
				service.save();
				Ext.getStore('Services').add(service);

				var tabData = {
					xtype: 'webview'
					,id: 'tab_'+service.get('id')
					,record: service
					,tabConfig: {
						service: service
					}
				};

				if ( s['align'] === 'left' ) {
					var tbfill = Ext.cq1('app-main').getTabBar().down('tbfill');
					Ext.cq1('app-main').insert(Ext.cq1('app-main').getTabBar().items.indexOf(tbfill), tabData).show();
				} else {
					Ext.cq1('app-main').add(tabData).show();
				}
			});
		}
	}
	,exportDefaultServices: function () {
		const stored = this.getStoredServices();
		const json = Ext.encode(stored);
		console.log("SERVICES:", json);
	}

	,launch: function () {
		// Set Google Analytics events
		// ga_storage._setAccount('UA-80680424-1');
		// ga_storage._trackPageview('/index.html', 'main');
		// ga_storage._trackEvent('Versions', require('electron').remote.app.getVersion());

		// Initialize Auth0
		// PHISCH: Deactivated
		//Rambox.ux.Auth0.init();

		// EXPORT DEFUALT SERVICES

		this.defaultServices();

		//TestForEmptyServices();



		// Check for updates
		Rambox.app.checkUpdate(true);

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
						var i = activeIndex + 1;

						// "cycle" (go to the start) when the end is reached or the end is the spacer "tbfill"
						if (i === tabPanel.items.items.length || i === tabPanel.items.items.length - 1 && tabPanel.items.items[i].id === 'tbfill') i = 0;

						// skip spacer
						while (tabPanel.items.items[i].id === 'tbfill') i++;

						tabPanel.setActiveTab(i);
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
						var i = activeIndex - 1;
						if ( i < 0 ) i = tabPanel.items.items.length - 1;
						while ( tabPanel.items.items[i].id === 'tbfill' || i < 0 ) i--;
						tabPanel.setActiveTab( i );
					}
				}
				,{
					 key: Ext.event.Event.PAGE_DOWN
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex + 1;
						if ( i >= tabPanel.items.items.length - 1 ) i = 0;
						while ( tabPanel.items.items[i].id === 'tbfill' ) i++;
						tabPanel.setActiveTab( i );
					}
				}
				,{
					 key: Ext.event.Event.PAGE_UP
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex - 1;
						if ( i < 0 ) i = tabPanel.items.items.length - 1;
						while ( tabPanel.items.items[i].id === 'tbfill' ) i--;
						tabPanel.setActiveTab( i );
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
						key = key - 48;
						if ( key >= Ext.cq1('app-main').items.indexOf(Ext.getCmp('tbfill')) ) key++;
						Ext.cq1('app-main').setActiveTab(key);
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

		// Mouse Wheel zooming
		document.addEventListener('mousewheel', function(e) {
			if( e.ctrlKey ) {
				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

				var tabPanel = Ext.cq1('app-main');
				if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

				if ( delta === 1 ) { // Zoom In
					tabPanel.getActiveTab().zoomIn();
				} else { // Zoom Out
					tabPanel.getActiveTab().zoomOut();
				}
			}
		});

		if ( process.platform !== 'win32' ) {
			this.checkUpdate(true);
		}

		// Define default value
		if ( localStorage.getItem('dontDisturb') === null ) localStorage.setItem('dontDisturb', false);

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
		console.info('Checking for updates...');
		Ext.Ajax.request({
			 url: 'http://rambox.pro/api/latestversion.json'
			,method: 'GET'
			,success: function(response) {
				var json = Ext.decode(response.responseText);
				var appVersion = new Ext.Version(require('electron').remote.app.getVersion());
				if ( appVersion.isLessThan(json.version) ) {
					console.info('New version is available', json.version);
					Ext.cq1('app-main').addDocked({
						 xtype: 'toolbar'
						,dock: 'top'
						,ui: 'newversion'
						,items: [
							'->'
							,{
								 xtype: 'label'
								,html: '<b>New version is available!</b> ('+json.version+')' + ( process.platform === 'win32' ? ' Is downloading in the background and you will notify when is ready to install it.' : '' )
							}
							,{
								 xtype: 'button'
								,text: 'Download'
								,href: 'https://getrambox.herokuapp.com/download/'+process.platform+'_'+process.arch
								,hidden: process.platform === 'win32'
							}
							,{
								 xtype: 'button'
								,text: 'Changelog'
								,ui: 'decline'
								,tooltip: 'Click here to see more information about the new version.'
								,href: 'https://github.com/saenzramiro/rambox/releases/tag/'+json.version
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
					if ( process.platform === 'win32' ) ipc.send('autoUpdater:check-for-updates');
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
			}
		});
	}
});
