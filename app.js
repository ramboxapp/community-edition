// Initialize Firebase
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

// Firebug Config
var config = {
	apiKey: "AIzaSyAXedcpudidIUVhvn0jjrMHHWXv7YzWAR0",
	authDomain: "rambox-d1326.firebaseapp.com",
	databaseURL: "https://rambox-d1326.firebaseio.com",
	storageBucket: "rambox-d1326.appspot.com"
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

require('electron').ipcRenderer.on('showAbout', function(event, message) {
	!Ext.cq1('about') ? Ext.create('Rambox.view.main.About') : '';
});
