const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const Crowdin = require('crowdin');

var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

var crowdin = new Crowdin({
	apiKey: '1e7c2453268af5e31f6ac8cf6044d48b',
	endpointUrl: 'https://api.crowdin.net/api/project/rambox'
});

var args = process.argv.slice(2);

if ( args.indexOf('download') >= 0 ) crowdin.downloadToPath('resources/languages').then(function() { console.info('Download finished!') });

if ( args.indexOf('generate') >= 0 ) {
	fs.readdirSync(__dirname+'/resources/languages').filter(file => fs.lstatSync(path.join(__dirname+'/resources/languages', file)).isDirectory()).forEach(function(locale) {
		var result = 'var locale=[];';
		var path = __dirname+'/resources/languages/'+locale;
		fs.readdirSync(path).forEach(function(file) {
			var data = fs.readFileSync(path+'/'+file, { encoding : 'utf8'});
			csvjson.toObject(data, {
				 headers: 'prop,text'
				,delimiter: ','
				,quote: '"'
			}).forEach(function(obj) {
				result += 'locale["'+obj.prop+'"]="'+obj.text+'";';
			});
		});
		result += 'module.exports = locale;';
		fs.writeFileSync(path+'/../'+locale+'.js', result);
		console.log(locale, "File was generated!");
		deleteFolderRecursive(path);
	});
}

if ( args.length === 0 ) console.error('No arguments passed');
