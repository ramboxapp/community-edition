/**
 * @abstract
 * @extends Ext.chart.series.Cartesian
 * Abstract class for all the stacked cartesian series including area series
 * and bar series.
 */
Ext.define('Ext.chart.series.StackedCartesian', {

    extend: 'Ext.chart.series.Cartesian',

    config: {
        /**
         * @cfg {Boolean} [stacked=true]
         * `true` to display the series in its stacked configuration.
         */
        stacked: true,

        /**
         * @cfg {Boolean} [splitStacks=true]
         * `true` to stack negative/positive values in respective y-axis directions.
         */
        splitStacks: true,

        /**
         * @cfg {Boolean} [fullStack=false]
         * If `true`, the height of a stacked bar is always the full height of the chart,
         * with individual components viewed as shares of the whole determined by the
         * {@link #fullStackTotal} config.
         */
        fullStack: false,

        /**
         * @cfg {Boolean} [fullStackTotal=100]
         * If the {@link #fullStack} config is set to `true`, this will determine
         * the absolute total value of each stack.
         */
        fullStackTotal: 100,

        /**
         * @cfg {Array} hidden
         */
        hidden: []
    },

    animatingSprites: 0,

    themeColorCount: function() {
        var me = this,
            yField = me.getYField();
        return Ext.isArray(yField) ? yField.length : 1;
    },

    updateStacked: function () {
        this.processData();
    },

    updateSplitStacks: function () {
        this.processData();
    },

    coordinateY: function () {
        return this.coordinateStacked('Y', 1, 2);
    },

    coordinateStacked: function (direction, directionOffset, directionCount) {
        var me = this,
            store = me.getStore(),
            items = store.getData().items,
            itemCount = items.length,
            axis = me['get' + direction + 'Axis'](),
            hidden = me.getHidden(),
            splitStacks = me.getSplitStacks(),
            fullStack = me.getFullStack(),
            fullStackTotal = me.getFullStackTotal(),
            range = {min: 0, max: 0},
            directions = me['fieldCategory' + direction],
            dataStart = [], posDataStart = [], negDataStart = [], dataEnd,
            stacked = me.getStacked(),
            sprites = me.getSprites(),
            coordinatedData = [],
            i, j, k, fields, fieldCount,
            posTotals, negTotals,
            fieldCategoriesItem,
            data, attr;

        if (!sprites.length) {
            return;
        }

        for (i = 0; i < directions.length; i++) {
            fieldCategoriesItem = directions[i];
            fields = me.getFields([fieldCategoriesItem]);
            fieldCount = fields.length;
            for (j = 0; j < itemCount; j++) {
                dataStart[j] = 0;
                posDataStart[j] = 0;
                negDataStart[j] = 0;
            }
            for (j = 0; j < fieldCount; j++) {
                if (!hidden[j]) {
                    coordinatedData[j] = me.coordinateData(items, fields[j], axis);
                }
            }
            if (stacked && fullStack) {
                posTotals = [];
                if (splitStacks) {
                    negTotals = [];
                }
                for (j = 0; j < itemCount; j++) {
                    posTotals[j] = 0;
                    if (splitStacks) {
                        negTotals[j] = 0;
                    }
                    for (k = 0; k < fieldCount; k++) {
                        data = coordinatedData[k];
                        if (!data) {
                            // If the field is hidden there's no coordinated data for it.
                            continue;
                        }
                        data = data[j];

                        if (data >= 0 || !splitStacks) {
                            posTotals[j] += data;
                        } else if (data < 0) {
                            negTotals[j] += data;
                        } // else not a valid number
                    }
                }
            }
            for (j = 0; j < fieldCount; j++) {
                attr = {};
                if (hidden[j]) {
                    attr['dataStart' + fieldCategoriesItem] = dataStart;
                    attr['data' + fieldCategoriesItem] = dataStart;
                    sprites[j].setAttributes(attr);
                    continue;
                }
                data = coordinatedData[j];
                if (stacked) {
                    dataEnd = [];
                    for (k = 0; k < itemCount; k++) {
                        if (!data[k]) {
                            data[k] = 0;
                        }
                        if (data[k] >= 0 || !splitStacks) {
                            if (fullStack && posTotals[k]) {
                                data[k] *= fullStackTotal / posTotals[k];
                            }
                            dataStart[k] = posDataStart[k];
                            posDataStart[k] += data[k];
                            dataEnd[k] = posDataStart[k];
                        } else {
                            if (fullStack && negTotals[k]) {
                                data[k] *= fullStackTotal / negTotals[k];
                            }
                            dataStart[k] = negDataStart[k];
                            negDataStart[k] += data[k];
                            dataEnd[k] = negDataStart[k];
                        }
                    }
                    attr['dataStart' + fieldCategoriesItem] = dataStart;
                    attr['data' + fieldCategoriesItem] = dataEnd;
                    me.getRangeOfData(dataStart, range);
                    me.getRangeOfData(dataEnd, range);
                } else {
                    attr['dataStart' + fieldCategoriesItem] = dataStart;
                    attr['data' + fieldCategoriesItem] = data;
                    me.getRangeOfData(data, range);
                }
                sprites[j].setAttributes(attr);
            }
        }
        me.dataRange[directionOffset] = range.min;
        me.dataRange[directionOffset + directionCount] = range.max;
        attr = {};
        attr['dataMin' + direction] = range.min;
        attr['dataMax' + direction] = range.max;
        for (i = 0; i < sprites.length; i++) {
            sprites[i].setAttributes(attr);
        }
    },

    getFields: function (fieldCategory) {
        var me = this,
            fields = [], fieldsItem,
            i, ln;
        for (i = 0, ln = fieldCategory.length; i < ln; i++) {
            fieldsItem = me['get' + fieldCategory[i] + 'Field']();
            if (Ext.isArray(fieldsItem)) {
                fields.push.apply(fields, fieldsItem);
            } else {
                fields.push(fieldsItem);
            }
        }
        return fields;
    },

    updateLabelOverflowPadding: function (labelOverflowPadding) {
        this.getLabel().setAttributes({labelOverflowPadding: labelOverflowPadding});
    },

    getSprites: function () {
        var me = this,
            chart = me.getChart(),
            animation = me.getAnimation() || chart && chart.getAnimation(),
            fields = me.getFields(me.fieldCategoryY),
            itemInstancing = me.getItemInstancing(),
            sprites = me.sprites, sprite,
            hidden = me.getHidden(),
            spritesCreated = false,
            i, length = fields.length;

        if (!chart) {
            return [];
        }

        for (i = 0; i < length; i++) {
            sprite = sprites[i];
            if (!sprite) {
                sprite = me.createSprite();
                // Each subsequent sprite has a lower zIndex so that
                // the stroke of previous sprite in the stack is not
                // covered by the next sprite (which is an issue
                // with wide strokes).
                sprite.setAttributes({zIndex: -i});

                sprite.setField(fields[i]);
                spritesCreated = true;
                hidden.push(false);
                if (itemInstancing) {
                    sprite.itemsMarker.getTemplate().setAttributes(me.getStyleByIndex(i));
                } else {
                    sprite.setAttributes(me.getStyleByIndex(i));
                }
            }
            if (animation) {
                if (itemInstancing) {
                    sprite.itemsMarker.getTemplate().fx.setConfig(animation);
                }
                sprite.fx.setConfig(animation);
            }
        }

        if (spritesCreated) {
            me.updateHidden(hidden);
        }
        return sprites;
    },

    getItemForPoint: function (x, y) {
        if (this.getSprites()) {
            var me = this,
                i, ln, sprite,
                itemInstancing = me.getItemInstancing(),
                sprites = me.getSprites(),
                store = me.getStore(),
                hidden = me.getHidden(),
                item, index, yField;

            for (i = 0, ln = sprites.length; i < ln; i++) {
                if (!hidden[i]) {
                    sprite = sprites[i];
                    index = sprite.getIndexNearPoint(x, y);
                    if (index !== -1) {
                        yField = me.getYField();
                        item = {
                            series: me,
                            index: index,
                            category: itemInstancing ? 'items' : 'markers',
                            record: store.getData().items[index],
                            // Handle the case where we're stacked but a single segment
                            field: typeof yField === 'string' ? yField : yField[i],
                            sprite: sprite
                        };
                        return item;
                    }
                }
            }
            return null;
        }
    },

    provideLegendInfo: function (target) {
        var me = this,
            sprites = me.getSprites(),
            title = me.getTitle(),
            field = me.getYField(),
            hidden = me.getHidden(),
            single = sprites.length === 1,
            style, fill,
            i, name;

        for (i = 0; i < sprites.length; i++) {
            style = me.getStyleByIndex(i);
            fill = style.fillStyle;
            if (title) {
                if (Ext.isArray(title)) {
                    name = title[i];
                } else if (single) {
                    name = title;
                }
            } else if (Ext.isArray(field)) {
                name = field[i];
            } else {
                name = me.getId();
            }
            target.push({
                name: name,
                mark: (Ext.isObject(fill) ? fill.stops && fill.stops[0].color : fill) || style.strokeStyle || 'black',
                disabled: hidden[i],
                series: me.getId(),
                index: i
            });
        }
    },

    onSpriteAnimationStart: function (sprite) {
        this.animatingSprites++;
        if (this.animatingSprites === 1) {
            this.fireEvent('animationstart');
        }
    },

    onSpriteAnimationEnd: function (sprite) {
        this.animatingSprites--;
        if (this.animatingSprites === 0) {
            this.fireEvent('animationend');
        }
    }
});
