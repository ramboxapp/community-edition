Ext.define('Rambox.view.main.About', {
	 extend: 'Ext.window.Window'
	,xtype: 'about'
	,title: 'About Rambox'
	,autoShow: true
	,modal: true
	,resizable: false
	,constrain: true
	,width: 300
	,height: 385
	,bodyPadding: 10
	,data: {
		 version: require('electron').remote.app.getVersion()
		,platform: process.platform
		,arch: process.arch
		,electron: process.versions.electron
		,chromium: process.versions.chrome
		,node: process.versions.node
	}
	,tpl: [
		 '<div style="text-align:center;"><img src="resources/Icon.png" width="100" /></div>'
		,'<h3>Free and Open Source messaging and emailing app that combines common web applications into one.</h3>'
		,'<div><b>Version:</b> {version}</div>'
		,'<div><b>Platform:</b> {platform} ({arch})</div>'
		,'<div><b>Electron:</b> {electron}</div>'
		,'<div><b>Chromium:</b> {chromium}</div>'
		,'<div><b>Node:</b> {node}</div>'
		,'<br />'
		,'<div style="text-align:center;"><a href="https://github.com/saenzramiro/rambox" target="_blank">GitHub</a> - <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WU75QWS7LH2CA" target="_blank">Donate</a> - <a href="http://rambox.pro" target="_blank">rambox.pro</a></div>'
		,'<br />'
		,'<div style="text-align:center;"><i>Developed by Ramiro Saenz</i></div>'
	]
});
