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
		,'Rambox.util.IconLoader'
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

		const prefConfig = ipc.sendSync('getConfig');
		Ext.apply(me, {
			 items: me.webViewConstructor()
			,title: prefConfig.hide_tabbar_labels ? '' : (me.record.get('tabname') ? me.record.get('name') : '')
			,icon: me.record.get('type') === 'custom' ? (me.record.get('logo') === '' ? 'resources/icons/custom.png' : me.record.get('logo')) : 'https://firebasestorage.googleapis.com/v0/b/rambox-d1326.appspot.com/o/services%2F'+me.record.get('logo')+'?alt=media'
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
			,tbar: {
				 itemId: 'searchBar'
				,hidden: true
				,items: ['->', {
					 xtype: 'textfield'
					,emptyText: 'Search...'
					,listeners: {
						 scope: me
						,change: me.doSearchText
						,specialkey: function(field, e) {
							if ( e.getKey() === e.ENTER ) return me.doSearchText(field, field.getValue(), null, null, true)
							if ( e.getKey() === e.ESC ) return me.showSearchBox(false)
						}
					}
				}, {
					 xtype: 'displayfield'
				}, {
					 xtype: 'segmentedbutton'
					,allowMultiple: false
					,allowToggle: false
					,items: [{
						 glyph: 'xf053@FontAwesome'
						,handler: function() {
							var field = this.up('toolbar').down('textfield');
							me.doSearchText(field, field.getValue(), null, null, false)
						}
					}, {
						 glyph: 'xf054@FontAwesome'
						,handler: function() {
							var field = this.up('toolbar').down('textfield');
							me.doSearchText(field, field.getValue(), null, null, true)
						}
					}]
				}, {
					 xtype: 'button'
					,glyph: 'xf00d@FontAwesome'
					,handler: function() { me.showSearchBox(false) }
				}]
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
				,cls: 'webview'
				,hideMode: 'offsets'
				,autoRender: true
				,autoShow: true
				,autoEl: {
					 tag: 'webview'
					,src: me.record.get('url')
					,style: 'width:100%;height:100%;visibility:visible;'
					,partition: 'persist:' + me.record.get('type') + '_' + me.id.replace('tab_', '') + (localStorage.getItem('id_token') ? '_' + Ext.decode(localStorage.getItem('profile')).sub : '')
					,plugins: 'true'
					,allowtransparency: 'on'
					,autosize: 'on'
					,webpreferences: '' //,nativeWindowOpen=yes
					//,disablewebsecurity: 'on' // Disabled because some services (Like Google Drive) dont work with this enabled
					,useragent: me.getUserAgent()
					,preload: './resources/js/rambox-service-api.js'
				}
			}];

			if ( Ext.getStore('ServicesList').getById(this.record.get('type')) ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('allow_popups') : false ) cfg[0].autoEl.allowpopups = 'on';
		}

		return cfg;
	}
	,getUserAgent: function() {
		var ua = ipc.sendSync('getConfig').user_agent ? ipc.sendSync('getConfig').user_agent : Ext.getStore('ServicesList').getById(this.record.get('type')) ? Ext.getStore('ServicesList').getById(this.record.get('type')).get('userAgent') : ''
		return ua.length === 0 ? window.clientInformation.userAgent.replace(/Rambox\/([0-9]\.?)+\s/ig,'').replace(/Electron\/([0-9]\.?)+\s/ig,'') : ua;
	}

	,statusBarConstructor: function(floating) {
		var me = this;

		return {
			 xtype: 'statusbar'
			,id: me.id+'statusbar'
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

		var webview = me.getWebView();
		let googleLoginURLs = ['accounts.google.com/signin', 'accounts.google.com/ServiceLogin', ]
		me.errorCodeLog = []

		// Google Analytics Event
		ga_storage._trackEvent('Services', 'load', me.type, 1, true);

		// Notifications in Webview
		me.setNotifications(localStorage.getItem('locked') || JSON.parse(localStorage.getItem('dontDisturb')) ? false : me.record.get('notifications'));

		// Show and hide spinner when is loading
		webview.addEventListener("did-start-loading", function() {
			console.info('Start loading...', me.src);

			webview.getWebContents().session.webRequest.onBeforeSendHeaders((details, callback) => {
				googleLoginURLs.forEach((loginURL) => {	if ( details.url.indexOf(loginURL) > -1 ) details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0'})
				callback({ cancel: false, requestHeaders: details.requestHeaders });
			});

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

			// Fix cursor sometimes dissapear
			let currentTab = Ext.cq1('app-main').getActiveTab();
			if ( currentTab.id === me.id ) {
				webview.blur();
				webview.focus();
			}
			// Set special icon for some service (like Slack)
			Rambox.util.IconLoader.loadServiceIconUrl(me, webview);
		});

		// On search text
		webview.addEventListener('found-in-page', function(e) {
			me.onSearchText(e.result)
		});

		// On search text
		webview.addEventListener('did-fail-load', function(e) {
			console.info('The service fail at loading', me.src, e);

			if ( me.record.get('disableAutoReloadOnFail') || !e.isMainFrame ) return
			me.errorCodeLog.push(e.errorCode)

			var attempt = me.errorCodeLog.filter(function(code) { return code === e.errorCode });

			// Error codes: https://cs.chromium.org/chromium/src/net/base/net_error_list.h
			var msg = []
			msg[-2] = 'NET error: failed.'
			msg[-3] = 'An operation was aborted (due to user action)'
			msg[-7] = 'Connection timeout.'
			msg[-21] = 'Network change.'
			msg[-100] = 'The connection was reset. Check your internet connection.'
			msg[-101] = 'The connection was reset. Check your internet connection.'
			msg[-105] = 'Name not resolved. Check your internet connection.'
			msg[-106] = 'There is no active internet connection.'
			msg[-118] = 'Connection timed out. Check your internet connection.'
			msg[-130] = 'Proxy connection failed. Please, check the proxy configuration.'
			msg[-300] = 'The URL is invalid.'
			msg[-324] = 'Empty response. Check your internet connection.'

			switch ( e.errorCode ) {
				case 0:
					break
				case -3: // An operation was aborted (due to user action) I think that gmail an other pages that use iframes stop some of them making this error fired
					if ( attempt.length <= 4 ) return
					setTimeout(() => me.reloadService(me), 200);
					me.errorCodeLog = []
					break;
				case -2:
				case -7:
				case -21:
				case -118:
				case -324:
				case -100:
				case -101:
				case -105:
					attempt.length > 4 ? me.onFailLoad(msg[e.errorCode]) : setTimeout(() => me.reloadService(me), 2000);
					break;
				case -106:
					me.onFailLoad(msg[e.errorCode])
					break;
				case -130:
					// Could not create a connection to the proxy server. An error occurred
					// either in resolving its name, or in connecting a socket to it.
					// Note that this does NOT include failures during the actual "CONNECT" method
					// of an HTTP proxy.
				case -300:
					attempt.length > 4 ? me.onFailLoad(msg[e.errorCode]) : me.reloadService(me);
					break;
			}
		});

		// Open links in default browser
		webview.addEventListener('new-window', function(e) {
			switch ( me.type ) {
				case 'skype':
					// hack to fix multiple browser tabs on Skype link click, re #11
					if ( require('url').parse(me.down('statusbar #url').html).protocol !== null ) {
						e.url = me.down('statusbar #url').html;
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
					} else if ( e.url.indexOf('/el/CONVERSATION/') >= 0 ) {
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
									,partition: me.getWebView().partition
									,useragent: me.getUserAgent()
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
									,partition: me.getWebView().partition
									,useragent: me.getUserAgent()
								}
							}
						}).show();
						e.preventDefault();
						return;
					}
					break;
				case 'icloud':
					if ( e.url.indexOf('index.html#compose') >= 0 ) {
						me.add({
							 xtype: 'window'
							,title: 'iCloud - Compose'
							,width: 700
							,height: 500
							,maximizable: true
							,resizable: true
							,draggable: true
							,collapsible: true
							,items: {
								 xtype: 'component'
								,itemId: 'webview'
								,hideMode: 'offsets'
								,autoRender: true
								,autoShow: true
								,autoEl: {
									 tag: 'webview'
									,src: e.url
									,style: 'width:100%;height:100%;'
									,partition: me.getWebView().partition
									,useragent: me.getUserAgent()
									,preload: './resources/js/rambox-modal-api.js'
								}
							}
							,listeners: {
								show: function(win) {
									const webview = win.down('#webview').el.dom;
									webview.addEventListener('ipc-message', function(event) {
										var channel = event.channel;
										switch (channel) {
											case 'close':
												win.close();
												break;
											default:
												break;
										}
									});
								}
							}
						}).show();
						e.preventDefault();
						return;
					}
					break;
				case 'flowdock':
					if ( e.disposition === 'new-window' ) {
						e.preventDefault();
						require('electron').shell.openExternal(e.url);
					}
					return;
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

		let eventsOnDom = false;
		webview.addEventListener("dom-ready", function(e) {
			// Mute Webview
			if ( me.record.get('muted') || localStorage.getItem('locked') || JSON.parse(localStorage.getItem('dontDisturb')) ) me.setAudioMuted(true, true);

			var js_inject = '';
			// Injected code to detect new messages
			if ( me.record ) {
				var js_unread = Ext.getStore('ServicesList').getById(me.record.get('type')) ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('js_unread') : '' ;
				js_unread = js_unread + me.record.get('js_unread');
				if ( js_unread !== '' ) {
					console.groupCollapsed(me.record.get('type').toUpperCase() + ' - JS Injected to Detect New Messages');
					console.info(me.type);
					console.log(js_unread);
					js_inject += js_unread;
				}
			}

			// Prevent Title blinking (some services have) and only allow when the title have an unread regex match: "(3) Title"
			if ( Ext.getStore('ServicesList').getById(me.record.get('type')) ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('titleBlink') : false ) {
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
			if (!eventsOnDom) {
				webview.getWebContents().on('before-input-event', (event, input) => {
					if (input.type !== 'keyDown') return;

					var modifiers = [];
					if ( input.shift ) modifiers.push('shift');
					if ( input.control ) modifiers.push('control');
					if ( input.alt ) modifiers.push('alt');
					if ( input.meta ) modifiers.push('meta');
					if ( input.isAutoRepeat  ) modifiers.push('isAutoRepeat');

					if ( input.key === 'Tab' && !(modifiers && modifiers.length) ) return;

					// Maps special keys to fire the correct event in Mac OS
					if ( require('electron').remote.process.platform === 'darwin' ) {
						var keys = [];
						keys['ƒ'] = 'f'; // Search
						keys[' '] = 'l'; // Lock
						keys['∂'] = 'd'; // DND

						input.key = keys[input.key] ? keys[input.key] : input.key;
					}

					if ( input.key === 'F11' || input.key === 'a' || input.key === 'A' || input.key === 'F12' || input.key === 'q' || (input.key === 'F1' && modifiers.includes('control'))) return;

					require('electron').remote.getCurrentWebContents().sendInputEvent({
						type: input.type,
						keyCode: input.key,
						modifiers: modifiers
					});
				})
				eventsOnDom = true;

				googleLoginURLs.forEach((loginURL) => {	if ( webview.getURL().indexOf(loginURL) > -1 ) webview.reload() })
			}
			webview.executeJavaScript(js_inject).then(result => {} ).catch(err => { console.log(err) })
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
			 * Sets the badge text if the event contains an integer or a '•' (indicating non-zero but unknown number of unreads) as first argument.
			 *
			 * @param event
			 */
			function handleSetUnreadCount(event) {
				if (Array.isArray(event.args) === true && event.args.length > 0) {
					var count = event.args[0];
					if (count === parseInt(count, 10) || "•" === count) {
						if ( count === 999999 ) count = "•";
						me.setUnreadCount(count);
					}
				}
			}

			function showWindowAndActivateTab(event) {
				require('electron').remote.getCurrentWindow().show();
				var tabPanel = Ext.cq1('app-main');
				// Temp fix missing cursor after upgrade to electron 3.x +
				tabPanel.setActiveTab(me);
				tabPanel.getActiveTab().getWebView().blur();
				tabPanel.getActiveTab().getWebView().focus();
			}
		});

		/**
		 * Register page title update event listener only for services that don't specify a js_unread
		 */
		if ( Ext.getStore('ServicesList').getById(me.record.get('type')) ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('js_unread') === '' : false && me.record.get('js_unread') === '' ) {
			webview.addEventListener("page-title-updated", function(e) {
				var count = e.title.match(/\(([^)]+)\)/); // Get text between (...)
				count = count ? count[1] : '0';
				count = count === '•' ? count : Ext.isArray(count.match(/\d+/g)) ? count.match(/\d+/g).join("") : count.match(/\d+/g); // Some services have special characters. Example: (•)
				count = count === null ? '0' : count;

				me.setUnreadCount(count);
			});
		}

		webview.addEventListener('did-navigate', function( e ) {
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
		var manualNotifications = Ext.getStore('ServicesList').getById(me.type) ? Ext.getStore('ServicesList').getById(me.type).get('manual_notifications') : false;
		if ( manualNotifications && me.currentUnreadCount < count && me.record.get('notifications') && !JSON.parse(localStorage.getItem('dontDisturb'))) {
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
		var webview = me.getWebView();

		if ( me.record.get('enabled') ) {
			me.clearUnreadCounter();
			webview.loadURL(me.src);
		}
	}

	,onFailLoad: function(v) {
		let me = this
		me.errorCodeLog = []
		setTimeout(() => Ext.getCmp(me.id+'statusbar').setStatus({ text: '<i class="fa fa-warning fa-fw" aria-hidden="true"></i> The service failed at loading, Error: '+ v }), 1000);
	}

	,showSearchBox: function(v) {
		var me = this;
		if ( !me.record.get('enabled') ) return;
		var webview = me.getWebView();

		webview.stopFindInPage('keepSelection');
		if ( v ) {
			me.down('#searchBar').show();
			setTimeout(() => { me.down('#searchBar textfield').focus() }, 100)
		} else {
			me.down('#searchBar').hide();
			me.down('#searchBar textfield').setValue('');
		}

		me.down('#searchBar displayfield').setValue('');
	}

	,doSearchText: function(field, newValue, oldValue, eOpts, forward = true) {
		var me = this;
		var webview = me.getWebView();

		if ( newValue === '' ) {
			webview.stopFindInPage('clearSelection');
			me.down('#searchBar displayfield').setValue('');
			return;
		}

		webview.findInPage(newValue, {
			forward: forward,
			findNext: false,
			matchCase: false
		})
	}

	,onSearchText: function( result ) {
		var me = this;

		me.down('#searchBar displayfield').setValue(result.activeMatchOrdinal+ '/' + result.matches);
	}

	,toggleDevTools: function(btn) {
		var me = this;
		var webview = me.getWebView();

		if ( me.record.get('enabled') ) webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
	}

	,setURL: function(url) {
		var me = this;
		var webview = me.getWebView();

		me.src = url;

		if ( me.record.get('enabled') ) webview.loadURL(url);
	}

	,setAudioMuted: function(muted, calledFromDisturb) {
		var me = this;
		var webview = me.getWebView();

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

		me.removeDocked(me.down('statusbar'), true);

		if ( keep ) {
			me.addDocked(me.statusBarConstructor(false));
		} else {
			me.add(me.statusBarConstructor(true));
		}
		me.down('statusbar').keep = keep;
	}

	,setNotifications: function(notification, calledFromDisturb) {
		var me = this;
		var webview = me.getWebView();

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
		var webview = me.getWebView();

		if ( me.record.get('enabled') ) webview.goBack();
	}

	,goForward: function() {
		var me = this;
		var webview = me.getWebView();

		if ( me.record.get('enabled') ) webview.goForward();
	}

	,zoomIn: function() {
		if ( this.timeout ) clearTimeout( this.timeout );
			this.timeout = setTimeout(() => {
				var me = this;
				var webview = me.getWebView();
				me.zoomLevel = me.zoomLevel + 0.25;
				if ( me.record.get('enabled') ) {
					webview.setZoomLevel(me.zoomLevel);
					me.record.set('zoomLevel', me.zoomLevel);
				}
		}, 100);
	}

	,zoomOut: function() {
		if ( this.timeout ) clearTimeout( this.timeout );
			this.timeout = setTimeout(() => {
				var me = this;
				var webview = me.getWebView();
				me.zoomLevel = me.zoomLevel - 0.25;
				if ( me.record.get('enabled') ) {
					webview.setZoomLevel(me.zoomLevel);
					me.record.set('zoomLevel', me.zoomLevel);
				}
		}, 100);
	}

	,resetZoom: function() {
		var me = this;
		var webview = me.getWebView();

		me.zoomLevel = 0;
		if ( me.record.get('enabled') ) {
			webview.setZoomLevel(0);
			me.record.set('zoomLevel', me.zoomLevel);
		}
	}

	,getWebView: function() {
		if ( this.record.get('enabled') ) {
			return this.down('component[cls=webview]').el.dom;
		} else {
			return false;
		}
	}
});
