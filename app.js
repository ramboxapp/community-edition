// Initialize Firebase
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

// Firebase Config
var config = {
	apiKey: "",
	authDomain: "",
	databaseURL: "",
	storageBucket: ""
};
var fireRef = firebase.initializeApp(config); // Firebase Ref
var FirebaseTokenGenerator = require('firebase-token-generator');
var auth0, lock; // Auth0 vars

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
	!Ext.cq1('about') ? Ext.create('Rambox.view.main.About') : '';
});
ipc.on('autoUpdater:checking-for-update:', function() {
	Ext.Msg.wait('Please wait...', 'Checking for update');
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
				,html: '<b>New version is available!</b> ('+releaseName+')'
			}
			,{
				 xtype: 'button'
				,text: 'Install'
				,handler: function(btn) { ipc.send('autoUpdater:quit-and-install'); }
			}
			,{
				 xtype: 'button'
				,text: 'Changelog'
				,href: 'https://github.com/saenzramiro/rambox/releases/tag/'+releaseName
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
});
