Ext.define('Hamsket.store.ServicesList', {
	 extend: 'Ext.data.Store'
	,alias: 'store.serviceslist'

	,requires: [
		'Ext.data.proxy.LocalStorage'
	]

	,model: 'Hamsket.model.ServiceList'

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
			,description: locale['services[0]']
			,url: 'https://web.whatsapp.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const elements=document.querySelectorAll("#pane-side .P6z4j, .unread");let count=0;for(const i of elements){const gp=i.parentNode.parentNode;0===gp.querySelectorAll('#pane-side *[data-icon="muted"]').length&&count++}hamsket.updateBadge(count)};setInterval(checkUnread,1e3);let unregister_queue=[];navigator.serviceWorker.getRegistrations().then(registrations=>{for(const registration of registrations)unregister_queue.push(registration.unregister());return unregister_queue}).then(queue=>{}).catch(err=>{});`
		},
		{
			 id: 'slack'
			,logo: 'slack.png'
			,name: 'Slack'
			,description: locale['services[1]']
			,url: 'https://___.slack.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const indirectSelector=".p-channel_sidebar__channel--unread:not(.p-channel_sidebar__channel--muted)",indirect=document.querySelectorAll(indirectSelector).length;let direct=0;const badges=document.querySelectorAll(indirectSelector+" > .p-channel_sidebar__badge");for(const badge of badges){const i=parseInt(badge.innerHTML);direct+=isNaN(i)?0:i}hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'noysi'
			,logo: 'noysi.png'
			,name: 'Noysi'
			,description: locale['services[2]']
			,url: 'https://noysi.com/#/identity/sign-in'
			,type: 'messaging'
		},
		{
			 id: 'messenger'
			,logo: 'messenger.png'
			,name: 'Messenger'
			,description: locale['services[3]']
			,url: 'https://www.messenger.com/'
			,type: 'messaging'
			,titleBlink: true
			,note: 'To enable desktop notifications, you have to go to Options inside Messenger.'
		},
		{
			 id: 'skype'
			,logo: 'skype.png'
			,name: 'Skype'
			,description: locale['services[4]']
			,url: 'https://web.skype.com/'
			,type: 'messaging'
			,note: 'Text and Audio calls are supported only. <a href="https://github.com/TheGoddessInari/hamsket/wiki/Skype" target="_blank">Read more...</a>'
		},
		{
			 id: 'hangouts'
			,logo: 'hangouts.png'
			,name: 'Hangouts'
			,description: locale['services[5]']
			,url: 'https://hangouts.google.com/'
			,type: 'messaging'
			,titleBlink: true
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{let myframe=document.getElementById("hangout-landing-chat").lastChild,mydocument=myframe.contentDocument||myframe.contentWindow.document;hamsket.updateBadge(mydocument.body.getElementsByClassName("ee").length)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'hipchat'
			,logo: 'hipchat.png'
			,name: 'HipChat'
			,description: locale['services[6]']
			,url: 'https://___.hipchat.com/chat'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("hc-badge");let t=0;for(let i of e)t+=parseInt(i.innerHTML.trim());hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		{
			 id: 'telegram'
			,logo: 'telegram.png'
			,name: 'Telegram'
			,description: locale['services[7]']
			,url: 'https://web.telegram.org/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("im_dialog_badge badge");let t=0;for(let i of e)i.classList.contains("im_dialog_badge_muted")||(t+=parseInt(i.innerHTML.trim()));hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'wechat'
			,logo: 'wechat.png'
			,name: 'WeChat'
			,description: locale['services[8]']
			,url: 'https://web.wechat.com/'
			,type: 'messaging'
		},
		{
			 id: 'gmail'
			,logo: 'gmail.png'
			,name: 'Gmail'
			,description: locale['services[9]']
			,url: 'https://mail.google.com/mail/?labs=0'
			,type: 'email'
			,allow_popups: true
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("aim")[0].textContent.split(":");hamsket.updateBadge(parseInt(a[a.length-1].replace(/[^0-9]/g,"")))};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications, you have to go to Settings inside Gmail. <a href="https://support.google.com/mail/answer/1075549?ref_topic=3394466" target="_blank">Read more...</a>'
		},
		{
			 id: 'inbox'
			,logo: 'inbox.png'
			,name: 'Inbox'
			,description: locale['services[10]']
			,url: 'https://inbox.google.com/?cid=imp'
			,type: 'email'
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{if(getComputedStyle(document.getElementsByClassName("sM")[0])["font-weight"] == "bold"){hamsket.updateBadge(document.getElementsByClassName("ss").length)}};setInterval(checkUnread,3e3);`
			,note: 'Please be sure to sign out of Hangouts inside Inbox, as it causes problems. <a href="https://github.com/TheGoddessInari/hamsket/wiki/Inbox" target="_blank">Read more...</a>'
		},
		{
			 id: 'chatwork'
			,logo: 'chatwork.png'
			,name: 'ChatWork'
			,description: locale['services[11]']
			,url: 'https://www.chatwork.com/login.php'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside ChatWork.'
		},
		{
			 id: 'groupme'
			,logo: 'groupme.png'
			,name: 'GroupMe'
			,description: locale['services[12]']
			,url: 'https://web.groupme.com/signin'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside GroupMe. To count unread messages, be sure to be in Chats.'
			,js_unread: `let checkUnread=()=>{const a=document.querySelectorAll(".badge-count:not(.ng-hide)");let b=0;for(let i of a)b+=parseInt(i.innerHTML.trim());hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'grape'
			,logo: 'grape.png'
			,name: 'Grape'
			,description: locale['services[13]']
			,url: 'https://chatgrape.com/accounts/login/'
			,type: 'messaging'
		},
		{
			 id: 'gitter'
			,logo: 'gitter.png'
			,name: 'Gitter'
			,description: locale['services[14]']
			,url: 'https://gitter.im/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unread-indicator");let c=0;for(let i of e)c+=parseInt(i.innerHTML.trim(),10)||0;hamsket.updateBadge(c)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'steam'
			,logo: 'steam.png'
			,name: 'Steam Chat'
			,description: locale['services[15]']
			,url: 'https://steamcommunity.com/chat'
			,type: 'messaging'
			,note: 'To enable desktop notifications, you have to go to Options inside Steam Chat.'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("FriendMessageCount");let t=0;for(let i of e){const iTrim=parseInt(i.innerHTML.trim());t+=isNaN(iTrim)||"none"===i.parentNode.style.display?0:iTrim}hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'discord'
			,logo: 'discord.png'
			,name: 'Discord'
			,description: locale['services[16]']
			,url: 'https://discordapp.com/login'
			,type: 'messaging'
			,titleBlink: true
			,js_unread: `let getMentionCount=badges=>{let alerts=0;for(const badge of badges)alerts+=parseInt(badge.innerText,10)||0;return alerts},getServerUnread=badges=>{let alerts=0;for(const badge of badges)alerts+="1"===badge.style.opacity&&"8px"===badge.style.height?1:0;return alerts},checkUnread=()=>{const mentions=document.querySelectorAll(".lowerBadge-29hYVK > .numberBadge-2s8kKX");unread=document.getElementsByClassName("item-2hkk8m");const direct=getMentionCount(mentions);let indirect=getServerUnread(unread);indirect+=document.getElementsByClassName("unread-3zKkbm").length,hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications, you have to go to Options inside Discord.'
		},
		{
			 id: 'outlook'
			,logo: 'outlook.png'
			,name: 'Outlook'
			,description: locale['services[17]']
			,url: 'https://mail.live.com/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{const fav=$(".ms-FocusZone [role=tree]:first i[data-icon-name=Inbox]").siblings()[1],folders=$(".ms-FocusZone [role=tree]:nth(1)")[0].children[1].querySelector("span span"),innerText=fav?fav.innerText:folders?folders.innerText:0,i=parseInt(innerText,10)||0;hamsket.updateBadge(i)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'outlook365'
			,logo: 'outlook365.png'
			,name: 'Outlook 365'
			,description: locale['services[18]']
			,url: 'https://outlook.office.com/owa/'
			,type: 'email'
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{const fav=$(".ms-FocusZone [role=tree]:first i[data-icon-name=Inbox]").siblings()[1],folders=$(".ms-FocusZone [role=tree]:nth(1)")[0].children[1].querySelector("span span"),innerText=fav?fav.innerText:folders?folders.innerText:0,i=parseInt(innerText,10)||0;hamsket.updateBadge(i)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'yahoo'
			,logo: 'yahoo.png'
			,name: 'Yahoo! Mail'
			,description: locale['services[19]']
			,url: 'https://mail.yahoo.com/'
			,type: 'email'
			,note: 'To enable desktop notifications, you have to go to Options inside Yahoo! Mail.'
		},
		{
			 id: 'protonmail'
			,logo: 'protonmail.png'
			,name: 'ProtonMail'
			,description: locale['services[20]']
			,url: 'https://mail.protonmail.com/inbox'
			,type: 'email'
		},
		{
			 id: 'protonmailch'
			,logo: 'protonmail.png'
			,name: 'ProtonMail CH'
			,description: locale['services[20]']
			,url: 'https://app.protonmail.ch/inbox'
			,type: 'email'
			,note: 'Read <a href="https://protonmail.com/support/knowledge-base/what-is-the-difference-between-protonmail-com-and-protonmail-ch/" target="_blank">HERE</a> to see the differences between protonmail.com and protonmail.ch.'
		},
		{
			 id: 'tutanota'
			,logo: 'tutanota.png'
			,name: 'Tutanota'
			,description: locale['services[21]']
			,url: 'https://mail.tutanota.com/'
			,type: 'email'
		},
		{
			 id: 'hushmail'
			,logo: 'hushmail.png'
			,name: 'Hushmail'
			,description: locale['services[22]']
			,url: 'https://www.hushmail.com/hushmail/index.php'
			,type: 'email'
		},
		{
			 id: 'missive'
			,logo: 'missive.png'
			,name: 'Missive'
			,description: locale['services[23]']
			,url: 'https://mail.missiveapp.com/login'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unseen-count");let t=0;for(let i of e)t+=parseInt(i.innerHTML.trim());hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'rocketchat'
			,logo: 'rocketchat.png'
			,name: 'Rocket Chat'
			,description: locale['services[24]']
			,url: '___'
			,type: 'messaging'
			,note: 'You have to use this service by signing in with your email or username (No SSO allowed yet).'
		},
		{
			 id: 'wire'
			,logo: 'wire.png'
			,name: 'Wire'
			,description: locale['services[25]']
			,url: 'https://app.wire.com/'
			,type: 'messaging'
		},
		{
			 id: 'sync'
			,logo: 'sync.png'
			,name: 'Sync'
			,description: locale['services[26]']
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
			 id: 'voxer'
			,logo: 'voxer.png'
			,name: 'Voxer'
			,description: locale['services[29]']
			,url: 'https://web.voxer.com/'
			,type: 'messaging'
		},
		{
			 id: 'dasher'
			,logo: 'dasher.png'
			,name: 'Dasher'
			,description: locale['services[30]']
			,url: 'https://dasher.im/'
			,type: 'messaging'
		},
		{
			 id: 'flowdock'
			,logo: 'flowdock.png'
			,name: 'Flowdock'
			,description: locale['services[31]']
			,url: 'https://www.flowdock.com/login'
			,type: 'messaging'
		},
		{
			 id: 'mattermost'
			,logo: 'mattermost.png'
			,name: 'Mattermost'
			,description: locale['services[32]']
			,url: '___'
			,type: 'messaging'
			,custom_js: `Object.defineProperty(document,"title",{configurable:!0,set(a){document.getElementsByTagName("title")[0].innerHTML="*"===a[0]?"(•) Mattermost":a},get:()=>document.getElementsByTagName("title")[0].innerHTML});`
		},
		{
			 id: 'dingtalk'
			,logo: 'dingtalk.png'
			,name: 'DingTalk'
			,description: locale['services[33]']
			,url: 'https://im.dingtalk.com/'
			,type: 'messaging'
		},
		{
			 id: 'mysms'
			,logo: 'mysms.png'
			,name: 'mysms'
			,description: locale['services[34]']
			,url: 'https://app.mysms.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("unread");let t=0;for(let i of e)t+=parseInt(i.firstChild.innerHTML.trim());hamsket.updateBadge(t)};"https://app.mysms.com/#login"===document.baseURI&&(document.getElementsByClassName("innerPanel")[0].rows[0].style.display="none",document.getElementsByClassName("innerPanel")[0].rows[1].cells[0].firstElementChild.style.display="none",document.getElementsByClassName("msisdnLoginPanel")[0].style.display="inline"),setInterval(checkUnread,3e3);`
			,note: 'You have to use this service by signing in with your mobile number.'
		},
		{
			 id: 'icq'
			,logo: 'icq.png'
			,name: 'ICQ'
			,description: locale['services[35]']
			,url: 'https://web.icq.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let total=0;const counters=document.getElementsByClassName("icq-msg-counter");for(let counter of counters)total+=parseInt("block"===counter.style.display?counter.innerHTML.trim():0);hamsket.updateBadge(total)};setInterval(checkUnread,3e3);`
			,titleBlink: true
		},
		{
			 id: 'tweetdeck'
			,logo: 'tweetdeck.png'
			,name: 'TweetDeck'
			,description: locale['services[36]']
			,url: 'https://tweetdeck.twitter.com/'
			,type: 'messaging'
		},
		{
			 id: 'custom'
			,logo: 'custom.png'
			,name: '_Custom Service'
			,description: locale['services[38]']
			,url: '___'
			,type: 'custom'
			,allow_popups: true
		},
		{
			 id: 'zinc'
			,logo: 'zinc.png'
			,name: 'Zinc'
			,description: locale['services[39]']
			,url: 'https://zinc-app.com/'
			,type: 'messaging'
		},
		{
			 id: 'freenode'
			,logo: 'freenode.png'
			,name: 'FreeNode'
			,description: locale['services[40]']
			,url: 'https://webchat.freenode.net/'
			,type: 'messaging'
		},
		{
			 id: 'mightytext'
			,logo: 'mightytext.png'
			,name: 'Mighty Text'
			,description: locale['services[41]']
			,url: 'https://mightytext.net/web/'
			,type: 'messaging'
		},
		{
			 id: 'roundcube'
			,logo: 'roundcube.png'
			,name: 'Roundcube'
			,description: locale['services[42]']
			,url: '___'
			,type: 'email'
		},
		{
			 id: 'horde'
			,logo: 'horde.png'
			,name: 'Horde'
			,description: locale['services[43]']
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("count");let t=0;for(let i of e)t+=parseInt(i.innerHTML.match(/[0-9]+/g));hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,note: 'To enable desktop notifications and automatic mail check, you have to go to Options inside Horde.'
		},
		{
			 id: 'squirrelmail'
			,logo: 'squirrelmail.png'
			,name: 'SquirrelMail'
			,description: locale['services[44]']
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("leftunseen");let t=0;for(let i of e)t+=parseInt(i.innerHTML);hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'zohoemail'
			,logo: 'zohoemail.png'
			,name: 'Zoho Email'
			,description: locale['services[45]']
			,url: 'https://mail.zoho.___/'
			,type: 'email'
			,js_unread: 'zmail.aInfo[zmail.accId].mailId = "a";'
			,note: 'To enable desktop notifications, you have to go to Settings inside Zoho Email. Add .com or the other relevant fieldto the URL field depending on your location.'
		},
		{
			 id: 'zohochat'
			,logo: 'zohochat.png'
			,name: 'Zoho Chat'
			,description: locale['services[46]']
			,url: 'https://chat.zoho.___/'
			,type: 'messaging'
			,js_unread: `NotifyByTitle.show=function(){},NotifyByTitle.start=function(){},NotifyByTitle.stop=function(){};let checkUnread=()=>{let t=0;$(".msgnotify").each(function(){let i=parseInt($(this).html());t+=isNaN(i)?0:i}),hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,note: 'Add .com the other relevant TLD into the URL field depending on your location.'
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
			,js_unread: `let checkUnread=()=>{const t=parseInt($(".mail-MessagesFilters-Item_unread .mail-LabelList-Item_count").html());hamsket.updateBadge(isNaN(t)?0:t)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'irccloud'
			,logo: 'irccloud.png'
			,name: 'IRCCloud'
			,description: 'IRCCloud is a modern IRC client that keeps you connected, with none of the baggage.'
			,url: 'https://www.irccloud.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let t=0;const badges=document.querySelectorAll(".bufferBadges > .badge");for(let n of badges)t+=n.textContent?parseInt(n.textContent,10):0;hamsket.updateBadge(t)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		{
			 id: 'ryver'
			,logo: 'ryver.png'
			,name: 'Ryver'
			,description: 'Ryver is a team communication tool that organizes team collaboration, chats, files, and even emails into a single location, for any size team, for FREE.'
			,url: 'https://___.ryver.com/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementsByClassName("scene-space-tab-button--flash").length))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'kiwi'
			,logo: 'kiwi.png'
			,name: 'Kiwi IRC'
			,description: 'KiwiIRC makes Web IRC easy. A hand-crafted IRC client that you can enjoy. Designed to be used easily and freely.'
			,url: 'https://kiwiirc.com/client'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let a=0,b=!1;$(".activity").each(function(){a+=parseInt($(this).html())});const msgs=$(".panel[style*='display:block'] .msg");for(let msg of msgs)b?a++:$(this).hasClass("last_seen")&&(b=!0);hamsket.updateBadge(a)};setInterval(checkUnread,3e3);`
			,custom_domain: true
		},
		/* TODO: fix kiwi */
		{
			 id: 'icloud'
			,logo: 'icloud.png'
			,name: 'iCloud Mail'
			,description: 'iCloud makes sure you always have the latest versions of your most important things — documents, photos, notes, contacts, and more — on all your devices. It can even help you locate a missing iPhone, iPad, iPod touch or Mac.'
			,url: 'https://www.icloud.com/#mail'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge("none"===document.querySelector(".current-app").querySelector(".sb-badge").style.display?0:parseInt(document.querySelector(".current-app").querySelector(".text").innerHTML.trim()))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'rainloop'
			,logo: 'rainloop.png'
			,name: 'RainLoop'
			,description: 'RainLoop Webmail - Simple, modern & fast web-based email client.'
			,url: '___'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const t=document.querySelectorAll(".e-item .e-link:not(.hidden) .badge.pull-right.count");let e=0;for(let i of t){let iTrim=parseInt(i.textContent.trim());iTrim%1==0&&"block"===window.getComputedStyle(i).display&&(e+=parseInt(iTrim))}hamsket.updateBadge(e)};setInterval(checkUnread,1e3);`
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
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(appCtxt.getById(ZmFolder.ID_INBOX).numUnread)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'kaiwa'
			,logo: 'kaiwa.png'
			,name: 'Kaiwa'
			,description: 'A modern and Open Source Web client for XMPP.'
			,url: '___'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let count=0;for(let node of document.getElementsByClassName("unread"))node.innerHTML&&(count+=parseInt(node.innerHTML));hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'movim'
			,logo: 'movim.png'
			,name: 'Movim'
			,description: 'Movim is a decentralized social network, written in PHP and HTML5 and based on the XMPP standard protocol.'
			,url: 'https://___.movim.eu/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("color dark");let b=0;for(let i of a){const c=i.getElementsByClassName("counter");for(let ii of c){const iiTrim=parseInt(ii.textContent.trim());iiTrim%1==0&&(b+=iiTrim)}}hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`
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
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("mx_RoomTile_nameContainer");let b=0;for(let i of a){const c=i.getElementsByClassName("mx_RoomTile_badge");for(let ii of c){const iiTrim=parseInt(ii.textContent.trim());iiTrim%1==0&&(b+=iiTrim)}}hamsket.updateBadge(b)};setInterval(checkUnread,1e3);`
			,custom_domain: true
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
			,custom_js: `document.getElementsByClassName("google-login-area")[0].remove(),document.getElementsByClassName("microsoft-login-area")[0].remove();`
		},
		{
			 id: 'webexteams'
			,logo: 'webexteams.png'
			,name: 'Cisco Webex Teams'
			,description: 'Cisco Webex Teams is for group chat, video calling, and sharing documents with your team. It’s all backed by Cisco security and reliability.'
			,url: 'https://teams.webex.com/'
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
			,url: 'https://app.openmailbox.org/webmail/'
			,type: 'email'
		},
		{
			 id: 'flock'
			,logo: 'flock.png'
			,name: 'Flock'
			,description: 'Flock is a free enterprise tool for business communication. Packed with tons of productivity features, Flock drives efficiency and boosts speed of execution.'
			,url: 'https://web.flock.co/'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("unreadMessages no-unread-mentions has-unread");let b=0;for(const i of a)b+=parseInt(i.innerHTML.trim());hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`

		},
		{
			 id: 'crisp'
			,logo: 'crisp.png'
			,name: 'Crisp'
			,description: 'Connect your customers to your team.'
			,url: 'https://app.crisp.chat/'
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
			id: 'xing',
			logo: 'xing.png',
			name: 'XING',
			description: 'Career-oriented social networking',
			url: 'https://www.xing.com/messages/conversations',
			type: 'messaging',
			js_unread: `let checkUnread=()=>{let count=null;const notificationElement=document.querySelector('[data-update="unread_conversations"]');notificationElement&&"none"!==notificationElement.style.display&&(count=parseInt(notificationElement.textContent.trim(),10)),hamsket.updateBadge(count)};setInterval(checkUnread,3e3);`
		},
		{
			id: 'threema',
			logo: 'threema.png',
			name: 'Threema',
			description: 'Seriously secure messaging',
			url: 'https://web.threema.ch/',
			type: 'messaging',
			js_unread: `!function(){let unreadCount=0;function checkUnread(){let newUnread=0;try{const webClientService=angular.element(document.documentElement).injector().get("WebClientService"),conversations=webClientService.conversations.conversations;conversations.forEach(function(conversation){newUnread+=conversation.unreadCount})}catch(e){}newUnread!==unreadCount&&(unreadCount=newUnread,hamsket.updateBadge(unreadCount))}setInterval(checkUnread,3e3),checkUnread()}();`
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
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("badge highlight");let b=0;for(let i of a){const iTrim=parseInt(i.textContent.trim());iTrim%1==0&&(b+=iTrim)}hamsket.updateBadge(b)};setInterval(checkUnread,1e3);`
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
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("z-messages");let b=0;for(let i of a)b+=parseInt(i.innerHTML.trim());hamsket.updateBadge(b)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'fastmail'
			,logo: 'fastmail.png'
			,name: 'FastMail'
			,description: 'Secure, reliable email hosting for businesses, families and professionals. Premium email with no ads, excellent spam protection and rapid personal support.'
			,url: 'https://www.fastmail.com/mail/'
			,type: 'email'
			,js_unread: `let checkUnread=()=>{const e=document.getElementsByClassName("v-FolderSource-badge");let t=0;for(const i of e){const iTrim=parseInt(i.innerHTML.trim());t+=isNaN(iTrim)?0:iTrim}hamsket.updateBadge(t)};setInterval(checkUnread,3e3),setTimeout(function(){O.WindowController.openExternal=function(a){let b=document.createElement("a");b.href=a,b.setAttribute("target","_blank"),b.click()}},3e3);`
			,note: 'To enable desktop notifications, you have to go to Settings inside FastMail.'
		},
		{
			 id: 'hibox'
			,logo: 'hibox.png'
			,name: 'Hibox'
			,description: 'Hibox is a secure and private messaging platform for your business.'
			,url: 'https://app.hibox.co/'
			,type: 'messaging'
		},
		{
			 id: 'jandi'
			,logo: 'jandi.png'
			,name: 'Jandi'
			,description: 'Jandi is a group-oriented enterprise messaging platform with an integrated suite of collaboration tools for workplace.'
			,url: 'https://___.jandi.com/'
			,type: 'messaging'
		},
		{
			 id: 'messengerpages'
			,logo: 'messengerpages.png'
			,name: 'Messenger for Pages'
			,description: 'Chat with the people of your Facebook Page.'
			,url: 'https://facebook.com/___/inbox/'
			,type: 'messaging'
			,custom_js: `let remove=e=>{let r=document.getElementById(e);return r.parentNode.removeChild(r)};remove("pagelet_bluebar"),remove("pages_manager_top_bar_container");`
		},
		{
			 id: 'messengerbusiness'
			,logo: 'messengerpages.png'
			,name: 'Messenger for Business'
			,description: 'Messenger can help facilitate communication with your customers.'
			,url: 'https://business.facebook.com/___/inbox/'
			,type: 'messaging'
			,custom_js: `let remove=e=>{let r=document.getElementById(e);return r.parentNode.removeChild(r)};remove("pagelet_bluebar"),remove("pages_manager_top_bar_container");`
		},
		{
			 id: 'vk'
			,logo: 'vk.png'
			,name: 'VK Messenger'
			,description: 'Simple and Easy App for Messaging on VK.'
			,url: 'https://m.vk.com/im'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementById("l_msg").innerText.replace(/[^0-9]+/g,"")))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'mastodon'
			,logo: 'mastodon.png'
			,name: 'Mastodon'
			,description: 'Mastodon is a free, open-source social network server. A decentralized solution to commercial platforms, it avoids the risks of a single company monopolizing your communication. Anyone can run Mastodon and participate in the social network seamlessly.'
			,url: 'https://mastodon.social/auth/sign_in'
			,type: 'messaging'
			,custom_domain: true
			,note: '<a href="https://instances.mastodon.xyz/" target="_blank">List of instances</a>'
		},
		{
			 id: 'teamworkchat'
			,logo: 'teamworkchat.png'
			,name: 'Teamwork Chat'
			,description: 'Say goodbye to email. Take your online collaboration to the next level with Teamwork Chat and keep all team discussions in one place. Chat to your team in a fun and informal way with Teamwork Chat.'
			,url: 'https://___/chat'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(parseInt(document.getElementsByClassName("sidebar-notification-indicator").length>0?document.getElementsByClassName("sidebar-notification-indicator")[0].innerHTML:0))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'clocktweets'
			,logo: 'clocktweets.png'
			,name: 'ClockTweets'
			,description: 'Schedule your Tweets with love. Save time and manage your social media strategy easily.'
			,url: 'https://clocktweets.com/dashboard/'
			,type: 'messaging'
		},
		{
			 id: 'intercom'
			,logo: 'intercom.png'
			,name: 'Intercom'
			,description: 'Intercom makes it easy to communicate with your customers personally, at scale. Designed to feel like the messaging apps you use every day, Intercom lets you talk to consumers almost anywhere: inside your app, on your website, across social media and via email.'
			,url: 'https://app.intercom.io'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{const a=document.getElementsByClassName("unread")[0];hamsket.updateBadge(t=void 0===a?0:parseInt(a.textContent.replace(/[^0-9]/g,"")))};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'Kune'
			,logo: 'kune.png'
			,name: 'Kune'
			,description: 'Kune is a web tool, based on Apache Wave, for creating environments of constant inter-communication, collective intelligence, knowledge and shared work.'
			,url: 'https://kune.cc'
			,type: 'messaging'
		},
		{
			 id: 'googlevoice'
			,logo: 'googlevoice.png'
			,name: 'Google Voice'
			,description: 'A free phone number for life.  Stay in touch from any screen.  Use your free number to text, call, and check voicemail  all from one app. Plus, Google Voice works on all of your devices so you can connect and communicate how you want.'
			,url: 'https://voice.google.com'
			,type: 'messaging'
			,js_unread: `let parseIntOrZero=e=>isNaN(parseInt(e))?0:parseInt(e),checkUnread=()=>{const e=document.querySelector(".msgCount");let n=0;e?n=parseIntOrZero(e.innerHTML.replace(/[() ]/gi,"")):["Messages","Calls","Voicemail"].forEach(function(e){const r=document.querySelector('gv-nav-tab[tooltip="+e+"] div[aria-label="Unread count"]');r&&(n+=parseIntOrZero(r.innerHTML))}),hamsket.updateBadge(n)};setInterval(checkUnread,3e3);;`
		},
		{
			 id: 'sandstorm'
			,logo: 'sandstorm.png'
			,name: 'Sandstorm'
			,description: 'Sandstorm is a self-hostable web productivity suite.'
			,url: 'https://oasis.sandstorm.io/'
			,type: 'messaging'
			,custom_domain: true
			,allow_popups: true
		},
		{
			 id: 'gadugadu'
			,logo: 'gadugadu.png'
			,name: 'Gadu-Gadu'
			,description: 'The most popular Polish messenger.'
			,url: 'https://www.gg.pl/'
			,type: 'messaging'
		},
		{
			 id: 'mailru'
			,logo: 'mailru.png'
			,name: 'Mail.Ru'
			,description: 'Free voice and video calls, ICQ support, Odnoklassniki, VKontakte, Facebook, online games, free SMS.'
			,url: 'https://webagent.mail.ru/webim/agent/popup.html'
			,type: 'email'
		},
		{
			 id: 'zulip'
			,logo: 'zulip.png'
			,name: 'Zulip'
			,description: "The world's most productive group chat"
			,url: 'https://___.zulipchat.com/'
			,type: 'messaging'
			,custom_domain: true
		},
		{
			 id: 'stride'
			,logo: 'stride.png'
			,name: 'Stride'
			,description: 'Stride is the complete team communication solution with group messaging, video meetings, and built-in collaboration tools.'
			,url: 'https://app.stride.com/___'
			,type: 'messaging'
			,js_unread: `let checkUnread=()=>{let direct=0,indirect=0;const conversations=document.querySelectorAll(".conversations-nav .nav-item .activity-indicator");for(let n of conversations)n.classList.contains("has-count")?direct+=parseInt(n.innerHTML):indirect++;hamsket.updateBadge(direct,indirect)};setInterval(checkUnread,3e3);`
		},
		{
			 id: 'hangoutschat'
			,logo: 'hangoutschat.png'
			,name: 'Hangouts Chat'
			,description: 'A messaging platform built for teams.'
			,url: 'https://chat.google.com/'
			,type: 'messaging'
			,titleBlink: true
			,manual_notifications: true
			,js_unread: `let checkUnread=()=>{hamsket.updateBadge(document.querySelectorAll(".SSPGKf.EyyDtb.Q6oXP:not(.oCHqfe) .eM5l9e.FVKzAb").length)};setInterval(checkUnread,3e3);`
		}
	]
});
