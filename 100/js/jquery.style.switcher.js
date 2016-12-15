// https://github.com/camsjams/jquery-style-switcher
/**
@author Cameron Manavian
jQuery Style Switcher

The MIT License (MIT)

Copyright (c) 2014 Cameron Manavian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/

(function ($) {
	var jStyleSwitcher,
		_defaultOptions = {
			hasPreview: true,
			defaultThemeId: 'jssDefault',
			fullPath: 'css/',
			cookie: {
				expires: 30,
				isManagingLoad: true
			}
		},
		// private
		_cookieKey = 'jss_selected',
		_docCookies = {};

	/*\
	|*|
	|*|  :: cookies.js ::
	|*|
	|*|  A complete cookies reader/writer framework with full unicode support.
	|*|
	|*|  revision #1
	|*|
	|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
	|*|
	|*|  This framework is released under the GNU Public License, version 3 or later.
	|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
	|*|
	|*|  Syntaxes:
	|*|
	|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
	|*|  * docCookies.getItem(name)
	|*|  * docCookies.removeItem(name[, path[, domain]])
	|*|  * docCookies.hasItem(name)
	|*|  * docCookies.keys()
	|*|
	\*/
	_docCookies = {
		getItem: function (sKey) {
			if (!sKey) {
				return null;
			}
			return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
		},
		setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
			if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
				return false;
			}
			var sExpires = "";
			if (vEnd) {
				switch (vEnd.constructor) {
					case Number:
						sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
						break;
					case String:
						sExpires = "; expires=" + vEnd;
						break;
					case Date:
						sExpires = "; expires=" + vEnd.toUTCString();
						break;
				}
			}
			document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
			return true;
		},
		removeItem: function (sKey, sPath, sDomain) {
			if (!this.hasItem(sKey)) {
				return false;
			}
			document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
			return true;
		},
		hasItem: function (sKey) {
			if (!sKey) {
				return false;
			}
			return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
		},
		keys: function () {
			var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
			for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
				aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
			}
			return aKeys;
		}
	};

	jStyleSwitcher = function ($root, config) {
		return this.init($root, config);
	};

	jStyleSwitcher.prototype = {

		/**
		 * {Object} DOM reference to style option list
		 */
		$root: null,

		/**
		 * {Object} configs for the style switcher
		 */
		config: {},

		/**
		 * {Object} jQuery reference to <link> tag for swapping CSS
		 */
		$themeCss: null,
		
		/**
		 * {String} default theme page was loaded with
		 */
		defaultTheme: null,

		init: function ($root, config) {
			this.$root = $root;
			this.config = config ? config : {};
			this.setDefaultTheme();
			if(this.defaultTheme) {
				// try cookies
				if (this.config.cookie) {
					this.checkCookie();
				}
				// try hover
				if (this.config.hasPreview) {
					this.addHoverEvents();
				}
				// finally, add click events
				this.addClickEvents();
			} else {
				this.$root.addClass('jssError error level0');
			}
		},

		setDefaultTheme: function () {
			this.$themeCss = $('link[id=' + this.config.defaultThemeId + ']');
			if(this.$themeCss.length) {
				this.defaultTheme = this.$themeCss.attr('href');
			}
		},
		
		resetStyle: function() {
			this.updateStyle(this.defaultTheme);
		},
		
		updateStyle: function(newStyle) {
			this.$themeCss.attr('href', newStyle);
		},
		
		getFullAssetPath: function(asset) {
			return this.config.fullPath + asset + '.css';
		},

		checkCookie: function () {
			var styleCookie;
			// if using cookies and using JavaScript to load css
			if (this.config.cookie && this.config.cookie.isManagingLoad) {
				// check if css is set in cookie
				styleCookie = _docCookies.getItem(_cookieKey);
				if (styleCookie) {
					newStyle = this.getFullAssetPath(styleCookie);
					// update link tag
					this.updateStyle(newStyle);
					// update default ref
					this.defaultTheme = newStyle;
				}
			}
		},

		addHoverEvents: function () {
			var self = this;
			this.$root.find('a').hover(
				function () {
					var asset = $(this).data('theme'),
						newStyle = self.getFullAssetPath(asset);
					// update link tag
					self.updateStyle(newStyle);
				},
				function () {
					// reset link tag
					self.resetStyle();
				}
			);
		},

		addClickEvents: function () {
			var self = this;
			this.$root.find('a').click(
				function () {
					var asset = $(this).data('theme'),
						newStyle = self.getFullAssetPath(asset);
					// update link tag
					self.updateStyle(newStyle);
					// update default ref
					self.defaultTheme = newStyle;
					// try to store cookie
					if (self.config.cookie) {
						_docCookies.setItem(_cookieKey, asset, self.config.cookie.expires, '/');
					}
				}
			);
		}
	};

	$.fn.styleSwitcher = function (options) {
		return new jStyleSwitcher(this, $.extend(true, _defaultOptions, options));
	};
})(jQuery);