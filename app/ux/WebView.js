/**
 * Default config for all webviews created
 */
Ext.define('Rambox.ux.WebView',{
	 extend: 'Ext.panel.Panel'
	,xtype: 'webview'

	// private
	,notifications: 0

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

		Ext.apply(me, {
			 items: [{
				 xtype: 'component'
				,hideMode: 'offsets'
				,autoEl: {
					 tag: 'webview'
					,src: me.src
					,style: 'width:100%;height:100%;'
					,partition: 'persist:' + me.type + '_' + me.id.replace('tab_', '')
					,plugins: 'true'
					,allowtransparency: 'on'
					,autosize: 'on'
				}
			}]
			,tabConfig: {
				listeners: {
					badgetextchange: me.onBadgeTextChange
				}
			}
			,listeners: {
				 afterrender: me.onAfterRender
			}
		});

		me.callParent(config);
	}

	,onBadgeTextChange: function( tab, badgeText, oldBadgeText ) {
		if ( oldBadgeText === null ) oldBadgeText = 0;
		var actualNotifications = Rambox.app.getTotalNotifications();
		Rambox.app.setTotalNotifications(actualNotifications - parseInt(oldBadgeText) + parseInt(badgeText));
	}

	,onAfterRender: function() {
		var me = this;
		var webview = me.down('component').el.dom;

		// Show and hide spinner when is loading
		webview.addEventListener("did-start-loading", function() {
			console.info('Start loading...', me.src);
			me.mask('Loading...');
		});
		webview.addEventListener("did-stop-loading", function() {
			me.unmask();
		});

		webview.addEventListener("did-finish-load", function(e) {
			Rambox.app.setTotalServicesLoaded( Rambox.app.getTotalServicesLoaded() + 1 );
			if ( Rambox.app.getTotalServicesLoaded() === Ext.getStore('Services').getCount() ) {
				Ext.get('spinner').destroy();
			}
		});

		webview.addEventListener("dom-ready", function(e) {
			// Mute Webview
			if ( !webview.isAudioMuted() && me.muted ) webview.setAudioMuted(me.muted);

			// Open links in default browser
			webview.addEventListener('new-window', function(e) {
				require('remote').shell.openExternal(e.url);
			});

			// Injected code to detect new messages
			switch ( me.type ) {
				case 'inbox':
					webview.executeJavaScript('function checkUnread(){updateBadge(document.getElementsByClassName("qG").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);');
					break;
				case 'hangouts':
					webview.executeJavaScript('function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);');
					break;
				default:
					break;
			}
		});

		webview.addEventListener("page-title-updated", function(e) {
			var ipc = require('electron').ipcRenderer;
			var count = e.title.match(/\((\d+)\)/);
				count = count ? parseInt(count[1]) : 0;

			switch ( me.type ) {
				case 'messenger':
					if ( count !== me.notifications && count > 0 ) {
						me.notifications = count;
					}
					if ( count || e.title === 'Messenger' ) {
						me.tab.setBadgeText(count);
					}
					if ( e.title === 'Messenger' ) me.notifications = 0;
					break;
				case 'hangouts':
					if ( count !== me.notifications && count > 0 ) {
						me.notifications = count;
					}
					if ( count || e.title === 'Google Hangouts' ) {
						me.tab.setBadgeText(count);
					}
					if ( e.title === 'Google Hangouts' ) me.notifications = 0;
					break;
				case 'slack':
					if ( e.title.indexOf('! ') >= 0 ) {
						me.tab.setBadgeText(1);
						me.notifications = 1;
					} else {
						me.tab.setBadgeText(0);
						me.notifications = 0;
					}
					break;
				default:
					me.tab.setBadgeText(count);
					me.notifications = count;
					break;
			}
		});
	}
});
