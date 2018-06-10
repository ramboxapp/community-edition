// @tag core
// @define Ext.Boot

var Ext = Ext || {};

//<editor-fold desc="Boot">
/**
 * @class Ext.Boot
 * @singleton
 * @private
 */
Ext.Boot = Ext.Boot || (function (emptyFn) {

    var doc = document,
        _emptyArray = [],
        _config = {
            /**
             * @cfg {Boolean} [disableCaching=true]
             * If `true` current timestamp is added to script URL's to prevent caching.
             * In debug builds, adding a "cache" or "disableCacheBuster" query parameter
             * to the page's URL will set this to `false`.
             */
            disableCaching: (/[?&](?:cache|disableCacheBuster)\b/i.test(location.search) ||
                !(/http[s]?\:/i.test(location.href)) ||
                /(^|[ ;])ext-cache=1/.test(doc.cookie)) ? false :
                true,

            /**
             * @cfg {String} [disableCachingParam="_dc"]
             * The query parameter name for the cache buster's timestamp.
             */
            disableCachingParam: '_dc',

            /**
             * @cfg {Boolean} loadDelay
             * Millisecond delay between asynchronous script injection (prevents stack
             * overflow on some user agents) 'false' disables delay but potentially
             * increases stack load.
             */
            loadDelay: false,

            /**
             * @cfg {Boolean} preserveScripts
             * `false` to remove asynchronously loaded scripts, `true` to retain script
             * element for browser debugger compatibility and improved load performance.
             */
            preserveScripts: true,

            /**
             * @cfg {String} [charset=UTF-8]
             * Optional charset to specify encoding of dynamic content.
             */
            charset: 'UTF-8'
        },

        _assetConfig= {},

        cssRe = /\.css(?:\?|$)/i,
        resolverEl = doc.createElement('a'),
        isBrowser = typeof window !== 'undefined',
        _environment = {
            browser: isBrowser,
            node: !isBrowser && (typeof require === 'function'),
            phantom: (window && (window._phantom || window.callPhantom)) || /PhantomJS/.test(window.navigator.userAgent)
        },
        _tags = (Ext.platformTags = {}),

    //<debug>
        // All calls to _debug are commented out to speed up old browsers a bit;
        // yes that makes a difference because the cost of concatenating strings
        // and passing them into _debug() adds up pretty quickly.
        _debug = function (message) {
            //console.log(message);
        },
    //</debug>
        _apply = function (object, config, defaults) {
            if (defaults) {
                _apply(object, defaults);
            }
            if (object && config && typeof config === 'object') {
                for (var i in config) {
                    object[i] = config[i];
                }
            }
            return object;
        },
        _merge = function() {
            var lowerCase = false,
                obj = Array.prototype.shift.call(arguments),
                index, i, len, value;

            if (typeof arguments[arguments.length - 1] === 'boolean') {
                lowerCase = Array.prototype.pop.call(arguments);
            }

            len = arguments.length;
            for (index = 0; index < len; index++) {
                value = arguments[index];
                if (typeof value === 'object') {
                    for (i in value) {
                        obj[lowerCase ? i.toLowerCase() : i] = value[i];
                    }
                }
            }

            return obj;
        },
        _getKeys = (typeof Object.keys == 'function') ?
            function(object){
                if (!object) {
                    return [];
                }
                return Object.keys(object);
            } :
            function(object) {
                var keys = [],
                    property;

                for (property in object) {
                    if (object.hasOwnProperty(property)) {
                        keys.push(property);
                    }
                }

                return keys;
            },
    /*
     * The Boot loader class manages Request objects that contain one or
     * more individual urls that need to be loaded.  Requests can be performed
     * synchronously or asynchronously, but will always evaluate urls in the
     * order specified on the request object.
     */
        Boot = {
            loading: 0,
            loaded: 0,
            apply: _apply,
            env: _environment,
            config: _config,

            /**
             * @cfg {Object} assetConfig
             * A map (url->assetConfig) that contains information about assets loaded by the Microlaoder.
             */
            assetConfig: _assetConfig,

            // Keyed by absolute URL this object holds "true" if that URL is already loaded
            // or an array of callbacks to call once it loads.
            scripts: {
                /*
                 Entry objects

                 'http://foo.com/bar/baz/Thing.js': {
                 done: true,
                 el: scriptEl || linkEl,
                 preserve: true,
                 requests: [ request1, ... ]
                 }
                 */
            },

            /**
             * contains the current script name being loaded
             * (loadSync or sequential load only)
             */
            currentFile: null,
            suspendedQueue: [],
            currentRequest: null,

            // when loadSync is called, need to cause subsequent load requests to also be loadSync,
            // eg, when Ext.require(...) is called
            syncMode: false,

            /*
             * simple helper method for debugging
             */
            //<debug>
            debug: _debug,
            //</debug>

            /**
             * enables / disables loading scripts via script / link elements rather
             * than using ajax / eval
             */
            useElements: true,

            listeners: [],

            Request: Request,

            Entry: Entry,

            allowMultipleBrowsers: false,

            browserNames: {
                ie: 'IE',
                firefox: 'Firefox',
                safari: 'Safari',
                chrome: 'Chrome',
                opera: 'Opera',
                dolfin: 'Dolfin',
                edge: 'Edge',
                webosbrowser: 'webOSBrowser',
                chromeMobile: 'ChromeMobile',
                chromeiOS: 'ChromeiOS',
                silk: 'Silk',
                other: 'Other'
            },

            osNames: {
                ios: 'iOS',
                android: 'Android',
                windowsPhone: 'WindowsPhone',
                webos: 'webOS',
                blackberry: 'BlackBerry',
                rimTablet: 'RIMTablet',
                mac: 'MacOS',
                win: 'Windows',
                tizen: 'Tizen',
                linux: 'Linux',
                bada: 'Bada',
                chromeOS: 'ChromeOS',
                other: 'Other'
            },

            browserPrefixes: {
                ie: 'MSIE ',
                edge: 'Edge/',
                firefox: 'Firefox/',
                chrome: 'Chrome/',
                safari: 'Version/',
                opera: 'OPR/',
                dolfin: 'Dolfin/',
                webosbrowser: 'wOSBrowser/',
                chromeMobile: 'CrMo/',
                chromeiOS: 'CriOS/',
                silk: 'Silk/'
            },

            // When a UA reports multiple browsers this list is used to prioritize the 'real' browser
            // lower index number will win
            browserPriority: [
                'edge',
                'opera',
                'dolfin',
                'webosbrowser',
                'silk',
                'chromeiOS',
                'chromeMobile',
                'ie',
                'firefox',
                'safari',
                'chrome'
            ],

            osPrefixes: {
                tizen: '(Tizen )',
                ios: 'i(?:Pad|Phone|Pod)(?:.*)CPU(?: iPhone)? OS ',
                android: '(Android |HTC_|Silk/)', // Some HTC devices ship with an OSX userAgent by default,
                // so we need to add a direct check for HTC_
                windowsPhone: 'Windows Phone ',
                blackberry: '(?:BlackBerry|BB)(?:.*)Version\/',
                rimTablet: 'RIM Tablet OS ',
                webos: '(?:webOS|hpwOS)\/',
                bada: 'Bada\/',
                chromeOS: 'CrOS '
            },

            fallbackOSPrefixes: {
                windows: 'win',
                mac: 'mac',
                linux: 'linux'
            },

            devicePrefixes: {
                iPhone: 'iPhone',
                iPod: 'iPod',
                iPad: 'iPad'
            },

            maxIEVersion: 12,


            /**
             * The default function that detects various platforms and sets tags
             * in the platform map accordingly.  Examples are iOS, android, tablet, etc.
             * @param tags the set of tags to populate
             */
            detectPlatformTags: function () {
                var me = this,
                    ua = navigator.userAgent,
                    isMobile = /Mobile(\/|\s)/.test(ua),
                    element = document.createElement('div'),
                    isEventSupported = function (name, tag) {
                        if (tag === undefined) {
                            tag = window;
                        }

                        var eventName = 'on' + name.toLowerCase(),
                            isSupported = (eventName in element);

                        if (!isSupported) {
                            if (element.setAttribute && element.removeAttribute) {
                                element.setAttribute(eventName, '');
                                isSupported = typeof element[eventName] === 'function';

                                if (typeof element[eventName] !== 'undefined') {
                                    element[eventName] = undefined;
                                }

                                element.removeAttribute(eventName);
                            }
                        }

                        return isSupported;
                    },

                    // Browser Detection
                    getBrowsers = function () {
                        var browsers = {},
                            maxIEVersion, prefix,
                            value, key, index, len, match, version, matched;

                        // MS Edge browser (and possibly others) can report multiple browsers in the UserAgent
                        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240"
                        // we use this to prioritize the actual browser in this situation
                        len = me.browserPriority.length;
                        for (index = 0; index < len; index++) {
                            key = me.browserPriority[index];
                            if (!matched) {
                                value = me.browserPrefixes[key];
                                match = ua.match(new RegExp('(' + value + ')([\\w\\._]+)'));
                                version = match && match.length > 1 ? parseInt(match[2]) : 0;
                                if (version) {
                                    matched = true;
                                }
                            } else {
                                version = 0;
                            }
                            browsers[key] = version;
                        }

                        //Deal with IE document mode
                        if (browsers.ie) {
                            var mode = document.documentMode;

                            if (mode >= 8) {
                                browsers.ie = mode;
                            }
                        }

                        // Fancy IE greater than and less then quick tags
                        version = browsers.ie || false;
                        maxIEVersion = Math.max(version, me.maxIEVersion);

                        for (index = 8; index <= maxIEVersion; ++index) {
                            prefix = 'ie' + index;
                            browsers[prefix + 'm'] = version ? version <= index : 0;
                            browsers[prefix] = version ? version === index : 0;
                            browsers[prefix + 'p'] = version ? version >= index : 0;
                        }

                        return browsers;
                    },

                    //OS Detection
                    getOperatingSystems = function () {
                        var systems = {},
                            value, key, keys, index, len, match, matched, version, activeCount;

                        keys = _getKeys(me.osPrefixes);
                        len = keys.length;
                        for (index = 0, activeCount = 0; index < len; index++) {
                            key = keys[index];
                            value = me.osPrefixes[key];
                            match = ua.match(new RegExp('(' + value + ')([^\\s;]+)'));
                            matched = match ? match[1] : null;

                            // This is here because some HTC android devices show an OSX Snow Leopard userAgent by default.
                            // And the Kindle Fire doesn't have any indicator of Android as the OS in its User Agent
                            if (matched && (matched === 'HTC_' || matched === 'Silk/')) {
                                version = 2.3;
                            } else {
                                version = match && match.length > 1 ? parseFloat(match[match.length - 1]) : 0;
                            }

                            if (version) {
                                activeCount++;
                            }
                            systems[key] = version;
                        }

                        keys = _getKeys(me.fallbackOSPrefixes);

                        // If no OS could be found we resort to the fallbacks, otherwise we just
                        // falsify the fallbacks
                        len = keys.length;
                        for (index = 0; index < len; index++) {
                            key = keys[index];

                            // No OS was detected from osPrefixes
                            if (activeCount === 0) {
                                value = me.fallbackOSPrefixes[key];
                                match = ua.toLowerCase().match(new RegExp(value));
                                systems[key] = match ? true : 0;
                            } else {
                                systems[key] = 0;
                            }
                        }

                        return systems;
                    },

                    // Device Detection
                    getDevices = function () {
                        var devices = {},
                            value, key, keys, index, len, match;

                        keys = _getKeys(me.devicePrefixes);
                        len = keys.length;
                        for (index = 0; index < len; index++) {
                            key = keys[index];
                            value = me.devicePrefixes[key];
                            match = ua.match(new RegExp(value));
                            devices[key] = match ? true : 0;
                        }

                        return devices;
                    },
                    browsers = getBrowsers(),
                    systems = getOperatingSystems(),
                    devices = getDevices(),
                    platformParams = Boot.loadPlatformsParam();

                // We apply platformParams from the query here first to allow for forced user valued
                // to be used in calculation of generated tags
                _merge(_tags, browsers, systems, devices, platformParams, true);

                _tags.phone = !!((_tags.iphone || _tags.ipod) ||
                    (!_tags.silk && (_tags.android && (_tags.android < 3 || isMobile))) ||
                    (_tags.blackberry && isMobile) ||
                    (_tags.windowsphone));

                _tags.tablet = !!(!_tags.phone && (
                        _tags.ipad ||
                        _tags.android ||
                        _tags.silk ||
                        _tags.rimtablet ||
                        (_tags.ie10 && /; Touch/.test(ua))
                    ));

                _tags.touch =
                    // if the browser has touch events we can be reasonably sure the device has
                    // a touch screen
                    isEventSupported('touchend') ||
                    // browsers that use pointer event have maxTouchPoints > 0 if the
                    // device supports touch input
                    // http://www.w3.org/TR/pointerevents/#widl-Navigator-maxTouchPoints
                    navigator.maxTouchPoints ||
                    // IE10 uses a vendor-prefixed maxTouchPoints property
                    navigator.msMaxTouchPoints;

                _tags.desktop = !_tags.phone && !_tags.tablet;
                _tags.cordova = _tags.phonegap = !!(window.PhoneGap || window.Cordova || window.cordova);
                _tags.webview = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)(?!.*FBAN)/i.test(ua);
                _tags.androidstock = (_tags.android <= 4.3) && (_tags.safari || _tags.silk);

                // Re-apply any query params here to allow for user override of generated tags (desktop, touch, tablet, etc)
                _merge(_tags, platformParams, true);
            },

            /**
             * Extracts user supplied platform tags from the "platformTags" query parameter
             * of the form:
             *
             *      ?platformTags=name:state,name:state,...
             *
             * (each tag defaults to true when state is unspecified)
             *
             * Example:
             *
             *      ?platformTags=isTablet,isPhone:false,isDesktop:0,iOS:1,Safari:true, ...
             *
             * @returns {Object} the platform tags supplied by the query string
             */
            loadPlatformsParam: function () {
                // Check if the ?platform parameter is set in the URL
                var paramsString = window.location.search.substr(1),
                    paramsArray = paramsString.split("&"),
                    params = {}, i,
                    platforms = {},
                    tmpArray, tmplen, platform, name, enabled;

                for (i = 0; i < paramsArray.length; i++) {
                    tmpArray = paramsArray[i].split("=");
                    params[tmpArray[0]] = tmpArray[1];
                }

                if (params.platformTags) {
                    tmpArray = params.platformTags.split(",");
                    for (tmplen = tmpArray.length, i = 0; i < tmplen; i++) {
                        platform = tmpArray[i].split(":");
                        name = platform[0];
                        enabled=true;
                        if (platform.length > 1) {
                            enabled = platform[1];
                            if (enabled === 'false' || enabled === '0') {
                                enabled = false;
                            }
                        }
                        platforms[name] = enabled;
                    }
                }
                return platforms;
            },

            filterPlatform: function (platform, excludes) {
                platform = _emptyArray.concat(platform || _emptyArray);
                excludes = _emptyArray.concat(excludes || _emptyArray);

                var plen = platform.length,
                    elen = excludes.length,
                    include = (!plen && elen), // default true if only excludes specified
                    i, tag;

                for (i = 0; i < plen && !include; i++) {
                    tag = platform[i];
                    include = !!_tags[tag];
                }

                for (i = 0; i < elen && include; i++) {
                    tag = excludes[i];
                    include = !_tags[tag];
                }

                return include;
            },

            init: function () {
                var scriptEls = doc.getElementsByTagName('script'),
                    script = scriptEls[0],
                    len = scriptEls.length,
                    re = /\/ext(\-[a-z\-]+)?\.js$/,
                    entry, src, state, baseUrl, key, n, origin;

                // No check for script definedness because there always should be at least one
                Boot.hasReadyState = ("readyState" in script);
                Boot.hasAsync = ("async" in script);
                Boot.hasDefer = ("defer" in script);
                Boot.hasOnLoad = ("onload" in script);
                
                // Feature detecting IE
                Boot.isIE8 = Boot.hasReadyState && !Boot.hasAsync && Boot.hasDefer && !Boot.hasOnLoad;
                Boot.isIE9 = Boot.hasReadyState && !Boot.hasAsync && Boot.hasDefer && Boot.hasOnLoad;
                Boot.isIE10p = Boot.hasReadyState && Boot.hasAsync && Boot.hasDefer && Boot.hasOnLoad;

                if (Boot.isIE8) {
                    Boot.isIE10 = false;
                    Boot.isIE10m = true;
                }
                else {
                    Boot.isIE10 = (new Function('/*@cc_on return @_jscript_version @*/')()) === 10;
                    Boot.isIE10m = Boot.isIE10 || Boot.isIE9 || Boot.isIE8;
                }
                
                // IE11 does not support conditional compilation so we detect it by exclusion
                Boot.isIE11 = Boot.isIE10p && !Boot.isIE10;

                // Since we are loading after other scripts, and we needed to gather them
                // anyway, we track them in _scripts so we don't have to ask for them all
                // repeatedly.
                for (n = 0; n < len; n++) {
                    src = (script = scriptEls[n]).src;
                    if (!src) {
                        continue;
                    }
                    state = script.readyState || null;

                    // If we find a script file called "ext-*.js", then the base path is that file's base path.
                    if (!baseUrl && re.test(src)) {
                        baseUrl = src;
                    }

                    if (!Boot.scripts[key = Boot.canonicalUrl(src)]) {
                        //<debug>
//                         _debug("creating entry " + key + " in Boot.init");
                        //</debug>
                        entry = new Entry({
                            key: key,
                            url: src,
                            done: state === null ||  // non-IE
                                state === 'loaded' || state === 'complete', // IE only
                            el: script,
                            prop: 'src'
                        });
                    }
                }

                if (!baseUrl) {
                    script = scriptEls[scriptEls.length - 1];
                    baseUrl = script.src;
                }

                Boot.baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
                origin = window.location.origin ||
                    window.location.protocol +
                    "//" +
                    window.location.hostname +
                    (window.location.port ? ':' + window.location.port: '');
                Boot.origin = origin;

                Boot.detectPlatformTags();
                Ext.filterPlatform = Boot.filterPlatform;
            },

            /**
             * This method returns a canonical URL for the given URL.
             *
             * For example, the following all produce the same canonical URL (which is the
             * last one):
             *
             *      http://foo.com/bar/baz/zoo/derp/../../goo/Thing.js?_dc=12345
             *      http://foo.com/bar/baz/zoo/derp/../../goo/Thing.js
             *      http://foo.com/bar/baz/zoo/derp/../jazz/../../goo/Thing.js
             *      http://foo.com/bar/baz/zoo/../goo/Thing.js
             *      http://foo.com/bar/baz/goo/Thing.js
             *
             * @private
             */
            canonicalUrl: function (url) {
                // *WARNING WARNING WARNING*
                // This method yields the most correct result we can get but it is EXPENSIVE!
                // In ALL browsers! When called multiple times in a sequence, as if when
                // we resolve dependencies for entries, it will cause garbage collection events
                // and overall painful slowness. This is why we try to avoid it as much as we can.
                // 
                // @TODO - see if we need this fallback logic
                // http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
                resolverEl.href = url;

                var ret = resolverEl.href,
                    dc = _config.disableCachingParam,
                    pos = dc ? ret.indexOf(dc + '=') : -1,
                    c, end;

                // If we have a _dc query parameter we need to remove it from the canonical
                // URL.
                if (pos > 0 && ((c = ret.charAt(pos - 1)) === '?' || c === '&')) {
                    end = ret.indexOf('&', pos);
                    end = (end < 0) ? '' : ret.substring(end);
                    if (end && c === '?') {
                        ++pos; // keep the '?'
                        end = end.substring(1); // remove the '&'
                    }
                    ret = ret.substring(0, pos - 1) + end;
                }

                return ret;
            },

            /**
             * Get the config value corresponding to the specified name. If no name is given, will return the config object
             * @param {String} name The config property name
             * @return {Object}
             */
            getConfig: function (name) {
                return name ? Boot.config[name] : Boot.config;
            },

            /**
             * Set the configuration.
             * @param {Object} config The config object to override the default values.
             * @return {Ext.Boot} this
             */
            setConfig: function (name, value) {
                if (typeof name === 'string') {
                    Boot.config[name] = value;
                } else {
                    for (var s in name) {
                        Boot.setConfig(s, name[s]);
                    }
                }
                return Boot;
            },

            getHead: function () {
                return Boot.docHead ||
                    (Boot.docHead = doc.head ||
                        doc.getElementsByTagName('head')[0]);
            },

            create: function (url, key, cfg) {
                var config = cfg || {};
                config.url = url;
                config.key = key;
                return Boot.scripts[key] = new Entry(config);
            },

            getEntry: function (url, cfg, canonicalPath) {
                var key, entry;
                
                // Canonicalizing URLs via anchor element href yields the most correct result
                // but is *extremely* resource heavy so we need to avoid it whenever possible
                key = canonicalPath ? url : Boot.canonicalUrl(url);
                entry = Boot.scripts[key];
                
                if (!entry) {
                    entry = Boot.create(url, key, cfg);
                    
                    if (canonicalPath) {
                        entry.canonicalPath = true;
                    }
                }
                
                return entry;
            },

            registerContent: function (url, type, content) {
                var cfg = {
                    content: content,
                    loaded: true,
                    css: type === 'css'
                };

                return Boot.getEntry(url, cfg);
            },

            processRequest: function(request, sync) {
                request.loadEntries(sync);
            },

            load: function (request) {
                //<debug>
//                 _debug("Boot.load called");
                //</debug>
                var request = new Request(request);

                if (request.sync || Boot.syncMode) {
                    return Boot.loadSync(request);
                }

                // If there is a request in progress, we must
                // queue this new request to be fired  when the current request completes.
                if (Boot.currentRequest) {
                    //<debug>
//                     _debug("current active request, suspending this request");
                    //</debug>
                    // trigger assignment of entries now to ensure that overlapping
                    // entries with currently running requests will synchronize state
                    // with this pending one as they complete
                    request.getEntries();
                    Boot.suspendedQueue.push(request);
                } else {
                    Boot.currentRequest = request;
                    Boot.processRequest(request, false);
                }
                return Boot;
            },

            loadSync: function (request) {
                //<debug>
//                 _debug("Boot.loadSync called");
                //</debug>
                var request = new Request(request);

                Boot.syncMode++;
                Boot.processRequest(request, true);
                Boot.syncMode--;
                return Boot;
            },

            loadBasePrefix: function(request) {
                request = new Request(request);
                request.prependBaseUrl = true;
                return Boot.load(request);
            },

            loadSyncBasePrefix: function(request) {
                request = new Request(request);
                request.prependBaseUrl = true;
                return Boot.loadSync(request);
            },

            requestComplete: function(request) {
                var next;

                if (Boot.currentRequest === request) {
                    Boot.currentRequest = null;
                    while(Boot.suspendedQueue.length > 0) {
                        next = Boot.suspendedQueue.shift();
                        if(!next.done) {
                            //<debug>
//                             _debug("resuming suspended request");
                            //</debug>
                            Boot.load(next);
                            break;
                        }
                    }
                }
                if (!Boot.currentRequest && Boot.suspendedQueue.length == 0) {
                    Boot.fireListeners();
                }
            },

            isLoading: function () {
                return !Boot.currentRequest && Boot.suspendedQueue.length == 0;
            },

            fireListeners: function () {
                var listener;
                while (Boot.isLoading() && (listener = Boot.listeners.shift())) {
                    listener();
                }
            },

            onBootReady: function (listener) {
                if (!Boot.isLoading()) {
                    listener();
                } else {
                    Boot.listeners.push(listener);
                }
            },

            /**
             * this is a helper function used by Ext.Loader to flush out
             * 'uses' arrays for classes in some Ext versions
             */
            getPathsFromIndexes: function (indexMap, loadOrder) {
                // In older versions indexMap was an object instead of a sparse array
                if (!('length' in indexMap)) {
                    var indexArray = [],
                        index;
                    
                    for (index in indexMap) {
                        if (!isNaN(+index)) {
                            indexArray[+index] = indexMap[index];
                        }
                    }
                    
                    indexMap = indexArray;
                }
                
                return Request.prototype.getPathsFromIndexes(indexMap, loadOrder);
            },

            createLoadOrderMap: function(loadOrder) {
                return Request.prototype.createLoadOrderMap(loadOrder);
            },

            fetch: function(url, complete, scope, async) {
                async = (async === undefined) ? !!complete : async;

                var xhr = new XMLHttpRequest(),
                    result, status, content, exception = false,
                    readyStateChange = function () {
                        if (xhr && xhr.readyState == 4) {
                            status = (xhr.status === 1223) ? 204 :
                                (xhr.status === 0 && ((self.location || {}).protocol === 'file:' ||
                                    (self.location || {}).protocol === 'ionp:')) ? 200 : xhr.status;
                            content = xhr.responseText;
                            result = {
                                content: content,
                                status: status,
                                exception: exception
                            };
                            if (complete) {
                                complete.call(scope, result);
                            }
                            xhr.onreadystatechange = emptyFn;
                            xhr = null;
                        }
                    };

                if (async) {
                    xhr.onreadystatechange = readyStateChange;
                }

                try {
                    //<debug>
//                     _debug("fetching " + url + " " + (async ? "async" : "sync"));
                    //</debug>
                    xhr.open('GET', url, async);
                    xhr.send(null);
                } catch (err) {
                    exception = err;
                    readyStateChange();
                    return result;
                }

                if (!async) {
                    readyStateChange();
                }

                return result;
            },

            notifyAll: function(entry) {
                entry.notifyRequests();
            }
        };

    function Request(cfg) {
         //The request class encapsulates a series of Entry objects
         //and provides notification around the completion of all Entries
         //in this request.

        if(cfg.$isRequest) {
            return cfg;
        }

        var cfg = cfg.url ? cfg : {url: cfg},
            url = cfg.url,
            urls = url.charAt ? [ url ] : url,
            charset = cfg.charset || Boot.config.charset;

        _apply(this, cfg);
            
        delete this.url;
        this.urls = urls;
        this.charset = charset;
    };
    
    Request.prototype = {
        $isRequest: true,

        createLoadOrderMap: function (loadOrder) {
            var len = loadOrder.length,
                loadOrderMap = {},
                i, element;

            for (i = 0; i < len; i++) {
                element = loadOrder[i];
                loadOrderMap[element.path] = element;
            }

            return loadOrderMap;
        },

        getLoadIndexes: function (item, indexMap, loadOrder, includeUses, skipLoaded) {
            var resolved = [],
                queue = [item],
                itemIndex = item.idx,
                queue, entry, dependencies, depIndex, i, len;
            
            if (indexMap[itemIndex]) {
                // prevent cycles
                return resolved;
            }
            
            // Both indexMap and resolved are sparse arrays keyed by indexes.
            // This gives us a naturally sorted sequence of indexes later on
            // when we need to convert them to paths.
            // indexMap is the map of all indexes we have visited at least once
            // per the current expandUrls() invocation, and resolved is the map
            // of all dependencies for the current item that are not included
            // in indexMap.
            indexMap[itemIndex] = resolved[itemIndex] = true;
            
            while (item = queue.shift()) {
                // Canonicalizing URLs is expensive, we try to avoid it
                if (item.canonicalPath) {
                    entry = Boot.getEntry(item.path, null, true);
                }
                else {
                    entry = Boot.getEntry(this.prepareUrl(item.path));
                }
                
                if (!(skipLoaded && entry.done)) {
                    if (includeUses && item.uses && item.uses.length) {
                        dependencies = item.requires.concat(item.uses);
                    }
                    else {
                        dependencies = item.requires;
                    }
                    
                    for (i = 0, len = dependencies.length; i < len; i++) {
                        depIndex = dependencies[i];
                        
                        if (!indexMap[depIndex]) {
                            indexMap[depIndex] = resolved[depIndex] = true;
                            queue.push(loadOrder[depIndex]);
                        }
                    }
                }
            }
            
            return resolved;
        },

        getPathsFromIndexes: function (indexes, loadOrder) {
            var paths = [],
                index, len;
            
            // indexes is a sparse array with values being true for defined indexes
            for (index = 0, len = indexes.length; index < len; index++) {
                if (indexes[index]) {
                    paths.push(loadOrder[index].path);
                }
            }
            
            return paths;
        },

        expandUrl: function (url, loadOrder, loadOrderMap, indexMap, includeUses, skipLoaded) {
            var item, resolved;
            
            if (loadOrder) {
                item = loadOrderMap[url];
                
                if (item) {
                    resolved = this.getLoadIndexes(item, indexMap, loadOrder, includeUses, skipLoaded);
                    
                    if (resolved.length) {
                        return this.getPathsFromIndexes(resolved, loadOrder);
                    }
                }
            }
            
            return [url];
        },

        expandUrls: function (urls, includeUses) {
            var me = this,
                loadOrder = me.loadOrder,
                expanded = [],
                expandMap = {},
                indexMap = [],
                loadOrderMap, tmpExpanded, i, len, t, tlen, tUrl;
            
            if (typeof urls === "string") {
                urls = [urls];
            }
            
            if (loadOrder) {
                loadOrderMap = me.loadOrderMap;
                
                if (!loadOrderMap) {
                    loadOrderMap = me.loadOrderMap = me.createLoadOrderMap(loadOrder);
                }
            }
            
            for (i = 0, len = urls.length; i < len; i++) {
                // We don't want to skip loaded entries (last argument === false).
                // There are some overrides that get loaded before their respective classes,
                // and when the class dependencies are processed we don't want to skip over
                // the overrides' dependencies just because they were loaded first.
                tmpExpanded = this.expandUrl(urls[i], loadOrder, loadOrderMap, indexMap, includeUses, false);
                
                for (t = 0, tlen = tmpExpanded.length; t < tlen; t++) {
                    tUrl = tmpExpanded[t];
                    
                    if (!expandMap[tUrl]) {
                        expandMap[tUrl] = true;
                        expanded.push(tUrl);
                    }
                }
            }
            
            if (expanded.length === 0) {
                expanded = urls;
            }
            
            return expanded;
        },

        expandLoadOrder: function () {
            var me = this,
                urls = me.urls,
                expanded;

            if (!me.expanded) {
                expanded = this.expandUrls(urls, true);
                me.expanded = true;
            } else {
                expanded = urls;
            }

            me.urls = expanded;

            // if we added some urls to the request to honor the indicated
            // load order, the request needs to be sequential
            if (urls.length != expanded.length) {
                me.sequential = true;
            }

            return me;
        },

        getUrls: function () {
            this.expandLoadOrder();
            return this.urls;
        },

        prepareUrl: function(url) {
            if(this.prependBaseUrl) {
                return Boot.baseUrl + url;
            }
            return url;
        },

        getEntries: function () {
            var me = this,
                entries = me.entries,
                loadOrderMap, item, i, entry, urls, url;
            
            if (!entries) {
                entries = [];
                urls = me.getUrls();
                
                // If we have loadOrder array then the map will be expanded by now
                if (me.loadOrder) {
                    loadOrderMap = me.loadOrderMap;
                }
                
                for (i = 0; i < urls.length; i++) {
                    url = me.prepareUrl(urls[i]);
                    
                    if (loadOrderMap) {
                        item = loadOrderMap[url];
                    }
                    
                    entry = Boot.getEntry(url, {
                        buster: me.buster,
                        charset: me.charset
                    }, item && item.canonicalPath);
                    
                    entry.requests.push(me);
                    entries.push(entry);
                }
                
                me.entries = entries;
            }
            
            return entries;
        },

        loadEntries: function(sync) {
            var me = this,
                entries = me.getEntries(),
                len = entries.length,
                start = me.loadStart || 0,
                continueLoad, entries, entry, i;

            if(sync !== undefined) {
                me.sync = sync;
            }

            me.loaded = me.loaded || 0;
            me.loading = me.loading || len;

            for(i = start; i < len; i++) {
                entry = entries[i];
                if(!entry.loaded) {
                    continueLoad = entries[i].load(me.sync);
                } else {
                    continueLoad = true;
                }
                if(!continueLoad) {
                    me.loadStart = i;
                    entry.onDone(function(){
                        me.loadEntries(sync);
                    });
                    break;
                }
            }
            me.processLoadedEntries();
        },

        processLoadedEntries: function () {
            var me = this,
                entries = me.getEntries(),
                len = entries.length,
                start = me.startIndex || 0,
                i, entry;

            if (!me.done) {
                for (i = start; i < len; i++) {
                    entry = entries[i];

                    if (!entry.loaded) {
                        me.startIndex = i;
                        return;
                    }

                    if (!entry.evaluated) {
                        entry.evaluate();
                    }

                    if (entry.error) {
                        me.error = true;
                    }
                }
                me.notify();
            }
        },

        notify: function () {
            var me = this;
            if (!me.done) {
                var error = me.error,
                    fn = me[error ? 'failure' : 'success'],
                    delay = ('delay' in me)
                        ? me.delay
                        : (error ? 1 : Boot.config.chainDelay),
                    scope = me.scope || me;
                me.done = true;
                if (fn) {
                    if (delay === 0 || delay > 0) {
                        // Free the stack (and defer the next script)
                        setTimeout(function () {
                            fn.call(scope, me);
                        }, delay);
                    } else {
                        fn.call(scope, me);
                    }
                }
                me.fireListeners();
                Boot.requestComplete(me);
            }
        },

        onDone: function(listener) {
            var me = this,
                listeners = me.listeners || (me.listeners = []);
            if(me.done) {
                listener(me);
            } else {
                listeners.push(listener);
            }
        },

        fireListeners: function() {
            var listeners = this.listeners,
                listener;
            if(listeners) {
                //<debug>
//                 _debug("firing request listeners");
                //</debug>
                while((listener = listeners.shift())) {
                    listener(this);
                }
            }
        }
    };

    function Entry(cfg) {
         //The Entry class is a token to manage the load and evaluation
         //state of a particular url.  It is used to notify all Requests
         //interested in this url that the content is available.

        if(cfg.$isEntry) {
            return cfg;
        }

        //<debug>
//         _debug("creating entry for " + cfg.url);
        //</debug>

        var charset = cfg.charset || Boot.config.charset,
            manifest = Ext.manifest,
            loader = manifest && manifest.loader,
            cache = (cfg.cache !== undefined) ? cfg.cache : (loader && loader.cache),
            buster, busterParam;

        if (Boot.config.disableCaching) {
            if (cache === undefined) {
                cache = !Boot.config.disableCaching;
            }

            if (cache === false) {
                buster = +new Date();
            } else if (cache !== true) {
                buster = cache;
            }

            if (buster) {
                busterParam = (loader && loader.cacheParam) || Boot.config.disableCachingParam;
                buster = busterParam + "=" + buster;
            }
        }

        _apply(this, cfg);
        
        this.charset = charset;
        this.buster = buster;
        this.requests = [];
    };
    
    Entry.prototype = {
        $isEntry: true,
        done: false,
        evaluated: false,
        loaded: false,

        isCrossDomain: function() {
            var me = this;
            if(me.crossDomain === undefined) {
                //<debug>
//                 _debug("checking " + me.getLoadUrl() + " for prefix " + Boot.origin);
                //</debug>
                me.crossDomain = (me.getLoadUrl().indexOf(Boot.origin) !== 0);
            }
            return me.crossDomain;
        },

        isCss: function () {
            var me = this;
            if (me.css === undefined) {
                if (me.url) {
                    var assetConfig = Boot.assetConfig[me.url];
                    me.css = assetConfig ? assetConfig.type === "css" : cssRe.test(me.url);
                } else {
                    me.css = false;
                }
            }
            return this.css;
        },

        getElement: function (tag) {
            var me = this,
                el = me.el;
            if (!el) {
                //<debug>
//                 _debug("creating element for " + me.url);
                //</debug>
                if (me.isCss()) {
                    tag = tag || "link";
                    el = doc.createElement(tag);
                    if(tag == "link") {
                        el.rel = 'stylesheet';
                        me.prop = 'href';
                    } else {
                        me.prop="textContent";
                    }
                    el.type = "text/css";
                } else {
                    tag = tag || "script";
                    el = doc.createElement(tag);
                    el.type = 'text/javascript';
                    me.prop = 'src';

                    if (me.charset) {
                        el.charset = me.charset;
                    }

                    if (Boot.hasAsync) {
                        el.async = false;
                    }
                }
                me.el = el;
            }
            return el;
        },

        getLoadUrl: function () {
            var me = this,
                url;
            
            url = me.canonicalPath ? me.url : Boot.canonicalUrl(me.url);
            
            if (!me.loadUrl) {
                me.loadUrl = !!me.buster
                    ? (url + (url.indexOf('?') === -1 ? '?' : '&') + me.buster)
                    : url;
            }
            return me.loadUrl;
        },

        fetch: function (req) {
            var url = this.getLoadUrl(),
                async = !!req.async,
                complete = req.complete;

            Boot.fetch(url, complete, this, async);
        },

        onContentLoaded: function (response) {
            var me = this,
                status = response.status,
                content = response.content,
                exception = response.exception,
                url = this.getLoadUrl();
            me.loaded = true;
            if ((exception || status === 0) && !_environment.phantom) {
                me.error =
                    //<debug>
                    ("Failed loading synchronously via XHR: '" + url +
                        "'. It's likely that the file is either being loaded from a " +
                        "different domain or from the local file system where cross " +
                        "origin requests are not allowed for security reasons. Try " +
                        "asynchronous loading instead.") ||
                    //</debug>
                    true;
                me.evaluated = true;
            }
            else if ((status >= 200 && status < 300) || status === 304
                || _environment.phantom
                || (status === 0 && content.length > 0)
                ) {
                me.content = content;
            }
            else {
                me.error =
                    //<debug>
                    ("Failed loading synchronously via XHR: '" + url +
                        "'. Please verify that the file exists. XHR status code: " +
                        status) ||
                    //</debug>
                    true;
                me.evaluated = true;
            }
        },

        createLoadElement: function(callback) {
            var me = this,
                el = me.getElement();
            
            me.preserve = true;
            
            el.onerror = function() {
                me.error = true;
                
                if (callback) {
                    callback();
                    callback = null;
                }
            };
            
            if (Boot.isIE10m) {
                el.onreadystatechange = function() {
                    if (this.readyState === 'loaded' || this.readyState === 'complete') {
                        if (callback) {
                            callback();
                            callback = this.onreadystatechange = this.onerror = null;
                        }
                    }
                };
            }
            else {
                el.onload = function() {
                    callback();
                    callback = this.onload = this.onerror = null;
                };
            }
            
            // IE starts loading here
            el[me.prop] = me.getLoadUrl();
        },

        onLoadElementReady: function() {
            Boot.getHead().appendChild(this.getElement());
            this.evaluated = true;
        },

        inject: function (content, asset) {
            //<debug>
//             _debug("injecting content for " + this.url);
            //</debug>
            var me = this,
                head = Boot.getHead(),
                url = me.url,
                key = me.key,
                base, el, ieMode, basePath;

            if (me.isCss()) {
                me.preserve = true;
                basePath = key.substring(0, key.lastIndexOf("/") + 1);
                base = doc.createElement('base');
                base.href = basePath;
                if(head.firstChild) {
                    head.insertBefore(base, head.firstChild);
                } else {
                    head.appendChild(base);
                }
                // reset the href attribute to cuase IE to pick up the change
                base.href = base.href;

                if (url) {
                    content += "\n/*# sourceURL=" + key + " */";
                }

                // create element after setting base
                el = me.getElement("style");

                ieMode = ('styleSheet' in el);

                head.appendChild(base);
                if(ieMode) {
                    head.appendChild(el);
                    el.styleSheet.cssText = content;
                } else {
                    el.textContent = content;
                    head.appendChild(el);
                }
                head.removeChild(base);

            } else {
                // Debugger friendly, file names are still shown even though they're
                // eval'ed code. Breakpoints work on both Firebug and Chrome's Web
                // Inspector.
                if (url) {
                    content += "\n//# sourceURL=" + key;
                }
                Ext.globalEval(content);
            }
            return me;
        },

        loadCrossDomain: function() {
            var me = this,
                complete = function(){
                    me.el.onerror = me.el.onload = emptyFn;
                    me.el = null;
                    me.loaded = me.evaluated = me.done = true;
                    me.notifyRequests();
                };
            me.createLoadElement(function(){
                complete();
            });
            me.evaluateLoadElement();
            // at this point, we need sequential evaluation,
            // which means we can't advance the load until
            // this entry has fully completed
            return false;
        },

        loadElement: function() {
            var me = this,
                complete = function(){
                    me.el.onerror = me.el.onload = emptyFn;
                    me.el = null;
                    me.loaded = me.evaluated = me.done = true;
                    me.notifyRequests();
                };
            me.createLoadElement(function(){
                complete();
            });
            me.evaluateLoadElement();
            return true;
        },

        loadSync: function() {
            var me = this;
            me.fetch({
                async: false,
                complete: function (response) {
                    me.onContentLoaded(response);
                }
            });
            me.evaluate();
            me.notifyRequests();
        },

        load: function (sync) {
            var me = this;
            if (!me.loaded) {
                if(me.loading) {
                    // if we're calling back through load and we're loading but haven't
                    // yet loaded, then we should be in a sequential, cross domain
                    // load scenario which means we can't continue the load on the
                    // request until this entry has fully evaluated, which will mean
                    // loaded = evaluated = done = true in one step.  For css files, this
                    // will happen immediately upon <link> element creation / insertion,
                    // but <script> elements will set this upon load notification
                    return false;
                }
                me.loading = true;

                // for async modes, we have some options
                if (!sync) {
                    // if cross domain, just inject the script tag and let the onload
                    // events drive the progression.
                    // IE10 also needs sequential loading because of a bug that makes it
                    // fire readystate event prematurely:
                    // https://connect.microsoft.com/IE/feedback/details/729164/ie10-dynamic-script-element-fires-loaded-readystate-prematurely
                    if (Boot.isIE10 || me.isCrossDomain()) {
                        return me.loadCrossDomain();
                    }
                    // for IE, use the readyStateChange allows us to load scripts in parallel
                    // but serialize the evaluation by appending the script node to the
                    // document
                    else if(!me.isCss() && Boot.hasReadyState) {
                        me.createLoadElement(function () {
                            me.loaded = true;
                            me.notifyRequests();
                        });
                    }

                    else if(Boot.useElements &&
                        // older webkit, phantomjs included, won't fire load for link elements
                        !(me.isCss() && _environment.phantom)) {
                        return me.loadElement();
                    }
                    // for other browsers, just ajax the content down in parallel, and use
                    // globalEval to serialize evaluation
                    else {
                        me.fetch({
                            async: !sync,
                            complete: function (response) {
                                me.onContentLoaded(response);
                                me.notifyRequests();
                            }
                        });
                    }
                }

                // for sync mode in js, global eval FTW.  IE won't honor the comment
                // paths in the debugger, so eventually we need a sync mode for IE that
                // uses the readyStateChange mechanism
                else {
                    me.loadSync();
                }
            }
            // signal that the load process can continue
            return true;
        },

        evaluateContent: function () {
            this.inject(this.content);
            this.content = null;
        },

        evaluateLoadElement: function() {
            Boot.getHead().appendChild(this.getElement());
        },

        evaluate: function () {
            var me = this;
            if(!me.evaluated) {
                if(me.evaluating) {
                    return;
                }
                me.evaluating = true;
                if(me.content !== undefined) {
                    me.evaluateContent();
                } else if(!me.error) {
                    me.evaluateLoadElement();
                }
                me.evaluated = me.done = true;
                me.cleanup();
            }
        },

        cleanup: function () {
            var me = this,
                el = me.el,
                prop;

            if (!el) {
                return;
            }

            if (!me.preserve) {
                me.el = null;

                el.parentNode.removeChild(el); // Remove, since its useless now

                for (prop in el) {
                    try {
                        if (prop !== me.prop) {
                            // If we set the src property to null IE
                            // will try and request a script at './null'
                            el[prop] = null;
                        }
                        delete el[prop];      // and prepare for GC
                    } catch (cleanEx) {
                        //ignore
                    }
                }
            }

            // Setting to null can cause exceptions if IE ever needs to call these
            // again (like onreadystatechange). This emptyFn has nothing locked in
            // closure scope so it is about as safe as null for memory leaks.
            el.onload = el.onerror = el.onreadystatechange = emptyFn;
        },

        notifyRequests: function () {
            var requests = this.requests,
                len = requests.length,
                i, request;
            for (i = 0; i < len; i++) {
                request = requests[i];
                request.processLoadedEntries();
            }
            if(this.done) {
                this.fireListeners();
            }
        },

        onDone: function(listener) {
            var me = this,
                listeners = me.listeners || (me.listeners = []);
            if(me.done) {
                listener(me);
            } else {
                listeners.push(listener);
            }
        },

        fireListeners: function() {
            var listeners = this.listeners,
                listener;
            if(listeners && listeners.length > 0) {
                //<debug>
//                 _debug("firing event listeners for url " + this.url);
                //</debug>
                while((listener = listeners.shift())) {
                    listener(this);
                }
            }
        }
    };

    /**
     * Turns on or off the "cache buster" applied to dynamically loaded scripts. Normally
     * dynamically loaded scripts have an extra query parameter appended to avoid stale
     * cached scripts. This method can be used to disable this mechanism, and is primarily
     * useful for testing. This is done using a cookie.
     * @param {Boolean} disable True to disable the cache buster.
     * @param {String} [path="/"] An optional path to scope the cookie.
     */
    Ext.disableCacheBuster = function (disable, path) {
        var date = new Date();
        date.setTime(date.getTime() + (disable ? 10 * 365 : -1) * 24 * 60 * 60 * 1000);
        date = date.toGMTString();
        doc.cookie = 'ext-cache=1; expires=' + date + '; path=' + (path || '/');
    };

//<if nonBrowser>
    if (_environment.node) {
        Boot.prototype.load = Boot.prototype.loadSync = function (request) {
            // @TODO
            require(filePath);
            onLoad.call(scope);
        };
        Boot.prototype.init = emptyFn;
    }
//</if>

    Boot.init();
    return Boot;

// NOTE: We run the eval at global scope to protect the body of the function and allow
// compressors to still process it.
}(function () {
}));//(eval("/*@cc_on!@*/!1"));

