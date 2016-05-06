/**
 * @class Ext.draw.modifier.Target
 * @extends Ext.draw.modifier.Modifier
 *
 * This is the destination (top) modifier that has to be put at
 * the top of the modifier stack.
 *
 * The Target modifier figures out which updaters have to be called
 * for the changed set of attributes and makes the sprite and its instances (if any)
 * call them.
 *
 */
Ext.define('Ext.draw.modifier.Target', {
    requires: ['Ext.draw.Matrix'],
    extend: 'Ext.draw.modifier.Modifier',
    alias: 'modifier.target',
    statics: {
        uniqueId: 0
    },

    /**
     * @inheritdoc
     */
    prepareAttributes: function (attr) {
        var previous = this.getPrevious();
        if (previous) {
            previous.prepareAttributes(attr);
        }
        attr.attributeId = 'attribute-' + Ext.draw.modifier.Target.uniqueId++;
        if (!attr.hasOwnProperty('canvasAttributes')) {
            attr.bbox = {
                plain: {dirty: true},
                transform: {dirty: true}
            };
            attr.dirty = true;
            /*
            Maps updaters that have to be called to the attributes that triggered the update.
            It is basically a reversed `triggers` map (see Ext.draw.sprite.AttributeDefinition),
            but only for those attributes that have changed.
            Pending updaters are called by the Ext.draw.sprite.Sprite.callUpdaters method.

            The 'canvas' updater is a special kind of updater that is not actually a function
            but a flag indicating that the attribute should be applied directly to a canvas
            context.
            */
            attr.pendingUpdaters = {};
            /*
            Holds the attributes that triggered the canvas update (attr.pendingUpdaters.canvas).
            Canvas attributes are applied directly to a canvas context
            by the sprite.useAttributes method.
            */
            attr.canvasAttributes = {};
            attr.matrix = new Ext.draw.Matrix();
            attr.inverseMatrix = new Ext.draw.Matrix();
        }
    },

    /**
     * @private
     * Applies changes to sprite/instance attributes and determines which updaters
     * have to be called as a result of attributes change.
     * @param {Object} attr The source attributes.
     * @param {Object} changes The modifier changes.
     */
    applyChanges: function (attr, changes) {

        Ext.apply(attr, changes);

        var sprite = this.getSprite(),
            pendingUpdaters = attr.pendingUpdaters,
            triggers = sprite.self.def.getTriggers(),
            updaters, instances, instance,
            name, hasChanges, canvasAttributes,
            i, j, ln;

        for (name in changes) {
            hasChanges = true;
            if ((updaters = triggers[name])) {
                sprite.scheduleUpdaters(attr, updaters, [name]);
            }
            if (attr.template && changes.removeFromInstance && changes.removeFromInstance[name]) {
                delete attr[name];
            }
        }

        if (!hasChanges) {
            return;
        }

        // This can prevent sub objects to set duplicated attributes to context.
        if (pendingUpdaters.canvas) {
            canvasAttributes = pendingUpdaters.canvas;
            delete pendingUpdaters.canvas;
            for (i = 0, ln = canvasAttributes.length; i < ln; i++) {
                name = canvasAttributes[i];
                attr.canvasAttributes[name] = attr[name];
            }
        }

        // If the attributes of an instancing sprite template are being modified here,
        // then spread the pending updaters to the instances (template's children).
        if (attr.hasOwnProperty('children')) {
            instances = attr.children;
            for (i = 0, ln = instances.length; i < ln; i++) {
                instance = instances[i];
                Ext.apply(instance.pendingUpdaters, pendingUpdaters);
                if (canvasAttributes) {
                    for (j = 0; j < canvasAttributes.length; j++) {
                        name = canvasAttributes[j];
                        instance.canvasAttributes[name] = instance[name];
                    }
                }
                sprite.callUpdaters(instance);
            }
        }

        sprite.setDirty(true);
        sprite.callUpdaters(attr);
    },

    /**
     * @inheritdoc
     */
    popUp: function (attr, changes) {
        this.applyChanges(attr, changes);
    },

    /**
     * @inheritdoc
     */
    pushDown: function (attr, changes) {
        var previous = this.getPrevious();
        if (previous) {
            changes = previous.pushDown(attr, changes);
        }
        this.applyChanges(attr, changes);
        return changes;
    }
});
