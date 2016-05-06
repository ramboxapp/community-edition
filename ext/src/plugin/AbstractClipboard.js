/**
 * This base class manages clipboard data transfer for a component. As an abstract class,
 * applications use derived classes such as `{@link Ext.grid.plugin.Clipboard}` instead
 * and seldom use this class directly.
 *
 * ## Operation
 *
 * Components that interact with the clipboard do so in two directions: copy and paste.
 * When copying to the clipboard, a component will often provide multiple data formats.
 * On paste, the consumer of the data can then decide what format it prefers and ignore
 * the others.
 *
 * ### Copy (and Cut)
 *
 * There are two storage locations provided for holding copied data:
 *
 *  * The system clipboard, used to exchange data with other applications running
 *    outside the browser.
 *  * A memory space in the browser page that can hold data for use only by other
 *    components on the page. This allows for richer formats to be transferred.
 *
 * A component can copy (or cut) data in multiple formats as controlled by the
 * `{@link #cfg-memory}` and `{@link #cfg-system}` configs.
 *
 * ### Paste
 *
 * While there may be many formats available, when a component is ready to paste, only
 * one format can ultimately be used. This is specified by the `{@link #cfg-source}`
 * config.
 *
 * ## Browser Limitations
 *
 * At the current time, browsers have only a limited ability to interact with the system
 * clipboard. The only reliable, cross-browser, plugin-in-free technique for doing so is
 * to use invisible elements and focus tricks **during** the processing of clipboard key
 * presses like CTRL+C (on Windows/Linux) or CMD+C (on Mac).
 *
 * @protected
 * @since 5.1.0
 */
