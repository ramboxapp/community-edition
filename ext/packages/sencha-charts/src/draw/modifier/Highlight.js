/**
 * @class Ext.draw.modifier.Highlight
 * @extends Ext.draw.modifier.Modifier
 *
 * Highlight is a modifier that will override sprite attributes
 * with {@link Ext.draw.modifier.Highlight#highlightStyle highlightStyle} attributes
 * when sprite's `highlighted` attribute is true.
 */
Ext.define('Ext.draw.modifier.Highlight', {
    extend: 'Ext.draw.modifier.Modifier',
    alias: 'modifier.highlight',

    config: {

        /**
         * @cfg {Boolean} enabled 'true' if the highlight is applied.
         */
        enabled: false,

        /**
         * @cfg {Object} highlightStyle The style attributes of the highlight modifier.
         */
        highlightStyle: null
    },

    preFx: true,

    applyHighlightStyle: function (style, oldStyle) {
        oldStyle = oldStyle || {};
        if (this.getSprite()) {
            Ext.apply(oldStyle, this.getSprite().self.def.normalize(style));
        } else {
            Ext.apply(oldStyle, style);
        }
        return oldStyle;
    },

    /**
     * @inheritdoc
     */
    prepareAttributes: function (attr) {
        if (!attr.hasOwnProperty('highlightOriginal')) {
            attr.highlighted = false;
            attr.highlightOriginal = Ext.Object.chain(attr);
            attr.highlightOriginal.prototype = attr;
            // A list of attributes that should be removed from a sprite instance
            // when it is unhighlighted.
            attr.highlightOriginal.removeFromInstance = {};
        }
        if (this._previous) {
            this._previous.prepareAttributes(attr.highlightOriginal);
        }
    },

    updateSprite: function (sprite, oldSprite) {
        if (sprite) {
            if (this.getHighlightStyle()) {
                this._highlightStyle = sprite.self.def.normalize(this.getHighlightStyle());
            }
            this.setHighlightStyle(sprite.config.highlight);
        }

        // Add highlight related attributes to sprite's attribute definition.
        // TODO: Unfortunately this will affect all sprites of the same type,
        // TODO: even those without the highlight modifier.
        sprite.self.def.setConfig({
            defaults: {
                highlighted: false
            },
            processors: {
                highlighted: 'bool'
            }
        });
        this.setSprite(sprite);
    },

    /**
     * Filter out modifier changes that override highlightStyle or source attributes.
     * @param {Object} attr The source attributes.
     * @param {Object} changes The modifier changes.
     * @return {*} The filtered changes.
     */
    filterChanges: function (attr, changes) {
        var me = this,
            highlightOriginal = attr.highlightOriginal,
            style = me.getHighlightStyle(),
            name;
        if (attr.highlighted) {
            // TODO: Remove changes that match highlightStyle attribute names.
            // TODO: Backup such changes to highlightOriginal before removing.
            for (name in changes) {
                if (style.hasOwnProperty(name)) {
                    // If sprite is highlighted, then stash the changes
                    // to the `highlightStyle` attributes made by lower level modifiers
                    // to apply them later when sprite is unhighlighted.
                    highlightOriginal[name] = changes[name];
                    delete changes[name];
                }
            }
        }

        // TODO: Remove changes (except the 'highlighted' flag) that match the original values. Why?
        for (name in changes) {
            if (name !== 'highlighted' && highlightOriginal[name] === changes[name]) {
                delete changes[name];
            }
        }

        return changes;
    },

    /**
     * @inheritdoc
     */
    pushDown: function (attr, changes) {
        var highlightStyle = this.getHighlightStyle(),
            highlightOriginal = attr.highlightOriginal,
            removeFromInstance = highlightOriginal.removeFromInstance,
            highlighted, name, tplAttr, timer;

        if (changes.hasOwnProperty('highlighted')) {
            highlighted = changes.highlighted;
            // Hide `highlighted` and `highlightStyle` from underlying modifiers.
            delete changes.highlighted;

            if (this._previous) {
                changes = this._previous.pushDown(highlightOriginal, changes);
            }
            changes = this.filterChanges(attr, changes);

            if (highlighted !== attr.highlighted) {
                if (highlighted) {
                    // Switching ON.
                    // At this time, original should be empty.
                    for (name in highlightStyle) {
                        // Remember the values of attributes to revert back to them on unhighlight.
                        if (name in changes) {
                            // Remember value set by lower level modifiers.
                            highlightOriginal[name] = changes[name];
                        } else {
                            // Remember the original value.

                            // If this is a sprite instance and it doesn't have its own
                            // 'name' attribute, (i.e. inherits template's attribute value)
                            // than we have to get the value for the 'name' attribute from
                            // the template's 'animationOriginal' object instead of its
                            // 'attr' object (which is the prototype of the instance),
                            // because the 'name' attribute of the template may be animating.
                            // Check out the prepareAttributes method of the Animation
                            // modifier for more details on the 'animationOriginal' object.

                            tplAttr = attr.template && attr.template.ownAttr;
                            if (tplAttr && !attr.prototype.hasOwnProperty(name)) {
                                removeFromInstance[name] = true;
                                highlightOriginal[name] = tplAttr.animationOriginal[name];
                            } else {

                                // Even if a sprite instance has its own property, it may
                                // still have to be removed from the instance after
                                // unhighlighting is done.
                                // Consider a situation where an instance doesn't originally
                                // have its own attribute (that is used for highlighting and
                                // unhighlighting). It will however have that attribute as
                                // its own when the highlight/unhighlight animation is in
                                // progress, until the attribute is removed from the instance
                                // when the unhighlighting is done.
                                // So in a scenario where the instance is highlighted, then
                                // unhighlighted (i.e. starts animating back to its original
                                // value) and then highlighted again before the unhighlight
                                // animation is done, we should still mark the attribute
                                // for removal from the instance, if it was our original
                                // intention. To tell if it was, we can check the timer
                                // for the attribute and see if the 'remove' flag is set.

                                timer = highlightOriginal.timers[name];
                                if (timer && timer.remove) {
                                    removeFromInstance[name] = true;
                                }
                                highlightOriginal[name] = attr[name];
                            }
                        }
                        if (highlightOriginal[name] !== highlightStyle[name]) {
                            changes[name] = highlightStyle[name];
                        }
                    }
                } else {
                    // Switching OFF.
                    for (name in highlightStyle) {
                        if (!(name in changes)) {
                            changes[name] = highlightOriginal[name];
                        }
                        delete highlightOriginal[name];
                    }
                    changes.removeFromInstance = changes.removeFromInstance || {};
                    // Let the higher lever animation modifier know which attributes
                    // should be removed from instance when the animation is done.
                    Ext.apply(changes.removeFromInstance, removeFromInstance);
                    highlightOriginal.removeFromInstance = {};
                }
                changes.highlighted = highlighted;
            }
        } else {
            if (this._previous) {
                changes = this._previous.pushDown(highlightOriginal, changes);
            }
            changes = this.filterChanges(attr, changes);
        }

        return changes;
    },

    /**
     * @inheritdoc
     */
    popUp: function (attr, changes) {
        changes = this.filterChanges(attr, changes);
        Ext.draw.modifier.Modifier.prototype.popUp.call(this, attr, changes);
    }
});
