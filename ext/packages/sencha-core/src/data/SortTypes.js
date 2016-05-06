/**
 * This class defines a series of static methods that are used on a
 * {@link Ext.data.Field} for performing sorting. The methods cast the 
 * underlying values into a data type that is appropriate for sorting on
 * that particular field.  If a {@link Ext.data.Field#type} is specified, 
 * the sortType will be set to a sane default if the sortType is not 
 * explicitly defined on the field. The sortType will make any necessary
 * modifications to the value and return it.
 *
 *  - **`asText`** - Removes any tags and converts the value to a string
 *  - **`asUCText`** - Removes any tags and converts the value to an uppercase string
 *  - **`asUCText`** - Converts the value to an uppercase string
 *  - **`asDate`** - Converts the value into Unix epoch time
 *  - **`asFloat`** - Converts the value to a floating point number
 *  - **`asInt`** - Converts the value to an integer number
 *
 * It is also possible to create a custom sortType that can be used throughout
 * an application.
 *
 *      Ext.apply(Ext.data.SortTypes, {
 *          asPerson: function(person){
 *              // expects an object with a first and last name property
 *              return person.lastName.toUpperCase() + person.firstName.toLowerCase();
 *          }
 *      });
 *
 *      Ext.define('Employee', {
 *          extend: 'Ext.data.Model',
 *          fields: [{
 *              name: 'person',
 *              sortType: 'asPerson'
 *          }, {
 *              name: 'salary',
 *              type: 'float' // sortType set to asFloat
 *          }]
 *      });
 *
 * @singleton
 */
Ext.define('Ext.data.SortTypes', {

    singleton: true,

    /**
     * Default sort that does nothing
     * @param {Object} s The value being converted
     * @return {Object} The comparison value
     */
    none: Ext.identityFn,

    /**
     * The regular expression used to strip commas
     * @type {RegExp}
     * @property
     */
    stripCommasRe: /,/g,

    /**
     * The regular expression used to strip tags
     * @type {RegExp}
     * @property
     */
    stripTagsRE: /<\/?[^>]+>/gi,

    /**
     * Strips all HTML tags to sort on text only
     * @param {Object} s The value being converted
     * @return {String} The comparison value
     */
    asText: function (s) {
        // If allowNull, return the Unicode null character.
        return (s != null) ? String(s).replace(this.stripTagsRe, '') : '\u0000';
    },

    /**
     * Strips all HTML tags to sort on text only - Case insensitive
     * @param {Object} s The value being converted
     * @return {String} The comparison value
     */
    asUCText: function (s) {
        // If allowNull, return the Unicode null character.
        return (s != null) ? String(s).toUpperCase().replace(this.stripTagsRe, '') : '\u0000';
    },

    /**
     * Case insensitive string
     * @param {Object} s The value being converted
     * @return {String} The comparison value
     */
    asUCString: function (s) {
        // If allowNull, return the Unicode null character.
        return (s != null) ? String(s).toUpperCase() : '\u0000';
    },

    /**
     * Date sorting
     * @param {Object} s The value being converted
     * @return {Number} The comparison value
     */
    asDate: function (s) {
        if (!s) {
            return 0;
        }

        if (Ext.isDate(s)) {
            return s.getTime();
        }

        return Date.parse(String(s));
    },

    /**
     * Float sorting
     * @param {Object} s The value being converted
     * @return {Number} The comparison value
     */
    asFloat: function (s) {
        var val = parseFloat(String(s).replace(this.stripCommasRe, ''));
        return isNaN(val) ? 0 : val;
    },

    /**
     * Integer sorting
     * @param {Object} s The value being converted
     * @return {Number} The comparison value
     */
    asInt: function (s) {
        var val = parseInt(String(s).replace(this.stripCommasRe, ''), 10);
        return isNaN(val) ? 0 : val;
    }
});
