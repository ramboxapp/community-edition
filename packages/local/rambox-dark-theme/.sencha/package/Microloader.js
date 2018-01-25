// here, the extra check for window['Ext'] is needed for use with cmd-test
// code injection.  we need to make that this file will sync up with page global
// scope to avoid duplicate Ext.Boot state.  That check is after the initial Ext check
// to allow the sandboxing template to inject an appropriate Ext var and prevent the
// global detection.
var Ext = Ext || window['Ext'] || {};


//<editor-fold desc="Microloader">
/**
 * @class Ext.Microloader
 * @private
 * @singleton
 */
Ext.Microloader = Ext.Microloader || (function () {
    var Boot = Ext.Boot,
    //<debug>
        _debug = function (message) {
            //console.log(message);
        },
    //</debug>
        _warn = function (message) {
            console.log("[WARN] " + message);
        },
        _privatePrefix = '_ext:' + location.pathname,

        /**
         * @method getStorageKey
         * The Following combination is used to create isolated local storage keys
         * '_ext' is used to scope all the local storage keys that we internally by Ext
         * 'location.pathname' is used to force each assets to cache by an absolute URL (/build/MyApp) (dev vs prod)
         * 'url' is used to force each asset to cache relative to the page (app.json vs resources/app.css)
         * 'profileId' is used to differentiate the builds of an application (neptune vs crisp)
         * 'Microloader.appId' is unique to the application and will differentiate apps on the same host (dev mode running app watch against multiple apps)
         */
        getStorageKey = function(url, profileId) {
            return  _privatePrefix + url + '-' + (profileId ? profileId + '-' : '') + Microloader.appId;
        },
        postProcessor, _storage;

    try {
        _storage = window['localStorage'];
    } catch(ex) {
        // ignore
    }

    var _cache = window['applicationCache'],
        // Local Storage Controller
        LocalStorage = {
            clearAllPrivate: function(manifest) {
                if(_storage) {

                    //Remove the entry for the manifest first
                    _storage.removeItem(manifest.key);

                    var i, key,
                        removeKeys = [],
                        suffix = manifest.profile + '-' + Microloader.appId,
                        ln = _storage.length;
                    for (i = 0; i < ln; i++) {
                        key = _storage.key(i);
                        // If key starts with the private key and the suffix is present we can clear this entry
                        if (key.indexOf(_privatePrefix) === 0 && key.indexOf(suffix) !== -1) {
                            removeKeys.push(key);
                        }
                    }

                    for(i in removeKeys) {
                        //<debug>
                        _debug("Removing "+ removeKeys[i] + " from Local Storage");
                        //</debug>
                        _storage.removeItem(removeKeys[i]);
                    }
                }
            },
            /**
             * @private
             */
            retrieveAsset: function (key) {
                try {
                    return _storage.getItem(key);
                }
                catch (e) {
                    // Private browsing mode
                    return null;
                }
            },

            setAsset: function(key, content) {
                try {
                    if (content === null || content == '') {
                        _storage.removeItem(key);
                    } else {
                        _storage.setItem(key, content);
                    }
                }
                catch (e) {
                    if (_storage && e.code == e.QUOTA_EXCEEDED_ERR) {
                        //<debug>
                        _warn("LocalStorage Quota exceeded, cannot store " + key + " locally");
                        //</debug>
                    }
                }
            }
        };

        var Asset = function (cfg) {
            if (typeof cfg.assetConfig === 'string') {
                this.assetConfig = {
                    path: cfg.assetConfig
                };
            } else {
                this.assetConfig = cfg.assetConfig;
            }

            this.type = cfg.type;
            this.key = getStorageKey(this.assetConfig.path, cfg.manifest.profile);

            if (cfg.loadFromCache) {
                this.loadFromCache();
            }
        };

        Asset.prototype = {
            shouldCache: function() {
                return _storage && this.assetConfig.update && this.assetConfig.hash && !this.assetConfig.remote;
            },

            is: function (asset) {
                return (!!asset && this.assetConfig && asset.assetConfig && (this.assetConfig.hash === asset.assetConfig.hash))
            },

            cache: function(content) {
                if (this.shouldCache()) {
                    LocalStorage.setAsset(this.key, content || this.content);
                }
            },

            uncache: function() {
                LocalStorage.setAsset(this.key, null);
            },

            updateContent: function (content) {
                this.content = content;
            },

            getSize: function () {
                return this.content ? this.content.length : 0;
            },

            loadFromCache: function() {
                if (this.shouldCache()) {
                    this.content = LocalStorage.retrieveAsset(this.key);
                }
            }
        };

        var Manifest = function (cfg) {
            if (typeof cfg.content === "string") {
                this.content = JSON.parse(cfg.content);
            } else {
                this.content = cfg.content;
            }
            this.assetMap = {};

            this.url = cfg.url;
            this.fromCache = !!cfg.cached;
            this.assetCache = !(cfg.assetCache === false);
            this.key = getStorageKey(this.url);

            // Pull out select properties for repetitive use
            this.profile = this.content.profile;
            this.hash = this.content.hash;
            this.loadOrder = this.content.loadOrder;
            this.deltas = this.content.cache ? this.content.cache.deltas : null;
            this.cacheEnabled = this.content.cache ? this.content.cache.enable : false;

            this.loadOrderMap = (this.loadOrder) ? Boot.createLoadOrderMap(this.loadOrder) : null;

            var tags = this.content.tags,
                platformTags = Ext.platformTags;

            if (tags) {
                if (tags instanceof Array) {
                    for (var i = 0; i < tags.length; i++) {
                        platformTags[tags[i]] = true;
                    }
                } else {
                    Boot.apply(platformTags, tags);
                }

                // re-apply the query parameters, so that the params as specified
                // in the url always has highest priority
                Boot.apply(platformTags, Boot.loadPlatformsParam());
            }

            // Convert all assets into Assets
            this.js = this.processAssets(this.content.js, 'js');
            this.css = this.processAssets(this.content.css, 'css');
        };

        Manifest.prototype = {
            processAsset:  function(assetConfig, type) {
                var processedAsset = new Asset({
                    manifest: this,
                    assetConfig: assetConfig,
                    type: type,
                    loadFromCache: this.assetCache
                });
                this.assetMap[assetConfig.path] = processedAsset;
                return processedAsset;
            },

            processAssets: function(assets, type) {
                var results = [],
                    ln = assets.length,
                    i, assetConfig;

                for (i = 0; i < ln; i++) {
                    assetConfig = assets[i];
                    results.push(this.processAsset(assetConfig, type));
                }

                return results;
            },

            useAppCache: function() {
                return true;
            },

            // Concatenate all assets for easy access
            getAssets: function () {
                return this.css.concat(this.js);
            },

            getAsset: function (path) {
                return this.assetMap[path];
            },

            shouldCache: function() {
                return this.hash && this.cacheEnabled;
            },

            cache: function(content) {
                if (this.shouldCache()) {
                    LocalStorage.setAsset(this.key, JSON.stringify(content || this.content));
                }
                //<debug>
                else {
                    _debug("Manifest caching is disabled.");
                }
                //</debug>
            },

            is: function(manifest) {
                //<debug>
                _debug("Testing Manifest: " + this.hash + " VS " +  manifest.hash);
                //</debug>
                return this.hash === manifest.hash;
            },

            // Clear the manifest from local storage
            uncache: function() {
                LocalStorage.setAsset(this.key, null);
            },

            exportContent: function() {
                return Boot.apply({
                    loadOrderMap: this.loadOrderMap
                }, this.content);
            }
        };

        /**
         * Microloader
         * @type {Array}
         * @private
         */
        var _listeners = [],
        _loaded = false,
        Microloader = {
            init: function () {
                Ext.microloaded = true;

                // data-app is in the dev template for an application and is also
                // injected into the app my CMD for production
                // We use this to prefix localStorage cache to prevent collisions
                var microloaderElement = document.getElementById('microloader');
                Microloader.appId = microloaderElement ? microloaderElement.getAttribute('data-app') : '';

                if (Ext.beforeLoad) {
                    postProcessor = Ext.beforeLoad(Ext.platformTags);
                }

                var readyHandler = Ext._beforereadyhandler;

                Ext._beforereadyhandler = function () {
                    if (Ext.Boot !== Boot) {
                        Ext.apply(Ext.Boot, Boot);
                        Ext.Boot = Boot;
                    }
                    if (readyHandler) {
                        readyHandler();
                    }
                };
            },

            applyCacheBuster: function(url) {
                var tstamp = new Date().getTime(),
                    sep = url.indexOf('?') === -1 ? '?' : '&';
                url = url + sep + "_dc=" + tstamp;
                return url;
            },

            run: function() {
                Microloader.init();
                var manifest = Ext.manifest;

                if (typeof manifest === "string") {
                    var extension = ".json",
                        url = manifest.indexOf(extension) === manifest.length - extension.length
                            ? manifest
                            : manifest + ".json",
                        key = getStorageKey(url),
                        content = LocalStorage.retrieveAsset(key);

                    // Manifest found in local storage, use this for immediate boot except in PhantomJS environments for building.
                    if (content) {
                        //<debug>
                            _debug("Manifest file, '" + url + "', was found in Local Storage");
                        //</debug>
                        manifest = new Manifest({
                            url: url,
                            content: content,
                            cached: true
                        });
                        if (postProcessor) {
                            postProcessor(manifest);
                        }
                        Microloader.load(manifest);


                    // Manifest is not in local storage. Fetch it from the server
                    } else {
                        Boot.fetch(Microloader.applyCacheBuster(url), function (result) {
                            //<debug>
                                _debug("Manifest file was not found in Local Storage, loading: " + url);
                            //</debug>
                            manifest = new Manifest({
                                url: url,
                                content: result.content
                            });

                            manifest.cache();
                            if (postProcessor) {
                                postProcessor(manifest);
                            }
                            Microloader.load(manifest);
                        });
                    }

                // Embedded Manifest into JS file
                } else {
                    //<debug>
                        _debug("Manifest was embedded into application javascript file");
                    //</debug>
                    manifest = new Manifest({
                        content: manifest
                    });
                    Microloader.load(manifest);
                }
            },

            /**
             * @param {Manifest} manifest
             */
            load: function (manifest) {
                Microloader.urls = [];
                Microloader.manifest = manifest;
                Ext.manifest = Microloader.manifest.exportContent();

                var assets = manifest.getAssets(),
                    cachedAssets = [],
                    asset, i, len, include, entry;

                for (len = assets.length, i = 0; i < len; i++) {
                    asset = assets[i];
                    include = Microloader.filterAsset(asset);
                    if (include) {
                        // Asset is using the localStorage caching system
                        if (manifest.shouldCache() && asset.shouldCache()) {
                            // Asset already has content from localStorage, instantly seed that into boot
                            if (asset.content) {
                                //<debug>
                                    _debug("Asset: " + asset.assetConfig.path + " was found in local storage. No remote load for this file");
                                //</debug>
                                entry = Boot.registerContent(asset.assetConfig.path, asset.type, asset.content);
                                if (entry.evaluated) {
                                    _warn("Asset: " + asset.assetConfig.path + " was evaluated prior to local storage being consulted.");
                                }
                            //load via AJAX and seed content into Boot
                            } else {
                                //<debug>
                                    _debug("Asset: " + asset.assetConfig.path + " was NOT found in local storage. Adding to load queue");
                                //</debug>
                                cachedAssets.push(asset);
                            }
                        }
                        Microloader.urls.push(asset.assetConfig.path);
                        Boot.assetConfig[asset.assetConfig.path] = Boot.apply({type: asset.type}, asset.assetConfig);
                    }
                }

                // If any assets are using the caching system and do not have local versions load them first via AJAX
                if (cachedAssets.length > 0) {
                    Microloader.remainingCachedAssets = cachedAssets.length;
                    while (cachedAssets.length > 0) {
                        asset = cachedAssets.pop();
                        //<debug>
                            _debug("Preloading/Fetching Cached Assets from: " + asset.assetConfig.path);
                        //</debug>
                        Boot.fetch(asset.assetConfig.path, (function(asset) {
                            return function(result) {
                                Microloader.onCachedAssetLoaded(asset, result);
                            }
                        })(asset));
                    }
                } else {
                    Microloader.onCachedAssetsReady();
                }
            },

            // Load the asset and seed its content into Boot to be evaluated in sequence
            onCachedAssetLoaded: function (asset, result) {
                var checksum;
                result = Microloader.parseResult(result);
                Microloader.remainingCachedAssets--;

                if (!result.error) {
                    checksum = Microloader.checksum(result.content, asset.assetConfig.hash);
                    if (!checksum) {
                        _warn("Cached Asset '" + asset.assetConfig.path + "' has failed checksum. This asset will be uncached for future loading");

                        // Un cache this asset so it is loaded next time
                        asset.uncache();
                    }

                    //<debug>
                        _debug("Checksum for Cached Asset: " + asset.assetConfig.path + " is " + checksum);
                    //</debug>
                    Boot.registerContent(asset.assetConfig.path, asset.type, result.content);
                    asset.updateContent(result.content);
                    asset.cache();
                } else {
                    _warn("There was an error pre-loading the asset '" + asset.assetConfig.path + "'. This asset will be uncached for future loading");

                    // Un cache this asset so it is loaded next time
                    asset.uncache();
                }

                if (Microloader.remainingCachedAssets === 0) {
                    Microloader.onCachedAssetsReady();
                }
            },

            onCachedAssetsReady: function(){
                Boot.load({
                    url: Microloader.urls,
                    loadOrder: Microloader.manifest.loadOrder,
                    loadOrderMap: Microloader.manifest.loadOrderMap,
                    sequential: true,
                    success: Microloader.onAllAssetsReady,
                    failure: Microloader.onAllAssetsReady
                });
            },

            onAllAssetsReady: function() {
                _loaded = true;
                Microloader.notify();

                if (navigator.onLine !== false) {
                    //<debug>
                        _debug("Application is online, checking for updates");
                    //</debug>
                    Microloader.checkAllUpdates();
                }
                else {
                    //<debug>
                        _debug("Application is offline, adding online listener to check for updates");
                    //</debug>
                    if(window['addEventListener']) {
                        window.addEventListener('online', Microloader.checkAllUpdates, false);
                    }
                }
            },

            onMicroloaderReady: function (listener) {
                if (_loaded) {
                    listener();
                } else {
                    _listeners.push(listener);
                }
            },

            /**
             * @private
             */
            notify: function () {
                //<debug>
                    _debug("notifying microloader ready listeners.");
                //</debug>
                var listener;
                while((listener = _listeners.shift())) {
                    listener();
                }
            },

            // Delta patches content
            patch: function (content, delta) {
                var output = [],
                    chunk, i, ln;

                if (delta.length === 0) {
                    return content;
                }

                for (i = 0,ln = delta.length; i < ln; i++) {
                    chunk = delta[i];

                    if (typeof chunk === 'number') {
                        output.push(content.substring(chunk, chunk + delta[++i]));
                    }
                    else {
                        output.push(chunk);
                    }
                }

                return output.join('');
            },

            checkAllUpdates: function() {
                //<debug>
                    _debug("Checking for All Updates");
                //</debug>
                if(window['removeEventListener']) {
                    window.removeEventListener('online', Microloader.checkAllUpdates, false);
                }

                if(_cache) {
                    Microloader.checkForAppCacheUpdate();
                }

                // Manifest came from a cached instance, check for updates
                if (Microloader.manifest.fromCache) {
                    Microloader.checkForUpdates();
                }
            },

            checkForAppCacheUpdate: function() {
                //<debug>
                    _debug("Checking App Cache status");
                //</debug>
                if (_cache.status === _cache.UPDATEREADY || _cache.status === _cache.OBSOLETE) {
                    //<debug>
                        _debug("App Cache is already in an updated");
                    //</debug>
                    Microloader.appCacheState = 'updated';
                } else if (_cache.status !== _cache.IDLE && _cache.status !== _cache.UNCACHED) {
                    //<debug>
                        _debug("App Cache is checking or downloading updates, adding listeners");
                    //</debug>
                    Microloader.appCacheState = 'checking';
                    _cache.addEventListener('error', Microloader.onAppCacheError);
                    _cache.addEventListener('noupdate', Microloader.onAppCacheNotUpdated);
                    _cache.addEventListener('cached', Microloader.onAppCacheNotUpdated);
                    _cache.addEventListener('updateready', Microloader.onAppCacheReady);
                    _cache.addEventListener('obsolete', Microloader.onAppCacheObsolete);
                } else {
                    //<debug>
                        _debug("App Cache is current or uncached");
                    //</debug>
                    Microloader.appCacheState = 'current';
                }
            },

            checkForUpdates: function() {
                // Fetch the Latest Manifest from the server
                //<debug>
                    _debug("Checking for updates at: " + Microloader.manifest.url);
                //</debug>
                Boot.fetch(Microloader.applyCacheBuster(Microloader.manifest.url), Microloader.onUpdatedManifestLoaded);
            },

            onAppCacheError: function(e) {
                _warn(e.message);

                Microloader.appCacheState = 'error';
                Microloader.notifyUpdateReady();
            },

            onAppCacheReady: function() {
                _cache.swapCache();
                Microloader.appCacheUpdated();
            },

            onAppCacheObsolete: function() {
                Microloader.appCacheUpdated();
            },

            appCacheUpdated: function() {
                //<debug>
                    _debug("App Cache Updated");
                //</debug>
                Microloader.appCacheState = 'updated';
                Microloader.notifyUpdateReady();
            },

            onAppCacheNotUpdated: function() {
                //<debug>
                    _debug("App Cache Not Updated Callback");
                //</debug>
                Microloader.appCacheState = 'current';
                Microloader.notifyUpdateReady();
            },


            filterAsset: function(asset) {
                var cfg = (asset && asset.assetConfig) || {};
                if(cfg.platform || cfg.exclude) {
                    return Boot.filterPlatform(cfg.platform, cfg.exclude);
                }
                return true;
            },

            onUpdatedManifestLoaded: function (result) {
                result = Microloader.parseResult(result);

                if (!result.error) {
                    var currentAssets, newAssets, currentAsset, newAsset, prop,
                        assets, deltas, deltaPath, include,
                        updatingAssets = [],
                        manifest = new Manifest({
                            url: Microloader.manifest.url,
                            content: result.content,
                            assetCache: false
                        });

                    Microloader.remainingUpdatingAssets = 0;
                    Microloader.updatedAssets = [];
                    Microloader.removedAssets = [];
                    Microloader.updatedManifest = null;
                    Microloader.updatedAssetsReady = false;

                    // If the updated manifest has turned off caching we need to clear out all local storage
                    // and trigger a appupdate as all content is now uncached
                    if (!manifest.shouldCache()) {
                        //<debug>
                        _debug("New Manifest has caching disabled, clearing out any private storage");
                        //</debug>

                        Microloader.updatedManifest = manifest;
                        LocalStorage.clearAllPrivate(manifest);
                        Microloader.onAllUpdatedAssetsReady();
                        return;
                    }

                    // Manifest itself has changed
                    if (!Microloader.manifest.is(manifest)) {
                        Microloader.updatedManifest = manifest;

                        currentAssets = Microloader.manifest.getAssets();
                        newAssets = manifest.getAssets();

                        // Look through new assets for assets that do not exist or assets that have different versions
                        for (prop in newAssets) {
                            newAsset = newAssets[prop];
                            currentAsset = Microloader.manifest.getAsset(newAsset.assetConfig.path);
                            include = Microloader.filterAsset(newAsset);

                            if (include && (!currentAsset || (newAsset.shouldCache() && (!currentAsset.is(newAsset))))) {
                                //<debug>
                                    _debug("New/Updated Version of Asset: " + newAsset.assetConfig.path + " was found in new manifest");
                                //</debug>
                                updatingAssets.push({_new: newAsset, _current: currentAsset});
                            }
                        }

                        // Look through current assets for stale/old assets that have been removed
                        for (prop in currentAssets) {
                            currentAsset = currentAssets[prop];
                            newAsset = manifest.getAsset(currentAsset.assetConfig.path);

                            //New version of this asset has been filtered out
                            include = !Microloader.filterAsset(newAsset);

                            if (!include || !newAsset || (currentAsset.shouldCache() && !newAsset.shouldCache())) {
                                //<debug>
                                    _debug("Asset: " + currentAsset.assetConfig.path + " was not found in new manifest, has been filtered out or has been switched to not cache. Marked for removal");
                                //</debug>
                                Microloader.removedAssets.push(currentAsset);
                            }
                        }

                        // Loop through all assets that need updating
                        if (updatingAssets.length > 0) {
                            Microloader.remainingUpdatingAssets = updatingAssets.length;
                            while (updatingAssets.length > 0) {
                                assets = updatingAssets.pop();
                                newAsset = assets._new;
                                currentAsset = assets._current;

                                // Full Updates will simply download the file and replace its current content
                                if (newAsset.assetConfig.update === "full" || !currentAsset) {

                                    //<debug>
                                    if (newAsset.assetConfig.update === "delta") {
                                        _debug("Delta updated asset found without current asset available: " + newAsset.assetConfig.path + " fetching full file");
                                    } else {
                                        _debug("Full update found for: " + newAsset.assetConfig.path + " fetching");
                                    }
                                    //</debug>

                                    // Load the asset and cache its  its content into Boot to be evaluated in sequence
                                    Boot.fetch(newAsset.assetConfig.path, (function (asset) {
                                            return function (result) {
                                                Microloader.onFullAssetUpdateLoaded(asset, result)
                                            };
                                        }(newAsset))
                                    );

                                    // Delta updates will be given a delta patch
                                } else if (newAsset.assetConfig.update === "delta") {
                                    deltas = manifest.deltas;
                                    deltaPath = deltas + "/" + newAsset.assetConfig.path + "/" + currentAsset.assetConfig.hash + ".json";
                                    // Fetch the Delta Patch and update the contents of the asset
                                    //<debug>
                                        _debug("Delta update found for: " + newAsset.assetConfig.path + " fetching");
                                    //</debug>
                                    Boot.fetch(deltaPath,
                                        (function (asset, oldAsset) {
                                            return function (result) {
                                                Microloader.onDeltaAssetUpdateLoaded(asset, oldAsset, result)
                                            };
                                        }(newAsset, currentAsset))
                                    );
                                }
                            }
                        } else {
                            //<debug>
                                _debug("No Assets needed updating");
                            //</debug>
                            Microloader.onAllUpdatedAssetsReady();
                        }
                    } else {
                        //<debug>
                            _debug("Manifest files have matching hash's");
                        //</debug>
                        Microloader.onAllUpdatedAssetsReady();
                    }
                } else {
                    _warn("Error loading manifest file to check for updates");
                    Microloader.onAllUpdatedAssetsReady();
                }
            },

            onFullAssetUpdateLoaded: function(asset, result) {
                var checksum;
                result = Microloader.parseResult(result);
                Microloader.remainingUpdatingAssets--;

                if (!result.error) {
                    checksum = Microloader.checksum(result.content, asset.assetConfig.hash);
                    //<debug>
                        _debug("Checksum for Full asset: " + asset.assetConfig.path + " is " + checksum);
                    //</debug>
                    if (!checksum) {
                        //<debug>
                            _debug("Full Update Asset: " + asset.assetConfig.path + " has failed checksum. This asset will be uncached for future loading");
                        //</debug>

                        // uncache this asset as there is a new version somewhere that has not been loaded.
                        asset.uncache();
                    } else {
                        asset.updateContent(result.content);
                        Microloader.updatedAssets.push(asset);
                    }
                } else {
                    //<debug>
                        _debug("Error loading file at" + asset.assetConfig.path + ". This asset will be uncached for future loading");
                    //</debug>

                    // uncache this asset as there is a new version somewhere that has not been loaded.
                    asset.uncache();
                }

                if (Microloader.remainingUpdatingAssets === 0) {
                        Microloader.onAllUpdatedAssetsReady();
                }
            },

            onDeltaAssetUpdateLoaded: function(asset, oldAsset, result) {
                var json, checksum, content;
                result = Microloader.parseResult(result);
                Microloader.remainingUpdatingAssets--;

                if (!result.error) {
                    //<debug>
                        _debug("Delta patch loaded successfully, patching content");
                    //</debug>
                    try {
                        json = JSON.parse(result.content);
                        content = Microloader.patch(oldAsset.content, json);
                        checksum = Microloader.checksum(content, asset.assetConfig.hash);
                        //<debug>
                            _debug("Checksum for Delta Patched asset: " + asset.assetConfig.path + " is " + checksum);
                        //</debug>
                        if (!checksum) {
                            //<debug>
                                _debug("Delta Update Asset: " + asset.assetConfig.path + " has failed checksum. This asset will be uncached for future loading");
                            //</debug>

                            // uncache this asset as there is a new version somewhere that has not been loaded.
                            asset.uncache();
                        } else {
                            asset.updateContent(content);
                            Microloader.updatedAssets.push(asset);
                        }
                    } catch (e) {
                        _warn("Error parsing delta patch for " + asset.assetConfig.path + " with hash " + oldAsset.assetConfig.hash + " . This asset will be uncached for future loading");
                        // uncache this asset as there is a new version somewhere that has not been loaded.
                        asset.uncache();
                    }
                } else {
                    _warn("Error loading delta patch for " + asset.assetConfig.path + " with hash " + oldAsset.assetConfig.hash + " . This asset will be uncached for future loading");

                    // uncache this asset as there is a new version somewhere that has not been loaded.
                    asset.uncache();
                }
                if (Microloader.remainingUpdatingAssets === 0) {
                    Microloader.onAllUpdatedAssetsReady();
                }
            },

            //TODO: Make this all transaction based to allow for reverting if quota is exceeded
            onAllUpdatedAssetsReady: function() {
                var asset;
                Microloader.updatedAssetsReady = true;

                if (Microloader.updatedManifest) {
                    while (Microloader.removedAssets.length > 0) {
                        asset = Microloader.removedAssets.pop();
                        //<debug>
                            _debug("Asset: " + asset.assetConfig.path + " was removed, un-caching");
                        //</debug>
                        asset.uncache();
                    }

                    if (Microloader.updatedManifest) {
                        //<debug>
                        _debug("Manifest was updated, re-caching");
                        //</debug>
                        Microloader.updatedManifest.cache();
                    }

                    while (Microloader.updatedAssets.length > 0) {
                        asset = Microloader.updatedAssets.pop();
                        //<debug>
                            _debug("Asset: " + asset.assetConfig.path + " was updated, re-caching");
                        //</debug>
                        asset.cache();
                    }

                }

                Microloader.notifyUpdateReady();
            },

            notifyUpdateReady: function () {
                if (Microloader.appCacheState !== 'checking' && Microloader.updatedAssetsReady) {
                    if (Microloader.appCacheState === 'updated' || Microloader.updatedManifest) {
                        //<debug>
                            _debug("There was an update here you will want to reload the app, trigger an event");
                        //</debug>
                        Microloader.appUpdate = {
                            updated: true,
                            app: Microloader.appCacheState === 'updated',
                            manifest: Microloader.updatedManifest && Microloader.updatedManifest.exportContent()
                        };

                        Microloader.fireAppUpdate();
                    }
                    //<debug>
                    else {
                        _debug("AppCache and LocalStorage Cache are current, no updating needed");
                        Microloader.appUpdate = {};
                    }
                    //</debug>
                }
            },

            fireAppUpdate: function() {
                if (Ext.GlobalEvents) {
                    // We defer dispatching this event slightly in order to let the application finish loading
                    // as we are still very early in the lifecycle
                    Ext.defer(function() {
                        Ext.GlobalEvents.fireEvent('appupdate', Microloader.appUpdate);
                    }, 100);
                }
            },

            checksum: function(content, hash) {
                if(!content || !hash) {
                    return false;
                }

                var passed = true,
                    hashLn = hash.length,
                    checksumType = content.substring(0, 1);

                if (checksumType == '/') {
                    if (content.substring(2, hashLn + 2) !== hash) {
                        passed = false;
                    }
                } else if (checksumType == 'f') {
                    if (content.substring(10, hashLn + 10) !== hash) {
                        passed = false;
                    }
                } else if (checksumType == '.') {
                    if (content.substring(1, hashLn + 1) !== hash) {
                        passed = false;
                    }
                }
                return passed;
            },
            parseResult: function(result) {
                var rst = {};
                if ((result.exception || result.status === 0) && !Boot.env.phantom) {
                    rst.error = true;
                } else if ((result.status >= 200 && result.status < 300) || result.status === 304
                    || Boot.env.phantom
                    || (result.status === 0 && result.content.length > 0)
                ) {
                    rst.content = result.content;
                } else {
                    rst.error = true;
                }
                return rst;
            }
        };

    return Microloader;
}());

/**
 * @type {String/Object}
 */
Ext.manifest = Ext.manifest || "bootstrap";

Ext.Microloader.run();