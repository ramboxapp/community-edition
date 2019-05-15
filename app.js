// Sencha App
Ext.setGlyphFontFamily('FontAwesome');
Ext.application({
	 name: 'Rambox'

	,extend: 'Rambox.Application'

	,autoCreateViewport: 'Rambox.view.main.Main'
});

// auto update logic
const ipc = require('electron').ipcRenderer;

ipc.on('showAbout', function(event, message) {
	if(!Ext.cq1('about')) {
		Ext.create('Rambox.view.main.About');
	}
});
ipc.on('showPreferences', function(event, message) {
	if (!Ext.cq1('preferences')) {
		 Ext.create('Rambox.view.preferences.Preferences').show();
	}
});
ipc.on('autoUpdater:check-update', function() {
	Rambox.app.checkUpdate();
});
ipc.on('autoUpdater:update-not-available', function() {
	Ext.Msg.show({
		 title: 'You are up to date!'
		,message: 'You have the latest version of Rambox.'
		,icon: Ext.Msg.INFO
		,buttons: Ext.Msg.OK
	});
});
ipc.on('autoUpdater:update-available', function() {
	Ext.Msg.show({
		 title: 'New Version available!'
		,message: 'Please wait until Rambox download the new version and ask you for install it.'
		,icon: Ext.Msg.INFO
		,buttons: Ext.Msg.OK
	});
});
ipc.on('autoUpdater:update-downloaded', function(e, releaseNotes, releaseName, releaseDate, updateURL) {
	Ext.cq1('app-main').addDocked({
		 xtype: 'toolbar'
		,dock: 'top'
		,ui: 'newversion'
		,items: [
			'->'
			,{
				 xtype: 'label'
				,html: '<b>New version ready to install ('+releaseName+')!</b> It will be installed the next time Rambox is relaunched.'
			}
			,{
				 xtype: 'button'
				,text: 'Relaunch Now'
				,handler(btn) { ipc.send('autoUpdater:quit-and-install'); }
			}
			,{
				 xtype: 'button'
				,text: 'Changelog'
				,ui: 'decline'
				,href: 'https://github.com/TheGoddessInari/rambox/releases/tag/'+releaseName
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
});

// Set Badge in taskbar for Windows
ipc.on('setBadge', function(event, messageCount) {
	messageCount = messageCount.toString();
	const canvas = document.createElement("canvas");
	canvas.height = 140;
	canvas.width = 140;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "red";
	ctx.beginPath();
	ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
	ctx.fill();
	ctx.textAlign = "center";
	ctx.fillStyle = "white";

	const ranges = [
		{ divider: 1e18 , suffix: 'P' },
		{ divider: 1e15 , suffix: 'E' },
		{ divider: 1e12 , suffix: 'T' },
		{ divider: 1e9 , suffix: 'G' },
		{ divider: 1e6 , suffix: 'M' },
		{ divider: 1e3 , suffix: 'k' }
	];

	function formatNumber(n) {
		n = parseInt(n);
		for (const i of ranges) {
			if (n >= i.divider) {
				return Math.round(n / i.divider).toString() + i.suffix;
			}
		}
		return n.toString();
	}

	if (messageCount.length === 3) {
		ctx.font = "75px sans-serif";
		ctx.fillText("" + messageCount, 70, 98);
	} else if (messageCount.length === 2) {
		ctx.font = "100px sans-serif";
		ctx.fillText("" + messageCount, 70, 105);
	} else if (messageCount.length === 1) {
		ctx.font = "125px sans-serif";
		ctx.fillText("" + messageCount, 70, 112);
	} else {
		ctx.font = "75px sans-serif";
		ctx.fillText("" + formatNumber(messageCount), 70, 98);
	}

	ipc.send('setBadge', messageCount, canvas.toDataURL());
});
// Reload Current Service
ipc.on('reloadCurrentService', function(e) {
	const tab = Ext.cq1('app-main').getActiveTab();
	if ( tab.id !== 'ramboxTab' ) tab.reloadService();
});

ipc.on('tabFocusNext', function() {
	const tabPanel = Ext.cq1('app-main');
	const activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
	let i = activeIndex + 1;

	tabPanel.getActiveTab().blur();

	// "cycle" (go to the start) when the end is reached or the end is the spacer "tbfill"
	if (i === tabPanel.items.items.length || i === tabPanel.items.items.length - 1 && tabPanel.items.items[i].id === 'tbfill') i = 0;

	// skip spacer
	while (tabPanel.items.items[i].id === 'tbfill') i++;

	tabPanel.setActiveTab(i);
	tabPanel.getActiveTab().focus();
});

ipc.on('tabFocusPrevious', function() {
	const tabPanel = Ext.cq1('app-main');
	const activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
	let i = activeIndex - 1;
	tabPanel.getActiveTab().blur();
	if ( i < 0 ) i = tabPanel.items.items.length - 1;
	while ( tabPanel.items.items[i].id === 'tbfill' || i < 0 ) i--;
	tabPanel.setActiveTab( i );
	tabPanel.getActiveTab().focus();
});

ipc.on('tabZoomIn', function() {
	const tabPanel = Ext.cq1('app-main');
	if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;
	tabPanel.getActiveTab().zoomIn();
});

ipc.on('tabZoomOut', function() {
	const tabPanel = Ext.cq1('app-main');
	if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;
	tabPanel.getActiveTab().zoomOut();
});

ipc.on('tabResetZoom', function() {
	const tabPanel = Ext.cq1('app-main');
	if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;
	tabPanel.getActiveTab().resetZoom();
});

ipc.on('toggleDoNotDisturb', function(key) {
	const btn = Ext.getCmp('disturbBtn');
	btn.toggle();
	Ext.cq1('app-main').getController().dontDisturb(btn, true);
});

ipc.on('lockWindow', function(key) {
	const btn = Ext.getCmp('lockRamboxBtn');
	Ext.cq1('app-main').getController().lockRambox(btn);
});

ipc.on('goHome', function() {
	const tabPanel = Ext.cq1('app-main');
	tabPanel.getActiveTab().blur();
	tabPanel.setActiveTab(0);
	tabPanel.getActiveTab().focus();
});

// Focus the current service when Alt + Tab or click in webviews textfields
window.addEventListener('focus', function() {
	if(Ext.cq1("app-main")) Ext.cq1("app-main").getActiveTab().focus();
});
