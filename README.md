<h1 align="center">
  <br>
  <a href="http://rambox.pro"><img src="https://raw.githubusercontent.com/phischdev/pdhBox/master/resources/IconCyan.ico" width="256px" alt="Rambox"></a>
  <br>
  pdhBox
  <br>
  <br>
</h1>

<h4 align="center">Free, Open Source and Cross Platform messaging and emailing app that combines common web applications into one.</h4>

<h5 align="center">Available for Windows, Mac and Linux.</h5>

<h5 align="center"><a href="https://github.com/phischdev/pdhBox/releases" target="_blank"><img src="https://cdn.rawgit.com/saenzramiro/rambox/gh-pages/images/img-download.svg" width="250" alt="DOWNLOAD HERE"></a></h5>

----------

## Screenshot

![Rambox](https://raw.githubusercontent.com/saenzramiro/rambox/master/resources/screenshots/mac.png)


#### Technologies:

* Sencha Ext JS 5.1.1.451
* Electron
* Node JS

#### Environment:

* Sencha Cmd 6.1.2.15 (make sure to check "Compass extension" during install if you don't have installed yet)
* Ruby 2.3
* NPM 3.8.7
* Node.js 4.0.0

#### Compile on Ubuntu:

These instructions were tested with Ubuntu 17.04.
1. Install dependencies: `sudo apt install nodejs-legacy npm git`
2. Build and install electron: `sudo npm install electron-prebuilt -g`
3. Install Sencha Cmd (non-free): https://www.sencha.com/products/extjs/cmd-download/
4. Clone repository: `git clone https://github.com/phischdev/pdhBox.git`
5. Install npm dependencies: `npm install`
6. Compile: `npm run sencha:compile`
7. Start program: `npm start`

[GNU GPL v3](https://github.com/saenzramiro/rambox/LICENSE)
