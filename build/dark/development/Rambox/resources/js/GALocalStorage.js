/**
 * Modified version of "Google Analytics for Pokki" to make it usable in PhoneGap.
 * For all details and documentation:
 * https://github.com/ggendre/GALocalStorage
 *
 * @version     1.1
 * @license     MIT License
 * @author      Guillaume Gendre, haploid.fr
 *
 * Original Work from Pokki team :
 *              Blake Machado <blake@sweetlabs.com>, SweetLabs, Inc.
 *              Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * see this repository : https://github.com/blakemachado/Pokki
 *
 * Example usage:
 *
 * - Place these two lines with your values in a script tag in the head of index.html
 *   ga_storage._setAccount('--GA-ACCOUNT-ID--');
 *   ga_storage._trackPageview('/index.html');
 *
 * - Call these whenever you want to track a page view or a custom event
 *   ga_storage._trackPageview('/index', 'optional title');
 *   ga_storage._trackEvent('category', 'action', 'label', 'value');
 */

(function() {
    var IS_DEBUG = false;

    var LocalStorage = function(key, initial_value) {
        if (window.localStorage.getItem(key) == null && initial_value != null) {
            window.localStorage.setItem(key, initial_value);
        }

        this._get = function() {
            return window.localStorage.getItem(key);
        };

        this._set = function(value) {
            return window.localStorage.setItem(key, value);
        };

        this._remove = function() {
            return window.localStorage.removeItem(key);
        };

        this.toString = function() {
            return this._get();
        };
    };

    ga_storage = new function() {
        var ga_url = 'http://www.google-analytics.com';
        var ga_ssl_url = 'https://ssl.google-analytics.com';
        var last_url = '/'; // used to keep track of last page view logged to pass forward to subsequent events tracked
        var last_nav_url = '/'; // used to keep track of last page actually visited by the user (not popup_hidden or popup_blurred!)
        var last_page_title = '-'; // used to keep track of last page view logged to pass forward to subsequent events tracked
        var timer; // used for blur/focus state changes

        var ga_use_ssl = false; // set by calling _enableSSL or _disableSSL
        var utmac = false; // set by calling _setAccount
        var utmhn = false; // set by calling _setDomain
        var utmwv = '4.3'; // tracking api version
        var utmcs = 'UTF-8'; // charset
        var utmul = 'en-us'; // language
        var utmdt = '-'; // page title
        var utmt = 'event'; // analytics type
        var utmhid = 0; // unique id per session

        var event_map = {
            hidden: {
                path: '/popup_hidden',
                event: 'PopupHidden'
            },
            blurred: {
                path: '/popup_blurred',
                event: 'PopupBlurred'
            },
            focused: {
                path: '{last_nav_url}',
                event: 'PopupFocused'
            }
        };

        var uid = new LocalStorage('ga_storage_uid');
        var uid_rand = new LocalStorage('ga_storage_uid_rand');
        var session_cnt = new LocalStorage('ga_storage_session_cnt');
        var f_session = new LocalStorage('ga_storage_f_session');
        var l_session = new LocalStorage('ga_storage_l_session');
        var visitor_custom_vars = new LocalStorage('ga_storage_visitor_custom_vars');

        var c_session = 0;
        var custom_vars = visitor_custom_vars._get() ? JSON.parse(visitor_custom_vars._get()) : ['dummy'];

        var request_cnt = 0;

        function beacon_url() {
            return (
                ga_use_ssl ? ga_ssl_url : ga_url
            ) + '/__utm.gif';
        }

        function rand(min, max) {
            return min + Math.floor(Math.random() * (max - min));
        }

        function get_random() {
            return rand(100000000, 999999999);
        }


        function return_cookies(source, medium, campaign) {
            source = source || '(direct)';
            medium = medium || '(none)';
            campaign = campaign || '(direct)';

            // utma represents user, should exist for lifetime: [user_id].[random #].[first session timestamp].[last session timestamp].[start of this session timestamp].[total # of sessions]
            // utmb is a session, [user_id].[requests_per_session?].[??].[start of session timestamp]
            // utmc is a session, [user_id]
            // utmz is a referrer cookie
            var cookie = uid._get();
            var ret = '__utma=' + cookie + '.' + uid_rand._get() + '.' + f_session._get() + '.' + l_session._get() + '.' + c_session + '.' + session_cnt._get() + ';';
            ret += '+__utmz=' + cookie + '.' + c_session + '.1.1.utmcsr=' + source + '|utmccn=' + campaign + '|utmcmd=' + medium + ';';
            ret += '+__utmc=' + cookie + ';';
            ret += '+__utmb=' + cookie + '.' + request_cnt + '.10.' + c_session + ';';
            return ret;
        }

        function generate_query_string(params) {
            var qa = [];
            for (var key in params) {
                qa.push(key + '=' + encodeURIComponent(params[key]));
            }
            return '?' + qa.join('&');
        }

        function reset_session(c_session) {
            if (IS_DEBUG) console.log('resetting session');

            l_session._set(c_session);
            request_cnt = 0;
            utmhid = get_random();
        }

        function gainit() {
            c_session = (new Date()).getTime();
            if (IS_DEBUG) console.log('gainit', c_session);

            request_cnt = 0;
            utmhid = get_random();

            if (uid._get() == null) {
                uid._set(rand(10000000, 99999999));
                uid_rand._set(rand(1000000000, 2147483647));
            }

            if (session_cnt._get() == null) {
                session_cnt._set(1);
            } else {
                session_cnt._set(parseInt(session_cnt._get()) + 1);
            }

            if (f_session._get() == null) {
                f_session._set(c_session);
            }
            if (l_session._get() == null) {
                l_session._set(c_session);
            }

        }

        // public
        this._enableSSL = function() {
            if (IS_DEBUG) console.log("Enabling SSL");
            ga_use_ssl = true;
        };

        // public
        this._disableSSL = function() {
            if (IS_DEBUG) console.log("Disabling SSL");
            ga_use_ssl = false;
        };

        // public
        this._setAccount = function(account_id) {
            if (IS_DEBUG) console.log(account_id);
            utmac = account_id;
            gainit();
        };
        // public
        this._setDomain = function(domain) {
            if (IS_DEBUG) console.log(domain);
            utmhn = domain;
        };
        // public
        this._setLocale = function(lng, country) {
            lng = (typeof lng === 'string' && lng.match(/^[a-z][a-z]$/i)) ? lng.toLowerCase() : 'en';
            country = (typeof country === 'string' && country.match(/^[a-z][a-z]$/i)) ? country.toLowerCase() : 'us';
            utmul = lng + '-' + country;
            if (IS_DEBUG) console.log(utmul);
        };

        // public
        this._setCustomVar = function(index, name, value, opt_scope) {
            if (index < 1 || index > 5) return false;

            var params = {
                name: name,
                value: value,
                scope: opt_scope
            };

            custom_vars[index] = params;

            // store if custom var is visitor-level (1)
            if (opt_scope === 1) {
                var vcv = visitor_custom_vars._get() ? JSON.parse(visitor_custom_vars._get()) : ['dummy'];
                vcv[index] = params;
                visitor_custom_vars._set(JSON.stringify(vcv));
            }

            if (IS_DEBUG) {
                console.log(custom_vars);
            }

            return true;
        };

        // public
        this._deleteCustomVar = function(index) {
            if (index < 1 || index > 5) return false;
            var scope = custom_vars[index] && custom_vars[index].scope;
            custom_vars[index] = null;
            if (scope === 1) {
                var vcv = visitor_custom_vars._get() ? JSON.parse(visitor_custom_vars._get()) : ['dummy'];
                vcv[index] = null;
                visitor_custom_vars._set(JSON.stringify(vcv));
            }
            if (IS_DEBUG) {
                console.log(custom_vars);
            }
            return true;
        };

        // public
        this._trackPageview = function(path, title, source, medium, campaign) {
            if (IS_DEBUG) {
                console.log('Track Page View', arguments);
            }

            clearTimeout(timer);

            request_cnt++;
            if (!path) {
                path = '/';
            }
            if (!title) {
                title = utmdt;
            }

            // custom vars
            var event = '';

            if (custom_vars.length > 1) {
                var names = '';
                var values = '';
                var scopes = '';
                var last_slot = 0;

                for (var i = 1; i < custom_vars.length; i++) {
                    if (custom_vars[i])
                        last_slot = i;
                }
                for (i = 1; i < custom_vars.length; i++) {
                    if (custom_vars[i]) {
                        var slotPrefix = '';
                        if (!custom_vars[i - 1])
                            slotPrefix = i + '!';

                        names += slotPrefix + custom_vars[i].name;
                        values += slotPrefix + custom_vars[i].value;
                        scopes += slotPrefix + (custom_vars[i].scope == null ? 3 : custom_vars[i].scope);

                        if (i < last_slot) {
                            names += '*';
                            values += '*';
                            scopes += '*';
                        }
                    }
                }

                event += '8(' + names + ')';
                event += '9(' + values + ')';
                event += '11(' + scopes + ')';
            }

            // remember page path and title for event tracking
            last_url = path;
            last_page_title = title;
            if ([event_map.hidden.path, event_map.blurred.path].indexOf(path) < 0) {
                last_nav_url = path;
            }

            var params = {
                utmwv: utmwv,
                utmn: get_random(),
                utmhn: utmhn,
                utmcs: utmcs,
                utmul: utmul,
                utmdt: title,
                utmhid: utmhid,
                utmp: path,
                utmac: utmac,
                utmcc: return_cookies(source, medium, campaign)
            };
            if (event != '') {
                params.utme = event;
            }

            var url = beacon_url() + generate_query_string(params);
            var img = new Image();
            img.src = url;
        };

        // public
        this._trackEvent = function(category, action, label, value, source, medium, campaign) {
            if (IS_DEBUG) {
                console.log('Track Event', arguments);
            }

            request_cnt++;
            var event = '5(' + category + '*' + action;
            if (label) {
                event += '*' + label + ')';
            } else {
                event += ')';
            }
            if (value) {
                event += '(' + value + ')'
            }

            // custom vars
            if (custom_vars.length > 1) {
                var names = '';
                var values = '';
                var scopes = '';
                var last_slot = 0;

                for (var i = 1; i < custom_vars.length; i++) {
                    if (custom_vars[i])
                        last_slot = i;
                }

                for (i = 1; i < custom_vars.length; i++) {
                    if (custom_vars[i]) {
                        var slotPrefix = '';
                        if (!custom_vars[i - 1])
                            slotPrefix = i + '!';

                        names += slotPrefix + custom_vars[i].name;
                        values += slotPrefix + custom_vars[i].value;
                        scopes += slotPrefix + (custom_vars[i].scope == null ? 3 : custom_vars[i].scope);

                        if (i < last_slot) {
                            names += '*';
                            values += '*';
                            scopes += '*';
                        }
                    }
                }

                event += '8(' + names + ')';
                event += '9(' + values + ')';
                event += '11(' + scopes + ')';
            }

            var params = {
                utmwv: utmwv,
                utmn: get_random(),
                utmhn: utmhn,
                utmcs: utmcs,
                utmul: utmul,
                utmt: utmt,
                utme: event,
                utmhid: utmhid,
                utmdt: last_page_title,
                utmp: last_url,
                utmac: utmac,
                utmcc: return_cookies(source, medium, campaign)
            };
            var url = beacon_url() + generate_query_string(params);
            var img = new Image();
            img.src = url;
        };

    };
})();
