/**
 * This layout manager is used to center contents within a container. As a subclass of
 * {@link Ext.layout.container.Fit fit layout}, CenterLayout expects to have one child
 * item; multiple items will be placed overlapping. The layout does not require any config
 * options. Items in the container can use percentage width or height rather than be fit
 * to the full size of the container.
 *
 * Example usage:
 *
 *      // The content panel is centered in the container
 *
 *      var p = Ext.create('Ext.Panel', {
 *          title: 'Center Layout',
 *          layout: 'center',
 *          items: [{
 *              title: 'Centered Content',
 *              width: '75%',  // assign 75% of the container width to the item
 *              html: 'Some content'
 *          }]
 *      });
 *
 * If you leave the title blank and specify no border you can create a non-visual, structural
 * container just for centering the contents.
 *
 *      var p = Ext.create('Ext.Container', {
 *          layout: 'center',
 *          items: [{
 *              title: 'Centered Content',
 *              width: 300,
 *              height: '90%', // assign 90% of the container height to the item
 *              html: 'Some content'
 *          }]
 *      });
 */
Ext.define('Ext.layout.container.Center', {
    extend: 'Ext.layout.container.Fit',
    alias: [ 
        'layout.center',
        'layout.ux.center'
    ],

    alternateClassName: 'Ext.ux.layout.Center',
    type: 'center',
    
    percentRe: /^\d+(?:\.\d+)?\%$/,

    itemCls: Ext.baseCSSPrefix + 'center-layout-item',

    childEls: [
        'targetEl'
    ],

    renderTpl: [
        '<div id="{ownerId}-targetEl" data-ref="targetEl" class="{targetElCls}" role="presentation">' +
            '{%this.renderBody(out, values)%}' +
        '</div>'
    ],

    targetElCls: Ext.baseCSSPrefix + 'center-target',

    beginLayout: function(ownerContext) {
        var me = this,
            percentRe = me.percentRe,
            childItems, len, i, itemContext, item,
            widthModel, heightModel;

        me.callParent([ownerContext]);
        
        childItems = ownerContext.childItems;
        for (i = 0, len = childItems.length; i < len; ++i) {
            itemContext = childItems[i];
            item = itemContext.target;
            widthModel = itemContext.widthModel;
            heightModel = itemContext.heightModel;
            if (percentRe.test(item.width)) {
                item.getEl().setStyle('width', '');
            }
            if (percentRe.test(item.height)) {
                item.getEl().setStyle('height', '');
            }
        }

        ownerContext.targetElContext = ownerContext.getEl('targetEl', me);
    },

    beginLayoutCycle: function(ownerContext, firstCycle) {
        var targetEl = this.targetEl;
        this.callParent([ownerContext, firstCycle]);
        targetEl.setStyle('width', '');
        targetEl.setStyle('height', '');
    },

    getRenderData: function() {
        var data = this.callParent();

        data.targetElCls = this.targetElCls;

        return data;
    },

    getRenderTarget: function() {
        return this.targetEl;
    },

    getItemSizePolicy: function (item, ownerSizeModel) {
        var me = this,
            sizeModel = ownerSizeModel || me.owner.getSizeModel(),
            percentRe = me.percentRe,
            mode = ((sizeModel.width.shrinkWrap || !percentRe.test(item.width)) ? 0 : 1) | // jshint ignore:line
                  ((sizeModel.height.shrinkWrap || !percentRe.test(item.height)) ? 0 : 2);

        return me.sizePolicies[mode];
    },

    isItemBoxParent: function (itemContext) {
        return true;
    },

    isItemShrinkWrap: function(item) {
        return true;
    },

    calculate: function(ownerContext) {
        var targetElContext = ownerContext.targetElContext,
            info;

        this.callParent([ownerContext]);
        info = ownerContext.state.info;
        if (ownerContext.widthModel.shrinkWrap) {
            targetElContext.setWidth(info.contentWidth);
        }

        if (ownerContext.heightModel.shrinkWrap) {
            targetElContext.setHeight(info.contentHeight);
        }
    },

    getPos: function (itemContext, info, dimension) {
        var modelName = dimension + 'Model',
            size = itemContext.props[dimension],
            pos = 0;

        if (!itemContext[modelName].calculated) {
             size += info.margins[dimension];
        }

        if (!info.ownerContext[modelName].shrinkWrap) {
            pos = Math.round((info.targetSize[dimension] - size) / 2);
            if (isNaN(pos)) {
                this.done = false;
            }
        }
        return Math.max(pos, 0);
    },

    positionItemX: function (itemContext, info) {
        var left = this.getPos(itemContext, info, 'width');
        itemContext.setProp('x', left);
    },

    positionItemY: function (itemContext, info) {
        var top = this.getPos(itemContext, info, 'height');
        itemContext.setProp('y', top);
    },

    setItemHeight: function (itemContext, info) {
        var ratio = parseFloat(itemContext.target.height) / 100;
        itemContext.setHeight(Math.round((info.targetSize.height - info.margins.height) * ratio));
    },

    setItemWidth: function (itemContext, info) {
        var ratio = parseFloat(itemContext.target.width) / 100;
        itemContext.setWidth(Math.round((info.targetSize.width - info.margins.width) * ratio));
    }
});
