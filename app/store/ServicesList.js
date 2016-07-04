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
			 id: 'whatsapp'
			,logo: 'whatsapp.png'
			,name: 'WhatsApp'
			,url: 'https://web.whatsapp.com/'
			,type: 'messaging'
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,url: 'https://___.slack.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unread_highlight"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'noysi'
			,logo: 'noysi.png'
			,name: 'Noysi'
			,url: 'https://noysi.com/#/identity/sign-in'
			,type: 'messaging'
		},
		{
			 id: 'messenger'
			,logo: 'messenger.png'
			,name: 'Messenger'
			,url: 'https://www.messenger.com/login/'
			,type: 'messaging'
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,url: 'https://web.skype.com/'
			,type: 'messaging'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,url: 'https://hangouts.google.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'hipchat'
			,logo: 'hipchat.png'
			,name: 'HipChat'
			,url: 'https://www.hipchat.com/sign_in/'
			,type: 'messaging'
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,url: 'https://web.telegram.org/#/login'
			,type: 'messaging'
		},
		{
			 id: 'wechat'
			,logo: 'wechat.png'
			,name: 'WeChat'
			,url: 'https://web.wechat.com/'
			,type: 'messaging'
		},
		{
			 id: 'gmail'
			,logo: 'gmail.png'
			,name: 'Gmail'
			,url: 'https://mail.google.com/mail/'
			,type: 'email'
		},
		{
			 id: 'inbox'
			,logo: 'inbox.png'
			,name: 'Inbox'
			,url: 'http://inbox.google.com/?cid=imp'
			,type: 'email'
			,js_unread: 'function checkUnread(){updateBadge(document.getElementsByClassName("qG").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'chatwork'
			,logo: 'chatwork.png'
			,name: 'ChatWork'
			,url: 'https://www.chatwork.com/login.php'
			,type: 'messaging'
		},
		{
			 id: 'groupme'
			,logo: 'groupme.png'
			,name: 'GroupMe'
			,url: 'https://web.groupme.com/signin'
			,type: 'messaging'
		},
		{
			 id: 'grape'
			,logo: 'grape.png'
			,name: 'Grape'
			,url: 'https://chatgrape.com/accounts/login/'
			,type: 'messaging'
		},
		{
			 id: 'gitter'
			,logo: 'gitter.png'
			,name: 'Gitter'
			,url: 'https://gitter.im/login'
			,type: 'messaging'
		},
		{
			 id: 'steam'
			,logo: 'steam.png'
			,name: 'Steam Chat'
			,url: 'https://steamcommunity.com/chat'
			,type: 'messaging'
		},
		{
			 id: 'discord'
			,logo: 'discord.png'
			,name: 'Discord'
			,url: 'https://discordapp.com/login'
			,type: 'messaging'
		},
		{
			 id: 'outlook'
			,logo: 'outlook.png'
			,name: 'Outlook'
			,url: 'https://mail.live.com/'
			,type: 'email'
		},
		{
			 id: 'outlook365'
			,logo: 'outlook365.png'
			,name: 'Outlook 365'
			,url: 'https://outlook.office.com/owa/'
			,type: 'email'
		},
		{
			 id: 'yahoo'
			,logo: 'yahoo.png'
			,name: 'Yahoo! Mail'
			,url: 'https://mail.yahoo.com/'
			,type: 'email'
		},
		{
			 id: 'protonmail'
			,logo: 'protonmail.png'
			,name: 'ProtonMail'
			,url: 'https://mail.protonmail.com/inbox'
			,type: 'email'
		},
		{
			 id: 'tutanota'
			,logo: 'tutanota.png'
			,name: 'Tutanota'
			,url: 'https://app.tutanota.de/'
			,type: 'email'
		},
		{
			 id: 'hushmail'
			,logo: 'hushmail.png'
			,name: 'Hushmail'
			,url: 'https://www.hushmail.com/hushmail/index.php'
			,type: 'email'
		},
		{
			 id: 'missive'
			,logo: 'missive.png'
			,name: 'Missive'
			,url: 'https://mail.missiveapp.com/login'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unseen-count"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'rocketchat'
			,logo: 'rocketchat.png'
			,name: 'Rocket Chat'
			,url: '___'
			,type: 'messaging'
		},
		{
			 id: 'wire'
			,logo: 'wire.png'
			,name: 'Wire'
			,url: 'https://app.wire.com/auth/#login'
			,type: 'messaging'
		},
		{
			 id: 'sync'
			,logo: 'sync.png'
			,name: 'Sync'
			,url: 'https://m.wantedly.com/login'
			,type: 'messaging'
		},
		{
			 id: 'bearychat'
			,logo: 'bearychat.png'
			,name: 'BearyChat'
			,url: 'https://___.bearychat.com/'
			,type: 'messaging'
		},
		{
			 id: 'yahoomessenger'
			,logo: 'yahoomessenger.png'
			,name: 'Yahoo! Messenger'
			,url: 'https://messenger.yahoo.com/'
			,type: 'messaging'
		},
		{
			 id: 'voxer'
			,logo: 'voxer.png'
			,name: 'Voxer'
			,url: 'https://web.voxer.com/'
			,type: 'messaging'
		},
		{
			 id: 'dasher'
			,logo: 'dasher.png'
			,name: 'Dasher'
			,url: 'https://dasher.im/'
			,type: 'messaging'
		},
		{
			 id: 'flowdock'
			,logo: 'flowdock.png'
			,name: 'Flowdock'
			,url: 'https://www.flowdock.com/login'
			,type: 'messaging'
		},
		{
			 id: 'mattermost'
			,logo: 'mattermost.png'
			,name: 'Mattermost'
			,url: '___'
			,type: 'messaging'
		},
		{
			 id: 'dingtalk'
			,logo: 'dingtalk.png'
			,name: 'DingTalk'
			,url: 'https://im.dingtalk.com/'
			,type: 'messaging'
		},
		{
			 id: 'mysms'
			,logo: 'mysms.png'
			,name: 'mysms'
			,url: 'https://app.mysms.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unread"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].firstChild.innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'icq'
			,logo: 'icq.png'
			,name: 'ICQ'
			,url: 'https://web.icq.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){updateBadge(parseInt(document.getElementsByClassName("nwa-msg-counter")[0].style.display==="block"?document.getElementsByClassName("nwa-msg-counter")[0].innerHTML.trim():0))}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'tweetdeck'
			,logo: 'tweetdeck.png'
			,name: 'TweetDeck'
			,url: 'https://tweetdeck.twitter.com/'
			,type: 'messaging'
		},
		{
			 id: 'custom'
			,logo: 'custom.png'
			,name: '_Custom Service'
			,type: 'custom'
		},
		{
			 id: 'zinc'
			,logo: 'zinc.png'
			,name: 'Zinc'
			,url: 'https://zinc-app.com/'
			,type: 'messaging'
		}
	]
});
