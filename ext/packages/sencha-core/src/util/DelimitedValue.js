/**
 * This base class contains utility methods for dealing with formats such as CSV (Comma
 * Separated Values) as specified in <a href="http://tools.ietf.org/html/rfc4180">RFC 4180</a>.
 *
 * The base class implements the mechanics and is governed by these config options:
 *
 *  * `{@link #delimiter}`
 *  * `{@link #lineBreak}`
 *  * `{@link #quote}`
 *
 * These options affect the `{@link #method-encode}` and `{@link #method-decode}` methods.
 * When *decoding*, however, `{@link #lineBreak}` is ignored and instead each line can
 * be separated by any standard line terminator character or character sequence:
 *
 *  * ```\u000a```
 *  * ```\u000d```
 *  * ```\u000d\u000a```
 *
 * Strings which contain the {@link #delimiter} character are quoted using the
 * {@link #quote} character, and any internal {@link #quote} characters are doubled.
 *
 * *Important*
 * While the primary use case is to encode strings, other atomic data types can be encoded
 * as values within a line such as:
 *
 *  * Number
 *  * Boolean
 *  * Date (encoded as an <a href="http://www.iso.org/iso/home/standards/iso8601.htm">ISO 8601</a> date string.)
 *  * null (encoded as an empty string.)
 *  * undefined (encoded as an empty string.)
 *
 * Not that when *decoding*, all data is read as strings. This class does not convert
 * incoming data. To do that, use an {@link Ext.data.reader.Array ArrayReader}.
 *
 * See `{@link Ext.util.CSV}` and  `{@link Ext.util.TSV}` for pre-configured instances.
 *
 * @since 5.1.0
 */
Ext.define('Ext.util.DelimitedValue', {
    /**
     * @cfg {String} dateFormat
     * The {@link Ext.Date#format format} to use for dates
     */
    dateFormat: 'C',

    /**
     * @cfg {String} delimiter
     * The string used to separate the values in a row. Common values for this config
     * are comma (",") and tab ("\t"). See `{@link Ext.util.CSV}` and  `{@link Ext.util.TSV}`
     * for pre-configured instances of these formats.
     */
    delimiter: '\t',

    /**
     * @cfg {String} lineBreak
     * The string used by `{@link #encode}` to separate each row. The `{@link #decode}`
     * method accepts all forms of line break.
     */
    lineBreak: '\n',

    /**
     * @cfg {String} quote
     * The character to use as to quote values that contain the special `delimiter`
     * or `{@link #lineBreak}` characters.
     */
    quote: '"',
    
    parseREs: {},
    quoteREs: {},

    lineBreakRe: /\r?\n/g,

    constructor: function (config) {
        if (config) {
            Ext.apply(this, config);
        }
    },

    /**
     * Decodes a string of encoded values into an array of rows. Each row is an array of
     * strings.
     *
     * Note that this function does not convert the string values in each column into
     * other data types. To do that, use an {@link Ext.data.reader.Array ArrayReader}.
     *
     * For example:
     *
     *     Ext.util.CSV.decode('"foo ""bar"", bletch",Normal String,2010-01-01T21:45:32.004Z\u000a3.141592653589793,1,false');
     *
     * produces the following array of string arrays:
     *
     *     [
     *         ['foo "bar", bletch','Normal String', '2010-01-01T21:45:32.004Z'],
     *         ['3.141592653589793', '1', 'false']
     *     ]
     *
     * @param {String} input The string to parse.
     *
     * @param {String} [delimiter] The column delimiter to use if the default value
     * of {@link #cfg-delimiter delimiter} is not desired.
     *
     * @return {String[][]} An array of rows where each row is an array of Strings.
     */
    decode: function (input, delimiter) {
        var me = this,
            // Check to see if the column delimiter is defined. If not,
            // then default to comma.
            delim = (delimiter || me.delimiter),
            row = [],
            result = [row],
            quote = me.quote,
            quoteREs = me.quoteREs,
            parseREs = me.parseREs,

            // Create a regular expression to parse the CSV values unless we already have
            // one for this delimiter.
            parseRE = parseREs[delim] ||
                (parseREs[delim] = new RegExp(
                    // Delimiters.
                    "(\\" + delim + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:\\" + quote + "([^\\" + quote + "]*(?:\\" + quote + "\\" + quote +
                            "[^\\" + quote + "]*)*)\\" + quote + "|" +

                    // Standard fields.
                    "([^\"\\" + delim + "\\r\\n]*))",
                "gi")),

            dblQuoteRE = quoteREs[quote] ||
                (quoteREs[quote] = new RegExp('\\' + quote + '\\' + quote, 'g')),

            arrMatches, strMatchedDelimiter, strMatchedValue;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = parseRE.exec(input)) {
            strMatchedDelimiter = arrMatches[1];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (strMatchedDelimiter.length && strMatchedDelimiter !== delim) {
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                result.push(row = []);
            }

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {
                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[2].replace(dblQuoteRE, '"');
            } else {
                // We found a non-quoted value.
                strMatchedValue = arrMatches[3];
            }

            row.push(strMatchedValue);
        }

        return result;
    },

    /**
     * Converts a two-dimensional array into an encoded string.
     *
     * For example:
     *
     *     Ext.util.CSV.encode([
     *         ['foo "bar", bletch', 'Normal String', new Date()],
     *         [Math.PI, 1, false]
     *     ]);
     *
     * The above produces the following string:
     *
     *     '"foo ""bar"", bletch",Normal String,2010-01-01T21:45:32.004Z\u000a3.141592653589793,1,false'
     *
     * @param {Mixed[][]} input An array of row data arrays.
     *
     * @param {String} [delimiter] The column delimiter to use if the default value
     * of {@link #cfg-delimiter delimiter} is not desired.
     *
     * @return {String} A string in which data items are separated by {@link #delimiter}
     * characters, and rows are separated by {@link #lineBreak} characters.
     */
    encode: function (input, delimiter) {
        var me = this,
            delim = delimiter || me.delimiter,
            dateFormat = me.dateFormat,
            quote = me.quote,
            twoQuotes = quote + quote,
            rowIndex = input.length,
            lineBreakRe = me.lineBreakRe,
            result = [],
            outputRow = [],
            col, columnIndex, inputRow;

        while (rowIndex-- > 0) {
            inputRow = input[rowIndex];
            outputRow.length = columnIndex = inputRow.length;

            while (columnIndex-- > 0) {
                col = inputRow[columnIndex];

                if (col == null) { // == null || === undefined
                    col = '';
                } else if (typeof col === 'string') {
                    if (col) {
                        // If the value contains quotes, double them up, and wrap with quotes
                        if (col.indexOf(quote) > -1) {
                            col = quote + col.split(quote).join(twoQuotes) + quote;
                        } else if (col.indexOf(delim) > -1 || lineBreakRe.test(col)) {
                            col = quote + col + quote;
                        }
                    }
                } else if (Ext.isDate(col)) {
                    col = Ext.Date.format(col, dateFormat);
                }
                //<debug>
                else if (col && (isNaN(col) || Ext.isArray(col))) {
                    Ext.Error.raise('Cannot serialize ' + Ext.typeOf(col) + ' into CSV');
                }
                //</debug>

                outputRow[columnIndex] = col;
            }

            result[rowIndex] = outputRow.join(delim);
        }

        return result.join(me.lineBreak);
    }
});
