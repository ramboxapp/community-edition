/**
 * Default config for all webviews created
 */
Ext.define('Rambox.ux.WebView',{
	 extend: 'Ext.panel.Panel'
	,xtype: 'webview'

	,requires: [
		 'Rambox.util.Format'
		,'Rambox.util.Notifier'
		,'Rambox.util.UnreadCounter'
	]

	// private
	,zoomLevel: 0
	,currentUnreadCount: 0

	// CONFIG
	,hideMode: 'offsets'
	,initComponent: function(config) {
		var me = this;

		function getLocation(href) {
			var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
			return match && {
				protocol: match[1],
				host: match[2],
				hostname: match[3],
				port: match[4],
				pathname: match[5],
				search: match[6],
				hash: match[7]
			}
		}

		// Allow Custom sites with self certificates
		//if ( me.record.get('trust') ) ipc.send('allowCertificate', me.src);

		Ext.apply(me, {
			 items: me.webViewConstructor()
			,title: me.record.get('tabname') ? me.record.get('name') : ''
			,icon: me.record.get('type') === 'custom' ? (me.record.get('logo') === '' ? 'resources/icons/custom.png' : me.record.get('logo')) : 'resources/icons/'+me.record.get('logo')
			,src: me.record.get('url')
			,type: me.record.get('type')
			,align: me.record.get('align')
			,notifications: me.record.get('notifications')
			,muted: me.record.get('muted')
			,tabConfig: {
				listeners: {
					afterrender : function( btn ) {
						btn.el.on('contextmenu', function(e) {
							btn.showMenu('contextmenu');
							e.stopEvent();
						});
					}
					,scope: me
				}
				,clickEvent: ''
				,style: !me.record.get('enabled') ? '-webkit-filter: grayscale(1)' : ''
				,menu:  {
					 plain: true
					,items: [
						{
							 xtype: 'toolbar'
							,items: [
								{
									 xtype: 'segmentedbutton'
									,allowToggle: false
									,flex: 1
									,items: [
										{
											 text: 'Back'
											,glyph: 'xf053@FontAwesome'
											,flex: 1
											,scope: me
											,handler: me.goBack
										}
										,{
											 text: 'Forward'
											,glyph: 'xf054@FontAwesome'
											,iconAlign: 'right'
											,flex: 1
											,scope: me
											,handler: me.goForward
										}
									]
								}
							]
						}
						,'-'
						,{
							 text: 'Zoom In'
							,glyph: 'xf00e@FontAwesome'
							,scope: me
							,handler: me.zoomIn
						}
						,{
							 text: 'Zoom Out'
							,glyph: 'xf010@FontAwesome'
							,scope: me
							,handler: me.zoomOut
						}
						,{
							 text: 'Reset Zoom'
							,glyph: 'xf002@FontAwesome'
							,scope: me
							,handler: me.resetZoom
						}
						,'-'
						,{
							 text: locale['app.webview[0]']
							,glyph: 'xf021@FontAwesome'
							,scope: me
							,handler: me.reloadService
						}
						,'-'
						,{
							 text: locale['app.webview[3]']
							,glyph: 'xf121@FontAwesome'
							,scope: me
							,handler: me.toggleDevTools
						}
					]
				}
			}
			,listeners: {
				 afterrender: me.onAfterRender
				,beforedestroy: me.onBeforeDestroy
			}
		});

		if ( me.record.get('statusbar') ) {
			Ext.apply(me, {
				bbar: me.statusBarConstructor(false)
			});
		} else {
			me.items.push(me.statusBarConstructor(true));
		}

		me.callParent(config);
	}

	,onBeforeDestroy: function() {
		var me = this;

		me.setUnreadCount(0);
	}

	,webViewConstructor: function( enabled ) {
		var me = this;

		var cfg;
		enabled = enabled || me.record.get('enabled');

		if ( !enabled ) {
			cfg = {
				 xtype: 'container'
				,html: '<h3>Service Disabled</h3>'
				,style: 'text-align:center;'
				,padding: 100
			};
		} else {
			cfg = [{
				 xtype: 'component'
				,hideMode: 'offsets'
				,autoRender: true
				,autoShow: true
				,autoEl: {
					 tag: 'webview'
					,src: me.record.get('url')
					,style: 'width:100%;height:100%;visibility:visible;'
					,partition: 'persist:' + me.record.get('type') + '_' + me.id.replace('tab_', '') + (localStorage.getItem('id_token') ? '_' + Ext.decode(localStorage.getItem('profile')).user_id : '')
					,plugins: 'true'
					,allowtransparency: 'on'
					,autosize: 'on'
					//,webpreferences: 'nodeIntegration=no'
					//,disablewebsecurity: 'on' // Disabled because some services (Like Google Drive) dont work with this enabled
					,useragent: Ext.getStore('ServicesList').getById(me.record.get('type')).get('userAgent')
					,preload: './resources/js/rambox-service-api.js'
				}
			}];

			if ( Ext.getStore('ServicesList').getById(me.record.get('type')).get('allow_popups') ) cfg[0].autoEl.allowpopups = 'on';
		}

		return cfg;
	}

	,statusBarConstructor: function(floating) {
		var me = this;

		return {
			 xtype: 'statusbar'
			,hidden: !me.record.get('statusbar')
			,keep: me.record.get('statusbar')
			,y: floating ? '-18px' : 'auto'
			,height: 19
			,dock: 'bottom'
			,defaultText: '<i class="fa fa-check fa-fw" aria-hidden="true"></i> Ready'
			,busyIconCls : ''
			,busyText: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> '+locale['app.webview[4]']
			,items: [
				{
					 xtype: 'tbtext'
					,itemId: 'url'
				}
				,{
					 xtype: 'button'
					,glyph: 'xf00d@FontAwesome'
					,scale: 'small'
					,ui: 'decline'
					,padding: 0
					,scope: me
					,hidden: floating
					,handler: me.closeStatusBar
					,tooltip: {
						 text: 'Close statusbar until next time'
						,mouseOffset: [0,-60]
					}
				}
			]
		};
	}

	,onAfterRender: function() {
		var me = this;

		if ( !me.record.get('enabled') ) return;

		var webview = me.down('component').el.dom;

		require('electron-context-menu')({window: webview});

		// Google Analytics Event
		ga_storage._trackEvent('Services', 'load', me.type, 1, true);

		// Notifications in Webview
		me.setNotifications(localStorage.getItem('locked') || JSON.parse(localStorage.getItem('dontDisturb')) ? false : me.record.get('notifications'));

		// Show and hide spinner when is loading
		webview.addEventListener("did-start-loading", function() {
			console.info('Start loading...', me.src);
			if ( !me.down('statusbar').closed || !me.down('statusbar').keep ) me.down('statusbar').show();
			me.down('statusbar').showBusy();
		});
		webview.addEventListener("did-stop-loading", function() {
			me.down('statusbar').clearStatus({useDefaults: true});
			if ( !me.down('statusbar').keep ) me.down('statusbar').hide();
		});

		webview.addEventListener("did-finish-load", function(e) {
			Rambox.app.setTotalServicesLoaded( Rambox.app.getTotalServicesLoaded() + 1 );

			// Apply saved zoom level
			webview.setZoomLevel(me.record.get('zoomLevel'));
		});

		// Open links in default browser
		webview.addEventListener('new-window', function(e) {
			switch ( me.type ) {
				case 'skype':
					// hack to fix multiple browser tabs on Skype link click, re #11
					if ( e.url.match('https:\/\/web.skype.com\/..\/undefined') ) {
						e.preventDefault();
						return;
					} else if ( e.url.indexOf('imgpsh_fullsize') >= 0 ) {
						ipc.send('image:download', e.url, e.target.partition);
						e.preventDefault();
						return;
					}
					break;
				case 'hangouts':
					e.preventDefault();
					if ( e.url.indexOf('plus.google.com/u/0/photos/albums') >= 0 ) {
						ipc.send('image:popup', e.url, e.target.partition);
						return;
					} else if ( e.url.indexOf('https://hangouts.google.com/hangouts/_/CONVERSATION/') >= 0 ) {
						me.add({
							 xtype: 'window'
							,title: 'Video Call'
							,width: '80%'
							,height: '80%'
							,maximizable: true
							,resizable: true
							,draggable: true
							,collapsible: true
							,items: {
								 xtype: 'component'
								,hideMode: 'offsets'
								,autoRender: true
								,autoShow: true
								,autoEl: {
									 tag: 'webview'
									,src: e.url
									,style: 'width:100%;height:100%;'
									,partition: 'persist:' + me.record.get('type') + '_' + me.id.replace('tab_', '') + (localStorage.getItem('id_token') ? '_' + Ext.decode(localStorage.getItem('profile')).user_id : '')
									,useragent: Ext.getStore('ServicesList').getById(me.record.get('type')).get('userAgent')
								}
							}
						}).show();
						return;
					}
					break;
				case 'slack':
					if ( e.url.indexOf('slack.com/call/') >= 0 ) {
						me.add({
							 xtype: 'window'
							,title: e.options.title
							,width: e.options.width
							,height: e.options.height
							,maximizable: true
							,resizable: true
							,draggable: true
							,collapsible: true
							,items: {
								 xtype: 'component'
								,hideMode: 'offsets'
								,autoRender: true
								,autoShow: true
								,autoEl: {
									 tag: 'webview'
									,src: e.url
									,style: 'width:100%;height:100%;'
									,partition: e.options.webPreferences.partition
									,useragent: Ext.getStore('ServicesList').getById(me.record.get('type')).get('userAgent')
								}
							}
						}).show();
						e.preventDefault();
						return;
					}
					break;
				default:
					break;
			}

			const protocol = require('url').parse(e.url).protocol;
			if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
				e.preventDefault();
				require('electron').shell.openExternal(e.url);
			}
		});

		webview.addEventListener('will-navigate', function(e, url) {
			e.preventDefault();
		});

		webview.addEventListener("dom-ready", function(e) {
			// Mute Webview
			if ( me.record.get('muted') || localStorage.getItem('locked') || JSON.parse(localStorage.getItem('dontDisturb')) ) me.setAudioMuted(true, true);

			var js_inject = '';
			// Injected code to detect new messages
			if ( me.record ) {
				var js_unread = Ext.getStore('ServicesList').getById(me.record.get('type')).get('js_unread');
				js_unread = js_unread + me.record.get('js_unread');
				if ( js_unread !== '' ) {
					console.groupCollapsed(me.record.get('type').toUpperCase() + ' - JS Injected to Detect New Messages');
					console.info(me.type);
					console.log(js_unread);
					js_inject += js_unread;
				}
			}

			// Prevent Title blinking (some services have) and only allow when the title have an unread regex match: "(3) Title"
			if ( Ext.getStore('ServicesList').getById(me.record.get('type')).get('titleBlink') ) {
				var js_preventBlink = 'var originalTitle=document.title;Object.defineProperty(document,"title",{configurable:!0,set:function(a){null===a.match(new RegExp("[(]([0-9•]+)[)][ ](.*)","g"))&&a!==originalTitle||(document.getElementsByTagName("title")[0].innerHTML=a)},get:function(){return document.getElementsByTagName("title")[0].innerHTML}});';
				console.log(js_preventBlink);
				js_inject += js_preventBlink;
			}

			console.groupEnd();

			// Scroll always to top (bug)
			js_inject += 'document.body.scrollTop=0;';

			// Handles Certificate Errors
			webview.getWebContents().on('certificate-error', function(event, url, error, certificate, callback) {
				if ( me.record.get('trust') ) {
					event.preventDefault();
					callback(true);
				} else {
					callback(false);
				}

				me.down('statusbar').keep = true;
				me.down('statusbar').show();
				me.down('statusbar').setStatus({
					text: '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i> Certification Warning'
				});
				me.down('statusbar').down('button').show();
			});

			webview.executeJavaScript(js_inject);
		});

		webview.addEventListener('ipc-message', function(event) {
			var channel = event.channel;
			switch (channel) {
				case 'rambox.setUnreadCount':
					handleSetUnreadCount(event);
					break;
				case 'rambox.clearUnreadCount':
					handleClearUnreadCount(event);
					break;
				case 'rambox.showWindowAndActivateTab':
					showWindowAndActivateTab(event);
					break;
			}

			/**
			 * Handles 'rambox.clearUnreadCount' messages.
			 * Clears the unread count.
			 */
			function handleClearUnreadCount() {
				me.tab.setBadgeText('');
				me.currentUnreadCount = 0;
				me.setUnreadCount(0);
			}

			/**
			 * Handles 'rambox.setUnreadCount' messages.
			 * Sets the badge text if the event contains an integer as first argument.
			 *
			 * @param event
			 */
			function handleSetUnreadCount(event) {
				if (Array.isArray(event.args) === true && event.args.length > 0) {
					var count = event.args[0];
					if (count === parseInt(count, 10)) {
						me.setUnreadCount(count);
					}
				}
			}

			function showWindowAndActivateTab(event) {
				require('electron').remote.getCurrentWindow().show();
				Ext.cq1('app-main').setActiveTab(me);
			}
		});

		/**
		 * Register page title update event listener only for services that don't prevent it by setting 'dont_update_unread_from_title' to true.
		 */
		if (Ext.getStore('ServicesList').getById(me.record.get('type')).get('dont_update_unread_from_title') !== true) {
			webview.addEventListener("page-title-updated", function(e) {
				var count = e.title.match(/\(([^)]+)\)/); // Get text between (...)
				count = count ? count[1] : '0';
				count = count === '•' ? count : Ext.isArray(count.match(/\d+/g)) ? count.match(/\d+/g).join("") : count.match(/\d+/g); // Some services have special characters. Example: (•)
				count = count === null ? '0' : count;

				me.setUnreadCount(count);
			});
		}

		webview.addEventListener('did-get-redirect-request', function( e ) {
			if ( e.isMainFrame && me.record.get('type') === 'tweetdeck' ) Ext.defer(function() { webview.loadURL(e.newURL); }, 1000); // Applied a defer because sometimes is not redirecting. TweetDeck 2FA is an example.
		});

		webview.addEventListener('update-target-url', function( url ) {
			me.down('statusbar #url').setText(url.url);
		});
	}

	,setUnreadCount: function(newUnreadCount) {
		var me = this;

		if ( !isNaN(newUnreadCount) && (function(x) { return (x | 0) === x; })(parseFloat(newUnreadCount)) && me.record.get('includeInGlobalUnreadCounter') === true) {
			Rambox.util.UnreadCounter.setUnreadCountForService(me.record.get('id'), newUnreadCount);
		} else {
			Rambox.util.UnreadCounter.clearUnreadCountForService(me.record.get('id'));
		}

		me.setTabBadgeText(Rambox.util.Format.formatNumber(newUnreadCount));

		me.doManualNotification(parseInt(newUnreadCount));
	}

	,refreshUnreadCount: function() {
		this.setUnreadCount(this.currentUnreadCount);
	}

	/**
	 * Dispatch manual notification if
	 * • service doesn't have notifications, so Rambox does them
	 * • count increased
	 * • not in dnd mode
	 * • notifications enabled
	 *
	 * @param {int} count
	 */
	,doManualNotification: function(count) {
		var me = this;

		if (Ext.getStore('ServicesList').getById(me.type).get('manual_notifications') &&
			me.currentUnreadCount < count &&
			me.record.get('notifications') &&
			!JSON.parse(localStorage.getItem('dontDisturb'))) {
				Rambox.util.Notifier.dispatchNotification(me, count);
		}

		me.currentUnreadCount = count;
	}

	/**
	 * Sets the tab badge text depending on the service config param "displayTabUnreadCounter".
	 *
	 * @param {string} badgeText
	 */
	,setTabBadgeText: function(badgeText) {
		var me = this;
		if (me.record.get('displayTabUnreadCounter') === true) {
			me.tab.setBadgeText(badgeText);
		} else {
			me.tab.setBadgeText('');
		}
	}

	/**
	 * Clears the unread counter for this view:
	 * • clears the badge text
	 * • clears the global unread counter
	 */
	,clearUnreadCounter: function() {
		var me = this;
		me.tab.setBadgeText('');
		Rambox.util.UnreadCounter.clearUnreadCountForService(me.record.get('id'));
	}

	,reloadService: function(btn) {
		var me = this;
		var webview = me.down('component').el.dom;

		if ( me.record.get('enabled') ) {
			me.clearUnreadCounter();
			webview.loadURL(me.src);
		}
	}

	,toggleDevTools: function(btn) {
		var me = this;
		var webview = me.down('component').el.dom;

		if ( me.record.get('enabled') ) webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
	}

	,setURL: function(url) {
		var me = this;
		var webview = me.down('component').el.dom;

		me.src = url;

		if ( me.record.get('enabled') ) webview.loadURL(url);
	}

	,setAudioMuted: function(muted, calledFromDisturb) {
		var me = this;
		var webview = me.down('component').el.dom;

		me.muted = muted;

		if ( !muted && !calledFromDisturb && JSON.parse(localStorage.getItem('dontDisturb')) ) return;

		if ( me.record.get('enabled') ) webview.setAudioMuted(muted);
	}

	,closeStatusBar: function() {
		var me = this;

		me.down('statusbar').hide();
		me.down('statusbar').closed = true;
		me.down('statusbar').keep = me.record.get('statusbar');
	}

	,setStatusBar: function(keep) {
		var me = this;

		me.down('statusbar').destroy();

		if ( keep ) {
			me.addDocked(me.statusBarConstructor(false));
		} else {
			me.add(me.statusBarConstructor(true));
		}
		me.down('statusbar').keep = keep;
	}

	,setNotifications: function(notification, calledFromDisturb) {
		var me = this;
		var webview = me.down('component').el.dom;

		me.notifications = notification;

		if ( notification && !calledFromDisturb && JSON.parse(localStorage.getItem('dontDisturb')) ) return;

		if ( me.record.get('enabled') ) ipc.send('setServiceNotifications', webview.partition, notification);
	}

	,setEnabled: function(enabled) {
		var me = this;

		me.clearUnreadCounter();

		me.removeAll();
		me.add(me.webViewConstructor(enabled));
		if ( enabled ) {
			me.resumeEvent('afterrender');
			me.show();
			me.tab.setStyle('-webkit-filter', 'grayscale(0)');
			me.onAfterRender();
		} else {
			me.suspendEvent('afterrender');
			me.tab.setStyle('-webkit-filter', 'grayscale(1)');
		}
	}

	,goBack: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		if ( me.record.get('enabled') ) webview.goBack();
	}

	,goForward: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		if ( me.record.get('enabled') ) webview.goForward();
	}

	,zoomIn: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		me.zoomLevel = me.zoomLevel + 0.25;
		if ( me.record.get('enabled') ) {
			webview.setZoomLevel(me.zoomLevel);
			me.record.set('zoomLevel', me.zoomLevel);
		}
	}

	,zoomOut: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		me.zoomLevel = me.zoomLevel - 0.25;
		if ( me.record.get('enabled') ) {
			webview.setZoomLevel(me.zoomLevel);
			me.record.set('zoomLevel', me.zoomLevel);
		}
	}

	,resetZoom: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		me.zoomLevel = 0;
		if ( me.record.get('enabled') ) {
			webview.setZoomLevel(0);
			me.record.set('zoomLevel', me.zoomLevel);
		}
	}
});
