'use strict';
var electronInstaller = require('electron-winstaller');

var arch = process.argv.slice(2)[0];

if ( !arch ) {
    console.error('No Architecture paramenter specified. [ia32 or x64]');
    return;
}

//var appData = require('../app/package.json');

var resultPromise = electronInstaller.createWindowsInstaller({
     appDirectory: './dist/Rambox-win32-'+arch
    ,outputDirectory: './dist/setup-'+arch
    ,title: 'Rambox'
    ,loadingGif: './resources/installer/loading.gif'
    ,authors: 'Rambox'
    ,owners: 'Rambox'
    ,exe: 'Rambox.exe'
    ,setupExe: 'RamboxSetup.exe'
    ,noMsi: true
    ,iconUrl: 'https://raw.githubusercontent.com/saenzramiro/rambox/master/resources/installer/icons/64x64.png'
    ,setupIcon: './resources/Icon.ico'
    //,remoteReleases: 'https://getrambox.herokuapp.com/update/'+process.platform+'/'+process.arch+'/'+appData.version
});

console.log('Creating installer... Please wait...')

resultPromise.then(() => console.log("Done!"), (e) => console.log(`Ups!: ${e.message}`));
