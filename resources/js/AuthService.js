// Credits: github.com/adeperio and github.com/uotw
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function() {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function(Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
}();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : {
		default: obj
	};
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

//https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce
var AuthService = function() {
	function AuthService(config) {
		_classCallCheck(this, AuthService);

		this.config = config;
	}

	_createClass(AuthService, [{
		key: 'requestAuthCode',
		value: function requestAuthCode() {
			this.challengePair = AuthService.getPKCEChallengePair();
			return this.getAuthoriseUrl(this.challengePair);
		}
	}, {
		key: 'requestAccessCode',
		value: function requestAccessCode(callbackUrl, onSuccess, authWindow) {
			var _this = this;

			return new Promise(function(resolve, reject) {

				if (_this.isValidAccessCodeCallBackUrl(callbackUrl)) {

					var authCode = AuthService.getParameterByName('code', callbackUrl);

					if (authCode != null) {
						var _verifier = _this.challengePair.verifier;
						var options = _this.getTokenPostRequest(authCode, _verifier);

						return (0, _requestPromise2.default)(options).then(function(response) {
							onSuccess(JSON.parse(response), authWindow);
						}).catch(function(err) {
							if (err) throw new Error(err);
						});
					} else {
						reject('Could not parse the authorization code');
					}
				} else {
					//reject('Access code callback url not expected.');
				}
			});
		}
	}, {
		key: 'getAuthoriseUrl',
		value: function getAuthoriseUrl(challengePair) {
			return this.config.authorizeEndpoint + '?scope=' + this.config.scope + '&response_type=code&client_id=' + this.config.clientId + '&code_challenge=' + challengePair.challenge + '&code_challenge_method=S256&redirect_uri=' + this.config.redirectUri;
		}
	}, {
		key: 'getTokenPostRequest',
		value: function getTokenPostRequest(authCode, verifier) {
			return {
				method: 'POST',
				url: this.config.tokenEndpoint,
				headers: {
					'content-type': 'application/json'
				},
				body: '{"grant_type":"authorization_code",\n              "client_id": "' + this.config.clientId + '",\n              "code_verifier": "' + verifier + '",\n              "code": "' + authCode + '",\n              "redirect_uri":"' + this.config.redirectUri + '"\n            }'
			};
		}
	}, {
		key: 'isValidAccessCodeCallBackUrl',
		value: function isValidAccessCodeCallBackUrl(callbackUrl) {
			//console.log(this.config.redirectUri);
			return callbackUrl.indexOf(this.config.redirectUri) > -1;
		}
	}], [{
		key: 'getPKCEChallengePair',
		value: function getPKCEChallengePair() {
			var verifier = AuthService.base64URLEncode(_crypto2.default.randomBytes(32));
			var challenge = AuthService.base64URLEncode(AuthService.sha256(verifier));
			return {
				verifier: verifier,
				challenge: challenge
			};
		}
	}, {
		key: 'getParameterByName',
		value: function getParameterByName(name, url) {

			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		}
	}, {
		key: 'base64URLEncode',
		value: function base64URLEncode(str) {

			return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
		}
	}, {
		key: 'sha256',
		value: function sha256(buffer) {
			return _crypto2.default.createHash('sha256').update(buffer).digest();
		}
	}]);

	return AuthService;
}();

exports.default = AuthService;
