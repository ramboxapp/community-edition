/**
 * Private utility class that manages the internal cache for {@link Ext.dom.Shadow Underlays}
 * and {@link Ext.dom.Shim Shims}.
 * @private
 */
Ext.define('Ext.dom.UnderlayPool', {

    /**
     * @constructor
     * @param {Object} elementConfig A {@link Ext.dom.Helper DomHelper} config object to
     * use for generating elements in the pool.
     */
    constructor: function(elementConfig) {
        this.elementConfig = elementConfig;
        this.cache = [];
    },

    /**
     * Checks an element out of the pool.
     * @return {Ext.dom.Element}
     */
    checkOut: function() {
        var el = this.cache.shift();

        if (!el) {
            el = Ext.Element.create(this.elementConfig);
            el.setVisibilityMode(2);
            //<debug>
            // tell the spec runner to ignore this element when checking if the dom is clean
            el.dom.setAttribute('data-sticky', true);
            //</debug>
        }

        return el;
    },

    /**
     * Checks an element back into the pool for future reuse
     * @param {Ext.dom.Element} el
     */
    checkIn: function(el) {
        this.cache.push(el);
    },

    /**
     * Reset the pool by emptying the cache and destroying all its elements
     */
    reset: function() {
        var cache = this.cache,
            i = cache.length;

        while (i--) {
            cache[i].destroy();
        }

        this.cache = [];
    }
});