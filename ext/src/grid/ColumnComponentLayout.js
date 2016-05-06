/**
 * Component layout for grid column headers which have a title element at the top followed by content.
 * @private
 */
Ext.define('Ext.grid.ColumnComponentLayout', {
    extend: 'Ext.layout.component.Auto',
    alias: 'layout.columncomponent',

    type: 'columncomponent',

    setWidthInDom: true,

    _paddingReset: {
        paddingTop: '',  // reset back to default padding of the style
        paddingBottom: ''
    },

    columnAutoCls: Ext.baseCSSPrefix + 'column-header-text-container-auto',

    beginLayout: function(ownerContext) {
        this.callParent(arguments);
        ownerContext.titleContext = ownerContext.getEl('titleEl');
    },

    beginLayoutCycle: function(ownerContext) {
        var me = this,
            owner = me.owner,
            shrinkWrap = ownerContext.widthModel.shrinkWrap;

        me.callParent(arguments);

        // If shrinkwrapping, allow content width to stretch the element
        if (shrinkWrap) {
            owner.el.setWidth('');
        }
        owner.textContainerEl[shrinkWrap ? 'addCls' : 'removeCls'](me.columnAutoCls);
        owner.titleEl.setStyle(me._paddingReset);
    },

    // If not shrink wrapping, push height info down into child items
    publishInnerHeight: function(ownerContext, outerHeight) {
        var me = this,
            owner = me.owner,
            innerHeight;
            
        // TreePanels (and grids with hideHeaders: true) set their column container height to zero to hide them.
        // This is because they need to lay out in order to calculate widths for the columns (eg flexes).
        // If there is no height to lay out, bail out early.
        if (owner.getRootHeaderCt().hiddenHeaders) {
            ownerContext.setProp('innerHeight', 0);
            return;
        }
        

        // If this ia a group header; that is, it contains subheaders...
        // hasRawContent = !(target.isContainer && target.items.items.length > 0)
        if (!ownerContext.hasRawContent) {
            // We do not have enough information to get the height of the titleEl
            if (owner.headerWrap && !ownerContext.hasDomProp('width')) {
                me.done = false;
                return;
            }

            innerHeight = outerHeight - ownerContext.getBorderInfo().height;
            ownerContext.setProp('innerHeight', innerHeight - owner.titleEl.getHeight(), false);
        }
    },

    // We do not need the Direct2D sub pixel measurement here. Just the offsetHeight will do.
    // TODO: When https://sencha.jira.com/browse/EXTJSIV-7734 is fixed to not do subpixel adjustment on height,
    // remove this override.
    measureContentHeight: function(ownerContext) {
        return ownerContext.el.dom.offsetHeight;
    },

    // If not shrink wrapping, push width info down into child items
    publishInnerWidth: function(ownerContext, outerWidth) {
        // If we are acting as a container, publish the innerWidth for the ColumnLayout to use
        if (!ownerContext.hasRawContent) {
            ownerContext.setProp('innerWidth', outerWidth - ownerContext.getBorderInfo().width, false);
        }
    },

    // Push content height outwards when we are shrinkwrapping
    calculateOwnerHeightFromContentHeight: function (ownerContext, contentHeight) {
        var result = this.callParent(arguments),
            owner = this.owner;

        // If we are NOT a group header, we just use the auto component's measurement
        if (!ownerContext.hasRawContent) {
            if (!owner.headerWrap || ownerContext.hasDomProp('width')) {
                return contentHeight + owner.titleEl.getHeight() + ownerContext.getBorderInfo().height;
            }

            // We do not have the information to return the height yet because we cannot know
            // the final height of the text el
            return null;
        }
        return result;
    },

    // Push content width outwards when we are shrinkwrapping
    calculateOwnerWidthFromContentWidth: function (ownerContext, contentWidth) {
        var owner = this.owner,
            padWidth = ownerContext.getPaddingInfo().width,
            triggerOffset = this.getTriggerOffset(owner, ownerContext),
            inner;
            
        // Only measure the content if we're not grouped, otherwise
        // the size should be governed by the children
        if (owner.isGroupHeader) {
            inner = contentWidth;
        } else {
            inner = Math.max(contentWidth, owner.textEl.getWidth() + ownerContext.titleContext.getPaddingInfo().width);
        }
        return inner + padWidth + triggerOffset;
    },
    
    getTriggerOffset: function(owner, ownerContext) {
        var width = 0;
        
        if (ownerContext.widthModel.shrinkWrap && !owner.menuDisabled) {
            // If we have any children underneath, then we already have space reserved
            if (owner.query('>:not([hidden])').length === 0) {
                width = owner.getTriggerElWidth();
            }
        }
        return width;
    }
});
