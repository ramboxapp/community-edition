/**
 * @class Ext.dom.Element
 */
Ext.define('Ext.overrides.dom.Element', (function() {
    var Element, // we cannot do this yet "= Ext.dom.Element"
        WIN = window,
        DOC = document,
        HIDDEN = 'hidden',
        ISCLIPPED = 'isClipped',
        OVERFLOW = 'overflow',
        OVERFLOWX = 'overflow-x',
        OVERFLOWY = 'overflow-y',
        ORIGINALCLIP = 'originalClip',
        HEIGHT = 'height',
        WIDTH = 'width',
        VISIBILITY = 'visibility',
        DISPLAY = 'display',
        NONE = 'none',
        OFFSETS = 'offsets',
        ORIGINALDISPLAY = 'originalDisplay',
        VISMODE = 'visibilityMode',
        ISVISIBLE = 'isVisible',
        OFFSETCLASS = Ext.baseCSSPrefix + 'hidden-offsets',
        boxMarkup = [
            '<div class="{0}-tl" role="presentation">',
                '<div class="{0}-tr" role="presentation">',
                    '<div class="{0}-tc" role="presentation"></div>',
                '</div>',
            '</div>',
            '<div class="{0}-ml" role="presentation">',
                '<div class="{0}-mr" role="presentation">',
                    '<div class="{0}-mc" role="presentation"></div>',
                '</div>',
            '</div>',
            '<div class="{0}-bl" role="presentation">',
                '<div class="{0}-br" role="presentation">',
                    '<div class="{0}-bc" role="presentation"></div>',
                '</div>',
            '</div>'
        ].join(''),
        scriptTagRe = /(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig,
        replaceScriptTagRe = /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig,
        srcRe = /\ssrc=([\'\"])(.*?)\1/i,
        nonSpaceRe = /\S/,
        typeRe = /\stype=([\'\"])(.*?)\1/i,
        msRe = /^-ms-/,
        camelRe = /(-[a-z])/gi,
        camelReplaceFn = function(m, a) {
            return a.charAt(1).toUpperCase();
        },
        XMASKED = Ext.baseCSSPrefix + "masked",
        XMASKEDRELATIVE = Ext.baseCSSPrefix + "masked-relative",
        EXTELMASKMSG = Ext.baseCSSPrefix + "mask-msg",
        bodyRe = /^body/i,
        propertyCache = {},
        getDisplay = function(el) {
            var data = el.getData(),
                display = data[ORIGINALDISPLAY];
                
            if (display === undefined) {
                data[ORIGINALDISPLAY] = display = '';
            }
            return display;
        },
        getVisMode = function(el){
            var data = el.getData(),
                visMode = data[VISMODE];
                
            if (visMode === undefined) {
                data[VISMODE] = visMode = Element.VISIBILITY;
            }
            return visMode;
        },
        emptyRange      = DOC.createRange ? DOC.createRange() : null,
        inputTags = {
            INPUT: true,
            TEXTAREA: true
        };

    //<feature legacyBrowser>
    if (Ext.isIE8) {
        var removeNode = Ext.removeNode, // save a reference to the removeNode function defined in sencha-core
            garbageBin = DOC.createElement('div'),
            destroyQueue = [],

            // prevent memory leaks in IE8
            // see http://social.msdn.microsoft.com/Forums/ie/en-US/c76967f0-dcf8-47d0-8984-8fe1282a94f5/ie-appendchildremovechild-memory-problem?forum=iewebdevelopment
            // This function is called to fully destroy an element on a timer so that code following the
            // remove call can still access the element.
            clearGarbage = Ext.Function.createBuffered(function() {
                var len = destroyQueue.length,
                    i;

                for (i = 0; i < len; i++) {
                    garbageBin.appendChild(destroyQueue[i]);
                }
                garbageBin.innerHTML = '';
                destroyQueue.length = 0;
            }, 10);

        Ext.removeNode = function(node) {
            node = node.dom || node;
            removeNode(node);
            destroyQueue[destroyQueue.length] = node;

            // Will perform extra IE8 cleanup in 10 milliseconds
            // see http://social.msdn.microsoft.com/Forums/ie/en-US/c76967f0-dcf8-47d0-8984-8fe1282a94f5/ie-appendchildremovechild-memory-problem?forum=iewebdevelopment
            clearGarbage();
        };
    }
    //</feature>

    return {
        override: 'Ext.dom.Element',
        
        mixins: [
            'Ext.util.Animate'
        ],

        uses: [
            'Ext.dom.GarbageCollector',
            'Ext.dom.Fly',
            'Ext.event.publisher.MouseEnterLeave',
            'Ext.fx.Manager',
            'Ext.fx.Anim'
        ],

        skipGarbageCollection: false,

        _init: function (E) {
            Element = E; // now we can poke this into closure scope
        },

        statics: {
            selectableCls: Ext.baseCSSPrefix + 'selectable',
            unselectableCls: Ext.baseCSSPrefix + 'unselectable',
            
            /**
             * tabIndex attribute name for DOM lookups; needed in IE8 because
             * it has a bug: dom.getAttribute('tabindex') will return null
             * while dom.getAttribute('tabIndex') will return the actual value.
             * IE9+ and all other browsers normalize attribute names to lowercase.
             *
             * @static
             * @private
             */
            tabIndexAttributeName: Ext.isIE8 ? 'tabIndex' : 'tabindex',
            
            tabbableSelector: 'a[href],button,iframe,input,select,textarea,[tabindex],[contenteditable="true"]',
            
            // Anchor and link tags are special; they are only naturally focusable (and tabbable)
            // if they have href attribute, and tabbabledness is further platform/browser specific.
            // Thus we check it separately in the code.
            naturallyFocusableTags: {
                BUTTON: true,
                IFRAME: true,
                EMBED: true,
                INPUT: true,
                OBJECT: true,
                SELECT: true,
                TEXTAREA: true,
                HTML: Ext.isIE ? true : false
            },

            // <object> element is naturally tabbable only in IE8 and below
            naturallyTabbableTags: {
                BUTTON: true,
                IFRAME: true,
                INPUT: true,
                SELECT: true,
                TEXTAREA: true,
                OBJECT: Ext.isIE8m ? true : false
            },
            
            tabbableSavedFlagAttribute: 'data-tabindexsaved',
            tabbableSavedAttribute: 'data-savedtabindex',

            normalize: function(prop) {
                if (prop === 'float') {
                    prop = Ext.supports.Float ? 'cssFloat' : 'styleFloat';
                }
                // For '-ms-foo' we need msFoo
                return propertyCache[prop] || (propertyCache[prop] = prop.replace(msRe, 'ms-').replace(camelRe, camelReplaceFn));
            },

            getViewportHeight: function(){
                return Ext.isIE9m ? DOC.documentElement.clientHeight : WIN.innerHeight;
            },

            getViewportWidth: function() {
                return (!Ext.isStrict && !Ext.isOpera) ? document.body.clientWidth :
                       Ext.isIE9m ? DOC.documentElement.clientWidth : WIN.innerWidth;
            }
        },

        /**
         * Sets up event handlers to add and remove a css class when the mouse is down and then up on this element (a click effect)
         * @param {String} className The class to add
         * @param {Function} [testFn] A test function to execute before adding the class. The passed parameter
         * will be the Element instance. If this functions returns false, the class will not be added.
         * @param {Object} [scope] The scope to execute the testFn in.
         * @return {Ext.dom.Element} this
         */
        addClsOnClick: function(className, testFn, scope) {
            var me = this,
                dom = me.dom,
                hasTest = Ext.isFunction(testFn);
                
            me.on("mousedown", function() {
                if (hasTest && testFn.call(scope || me, me) === false) {
                    return false;
                }
                Ext.fly(dom).addCls(className);
                var d = Ext.getDoc(),
                    fn = function() {
                        Ext.fly(dom).removeCls(className);
                        d.removeListener("mouseup", fn);
                    };
                d.on("mouseup", fn);
            });
            return me;
        },

        /**
         * Sets up event handlers to add and remove a css class when this element has the focus
         * @param {String} className The class to add
         * @param {Function} [testFn] A test function to execute before adding the class. The passed parameter
         * will be the Element instance. If this functions returns false, the class will not be added.
         * @param {Object} [scope] The scope to execute the testFn in.
         * @return {Ext.dom.Element} this
         */
        addClsOnFocus: function(className, testFn, scope) {
            var me = this,
                dom = me.dom,
                hasTest = Ext.isFunction(testFn);
                
            me.on("focus", function() {
                if (hasTest && testFn.call(scope || me, me) === false) {
                    return false;
                }
                Ext.fly(dom).addCls(className);
            });
            me.on("blur", function() {
                Ext.fly(dom).removeCls(className);
            });
            return me;
        },

        /**
         * Sets up event handlers to add and remove a css class when the mouse is over this element
         * @param {String} className The class to add
         * @param {Function} [testFn] A test function to execute before adding the class. The passed parameter
         * will be the Element instance. If this functions returns false, the class will not be added.
         * @param {Object} [scope] The scope to execute the testFn in.
         * @return {Ext.dom.Element} this
         */
        addClsOnOver: function(className, testFn, scope) {
            var me = this,
                dom = me.dom,
                hasTest = Ext.isFunction(testFn);
                
            me.hover(
                function() {
                    if (hasTest && testFn.call(scope || me, me) === false) {
                        return;
                    }
                    Ext.fly(dom).addCls(className);
                },
                function() {
                    Ext.fly(dom).removeCls(className);
                }
            );
            return me;
        },

        /**
         * Convenience method for constructing a KeyMap
         * @param {String/Number/Number[]/Object} key Either a string with the keys to listen for, the numeric key code,
         * array of key codes or an object with the following options:
         * @param {Number/Array} key.key
         * @param {Boolean} key.shift
         * @param {Boolean} key.ctrl
         * @param {Boolean} key.alt
         * @param {Function} fn The function to call
         * @param {Object} [scope] The scope (`this` reference) in which the specified function is executed. Defaults to this Element.
         * @return {Ext.util.KeyMap} The KeyMap created
         */
        addKeyListener: function(key, fn, scope){
            var config;
            if(typeof key !== 'object' || Ext.isArray(key)){
                config = {
                    target: this,
                    key: key,
                    fn: fn,
                    scope: scope
                };
            } else {
                config = {
                    target: this,
                    key : key.key,
                    shift : key.shift,
                    ctrl : key.ctrl,
                    alt : key.alt,
                    fn: fn,
                    scope: scope
                };
            }
            return new Ext.util.KeyMap(config);
        },

        /**
         * Creates a KeyMap for this element
         * @param {Object} config The KeyMap config. See {@link Ext.util.KeyMap} for more details
         * @return {Ext.util.KeyMap} The KeyMap created
         */
        addKeyMap: function(config) {
            return new Ext.util.KeyMap(Ext.apply({
                target: this
            }, config));
        },

        /**
         * @private
         */
        afterAnimate: function() {
            var shadow = this.shadow;

            if (shadow && !shadow.disabled && !shadow.animate) {
                shadow.show();
            }
        },

        /**
         * @private
         */
        anchorAnimX: function(anchor) {
            var xName = (anchor === 'l') ? 'right' : 'left';
            this.dom.style[xName] = '0px';
        },

        /**
         * @private
         * process the passed fx configuration.
         */
        anim: function(config) {
            if (!Ext.isObject(config)) {
                return (config) ? {} : false;
            }

            var me = this,
                duration = config.duration || Ext.fx.Anim.prototype.duration,
                easing = config.easing || 'ease',
                animConfig;

            if (config.stopAnimation) {
                me.stopAnimation();
            }

            Ext.applyIf(config, Ext.fx.Manager.getFxDefaults(me.id));

            // Clear any 'paused' defaults.
            Ext.fx.Manager.setFxDefaults(me.id, {
                delay: 0
            });

            animConfig = {
                // Pass the DOM reference. That's tested first so will be converted to an Ext.fx.Target fastest.
                target: me.dom,
                remove: config.remove,
                alternate: config.alternate || false,
                duration: duration,
                easing: easing,
                callback: config.callback,
                listeners: config.listeners,
                iterations: config.iterations || 1,
                scope: config.scope,
                block: config.block,
                concurrent: config.concurrent,
                delay: config.delay || 0,
                paused: true,
                keyframes: config.keyframes,
                from: config.from || {},
                to: Ext.apply({}, config)
            };
            Ext.apply(animConfig.to, config.to);

            // Anim API properties - backward compat
            delete animConfig.to.to;
            delete animConfig.to.from;
            delete animConfig.to.remove;
            delete animConfig.to.alternate;
            delete animConfig.to.keyframes;
            delete animConfig.to.iterations;
            delete animConfig.to.listeners;
            delete animConfig.to.target;
            delete animConfig.to.paused;
            delete animConfig.to.callback;
            delete animConfig.to.scope;
            delete animConfig.to.duration;
            delete animConfig.to.easing;
            delete animConfig.to.concurrent;
            delete animConfig.to.block;
            delete animConfig.to.stopAnimation;
            delete animConfig.to.delay;
            return animConfig;
        },

        /**
         * Performs custom animation on this Element.
         *
         * The following properties may be specified in `from`, `to`, and `keyframe` objects:
         *
         *   - `x` - The page X position in pixels.
         *
         *   - `y` - The page Y position in pixels
         *
         *   - `left` - The element's CSS `left` value. Units must be supplied.
         *
         *   - `top` - The element's CSS `top` value. Units must be supplied.
         *
         *   - `width` - The element's CSS `width` value. Units must be supplied.
         *
         *   - `height` - The element's CSS `height` value. Units must be supplied.
         *
         *   - `scrollLeft` - The element's `scrollLeft` value.
         *
         *   - `scrollTop` - The element's `scrollTop` value.
         *
         *   - `opacity` - The element's `opacity` value. This must be a value between `0` and `1`.
         *
         * **Be aware** that animating an Element which is being used by an Ext Component without in some way informing the
         * Component about the changed element state will result in incorrect Component behaviour. This is because the
         * Component will be using the old state of the element. To avoid this problem, it is now possible to directly
         * animate certain properties of Components.
         *
         * @param {Object} config  Configuration for {@link Ext.fx.Anim}.
         * Note that the {@link Ext.fx.Anim#to to} config is required.
         * @return {Ext.dom.Element} this
         */
        animate: function(config) {
            var me = this,
                animId = me.dom.id || Ext.id(me.dom),
                listeners,
                anim,
                end;
                

            if (!Ext.fx.Manager.hasFxBlock(animId)) {
                // Bit of gymnastics here to ensure our internal listeners get bound first
                if (config.listeners) {
                    listeners = config.listeners;
                    delete config.listeners;
                }
                if (config.internalListeners) {
                    config.listeners = config.internalListeners;
                    delete config.internalListeners;
                }
                end = config.autoEnd;
                delete config.autoEnd;
                anim = new Ext.fx.Anim(me.anim(config));
                anim.on({
                    afteranimate: 'afterAnimate',
                    beforeanimate: 'beforeAnimate',
                    scope: me,
                    single: true
                });
                if (listeners) {
                    anim.on(listeners);
                }
                Ext.fx.Manager.queueFx(anim);
                if (end) {
                    anim.jumpToEnd();
                }
            }
            return me;
        },

        /**
         * @private
         */
        beforeAnimate: function() {
            var shadow = this.shadow;

            if (shadow && !shadow.disabled && !shadow.animate) {
                shadow.hide();
            }
        },

        /**
         * Wraps the specified element with a special 9 element markup/CSS block that renders by default as
         * a gray container with a gradient background, rounded corners and a 4-way shadow.
         *
         * This special markup is used throughout Ext when box wrapping elements ({@link Ext.button.Button},
         * {@link Ext.panel.Panel} when {@link Ext.panel.Panel#frame frame=true}, {@link Ext.window.Window}).
         * The markup is of this form:
         *
         *     <div class="{0}-tl"><div class="{0}-tr"><div class="{0}-tc"></div></div></div>
         *     <div class="{0}-ml"><div class="{0}-mr"><div class="{0}-mc"></div></div></div>
         *     <div class="{0}-bl"><div class="{0}-br"><div class="{0}-bc"></div></div></div>
         *
         * Example usage:
         *
         *     // Basic box wrap
         *     Ext.get("foo").boxWrap();
         *
         *     // You can also add a custom class and use CSS inheritance rules to customize the box look.
         *     // 'x-box-blue' is a built-in alternative -- look at the related CSS definitions as an example
         *     // for how to create a custom box wrap style.
         *     Ext.get("foo").boxWrap().addCls("x-box-blue");
         *
         * @param {String} [class='x-box'] A base CSS class to apply to the containing wrapper element.
         * Note that there are a number of CSS rules that are dependent on this name to make the overall effect work,
         * so if you supply an alternate base class, make sure you also supply all of the necessary rules.
         * @return {Ext.dom.Element} The outermost wrapping element of the created box structure.
         */
        boxWrap: function(cls) {
            cls = cls || Ext.baseCSSPrefix + 'box';
            var el = Ext.get(this.insertHtml("beforeBegin", "<div class='" + cls + "' role='presentation'>" + Ext.String.format(boxMarkup, cls) + "</div>"));
            el.selectNode('.' + cls + '-mc').appendChild(this.dom);
            return el;
        },

        /**
         * Removes Empty, or whitespace filled text nodes. Combines adjacent text nodes.
         * @param {Boolean} [forceReclean=false] By default the element keeps track if it has been cleaned already
         * so you can call this over and over. However, if you update the element and need to force a re-clean, you
         * can pass true.
         */
        clean: function(forceReclean) {
            var me   = this,
                dom  = me.dom,
                data = me.getData(),
                n    = dom.firstChild,
                ni   = -1,
                nx;

            if (data.isCleaned && forceReclean !== true) {
                return me;
            }

            while (n) {
                nx = n.nextSibling;
                if (n.nodeType === 3) {
                    // Remove empty/whitespace text nodes
                    if (!(nonSpaceRe.test(n.nodeValue))) {
                        dom.removeChild(n);
                    // Combine adjacent text nodes
                    } else if (nx && nx.nodeType === 3) {
                        n.appendData(Ext.String.trim(nx.data));
                        dom.removeChild(nx);
                        nx = n.nextSibling;
                        n.nodeIndex = ++ni;
                    }
                } else {
                    // Recursively clean
                    Ext.fly(n, '_clean').clean();
                    n.nodeIndex = ++ni;
                }
                n = nx;
            }

            data.isCleaned = true;
            return me;
        },

        /**
         * Empties this element. Removes all child nodes.
         */
        empty: emptyRange ? function() {
            var dom = this.dom;

            if (dom.firstChild) {
                emptyRange.setStartBefore(dom.firstChild);
                emptyRange.setEndAfter(dom.lastChild);
                emptyRange.deleteContents();
            }
        } : function() {
            var dom = this.dom;

            while (dom.lastChild) {
                dom.removeChild(dom.lastChild);
            }
        },

        clearListeners: function() {
            this.removeAnchor();
            this.callParent();
        },

        /**
         * Clears positioning back to the default when the document was loaded.
         * @param {String} [value=''] The value to use for the left, right, top, bottom.
         * You could use 'auto'.
         * @return {Ext.dom.Element} this
         */
        clearPositioning: function(value) {
            value = value || '';
            return this.setStyle({
                left : value,
                right : value,
                top : value,
                bottom : value,
                'z-index' : '',
                position : 'static'
            });
        },

        /**
         * Creates a proxy element of this element
         * @param {String/Object} config The class name of the proxy element or a DomHelper config object
         * @param {String/HTMLElement} [renderTo] The element or element id to render the proxy to. Defaults to: document.body.
         * @param {Boolean} [matchBox=false] True to align and size the proxy to this element now.
         * @return {Ext.dom.Element} The new proxy element
         */
        createProxy: function(config, renderTo, matchBox) {
            config = (typeof config === 'object') ? config :
                { tag: "div", role: 'presentation', cls: config };

            var me = this,
                proxy = renderTo ? Ext.DomHelper.append(renderTo, config, true) :
                                   Ext.DomHelper.insertBefore(me.dom, config, true);

            proxy.setVisibilityMode(Element.DISPLAY);
            proxy.hide();
            if (matchBox && me.setBox && me.getBox) { // check to make sure Element_position.js is loaded
               proxy.setBox(me.getBox());
            }
            return proxy;
        },

        /**
         * Clears any opacity settings from this element. Required in some cases for IE.
         * @return {Ext.dom.Element} this
         */
        clearOpacity: function() {
            return this.setOpacity('');
        },

        /**
         * Store the current overflow setting and clip overflow on the element - use {@link #unclip} to remove
         * @return {Ext.dom.Element} this
         */
        clip: function() {
            var me = this,
                data = me.getData(),
                style;

            if (!data[ISCLIPPED]) {
                data[ISCLIPPED] = true;
                style = me.getStyle([OVERFLOW, OVERFLOWX, OVERFLOWY]);
                data[ORIGINALCLIP] = {
                    o: style[OVERFLOW],
                    x: style[OVERFLOWX],
                    y: style[OVERFLOWY]
                };
                me.setStyle(OVERFLOW, HIDDEN);
                me.setStyle(OVERFLOWX, HIDDEN);
                me.setStyle(OVERFLOWY, HIDDEN);
            }
            return me;
        },

        destroy: function() {
            var me = this,
                dom = me.dom,
                data = me.getData(),
                maskEl, maskMsg;

            if (dom && me.isAnimate) {
                me.stopAnimation();
            }

            me.callParent();

            //<feature legacyBrowser>
            // prevent memory leaks in IE8
            // see http://social.msdn.microsoft.com/Forums/ie/en-US/c76967f0-dcf8-47d0-8984-8fe1282a94f5/ie-appendchildremovechild-memory-problem?forum=iewebdevelopment
            // must not be document, documentElement, body or window object
            // Have to use != instead of !== for IE8 or it will not recognize that the window
            // objects are equal
            if (dom && Ext.isIE8 && (dom.window != dom) && (dom.nodeType !== 9) &&
                    (dom.tagName !== 'BODY') && (dom.tagName !== 'HTML')) {
                destroyQueue[destroyQueue.length] = dom;


                // Will perform extra IE8 cleanup in 10 milliseconds
                // see http://social.msdn.microsoft.com/Forums/ie/en-US/c76967f0-dcf8-47d0-8984-8fe1282a94f5/ie-appendchildremovechild-memory-problem?forum=iewebdevelopment
                clearGarbage();
            }
            //</feature>

            if (data) {
                maskEl = data.maskEl;
                maskMsg = data.maskMsg;

                if (maskEl) {
                    maskEl.destroy();
                }

                if (maskMsg) {
                    maskMsg.destroy();
                }
            }
        },

        /**
         * Convenience method for setVisibilityMode(Element.DISPLAY).
         * @param {String} [display] What to set display to when visible
         * @return {Ext.dom.Element} this
         */
        enableDisplayMode : function(display) {
            var me = this;

            me.setVisibilityMode(Element.DISPLAY);

            if (display !== undefined) {
                me.getData()[ORIGINALDISPLAY] = display;
            }

            return me;
        },

        /**
         * Fade an element in (from transparent to opaque). The ending opacity can be specified using the `opacity`
         * config option. Usage:
         *
         *     // default: fade in from opacity 0 to 100%
         *     el.fadeIn();
         *
         *     // custom: fade in from opacity 0 to 75% over 2 seconds
         *     el.fadeIn({ opacity: .75, duration: 2000});
         *
         *     // common config options shown with default values
         *     el.fadeIn({
         *         opacity: 1, //can be any value between 0 and 1 (e.g. .5)
         *         easing: 'easeOut',
         *         duration: 500
         *     });
         *
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        fadeIn: function(o) {
            var me = this,
                dom = me.dom;
                
            me.animate(Ext.apply({}, o, {
                opacity: 1,
                internalListeners: {
                    beforeanimate: function(anim){
                        // restore any visibility/display that may have 
                        // been applied by a fadeout animation
                        var el = Ext.fly(dom, '_anim');
                        if (el.isStyle('display', 'none')) {
                            el.setDisplayed('');
                        } else {
                            el.show();
                        } 
                    }
                }
            }));
            return this;
        },

        /**
         * Fade an element out (from opaque to transparent). The ending opacity can be specified using the `opacity`
         * config option. Note that IE may require `useDisplay:true` in order to redisplay correctly.
         * Usage:
         *
         *     // default: fade out from the element's current opacity to 0
         *     el.fadeOut();
         *
         *     // custom: fade out from the element's current opacity to 25% over 2 seconds
         *     el.fadeOut({ opacity: .25, duration: 2000});
         *
         *     // common config options shown with default values
         *     el.fadeOut({
         *         opacity: 0, //can be any value between 0 and 1 (e.g. .5)
         *         easing: 'easeOut',
         *         duration: 500,
         *         remove: false,
         *         useDisplay: false
         *     });
         *
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        fadeOut: function(o) {
            var me = this,
                dom = me.dom;
                
            o = Ext.apply({
                opacity: 0,
                internalListeners: {
                    afteranimate: function(anim){
                        if (dom && anim.to.opacity === 0) {
                            var el = Ext.fly(dom, '_anim');
                            if (o.useDisplay) {
                                el.setDisplayed(false);
                            } else {
                                el.hide();
                            }
                        }         
                    }
                }
            }, o);
            me.animate(o);
            return me;
        },

        /**
         * @private
         */
        fixDisplay: function(){
            var me = this;
            if (me.isStyle(DISPLAY, NONE)) {
                me.setStyle(VISIBILITY, HIDDEN);
                me.setStyle(DISPLAY, getDisplay(me)); // first try reverting to default
                if (me.isStyle(DISPLAY, NONE)) { // if that fails, default to block
                    me.setStyle(DISPLAY, "block");
                }
            }
        },

        /**
         * Shows a ripple of exploding, attenuating borders to draw attention to an Element. Usage:
         *
         *     // default: a single light blue ripple
         *     el.frame();
         *
         *     // custom: 3 red ripples lasting 3 seconds total
         *     el.frame("#ff0000", 3, { duration: 3000 });
         *
         *     // common config options shown with default values
         *     el.frame("#C3DAF9", 1, {
         *         duration: 1000 // duration of each individual ripple.
         *         // Note: Easing is not configurable and will be ignored if included
         *     });
         *
         * @param {String} [color='#C3DAF9'] The hex color value for the border.
         * @param {Number} [count=1] The number of ripples to display.
         * @param {Object} [options] Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        frame: function(color, count, obj){
            var me = this,
                dom = me.dom,
                beforeAnim;

            color = color || '#C3DAF9';
            count = count || 1;
            obj = obj || {};

            beforeAnim = function() {
                var el = Ext.fly(dom, '_anim'),
                    animScope = this,
                    box,
                    proxy, proxyAnim;
                    
                el.show();
                box = el.getBox();
                proxy = Ext.getBody().createChild({
                    role: 'presentation',
                    id: el.dom.id + '-anim-proxy',
                    style: {
                        position : 'absolute',
                        'pointer-events': 'none',
                        'z-index': 35000,
                        border : '0px solid ' + color
                    }
                });
                
                proxyAnim = new Ext.fx.Anim({
                    target: proxy,
                    duration: obj.duration || 1000,
                    iterations: count,
                    from: {
                        top: box.y,
                        left: box.x,
                        borderWidth: 0,
                        opacity: 1,
                        height: box.height,
                        width: box.width
                    },
                    to: {
                        top: box.y - 20,
                        left: box.x - 20,
                        borderWidth: 10,
                        opacity: 0,
                        height: box.height + 40,
                        width: box.width + 40
                    }
                });
                proxyAnim.on('afteranimate', function() {
                    proxy.destroy();
                    // kill the no-op element animation created below
                    animScope.end();
                });
            };

            me.animate({
                // See "A Note About Wrapped Animations" at the top of this class:
                duration: (Math.max(obj.duration, 500) * 2) || 2000,
                listeners: {
                    beforeanimate: {
                        fn: beforeAnim
                    }
                },
                callback: obj.callback,
                scope: obj.scope
            });
            return me;
        },

        /**
         * Return the CSS color for the specified CSS attribute. rgb, 3 digit (like `#fff`)
         * and valid values are convert to standard 6 digit hex color.
         * @param {String} attr The css attribute
         * @param {String} defaultValue The default value to use when a valid color isn't found
         * @param {String} [prefix] defaults to #. Use an empty string when working with
         * color anims.
         * @private
         */
        getColor: function(attr, defaultValue, prefix) {
            var v = this.getStyle(attr),
                color = prefix || prefix === '' ? prefix : '#',
                h, len, i=0;

            if (!v || (/transparent|inherit/.test(v))) {
                return defaultValue;
            }
            if (/^r/.test(v)) {
                 v = v.slice(4, v.length - 1).split(',');
                 len = v.length;
                 for (; i<len; i++) {
                    h = parseInt(v[i], 10);
                    color += (h < 16 ? '0' : '') + h.toString(16);
                }
            } else {
                v = v.replace('#', '');
                color += v.length === 3 ? v.replace(/^(\w)(\w)(\w)$/, '$1$1$2$2$3$3') : v;
            }
            return(color.length > 5 ? color.toLowerCase() : defaultValue);
        },

        /**
         * Gets this element's {@link Ext.ElementLoader ElementLoader}
         * @return {Ext.ElementLoader} The loader
         */
        getLoader: function() {
            var me = this,
                data = me.getData(),
                loader = data.loader;

            if (!loader) {
                data.loader = loader = new Ext.ElementLoader({
                    target: me
                });
            }
            return loader;
        },

        /**
         * Gets an object with all CSS positioning properties. Useful along with
         * #setPostioning to get snapshot before performing an update and then restoring
         * the element.
         * @param {Boolean} [autoPx=false] true to return pixel values for "auto" styles.
         * @return {Object}
         */
        getPositioning: function(autoPx){
            var styles = this.getStyle(['left', 'top', 'position', 'z-index']),
                dom = this.dom;

            if(autoPx) {
                if(styles.left === 'auto') {
                    styles.left = dom.offsetLeft + 'px';
                }
                if(styles.top === 'auto') {
                    styles.top = dom.offsetTop + 'px';
                }
            }

            return styles;
        },

        /**
         * Slides the element while fading it out of view. An anchor point can be optionally passed to set the ending point
         * of the effect. Usage:
         *
         *     // default: slide the element downward while fading out
         *     el.ghost();
         *
         *     // custom: slide the element out to the right with a 2-second duration
         *     el.ghost('r', { duration: 2000 });
         *
         *     // common config options shown with default values
         *     el.ghost('b', {
         *         easing: 'easeOut',
         *         duration: 500
         *     });
         *
         * @param {String} anchor (optional) One of the valid {@link Ext.fx.Anim} anchor positions (defaults to bottom: 'b')
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        ghost: function(anchor, obj) {
            var me = this,
                dom = me.dom,
                beforeAnim;

            anchor = anchor || "b";
            beforeAnim = function() {
                var el = Ext.fly(dom, '_anim'),
                    width = el.getWidth(),
                    height = el.getHeight(),
                    xy = el.getXY(),
                    position = el.getPositioning(),
                    to = {
                        opacity: 0
                    };
                switch (anchor) {
                    case 't':
                        to.y = xy[1] - height;
                        break;
                    case 'l':
                        to.x = xy[0] - width;
                        break;
                    case 'r':
                        to.x = xy[0] + width;
                        break;
                    case 'b':
                        to.y = xy[1] + height;
                        break;
                    case 'tl':
                        to.x = xy[0] - width;
                        to.y = xy[1] - height;
                        break;
                    case 'bl':
                        to.x = xy[0] - width;
                        to.y = xy[1] + height;
                        break;
                    case 'br':
                        to.x = xy[0] + width;
                        to.y = xy[1] + height;
                        break;
                    case 'tr':
                        to.x = xy[0] + width;
                        to.y = xy[1] - height;
                        break;
                }
                this.to = to;
                this.on('afteranimate', function () {
                    var el = Ext.fly(dom, '_anim');
                    if (el) {
                        el.hide();
                        el.clearOpacity();
                        el.setPositioning(position);
                    }
                });
            };

            me.animate(Ext.applyIf(obj || {}, {
                duration: 500,
                easing: 'ease-out',
                listeners: {
                    beforeanimate: beforeAnim
                }
            }));
            return me;
        },

        /**
         * @override
         * Hide this element - Uses display mode to determine whether to use "display",
         * "visibility", or "offsets". See {@link #setVisible}.
         * @param {Boolean/Object} [animate] true for the default animation or a standard
         * Element animation config object
         * @return {Ext.dom.Element} this
         */
        hide: function(animate){
            // hideMode override
            if (typeof animate === 'string'){
                this.setVisible(false, animate);
                return this;
            }
            this.setVisible(false, this.anim(animate));
            return this;
        },

        /**
         * Highlights the Element by setting a color (applies to the background-color by default, but can be changed using
         * the "attr" config option) and then fading back to the original color. If no original color is available, you
         * should provide the "endColor" config option which will be cleared after the animation. Usage:
         *
         *     // default: highlight background to yellow
         *     el.highlight();
         *
         *     // custom: highlight foreground text to blue for 2 seconds
         *     el.highlight("0000ff", { attr: 'color', duration: 2000 });
         *
         *     // common config options shown with default values
         *     el.highlight("ffff9c", {
         *         attr: "backgroundColor", //can be any valid CSS property (attribute) that supports a color value
         *         endColor: (current color) or "ffffff",
         *         easing: 'easeIn',
         *         duration: 1000
         *     });
         *
         * @param {String} color (optional) The highlight color. Should be a 6 char hex color without the leading #
         * (defaults to yellow: 'ffff9c')
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        highlight: function(color, o) {
            var me = this,
                dom = me.dom,
                from = {},
                restore, to, attr, lns, event, fn;

            o = o || {};
            lns = o.listeners || {};
            attr = o.attr || 'backgroundColor';
            from[attr] = color || 'ffff9c';

            if (!o.to) {
                to = {};
                to[attr] = o.endColor || me.getColor(attr, 'ffffff', '');
            }
            else {
                to = o.to;
            }

            // Don't apply directly on lns, since we reference it in our own callbacks below
            o.listeners = Ext.apply(Ext.apply({}, lns), {
                beforeanimate: function() {
                    restore = dom.style[attr];
                    var el = Ext.fly(dom, '_anim');
                    el.clearOpacity();
                    el.show();

                    event = lns.beforeanimate;
                    if (event) {
                        fn = event.fn || event;
                        return fn.apply(event.scope || lns.scope || WIN, arguments);
                    }
                },
                afteranimate: function() {
                    if (dom) {
                        dom.style[attr] = restore;
                    }

                    event = lns.afteranimate;
                    if (event) {
                        fn = event.fn || event;
                        fn.apply(event.scope || lns.scope || WIN, arguments);
                    }
                }
            });

            me.animate(Ext.apply({}, o, {
                duration: 1000,
                easing: 'ease-in',
                from: from,
                to: to
            }));
            return me;
        },

        /**
         * Sets up event handlers to call the passed functions when the mouse is moved into and out of the Element.
         * @param {Function} overFn The function to call when the mouse enters the Element.
         * @param {Function} outFn The function to call when the mouse leaves the Element.
         * @param {Object} [scope] The scope (`this` reference) in which the functions are executed. Defaults
         * to the Element's DOM element.
         * @param {Object} [options] Options for the listener. See {@link Ext.util.Observable#addListener the
         * options parameter}.
         * @return {Ext.dom.Element} this
         */
        hover: function(overFn, outFn, scope, options) {
            var me = this;
            me.on('mouseenter', overFn, scope || me.dom, options);
            me.on('mouseleave', outFn, scope || me.dom, options);
            return me;
        },

        /**
         * Initializes a {@link Ext.dd.DD} drag drop object for this element.
         * @param {String} group The group the DD object is member of
         * @param {Object} config The DD config object
         * @param {Object} overrides An object containing methods to override/implement on the DD object
         * @return {Ext.dd.DD} The DD object
         */
        initDD: function(group, config, overrides){
            var dd = new Ext.dd.DD(Ext.id(this.dom), group, config);
            return Ext.apply(dd, overrides);
        },

        /**
         * Initializes a {@link Ext.dd.DDProxy} object for this element.
         * @param {String} group The group the DDProxy object is member of
         * @param {Object} config The DDProxy config object
         * @param {Object} overrides An object containing methods to override/implement on the DDProxy object
         * @return {Ext.dd.DDProxy} The DDProxy object
         */
        initDDProxy: function(group, config, overrides){
            var dd = new Ext.dd.DDProxy(Ext.id(this.dom), group, config);
            return Ext.apply(dd, overrides);
        },

        /**
         * Initializes a {@link Ext.dd.DDTarget} object for this element.
         * @param {String} group The group the DDTarget object is member of
         * @param {Object} config The DDTarget config object
         * @param {Object} overrides An object containing methods to override/implement on the DDTarget object
         * @return {Ext.dd.DDTarget} The DDTarget object
         */
        initDDTarget: function(group, config, overrides){
            var dd = new Ext.dd.DDTarget(Ext.id(this.dom), group, config);
            return Ext.apply(dd, overrides);
        },

        /**
         * Checks whether this element can be focused programmatically or by clicking.
         * To check if an element is in the document tab flow, use {@link #isTabbable}.
         *
         * @return {Boolean} True if the element is focusable
         */
        isFocusable: function() {
            var dom = this.dom,
                focusable = false,
                nodeName;
                
            if (dom && !dom.disabled) {
                nodeName = dom.nodeName;
                
                /*
                 * An element is focusable if:
                 *   - It is naturally focusable, or
                 *   - It is an anchor or link with href attribute, or
                 *   - It has a tabIndex, or
                 *   - It is an editing host (contenteditable="true")
                 *
                 * Also note that we can't check dom.tabIndex because IE will return 0
                 * for elements that have no tabIndex attribute defined, regardless of
                 * whether they are naturally focusable or not.
                 */
                focusable = !!Ext.Element.naturallyFocusableTags[nodeName]            ||
                            ((nodeName === 'A' || nodeName === 'LINK') && !!dom.href) ||
                            dom.getAttribute('tabindex') != null                      ||
                            dom.contentEditable === 'true';
                
                // In IE8, <input type="hidden"> does not have a corresponding style
                // so isVisible() will assume that it's not hidden.
                if (Ext.isIE8 && nodeName === 'INPUT' && dom.type === 'hidden') {
                    focusable = false;
                }
                
                // Invisible elements cannot be focused, so check that as well
                focusable = focusable && this.isVisible(true);
            }
            
            return focusable;
        },

        /**
         * Returns `true` if this Element is an input field, or is editable in any way.
         * @return {Boolean} `true` if this Element is an input field, or is editable in any way.
         */
        isInputField: function() {
            var dom = this.dom,
                contentEditable = dom.contentEditable;

            // contentEditable will default to inherit if not specified, only check if the
            // attribute has been set or explicitly set to true
            // http://html5doctor.com/the-contenteditable-attribute/
            // Also skip <input> tags of type="button", we use them for checkboxes
            // and radio buttons
            if ((inputTags[dom.tagName] && dom.type !== 'button') ||
                (contentEditable === '' || contentEditable === 'true')) {
                return true;
            }
            return false;
        },
        
        /**
         * Checks whether this element participates in the sequential focus navigation,
         * and can be reached by using Tab key.
         *
         * @return {Boolean} True if the element is tabbable.
         */
        isTabbable: function() {
            var dom = this.dom,
                tabbable = false,
                nodeName, hasIndex, tabIndex;
            
            if (dom && !dom.disabled) {
                nodeName = dom.nodeName;
                
                // Can't use dom.tabIndex here because IE will return 0 for elements
                // that have no tabindex attribute defined, regardless of whether they are
                // naturally tabbable or not.
                tabIndex = dom.getAttribute('tabindex');
                hasIndex = tabIndex != null;
                
                tabIndex -= 0;
                
                // Anchors and links are only naturally tabbable if they have href attribute
                // See http://www.w3.org/TR/html5/editing.html#specially-focusable
                if (nodeName === 'A' || nodeName === 'LINK') {
                    if (dom.href) {
                        // It is also possible to make an anchor untabbable by setting
                        // tabIndex < 0 on it
                        tabbable = hasIndex && tabIndex < 0 ? false : true;
                    }
                    
                    // Anchor w/o href is tabbable if it has tabIndex >= 0,
                    // or if it's editable 
                    else {
                        if (dom.contentEditable === 'true') {
                            tabbable = !hasIndex || (hasIndex && tabIndex >= 0) ? true : false;
                        }
                        else {
                            tabbable = hasIndex && tabIndex >= 0 ? true : false;
                        }
                    }
                }
                
                // If an element has contenteditable="true" or is naturally tabbable,
                // then it is a potential candidate unless its tabIndex is < 0.
                else if (dom.contentEditable === 'true' || 
                         Ext.Element.naturallyTabbableTags[nodeName]) {
                    tabbable = hasIndex && tabIndex < 0 ? false : true;
                }
                
                // That leaves non-editable elements that can only be made tabbable
                // by slapping tabIndex >= 0 on them
                else {
                    if (hasIndex && tabIndex >= 0) {
                        tabbable = true;
                    }
                }
                
                // In IE8, <input type="hidden"> does not have a corresponding style
                // so isVisible() will assume that it's not hidden.
                if (Ext.isIE8 && nodeName === 'INPUT' && dom.type === 'hidden') {
                    tabbable = false;
                }
                
                // Invisible elements can't be tabbed into. If we have a component ref
                // we'll also check if the component itself is visible before incurring
                // the expense of DOM style reads.
                tabbable = tabbable &&
                           (!this.component || this.component.isVisible(true)) &&
                           this.isVisible(true);
            }
            
            return tabbable;
        },
        
        /**
         * Returns true if this element is masked. Also re-centers any displayed message
         * within the mask.
         *
         * @param {Boolean} [deep] Go up the DOM hierarchy to determine if any parent
         * element is masked.
         *
         * @return {Boolean}
         */
        isMasked: function(deep) {
            var me = this,
                data = me.getData(),
                maskEl = data.maskEl,
                maskMsg = data.maskMsg,
                hasMask = false,
                parent;

            if (maskEl && maskEl.isVisible()) {
                if (maskMsg) {
                    maskMsg.center(me);
                }
                hasMask = true;
            }
            else if (deep) {
                parent = me.findParentNode();
                
                if (parent) {
                    return Ext.fly(parent).isMasked(deep);
                }
            }
            
            return hasMask;
        },

        /**
         * Returns true if this element is scrollable.
         * @return {Boolean}
         */
        isScrollable: function() {
            var dom = this.dom;
            return dom.scrollHeight > dom.clientHeight || dom.scrollWidth > dom.clientWidth;
        },

        /**
         * Direct access to the Ext.ElementLoader {@link Ext.ElementLoader#method-load} method.
         * The method takes the same object parameter as {@link Ext.ElementLoader#method-load}
         * @param {Object} options a options object for Ext.ElementLoader {@link Ext.ElementLoader#method-load}
         * @return {Ext.dom.Element} this
         */
        load: function(options) {
            this.getLoader().load(options);
            return this;
        },

        /**
        * Puts a mask over this element to disable user interaction.
        * This method can only be applied to elements which accept child nodes. Use 
        * {@link #unmask} to remove the mask.
        * 
        * @param {String} [msg] A message to display in the mask
        * @param {String} [msgCls] A css class to apply to the msg element
        * @return {Ext.dom.Element} The mask element
        */
        mask: function (msg, msgCls /* private - passed by AbstractComponent.mask to avoid the need to interrogate the DOM to get the height*/, elHeight) {
            var me = this,
                dom = me.dom,
                data = me.getData(),
                maskEl = data.maskEl,
                maskMsg;

            if (!(bodyRe.test(dom.tagName) && me.getStyle('position') === 'static')) {
                me.addCls(XMASKEDRELATIVE);
            }

            // We always needs to recreate the mask since the DOM element may have been re-created
            if (maskEl) {
                maskEl.destroy();
            }

            maskEl = Ext.DomHelper.append(dom, {
                role: 'presentation',
                cls : Ext.baseCSSPrefix + "mask " + Ext.baseCSSPrefix + "border-box",
                children: {
                    role: 'presentation',
                    cls : msgCls ? EXTELMASKMSG + " " + msgCls : EXTELMASKMSG,
                    cn  : {
                        tag: 'div',
                        role: 'presentation',
                        cls: Ext.baseCSSPrefix + 'mask-msg-inner',
                        cn: {
                            tag: 'div',
                            role: 'presentation',
                            cls: Ext.baseCSSPrefix + 'mask-msg-text',
                            html: msg || ''
                        }
                    }
                }
            }, true);
            maskMsg = Ext.get(maskEl.dom.firstChild);

            data.maskEl = maskEl;

            me.addCls(XMASKED);
            maskEl.setDisplayed(true);

            if (typeof msg === 'string') {
                maskMsg.setDisplayed(true);
                maskMsg.center(me);
            } else {
                maskMsg.setDisplayed(false);
            }

            // When masking the body, don't touch its tabbable state
            if (dom === DOC.body) {
                maskEl.addCls(Ext.baseCSSPrefix + 'mask-fixed');
            }
            else {
                me.saveTabbableState();
            }
            
            me.saveChildrenTabbableState();

            // ie will not expand full height automatically
            if (Ext.isIE9m && dom !== DOC.body && me.isStyle('height', 'auto')) {
                maskEl.setSize(undefined, elHeight || me.getHeight());
            }
            return maskEl;
        },

        /**
         * Monitors this Element for the mouse leaving. Calls the function after the specified delay only if
         * the mouse was not moved back into the Element within the delay. If the mouse *was* moved
         * back in, the function is not called.
         * @param {Number} delay The delay **in milliseconds** to wait for possible mouse re-entry before calling the handler function.
         * @param {Function} handler The function to call if the mouse remains outside of this Element for the specified time.
         * @param {Object} [scope] The scope (`this` reference) in which the handler function executes. Defaults to this Element.
         * @return {Object} The listeners object which was added to this element so that monitoring can be stopped. Example usage:
         *
         *     // Hide the menu if the mouse moves out for 250ms or more
         *     this.mouseLeaveMonitor = this.menuEl.monitorMouseLeave(250, this.hideMenu, this);
         *
         *     ...
         *     // Remove mouseleave monitor on menu destroy
         *     this.menuEl.un(this.mouseLeaveMonitor);
         *
         */
        monitorMouseLeave: function(delay, handler, scope) {
            var me = this,
                timer,
                listeners = {
                    mouseleave: function(e) {
                        //<feature legacyBrowser>
                        if (Ext.isIE9m) {
                            e.enableIEAsync();
                        }
                        //</feature>
                        timer = Ext.defer(handler, delay, scope || me, [e]);
                    },
                    mouseenter: function() {
                        clearTimeout(timer);
                    }
                };

            me.on(listeners);
            return listeners;
        },

        /**
         * Fades the element out while slowly expanding it in all directions. When the effect is completed, the element will
         * be hidden (visibility = 'hidden') but block elements will still take up space in the document. Usage:
         *
         *     // default
         *     el.puff();
         *
         *     // common config options shown with default values
         *     el.puff({
         *         easing: 'easeOut',
         *         duration: 500,
         *         useDisplay: false
         *     });
         *
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        puff: function(obj) {
            var me = this,
                dom = me.dom,
                beforeAnim,
                box = me.getBox(),
                originalStyles = me.getStyle(['width', 'height', 'left', 'right', 'top', 'bottom', 'position', 'z-index', 'font-size', 'opacity'], true);

            obj = Ext.applyIf(obj || {}, {
                easing: 'ease-out',
                duration: 500,
                useDisplay: false
            });

            beforeAnim = function() {
                var el = Ext.fly(dom, '_anim');
                
                el.clearOpacity();
                el.show();
                this.to = {
                    width: box.width * 2,
                    height: box.height * 2,
                    x: box.x - (box.width / 2),
                    y: box.y - (box.height /2),
                    opacity: 0,
                    fontSize: '200%'
                };
                this.on('afteranimate',function() {
                    var el = Ext.fly(dom, '_anim');
                    if (el) {
                        if (obj.useDisplay) {
                            el.setDisplayed(false);
                        } else {
                            el.hide();
                        }
                        el.setStyle(originalStyles);
                        Ext.callback(obj.callback, obj.scope);
                    }
                });
            };

            me.animate({
                duration: obj.duration,
                easing: obj.easing,
                listeners: {
                    beforeanimate: {
                        fn: beforeAnim
                    }
                }
            });
            return me;
        },

        /**
         * Enable text selection for this element (normalized across browsers)
         * @return {Ext.dom.Element} this
         */
        selectable: function() {
            var me = this;

            // We clear this property for all browsers, not just Opera. This is so that rendering templates don't need to
            // condition on Opera when making elements unselectable.
            me.dom.unselectable = '';

            me.removeCls(Element.unselectableCls);
            me.addCls(Element.selectableCls);

            return me;
        },
        
        //<feature legacyBrowser>
        // private
        // used to ensure the mouseup event is captured if it occurs outside of the
        // window in IE9m.  The only reason this method exists, (vs just calling
        // el.dom.setCapture() directly) is so that we can override it to emptyFn
        // during testing because setCapture() can wreak havoc on emulated mouse events
        // http://msdn.microsoft.com/en-us/library/windows/desktop/ms646262(v=vs.85).aspx
        setCapture: function() {
            var dom = this.dom;
            if (Ext.isIE9m && dom.setCapture) {
                dom.setCapture();
            }
        },
        //</feature>

        /**
         * Sets the CSS display property. Uses originalDisplay if the specified value is a
         * boolean true.
         * @param {Boolean/String} value Boolean value to display the element using its
         * default display, or a string to set the display directly.
         * @return {Ext.dom.Element} this
         */
        setDisplayed: function(value) {
            var me = this;

            if (typeof value === "boolean"){
               value = value ? getDisplay(me) : NONE;
            }
            me.setStyle(DISPLAY, value);

            if (me.shadow || me.shim) {
                me.setUnderlaysVisible(value !== NONE);
            }

            return me;
        },

        /**
         * Set the height of this Element.
         * 
         *     // change the height to 200px and animate with default configuration
         *     Ext.fly('elementId').setHeight(200, true);
         *
         *     // change the height to 150px and animate with a custom configuration
         *     Ext.fly('elId').setHeight(150, {
         *         duration : 500, // animation will have a duration of .5 seconds
         *         // will change the content to "finished"
         *         callback: function(){ this.{@link #setHtml}("finished"); }
         *     });
         *     
         * @param {Number/String} height The new height. This may be one of:
         *
         * - A Number specifying the new height in pixels.
         * - A String used to set the CSS height style. Animation may **not** be used.
         *     
         * @param {Boolean/Object} [animate] a standard Element animation config object or `true` for
         * the default animation (`{duration: 350, easing: 'ease-in'}`)
         * @return {Ext.dom.Element} this
         */
        setHeight: function(height, animate) {
            var me = this;

            if (!animate || !me.anim) {
                me.callParent(arguments);
            }
            else {
                if (!Ext.isObject(animate)) {
                    animate = {};
                }
                me.animate(Ext.applyIf({
                    to: {
                        height: height
                    }
                }, animate));
            }

            return me;
        },

        /**
         * Removes "vertical" state from this element (reverses everything done
         * by {@link #setVertical}).
         * @private
         */
        setHorizontal: function() {
            var me = this,
                cls = me.verticalCls;

            delete me.vertical;
            if (cls) {
                delete me.verticalCls;
                me.removeCls(cls);
            }

            // delete the inverted methods and revert to inheriting from the prototype 
            delete me.setWidth;
            delete me.setHeight;
            if (!Ext.isIE8) {
                delete me.getWidth;
                delete me.getHeight;
            }

            // revert to inheriting styleHooks from the prototype
            delete me.styleHooks;
        },

        /**
         * Updates the *text* value of this element.
         * Replaces the content of this element with a *single text node* containing the passed text.
         * @param {String} text The text to display in this Element.
         */
        updateText: function(text) {
            var me = this,
                dom,
                textNode;

            if (dom) {
                textNode = dom.firstChild;
                if (!textNode || (textNode.nodeType !== 3 || textNode.nextSibling)) {
                    textNode = DOC.createTextNode();
                    me.empty();
                    dom.appendChild(textNode);
                }
                if (text) {
                    textNode.data = text;
                }
            }
        },

        /**
         * Updates the innerHTML of this element, optionally searching for and processing scripts.
         * @param {String} html The new HTML
         * @param {Boolean} [loadScripts] True to look for and process scripts (defaults to false)
         * @param {Function} [callback] For async script loading you can be notified when the update completes
         * @return {Ext.dom.Element} this
         */
        setHtml: function(html, loadScripts, callback) {
            var me = this,
                id,
                dom,
                interval;

            if (!me.dom) {
                return me;
            }
            html = html || '';
            dom = me.dom;

            if (loadScripts !== true) {
                dom.innerHTML = html;
                Ext.callback(callback, me);
                return me;
            }

            id  = Ext.id();
            html += '<span id="' + id + '" role="presentation"></span>';

            interval = Ext.interval(function() {
                var hd,
                    match,
                    attrs,
                    srcMatch,
                    typeMatch,
                    el,
                    s;
                if (!(el = DOC.getElementById(id))) {
                    return false;
                }
                clearInterval(interval);
                Ext.removeNode(el);
                hd = Ext.getHead().dom;

                while ((match = scriptTagRe.exec(html))) {
                    attrs = match[1];
                    srcMatch = attrs ? attrs.match(srcRe) : false;
                    if (srcMatch && srcMatch[2]) {
                       s = DOC.createElement("script");
                       s.src = srcMatch[2];
                       typeMatch = attrs.match(typeRe);
                       if (typeMatch && typeMatch[2]) {
                           s.type = typeMatch[2];
                       }
                       hd.appendChild(s);
                    } else if (match[2] && match[2].length > 0) {
                        (WIN.execScript || WIN.eval)(match[2]); // jshint ignore:line
                    }
                }
                Ext.callback(callback, me);
            }, 20);
            dom.innerHTML = html.replace(replaceScriptTagRe, '');
            return me;
        },

        /**
         * Set the opacity of the element
         * @param {Number} opacity The new opacity. 0 = transparent, .5 = 50% visible, 1 = fully visible, etc
         * @param {Boolean/Object} [animate] a standard Element animation config object or `true` for
         * the default animation (`{duration: 350, easing: 'ease-in'}`)
         * @return {Ext.dom.Element} this
         */
        setOpacity: function(opacity, animate) {
            var me = this;

            if (!me.dom) {
                return me;
            }

            if (!animate || !me.anim) {
                me.setStyle('opacity', opacity);
            }
            else {
                if (typeof animate != 'object') {
                    animate = {
                        duration: 350,
                        easing: 'ease-in'
                    };
                }

                me.animate(Ext.applyIf({
                    to: {
                        opacity: opacity
                    }
                }, animate));
            }
            return me;
        },

        /**
         * Set positioning with an object returned by #getPositioning.
         * @param {Object} posCfg
         * @return {Ext.dom.Element} this
         */
        setPositioning: function(pc) {
            return this.setStyle(pc);
        },

        /**
         * Changes this Element's state to "vertical" (rotated 90 or 270 degrees).
         * This involves inverting the getters and setters for height and width,
         * and applying hooks for rotating getters and setters for border/margin/padding.
         * (getWidth becomes getHeight and vice versa), setStyle and getStyle will
         * also return the inverse when height or width are being operated on.
         * 
         * @param {Number} angle the angle of rotation - either 90 or 270
         * @param {String} cls an optional css class that contains the required
         * styles for switching the element to vertical orientation. Omit this if
         * the element already contains vertical styling.  If cls is provided,
         * it will be removed from the element when {@link #setHorizontal} is called.
         * @private
         */
        setVertical: function(angle, cls) {
            var me = this,
                proto = Element.prototype;

            me.vertical = true;
            if (cls) {
                me.addCls(me.verticalCls = cls);
            }

            me.setWidth = proto.setHeight;
            me.setHeight = proto.setWidth;
            if (!Ext.isIE8) {
                // In browsers that use CSS3 transforms we must invert getHeight and
                // get Width. In IE8 no adjustment is needed because we use
                // a BasicImage filter to rotate the element and the element's
                // offsetWidth and offsetHeight are automatically inverted.
                me.getWidth = proto.getHeight;
                me.getHeight = proto.getWidth;
            }

            // Switch to using the appropriate vertical style hooks
            me.styleHooks = (angle === 270) ?
                proto.verticalStyleHooks270 : proto.verticalStyleHooks90;
        },

        /**
         * Set the size of this Element. If animation is true, both width and height will be animated concurrently.
         * @param {Number/String} width The new width. This may be one of:
         *
         * - A Number specifying the new width in pixels.
         * - A String used to set the CSS width style. Animation may **not** be used.
         * - A size object in the format `{width: widthValue, height: heightValue}`.
         *
         * @param {Number/String} height The new height. This may be one of:
         *
         * - A Number specifying the new height in  pixels.
         * - A String used to set the CSS height style. Animation may **not** be used.
         *
         * @param {Boolean/Object} [animate] a standard Element animation config object or `true` for
         * the default animation (`{duration: 350, easing: 'ease-in'}`)
         *
         * @return {Ext.dom.Element} this
         */
        setSize: function(width, height, animate) {
            var me = this;

            if (Ext.isObject(width)) { // in case of object from getSize()
                animate = height;
                height = width.height;
                width = width.width;
            }

            if (!animate || !me.anim) {
                me.dom.style.width = Element.addUnits(width);
                me.dom.style.height = Element.addUnits(height);

                if (me.shadow || me.shim) {
                    me.syncUnderlays();
                }
            }
            else {
                if (animate === true) {
                    animate = {};
                }
                me.animate(Ext.applyIf({
                    to: {
                        width: width,
                        height: height
                    }
                }, animate));
            }

            return me;
        },

        /**
         * Sets the visibility of the element (see details). If the visibilityMode is set to Element.DISPLAY, it will use
         * the display property to hide the element, otherwise it uses visibility. The default is to hide and show using the visibility property.
         * @param {Boolean} visible Whether the element is visible
         * @param {Boolean/Object} [animate] True for the default animation, or a standard Element animation config object
         * @return {Ext.dom.Element} this
         */
        setVisible: function(visible, animate) {
            var me = this,
                dom = me.dom,
                visMode = getVisMode(me);

            // hideMode string override
            if (typeof animate === 'string') {
                switch (animate) {
                    case DISPLAY:
                        visMode = Element.DISPLAY;
                        break;
                    case VISIBILITY:
                        visMode = Element.VISIBILITY;
                        break;
                    case OFFSETS:
                        visMode = Element.OFFSETS;
                        break;
                }
                me.setVisibilityMode(visMode);
                animate = false;
            }

            if (!animate || !me.anim) {
                if (visMode === Element.DISPLAY) {
                    return me.setDisplayed(visible);
                } else if (visMode === Element.OFFSETS) {
                    me[visible?'removeCls':'addCls'](OFFSETCLASS);
                } else if (visMode === Element.VISIBILITY) {
                    me.fixDisplay();
                    // Show by clearing visibility style. Explicitly setting to "visible" overrides parent visibility setting
                    dom.style.visibility = visible ? '' : HIDDEN;
                }
            } else {
                // closure for composites
                if (visible) {
                    me.setOpacity(0.01);
                    me.setVisible(true);
                }
                if (!Ext.isObject(animate)) {
                    animate = {
                        duration: 350,
                        easing: 'ease-in'
                    };
                }
                me.animate(Ext.applyIf({
                    callback: function() {
                        if (!visible) {
                            
                            // Grab the dom again, since the reference may have changed if we use fly
                            Ext.fly(dom).setVisible(false).setOpacity(1);
                        }
                    },
                    to: {
                        opacity: (visible) ? 1 : 0
                    }
                }, animate));
            }
            me.getData()[ISVISIBLE] = visible;

            if (me.shadow || me.shim) {
                me.setUnderlaysVisible(visible);
            }

            return me;
        },

        /**
         * Set the width of this Element.
         * 
         *     // change the width to 200px and animate with default configuration
         *     Ext.fly('elementId').setWidth(200, true);
         *
         *     // change the width to 150px and animate with a custom configuration
         *     Ext.fly('elId').setWidth(150, {
         *         duration : 500, // animation will have a duration of .5 seconds
         *         // will change the content to "finished"
         *         callback: function(){ this.{@link #setHtml}("finished"); }
         *     });
         *     
         * @param {Number/String} width The new width. This may be one of:
         *
         * - A Number specifying the new width in pixels.
         * - A String used to set the CSS width style. Animation may **not** be used.
         * 
         * @param {Boolean/Object} [animate] a standard Element animation config object or `true` for
         * the default animation (`{duration: 350, easing: 'ease-in'}`)
         * @return {Ext.dom.Element} this
         */
        setWidth: function(width, animate) {
            var me = this;
            if (!animate || !me.anim) {
                me.callParent(arguments);
            }
            else {
                if (!Ext.isObject(animate)) {
                    animate = {};
                }
                me.animate(Ext.applyIf({
                    to: {
                        width: width
                    }
                }, animate));
            }
            return me;
        },

        setX: function(x, animate) {
            return this.setXY([x, this.getY()], animate);
        },

        setXY: function(xy, animate) {
            var me = this;

            if (!animate || !me.anim) {
                me.callParent([xy]);
            } else {
                if (!Ext.isObject(animate)) {
                    animate = {};
                }
                me.animate(Ext.applyIf({ to: { x: xy[0], y: xy[1] } }, animate));
            }
            return this;
        },

        setY: function(y, animate) {
            return this.setXY([this.getX(), y], animate);
        },

        /**
         * Show this element - Uses display mode to determine whether to use "display",
         * "visibility", or "offsets". See {@link #setVisible}.
         * @param {Boolean/Object} [animate] true for the default animation or a standard
         * Element animation config object
         * @return {Ext.dom.Element} this
         */
        show: function(animate){
            // hideMode override
            if (typeof animate === 'string'){
                this.setVisible(true, animate);
                return this;
            }
            this.setVisible(true, this.anim(animate));
            return this;
        },

        /**
         * Slides the element into view. An anchor point can be optionally passed to set the point of origin for the slide
         * effect. This function automatically handles wrapping the element with a fixed-size container if needed. See the
         * {@link Ext.fx.Anim} class overview for valid anchor point options. Usage:
         *
         *     // default: slide the element in from the top
         *     el.slideIn();
         *
         *     // custom: slide the element in from the right with a 2-second duration
         *     el.slideIn('r', { duration: 2000 });
         *
         *     // common config options shown with default values
         *     el.slideIn('t', {
         *         easing: 'easeOut',
         *         duration: 500
         *     });
         *
         * @param {String} anchor (optional) One of the valid {@link Ext.fx.Anim} anchor positions (defaults to top: 't')
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @param {Boolean} options.preserveScroll Set to true if preservation of any descendant elements'
         * `scrollTop` values is required. By default the DOM wrapping operation performed by `slideIn` and
         * `slideOut` causes the browser to lose all scroll positions.
         * @return {Ext.dom.Element} The Element
         */
        slideIn: function(anchor, obj, slideOut) {
            var me = this,
                dom = me.dom,
                elStyle = dom.style,
                beforeAnim,
                wrapAnim,
                restoreScroll,
                wrapDomParentNode;

            anchor = anchor || "t";
            obj = obj || {};

            beforeAnim = function() {
                var animScope = this,
                    listeners = obj.listeners,
                    el = Ext.fly(dom, '_anim'),
                    box, originalStyles, anim, wrap;

                if (!slideOut) {
                    el.fixDisplay();
                }

                box = el.getBox();
                if ((anchor == 't' || anchor == 'b') && box.height === 0) {
                    box.height = dom.scrollHeight;
                }
                else if ((anchor == 'l' || anchor == 'r') && box.width === 0) {
                    box.width = dom.scrollWidth;
                }

                originalStyles = el.getStyle(['width', 'height', 'left', 'right', 'top', 'bottom', 'position', 'z-index'], true);
                el.setSize(box.width, box.height);

                // Cache all descendants' scrollTop & scrollLeft values if configured to preserve scroll.
                if (obj.preserveScroll) {
                    restoreScroll = el.cacheScrollValues();
                }

                wrap = el.wrap({
                    role: 'presentation',
                    id: Ext.id() + '-anim-wrap-for-' + el.dom.id,
                    style: {
                        visibility: slideOut ? 'visible' : 'hidden'
                    }
                });
                wrapDomParentNode = wrap.dom.parentNode;
                wrap.setPositioning(el.getPositioning());
                if (wrap.isStyle('position', 'static')) {
                    wrap.position('relative');
                }
                el.clearPositioning('auto');
                wrap.clip();

                // The wrap will have reset all descendant scrollTops. Restore them if we cached them.
                if (restoreScroll) {
                    restoreScroll();
                }

                // This element is temporarily positioned absolute within its wrapper.
                // Restore to its default, CSS-inherited visibility setting.
                // We cannot explicitly poke visibility:visible into its style because that overrides the visibility of the wrap.
                el.setStyle({
                    visibility: '',
                    position: 'absolute'
                });
                if (slideOut) {
                    wrap.setSize(box.width, box.height);
                }

                switch (anchor) {
                    case 't':
                        anim = {
                            from: {
                                width: box.width + 'px',
                                height: '0px'
                            },
                            to: {
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        elStyle.bottom = '0px';
                        break;
                    case 'l':
                        anim = {
                            from: {
                                width: '0px',
                                height: box.height + 'px'
                            },
                            to: {
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        me.anchorAnimX(anchor);
                        break;
                    case 'r':
                        anim = {
                            from: {
                                x: box.x + box.width,
                                width: '0px',
                                height: box.height + 'px'
                            },
                            to: {
                                x: box.x,
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        me.anchorAnimX(anchor);
                        break;
                    case 'b':
                        anim = {
                            from: {
                                y: box.y + box.height,
                                width: box.width + 'px',
                                height: '0px'
                            },
                            to: {
                                y: box.y,
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        break;
                    case 'tl':
                        anim = {
                            from: {
                                x: box.x,
                                y: box.y,
                                width: '0px',
                                height: '0px'
                            },
                            to: {
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        elStyle.bottom = '0px';
                        me.anchorAnimX('l');
                        break;
                    case 'bl':
                        anim = {
                            from: {
                                y: box.y + box.height,
                                width: '0px',
                                height: '0px'
                            },
                            to: {
                                y: box.y,
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        me.anchorAnimX('l');
                        break;
                    case 'br':
                        anim = {
                            from: {
                                x: box.x + box.width,
                                y: box.y + box.height,
                                width: '0px',
                                height: '0px'
                            },
                            to: {
                                x: box.x,
                                y: box.y,
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        me.anchorAnimX('r');
                        break;
                    case 'tr':
                        anim = {
                            from: {
                                x: box.x + box.width,
                                width: '0px',
                                height: '0px'
                            },
                            to: {
                                x: box.x,
                                width: box.width + 'px',
                                height: box.height + 'px'
                            }
                        };
                        elStyle.bottom = '0px';
                        me.anchorAnimX('r');
                        break;
                }

                wrap.show();
                wrapAnim = Ext.apply({}, obj);
                delete wrapAnim.listeners;
                wrapAnim = new Ext.fx.Anim(Ext.applyIf(wrapAnim, {
                    target: wrap,
                    duration: 500,
                    easing: 'ease-out',
                    from: slideOut ? anim.to : anim.from,
                    to: slideOut ? anim.from : anim.to
                }));

                // In the absence of a callback, this listener MUST be added first
                wrapAnim.on('afteranimate', function() {
                    var el = Ext.fly(dom, '_anim');
                    
                    el.setStyle(originalStyles);
                    if (slideOut) {
                        if (obj.useDisplay) {
                            el.setDisplayed(false);
                        } else {
                            el.hide();
                        }
                    }
                    if (wrap.dom) {
                        if (wrap.dom.parentNode) {
                            wrap.dom.parentNode.insertBefore(el.dom, wrap.dom);
                        } else {
                            wrapDomParentNode.appendChild(el.dom);
                        }
                        wrap.destroy();
                    }
                    // The unwrap will have reset all descendant scrollTops. Restore them if we cached them.
                    if (restoreScroll) {
                        restoreScroll();
                    }
                    // kill the no-op element animation created below
                    animScope.end();
                });
                // Add configured listeners after
                if (listeners) {
                    wrapAnim.on(listeners);
                }
            };

            me.animate({
                // See "A Note About Wrapped Animations" at the top of this class:
                duration: obj.duration ? Math.max(obj.duration, 500) * 2 : 1000,
                listeners: {
                    beforeanimate: beforeAnim // kick off the wrap animation
                }
            });
            return me;
        },

        /**
         * Slides the element out of view. An anchor point can be optionally passed to set the end point for the slide
         * effect. When the effect is completed, the element will be hidden (visibility = 'hidden') but block elements will
         * still take up space in the document. The element must be removed from the DOM using the 'remove' config option if
         * desired. This function automatically handles wrapping the element with a fixed-size container if needed. See the
         * {@link Ext.fx.Anim} class overview for valid anchor point options. Usage:
         *
         *     // default: slide the element out to the top
         *     el.slideOut();
         *
         *     // custom: slide the element out to the right with a 2-second duration
         *     el.slideOut('r', { duration: 2000 });
         *
         *     // common config options shown with default values
         *     el.slideOut('t', {
         *         easing: 'easeOut',
         *         duration: 500,
         *         remove: false,
         *         useDisplay: false
         *     });
         *
         * @param {String} anchor (optional) One of the valid {@link Ext.fx.Anim} anchor positions (defaults to top: 't')
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        slideOut: function(anchor, o) {
            return this.slideIn(anchor, o, true);
        },

        /**
         * Stops the specified event(s) from bubbling and optionally prevents the default action
         * 
         *     var store = Ext.create('Ext.data.Store', {
         *         fields: ['name', 'email'],
         *         data: [{
         *             'name': 'Finn',
         *             "email": "finn@adventuretime.com"
         *         }]
         *     });
         *     
         *     Ext.create('Ext.grid.Panel', {
         *         title: 'Land of Ooo',
         *         store: store,
         *         columns: [{
         *             text: 'Name',
         *             dataIndex: 'name'
         *         }, {
         *             text: 'Email <img style="vertical-align:middle;" src="{some-help-image-src}" />',
         *             dataIndex: 'email',
         *             flex: 1,
         *             listeners: {
         *                 render: function(col) {
         *                     // Swallow the click event when the click occurs on the
         *                     // help icon - preventing the sorting of data by that
         *                     // column and instead performing an action specific to
         *                     // the help icon
         *                     var img = col.getEl().down('img');
         *                     img.swallowEvent(['click', 'mousedown'], true);
         *                     col.on('click', function() {
         *                         // logic to show a help dialog
         *                         console.log('image click handler');
         *                     }, col);
         *                 }
         *             }
         *         }],
         *         height: 200,
         *         width: 400,
         *         renderTo: document.body
         *     });
         *
         * @param {String/String[]} eventName an event / array of events to stop from bubbling
         * @param {Boolean} [preventDefault] true to prevent the default action too
         * @return {Ext.dom.Element} this
         */
        swallowEvent: function(eventName, preventDefault) {
            var me = this,
                e, eLen,
                fn = function(e) {
                    e.stopPropagation();
                    if (preventDefault) {
                        e.preventDefault();
                    }
                };

            if (Ext.isArray(eventName)) {
                eLen = eventName.length;

                for (e = 0; e < eLen; e++) {
                    me.on(eventName[e], fn);
                }

                return me;
            }
            me.on(eventName, fn);
            return me;
        },

        /**
         * Blinks the element as if it was clicked and then collapses on its center (similar to switching off a television).
         * When the effect is completed, the element will be hidden (visibility = 'hidden') but block elements will still
         * take up space in the document. The element must be removed from the DOM using the 'remove' config option if
         * desired. Usage:
         *
         *     // default
         *     el.switchOff();
         *
         *     // all config options shown with default values
         *     el.switchOff({
         *         easing: 'easeIn',
         *         duration: .3,
         *         remove: false,
         *         useDisplay: false
         *     });
         *
         * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
         * @return {Ext.dom.Element} The Element
         */
        switchOff: function(obj) {
            var me = this,
                dom = me.dom,
                beforeAnim;

            obj = Ext.applyIf(obj || {}, {
                easing: 'ease-in',
                duration: 500,
                remove: false,
                useDisplay: false
            });

            beforeAnim = function() {
                var el = Ext.fly(dom, '_anim'),
                    animScope = this,
                    size = el.getSize(),
                    xy = el.getXY(),
                    keyframe, position;
                    
                el.clearOpacity();
                el.clip();
                position = el.getPositioning();

                keyframe = new Ext.fx.Animator({
                    target: dom,
                    duration: obj.duration,
                    easing: obj.easing,
                    keyframes: {
                        33: {
                            opacity: 0.3
                        },
                        66: {
                            height: 1,
                            y: xy[1] + size.height / 2
                        },
                        100: {
                            width: 1,
                            x: xy[0] + size.width / 2
                        }
                    }
                });
                keyframe.on('afteranimate', function() {
                    var el = Ext.fly(dom, '_anim');
                    if (obj.useDisplay) {
                        el.setDisplayed(false);
                    } else {
                        el.hide();
                    }
                    el.clearOpacity();
                    el.setPositioning(position);
                    el.setSize(size);
                    // kill the no-op element animation created below
                    animScope.end();
                });
            };
            
            me.animate({
                // See "A Note About Wrapped Animations" at the top of this class:
                duration: (Math.max(obj.duration, 500) * 2),
                listeners: {
                    beforeanimate: {
                        fn: beforeAnim
                    }
                },
                callback: obj.callback,
                scope: obj.scope
            });
            return me;
        },

        /**
         * @private.
         * Currently used for updating grid cells without modifying DOM structure
         *
         * Synchronizes content of this Element with the content of the passed element.
         * 
         * Style and CSS class are copied from source into this Element, and contents are synced
         * recursively. If a child node is a text node, the textual data is copied.
         */
        syncContent: function(source) {
            source = Ext.getDom(source);
            var sourceNodes = source.childNodes,
                sourceLen = sourceNodes.length,
                dest = this.dom,
                destNodes = dest.childNodes,
                destLen = destNodes.length,
                i,  destNode, sourceNode,
                nodeType, newAttrs, attLen, attName,
                elData = dest._extData;

            // Copy top node's attributes across. Use IE-specific method if possible.
            // In IE10, there is a problem where the className will not get updated
            // in the view, even though the className on the dom element is correct.
            // See EXTJSIV-9462
            if (Ext.isIE9m && dest.mergeAttributes) {
                dest.mergeAttributes(source, true);

                // EXTJSIV-6803. IE's mergeAttributes appears not to make the source's "src" value available until after the image is ready.
                // So programmatically copy any src attribute.
                dest.src = source.src;
            } else {
                newAttrs = source.attributes;
                attLen = newAttrs.length;
                for (i = 0; i < attLen; i++) {
                    attName = newAttrs[i].name;
                    if (attName !== 'id') {
                        dest.setAttribute(attName, newAttrs[i].value);
                    }
                }
            }

            // The element's data is no longer synchronized. We just overwrite it in the DOM
            if (elData) {
                elData.isSynchronized = false;
            }

            // If the number of child nodes does not match, fall back to replacing innerHTML
            if (sourceLen !== destLen) {
                dest.innerHTML = source.innerHTML;
                return;
            }

            // Loop through source nodes.
            // If there are fewer, we must remove excess
            for (i = 0; i < sourceLen; i++) {
                sourceNode = sourceNodes[i];
                destNode = destNodes[i];
                nodeType = sourceNode.nodeType;

                // If node structure is out of sync, just drop innerHTML in and return
                if (nodeType !== destNode.nodeType || (nodeType === 1 && sourceNode.tagName !== destNode.tagName)) {
                    dest.innerHTML = source.innerHTML;
                    return;
                }

                // Update text node
                if (nodeType === 3) {
                    destNode.data = sourceNode.data;
                }
                // Sync element content
                else {
                    if (sourceNode.id && destNode.id !== sourceNode.id) {
                        destNode.id = sourceNode.id;
                    }
                    destNode.style.cssText = sourceNode.style.cssText;
                    destNode.className = sourceNode.className;
                    Ext.fly(destNode, '_syncContent').syncContent(sourceNode);
                }
            }
        },

        /**
         * Toggles the element's visibility, depending on visibility mode.
         * @param {Boolean/Object} [animate] True for the default animation, or a standard Element animation config object
         * @return {Ext.dom.Element} this
         */
        toggle: function(animate){
            var me = this;
            me.setVisible(!me.isVisible(), me.anim(animate));
            return me;
        },

        /**
         * Hides a previously applied mask.
         */
        unmask: function() {
            var me = this,
                data = me.getData(),
                maskEl = data.maskEl,
                style;

            if (maskEl) {
                style = maskEl.dom.style;
                // Remove resource-intensive CSS expressions as soon as they are not required.
                if (style.clearExpression) {
                    style.clearExpression('width');
                    style.clearExpression('height');
                }

                if (maskEl) {
                    maskEl.destroy();
                    delete data.maskEl;
                }

                me.removeCls([XMASKED, XMASKEDRELATIVE]);
            }

            me.restoreChildrenTabbableState();

            if (me.dom !== DOC.body) {
                me.restoreTabbableState();
            }
        },

        /**
         * Return clipping (overflow) to original clipping before {@link #clip} was called
         * @return {Ext.dom.Element} this
         */
        unclip: function() {
            var me = this,
                data = me.getData(),
                clip;

            if (data[ISCLIPPED]) {
                data[ISCLIPPED] = false;
                clip = data[ORIGINALCLIP];
                if (clip.o) {
                    me.setStyle(OVERFLOW, clip.o);
                }
                if (clip.x) {
                    me.setStyle(OVERFLOWX, clip.x);
                }
                if (clip.y) {
                    me.setStyle(OVERFLOWY, clip.y);
                }
            }
            return me;
        },

        translate: function(x, y, z) {
            if (Ext.supports.CssTransforms && !Ext.isIE9m) {
                this.callParent(arguments);
            } else {
                if (x != null) {
                    this.dom.style.left = x + 'px';
                }
                if (y != null) {
                    this.dom.style.top = y + 'px';
                }
            }
        },

        /**
         * Disables text selection for this element (normalized across browsers)
         * @return {Ext.dom.Element} this
         */
        unselectable: function() {
            // The approach used to disable text selection combines CSS, HTML attributes and DOM events. Importantly the
            // strategy is designed to be expressible in markup, so that elements can be rendered unselectable without
            // needing modifications post-render. e.g.:
            //
            // <div class="x-unselectable" unselectable="on"></div>
            //
            // Changes to this method may need to be reflected elsewhere, e.g. ProtoElement.
            var me = this;

            // The unselectable property (or similar) is supported by various browsers but Opera is the only browser that
            // doesn't support any of the other techniques. The problem with it is that it isn't inherited by child
            // elements. Theoretically we could add it to all children but the performance would be terrible. In certain
            // key locations (e.g. panel headers) we add unselectable="on" to extra elements during rendering just for
            // Opera's benefit.
            if (Ext.isOpera) {
                me.dom.unselectable = 'on';
            }

            // In Mozilla and WebKit the CSS properties -moz-user-select and -webkit-user-select prevent a selection
            // originating in an element. These are inherited, which is what we want.
            //
            // In IE we rely on a listener for the selectstart event instead. We don't need to register a listener on the
            // individual element, instead we use a single listener and rely on event propagation to listen for the event at
            // the document level. That listener will walk up the DOM looking for nodes that have either of the classes
            // x-selectable or x-unselectable. This simulates the CSS inheritance approach.
            //
            // IE 10 is expected to support -ms-user-select so the listener may not be required.
            me.removeCls(Element.selectableCls);
            me.addCls(Element.unselectableCls);

            return me;
        },
        
        privates: {
            /**
             * Returns true if this element needs an explicit tabIndex to make it focusable.
             * Input fields, text areas, buttons, anchor elements **with an href** etc
             * do not need a tabIndex, but structural elements do.
             * See http://www.w3.org/TR/html5/editing.html#specially-focusable
             * @private
             */
            needsTabIndex: function() {
                var dom = this.dom,
                    nodeName, isFocusable;
                
                if (dom) {
                    nodeName = dom.nodeName;
                    
                    // Note that the code below is identical to isFocusable();
                    // it is intentionally duplicated for performance reasons.
                    isFocusable = !!Ext.Element.naturallyFocusableTags[nodeName]            ||
                                  ((nodeName === 'A' || nodeName === 'LINK') && !!dom.href) ||
                                  dom.getAttribute('tabindex') != null                      ||
                                  dom.contentEditable === 'true';
                    
                    // The result we need is the opposite to what we got
                    return !isFocusable;
                }
            },
            
            /**
             * @private
             * The difference between findTabbableElements and selectTabbableElements
             * is that find() will include `this` element itself if it is tabbable, while
             * select() will only find tabbable children following querySelectorAll() logic.
             */
            findTabbableElements: function(asDom, selector, /* private */ limit, backward) {
                asDom = asDom != undefined ? asDom : true;
                
                var me = this,
                    selection;
                
                selection = me.selectTabbableElements(asDom, selector, limit, backward);
                
                if (me.isTabbable()) {
                    selection.unshift(asDom ? me.dom : me);
                }
                
                return selection;
            },
            
            /**
             * @private
             */
            selectTabbableElements: function(asDom, selector, /* private */ limit, backward) {
                var selection = [],
                    nodes, node, el, i, len, to, step, tabIndex;
                
                asDom = asDom != undefined ? asDom : true;
                
                nodes = this.dom.querySelectorAll(selector || Ext.Element.tabbableSelector);
                len   = nodes.length;
                
                if (!len) {
                    return selection;
                }
                
                if (backward) {
                    i    = len - 1;
                    to   = 0;
                    step = -1;
                }
                else {
                    i    = 0;
                    to   = len - 1;
                    step = 1;
                }
                
                // We're only interested in the elements that an user can *tab into*,
                // not all programmatically focusable elements. So we have to filter
                // these out.
                for (;; i += step) {
                    if ((step > 0 && i > to) || (step < 0 && i < to)) {
                        break;
                    }
                    
                    node = nodes[i];
                    
                    // A node with tabIndex < 0 absolutely can't be tabbable
                    // so we can save a function call if that is the case.
                    // Note that we can't use node.tabIndex here because IE
                    // will return 0 for elements that have no tabindex
                    // attribute defined, regardless of whether they are
                    // tabbable or not.
                    tabIndex = node.getAttribute('tabindex') - 0; // quicker than parseInt
                    
                    // tabIndex value may be null for nodes with no tabIndex defined;
                    // most of those may be naturally tabbable. We don't want to
                    // check this here, that's isTabbable()'s job and it's not trivial.
                    // We explicitly check that tabIndex is not negative; the expression
                    // below is purposeful.
                    if (!(tabIndex < 0)) {
                        el = asDom ? Ext.fly(node) : Ext.get(node);
                        
                        if (el.isTabbable()) {
                            selection.push(asDom ? node : el);
                        }
                    }
                    
                    if (selection.length >= limit) {
                        return selection;
                    }
                }
                
                return selection;
            },
        
            /**
             * @private
             */
            selectFirstTabbableElement: function(asDom, selector) {
                var els = this.selectTabbableElements(asDom, selector, 1, false);
            
                return els[0];
            },
        
            /**
             * @private
             */
            selectLastTabbableElement: function(asDom, selector) {
                var el = this.selectTabbableElements(true, selector, 1, true)[0];
            
                return (asDom !== false) ? el : Ext.get(el);
            },
        
            /**
             * @private
             */
            saveTabbableState: function(attribute) {
                var tabbableSavedFlagAttribute = Ext.Element.tabbableSavedFlagAttribute,
                    dom = this.dom;
            
                // Prevent tabIndex from being munged more than once
                if (dom.hasAttribute(tabbableSavedFlagAttribute)) {
                    return;
                }
                
                attribute = attribute || Ext.Element.tabbableSavedAttribute;
            
                // tabIndex could be set on both naturally tabbable and generic elements.
                // Either way we need to save it to restore later.
                if (dom.hasAttribute('tabindex')) {
                    dom.setAttribute(attribute, dom.getAttribute('tabindex'));
                }
            
                // When no tabIndex is specified, that means a naturally tabbable element.
                else {
                    dom.setAttribute(attribute, 'none');
                }
            
                // We disable the tabbable state by setting tabIndex to -1.
                // The element can still be focused programmatically though.
                dom.setAttribute('tabindex', -1);
                dom.setAttribute(tabbableSavedFlagAttribute, true);
            
                return this;
            },
        
            /**
             * @private
             */
            restoreTabbableState: function(attribute) {
                var tabbableSavedFlagAttribute = Ext.Element.tabbableSavedFlagAttribute,
                    dom = this.dom,
                    idx;
                
                attribute = attribute || Ext.Element.tabbableSavedAttribute;
            
                if (!dom.hasAttribute(tabbableSavedFlagAttribute) ||
                    !dom.hasAttribute(attribute)) {
                    return;
                }
            
                idx = dom.getAttribute(attribute);
            
                // That is a naturally tabbable element
                if (idx === 'none') {
                    dom.removeAttribute('tabindex');
                }
                else {
                    dom.setAttribute('tabindex', idx);
                }
            
                dom.removeAttribute(attribute);
                dom.removeAttribute(tabbableSavedFlagAttribute);
            
                return this;
            },
        
            /**
             * @private
             */
            saveChildrenTabbableState: function(attribute) {
                var children, child, i, len;
                
                if (this.dom) {
                    children = this.selectTabbableElements();

                    for (i = 0, len = children.length; i < len; i++) {
                        child = Ext.fly(children[i]);
                        child.saveTabbableState(attribute);
                    }
                }
                
                return children;
            },
        
            /**
             * @private
             */
            restoreChildrenTabbableState: function(attribute, children) {
                var child, i, len;
                
                if (this.dom) {
                    attribute = attribute || Ext.Element.tabbableSavedAttribute;
                    children  = children  || this.dom.querySelectorAll('[' + attribute + ']');
            
                    for (i = 0, len = children.length; i < len; i++) {
                        child = Ext.fly(children[i]);
                        child.restoreTabbableState(attribute);
                    }
                }
            
                return children;
            }
        },

        deprecated: {
            '4.0': {
                methods: {
                    /**
                     * Creates a pause before any subsequent queued effects begin. If there are no effects queued after the pause it will
                     * have no effect. Usage:
                     *
                     *     el.pause(1);
                     *
                     * @deprecated 4.0 Use the `delay` config to {@link #animate} instead.
                     * @param {Number} seconds The length of time to pause (in seconds)
                     * @return {Ext.dom.Element} The Element
                     */
                    pause: function(ms) {
                        var me = this;
                        Ext.fx.Manager.setFxDefaults(me.id, {
                            delay: ms
                        });
                        return me;
                    },

                    /**
                     * Animates the transition of an element's dimensions from a starting height/width to an ending height/width. This
                     * method is a convenience implementation of {@link #shift}. Usage:
                     *
                     *     // change height and width to 100x100 pixels
                     *     el.scale(100, 100);
                     *
                     *     // common config options shown with default values.  The height and width will default to
                     *     // the element's existing values if passed as null.
                     *     el.scale(
                     *         [element's width],
                     *         [element's height], {
                     *             easing: 'easeOut',
                     *             duration: 350
                     *         }
                     *     );
                     *
                     * @deprecated 4.0 Just use {@link #animate} instead.
                     * @param {Number} width The new width (pass undefined to keep the original width)
                     * @param {Number} height The new height (pass undefined to keep the original height)
                     * @param {Object} options (optional) Object literal with any of the {@link Ext.fx.Anim} config options
                     * @return {Ext.dom.Element} The Element
                     */
                    scale: function(w, h, o) {
                        this.animate(Ext.apply({}, o, {
                            width: w,
                            height: h
                        }));
                        return this;
                    },

                    /**
                     * Animates the transition of any combination of an element's dimensions, xy position and/or opacity. Any of these
                     * properties not specified in the config object will not be changed. This effect requires that at least one new
                     * dimension, position or opacity setting must be passed in on the config object in order for the function to have
                     * any effect. Usage:
                     *
                     *     // slide the element horizontally to x position 200 while changing the height and opacity
                     *     el.shift({ x: 200, height: 50, opacity: .8 });
                     *
                     *     // common config options shown with default values.
                     *     el.shift({
                     *         width: [element's width],
                     *         height: [element's height],
                     *         x: [element's x position],
                     *         y: [element's y position],
                     *         opacity: [element's opacity],
                     *         easing: 'easeOut',
                     *         duration: 350
                     *     });
                     *
                     * @deprecated 4.0 Just use {@link #animate} instead.
                     * @param {Object} options Object literal with any of the {@link Ext.fx.Anim} config options
                     * @return {Ext.dom.Element} The Element
                     */
                    shift: function(config) {
                        this.animate(config);
                        return this;
                    }
                }
            },
            '4.2': {
                methods: {
                    /**
                     * Sets the position of the element in page coordinates.
                     * @param {Number} x X value for new position (coordinates are page-based)
                     * @param {Number} y Y value for new position (coordinates are page-based)
                     * @param {Boolean/Object} [animate] True for the default animation, or a standard
                     * Element animation config object
                     * @return {Ext.dom.Element} this
                     * @deprecated 4.2.0 Use {@link #setXY} instead.
                     */
                    moveTo: function(x, y, animate) {
                        return this.setXY([x, y], animate);
                    },

                    /**
                     * Sets the element's position and size in one shot. If animation is true then
                     * width, height, x and y will be animated concurrently.
                     *
                     * @param {Number} x X value for new position (coordinates are page-based)
                     * @param {Number} y Y value for new position (coordinates are page-based)
                     * @param {Number/String} width The new width. This may be one of:
                     *
                     * - A Number specifying the new width in pixels
                     * - A String used to set the CSS width style. Animation may **not** be used.
                     *
                     * @param {Number/String} height The new height. This may be one of:
                     *
                     * - A Number specifying the new height in pixels
                     * - A String used to set the CSS height style. Animation may **not** be used.
                     *
                     * @param {Boolean/Object} [animate] true for the default animation or
                     * a standard Element animation config object
                     *
                     * @return {Ext.dom.Element} this
                     * @deprecated 4.2.0 Use {@link Ext.util.Positionable#setBox} instead.
                     */
                    setBounds: function(x, y, width, height, animate) {
                        return this.setBox({
                            x: x,
                            y: y,
                            width: width,
                            height: height
                        }, animate);
                    },

                    /**
                     * Sets the element's left and top positions directly using CSS style
                     * @param {Number/String} left Number of pixels or CSS string value to
                     * set as the left CSS property value
                     * @param {Number/String} top Number of pixels or CSS string value to
                     * set as the top CSS property value
                     * @return {Ext.dom.Element} this
                     * @deprecated 4.2.0 Use {@link #setLocalXY} instead
                     */
                    setLeftTop: function(left, top) {
                        var me = this,
                            style = me.dom.style;

                        style.left = Element.addUnits(left);
                        style.top = Element.addUnits(top);

                        if (me.shadow || me.shim) {
                            me.syncUnderlays();
                        }

                        return me;
                    },

                    /**
                     * Sets the position of the element in page coordinates.
                     * @param {Number} x X value for new position
                     * @param {Number} y Y value for new position
                     * @param {Boolean/Object} [animate] True for the default animation, or a standard
                     * Element animation config object
                     * @return {Ext.dom.Element} this
                     * @deprecated 4.2.0 Use {@link #setXY} instead.
                     */
                    setLocation: function(x, y, animate) {
                        return this.setXY([x, y], animate);
                    }
                }
            },
            '5.0': {
                methods: {
                    /**
                     * Returns the value of a namespaced attribute from the element's underlying DOM node.
                     * @param {String} namespace The namespace in which to look for the attribute
                     * @param {String} name The attribute name
                     * @return {String} The attribute value
                     * @deprecated 5.0.0 Please use {@link #getAttribute} instead.
                     */
                    getAttributeNS: function(namespace, name) {
                        return this.getAttribute(name, namespace);
                    },

                    /**
                     * Calculates the x, y to center this element on the screen
                     * @return {Number[]} The x, y values [x, y]
                     * @deprecated 5.0.0 Use {@link #getAlignToXY} instead.
                     *     el.getAlignToXY(document, 'c-c');
                     */
                    getCenterXY: function(){
                        return this.getAlignToXY(DOC, 'c-c');
                    },

                    /**
                     * Returns either the offsetHeight or the height of this element based on CSS height adjusted by padding or borders
                     * when needed to simulate offsetHeight when offsets aren't available. This may not work on display:none elements
                     * if a height has not been set using CSS.
                     * @return {Number}
                     * @deprecated 5.0.0 use {@link #getHeight} instead
                     */
                    getComputedHeight: function() {
                        return Math.max(this.dom.offsetHeight, this.dom.clientHeight) ||
                            parseFloat(this.getStyle(HEIGHT)) || 0;
                    },

                    /**
                     * Returns either the offsetWidth or the width of this element based on CSS width adjusted by padding or borders
                     * when needed to simulate offsetWidth when offsets aren't available. This may not work on display:none elements
                     * if a width has not been set using CSS.
                     * @return {Number}
                     * @deprecated 5.0.0 use {@link #getWidth} instead.
                     */
                    getComputedWidth: function() {
                        return Math.max(this.dom.offsetWidth, this.dom.clientWidth) ||
                            parseFloat(this.getStyle(WIDTH)) || 0;
                    },

                    /**
                     * Returns the dimensions of the element available to lay content out in.
                     *
                     * getStyleSize utilizes prefers style sizing if present, otherwise it chooses the larger of offsetHeight/clientHeight and
                     * offsetWidth/clientWidth. To obtain the size excluding scrollbars, use getViewSize.
                     *
                     * Sizing of the document body is handled at the adapter level which handles special cases for IE and strict modes, etc.
                     *
                     * @return {Object} Object describing width and height.
                     * @return {Number} return.width
                     * @return {Number} return.height
                     * @deprecated 5.0.0 Use {@link #getSize} instead.
                     */
                    getStyleSize: function() {
                        var me = this,
                            d = this.dom,
                            isDoc = (d === DOC || d === DOC.body),
                            s,
                            w, h;

                        // If the body, use static methods
                        if (isDoc) {
                            return {
                                width : Element.getViewportWidth(),
                                height : Element.getViewportHeight()
                            };
                        }

                        s = me.getStyle(['height', 'width'], true);  //seek inline
                        // Use Styles if they are set
                        if (s.width && s.width !== 'auto') {
                            w = parseFloat(s.width);
                        }
                        // Use Styles if they are set
                        if (s.height && s.height !== 'auto') {
                            h = parseFloat(s.height);
                        }
                        // Use getWidth/getHeight if style not set.
                        return {width: w || me.getWidth(true), height: h || me.getHeight(true)};
                    },


                    /**
                     * Returns true if this element uses the border-box-sizing model.  This method is
                     * deprecated as of version 5.0 because border-box sizing is forced upon all elements
                     * via a style sheet rule, and the browsers that do not support border-box (IE6/7 strict
                     * mode) are no longer supported.
                     * @deprecated 5.0.0 
                     * @return {Boolean}
                     */
                    isBorderBox: function() {
                        return true;
                    },

                    /**
                     * Returns true if display is not "none"
                     * @return {Boolean}
                     * @deprecated 5.0.0 use element.isStyle('display', 'none');
                     */
                    isDisplayed: function() {
                        return !this.isStyle('display', 'none');
                    },

                    /**
                     * Checks whether this element can be focused.
                     * @return {Boolean} True if the element is focusable
                     * @deprecated 5.0.0 use {@link #isFocusable} instead
                     */
                    focusable: 'isFocusable'
                }
            }
        }
    };
})(), function() {
    var Element = Ext.dom.Element,
        proto = Element.prototype,
        useDocForId = !Ext.isIE8,
        DOC = document,
        view = DOC.defaultView,
        opacityRe = /alpha\(opacity=(.*)\)/i,
        trimRe = /^\s+|\s+$/g,
        styleHooks = proto.styleHooks,
        supports = Ext.supports,
        verticalStyleHooks90, verticalStyleHooks270, edges, k,
        edge, borderWidth, getBorderWidth;

    proto._init(Element);
    delete proto._init;

    Ext.plainTableCls = Ext.baseCSSPrefix + 'table-plain';
    Ext.plainListCls = Ext.baseCSSPrefix + 'list-plain';

    // ensure that any methods added by this override are also added to Ext.CompositeElementLite
    if (Ext.CompositeElementLite) {
        Ext.CompositeElementLite.importElementMethods();
    }

    styleHooks.opacity = {
        name: 'opacity',
        afterSet: function(dom, value, el) {
            var shadow = el.shadow;
            if (shadow) {
                shadow.setOpacity(value);
            }
        }
    };
    if (!supports.Opacity && Ext.isIE) {
        Ext.apply(styleHooks.opacity, {
            get: function (dom) {
                var filter = dom.style.filter,
                    match, opacity;
                if (filter.match) {
                    match = filter.match(opacityRe);
                    if (match) {
                        opacity = parseFloat(match[1]);
                        if (!isNaN(opacity)) {
                            return opacity ? opacity / 100 : 0;
                        }
                    }
                }
                return 1;
            },
            set: function (dom, value) {
                var style = dom.style,
                    val = style.filter.replace(opacityRe, '').replace(trimRe, '');

                style.zoom = 1; // ensure dom.hasLayout

                // value can be a number or '' or null... so treat falsey as no opacity
                if (typeof(value) === 'number' && value >= 0 && value < 1) {
                    value *= 100;
                    style.filter = val + (val.length ? ' ' : '') + 'alpha(opacity='+value+')';
                } else {
                    style.filter = val;
                }
            }  
        });
    }
    
    if (!supports.matchesSelector) {
        // Match basic tagName.ClassName selector syntax for is implementation
        var simpleSelectorRe = /^([a-z]+|\*)?(?:\.([a-z][a-z\-_0-9]*))?$/i,
            dashRe = /\-/g,
            fragment,
            classMatcher = function (tag, cls) {
                var classRe = new RegExp('(?:^|\\s+)' +cls.replace(dashRe, '\\-') + '(?:\\s+|$)');
                if (tag && tag !== '*') {
                    tag = tag.toUpperCase();
                    return function (el) {
                        return el.tagName === tag && classRe.test(el.className);
                    };
                }
                return function (el) {
                    return classRe.test(el.className);
                };
            },
            tagMatcher = function (tag) {
                tag = tag.toUpperCase();
                return function (el) {
                    return el.tagName === tag;
                };
            },
            cache = {};

        proto.matcherCache = cache;
        proto.is = function(selector) {
            // Empty selector always matches
            if (!selector) {
                return true;
            }

            var dom = this.dom,
                cls, match, testFn, root, isOrphan, is, tag;

            // Only Element node types can be matched.
            if (dom.nodeType !== 1) {
                return false;
            }

            if (!(testFn = Ext.isFunction(selector) ? selector : cache[selector])) {
                if (!(match = selector.match(simpleSelectorRe))) {
                    // Not a simple tagName.className selector, do it the hard way
                    root = dom.parentNode;

                    if (!root) {
                        isOrphan = true;
                        root = fragment || (fragment = DOC.createDocumentFragment());
                        fragment.appendChild(dom);
                    }

                    is = Ext.Array.indexOf(Ext.fly(root, '_is').query(selector), dom) !== -1;

                    if (isOrphan) {
                        fragment.removeChild(dom);
                    }
                    return is;
                }

                tag = match[1];
                cls = match[2];
                cache[selector] = testFn = cls ? classMatcher(tag, cls) : tagMatcher(tag);
            }

            return testFn(dom);
        };
    }

    // IE8 needs its own implementation of getStyle because it doesn't support getComputedStyle
    if (!view || !view.getComputedStyle) {
        proto.getStyle = function (property, inline) {
            var me = this,
                dom = me.dom,
                multiple = typeof property !== 'string',
                prop = property,
                props = prop,
                len = 1,
                isInline = inline,
                styleHooks = me.styleHooks,
                camel, domStyle, values, hook, out, style, i;

            if (multiple) {
                values = {};
                prop = props[0];
                i = 0;
                if (!(len = props.length)) {
                    return values;
                }
            }

            if (!dom || dom.documentElement) {
                return values || '';
            }

            domStyle = dom.style;

            if (inline) {
                style = domStyle;
            } else {
                style = dom.currentStyle;

                // fallback to inline style if rendering context not available
                if (!style) {
                    isInline = true;
                    style = domStyle;
                }
            }

            do {
                hook = styleHooks[prop];

                if (!hook) {
                    styleHooks[prop] = hook = { name: Element.normalize(prop) };
                }

                if (hook.get) {
                    out = hook.get(dom, me, isInline, style);
                } else {
                    camel = hook.name;
                    out = style[camel];
                }

                if (!multiple) {
                    return out;
                }

                values[prop] = out;
                prop = props[++i];
            } while (i < len);

            return values;
        };
    }

    // override getStyle for border-*-width
    if (Ext.isIE8) {
        getBorderWidth = function (dom, el, inline, style) {
            if (style[this.styleName] === 'none') {
                return '0px';
            }
            return style[this.name];
        };

        edges = ['Top','Right','Bottom','Left'];
        k = edges.length;

        while (k--) {
            edge = edges[k];
            borderWidth = 'border' + edge + 'Width';

            styleHooks['border-'+edge.toLowerCase()+'-width'] = styleHooks[borderWidth] = {
                name: borderWidth,
                styleName: 'border' + edge + 'Style',
                get: getBorderWidth
            };
        }
    }

    Ext.apply(Ext, {
        /**
         * `true` to automatically uncache orphaned Ext.Elements periodically. If set to
         * `false`, the application will be required to clean up orphaned Ext.Elements and
         * it's listeners as to not cause memory leakage.
         * @member Ext
         */
        enableGarbageCollector: true,

        // In sencha v5 isBorderBox is no longer needed since all supported browsers
        // support border-box, but it is hard coded to true for backward compatibility
        isBorderBox: true,

        /**
         * @property {Boolean} useShims
         * @member Ext
         * Set to `true` to use a {@link Ext.util.Floating#shim shim} on all floating Components
         * and {@link Ext.LoadMask LoadMasks}
         */
        useShims: false,

        /**
         * @private
         * Returns an HTML div element into which {@link Ext.container.Container#method-remove removed} components
         * are placed so that their DOM elements are not garbage collected as detached Dom trees.
         * @return {Ext.dom.Element}
         * @member Ext
         */
        getDetachedBody: function () {
            var detachedEl = Ext.detachedBodyEl;

            if (!detachedEl) {
                detachedEl = DOC.createElement('div');
                Ext.detachedBodyEl = detachedEl = new Ext.dom.Fly(detachedEl);
                detachedEl.isDetachedBody = true;
            }

            return detachedEl;
        },

        getElementById: function (id) {
            var el = DOC.getElementById(id),
                detachedBodyEl;

            if (!el && (detachedBodyEl = Ext.detachedBodyEl)) {
                el = detachedBodyEl.dom.querySelector(Ext.makeIdSelector(id));
            }

            return el;
        },

        /**
         * Applies event listeners to elements by selectors when the document is ready.
         * The event name is specified with an `@` suffix.
         *
         *     Ext.addBehaviors({
         *         // add a listener for click on all anchors in element with id foo
         *         '#foo a@click': function(e, t){
         *             // do something
         *         },
         *
         *         // add the same listener to multiple selectors (separated by comma BEFORE the @)
         *         '#foo a, #bar span.some-class@mouseover': function(){
         *             // do something
         *         }
         *     });
         *
         * @param {Object} obj The list of behaviors to apply
         * @member Ext
         */
        addBehaviors: function(o){
            if(!Ext.isReady){
                Ext.onInternalReady(function(){
                    Ext.addBehaviors(o);
                });
            } else {
                var cache = {}, // simple cache for applying multiple behaviors to same selector does query multiple times
                    parts,
                    b,
                    s;
                for (b in o) {
                    if ((parts = b.split('@'))[1]) { // for Object prototype breakers
                        s = parts[0];
                        if(!cache[s]){
                            cache[s] = Ext.fly(document).select(s, true);
                        }
                        cache[s].on(parts[1], o[b]);
                    }
                }
                cache = null;
            }
        }
    });

    if (Ext.isIE9m) {
        Ext.getElementById = function (id) {
            var el = DOC.getElementById(id),
                detachedBodyEl;

            if (!el && (detachedBodyEl = Ext.detachedBodyEl)) {
                el = detachedBodyEl.dom.all[id];
            }

            return el;
        };

        proto.getById = function (id, asDom) {
            var dom = this.dom,
                ret = null,
                entry, el;

            if (dom) {
                // for normal elements getElementById is the best solution, but if the el is
                // not part of the document.body, we need to use all[]
                el = (useDocForId && DOC.getElementById(id)) || dom.all[id];
                if (el) {
                    if (asDom) {
                        ret = el;
                    } else {
                        // calling Element.get here is a real hit (2x slower) because it has to
                        // redetermine that we are giving it a dom el.
                        entry = Ext.cache[id];
                        if (entry) {
                            if (entry.skipGarbageCollection || !Ext.isGarbage(entry.dom)) {
                                ret = entry;
                            } else {
                                //<debug>
                                Ext.Error.raise("Stale Element with id '" + el.id +
                                    "' found in Element cache. " +
                                    "Make sure to clean up Element instances using destroy()" );
                                //</debug>
                                entry.destroy();
                            }
                        }
                        ret = ret || new Ext.Element(el);
                    }
                }
            }

            return ret;
        };
    } else if (!DOC.querySelector) {
        Ext.getDetachedBody = Ext.getBody;

        Ext.getElementById = function (id) {
            return DOC.getElementById(id);
        };

        proto.getById = function (id, asDom) {
            var dom = DOC.getElementById(id);
            return asDom ? dom : (dom ? Ext.get(dom) : null);
        };
    }

    if (Ext.isIE && !(Ext.isIE9p && DOC.documentMode >= 9)) {
        // Essentially all web browsers (Firefox, Internet Explorer, recent versions of Opera, Safari, Konqueror, and iCab,
        // as a non-exhaustive list) return null when the specified attribute does not exist on the specified element.
        // The DOM specification says that the correct return value in this case is actually the empty string, and some
        // DOM implementations implement this behavior. The implementation of getAttribute in XUL (Gecko) actually follows
        // the specification and returns an empty string. Consequently, you should use hasAttribute to check for an attribute's
        // existence prior to calling getAttribute() if it is possible that the requested attribute does not exist on the specified element.
        //
        // https://developer.mozilla.org/en-US/docs/DOM/element.getAttribute
        // http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-745549614
        proto.getAttribute = function(name, ns) {
            var d = this.dom,
                    type;
            if (ns) {
                type = typeof d[ns + ":" + name];
                if (type !== 'undefined' && type !== 'unknown') {
                    return d[ns + ":" + name] || null;
                }
                return null;
            }
            if (name === "for") {
                name = "htmlFor";
            }
            return d[name] || null;
        };
    }

    Ext.onInternalReady(function () {
        var transparentRe = /^(?:transparent|(?:rgba[(](?:\s*\d+\s*[,]){3}\s*0\s*[)]))$/i,
            bodyCls = [],
            //htmlCls = [],
            origSetWidth = proto.setWidth,
            origSetHeight = proto.setHeight,
            origSetSize = proto.setSize,
            pxRe = /^\d+(?:\.\d*)?px$/i,
            colorStyles, i, name, camel;

        if (supports.FixedTableWidthBug) {
            // EXTJSIV-12665
            // https://bugs.webkit.org/show_bug.cgi?id=130239
            // Webkit browsers fail to layout correctly when a form field's width is less
            // than the min-width of the body element.  The only way to fix it seems to be
            // to toggle the display style of the field's element before and after setting
            // the width. Note: once the bug has been corrected by toggling the element's
            // display, successive calls to setWidth will work without the hack.  It's only
            // when going from naturally widthed to having an explicit width that the bug
            // occurs.
            styleHooks.width = {
                name: 'width',
                set: function(dom, value, el) {
                    var style = dom.style,
                        needsFix = el._needsTableWidthFix,
                        origDisplay = style.display;

                    if (needsFix) {
                        style.display = 'none';
                    }

                    style.width = value;

                    if (needsFix) {
                        // repaint
                        dom.scrollWidth; // jshint ignore:line
                        style.display = origDisplay;
                    }
                }
            };
            proto.setWidth = function(width, animate) {
                var me = this,
                    dom = me.dom,
                    style = dom.style,
                    needsFix = me._needsTableWidthFix,
                    origDisplay = style.display;

                if (needsFix && !animate) {
                    style.display = 'none';
                }

                origSetWidth.call(me, width, animate);

                if (needsFix && !animate) {
                    // repaint
                    dom.scrollWidth; // jshint ignore:line
                    style.display = origDisplay;
                }
                return me;
            };
            proto.setSize = function(width, height, animate) {
                var me = this,
                    dom = me.dom,
                    style = dom.style,
                    needsFix = me._needsTableWidthFix,
                    origDisplay = style.display;

                if (needsFix && !animate) {
                    style.display = 'none';
                }

                origSetSize.call(me, width, height, animate);

                if (needsFix && !animate) {
                    // repaint
                    dom.scrollWidth; // jshint ignore:line
                    style.display = origDisplay;
                }
                return me;
            };
        }

        //<feature legacyBrowser>
        if (Ext.isIE8) {
            styleHooks.height = {
                name: 'height',
                set: function(dom, value, el) {
                    var component = el.component,
                        frameInfo, frameBodyStyle;

                    if (component && component._syncFrameHeight && this === component.el) {
                        frameBodyStyle = component.frameBody.dom.style;
                        if (pxRe.test(value)) {
                            frameInfo = component.getFrameInfo();
                            if (frameInfo) {
                                frameBodyStyle.height = (parseInt(value, 10) - frameInfo.height) + 'px';
                            }
                        } else if (!value || value === 'auto') {
                            frameBodyStyle.height = '';
                        }
                    }

                    dom.style.height = value;
                }
            };

            proto.setHeight = function(height, animate) {
                var component = this.component,
                    frameInfo, frameBodyStyle;

                if (component && component._syncFrameHeight && this === component.el) {
                    frameBodyStyle = component.frameBody.dom.style;
                    if (!height || height === 'auto') {
                        frameBodyStyle.height = '';
                    } else {
                        frameInfo = component.getFrameInfo();
                        if (frameInfo) {
                            frameBodyStyle.height = (height - frameInfo.height) + 'px';
                        }
                    }
                }

                return origSetHeight.call(this, height, animate);
            };

            proto.setSize = function(width, height, animate) {
                var component = this.component,
                    frameInfo, frameBodyStyle;

                if (component && component._syncFrameHeight && this === component.el) {
                    frameBodyStyle = component.frameBody.dom.style;
                    if (!height || height === 'auto') {
                        frameBodyStyle.height = '';
                    } else {
                        frameInfo = component.getFrameInfo();
                        if (frameInfo) {
                            frameBodyStyle.height = (height - frameInfo.height) + 'px';
                        }
                    }
                }

                return origSetSize.call(this, width, height, animate);
            };
        }
        //</feature>

        // Element.unselectable relies on this listener to prevent selection in IE. Some other browsers support the event too
        // but it is only strictly required for IE. In WebKit this listener causes subtle differences to how the browser handles
        // the non-selection, e.g. whether or not the mouse cursor changes when attempting to select text.
        Ext.getDoc().on('selectstart', function(ev, dom) {
            var selectableCls = Element.selectableCls,
                unselectableCls = Element.unselectableCls,
                tagName = dom && dom.tagName;

            tagName = tagName && tagName.toLowerCase();

            // Element.unselectable is not really intended to handle selection within text fields and it is important that
            // fields inside menus or panel headers don't inherit the unselectability. In most browsers this is automatic but in
            // IE 9 the selectstart event can bubble up from text fields so we have to explicitly handle that case.
            if (tagName === 'input' || tagName === 'textarea') {
                return;
            }

            // Walk up the DOM checking the nodes. This may be 'slow' but selectstart events don't fire very often
            while (dom && dom.nodeType === 1 && dom !== DOC.documentElement) {
                var el = Ext.fly(dom);

                // If the node has the class x-selectable then stop looking, the text selection is allowed
                if (el.hasCls(selectableCls)) {
                    return;
                }

                // If the node has class x-unselectable then the text selection needs to be stopped
                if (el.hasCls(unselectableCls)) {
                    ev.stopEvent();
                    return;
                }

                dom = dom.parentNode;
            }
        });

        function fixTransparent (dom, el, inline, style) {
            var value = style[this.name] || '';
            return transparentRe.test(value) ? 'transparent' : value;
        }

        /*
         * Helper function to create the function that will restore the selection.
         */
        function makeSelectionRestoreFn (activeEl, start, end) {
            return function () {
                activeEl.selectionStart = start;
                activeEl.selectionEnd = end;
            };
        }

        /**
         * Creates a function to call to clean up problems with the work-around for the
         * WebKit RightMargin bug. The work-around is to add "display: 'inline-block'" to
         * the element before calling getComputedStyle and then to restore its original
         * display value. The problem with this is that it corrupts the selection of an
         * INPUT or TEXTAREA element (as in the "I-beam" goes away but the focus remains).
         * To cleanup after this, we need to capture the selection of any such element and
         * then restore it after we have restored the display style.
         *
         * @param {HTMLElement} target The top-most element being adjusted.
         * @private
         */
        function getRightMarginFixCleaner(target) {
            var hasInputBug = supports.DisplayChangeInputSelectionBug,
                hasTextAreaBug = supports.DisplayChangeTextAreaSelectionBug,
                activeEl, tag, start, end; 

            if (hasInputBug || hasTextAreaBug) {
                activeEl = Element.getActiveElement();
                tag = activeEl && activeEl.tagName;

                if ((hasTextAreaBug && tag === 'TEXTAREA') ||
                    (hasInputBug && tag === 'INPUT' && activeEl.type === 'text')) {
                    if (Ext.fly(target).isAncestor(activeEl)) {
                        start = activeEl.selectionStart;
                        end = activeEl.selectionEnd;

                        if (Ext.isNumber(start) && Ext.isNumber(end)) { // to be safe...
                            // We don't create the raw closure here inline because that
                            // will be costly even if we don't want to return it (nested
                            // function decls and exprs are often instantiated on entry
                            // regardless of whether execution ever reaches them):
                            return makeSelectionRestoreFn(activeEl, start, end);
                        }
                    }
                }
            }

            return Ext.emptyFn; // avoid special cases, just return a nop
        }

        function fixRightMargin (dom, el, inline, style) {
            var result = style.marginRight,
                domStyle, display;

            // Ignore cases when the margin is correctly reported as 0, the bug only shows
            // numbers larger.
            if (result !== '0px') {
                domStyle = dom.style;
                display = domStyle.display;
                domStyle.display = 'inline-block';
                result = (inline ? style : dom.ownerDocument.defaultView.getComputedStyle(dom, null)).marginRight;
                domStyle.display = display;
            }

            return result;
        }

        function fixRightMarginAndInputFocus (dom, el, inline, style) {
            var result = style.marginRight,
                domStyle, cleaner, display;

            if (result !== '0px') {
                domStyle = dom.style;
                cleaner = getRightMarginFixCleaner(dom);
                display = domStyle.display;
                domStyle.display = 'inline-block';
                result = (inline ? style : dom.ownerDocument.defaultView.getComputedStyle(dom, '')).marginRight;
                domStyle.display = display;
                cleaner();
            }

            return result;
        }

        // Fix bug caused by this: https://bugs.webkit.org/show_bug.cgi?id=13343
        if (!supports.RightMargin) {
            styleHooks.marginRight = styleHooks['margin-right'] = {
                name: 'marginRight',
                // TODO - Touch should use conditional compilation here or ensure that the
                //      underlying Ext.supports flags are set correctly...
                get: (supports.DisplayChangeInputSelectionBug || supports.DisplayChangeTextAreaSelectionBug) ?
                    fixRightMarginAndInputFocus : fixRightMargin
            };
        }

        if (!supports.TransparentColor) {
            colorStyles = ['background-color', 'border-color', 'color', 'outline-color'];
            for (i = colorStyles.length; i--; ) {
                name = colorStyles[i];
                camel = Element.normalize(name);

                styleHooks[name] = styleHooks[camel] = {
                    name: camel,
                    get: fixTransparent
                };
            }
        }

        // When elements are rotated 80 or 270 degrees, their border, margin and padding hooks
        // need to be rotated as well.
        proto.verticalStyleHooks90 = verticalStyleHooks90 = Ext.Object.chain(styleHooks);
        proto.verticalStyleHooks270 = verticalStyleHooks270 = Ext.Object.chain(styleHooks);

        verticalStyleHooks90.width = styleHooks.height || { name: 'height' };
        verticalStyleHooks90.height = styleHooks.width || { name: 'width' };
        verticalStyleHooks90['margin-top'] = { name: 'marginLeft' };
        verticalStyleHooks90['margin-right'] = { name: 'marginTop' };
        verticalStyleHooks90['margin-bottom'] = { name: 'marginRight' };
        verticalStyleHooks90['margin-left'] = { name: 'marginBottom' };
        verticalStyleHooks90['padding-top'] = { name: 'paddingLeft' };
        verticalStyleHooks90['padding-right'] = { name: 'paddingTop' };
        verticalStyleHooks90['padding-bottom'] = { name: 'paddingRight' };
        verticalStyleHooks90['padding-left'] = { name: 'paddingBottom' };
        verticalStyleHooks90['border-top'] = { name: 'borderLeft' };
        verticalStyleHooks90['border-right'] = { name: 'borderTop' };
        verticalStyleHooks90['border-bottom'] = { name: 'borderRight' };
        verticalStyleHooks90['border-left'] = { name: 'borderBottom' };

        verticalStyleHooks270.width = styleHooks.height || { name: 'height' };
        verticalStyleHooks270.height = styleHooks.width || { name: 'width' };
        verticalStyleHooks270['margin-top'] = { name: 'marginRight' };
        verticalStyleHooks270['margin-right'] = { name: 'marginBottom' };
        verticalStyleHooks270['margin-bottom'] = { name: 'marginLeft' };
        verticalStyleHooks270['margin-left'] = { name: 'marginTop' };
        verticalStyleHooks270['padding-top'] = { name: 'paddingRight' };
        verticalStyleHooks270['padding-right'] = { name: 'paddingBottom' };
        verticalStyleHooks270['padding-bottom'] = { name: 'paddingLeft' };
        verticalStyleHooks270['padding-left'] = { name: 'paddingTop' };
        verticalStyleHooks270['border-top'] = { name: 'borderRight' };
        verticalStyleHooks270['border-right'] = { name: 'borderBottom' };
        verticalStyleHooks270['border-bottom'] = { name: 'borderLeft' };
        verticalStyleHooks270['border-left'] = { name: 'borderTop' };

        /**
         * @property {Boolean} scopeCss
         * @member Ext
         * Set this to true before onReady to prevent any styling from being added to
         * the body element.  By default a few styles such as font-family, and color
         * are added to the body element via a "x-body" class.  When this is set to
         * `true` the "x-body" class is not added to the body element, but is added
         * to the elements of root-level containers instead.
         */
        if (!Ext.scopeCss) {
            bodyCls.push(Ext.baseCSSPrefix + 'body');
        }

        if (supports.Touch) {
            bodyCls.push(Ext.baseCSSPrefix + 'touch');
        }

        if (Ext.isIE && Ext.isIE9m) {
            bodyCls.push(Ext.baseCSSPrefix + 'ie',
                         Ext.baseCSSPrefix + 'ie9m');

            // very often CSS needs to do checks like "IE7+" or "IE6 or 7". To help
            // reduce the clutter (since CSS/SCSS cannot do these tests), we add some
            // additional classes:
            //
            //      x-ie7p      : IE7+      :  7 <= ieVer
            //      x-ie7m      : IE7-      :  ieVer <= 7
            //      x-ie8p      : IE8+      :  8 <= ieVer
            //      x-ie8m      : IE8-      :  ieVer <= 8
            //      x-ie9p      : IE9+      :  9 <= ieVer
            //      x-ie78      : IE7 or 8  :  7 <= ieVer <= 8
            //
            bodyCls.push(Ext.baseCSSPrefix + 'ie8p');

            if (Ext.isIE8) {
                bodyCls.push(Ext.baseCSSPrefix + 'ie8');
            } else {
                bodyCls.push(Ext.baseCSSPrefix + 'ie9',
                             Ext.baseCSSPrefix + 'ie9p');
            }

            if (Ext.isIE8m) {
                bodyCls.push(Ext.baseCSSPrefix + 'ie8m');
            }
        }

        if (Ext.isIE10) {
            bodyCls.push(Ext.baseCSSPrefix + 'ie10');
        }
        
        if (Ext.isIE11) {
            bodyCls.push(Ext.baseCSSPrefix + 'ie11');
        }

        if (Ext.isGecko) {
            bodyCls.push(Ext.baseCSSPrefix + 'gecko');
        }
        if (Ext.isOpera) {
            bodyCls.push(Ext.baseCSSPrefix + 'opera');
        }
        if (Ext.isOpera12m) {
            bodyCls.push(Ext.baseCSSPrefix + 'opera12m');
        }
        if (Ext.isWebKit) {
            bodyCls.push(Ext.baseCSSPrefix + 'webkit');
        }
        if (Ext.isSafari) {
            bodyCls.push(Ext.baseCSSPrefix + 'safari');
        }
        if (Ext.isChrome) {
            bodyCls.push(Ext.baseCSSPrefix + 'chrome');
        }
        if (Ext.isMac) {
            bodyCls.push(Ext.baseCSSPrefix + 'mac');
        }
        if (Ext.isLinux) {
            bodyCls.push(Ext.baseCSSPrefix + 'linux');
        }
        if (!supports.CSS3BorderRadius) {
            bodyCls.push(Ext.baseCSSPrefix + 'nbr');
        }
        if (!supports.CSS3LinearGradient) {
            bodyCls.push(Ext.baseCSSPrefix + 'nlg');
        }
        if (supports.Touch) {
            bodyCls.push(Ext.baseCSSPrefix + 'touch');
        }
        //Ext.fly(document.documentElement).addCls(htmlCls);

        Ext.getBody().addCls(bodyCls);
    }, null, { priority: 1500 }); // onReady
});
