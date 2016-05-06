Ext.define('Ext.ux.colorpick.ColorUtils', function (ColorUtils) {
    var oldIE = Ext.isIE && Ext.ieVersion < 10;

    return {
        singleton: true,

        constructor: function () {
            ColorUtils = this;
        },

        backgroundTpl: oldIE ?
            'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, ' +
                'startColorstr=\'#{alpha}{hex}\', endColorstr=\'#{alpha}{hex}\');' :
            'background: {rgba};',

        setBackground: oldIE ? function (el, color) {
            if (el) {
                var tpl = Ext.XTemplate.getTpl(ColorUtils, 'backgroundTpl'),
                    data = {
                        hex: ColorUtils.rgb2hex(color.r, color.g, color.b),
                        alpha: Math.floor(color.a * 255).toString(16)
                    },
                    bgStyle = tpl.apply(data);

                el.applyStyles(bgStyle);
            }
        } : function (el, color) {
            if (el) {
                var tpl = Ext.XTemplate.getTpl(ColorUtils, 'backgroundTpl'),
                    data = {
                        rgba: ColorUtils.getRGBAString(color)
                    },
                    bgStyle = tpl.apply(data);

                el.applyStyles(bgStyle);
            }
        },

        // parse and format functions under objects that match supported format config
        // values of the color picker; parse() methods recieve the supplied color value
        // as a string (i.e "FFAAAA") and return an object form, just like the one
        // ColorPickerModel vm "selectedColor" uses. That same object form is used as a
        // parameter to the format() methods, where the appropriate string form is expected
        // for the return result
        formats: {
            // "FFAA00"
            HEX6: function(colorO) {
                return ColorUtils.rgb2hex(colorO.r, colorO.g, colorO.b);
            },

            // "FFAA00FF" (last 2 are opacity)
            HEX8: function(colorO) {
                var hex = ColorUtils.rgb2hex(colorO.r, colorO.g, colorO.b),
                    opacityHex = Math.round(colorO.a * 255).toString(16);

                if (opacityHex.length < 2) {
                    hex += '0';
                }

                hex += opacityHex.toUpperCase();

                return hex;
            }
        },

        hexRe: /#?([0-9a-f]{3,8})/i,
        rgbaAltRe: /rgba\(\s*([\w#\d]+)\s*,\s*([\d\.]+)\s*\)/,
        rgbaRe: /rgba\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
        rgbRe: /rgb\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,

        /**
         * Turn a string to a color object. Supports these formats:
         *
         * - "#ABC" (HEX short)
         * - "#ABCDEF" (HEX)
         * - "#ABCDEFDD" (HEX with opacity)
         * - "red" (named colors - see {@link #colorMap} source code for a full list)
         * - "rgba(r,g,b,a)" i.e "rgba(255,0,0,1)" (a == alpha == 0-1)
         * - "rgba(red, 0.4)"
         * - "rgba(#ABC, 0.9)"
         * - "rgba(#ABCDEF, 0.8)"
         *
         * @param {String} color The color string to parse.
         * @return {Object} Object with various color properties.
         * @return {Number} return.r The red component (0-255).
         * @return {Number} return.g The green component (0-255).
         * @return {Number} return.b The blue component (0-255).
         * @return {Number} return.a The red component (0-1).
         * @return {Number} return.h The hue component (0-1).
         * @return {Number} return.s The saturation component (0-1).
         * @return {Number} return.v The value component (0-1).
         */
        parseColor: function (color) {
            if (!color) {
                return null;
            }

            var me = this,
                rgb = me.colorMap[color],
                match, ret, hsv;

            if (rgb) {
                ret = {
                    r: rgb[0],
                    g: rgb[1],
                    b: rgb[2],
                    a: 1
                };
            }
            else if (color === 'transparent') {
                ret = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 0
                };
            }
            else {
                match = me.hexRe.exec(color);
                if (match) {
                    match = match[1]; // the captured hex
                    switch (match.length) {
                        default:
                            return null;

                        case 3:
                            ret = {
                                //double the number (e.g. 6 - > 66, a -> aa) and convert to decimal
                                r: parseInt(match[0] + match[0], 16),
                                g: parseInt(match[1] + match[1], 16),
                                b: parseInt(match[2] + match[2], 16),
                                a: 1
                            };
                            break;

                        case 6:
                        case 8:
                            ret = {
                                r: parseInt(match.substr(0,2), 16),
                                g: parseInt(match.substr(2,2), 16),
                                b: parseInt(match.substr(4,2), 16),
                                a: parseInt(match.substr(6,2) || 'ff', 16) / 255
                            };
                            break;
                    }
                }
                else {
                    match = me.rgbaRe.exec(color);
                    if (match) {
                        // proper css => rgba(r,g,b,a)
                        ret = {
                            r: parseFloat(match[1]),
                            g: parseFloat(match[2]),
                            b: parseFloat(match[3]),
                            a: parseFloat(match[4])
                        };
                    }
                    else {
                        match = me.rgbaAltRe.exec(color);
                        if (match) {
                            // scss shorthands =? rgba(red, 0.4), rgba(#222, 0.9), rgba(#444433, 0.8)
                            ret = me.parseColor(match[1]);
                            // we have HSV filled in, so poke on "a" and we're done
                            ret.a = parseFloat(match[2]);
                            return ret;
                        }

                        match = me.rgbRe.exec(color);
                        if (match) {
                            ret = {
                                r: parseFloat(match[1]),
                                g: parseFloat(match[2]),
                                b: parseFloat(match[3]),
                                a: 1
                            };
                        }
                        else {
                            return null;
                        }
                    }
                }
            }

            hsv = this.rgb2hsv(ret.r, ret.g, ret.b);

            return Ext.apply(ret, hsv);
        },

        /**
         *
         * @param rgba
         * @return {String}
         */
        getRGBAString: function(rgba) {
            return "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
        },

        /**
         * Returns a rgb css string whith this color (without the alpha channel)
         * @param rgb
         * @return {String}
         */
        getRGBString: function(rgb) {
            return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        },

        /**
         * Following standard math to convert from hsl to rgb
         * Check out wikipedia page for more information on how this works
         * h => [0,1]
         * s,l => [0,1]
         * @param h
         * @param s
         * @param v
         * @return {Object} An object with "r", "g" and "b" color properties.
         */
        hsv2rgb: function(h, s, v) {
            h = h * 360;

            if (h === 360) {
                h = 0;
            }

            var c = v * s;

            var hprime = h / 60;

            var x = c * (1 - Math.abs(hprime % 2 - 1));

            var rgb = [0, 0, 0];

            switch (Math.floor(hprime)) {
                case 0:
                    rgb = [c, x, 0];
                    break;
                case 1:
                    rgb = [x, c, 0];
                    break;
                case 2:
                    rgb = [0, c, x];
                    break;
                case 3:
                    rgb = [0, x, c];
                    break;
                case 4:
                    rgb = [x, 0, c];
                    break;
                case 5:
                    rgb = [c, 0, x];
                    break;
                default:
                    // <debug>
                    console.error("unknown color " + h + ' ' + s + " " + v);
                    // </debug>
                    break;
            }

            var m = v - c;

            rgb[0] += m;
            rgb[1] += m;
            rgb[2] += m;

            rgb[0] = Math.round(rgb[0] * 255);
            rgb[1] = Math.round(rgb[1] * 255);
            rgb[2] = Math.round(rgb[2] * 255);

            return {
                r: rgb[0],
                g: rgb[1],
                b: rgb[2]
            };
        },

        /**
         * http://en.wikipedia.org/wiki/HSL_and_HSV
         * @param {Number} r The red component (0-255).
         * @param {Number} g The green component (0-255).
         * @param {Number} b The blue component (0-255).
         * @return {Object} An object with "h", "s" and "v" color properties.
         */
        rgb2hsv: function(r,g,b) {
            r = r / 255;
            g = g / 255;
            b = b / 255;

            var M = Math.max(r,g,b);
            var m = Math.min(r,g,b);
            var c = M - m;

            var hprime = 0;
            if (c !== 0) {
                if (M === r) {
                    hprime = ((g - b) / c) % 6;
                } else if (M === g) {
                    hprime = ((b - r) / c) + 2;
                } else if (M === b) {
                    hprime = ((r - g) / c) + 4;
                }
            }

            var h = hprime * 60;
            if (h === 360) {
                h = 0;
            }

            var v = M;

            var s = 0;
            if (c !== 0) {
                s = c/v;
            }

            h = h / 360;

            if (h < 0) {
                h = h + 1;
            }

            return {
                h: h,
                s: s,
                v: v
            };
        },

        /**
         *
         * @param r
         * @param g
         * @param b
         * @return {String}
         */
        rgb2hex: function(r, g, b) {
            r = r.toString(16);
            g = g.toString(16);
            b = b.toString(16);

            if (r.length < 2) {
                r = '0' + r;
            }

            if (g.length < 2) {
                g = '0' + g;
            }

            if (b.length < 2) {
                b = '0' + b;
            }

            return (r + g + b).toUpperCase();
        },

        colorMap: {
            aliceblue:              [240, 248, 255],
            antiquewhite:           [250, 235, 215],
            aqua:                   [0, 255, 255],
            aquamarine:             [127, 255, 212],
            azure:                  [240, 255, 255],
            beige:                  [245, 245, 220],
            bisque:                 [255, 228, 196],
            black:                  [0, 0, 0],
            blanchedalmond:         [255, 235, 205],
            blue:                   [0, 0, 255],
            blueviolet:             [138, 43, 226],
            brown:                  [165, 42, 42],
            burlywood:              [222, 184, 135],
            cadetblue:              [95, 158, 160],
            chartreuse:             [127, 255, 0],
            chocolate:              [210, 105, 30],
            coral:                  [255, 127, 80],
            cornflowerblue:         [100, 149, 237],
            cornsilk:               [255, 248, 220],
            crimson:                [220, 20, 60],
            cyan:                   [0, 255, 255],
            darkblue:               [0, 0, 139],
            darkcyan:               [0, 139, 139],
            darkgoldenrod:          [184, 132, 11],
            darkgray:               [169, 169, 169],
            darkgreen:              [0, 100, 0],
            darkgrey:               [169, 169, 169],
            darkkhaki:              [189, 183, 107],
            darkmagenta:            [139, 0, 139],
            darkolivegreen:         [85, 107, 47],
            darkorange:             [255, 140, 0],
            darkorchid:             [153, 50, 204],
            darkred:                [139, 0, 0],
            darksalmon:             [233, 150, 122],
            darkseagreen:           [143, 188, 143],
            darkslateblue:          [72, 61, 139],
            darkslategray:          [47, 79, 79],
            darkslategrey:          [47, 79, 79],
            darkturquoise:          [0, 206, 209],
            darkviolet:             [148, 0, 211],
            deeppink:               [255, 20, 147],
            deepskyblue:            [0, 191, 255],
            dimgray:                [105, 105, 105],
            dimgrey:                [105, 105, 105],
            dodgerblue:             [30, 144, 255],
            firebrick:              [178, 34, 34],
            floralwhite:            [255, 255, 240],
            forestgreen:            [34, 139, 34],
            fuchsia:                [255, 0, 255],
            gainsboro:              [220, 220, 220],
            ghostwhite:             [248, 248, 255],
            gold:                   [255, 215, 0],
            goldenrod:              [218, 165, 32],
            gray:                   [128, 128, 128],
            green:                  [0, 128, 0],
            greenyellow:            [173, 255, 47],
            grey:                   [128, 128, 128],
            honeydew:               [240, 255, 240],
            hotpink:                [255, 105, 180],
            indianred:              [205, 92, 92],
            indigo:                 [75, 0, 130],
            ivory:                  [255, 255, 240],
            khaki:                  [240, 230, 140],
            lavender:               [230, 230, 250],
            lavenderblush:          [255, 240, 245],
            lawngreen:              [124, 252, 0],
            lemonchiffon:           [255, 250, 205],
            lightblue:              [173, 216, 230],
            lightcoral:             [240, 128, 128],
            lightcyan:              [224, 255, 255],
            lightgoldenrodyellow:   [250, 250, 210],
            lightgray:              [211, 211, 211],
            lightgreen:             [144, 238, 144],
            lightgrey:              [211, 211, 211],
            lightpink:              [255, 182, 193],
            lightsalmon:            [255, 160, 122],
            lightseagreen:          [32, 178, 170],
            lightskyblue:           [135, 206, 250],
            lightslategray:         [119, 136, 153],
            lightslategrey:         [119, 136, 153],
            lightsteelblue:         [176, 196, 222],
            lightyellow:            [255, 255, 224],
            lime:                   [0, 255, 0],
            limegreen:              [50, 205, 50],
            linen:                  [250, 240, 230],
            magenta:                [255, 0, 255],
            maroon:                 [128, 0, 0],
            mediumaquamarine:       [102, 205, 170],
            mediumblue:             [0, 0, 205],
            mediumorchid:           [186, 85, 211],
            mediumpurple:           [147, 112, 219],
            mediumseagreen:         [60, 179, 113],
            mediumslateblue:        [123, 104, 238],
            mediumspringgreen:      [0, 250, 154],
            mediumturquoise:        [72, 209, 204],
            mediumvioletred:        [199, 21, 133],
            midnightblue:           [25, 25, 112],
            mintcream:              [245, 255, 250],
            mistyrose:              [255, 228, 225],
            moccasin:               [255, 228, 181],
            navajowhite:            [255, 222, 173],
            navy:                   [0, 0, 128],
            oldlace:                [253, 245, 230],
            olive:                  [128, 128, 0],
            olivedrab:              [107, 142, 35],
            orange:                 [255, 165, 0],
            orangered:              [255, 69, 0],
            orchid:                 [218, 112, 214],
            palegoldenrod:          [238, 232, 170],
            palegreen:              [152, 251, 152],
            paleturquoise:          [175, 238, 238],
            palevioletred:          [219, 112, 147],
            papayawhip:             [255, 239, 213],
            peachpuff:              [255, 218, 185],
            peru:                   [205, 133, 63],
            pink:                   [255, 192, 203],
            plum:                   [221, 160, 203],
            powderblue:             [176, 224, 230],
            purple:                 [128, 0, 128],
            red:                    [255, 0, 0],
            rosybrown:              [188, 143, 143],
            royalblue:              [65, 105, 225],
            saddlebrown:            [139, 69, 19],
            salmon:                 [250, 128, 114],
            sandybrown:             [244, 164, 96],
            seagreen:               [46, 139, 87],
            seashell:               [255, 245, 238],
            sienna:                 [160, 82, 45],
            silver:                 [192, 192, 192],
            skyblue:                [135, 206, 235],
            slateblue:              [106, 90, 205],
            slategray:              [119, 128, 144],
            slategrey:              [119, 128, 144],
            snow:                   [255, 255, 250],
            springgreen:            [0, 255, 127],
            steelblue:              [70, 130, 180],
            tan:                    [210, 180, 140],
            teal:                   [0, 128, 128],
            thistle:                [216, 191, 216],
            tomato:                 [255, 99, 71],
            turquoise:              [64, 224, 208],
            violet:                 [238, 130, 238],
            wheat:                  [245, 222, 179],
            white:                  [255, 255, 255],
            whitesmoke:             [245, 245, 245],
            yellow:                 [255, 255, 0],
            yellowgreen:            [154, 205, 5]
        }
    };
},
function (ColorUtils) {
    var formats = ColorUtils.formats,
        lowerized = {};

    formats['#HEX6'] = function (color) {
        return '#' + formats.HEX6(color);
    };

    formats['#HEX8'] = function (color) {
        return '#' + formats.HEX8(color);
    };

    Ext.Object.each(formats, function (name, fn) {
        lowerized[name.toLowerCase()] = function (color) {
            var ret = fn(color);
            return ret.toLowerCase();
        }
    });

    Ext.apply(formats, lowerized);
});
