Ext.define('Hamsket.store.OS', {
    extend: 'Ext.data.Store'
   ,alias: 'store.os'

   ,fields: ['platform', 'label']
   ,data: [
        {  'platform': '',         'label': '(none)'}
        ,{ 'platform': 'win32',    'label': 'Windows'}
        ,{ 'platform': 'linux',    'label': 'Linux'}
        ,{ 'platform': 'darwin',   'label': 'MacOS'}
        ,{ 'platform': 'freebsd',  'label': 'FreeBSD'}
        ,{ 'platform': 'Solaris',  'label': 'Solaris'}
   ]
});