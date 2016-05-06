/**
 * This class contains utility methods for dealing with TSV (Tab Separated Values) as
 * specified in <a href="http://tools.ietf.org/html/rfc4180">RFC 4180</a>.
 *
 * For details see `{@link Ext.util.DelimitedValue}`.
 *
 * @since 5.1.0
 */
Ext.define('Ext.util.TSV', {
    extend: 'Ext.util.DelimitedValue',

    singleton: true,

    delimiter: '\t'
});
