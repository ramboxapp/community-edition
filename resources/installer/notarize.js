const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== 'darwin') {
		return;
	}

	const appName = context.packager.appInfo.productFilename;

	return await notarize({
		appBundleId: 'com.grupovrs.ramboxce',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: 'saenzramiro@gmail.com',
		appleIdPassword: process.env.APPLE_ID_PWD
	});
};