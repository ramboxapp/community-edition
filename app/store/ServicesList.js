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
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,url: 'https://___.slack.com/'
		},
		{
			 id: 'noysi'
			,logo: 'noysi.png'
			,name: 'Noysi'
			,url: 'https://noysi.com/#/identity/sign-in'
		},
		{
			 id: 'messenger'
			,logo: 'messenger.png'
			,name: 'Messenger'
			,url: 'https://www.messenger.com/login/'
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,url: 'https://web.skype.com/'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,url: 'https://hangouts.google.com/'
		},
		{
			 id: 'hipchat'
			,logo: 'hipchat.png'
			,name: 'HipChat'
			,url: 'https://www.hipchat.com/sign_in/'
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,url: 'https://web.telegram.org/#/login'
		},
		{
			 id: 'wechat'
			,logo: 'wechat.png'
			,name: 'WeChat'
			,url: 'https://web.wechat.com/'
		},
		{
			 id: 'gmail'
			,logo: 'gmail.png'
			,name: 'Gmail'
			,url: 'https://mail.google.com/mail/'
		},
		{
			 id: 'inbox'
			,logo: 'inbox.png'
			,name: 'Inbox'
			,url: 'http://inbox.google.com/?cid=imp'
		},
		{
			 id: 'chatwork'
			,logo: 'chatwork.png'
			,name: 'ChatWork'
			,url: 'https://www.chatwork.com/login.php'
		},
		{
			 id: 'groupme'
			,logo: 'groupme.png'
			,name: 'GroupMe'
			,url: 'https://web.groupme.com/signin'
		},
		{
			 id: 'grape'
			,logo: 'grape.png'
			,name: 'Grape'
			,url: 'https://chatgrape.com/accounts/login/'
		},
		{
			 id: 'gitter'
			,logo: 'gitter.png'
			,name: 'Gitter'
			,url: 'https://gitter.im/login'
		},
		{
			 id: 'steam'
			,logo: 'steam.png'
			,name: 'Steam Chat'
			,url: 'https://steamcommunity.com/chat'
		},
		{
			 id: 'discord'
			,logo: 'discord.png'
			,name: 'Discord'
			,url: 'https://discordapp.com/login'
		}
	]
});
