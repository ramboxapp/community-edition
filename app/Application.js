Ext.define('Hamsket.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Hamsket'

	,requires: [
		 'Hamsket.ux.FileBackup'
		,'Hamsket.util.MD5'
		,'Ext.window.Toast'
		,'Ext.util.Cookies'
	]

	,stores: [
		 'ServicesList'
		,'Services'
		,'OS'
	]

	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}

	,launch() {
		// Load language for Ext JS library
		Ext.Loader.loadScript({url: Ext.util.Format.format("ext/packages/ext-locale/build/ext-locale-{0}.js", localStorage.getItem('locale') || 'en')});


		// Set cookies to help Tooltip.io messages segmentation
		Ext.util.Cookies.set('version', require('electron').remote.app.getVersion());

		// Check for updates
		if ( require('electron').remote.process.argv.indexOf('--without-update') === -1 ) Hamsket.app.checkUpdate(true);

		// Mouse Wheel zooming
		document.addEventListener('mousewheel', function(e) {
			if( e.ctrlKey ) {
				const  delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));

				const tabPanel = Ext.cq1('app-main');
				if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

				if ( delta === 1 ) { // Zoom In
					tabPanel.getActiveTab().zoomIn();
				} else { // Zoom Out
					tabPanel.getActiveTab().zoomOut();
				}
			}
		}, {passive:true});

		// Define default value
		if ( localStorage.getItem('dontDisturb') === null ) localStorage.setItem('dontDisturb', false);
		ipc.send('setDontDisturb', localStorage.getItem('dontDisturb')); // We store it in config

		if ( localStorage.getItem('locked') ) {
			console.info('Lock Hamsket:', 'Enabled');
			Ext.cq1('app-main').getController().showLockWindow();
		}

		// Remove spinner
		Ext.get('spinner').destroy();
	}

	,updateTotalNotifications( newValue, oldValue ) {
		newValue = parseInt(newValue);
		if ( newValue > 0 )	{
			if ( Ext.cq1('app-main').getActiveTab().record ) {
				document.title = 'Hamsket (' + Hamsket.util.Format.formatNumber(newValue) + ') - '+Ext.cq1('app-main').getActiveTab().record.get('name');
			} else {
				document.title = 'Hamsket (' + Hamsket.util.Format.formatNumber(newValue) + ')';
			}
		} else {
			if ( Ext.cq1('app-main') && Ext.cq1('app-main').getActiveTab().record ) {
				document.title = 'Hamsket - '+Ext.cq1('app-main').getActiveTab().record.get('name');
			} else {
				document.title = 'Hamsket';
			}
		}
	}

	,checkUpdate(silence) {
		console.info('Checking for updates...');
		Ext.Ajax.request({
			 url: 'https://api.github.com/repos/TheGoddessInari/hamsket/releases/latest'
			,method: 'GET'
			,success(response) {
				const json = JSON.parse(response.responseText);
				const appVersion = new Ext.Version(require('electron').remote.app.getVersion());
				const updateVersion = new Ext.Version(json.tag_name);
				if ( appVersion.isLessThan(updateVersion) ) {
					console.info('New version is available', updateVersion);
					Ext.cq1('app-main').addDocked({
						 xtype: 'toolbar'
						,dock: 'top'
						,ui: 'newversion'
						,items: [
							'->'
							,{
								 xtype: 'label'
								,html: '<b>'+locale['app.update[0]']+'</b> ('+updateVersion+')'
							}
							,{
								 xtype: 'button'
								,text: locale['app.update[1]']
								,href: 'https://github.com/TheGoddessInari/hamsket/releases/latest'
							}
							,{
								 xtype: 'button'
								,text: locale['app.update[2]']
								,ui: 'decline'
								,tooltip: 'Click here to see more information about the new version.'
								,href: 'https://github.com/TheGoddessInari/hamsket/releases/tag/'+updateVersion
							}
							,'->'
							,{
								 glyph: 'XF00D@FontAwesome'
								,baseCls: ''
								,style: 'cursor:pointer;'
								,handler(btn) { Ext.cq1('app-main').removeDocked(btn.up('toolbar'), true); }
							}
						]
					});
					return;
				} else if ( !silence ) {
					Ext.Msg.show({
						 title: locale['app.update[3]']
						,message: locale['app.update[4]']
						,icon: Ext.Msg.INFO
						,buttons: Ext.Msg.OK
					});
				}

				console.info('Your version is the latest. No need to update.');
			}
		});
	}
});
