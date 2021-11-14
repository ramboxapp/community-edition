const { ipcRenderer } = require('electron');
const darkreader = require('darkreader');
darkreader.setFetchMethod(window.fetch);


const getIsEnabled = () => ipcRenderer.sendSync('getConfig').darkreader; 
const canEnable = () => document.readyState === 'complete' || document.readyState === 'interactive';

document.addEventListener('readystatechange', () => {
    console.log(document.readyState)
    if (canEnable()) {
        getIsEnabled()? darkreader.enable(): darkreader.disable();
    }
});