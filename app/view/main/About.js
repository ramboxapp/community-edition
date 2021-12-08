Ext.define('Hamsket.view.main.About', {
	 extend: 'Ext.window.Window'
	,xtype: 'about'
	,title: locale['app.about[0]']
	,autoShow: true
	,modal: true
	,resizable: false
	,constrain: true
	,width: 300
	,height: 450
	,bodyPadding: 10
	,initComponent() {
		const me = this;
		me.callParent(arguments);
		me.data.buildversion = require('fs').readFileSync( __dirname + '/BUILDVERSION', 'utf8');
	}
	,data: {
		 version: require('@electron/remote').app.getVersion()
		,platform: process.platform
		,arch: process.arch
		,electron: process.versions.electron
		,chromium: process.versions.chrome
		,node: process.versions.node
	}
	,tpl: [
		 '<div style="text-align:center;"><img src="resources/Icon.png" width="100" /></div>'
		,'<h3>'+locale['app.about[1]']+'</h3>'
		,'<div><b>'+locale['app.about[2]']+':</b> {version}</div>'
		,'<div><b>'+locale['app.about[3]']+':</b> {platform} ({arch})</div>'
		,'<div><b>Electron:</b> {electron}</div>'
		,'<div><b>Chromium:</b> {chromium}</div>'
		,'<div><b>Node:</b> {node}</div>'
		,'<div><b>BuildVersion:</b> {buildversion}</div>'
		,'<br />'
		,'<div style="text-align:center;"><a href="https://github.com/TheGoddessInari/hamsket" target="_blank">GitHub</a></div>'
		,'<br />'
		,'<div style="text-align:center;"><i>'+locale['app.about[4]']+' TheGoddessInari.'
		,'<br />'
		, 'Original version by Ramiro Saenz.</i></div>'
	]
});
