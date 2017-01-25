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
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("infinite-list-item"),b=0;for(i=0;i<a.length;i++)if(!(a[i].getElementsByClassName("icon-muted").length>0||0===a[i].getElementsByClassName("unread-count").length)){var c=parseInt(a[i].getElementsByClassName("unread-count")[0].innerHTML.trim());b+=isNaN(c)?0:c}updateBadge(b)}function updateBadge(a){a>=1?rambox.setUnreadCount(a):rambox.clearUnreadCount()}var originalTitle=document.title;setInterval(checkUnread,1e3);'
			,dont_update_unread_from_title: true
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,description: 'Slack brings all your communication together in one place. It’s real-time messaging, archiving and search for modern teams.'
			,url: 'https://___.slack.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=0,b=0;$(".unread_msgs").each(function(){a+=isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())}),$(".unread_highlights").each(function(){b+=isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())}),updateBadge(a,b)}function updateBadge(a,b){var c=b>0?"("+b+") ":a>0?"(•) ":"";document.title=c+originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
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
			,titleBlink: true
			,note: 'To enable desktop notifications, you have to go to Options inside Messenger.'
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,description: 'Stay in touch with family and friends for free. Get international calling, free online calls and Skype for Business on desktop and mobile.'
			,url: 'https://web.skype.com/'
			,type: 'messaging'
			,userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586'
			,note: 'Text and Audio calls are supported only. <a href="https://github.com/saenzramiro/rambox/wiki/Skype" target="_blank">Read more...</a>'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,description: 'Hangouts bring conversations to life with photos, emoji, and even group video calls for free. Connect with friends across computers, Android, and Apple devices.'
			,url: 'https://hangouts.google.com/'
			,type: 'messaging'
			,titleBlink: true
			,manual_notifications: true
			,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?rambox.setUnreadCount(e):rambox.clearUnreadCount()}setInterval(checkUnread,3000);'
			//,js_unread: 'function checkUnread(){updateBadge(document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'hipchat'
			,logo: 'hipchat.png'
			,name: 'HipChat'
			,description: 'HipChat is hosted group chat and video chat built for teams. Supercharge real-time collaboration with persistent chat rooms, file sharing, and screen sharing.'
			,url: 'https://___.hipchat.com/chat'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("hc-badge"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
			,custom_domain: true
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,description: 'Telegram is a messaging app with a focus on speed and security. It’s super-fast, simple, secure and free.'
			,url: 'https://web.telegram.org/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("im_dialog_badge badge"),t=0;for(i=0;i<e.length;i++)if(!e[i].classList.contains("im_dialog_badge_muted")){t+=parseInt(e[i].innerHTML.trim())}updateBadge(t)}function updateBadge(e){e>=1?rambox.setUnreadCount(e):rambox.clearUnreadCount()}setInterval(checkUnread,3000);'
			,dont_update_unread_from_title: true
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
			,allow_popups: true
			,js_unread: 'Object.defineProperty(document,"title",{configurable:!0,set:function(a){var b=document.getElementsByClassName("aim")[0];t=0,b.textContent.indexOf("(")!=-1&&(t=parseInt(b.textContent.replace(/[^0-9]/g,""))),document.getElementsByTagName("title")[0].innerHTML="("+t+") Gmail"},get:function(){return document.getElementsByTagName("title")[0].innerHTML}});'
			,note: 'To enable desktop notifications, you have to go to Settings inside Gmail. <a href="https://support.google.com/mail/answer/1075549?ref_topic=3394466" target="_blank">Read more...</a>'
		},
		{
			 id: 'inbox'
			,logo: 'inbox.png'
			,name: 'Inbox'
			,description: 'Inbox by Gmail is a new app from the Gmail team. Inbox is an organized place to get things done and get back to what matters. Bundles keep emails organized.'
			,url: 'http://inbox.google.com/?cid=imp'
			,type: 'email'
			,manual_notifications: true
			,js_unread: 'function checkUnread(){updateBadge(document.getElementsByClassName("ss").length)}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
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
			,note: 'To enable desktop notifications, you have to go to Options inside GroupMe. To count unread messages, be sure to be in Chats.'
			,js_unread: 'function checkUnread(){var a=document.querySelectorAll(".badge-count"),b=0;for(i=0;i<a.length;i++)b+=parseInt(a[i].innerHTML.trim());updateBadge(b)}function updateBadge(a){a>=1?rambox.setUnreadCount(a):rambox.clearUnreadCount()}setInterval(checkUnread,3e3);'
			,dont_update_unread_from_title: true
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
			,titleBlink: true
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("guild unread").length,b=0,c=document.getElementsByClassName("badge");for(i=0;i<c.length;i++)b+=parseInt(c[i].innerHTML.trim());updateBadge(a,b)}function updateBadge(a,b){var c=b>0?"("+b+") ":a>0?"(•) ":"";document.title=c+originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
			,note: 'To enable desktop notifications, you have to go to Options inside Discord.'
		},
		{
			 id: 'outlook'
			,logo: 'outlook.png'
			,name: 'Outlook'
			,description: 'Take control. Do more. Outlook is the free email and calendar service that helps you stay on top of what matters and get things done.'
			,url: 'https://mail.live.com/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: 'function checkUnread(){var a=$(".subfolders [role=treeitem]:first .treeNodeRowElement").siblings().last().text();updateBadge(""===a?0:parseInt(a))}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
		},
		{
			 id: 'outlook365'
			,logo: 'outlook365.png'
			,name: 'Outlook 365'
			,description: 'Outlook for Business'
			,url: 'https://outlook.office.com/owa/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: 'function checkUnread(){var a=$(".subfolders [role=treeitem]:first .treeNodeRowElement").siblings().last().text();updateBadge(""===a?0:parseInt(a))}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
		},
		{
			 id: 'yahoo'
			,logo: 'yahoo.png'
			,name: 'Yahoo! Mail'
			,description: 'Web-based email service offered by the American company Yahoo!. The service is free for personal use, and paid-for business email plans are available.'
			,url: 'https://mail.yahoo.com/'
			,type: 'email'
			,note: 'To enable desktop notifications, you have to go to Options inside Yahoo! Mail.'
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
			,url: 'https://app.wire.com/'
			,type: 'messaging'
			,userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
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
			,js_unread: 'function checkUnread(){updateBadge(document.getElementsByClassName("list-item-unread-indicator").length)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
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
			,js_unread: 'Object.defineProperty(document,"title",{configurable:!0,set:function(a){document.getElementsByTagName("title")[0].innerHTML=a[0]==="*"?"(•) Mattermost":a},get:function(){return document.getElementsByTagName("title")[0].innerHTML}});'
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
			,js_unread: 'function checkUnread(){var e=document.getElementsByClassName("unread"),t=0;for(i=0;i<e.length;i++)t+=parseInt(e[i].firstChild.innerHTML.trim());updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}"https://app.mysms.com/#login"===document.baseURI&&(document.getElementsByClassName("innerPanel")[0].rows[0].style.display="none",document.getElementsByClassName("innerPanel")[0].rows[1].cells[0].firstElementChild.style.display="none",document.getElementsByClassName("msisdnLoginPanel")[0].style.display="inline");var originalTitle=document.title;setInterval(checkUnread,3000);'
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
			,url: '___'
			,type: 'custom'
			,allow_popups: true
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
			,js_unread: 'zmail.aInfo[zmail.accId].mailId = "a";'
			,note: 'To enable desktop notifications, you have to go to Settings inside Zoho Email.'
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
			,note: 'To enable desktop notifications, you have to go to Options inside Glip.'
		},
		{
			 id: 'yandex'
			,logo: 'yandex.png'
			,name: 'Yandex Mail'
			,description: 'Yandex is a free webmail service with unlimited mail storage, protection from viruses and spam, access from web interface, etc.'
			,url: 'https://mail.yandex.com/'
			,type: 'email'
			,js_unread: 'function checkUnread(){var t=parseInt($(".mail-MessagesFilters-Item_unread .mail-LabelList-Item_count").html());updateBadge(isNaN(t)?0:t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
		},
		{
			 id: 'irccloud'
			,logo: 'irccloud.png'
			,name: 'IRCCloud'
			,description: 'IRCCloud is a modern IRC client that keeps you connected, with none of the baggage.'
			,url: 'https://www.irccloud.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var t=0;[].map.call(document.querySelectorAll(".bufferBadges > .badge"),n=>n.textContent?parseInt(n.textContent,10):0).reduce((x,y)=>x+y,0);updateBadge(t)}function updateBadge(e){e>=1?document.title="("+e+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3000);'
			,custom_domain: true
		},
		{
			 id: 'ryver'
			,logo: 'ryver.png'
			,name: 'Ryver'
			,description: 'Ryver is a team communication tool that organizes team collaboration, chats, files, and even emails into a single location, for any size team, for FREE.'
			,url: 'https://___.ryver.com/'
			,type: 'messaging'
		},
		{
			 id: 'aim'
			,logo: 'aim.png'
			,name: 'Aim'
			,description: 'Aim offers free Text Messaging, Group Conversations, Media Sharing, Social Notifications, and more.'
			,url: 'http://aim.com/'
			,type: 'messaging'
		},
		{
			 id: 'kiwi'
			,logo: 'kiwi.png'
			,name: 'Kiwi IRC'
			,description: 'KiwiIRC makes Web IRC easy. A hand-crafted IRC client that you can enjoy. Designed to be used easily and freely.'
			,url: 'https://kiwiirc.com/client'
			,type: 'messaging'
			,js_unread: 'function getUnreadCount(){var a=0;$(".activity").each(function(){a+=parseInt($(this).html())});var b=!1;return $(".panel[style*=\'display:block\'] .msg").each(function(){b?a++:$(this).hasClass("last_seen")&&(b=!0)}),a}function updateTitle(a){count=getUnreadCount(),cleanTitle=a.match(re),null!==cleanTitle&&cleanTitle.length>1?cleanTitle=cleanTitle[1]:cleanTitle=a,a=count>0?"("+getUnreadCount()+") "+cleanTitle:cleanTitle,$("title").text(a)}var re=/\(\d+\)[ ](.*)/;Object.defineProperty(document,"title",{configurable:!0,set:function(a){updateTitle(a)},get:function(){return $("title").text()}}),setInterval(function(){updateTitle(document.title)},3e3);'
			,custom_domain: true
		},
		{
			 id: 'icloud'
			,logo: 'icloud.png'
			,name: 'iCloud Mail'
			,description: 'iCloud makes sure you always have the latest versions of your most important things — documents, photos, notes, contacts, and more — on all your devices. It can even help you locate a missing iPhone, iPad, iPod touch or Mac.'
			,url: 'https://www.icloud.com/#mail'
			,type: 'email'
			,js_unread: 'Object.defineProperty(document,"title",{configurable:!0,set:function(a){var t  = document.getElementsByName("mail")[0].contentWindow.document.body.getElementsByClassName("count digit");t = t.length===1?t[0].innerHTML:0;document.getElementsByTagName("title")[0].innerHTML="("+t+") iCloud Mail"},get:function(){return document.getElementsByTagName("title")[0].innerHTML}});'
		},
		{
			 id: 'rainloop'
			,logo: 'rainloop.png'
			,name: 'RainLoop'
			,description: 'RainLoop Webmail - Simple, modern & fast web-based email client.'
			,url: '___'
			,type: 'email'
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("badge pull-right count"),b=0;for(i=0;i<a.length;i++)parseInt(a[i].textContent.trim())%1===0&&(b+=parseInt(a[i].textContent.trim()));updateBadge(b)}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,1e3);'
		},
		{
			 id: 'amium'
			,logo: 'amium.png'
			,name: 'Amium'
			,description: 'Amium turns any file into a real-time activity feed and conversation. So you can work better, together.'
			,url: 'https://___.amium.com/'
			,type: 'messaging'
		},
		{
			 id: 'hootsuite'
			,logo: 'hootsuite.png'
			,name: 'Hootsuite'
			,description: 'Enhance your social media management with Hootsuite, the leading social media dashboard. Manage multiple networks and profiles and measure your campaign results.'
			,url: 'https://hootsuite.com/dashboard'
			,type: 'messaging'
		},
		{
			 id: 'zimbra'
			,logo: 'zimbra.png'
			,name: 'Zimbra'
			,description: 'Over 500 million people rely on Zimbra and enjoy enterprise-class open source email collaboration at the lowest TCO in the industry. Discover the benefits!'
			,url: '___'
			,type: 'email'
			,js_unread: 'function check_unread(){update_badge(appCtxt.getById(ZmFolder.ID_INBOX).numUnread)}function update_badge(a){document.title=a>0?"("+a+") "+original_title:original_title}const original_title=document.title;setInterval(check_unread,3e3);'
		},
		{
			 id: 'kaiwa'
			,logo: 'kaiwa.png'
			,name: 'Kaiwa'
			,description: 'A modern and Open Source Web client for XMPP.'
			,url: '___'
			,type: 'messaging'
			,js_unread: 'function check_unread() { let count=0; for (let node of document.getElementsByClassName("unread")){ if (node.innerHTML){ count += parseInt(node.innerHTML); } } update_badge(count);}function update_badge(a) { document.title = a > 0 ? "(" + a + ") " + original_title : original_title}const original_title = document.title;setInterval(check_unread, 3e3);'
		},
		{
			 id: 'movim'
			,logo: 'movim.png'
			,name: 'Movim'
			,description: 'Movim is a decentralized social network, written in PHP and HTML5 and based on the XMPP standard protocol.'
			,url: 'https://___.movim.eu/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("color dark"),b=0;for(i=0;i<a.length;i++){var c=a[i].getElementsByClassName("counter");for(ii=0;ii<c.length;ii++)parseInt(c[ii].textContent.trim())%1===0&&(b+=parseInt(c[ii].textContent.trim()))}updateBadge(b)}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,3e3);'
			,custom_domain: true
		},
		{
			 id: 'pushbullet'
			,logo: 'pushbullet.png'
			,name: 'Pushbullet'
			,description: 'Pushbullet connects your devices, making them feel like one.'
			,url: 'https://www.pushbullet.com/'
			,type: 'messaging'
		},
		{
			 id: 'riot'
			,logo: 'riot.png'
			,name: 'Riot'
			,description: 'Riot is a simple and elegant collaboration environment that gathers all of your different conversations and app integrations into one single app.'
			,url: 'https://riot.im/app/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("mx_RoomTile_nameContainer"),b=0;for(i=0;i<a.length;i++){var c=a[i].getElementsByClassName("mx_RoomTile_badge");for(ii=0;ii<c.length;ii++)parseInt(c[ii].textContent.trim())%1===0&&(b+=parseInt(c[ii].textContent.trim()))}updateBadge(b)}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,1e3);'
			,custom_domain: true
		},
		{
			 id: 'actor'
			,logo: 'actor.png'
			,name: 'Actor'
			,description: 'Free and Secure text, photo and voice messages over 2G/3G or Wi-Fi.'
			,url: 'https://app.actor.im/'
			,type: 'messaging'
		},
		{
			 id: 'socialcast'
			,logo: 'socialcast.png'
			,name: 'Socialcast'
			,description: 'Socialcast is the premier enterprise social networking platform that connects people to the knowledge, ideas and resources they need to work more effectively.'
			,url: 'https://___.socialcast.com/'
			,type: 'messaging'
		},
		{
			 id: 'fleep'
			,logo: 'fleep.png'
			,name: 'Fleep'
			,description: 'Fleep enables communication within and across organizations - be it your team chats, project communication or 1:1 conversations.'
			,url: 'https://fleep.io/chat'
			,type: 'messaging'
			,js_unread: 'document.getElementsByClassName("google-login-area")[0].remove();document.getElementsByClassName("microsoft-login-area")[0].remove();'
		},
		{
			 id: 'spark'
			,logo: 'spark.png'
			,name: 'Cisco Spark'
			,description: 'Cisco Spark is for group chat, video calling, and sharing documents with your team. It’s all backed by Cisco security and reliability.'
			,url: 'https://web.ciscospark.com/'
			,type: 'messaging'
		},
		{
			 id: 'mmmelon'
			,logo: 'mmmelon.png'
			,name: 'mmmelon'
			,description: 'The ultimate tool for daily management of projects and teams. Cloud-based, web and mobile.'
			,url: '___'
			,type: 'messaging'
		},
		{
			 id: 'drift'
			,logo: 'drift.png'
			,name: 'Drift'
			,description: 'Drift is a messaging app that makes it easy for businesses to talk to their website visitors and customers in real-time, from anywhere.'
			,url: 'https://app.drift.com/'
			,type: 'messaging'
		},
		{
			 id: 'typetalk'
			,logo: 'typetalk.png'
			,name: 'Typetalk'
			,description: 'Typetalk brings fun and ease to team discussions through instant messaging on desktop and mobile devices.'
			,url: 'https://typetalk.in/signin'
			,type: 'messaging'
		},
		{
			 id: 'openmailbox'
			,logo: 'openmailbox.png'
			,name: 'Openmailbox'
			,description: 'Free mail hosting. Respect your rights and your privacy.'
			,url: 'https://www.openmailbox.org/webmail/'
			,type: 'email'
		},
		{
			 id: 'flock'
			,logo: 'flock.png'
			,name: 'Flock'
			,description: 'Flock is a free enterprise tool for business communication. Packed with tons of productivity features, Flock drives efficiency and boosts speed of execution.'
			,url: 'https://web.flock.co/'
			,type: 'messaging'
		},
		{
			 id: 'crisp'
			,logo: 'crisp.png'
			,name: 'Crisp'
			,description: 'Connect your customers to your team.'
			,url: 'https://app.crisp.im/inbox'
			,type: 'messaging'
		},
		{
			 id: 'smooch'
			,logo: 'smooch.png'
			,name: 'Smooch'
			,description: 'Unified multi-channel messaging for businesses, bots and software makers.'
			,url: 'https://app.smooch.io/'
			,type: 'messaging'
		},
		{
			 id: 'xing'
			,logo: 'xing.png'
			,name: 'XING'
			,description: 'Career-oriented social networking'
			,url: 'https://www.xing.com/messages/conversations'
			,type: 'messaging'
			,js_unread: '(function() { let originalTitle = document.title; function checkUnread() { let count = null; let notificationElement = document.querySelector(\'[data-update="unread_conversations"]\'); if (notificationElement && notificationElement.style.display !== \'none\') { count = parseInt(notificationElement.textContent.trim(), 10); } updateBadge(count); } function updateBadge(count) { if (count && count >= 1) { rambox.setUnreadCount(count); } else { rambox.clearUnreadCount(); } } setInterval(checkUnread, 3000); checkUnread(); })();'
			,dont_update_unread_from_title: true
		},
		{
			 id: 'workplace'
			,logo: 'workplace.png'
			,name: 'Workplace'
			,description: 'Connect everyone in your company and turn ideas into action. Through group discussion, a personalised News Feed, and voice and video calling, work together and get more done. Workplace is an ad-free space, separate from your personal Facebook account.'
			,url: 'https://___.facebook.com/'
			,type: 'messaging'
		},
		{
			 id: 'teams'
			,logo: 'teams.png'
			,name: 'Teams'
			,description: 'Microsoft Teams is the chat-based workspace in Office 365 that integrates all the people, content, and tools your team needs to be more engaged and effective.'
			,url: 'https://teams.microsoft.com'
			,type: 'messaging'
		},
		{
			 id: 'kezmo'
			,logo: 'kezmo.png'
			,name: 'Kezmo'
			,description: 'Kezmo is an enterprise chat and collaboration tool to help teams get things done. It’s an email alternative for secure team communication.'
			,url: 'https://app.kezmo.com/web/'
			,type: 'messaging'
		},
		{
			 id: 'lounge'
			,logo: 'lounge.png'
			,name: 'The Lounge'
			,description: 'Self-hosted web IRC client.'
			,url: '___'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("badge highlight"),b=0;for(i=0;i<a.length;i++)parseInt(a[i].textContent.trim())%1===0&&(b+=parseInt(a[i].textContent.trim()));updateBadge(b)}function updateBadge(a){a>=1?document.title="("+a+") "+originalTitle:document.title=originalTitle}var originalTitle=document.title;setInterval(checkUnread,1e3);'
		},
		{
			 id: 'linkedin'
			,logo: 'linkedin.png'
			,name: 'LinkedIn Messaging'
			,description: 'Manage your professional identity. Build and engage with your professional network. Access knowledge, insights and opportunities.'
			,url: 'https://www.linkedin.com/messaging'
			,type: 'messaging'
		},
		{
			 id: 'zyptonite'
			,logo: 'zyptonite.png'
			,name: 'Zyptonite'
			,description: 'Zyptonite is the ultimate cyber secure communication tool for enterprise customers designed to address the need to securely communicate via voice, video, and chat, and transfer files and information across a global mobile workforce.'
			,url: 'https://app.zyptonite.com/'
			,type: 'messaging'
			,js_unread: 'function checkUnread(){var a=document.getElementsByClassName("z-messages"),b=0;for(i=0;i<a.length;i++)b+=parseInt(a[i].innerHTML.trim());updateBadge(b)}function updateBadge(a){a>=1?rambox.setUnreadCount(a):rambox.clearUnreadCount()}setInterval(checkUnread,3e3);'
			,dont_update_unread_from_title: true
		}
  ]
});
