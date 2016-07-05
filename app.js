// Initialize Firebase
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');
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

// Syncronize with Firebase
function sync() {
	// Is not logged, Skip
	if ( !localStorage.getItem('id_token') ) return;

	var services = [];
	Ext.getStore('Services').each(function(service) {
		services.push(service.data);
	});
	fireRef.database().ref('users/' + Ext.decode(localStorage.getItem('profile')).user_id).set({
		services: services
	});
}

require('electron').ipcRenderer.on('showAbout', function(event, message) {
	!Ext.cq1('about') ? Ext.create('Rambox.view.main.About') : '';
});
