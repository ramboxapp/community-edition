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
		}
	]
});
