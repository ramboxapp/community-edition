/*! modernizr 3.2.0 (Custom Build) | MIT *
 * http://modernizr.com/download/?-csstransitions-prefixedcss !*/
!function(e,n,t){function r(e,n){return typeof e===n}function o(){var e,n,t,o,i,s,a;for(var f in C)if(C.hasOwnProperty(f)){if(e=[],n=C[f],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(o=r(n.fn,"function")?n.fn():n.fn,i=0;i<e.length;i++)s=e[i],a=s.split("."),1===a.length?Modernizr[a[0]]=o:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=o),g.push((o?"":"no-")+a.join("-"))}}function i(e){var n=_.className,t=Modernizr._config.classPrefix||"";if(w&&(n=n.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(r,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),w?_.className.baseVal=n:_.className=n)}function s(e){return e.replace(/([A-Z])/g,function(e,n){return"-"+n.toLowerCase()}).replace(/^ms-/,"-ms-")}function a(e){return e.replace(/([a-z])-([a-z])/g,function(e,n,t){return n+t.toUpperCase()}).replace(/^-/,"")}function f(e,n){return!!~(""+e).indexOf(n)}function l(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):w?n.createElementNS.call(n,"https://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}function u(e,n){return function(){return e.apply(n,arguments)}}function p(e,n,t){var o;for(var i in e)if(e[i]in n)return t===!1?e[i]:(o=n[e[i]],r(o,"function")?u(o,t||n):o);return!1}function d(){var e=n.body;return e||(e=l(w?"svg":"body"),e.fake=!0),e}function c(e,t,r,o){var i,s,a,f,u="modernizr",p=l("div"),c=d();if(parseInt(r,10))for(;r--;)a=l("div"),a.id=o?o[r]:u+(r+1),p.appendChild(a);return i=l("style"),i.type="text/css",i.id="s"+u,(c.fake?c:p).appendChild(i),c.appendChild(p),i.styleSheet?i.styleSheet.cssText=e:i.appendChild(n.createTextNode(e)),p.id=u,c.fake&&(c.style.background="",c.style.overflow="hidden",f=_.style.overflow,_.style.overflow="hidden",_.appendChild(c)),s=t(p,e),c.fake?(c.parentNode.removeChild(c),_.style.overflow=f,_.offsetHeight):p.parentNode.removeChild(p),!!s}function m(n,r){var o=n.length;if("CSS"in e&&"supports"in e.CSS){for(;o--;)if(e.CSS.supports(s(n[o]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var i=[];o--;)i.push("("+s(n[o])+":"+r+")");return i=i.join(" or "),c("@supports ("+i+") { #modernizr { position: absolute; } }",function(e){return"absolute"==getComputedStyle(e,null).position})}return t}function v(e,n,o,i){function s(){p&&(delete N.style,delete N.modElem)}if(i=r(i,"undefined")?!1:i,!r(o,"undefined")){var u=m(e,o);if(!r(u,"undefined"))return u}for(var p,d,c,v,h,y=["modernizr","tspan"];!N.style;)p=!0,N.modElem=l(y.shift()),N.style=N.modElem.style;for(c=e.length,d=0;c>d;d++)if(v=e[d],h=N.style[v],f(v,"-")&&(v=a(v)),N.style[v]!==t){if(i||r(o,"undefined"))return s(),"pfx"==n?v:!0;try{N.style[v]=o}catch(g){}if(N.style[v]!=h)return s(),"pfx"==n?v:!0}return s(),!1}function h(e,n,t,o,i){var s=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+b.join(s+" ")+s).split(" ");return r(n,"string")||r(n,"undefined")?v(a,n,o,i):(a=(e+" "+P.join(s+" ")+s).split(" "),p(a,n,t))}function y(e,n,r){return h(e,t,t,n,r)}var g=[],C=[],x={_version:"3.2.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){C.push({name:e,fn:n,options:t})},addAsyncTest:function(e){C.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=x,Modernizr=new Modernizr;var _=n.documentElement,w="svg"===_.nodeName.toLowerCase(),S="Moz O ms Webkit",b=x._config.usePrefixes?S.split(" "):[];x._cssomPrefixes=b;var E=function(n){var r,o=prefixes.length,i=e.CSSRule;if("undefined"==typeof i)return t;if(!n)return!1;if(n=n.replace(/^@/,""),r=n.replace(/-/g,"_").toUpperCase()+"_RULE",r in i)return"@"+n;for(var s=0;o>s;s++){var a=prefixes[s],f=a.toUpperCase()+"_"+r;if(f in i)return"@-"+a.toLowerCase()+"-"+n}return!1};x.atRule=E;var P=x._config.usePrefixes?S.toLowerCase().split(" "):[];x._domPrefixes=P;var z={elem:l("modernizr")};Modernizr._q.push(function(){delete z.elem});var N={style:z.elem.style};Modernizr._q.unshift(function(){delete N.style}),x.testAllProps=h;var T=x.prefixed=function(e,n,t){return 0===e.indexOf("@")?E(e):(-1!=e.indexOf("-")&&(e=a(e)),n?h(e,n,t):h(e,"pfx"))};x.prefixedCSS=function(e){var n=T(e);return n&&s(n)};x.testAllProps=y,Modernizr.addTest("csstransitions",y("transition","all",!0)),o(),i(g),delete x.addTest,delete x.addAsyncTest;for(var j=0;j<Modernizr._q.length;j++)Modernizr._q[j]();e.Modernizr=Modernizr}(window,document);

/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2015, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	/**
	 * some helper functions
	 */

		// from http://stackoverflow.com/a/25273333
	var bezier = function(x1, y1, x2, y2, epsilon) {
			var curveX = function(t){
				var v = 1 - t;
				return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
			};
			var curveY = function(t){
				var v = 1 - t;
				return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
			};
			var derivativeCurveX = function(t){
				var v = 1 - t;
				return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (- t * t * t + 2 * v * t) * x2;
			};
			return function(t){
				var x = t, t0, t1, t2, x2, d2, i;
				// First try a few iterations of Newton's method -- normally very fast.
				for (t2 = x, i = 0; i < 8; i++){
					x2 = curveX(t2) - x;
					if (Math.abs(x2) < epsilon) return curveY(t2);
					d2 = derivativeCurveX(t2);
					if (Math.abs(d2) < 1e-6) break;
					t2 = t2 - x2 / d2;
				}

				t0 = 0, t1 = 1, t2 = x;

				if (t2 < t0) return curveY(t0);
				if (t2 > t1) return curveY(t1);

				// Fallback to the bisection method for reliability.
				while (t0 < t1){
					x2 = curveX(t2);
					if (Math.abs(x2 - x) < epsilon) return curveY(t2);
					if (x > x2) t0 = t2;
					else t1 = t2;
					t2 = (t1 - t0) * .5 + t0;
				}
				// Failure
				return curveY(t2);
			};
		},
		getRandomNumber = function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		throttle = function(fn, delay) {
			var allowSample = true;

			return function(e) {
				if (allowSample) {
					allowSample = false;
					setTimeout(function() { allowSample = true; }, delay);
					fn(e);
				}
			};
		},
		// from https://davidwalsh.name/vendor-prefix
		prefix = (function () {
			var styles = window.getComputedStyle(document.documentElement, ''),
				pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
				dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

			return {
				dom: dom,
				lowercase: pre,
				css: '-' + pre + '-',
				js: pre[0].toUpperCase() + pre.substr(1)
			};
		})();

	var support = {transitions : Modernizr.csstransitions},
		transEndEventNames = { 'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend' },
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		onEndTransition = function( el, callback, propTest ) {
			var onEndCallbackFn = function( ev ) {
				if( support.transitions ) {
					if( ev.target != this || propTest && ev.propertyName !== propTest && ev.propertyName !== prefix.css + propTest ) return;
					this.removeEventListener( transEndEventName, onEndCallbackFn );
				}
				if( callback && typeof callback === 'function' ) { callback.call(this); }
			};
			if( support.transitions ) {
				el.addEventListener( transEndEventName, onEndCallbackFn );
			}
			else {
				onEndCallbackFn();
			}
		},
		// the main component element/wrapper
		shzEl = document.querySelector('.component'),
		// the initial button
		shzCtrl = shzEl.querySelector('div.button--start'),
		// total number of notes/symbols moving towards the listen button
		totalNotes = 50,
		// the notes elements
		notes,
		// the note´s speed factor relative to the distance from the note element to the button.
		// if notesSpeedFactor = 1, then the speed equals the distance (in ms)
		notesSpeedFactor = 4.5,
		// window sizes
		winsize = {width: window.innerWidth, height: window.innerHeight},
		// button offset
		shzCtrlOffset = shzCtrl.getBoundingClientRect(),
		// button sizes
		shzCtrlSize = {width: shzCtrl.offsetWidth, height: shzCtrl.offsetHeight},
		// tells us if the listening animation is taking place
		isListening = false,
		// audio player element
		playerEl = shzEl.querySelector('.player');
		// close player control
		//playerCloseCtrl = playerEl.querySelector('.button--close');

	function init() {
		// create the music notes elements - the musical symbols that will animate/move towards the listen button
		createNotes();
		// star animation
		listen();
	}

	/**
	 * creates [totalNotes] note elements (the musical symbols that will animate/move towards the listen button)
	 */
	function createNotes() {
		var notesEl = document.createElement('div'), notesElContent = '';
		notesEl.className = 'notes';
		for(var i = 0; i < totalNotes; ++i) {
			// we have 6 different types of symbols (icon--note1, icon--note2 ... icon--note6)
			var j = (i + 1) - 6 * Math.floor(i/6);
			notesElContent += '<div class="note icon icon--note' + j + '"></div>';
		}
		notesEl.innerHTML = notesElContent;
		shzEl.insertBefore(notesEl, shzEl.firstChild)

		// reference to the notes elements
		notes = [].slice.call(notesEl.querySelectorAll('.note'));
	}

	/**
	 * transform the initial button into a circle shaped one that "listens" to the current song..
	 */
	function listen() {
		isListening = true;

		showNotes();
	}

	/**
	 * stop the ripples and notes animations
	 */
	function stopListening() {
		isListening = false;
		// music notes animation stops...
		hideNotes();
	}

	/**
	 * show the notes elements: first set a random position and then animate them towards the button
	 */
	function showNotes() {
		notes.forEach(function(note) {
			// first position the notes randomly on the page
			positionNote(note);
			// now, animate the notes torwards the button
			animateNote(note);
		});
	}

	/**
	 * fade out the notes elements
	 */
	function hideNotes() {
		notes.forEach(function(note) {
			note.style.opacity = 0;
		});
	}

	/**
	 * positions a note/symbol randomly on the page. The area is restricted to be somewhere outside of the viewport.
	 * @param {Element Node} note - the note element
	 */
	function positionNote(note) {
		// we want to position the notes randomly (translation and rotation) outside of the viewport
		var x = getRandomNumber(-2*(shzCtrlOffset.left + shzCtrlSize.width/2), 2*(winsize.width - (shzCtrlOffset.left + shzCtrlSize.width/2))), y,
			rotation = getRandomNumber(-30, 30);

		if( x > -1*(shzCtrlOffset.top + shzCtrlSize.height/2) && x < shzCtrlOffset.top + shzCtrlSize.height/2 ) {
			y = getRandomNumber(0,1) > 0 ? getRandomNumber(-2*(shzCtrlOffset.top + shzCtrlSize.height/2), -1*(shzCtrlOffset.top + shzCtrlSize.height/2)) : getRandomNumber(winsize.height - (shzCtrlOffset.top + shzCtrlSize.height/2), winsize.height + winsize.height - (shzCtrlOffset.top + shzCtrlSize.height/2));
		}
		else {
			y = getRandomNumber(-2*(shzCtrlOffset.top + shzCtrlSize.height/2), winsize.height + winsize.height - (shzCtrlOffset.top + shzCtrlSize.height/2));
		}

		// first reset transition if any
		note.style.WebkitTransition = note.style.transition = 'none';

		// apply the random transforms
		note.style.WebkitTransform = note.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate3d(0,0,1,' + rotation + 'deg)';

		// save the translation values for later
		note.setAttribute('data-tx', Math.abs(x));
		note.setAttribute('data-ty', Math.abs(y));
	}

	/**
	 * animates a note torwards the button. Once that's done, it repositions the note and animates it again until the component is no longer listening.
	 * @param {Element Node} note - the note element
	 */
	function animateNote(note) {
		setTimeout(function() {
			if(!isListening) return;
			// the transition speed of each note will be proportional to the its distance to the button
			// speed = notesSpeedFactor * distance
			var noteSpeed = notesSpeedFactor * Math.sqrt(Math.pow(note.getAttribute('data-tx'),2) + Math.pow(note.getAttribute('data-ty'),2));

			// apply the transition
			note.style.WebkitTransition = '-webkit-transform ' + noteSpeed + 'ms ease, opacity 0.8s';
			note.style.transition = 'transform ' + noteSpeed + 'ms ease-in, opacity 0.8s';

			// now apply the transform (reset the transform so the note moves to its original position) and fade in the note
			note.style.WebkitTransform = note.style.transform = 'translate3d(0,0,0)';
			note.style.opacity = 1;

			// after the animation is finished,
			var onEndTransitionCallback = function() {
				// reset transitions and styles
				note.style.WebkitTransition = note.style.transition = 'none';
				note.style.opacity = 0;

				if(!isListening) return;

				positionNote(note);
				animateNote(note);
			};

			onEndTransition(note, onEndTransitionCallback, 'transform');
		}, 60);
	}

	init();

})(window);
