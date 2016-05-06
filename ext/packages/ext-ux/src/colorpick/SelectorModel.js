/**
 * View Model that holds the "selectedColor" of the color picker container.
 */
Ext.define('Ext.ux.colorpick.SelectorModel', {
    extend : 'Ext.app.ViewModel',
    alias  : 'viewmodel.colorpick-selectormodel',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    data: {
        selectedColor: {
            r : 255,  // red
            g : 255,  // green
            b : 255,  // blue
            h : 0,    // hue,
            s : 1,    // saturation
            v : 1,    // value
            a : 1     // alpha (opacity)
        },
        previousColor: {
            r : 0,    // red
            g : 0,    // green
            b : 0,    // blue
            h : 0,    // hue,
            s : 1,    // saturation
            v : 1,    // value
            a : 1     // alpha (opacity)
        }
    },

    formulas: {
        // Hexadecimal representation of the color
        hex: {
            get: function (get) {
                var r = get('selectedColor.r').toString(16),
                    g = get('selectedColor.g').toString(16),
                    b = get('selectedColor.b').toString(16),
                    result;

                result = Ext.ux.colorpick.ColorUtils.rgb2hex(r, g, b);
                return '#' + result;
            },

            set: function (hex) {
                var rgb = Ext.ux.colorpick.ColorUtils.hex2rgb(hex);
                this.changeRGB(rgb);
            }
        },

        // "R" in "RGB"
        red: {
            get: function(get) {
                return get('selectedColor.r');
            },

            set: function(r) {
                this.changeRGB({ r: r });
            }
        },

        // "G" in "RGB"
        green: {
            get: function(get) {
                return get('selectedColor.g');
            },

            set: function(g) {
                this.changeRGB({ g: g });
            }
        },

        // "B" in "RGB"
        blue: {
            get: function(get) {
                return get('selectedColor.b');
            },

            set: function(b) {
                this.changeRGB({ b: b });
            }
        },

        // "H" in HSV
        hue: {
            get: function(get) {
                return get('selectedColor.h') * 360;
            },

            set: function(hue) {
                this.changeHSV({ h: hue / 360 });
            }
        },

        // "S" in HSV
        saturation: {
            get : function(get) {
                return get('selectedColor.s') * 100;
            },

            set: function(saturation) {
                this.changeHSV({ s: saturation / 100 });
            }
        },

        // "V" in HSV
        value: {
            get: function(get) {
                var v = get('selectedColor.v');
                return v * 100;
            },

            set: function(value) {
                this.changeHSV({ v: value / 100 });
            }
        },

        alpha: {
            get: function(data) {
                var a = data('selectedColor.a');
                return a * 100;
            },

            set: function(alpha) {
                this.set('selectedColor', Ext.applyIf({
                    a: alpha / 100
                }, this.data.selectedColor));
            }
        }
    }, // formulas

    changeHSV: function (hsv) {
        Ext.applyIf(hsv, this.data.selectedColor);

        var rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hsv.h, hsv.s, hsv.v);

        hsv.r = rgb.r;
        hsv.g = rgb.g;
        hsv.b = rgb.b;

        this.set('selectedColor', hsv);
    },

    changeRGB: function (rgb) {
        Ext.applyIf(rgb, this.data.selectedColor);

        var hsv = Ext.ux.colorpick.ColorUtils.rgb2hsv(rgb.r, rgb.g, rgb.b);

        rgb.h = hsv.h;
        rgb.s = hsv.s;
        rgb.v = hsv.v;

        this.set('selectedColor', rgb);
    }
});
