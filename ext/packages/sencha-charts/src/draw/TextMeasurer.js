/**
 * Utility class to provide a way to *approximately* measure the dimension of text
 * without a drawing context.
 */
Ext.define('Ext.draw.TextMeasurer', {
    singleton: true,

    requires: ['Ext.util.TextMetrics'],

    measureDiv: null,
    measureCache: {},

    /**
     * @cfg {Boolean} [precise=false]
     * This singleton tries not to make use of the Ext.util.TextMetrics because it is
     * several times slower than TextMeasurer's own solution. TextMetrics is more precise
     * though, so if you have a case where the error is too big, you may want to set
     * this config to `true` to get perfect results at the expense of performance.
     * Note: defaults to `true` in IE8.
     */
    precise: Ext.isIE8,

    measureDivTpl: {
        tag: 'div',
        style: {
            overflow: 'hidden',
            position: 'relative',
            'float': 'left', // 'float' is a reserved word. Don't unquote, or it will break the CMD build.
            width: 0,
            height: 0
        },
        //<debug>
        // Tell the spec runner to ignore this element when checking if the dom is clean.
        'data-sticky': true,
        //</debug>
        children: {
            tag: 'div',
            style: {
                display: 'block',
                position: 'absolute',
                x: -100000,
                y: -100000,
                padding: 0,
                margin: 0,
                'z-index': -100000,
                'white-space': 'nowrap'
            }
        }
    },

    /**
     * @private Measure the size of a text with specific font by using DOM to measure it.
     * Could be very expensive therefore should be used lazily.
     * @param {String} text
     * @param {String} font
     * @return {Object} An object with `width` and `height` properties.
     * @return {Number} return.width
     * @return {Number} return.height
     */
    actualMeasureText: function (text, font) {
        var me = Ext.draw.TextMeasurer,
            measureDiv = me.measureDiv,
            FARAWAY = 100000,
            size;

        if (!measureDiv) {
            var parent = Ext.Element.create({
                //<debug>
                // Tell the spec runner to ignore this element when checking if the dom is clean.
                'data-sticky': true,
                //</debug>
                style: {
                    "overflow": "hidden",
                    "position": "relative",
                    "float": "left", // DO NOT REMOVE THE QUOTE OR IT WILL BREAK COMPRESSOR
                    "width": 0,
                    "height": 0
                }
            });
            me.measureDiv = measureDiv = Ext.Element.create({
                style: {
                    "position": 'absolute',
                    "x": FARAWAY,
                    "y": FARAWAY,
                    "z-index": -FARAWAY,
                    "white-space": "nowrap",
                    "display": 'block',
                    "padding": 0,
                    "margin": 0
                }
            });
            Ext.getBody().appendChild(parent);
            parent.appendChild(measureDiv);
        }
        if (font) {
            measureDiv.setStyle({
                font: font,
                lineHeight: 'normal'
            });
        }
        measureDiv.setText('(' + text + ')');
        size = measureDiv.getSize();
        measureDiv.setText('()');
        size.width -= measureDiv.getSize().width;
        return size;
    },

    /**
     * Measure a single-line text with specific font.
     * This will split the text into characters and add up their size.
     * That may *not* be the exact size of the text as it is displayed.
     * @param {String} text
     * @param {String} font
     * @return {Object} An object with `width` and `height` properties.
     * @return {Number} return.width
     * @return {Number} return.height
     */
    measureTextSingleLine: function (text, font) {
        if (this.precise) {
            return this.preciseMeasureTextSingleLine(text, font);
        }
        text = text.toString();
        var cache = this.measureCache,
            chars = text.split(''),
            width = 0,
            height = 0,
            cachedItem, charactor, i, ln, size;

        if (!cache[font]) {
            cache[font] = {};
        }
        cache = cache[font];

        if (cache[text]) {
            return cache[text];
        }

        for (i = 0, ln = chars.length; i < ln; i++) {
            charactor = chars[i];
            if (!(cachedItem = cache[charactor])) {
                size = this.actualMeasureText(charactor, font);
                cachedItem = cache[charactor] = size;
            }
            width += cachedItem.width;
            height = Math.max(height, cachedItem.height);
        }
        return cache[text] = {
            width: width,
            height: height
        };
    },

    // A more precise but slower version of the measureTextSingleLine method.
    preciseMeasureTextSingleLine: function (text, font) {
        text = text.toString();
        var measureDiv = this.measureDiv ||
            (this.measureDiv = Ext.getBody().createChild(this.measureDivTpl).down('div'));
        measureDiv.setStyle({font: font || ''});
        return Ext.util.TextMetrics.measure(measureDiv, text);
    },

    /**
     * Measure a text with specific font.
     * This will split the text to lines and add up their size.
     * That may *not* be the exact size of the text as it is displayed.
     * @param {String} text
     * @param {String} font
     * @return {Object} An object with `width`, `height` and `sizes` properties.
     * @return {Number} return.width
     * @return {Number} return.height
     * @return {Object} return.sizes Results of individual line measurements, in case of multiline text.
     */
    measureText: function (text, font) {
        var lines = text.split('\n'),
            ln = lines.length,
            height = 0,
            width = 0,
            line, i,
            sizes;

        if (ln === 1) {
            return this.measureTextSingleLine(text, font);
        }

        sizes = [];
        for (i = 0; i < ln; i++) {
            line = this.measureTextSingleLine(lines[i], font);
            sizes.push(line);
            height += line.height;
            width = Math.max(width, line.width);
        }

        return {
            width: width,
            height: height,
            sizes: sizes
        };
    }
});