Ext.define('Ext.plugin.AbstractClipboard', {
    extend: 'Ext.plugin.Abstract',
    requires: [
        'Ext.util.KeyMap'
    ],

    cachedConfig: {
        /**
         * @cfg {Object} formats
         * This object is keyed by the names of the data formats supported by this plugin.
         * The property values of this object are objects with `get` and `put` properties
         * that name the methods for getting data from (copy) and putting to into (paste)
         * the associated component.
         *
         * For example:
         *
         *      formats: {
         *          html: {
         *              get: 'getHtmlData',
         *              put: 'putHtmlData'
         *          }
         *      }
         *
         * This declares support for the "html" data format and indicates that the
         * `getHtmlData` method should be called to copy HTML data from the component,
         * while the `putHtmlData` should be called to paste HTML data into the component.
         *
         * By default, all derived classes must support a "text" format:
         *
         *      formats: {
         *          text: {
         *              get: 'getTextData',
         *              put: 'putTextData'
         *          }
         *      }
         *
         * To understand the method signatures required to implement a data format, see the
         * documentation for `{@link #getTextData}` and  `{@link #putTextData}`.
         *
         * The format name "system" is not allowed.
         *
         * @protected
         */
        formats: {
            text: {
                get: 'getTextData',
                put: 'putTextData'
            }
        }
    },

    config: {
        /**
         * @cfg {String/String[]} [memory]
         * The data format(s) to copy to the private, memory clipboard. By default, data
         * is not saved to the memory clipboard. Specify `true` to include all formats
         * of data, or a string to copy a single format, or an array of strings to copy
         * multiple formats.
         */
        memory: null,

        /**
         * @cfg {String/String[]} [source="system"]
         * The format or formats in order of preference when pasting data. This list can
         * be any of the valid formats, plus the name "system". When a paste occurs, this
         * config is consulted. The first format specified by this config that has data
         * available in the private memory space is used. If "system" is encountered in
         * the list, whatever data is available on the system clipboard is chosen. At
         * that point, no further source formats will be considered.
         */
        source: 'system',

        /**
         * @cfg {String} [system="text"]
         * The data format to set in the system clipboard. By default, the "text"
         * format is used. Based on the type of derived class, other formats may be
         * possible.
         */
        system: 'text'
    },

    destroy: function () {
        var me = this,
            keyMap = me.keyMap,
            shared = me.shared;

        if (keyMap) {
            // If we have a keyMap then we have incremented the shared usage counter
            // and now need to remove ourselves.
            me.keyMap = Ext.destroy(keyMap);
            if (! --shared.counter) {
                shared.textArea = Ext.destroy(shared.textArea);
            }
        } else {
            // If we don't have a keyMap it is because we are waiting for the render
            // event and haven't connected to the shared context.
            me.renderListener = Ext.destroy(me.renderListener);
        }

        me.callParent();
    },

    init: function (comp) {
        var me = this;

        if (comp.rendered) {
            this.finishInit(comp);
        } else {
            me.renderListener = comp.on({
                render: function () {
                    me.renderListener = null;
                    me.finishInit(comp);
                },
                destroyable: true,
                single: true
            });
        }
    },

    /**
     * This method returns the selected data in text format.
     * @method getTextData
     * @param {String} format The name of the format (i.e., "text").
     * @param {Boolean} erase Pass `true` to erase (cut) the data, `false` to just copy.
     * @return {String} The data in text format.
     */

    /**
     * This method pastes the given text data.
     * @method putTextData
     * @param {Object} data The data in the indicated `format`.
     * @param {String} format The name of the format (i.e., "text").
     */

    privates: {
        /**
         * @property {Object} shared
         * The shared state for all clipboard-enabled components.
         * @property {Number} shared.counter The number of clipboard-enabled components
         * currently using this object.
         * @property {Object} shared.data The clipboard data for intra-page copy/paste. The
         * properties of the object are keyed by format.
         * @property {Ext.dom.Element} textArea The shared textarea used to polyfill the
         * lack of HTML5 clipboard API.
         * @private
         */
        shared: {
            counter: 0,

            data: null,

            textArea: null
        },

        applyMemory: function (value) {
            // Same as "source" config but that allows "system" as a format.
            value = this.applySource(value);

            //<debug>
            if (value) {
                for (var i = value.length; i-- > 0; ) {
                    if (value[i] === 'system') {
                        Ext.Error.raise('Invalid clipboard format "' + value[i] + '"');
                    }
                }
            }
            //</debug>

            return value;
        },

        applySource: function (value) {
            // Make sure we have a non-empty String[] or null
            if (value) {
                if (Ext.isString(value)) {
                    value = [value];
                } else if (value.length === 0) {
                    value = null;
                }
            }

            //<debug>
            if (value) {
                var formats = this.getFormats();

                for (var i = value.length; i-- > 0; ) {
                    if (value[i] !== 'system' && !formats[value[i]]) {
                        Ext.Error.raise('Invalid clipboard format "' + value[i] + '"');
                    }
                }
            }
            //</debug>

            return value || null;
        },

        //<debug>
        applySystem: function (value) {
            var formats = this.getFormats();

            if (!formats[value]) {
                Ext.Error.raise('Invalid clipboard format "' + value + '"');
            }

            return value;
        },
        //</debug>

        doCutCopy: function (event, erase) {
            var me = this,
                formats = me.allFormats || me.syncFormats(),
                data = me.getData(erase, formats),
                memory = me.getMemory(),
                system = me.getSystem(),
                sys;

            me.shared.data = memory && data;

            if (system) {
                sys = data[system];
                if (formats[system] < 3) {
                    delete data[system];
                }
                me.setClipboardData(sys);
            }
        },

        doPaste: function (format, data) {
            var formats = this.getFormats();

            this[formats[format].put](data, format);
        },

        finishInit: function (comp) {
            var me = this;

            me.keyMap = new Ext.util.KeyMap({
                target: comp.el,

                binding: [{
                    ctrl: true, key: 'x', fn: me.onCut, scope: me
                }, {
                    ctrl: true, key: 'c', fn: me.onCopy, scope: me
                }, {
                    ctrl: true, key: 'v', fn: me.onPaste, scope: me
                }]
            });

            ++me.shared.counter;

            comp.on({
                destroy: 'destroy',
                scope: me
            });
        },

        getData: function (erase, format) {
            var me = this,
                formats = me.getFormats(),
                data, i, name, names;

            if (Ext.isString(format)) {
                //<debug>
                if (!formats[format]) {
                    Ext.Error.raise('Invalid clipboard format "' + format + '"');
                }
                //</debug>
                data = me[formats[format].get](format, erase);
            } else {
                data = {};
                names = [];

                if (format) {
                    for (name in format) {
                        //<debug>
                        if (!formats[name]) {
                            Ext.Error.raise('Invalid clipboard format "' + name + '"');
                        }
                        //</debug>
                        names.push(name);
                    }
                } else {
                    names = Ext.Object.getAllKeys(formats);
                }

                for (i = names.length; i-- > 0; ) {
                    data[name] = me[formats[name].get](name, erase && !i);
                }
            }

            return data;
        },

        /**
         * @private
         * @return {Ext.dom.Element}
         */
        getHiddenTextArea: function () {
            var shared = this.shared,
                ret = shared.textArea;

            if (!ret) {
                shared.textArea = ret = Ext.getBody().createChild({
                    tag: 'textarea',
                    tabIndex: -1, // don't tab through this fellow
                    style: {
                        position: 'absolute',
                        top: '-1000px',
                        width: '1px'
                    }
                });
            }

            return ret;
        },

        onCopy: function (event) {
            this.doCutCopy(event, false);
        },

        onCut: function (event) {
            this.doCutCopy(event, true);
        },

        onPaste: function () {
            var me = this,
                sharedData = me.shared.data,
                source = me.getSource(),
                i, n, s;

            if (source) {
                for (i = 0, n = source.length; i < n; ++i) {
                    s = source[i];

                    if (s === 'system') {
                        // get the format used by the system clipboard.
                        s = me.getSystem();
                        me.pasteClipboardData(s);
                        break;
                    } else if (sharedData && (s in sharedData)) {
                        me.doPaste(s, sharedData[s]);
                        break;
                    }
                }
            }
        },

        pasteClipboardData: function (format) {
            var me = this,
                clippy = window.clipboardData,
                area, focusEl;

            if (clippy && clippy.getData) {
                 me.doPaste(format, clippy.getData("text"));
            } else {
                focusEl = Ext.Element.getActiveElement();
                area = me.getHiddenTextArea().dom;
                area.value = '';
                area.focus();

                // Between now and the deferred function, the CTRL+V hotkey will have
                // its default action processed which will paste the clipboard content
                // into the textarea.

                Ext.defer(function () {
                    // Focus back to the real destination
                    if (focusEl) {
                        focusEl.focus();
                    }
                    me.doPaste(format, area.value);
                    area.value = '';
                }, 100, me);
            }
        },

        setClipboardData: function (data) {
            var clippy = window.clipboardData;

            if (clippy && clippy.setData) {
                clippy.setData("text", data);
            } else {
                var me = this,
                    area = me.getHiddenTextArea().dom,
                    focusEl = Ext.Element.getActiveElement();

                area.value = data;
                area.focus();
                area.select();

                // Between now and the deferred function, the CTRL+C/X hotkey will have
                // its default action processed which will update the clipboard from the
                // textarea.

                Ext.defer(function () {
                    area.value = '';
                    if (focusEl) {
                        focusEl.focus();
                    }
                }, 50);
            }
        },

        syncFormats: function () {
            var me = this,
                map = {},
                memory = me.getMemory(),
                system = me.getSystem(),
                i, s;

            if (system) {
                map[system] = 1;
            }

            if (memory) {
                for (i = memory.length; i-- > 0; ) {
                    s = memory[i];
                    map[s] = map[s] ? 3 : 2;
                }
            }

            // 1: memory
            // 2: system
            // 3: both
            return me.allFormats = map; // jshint ignore:line
        },

        updateMemory: function () {
            this.allFormats = null;
        },

        updateSystem: function () {
            this.allFormats = null;
        }
    }
});
