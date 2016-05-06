/**
 * Mixin that provides the functionality to place markers.
 */
Ext.define('Ext.chart.MarkerHolder', {
    extend: 'Ext.Mixin',

    mixinConfig: {
        id: 'markerHolder',
        after: {
            constructor: 'constructor',
            preRender: 'preRender'
        },
        before: {
            destroy: 'destroy'
        }
    },

    isMarkerHolder: true,

    constructor: function () {
        this.boundMarkers = {};
        this.cleanRedraw = false;
    },

    /**
     *
     * @param {String} name
     * @param {Ext.chart.Markers} marker
     */
    bindMarker: function (name, marker) {
        if (marker) {
            if (!this.boundMarkers[name]) {
                this.boundMarkers[name] = [];
            }
            Ext.Array.include(this.boundMarkers[name], marker);
        }
    },

    getBoundMarker: function (name) {
        return this.boundMarkers[name];
    },

    preRender: function () {
        var me = this,
            id = me.getId(),
            boundMarkers = me.boundMarkers,
            parent = me.getParent(),
            boundMarkersItem,
            name, i, ln,
            matrix;

        if (me.surfaceMatrix) {
            matrix = me.surfaceMatrix.set(1, 0, 0, 1, 0, 0);
        } else {
            matrix = me.surfaceMatrix = new Ext.draw.Matrix();
        }

        me.cleanRedraw = !this.attr.dirty;
        if (!me.cleanRedraw) {
            for (name in me.boundMarkers) {
                if (boundMarkers[name]) {
                    for (boundMarkersItem = boundMarkers[name], i = 0, ln = boundMarkersItem.length; i < ln; i++) {
                        boundMarkersItem[i].clear(id);
                    }
                }
            }
        }

        while (parent && parent.attr && parent.attr.matrix) {
            matrix.prependMatrix(parent.attr.matrix);
            parent = parent.getParent();
        }
        matrix.prependMatrix(parent.matrix);
        me.surfaceMatrix = matrix;
        me.inverseSurfaceMatrix = matrix.inverse(me.inverseSurfaceMatrix);
    },

    putMarker: function (name, attr, index, bypassNormalization, keepRevision) {
        var boundMarkersItem, i, ln, id = this.getId();
        if (this.boundMarkers[name]) {
            for (boundMarkersItem = this.boundMarkers[name], i = 0, ln = boundMarkersItem.length; i < ln; i++) {
                boundMarkersItem[i].putMarkerFor(id, attr, index, bypassNormalization, keepRevision);
            }
        }
    },

    getMarkerBBox: function (name, index, isWithoutTransform) {
        var boundMarker = this.boundMarkers[name],
            id = this.getId();
        if (boundMarker) {
            return boundMarker[0].getMarkerBBoxFor(id, index, isWithoutTransform);
        }
    },

    destroy: function () {
        var boundMarkers = this.boundMarkers,
            name, markers, i, marker;

        for (name in boundMarkers) {
            markers = boundMarkers[name];
            for (i = 0; i < markers.length; i++) {
                marker = markers[i];
                marker.clear(this.getId());
            }
        }
    }

});
