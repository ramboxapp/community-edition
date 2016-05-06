/**
 * @class Ext.draw.sprite.Instancing
 * @extends Ext.draw.sprite.Sprite
 *
 * Sprite that represents multiple instances based on the given template.
 */
Ext.define('Ext.draw.sprite.Instancing', {
    extend: 'Ext.draw.sprite.Sprite',
    alias: 'sprite.instancing',
    type: 'instancing',
    isInstancing: true,
    config: {
        
        /**
         * @cfg {Object} [template=null] The sprite template used by all instances.
         */
        template: null
    },
    instances: null,

    applyTemplate: function (template) {
        //<debug>
        if (!Ext.isObject(template)) {
            Ext.Error.raise("A template of an instancing sprite must either be " +
                "a sprite instance or a valid config object from which a template " +
                "sprite will be created.");
        } else if (template.isInstancing || template.isComposite) {
            Ext.Error.raise("Can't use an instancing or composite sprite " +
                "as a template for an instancing sprite.");
        }
        //</debug>
        if (!template.isSprite) {
            if (!template.xclass && !template.type) {
                // For compatibility with legacy charts.
                template.type = 'circle';
            }
            template = Ext.create(template.xclass || 'sprite.' + template.type, template);
        }
        template.setParent(this);
        return template;
    },

    updateTemplate: function (template, oldTemplate) {
        if (oldTemplate) {
            delete oldTemplate.ownAttr;
        }
        template.setSurface(this.getSurface());
        // ownAttr is used to get a reference to the template's attributes
        // when one of the instances is rendering, as at that moment the template's
        // attributes (template.attr) are the instance's attributes.
        template.ownAttr = template.attr;
        template.attr.children = this.instances = [];
        this.position = 0;
    },

    updateSurface: function (surface) {
        var template = this.getTemplate();
        if (template) {
            template.setSurface(surface);
        }
    },

    get: function (index) {
        return this.instances[index];
    },

    getCount: function () {
        return this.instances.length;
    },

    clearAll: function () {
        this.instances.length = 0;
        this.position = 0;
    },

    /**
     * Creates a new sprite instance.
     * 
     * @param {Object} config The configuration of the instance.
     * @param {Boolean} [bypassNormalization] 'true' to bypass attribute normalization.
     * @param {Boolean} [avoidCopy] 'true' to avoid copying the `config` object.
     * @return {Object} The attributes of the instance.
     */
    createInstance: function (config, bypassNormalization, avoidCopy) {
        var template = this.getTemplate(),
            originalAttr = template.attr,
            attr = Ext.Object.chain(originalAttr);
        template.topModifier.prepareAttributes(attr);
        template.attr = attr;
        template.setAttributes(config, bypassNormalization, avoidCopy);
        attr.template = template;
        this.instances.push(attr);
        template.attr = originalAttr;
        this.position++;
        return attr;
    },

    /**
     * Not supported.
     * 
     * @return {null}
     */
    getBBox: function () { return null; },

    /**
     * Returns the bounding box for the instance at the given index.
     *
     * @param {Number} index The index of the instance.
     * @param {Boolean} [isWithoutTransform] 'true' to not apply sprite transforms to the bounding box.
     * @return {Object} The bounding box for the instance.
     */
    getBBoxFor: function (index, isWithoutTransform) {
        var template = this.getTemplate(),
            originalAttr = template.attr,
            bbox;
        template.attr = this.instances[index];
        bbox = template.getBBox(isWithoutTransform);
        template.attr = originalAttr;
        return bbox;
    },

    render: function (surface, ctx, clipRect, rect) {
        //<debug>
        if (!this.getTemplate()) {
            Ext.Error.raise('An instancing sprite must have a template.');
        }
        //</debug>
        var me = this,
            template = me.getTemplate(),
            mat = me.attr.matrix,
            originalAttr = template.attr,
            instances = me.instances,
            i, ln = me.position;

        mat.toContext(ctx);
        template.preRender(surface, ctx, clipRect, rect);
        template.useAttributes(ctx, rect);
        for (i = 0; i < ln; i++) {
            if (instances[i].dirtyZIndex) {
                break;
            }
        }
        for (i = 0; i < ln; i++) {
            if (instances[i].hidden) {
                continue;
            }
            ctx.save();
            template.attr = instances[i];
            template.useAttributes(ctx, rect);
            template.render(surface, ctx, clipRect, rect);
            ctx.restore();
        }
        template.attr = originalAttr;
    },

    /**
     * Sets the attributes for the instance at the given index.
     * 
     * @param {Number} index the index of the instance
     * @param {Object} changes the attributes to change
     * @param {Boolean} [bypassNormalization] 'true' to avoid attribute normalization
     */
    setAttributesFor: function (index, changes, bypassNormalization) {
        var template = this.getTemplate(),
            originalAttr = template.attr,
            attr = this.instances[index];
        if (!attr) {
            return;
        }
        template.attr = attr;
        if (bypassNormalization) {
            changes = Ext.apply({}, changes);
        } else {
            changes = template.self.def.normalize(changes);
        }
        template.topModifier.pushDown(attr, changes);
        template.attr = originalAttr;
    },

    destroy: function () {
        this.callParent();
        this.instances.length = 0;
        this.instances = null;
        if (this.getTemplate()) {
            this.getTemplate().destroy();
        }
    }
});