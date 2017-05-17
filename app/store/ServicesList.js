Ext.define('Rambox.store.ServicesList', {
	 extend: 'Ext.data.Store'
	,alias: 'store.serviceslist'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Rambox.model.ServiceList'

	,proxy: {
		 type: 'memory'
	}

	,sorters: [{
		 property: 'name'
		,direction: 'ASC'
	}]

	,autoLoad: true
	,autoSync: true
	,pageSize: 100000
	,data: [
		{
			id: 'trello',
			logo: 'trello.png'			,
			name: 'Trello'			,
			description: 'Infinitely flexible. Incredibly easy to use. Great mobile apps. It\'s free. Trello keeps track of everything, from the big picture to the minute details.',
			url: 'https://trello.com/login',
			type: 'mitglieder'
		},
		{
			id: 'wiki',
			logo: 'wiki.png'			,
			name: 'WikiMedia'			,
			url: 'http://___/wiki',
			type: 'mitglieder'
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,description: 'Slack brings all your communication together in one place. It’s real-time messaging, archiving and search for modern teams.'
			,url: 'https://___.slack.com/'
			,type: 'mitglieder'
			,js_unread: 'function checkUnread(){var a=0,b=0;$(".unread_msgs").each(function(){a+=isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())}),$(".unread_highlights").each(function(){b+=isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())}),updateBadge(a,b)}function updateBadge(a,b){var c=b>0?"("+b+") ":a>0?"(•) ":"";document.title=c+originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'discourse'
			,logo: 'discourse.png'
			,name: 'Discourse'
			,type: 'mitglieder'
			,custom_domain: true
			,allow_popups: true
			,url: "https://___"
			,js_unread: 'function checkUnread(){var a=0,b=0;document.querySelector(".widget-link.badge-notification.unread-private-messages")&&(a=parseInt(document.querySelector(".widget-link.badge-notification.unread-private-messages").title,10)),document.querySelector(".widget-link.badge-notification.unread-notifications")&&(b=parseInt(document.querySelector(".widget-link.badge-notification.unread-notifications").title,10)),updateBadge(a+b)}function updateBadge(a){document.title=a>=1?"("+a+") "+originalTitle:originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
		},
		{
			id: 'facebook'
			,logo: 'facebook.png'
			,name: 'Facebook'
			,type: 'mitglieder'
			,url: "https://www.facebook.com/___"
			//,js_unread: 'function checkUnread(){var a=0,b=0;document.querySelector(".widget-link.badge-notification.unread-private-messages")&&(a=parseInt(document.querySelector(".widget-link.badge-notification.unread-private-messages").title,10)),document.querySelector(".widget-link.badge-notification.unread-notifications")&&(b=parseInt(document.querySelector(".widget-link.badge-notification.unread-notifications").title,10)),updateBadge(a+b)}function updateBadge(a){document.title=a>=1?"("+a+") "+originalTitle:originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,description: 'Hangouts bring conversations to life with photos, emoji, and even group video calls for free. Connect with friends across computers, Android, and Apple devices.'
			,url: 'https://hangouts.google.com/'
			,type: 'mitarbeiter'
			,titleBlink: true
			,manual_notifications: true
			,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?rambox.setUnreadCount(e):rambox.clearUnreadCount()}setInterval(checkUnread,3000);'
			//,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'tweetdeck'
			,logo: 'tweetdeck.png'
			,name: 'TweetDeck'
			,description: 'TweetDeck is a social media dashboard application for management of Twitter accounts.'
			,url: 'https://tweetdeck.twitter.com/'
			,type: 'mitarbeiter'
		},
		{
			 id: 'custom'
			,logo: 'custom.png'
			,name: '_Custom Service'
			,description: 'Add a custom service if is not listed above.'
			,url: '___'
			,type: 'custom'
			,allow_popups: true
		},
		{
			 id: 'roundcube'
			,logo: 'roundcube.png'
			,name: 'Roundcube'
			,description: 'Free and open source webmail software for the masses, written in PHP.'
			,url: '___'
			,type: 'mitarbeiter'
		},
		{
			 id: 'hootsuite'
			,logo: 'hootsuite.png'
			,name: 'Hootsuite'
			,description: 'Enhance your social media management with Hootsuite, the leading social media dashboard. Manage multiple networks and profiles and measure your campaign results.'
			,url: 'https://hootsuite.com/dashboard'
			,type: 'mitarbeiter'
		}
  	]
});