/**
 * This method evaluates the given code free of any local variable. This
 * will be at global scope, in others it will be in a function.
 * @param {String} code The code to evaluate.
 * @private
 * @method
 * @member Ext
 */
Ext.globalEval = Ext.globalEval || (this.execScript
    ? function (code) { execScript(code); }
    : function ($$code) { eval.call(window, $$code); });

//<feature legacyBrowser>
/*
 * Only IE8 & IE/Quirks lack Function.prototype.bind so we polyfill that here.
 */
if (!Function.prototype.bind) {
    (function () {
        var slice = Array.prototype.slice,
        // To reduce overhead on call of the bound fn we have two flavors based on
        // whether we have args to prepend or not:
            bind = function (me) {
                var args = slice.call(arguments, 1),
                    method = this;

                if (args.length) {
                    return function () {
                        var t = arguments;
                        // avoid the slice/concat if the caller does not supply args
                        return method.apply(me, t.length ? args.concat(slice.call(t)) : args);
                    };
                }
                // this is the majority use case - just fn.bind(this) and no args

                args = null;
                return function () {
                    return method.apply(me, arguments);
                };
            };
        Function.prototype.bind = bind;
        bind.$extjs = true; // to detect this polyfill if one want to improve it
    }());
}
//</feature>

//</editor-fold>

Ext.setResourcePath = function (poolName, path) {
    var manifest = Ext.manifest || (Ext.manifest = {}),
        paths = manifest.resources || (manifest.resources = {});

    if (manifest) {
        if (typeof poolName !== 'string') {
            Ext.apply(paths, poolName);
        } else {
            paths[poolName] = path;
        }
        manifest.resources = paths;
    }
};

Ext.getResourcePath = function (path, poolName, packageName) {
    if (typeof path !== 'string') {
        poolName = path.pool;
        packageName = path.packageName;
        path = path.path;
    }
    var manifest = Ext.manifest,
        paths = manifest && manifest.resources,
        poolPath = paths[poolName],
        output = [];

    if (poolPath == null) {
        poolPath = paths.path;
        if (poolPath == null) {
            poolPath = 'resources';
        }
    }

    if (poolPath) {
        output.push(poolPath);
    }

    if (packageName) {
        output.push(packageName);
    }

    output.push(path);
    return output.join('/');
};