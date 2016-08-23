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
			,description: 'WhatsApp is a cross-platform mobile messaging app for iPhone, BlackBerry, Android, Windows Phone and Nokia. Send text, video, images, audio for free.'
			,url: 'https://web.whatsapp.com/'
			,type: 'messaging'
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,description: 'Slack brings all your communication together in one place. It’s real-time messaging, archiving and search for modern teams.'
			,url: 'https://___.slack.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=0,b=0;$(".unread_msgs").each(function(){a+=parseInt($(this).html())}),$(".unread_highlights").each(function(){b+=parseInt($(this).html())}),updateBadge(a,b)}function updateBadge(a,b){var c=b>0?"("+b+") ":a>0?"(•) ":"";document.title=c.originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'noysi'
			,logo: 'noysi.png'
			,name: 'Noysi'
			,description: 'Noysi is a communication tool for teams where privacy is guaranteed. With Noysi you can access all your conversations and files in seconds from anywhere and unlimited.'
			,url: 'https://noysi.com/#/identity/sign-in'
			,type: 'messaging'
		},
		{
			 id: 'messenger'
			,logo: 'messenger.png'
			,name: 'Messenger'
			,description: 'Instantly reach the people in your life for free. Messenger is just like texting, but you don\'t have to pay for every message.'
			,url: 'https://www.messenger.com/login/'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside Messenger.'
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,description: 'Stay in touch with family and friends for free. Get international calling, free online calls and Skype for Business on desktop and mobile.'
			,url: 'https://web.skype.com/'
			,type: 'messaging'
			,note: 'Text and Audio calls are supported only. <a href="https://github.com/saenzramiro/rambox/wiki/Skype" target="_blank">Read more...</a>'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,description: 'Hangouts bring conversations to life with photos, emoji, and even group video calls for free. Connect with friends across computers, Android, and Apple devices.'
			,url: 'https://hangouts.google.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'hipchat'
			,logo: 'hipchat.png'
			,name: 'HipChat'
			,description: 'HipChat is hosted group chat and video chat built for teams. Supercharge real-time collaboration with persistent chat rooms, file sharing, and screen sharing.'
			,url: 'https://___.hipchat.com/chat'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("hc-badge"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,description: 'Telegram is a messaging app with a focus on speed and security. It’s super-fast, simple, secure and free.'
			,url: 'https://web.telegram.org/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("im_dialog_badge badge"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){document.title="("+e+") RamboxService"}setInterval(checkUnread,3000);'
		},
		{
			 id: 'wechat'
			,logo: 'wechat.png'
			,name: 'WeChat'
			,description: 'WeChat is a free messaging calling app that allows you to easily connect with family; friends across countries. It’s the all-in-one communications app for free text (SMS/MMS), voice; video calls, moments, photo sharing, and games.'
			,url: 'https://web.wechat.com/'
			,type: 'messaging'
		},
		{
			 id: 'gmail'
			,logo: 'gmail.png'
			,name: 'Gmail'
			,description: 'Gmail, Google\'s free email service, is one of the world\'s most popular email programs.'
			,url: 'https://mail.google.com/mail/'
			,type: 'email'
		},
		{
			 id: 'inbox'
			,logo: 'inbox.png'
			,name: 'Inbox'
			,description: 'Inbox by Gmail is a new app from the Gmail team. Inbox is an organized place to get things done and get back to what matters. Bundles keep emails organized.'
			,url: 'http://inbox.google.com/?cid=imp'
			,type: 'email'
			,js_unread: 'function checkUnread(){updateBadge(document.getElementsByClassName("qG").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'chatwork'
			,logo: 'chatwork.png'
			,name: 'ChatWork'
			,description: 'ChatWork is a group chat app for business. Secure messaging, video chat, task management and file sharing. Real-time communication and increase productivity for teams.'
			,url: 'https://www.chatwork.com/login.php'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside ChatWork.'
		},
		{
			 id: 'groupme'
			,logo: 'groupme.png'
			,name: 'GroupMe'
			,description: 'GroupMe brings group text messaging to every phone. Group message with the people in your life that are important to you.'
			,url: 'https://web.groupme.com/signin'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside GroupMe.'
		},
		{
			 id: 'grape'
			,logo: 'grape.png'
			,name: 'Grape'
			,description: 'The world\'s most advanced team chat meets enterprise search'
			,url: 'https://chatgrape.com/accounts/login/'
			,type: 'messaging'
		},
		{
			 id: 'gitter'
			,logo: 'gitter.png'
			,name: 'Gitter'
			,description: 'Gitter is built on top of GitHub and is tightly integrated with your organisations, repositories, issues and activity.'
			,url: 'https://gitter.im/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("room-item__unread-indicator"),t=0;for(i=0;i<e.length;i++)t+=isNaN(parseInt(e[i].innerHTML.trim())) ? 0 : parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'steam'
			,logo: 'steam.png'
			,name: 'Steam Chat'
			,description: 'Steam is a digital distribution platform developed by Valve Corporation offering digital rights management (DRM), multiplayer gaming and social networking services.'
			,url: 'https://steamcommunity.com/chat'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside Steam Chat.'
			,js_unread: 'CTitleManager.UpdateTitle = function(){};function checkUnread(){var e=document.getElementsByClassName("unread_message_count_value"),t=0;for(i=0;i<e.length;i++)t+=isNaN(parseInt(e[i].innerHTML.trim())) || e[i].parentNode.style.display === "none" ? 0 : parseInt(e[i].innerHTML.trim());updateBadge(t/2)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'discord'
			,logo: 'discord.png'
			,name: 'Discord'
			,description: 'Step up your game with a modern voice & text chat app. Crystal clear voice, multiple server and channel support, mobile apps, and more.'
			,url: 'https://discordapp.com/login'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside Discord.'
		},
		{
			 id: 'outlook'
			,logo: 'outlook.png'
			,name: 'Outlook'
			,description: 'Take control. Do more. Outlook is the free email and calendar service that helps you stay on top of what matters and get things done.'
			,url: 'https://mail.live.com/'
			,type: 'email'
		},
		{
			 id: 'outlook365'
			,logo: 'outlook365.png'
			,name: 'Outlook 365'
			,description: 'Outlook for Business'
			,url: 'https://outlook.office.com/owa/'
			,type: 'email'
		},
		{
			 id: 'yahoo'
			,logo: 'yahoo.png'
			,name: 'Yahoo! Mail'
			,description: 'Web-based email service offered by the American company Yahoo!. The service is free for personal use, and paid-for business email plans are available.'
			,url: 'https://mail.yahoo.com/'
			,type: 'email'
		},
		{
			 id: 'protonmail'
			,logo: 'protonmail.png'
			,name: 'ProtonMail'
			,description: 'Free and web-based encrypted email service founded in 2013 at the CERN research facility. ProtonMail is designed as a zero-knowledge system,[note 1] using client-side encryption to protect emails and user data before they are sent to ProtonMail servers, in contrast to other common webmail services such as Gmail and Hotmail.'
			,url: 'https://mail.protonmail.com/inbox'
			,type: 'email'
		},
		{
			 id: 'tutanota'
			,logo: 'tutanota.png'
			,name: 'Tutanota'
			,description: 'Tutanota is an open-source end-to-end encrypted email software and freemium hosted secure email service based on this software'
			,url: 'https://app.tutanota.de/'
			,type: 'email'
		},
		{
			 id: 'hushmail'
			,logo: 'hushmail.png'
			,name: 'Hushmail'
			,description: 'Web-based email service offering PGP-encrypted e-mail and vanity domain service. Hushmail offers "free" and "paid" versions of service. Hushmail uses OpenPGP standards and the source is available for download.'
			,url: 'https://www.hushmail.com/hushmail/index.php'
			,type: 'email'
		},
		{
			 id: 'missive'
			,logo: 'missive.png'
			,name: 'Missive'
			,description: 'Collaborative email and threaded group chat for productive teams. A single app for all your internal and external communication.'
			,url: 'https://mail.missiveapp.com/login'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unseen-count"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'rocketchat'
			,logo: 'rocketchat.png'
			,name: 'Rocket Chat'
			,description: 'From group messages and video calls all the way to helpdesk killer features our goal is to become the number one cross-platform open source chat solution.'
			,url: '___'
			,type: 'messaging'
			,note: 'You have to use this service by signing in with your email or username (No SSO allowed yet).'
		},
		{
			 id: 'wire'
			,logo: 'wire.png'
			,name: 'Wire'
			,description: 'HD quality calls, private and group chats with inline photos, music and video. Also available for your phone or tablet.'
			,url: 'https://app.wire.com/auth/#login'
			,type: 'messaging'
		},
		{
			 id: 'sync'
			,logo: 'sync.png'
			,name: 'Sync'
			,description: 'Sync is a business chat tool that will boost productivity for your team.'
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
			,description: 'Allows you to instant message with anyone on the Yahoo server. Tells you when you get mail, and gives stock quotes.'
			,url: 'https://messenger.yahoo.com/'
			,type: 'messaging'
		},
		{
			 id: 'voxer'
			,logo: 'voxer.png'
			,name: 'Voxer'
			,description: 'Voxer is a messaging app for your smartphone with live voice (like a PTT walkie talkie), text, photo and location sharing.'
			,url: 'https://web.voxer.com/'
			,type: 'messaging'
		},
		{
			 id: 'dasher'
			,logo: 'dasher.png'
			,name: 'Dasher'
			,description: 'Dasher lets you say what you really want with pics, GIFs, links and more. Take a poll to find out what your friends really think of your new boo.'
			,url: 'https://dasher.im/'
			,type: 'messaging'
		},
		{
			 id: 'flowdock'
			,logo: 'flowdock.png'
			,name: 'Flowdock'
			,description: 'Flowdock is your team\'s chat with a shared inbox. Teams using Flowdock stay up-to-date, react in seconds instead of days, and never forget anything'
			,url: 'https://www.flowdock.com/login'
			,type: 'messaging'
		},
		{
			 id: 'mattermost'
			,logo: 'mattermost.png'
			,name: 'Mattermost'
			,description: 'Mattermost is an open source, self-hosted Slack-alternative. As an alternative to proprietary SaaS messaging, Mattermost brings all your team communication into one place, making it searchable and accessible anywhere.'
			,url: '___'
			,type: 'messaging'
		},
		{
			 id: 'dingtalk'
			,logo: 'dingtalk.png'
			,name: 'DingTalk'
			,description: 'DingTalk is a multi-sided platform empowers small and medium-sized business to communicate effectively.'
			,url: 'https://im.dingtalk.com/'
			,type: 'messaging'
		},
		{
			 id: 'mysms'
			,logo: 'mysms.png'
			,name: 'mysms'
			,description: 'The mysms family of applications helps you text anywhere and enhances your messaging experience on your smartphone, tablet and computer.'
			,url: 'https://app.mysms.com/#login'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unread"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].firstChild.innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
			,note: 'You have to use this service by signing in with your mobile number.'
		},
		{
			 id: 'icq'
			,logo: 'icq.png'
			,name: 'ICQ'
			,description: 'ICQ is an open source instant messaging computer program that was first developed and popularized.'
			,url: 'https://web.icq.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){updateBadge(parseInt(document.getElementsByClassName("nwa-msg-counter")[0].style.display==="block"?document.getElementsByClassName("nwa-msg-counter")[0].innerHTML.trim():0))}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'tweetdeck'
			,logo: 'tweetdeck.png'
			,name: 'TweetDeck'
			,description: 'TweetDeck is a social media dashboard application for management of Twitter accounts.'
			,url: 'https://tweetdeck.twitter.com/'
			,type: 'messaging'
		},
		{
			 id: 'custom'
			,logo: 'custom.png'
			,name: '_Custom Service'
			,description: 'Add a custom service if is not listed above.'
			,type: 'custom'
		},
		{
			 id: 'zinc'
			,logo: 'zinc.png'
			,name: 'Zinc'
			,description: 'Zinc is a secure communication app for mobile workers, with text, voice, video, file sharing and more.'
			,url: 'https://zinc-app.com/'
			,type: 'messaging'
		},
		{
			 id: 'freenode'
			,logo: 'freenode.png'
			,name: 'FreeNode'
			,description: 'Freenode, formerly known as Open Projects Network, is an IRC network used to discuss peer-directed projects.'
			,url: 'https://webchat.freenode.net/'
			,type: 'messaging'
		},
		{
			 id: 'mightytext'
			,logo: 'mightytext.png'
			,name: 'Mighty Text'
			,description: 'Text from your computer, sync\'d with your Android phone & number.'
			,url: 'https://mightytext.net/web/'
			,type: 'messaging'
		},
		{
			 id: 'roundcube'
			,logo: 'roundcube.png'
			,name: 'Roundcube'
			,description: 'Free and open source webmail software for the masses, written in PHP.'
			,url: '___'
			,type: 'email'
		},
		{
			 id: 'horde'
			,logo: 'horde.png'
			,name: 'Horde'
			,description: 'Horde is a free and open source web-based groupware.'
			,url: '___'
			,type: 'email'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("count"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.match(/\d+/g));updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
			,note: 'To enable desktop notifications and automatic mail check, you have to go to Options inside Horde.'
		},
		{
			 id: 'squirrelmail'
			,logo: 'squirrelmail.png'
			,name: 'SquirrelMail'
			,description: 'SquirrelMail is a standards-based webmail package written in PHP.'
			,url: '___'
			,type: 'email'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("leftunseen"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML);updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'zohoemail'
			,logo: 'zohoemail.png'
			,name: 'Zoho Email'
			,description: 'Ad-free business Email Hosting with a clean, minimalist interface. Integrated Calendar, Contacts, Notes, Tasks apps.'
			,url: 'https://mail.zoho.com/'
			,type: 'email'
		},
		{
			 id: 'zohochat'
			,logo: 'zohochat.png'
			,name: 'Zoho Chat'
			,description: 'Zoho chat is a secure and scalable real-time communication and collaboration platform for teams to improve their productivity.'
			,url: 'https://chat.zoho.com/'
			,type: 'messaging'
			,js_unread: 'NotifyByTitle.show = function(){};NotifyByTitle.start = function(){};NotifyByTitle.stop = function(){};function checkUnread(){var t=0;$(".msgnotify").each(function() { t += isNaN(parseInt($(this).html())) ? 0 : parseInt(parseInt($(this).html())) });updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'aol'
			,logo: 'aol.png'
			,name: 'Aol'
			,description: 'Free and simple (old) webmail service.'
			,url: 'https://mail.aol.com/'
			,type: 'email'
		},
		{
			 id: 'glip'
			,logo: 'glip.png'
			,name: 'Glip'
			,description: 'Glip is fully searchable, real-time group chat & video chat, task management, file sharing, calendars and more.'
			,url: 'https://glip.com/'
			,type: 'messaging'
			,js_unread: 'function simulateClick(a){var b,c=document.getElementById(a);document.createEvent&&(b=document.createEvent("MouseEvents"),b.initMouseEvent("click",!0,!0,window,0,0,0,0,0,!1,!1,!1,!1,0,null)),b?c.dispatchEvent(b):c.click&&c.click()}setTimeout(function(){simulateClick("sign_in")},1e3);'
		},
		{
			 id: 'yandex'
			,logo: 'yandex.png'
			,name: 'Yandex'
			,description: 'Yandex is a free webmail service with unlimited mail storage, protection from viruses and spam, access from web interface, etc.'
			,url: 'https://passport.yandex.com/'
			,type: 'email'
		},
		{
			 id:' irccloud'
			,logo: 'irccloud.png'
			,name: 'IRCCloud'
			,description: 'IRCCloud is a modern IRC client that keeps you connected, with none of the baggage.'
			,url: 'https://www.irccloud.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var t=0;[].map.call(document.querySelectorAll(".bufferBadges > .badge"),n=>n.textContent?parseInt(n.textContent,10):0).reduce((x,y)=>x+y,0);updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		}
	]
});
