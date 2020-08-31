<div align="center">
  <h1>
    <br />
    <a href="https://rambox.pro"><img src="./resources/Icon.png" width="256px" alt="Rambox" /></a><br />
    Rambox CE
    <br /><br/>
  </h1>

  <h4>Free, Open Source and Cross Platform messaging and emailing app that combines common web applications into one.</h4>

  <p>
    <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WU75QWS7LH2CA" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-green.svg" alt="Donate with PayPal" /></a>
    <a href="https://www.gnu.org/licenses/gpl-3.0.en.html" target="_blank"><img src="https://img.shields.io/github/license/saenzramiro/rambox.svg" alt="GNU GPL v3" /></a>
    <a href="https://gitter.im/saenzramiro/rambox" target="_blank"><img src="https://badges.gitter.im/saenzramiro/rambox.svg" alt="Gitter" /></a>
    <a href="https://github.com/saenzramiro/rambox/releases/latest" target="_blank">
      <img src="https://img.shields.io/github/release/saenzramiro/rambox.svg" alt="Release" />
    </a>
    <a target="_blank" href="https://crowdin.com/project/rambox"><img src="https://d322cqt584bo4o.cloudfront.net/rambox/localized.svg" /></a>
  </p>
  <p>
    <a href="https://travis-ci.org/saenzramiro/rambox" target="_blank"><img src="https://travis-ci.org/saenzramiro/rambox.svg?branch=master" alt="Travis CI" /></a>
    <a href="https://ci.appveyor.com/project/saenzramiro/rambox" target="_blank"><img src="https://ci.appveyor.com/api/projects/status/3kk9ixjgxwrh7yfy?svg=true" alt="AppVeyor CI" /></a>
    <a href="https://david-dm.org/saenzramiro/rambox" title="Dependency status"><img src="https://david-dm.org/saenzramiro/rambox.svg" /></a>
    <a href="https://david-dm.org/saenzramiro/rambox#info=devDependencies" title="devDependency status"><img src="https://david-dm.org/saenzramiro/rambox/dev-status.svg" /></a>
  </p>

  <h5>Available for Windows, Mac and Linux.</h5>

  <h5><a href="https://rambox.pro/#ce" target="_blank"><img src="https://cdn.rawgit.com/saenzramiro/rambox/gh-pages/images/img-download.svg" width="250" alt="DOWNLOAD HERE" /></a></h5>

  <h6>Logo designed by <a href="https://www.linkedin.com/in/andriyyurchenko/" target="_blank">Andriy Yurchenko</a></h6>
</div>

---

## Table of Contents

- [Screenshot](#screenshot)
- [Apps available](#apps-available)
- [Features](#features)
- [Privacy](#privacy)
- [Donations](#donations)
- [Translations](#translations)
- [Install on Linux - Steps](#install-on-linux---steps)
- [Contributing](#contributing)
  - [Quickstart](#quickstart)
- [Disclosure](#disclosure)
- [Licence](#licence)

---

## Screenshot

![Rambox](./resources/screenshots/mac.png)

## Apps available

Visit our website https://rambox.app/#apps and select the "Community-Edition" filter to see all the apps available.

## Features

- [x] Multi-language.
- [x] Sync your configuration between multiple computers.
- [x] Master Password.
- [x] Lock Rambox if you will be away for a period of time.
- [x] Don't disturb mode.
- [x] Reorder applications in the tab bar.
- [x] Notification badge in the tab.
- [x] Minimize to tray.
- [x] Mute audio to specific service.
- [x] Separate tabs floating to the right.
- [x] Disable a service instead of remove it.
- [x] Start automatically on system startup.
- [x] Custom Code Injection.
- [x] Keyboard Shortcuts.
- [x] Proxy.
- [x] Switch from horizontal to vertical tab bar.

## Privacy

No personal information will be saved

Sessions will persist using the [partition:persist](https://electronjs.org/docs/api/webview-tag#partition) attribute for Webviews.
So every time you open Rambox, your sessions will keep alive until you remove the service.

Sync feature use Auth0 for Single Sign On & Token Based Authentication and to store the services that user is using (and the configuration for each service).
You are always welcome to check the code! ;)

## Donations

| Type             | URL/Wallet                                                                                 |
| ---------------- | :----------------------------------------------------------------------------------------: |
| Credit Cards     | [HERE](https://rambox.app/donate.html) |
| Cryptocurrencies | [HERE](https://www.vaulty.io/v/b6480279-af28-4855-868c-17e5cb0ae7fa)                       |

## Translations

Help us translate Rambox on <https://crowdin.com/project/rambox/invite>.

## [Install on Linux - Steps](https://github.com/ramboxapp/community-edition/wiki/Install-on-Linux)

## [Contributing](./CONTRIBUTING.md)

Want to report a bug, request a feature, contribute to or translate Rambox?
We need all the help we can get!
Fork and work!

### Quickstart

```shell
git clone https://github.com/saenzramiro/rambox.git
cd rambox
cp env-sample.js env.js
# update env.js with your auth0 details.
npm install
sencha app watch
npm start
```

See [Contributing.md](./CONTRIBUTING.md) for more detailed information about getting set up.

---

## Disclosure

Rambox is not affiliated with any of the messaging apps offered.

## Licence

[GNU GPL v3](https://github.com/ramboxapp/community-edition/blob/master/LICENSE)
