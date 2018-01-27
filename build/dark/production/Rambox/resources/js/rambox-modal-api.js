document.addEventListener("DOMContentLoaded", function() {
	window.WHAT_TYPE.isChildWindowAnIframe=function(){return false;}; // for iCloud
	window.onbeforeunload=function(){return require("electron").ipcRenderer.sendToHost("close");};
});
