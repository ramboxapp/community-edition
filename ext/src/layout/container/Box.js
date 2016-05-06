/**
 * Base Class for HBoxLayout and VBoxLayout Classes. Generally it should not need to be used directly.
 */
Ext.define('Ext.layout.container.Box', {
    extend: 'Ext.layout.container.Container',

    alias: 'layout.box',

    alternateClassName: 'Ext.layout.BoxLayout',

    requires: [
        'Ext.layout.container.boxOverflow.None',
        'Ext.layout.container.boxOverflow.Scroller',
        'Ext.util.Format',
        'Ext.dd.DragDropManager',
        'Ext.resizer.Splitter'
    ],

    type: 'box',

    config: {
        /**
         * @cfg {String} [align="begin"]
         * Controls how the child items of the container are aligned. The value is used to
         * position items "perpendicularly". That is, for horizontal boxes (where `vertical`
         * is `false`), then this will position items vertically. Otherwise, this will position
         * items horizontally. The acceptable values for this property are best explained in
         * context with the value of `vertical`.
         *
         * If `vertical` is `false` then this layout is behaving as an `hbox` and this config
         * operates as follows:
         *
         * - **begin** : Child items are aligned vertically at the top of the container.
         * - **middle** : Child items are vertically centered in the container.
         * - **end** : Child items are aligned vertically at the bottom of the container.
         * - **stretch** : Child items are stretched vertically to fill the height of the container.
         * - **stretchmax** : Child items are stretched vertically to the height of the largest item.
         *
         * If `vertical` is `true` then this layout is behaving as an `vbox` and this config
         * operates as follows:
         *
         * - **begin** : Child items are aligned horizontally at the left side of the container.
         * - **middle** : Child items are horizontally centered in the container.
         * - **end** : Child items are aligned horizontally at the right of the container.
         * - **stretch** : Child items are stretched horizontally to fill the width of the container.
         * - **stretchmax** : Child items are stretched horizontally to the size of the largest item.
         *
         * For backwards compatibility, the following values are also recognized:
         *
         * - **left** : Same as **begin**.
         * - **top** : Same as **begin**.
         * - **center** : Same as **middle**.
         * - **right** : Same as **end**.
         * - **bottom** : Same as **end**.
         */
        align: 'begin', // end, middle, stretch, strechmax

        /**
         * @cfg {Boolean} constrainAlign
         * Limits the size of {@link #align aligned} components to the size of the container
         * under certain circumstances. Firstly, the container's height (for `hbox`) or width
         * (for `vbox`) must not be determined by the size of the child components. Secondly,
         * the child components must have {@link Ext.AbstractComponent#shrinkWrap shrinkwrap}
         * enabled for this dimension.
         */
        constrainAlign: false,

        /**
         * @cfg {Boolean} [enableSplitters=true]
         * This flag can be set to `false` to ignore the `split` config on box items. This is
         * set to `false` by `Ext.layout.container.Accordion`.
         */
        enableSplitters: true,

        // @cmd-auto-dependency { aliasPrefix: 'box.overflow.' }
        /**
         * @cfg {String/Ext.layout.container.boxOverflow.None}
         * An overflow handler or config object for an overflow handler.  This is typically
         * specified as one of the following strings:
         *
         * - `scroller` - Scroller buttons are rendered before and after the content.
         * - `menu` - Overflowing items are rendered into a menu, and a button is rendered
         *    after the items, which shows the menu when clicked.
         *
         * NOTE: This config is currently only supported when box layout is used by the
         * following components:
         *
         * - {@link Ext.toolbar.Toolbar}
         * - {@link Ext.menu.Menu}
         * - {@link Ext.toolbar.Breadcrumb}
         * - {@link Ext.tab.Bar}
         *
         * Components where `overflowHandler` is not supported should use
         * `{@link Ext.Component#scrollable scrollable}:true` if they have overflowing
         * content.
         */
        overflowHandler: {
            $value: null,
            merge: function(newValue, oldValue) {
                if (typeof newValue === 'string') {
                    newValue = {
                        type: newValue
                    };
                }

                return Ext.merge(oldValue ? Ext.Object.chain(oldValue) : {}, newValue);
            }
        },

        /**
         * @cfg {String} padding
         * Sets the padding to be applied to all child items managed by this layout.
         *
         * This property must be specified as a string containing space-separated, numeric
         * padding values. The order of the sides associated with each value matches the
         * way CSS processes padding values:
         *
         *   - If there is only one value, it applies to all sides.
         *   - If there are two values, the top and bottom borders are set to the first
         *     value and the right and left are set to the second.
         *   - If there are three values, the top is set to the first value, the left and
         *     right are set to the second, and the bottom is set to the third.
         *   - If there are four values, they apply to the top, right, bottom, and left,
         *     respectively.
         */
        padding: 0,

        /**
         * @cfg {String} pack
         * Controls how the child items of the container are packed together. Acceptable
         * configuration values for this property are:
         *
         *   - **start** - child items are packed together at **left** (HBox) or **top**
         *     (VBox) side of container (*default**)
         *   - **center** - child items are packed together at **mid-width** (HBox) or
         *     **mid-height** (VBox) of container
         *   - **end** - child items are packed together at **right** (HBox) or **bottom**
         *     (VBox) side of container
         */
        pack: 'start',

        /**
         * @cfg {String/Ext.Component} stretchMaxPartner
         * Allows stretchMax calculation to take into account the max perpendicular size
         * (height for HBox layout and width for VBox layout) of another Box layout when
         * calculating its maximum perpendicular child size.
         *
         * If specified as a string, this may be either a known Container ID, or a
         * ComponentQuery selector which is rooted at this layout's Container (ie, to find
         * a sibling, use `"^>#siblingItemId`).
         */
        stretchMaxPartner: undefined,

        /**
         * @cfg {Boolean} [vertical=false]
         * Set to `true` to switch the layout to `vbox`.
         */
        vertical: false,

        /**
         * @cfg {"round"/"floor"/"ceil"} [alignRoundingMethod='round'] The Math method 
         * to use for rounding fractional pixels when `{@link #align}:middle` is used.  
         * The possible values are:
         * 
         *  - [round](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
         *  - [floor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor)
         *  - [ceil](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil)
         */
        alignRoundingMethod: 'round'
    },

    /**
     * @cfg {Number} flex
     * This configuration option is to be applied to **child items** of the container
     * managed by this layout. Each child item with a flex property will be flexed
     * (horizontally in `hbox`, vertically in `vbox`) according to each item's
     * **relative** flex value compared to the sum of all items with a flex value
     * specified. Any child items that have either a `flex = 0` or `flex = undefined`
     * will not be 'flexed' (the initial size will not be changed).
     */

    itemCls: Ext.baseCSSPrefix + 'box-item',
    targetCls: Ext.baseCSSPrefix + 'box-layout-ct',
    targetElCls: Ext.baseCSSPrefix + 'box-target',
    innerCls: Ext.baseCSSPrefix + 'box-inner',

    manageMargins: true,
    
    createsInnerCt: true,

    childEls: [
        'innerCt',
        'targetEl'
    ],

    renderTpl: [
        '{%var oc,l=values.$comp.layout,oh=l.overflowHandler;' +
        'if (oh && oh.getPrefixConfig!==Ext.emptyFn) {' +
            'if(oc=oh.getPrefixConfig())dh.generateMarkup(oc, out)' +
        '}%}' +
        '<div id="{ownerId}-innerCt" data-ref="innerCt" role="presentation" class="{[l.innerCls]}' +
            '{[oh ? (" " + oh.getOverflowCls(l.direction)) : ""]}">' +
            '<div id="{ownerId}-targetEl" data-ref="targetEl" class="{targetElCls}" role="presentation">' +
                '{%this.renderBody(out, values)%}' +
            '</div>' +
        '</div>' +
        '{%if (oh && oh.getSuffixConfig!==Ext.emptyFn) {' +
            'if(oc=oh.getSuffixConfig())dh.generateMarkup(oc, out)' +
        '}%}',
        {
            disableFormats: true,
            definitions: 'var dh=Ext.DomHelper;'
        }
    ],

    constructor: function(config) {
        var me = this,
            type;

        me.callParent(arguments);

        me.setVertical(me.vertical);

        // The sort function needs access to properties in this, so must be bound.
        me.flexSortFn = me.flexSort.bind(me);

        type = typeof me.padding;
        if (type === 'string' || type === 'number') {
            me.padding = Ext.util.Format.parseBox(me.padding);
            me.padding.height = me.padding.top  + me.padding.bottom;
            me.padding.width  = me.padding.left + me.padding.right;
        }
    },

    _beginRe: /^(?:begin|left|top)$/,
    _centerRe: /^(?:center|middle)$/,
    _endRe: /^(?:end|right|bottom)$/,

    // Matches: `<spaces>digits[.digits]<spaces>%<spaces>`
    // Captures: `digits[.digits]`
    _percentageRe: /^\s*(\d+(?:\.\d*)?)\s*[%]\s*$/,

    getItemSizePolicy: function (item, ownerSizeModel) {
        var me = this,
            policy = me.sizePolicy,
            align = me.align,
            flex = item.flex,
            key = align,
            names = me.names,
            heightName = names.height,
            widthName = names.width,
            width = item[widthName],
            height = item[heightName],
            percentageRe = me._percentageRe,
            percentageWidth = percentageRe.test(width),
            isStretch = (align === 'stretch'),
            isStretchMax = (align === 'stretchmax'),
            constrain = me.constrainAlign;
            
        // Getting the size model is expensive, so we only want to do so if we really need it
        if (!ownerSizeModel && (isStretch || flex || percentageWidth || (constrain && !isStretchMax))) {
            ownerSizeModel = me.owner.getSizeModel();
        }

        if (isStretch) {
            // If we are height.shrinkWrap, we behave as if we were stretchmax (for more
            // details, see beginLayoutCycle)...
            if (!percentageRe.test(height) && ownerSizeModel[heightName].shrinkWrap) {
                key = 'stretchmax';
                // We leave %age height as stretch since it will not participate in the
                // stretchmax size calculation. This avoid running such a child in its
                // shrinkWrap mode prior to supplying the calculated size.
            }
        } else if (!isStretchMax) {
            if (percentageRe.test(height)) {
                // Height %ages are calculated based on container size, so they are the
                // same as align=stretch for this purpose...
                key = 'stretch';
            } else if (constrain && !ownerSizeModel[heightName].shrinkWrap) {
                // Same functionality as stretchmax, only the max is going to be the size
                // of the container, not the largest item
                key = 'stretchmax';
            } else {
                key = '';
            }
        }

        if (flex || percentageWidth) {
            // If we are width.shrinkWrap, we won't be flexing since that requires a
            // container width...
            if (!ownerSizeModel[widthName].shrinkWrap) {
                policy = policy.flex; // both flex and %age width are calculated
            }
        }

        return policy[key];
    },

    flexSort: function (a, b) {
        // We need to sort the flexed items to ensure that we have
        // the items with max/min width first since when we set the
        // values we may have the value constrained, so we need to
        // react accordingly. Precedence is given from the largest
        // value through to the smallest value
        var maxWidthName = this.names.maxWidth,
            minWidthName = this.names.minWidth,
            infiniteValue = Infinity,
            aTarget = a.target,
            bTarget = b.target,
            aFlex = aTarget.flex,
            bFlex = bTarget.flex,
            result = 0,
            aMin, bMin, aMax, bMax,
            hasMin, hasMax;

        aMax = aTarget[maxWidthName] || infiniteValue;
        bMax = bTarget[maxWidthName] || infiniteValue;
        aMin = aTarget[minWidthName] || 0;
        bMin = bTarget[minWidthName] || 0;
        
        hasMin = isFinite(aMin) || isFinite(bMin);
        hasMax = isFinite(aMax) || isFinite(bMax);

        if (hasMin || hasMax) {
            if (hasMax) {
                result = aMax - bMax;
            }
            
            // If the result is 0, it means either
            // a) hasMax was false
            // b) The max values were the same
            if (result === 0 && hasMin) {
                result = bMin - aMin;
            }

            // If 0, it means either the max and/or minimum was the same
            if (result === 0) {
                if (hasMax) {
                    result = bFlex - aFlex;
                } else {
                    result = aFlex - bFlex;
                }
            }
        }
        return result;
    },

    isItemBoxParent: function (itemContext) {
        return true;
    },

    isItemShrinkWrap: function (item) {
        return true;
    },

    roundFlex: function(width) {
        return Math.floor(width);
    },

    /**
     * @private
     * Called by an owning Panel before the Panel begins its collapse process.
     * Most layouts will not need to override the default Ext.emptyFn implementation.
     */
    beginCollapse: function(child) {
        var me = this;

        if (me.direction === 'vertical' && child.collapsedVertical()) {
            child.collapseMemento.capture(['flex']);
            delete child.flex;
        } else if (me.direction === 'horizontal' && child.collapsedHorizontal()) {
            child.collapseMemento.capture(['flex']);
            delete child.flex;
        }
    },

    /**
     * @private
     * Called by an owning Panel before the Panel begins its expand process.
     * Most layouts will not need to override the default Ext.emptyFn implementation.
     */
    beginExpand: function(child) {

        // Restores the flex if we used to be flexed before
        child.collapseMemento.restore(['flex']);
    },

    beginLayout: function (ownerContext) {
        var me = this,
            owner = me.owner,
            smp = owner.stretchMaxPartner,
            style = me.innerCt.dom.style,
            names = me.names,
            overflowHandler = me.overflowHandler,
            scrollable = owner.getScrollable(),
            scrollPos;

        ownerContext.boxNames = names;

        // this must happen before callParent to allow the overflow handler to do its work
        // that can effect the childItems collection...
        if (overflowHandler) {
            overflowHandler.beginLayout(ownerContext);
        }

        // get the contextItem for our stretchMax buddy:
        if (typeof smp === 'string') {
            smp = Ext.getCmp(smp) || owner.query(smp)[0];
        }

        ownerContext.stretchMaxPartner = smp && ownerContext.context.getCmp(smp);

        me.callParent(arguments);

        ownerContext.innerCtContext = ownerContext.getEl('innerCt', me);
        ownerContext.targetElContext = ownerContext.getEl('targetEl', me);

        ownerContext.ownerScrollable = scrollable = owner.getScrollable();
        if (scrollable) {
            // If we have a scrollable, save the positions regardless of whether we can scroll in that direction
            // since the scrollable may be configured with x: false, y: false, which means it can only be
            // controlled programmatically
            ownerContext.scrollRestore = scrollable.getPosition();
        }

        // Don't allow sizes burned on to the innerCt to influence measurements.
        style.width = '';
        style.height = '';
    },

    beginLayoutCycle: function (ownerContext, firstCycle) {
        var me = this,
            state = ownerContext.state,
            scrollable = ownerContext.ownerScrollable,
            align = me.align,
            names = ownerContext.boxNames,
            pack = me.pack,
            centerRe = me._centerRe,
            overflowHandler = me.overflowHandler,
            canScroll = ownerContext.state.canScroll,
            widthModel, heightModel;

        // this must happen before callParent to allow the overflow handler to do its work
        // that can effect the childItems collection...
        if (overflowHandler) {
            overflowHandler.beginLayoutCycle(ownerContext, firstCycle);
        }

        me.callParent(arguments);

        // Cache several of our string concat/compare results (since width/heightModel can
        // change if we are invalidated, we cannot do this in beginLayout)

        ownerContext.parallelSizeModel = widthModel = ownerContext[names.widthModel];
        ownerContext.perpendicularSizeModel = heightModel = ownerContext[names.heightModel];

        ownerContext.boxOptions = {
            align: align = {
                stretch:    align === 'stretch',
                stretchmax: align === 'stretchmax',
                center:     centerRe.test(align),
                bottom:     me._endRe.test(align)
            },
            pack: pack = {
                center: centerRe.test(pack),
                end:    pack === 'end'
            }
        };

        // Scrolling can occur if:
        // a) The owner is configured to scroll in that direction
        // b) We're not shrink wrapping. If we shrink wrap, we should always size around the content
        if (scrollable) {
            if (!canScroll) {
                // Use getX/getY here to indicate whether we will show visible scrollbars in that direction, we may have
                // a scrollable and can scroll in that direction without having a visible scrollbar.
                state.canScroll = {
                    parallel: !widthModel.shrinkWrap && scrollable[names.getX](),
                    perpendicular: !heightModel.shrinkWrap && scrollable[names.getY]()
                };
            }

            if (!state.actualScroll) {
                // Store the final calculated state for this cycle in here
                state.actualScroll = {
                    parallel: false,
                    perpendicular: false
                };
            }
        }


        // Consider an hbox w/stretch which means "assign all items the container's height".
        // The spirit of this request is make all items the same height, but when shrinkWrap
        // height is also requested, the height of the tallest item determines the height.
        // This is exactly what the stretchmax option does, so we jiggle the flags here to
        // act as if stretchmax were requested.

        if (align.stretch && heightModel.shrinkWrap) {
            align.stretchmax = true;
            align.stretch = false;
        }

        // This is handy for knowing that we might need to apply height %ages
        align.nostretch = !(align.stretch || align.stretchmax);

        // In our example hbox, packing items to the right (end) or center can only work if
        // there is a container width. So, if we are shrinkWrap, we just turn off the pack
        // options for the run.

        if (widthModel.shrinkWrap) {
            pack.center = pack.end = false;
        }

        me.cacheFlexes(ownerContext);

        // We set the width of the target el equal to the width of the innerCt
        // when the layout cycle is finished, so we need to clear the width here
        // to prevent the children from being crushed.
        // IE needs it because of its scrollIntoView bug: https://sencha.jira.com/browse/EXTJSIV-6520
        // Webkit needs it because of its mouse drag bug: https://sencha.jira.com/browse/EXTJSIV-5962
        // FF needs it because of a vertical tab bug: https://sencha.jira.com/browse/EXTJSIV-8614
        me.targetEl.setWidth(20000);
    },

    /**
     * This method is called to (re)cache our understanding of flexes. This happens during beginLayoutCycle and may need to
     * be called again if the flexes are changed during the layout (e.g., like ColumnLayout).
     * @param {Object} ownerContext
     * @protected
     */
    cacheFlexes: function (ownerContext) {
        var me = this,
            names = ownerContext.boxNames,
            widthModelName = names.widthModel,
            heightModelName = names.heightModel,
            nostretch = ownerContext.boxOptions.align.nostretch,
            totalFlex = 0,
            childItems = ownerContext.childItems,
            i = childItems.length,
            flexedItems = [],
            minWidth = 0,
            smallestHeight = 0,
            smallestWidth = 0,
            minWidthName = names.minWidth,
            minHeightName = names.minHeight,
            percentageRe = me._percentageRe,
            percentageWidths = 0,
            percentageHeights = 0,
            child, childContext, flex, match, heightModel, widthModel, width, height;

        while (i--) {
            childContext = childItems[i];
            child = childContext.target;

            widthModel = childContext[widthModelName];
            // check widthModel to see if we are the sizing layout. If so, copy the flex
            // from the item to the contextItem and add it to totalFlex
            //
            if (widthModel.calculated) {
                childContext.flex = flex = child.flex;
                if (flex) {
                    totalFlex += flex;
                    flexedItems.push(childContext);
                    minWidth += child[minWidthName] || 0;
                } else { // a %age width...
                    match = percentageRe.exec(child[names.width]);
                    childContext.percentageParallel = parseFloat(match[1]) / 100;
                    ++percentageWidths;
                }
            }
            // the above means that "childContext.flex" is properly truthy/falsy, which is
            // often times quite convenient...
            
            if (widthModel.configured) {
                width = child[names.width];
            } else {
                width = child[minWidthName] || 0;
            }
            smallestWidth += width;

            heightModel = childContext[heightModelName];
            if (nostretch && heightModel.calculated) {
                // the only reason we would be calculated height in this case is due to a
                // height %age...
                match = percentageRe.exec(child[names.height]);
                childContext.percentagePerpendicular = parseFloat(match[1]) / 100;
                ++percentageHeights;
            }

            if (heightModel.configured) {
                height = child[names.height];
            } else {
                height = child[minHeightName] || 0;
            }

            if (height > smallestHeight) {
                smallestHeight = height;
            }

        }

        ownerContext.flexedItems = flexedItems;
        ownerContext.flexedMinWidth = minWidth;
        // These dimensions are the smallest possible dimensions (using known sizes) for
        // the innerCt on each axis
        ownerContext.smallestWidth = smallestWidth;
        ownerContext.smallestHeight = smallestHeight;
        ownerContext.totalFlex = totalFlex;
        ownerContext.percentageWidths = percentageWidths;
        ownerContext.percentageHeights = percentageHeights;

        // The flexed boxes need to be sorted in ascending order of maxSize to work properly
        // so that unallocated space caused by maxWidth being less than flexed width can be
        // reallocated to subsequent flexed boxes.
        Ext.Array.sort(flexedItems, me.flexSortFn);
    },

    calculate: function(ownerContext) {
        var me = this,
            names = ownerContext.boxNames,
            state = ownerContext.state,
            actualScroll = state.actualScroll,
            needsScroll = state.needsScroll,
            canScroll = state.canScroll,
            plan = state.boxPlan || (state.boxPlan = {}),
            overflowHandler = me.overflowHandler;

        plan.targetSize = me.getContainerSize(ownerContext);

        if (canScroll && !needsScroll) {
            state.needsScroll = needsScroll = {
                // Attempt to figure out early on if we need to scroll in the parallel direction. If the perpendicular is
                // done and we need to scroll, we need to invalidate because it may need recalculation.
                parallel: canScroll.parallel && plan.targetSize[names.width] < ownerContext.smallestWidth,
                perpendicular: canScroll.perpendicular && plan.targetSize[names.height] < ownerContext.smallestHeight
            };
        }

        if (!state.parallelDone) {
            state.parallelDone = me.calculateParallel(ownerContext, names, plan);
        }

        if (!state.perpendicularDone) {
            state.perpendicularDone = me.calculatePerpendicular(ownerContext, names, plan);
        }

        if (state.parallelDone && state.perpendicularDone) {
            if (canScroll && !state.scrollPass) {
                if (needsScroll.parallel !== actualScroll.parallel || needsScroll.perpendicular !== actualScroll.perpendicular) {
                    ownerContext.invalidate({
                        state: {
                            scrollPass: true,
                            canScroll: canScroll,
                            needsScroll: actualScroll
                        }
                    });
                    me.done = false;
                    return;
                }
            }

            me.publishInnerCtSize(ownerContext);

            // We always need to run calculateStretchMax, when relevant since we may 
            // have hit a constraint in an earlier calculation.
            if (me.done && ownerContext.boxOptions.align.stretchmax && !state.stretchMaxDone) {
                me.calculateStretchMax(ownerContext, names, plan);
                state.stretchMaxDone = true;
            }

            if (overflowHandler) {
                overflowHandler.calculate(ownerContext);
            }
        } else {
            me.done = false;
        }
    },

    calculateParallel: function(ownerContext, names, plan) {
        var me = this,
            widthShrinkWrap = ownerContext.parallelSizeModel.shrinkWrap,
            widthName = names.width,
            childItems = ownerContext.childItems,
            beforeXName = names.beforeX,
            afterXName = names.afterX,
            setWidthName = names.setWidth,
            childItemsLength = childItems.length,
            flexedItems = ownerContext.flexedItems,
            flexedItemsLength = flexedItems.length,
            pack = ownerContext.boxOptions.pack,
            padding = me.padding,
            targetSize = plan.targetSize,
            containerWidth = targetSize[widthName],
            state = ownerContext.state,
            needsScroll = state.needsScroll,
            canScroll = state.canScroll,
            totalMargin = 0,
            left = padding[beforeXName],
            nonFlexWidth = left + padding[afterXName],
            scrollbarSize = Ext.getScrollbarSize(),
            scrollbarWidth = scrollbarSize[names.width],
            scrollbarHeight = scrollbarSize[names.height],
            i, childMargins, remainingWidth, remainingFlex, childContext, flex, flexedWidth,
            contentWidth, childWidth, percentageSpace, availableSpace;
            
        // If we are not widthModel.shrinkWrap, we need the width before we can lay out boxes.
        // This check belongs here so it does not prevent the perpendicular from attempting to
        // calculate. It may have a dependency on the width, but it may be able to achieve
        // the correct size without the width.
        if (!widthShrinkWrap && !targetSize[names.gotWidth]) {
            return false;
        }

        // Gather the total size taken up by non-flexed items:
        for (i = 0; i < childItemsLength; ++i) {
            childContext = childItems[i];
            childMargins = childContext.marginInfo || childContext.getMarginInfo();

            totalMargin += childMargins[widthName];

            if (!childContext[names.widthModel].calculated) {
                childWidth = childContext.getProp(widthName);
                nonFlexWidth += childWidth; // min/maxWidth safe
                if (isNaN(nonFlexWidth)) {
                    return false;
                }
            }
        }

        nonFlexWidth += totalMargin;
        if (ownerContext.percentageWidths) {
            percentageSpace = containerWidth - totalMargin;
            if (isNaN(percentageSpace)) {
                return false;
            }

            for (i = 0; i < childItemsLength; ++i) {
                childContext = childItems[i];
                if (childContext.percentageParallel) {
                    childWidth = Math.ceil(percentageSpace * childContext.percentageParallel);
                    childWidth = childContext.setWidth(childWidth);
                    nonFlexWidth += childWidth;
                }
            }
        }

        // if we get here, we have all the childWidths for non-flexed items...
        if (widthShrinkWrap) {
            availableSpace = 0;
            plan.tooNarrow = false;
        } else {
            availableSpace = containerWidth - nonFlexWidth;
            if (needsScroll && needsScroll.perpendicular) {
                availableSpace -= scrollbarHeight;
            }
            plan.tooNarrow = availableSpace < ownerContext.flexedMinWidth;
            if (plan.tooNarrow && canScroll && canScroll.parallel) {
                state.actualScroll.parallel = true;
            }
        }

        contentWidth = nonFlexWidth;
        remainingWidth = availableSpace;
        remainingFlex = ownerContext.totalFlex;

        // Calculate flexed item sizes:
        for (i = 0; i < flexedItemsLength; i++) {
            childContext = flexedItems[i];
            flex         = childContext.flex;
            flexedWidth  = me.roundFlex((flex / remainingFlex) * remainingWidth);
            flexedWidth  = childContext[setWidthName](flexedWidth); // constrained

            // due to minWidth constraints, it may be that flexedWidth > remainingWidth

            contentWidth   += flexedWidth;
            // Remaining space has already had margins subtracted, so just subtract size
            remainingWidth  = Math.max(0, remainingWidth - flexedWidth); // no negatives!
            remainingFlex  -= flex;
        }

        if (pack.center) {
            left += remainingWidth / 2;

            // If content is too wide to pack to center, do not allow the centering calculation to place it off the left edge.
            if (left < 0) {
                left = 0;
            }
        } else if (pack.end) {
            left += remainingWidth;
        }

        // Assign parallel position for the boxes:
        for (i = 0; i < childItemsLength; ++i) {
            childContext = childItems[i];
            childMargins = childContext.marginInfo; // already cached by first loop

            left += childMargins[beforeXName];

            childContext.setProp(names.x, left);

            // We can read directly from "props.width" because we have already properly
            // requested it in the calculation of nonFlexedWidths or we calculated it.
            // We cannot call getProp because that would be inappropriate for flexed items
            // and we don't need any extra function call overhead:
            left += childMargins[afterXName] + childContext.props[widthName];
        }

        contentWidth += ownerContext.targetContext.getPaddingInfo()[widthName];
        ownerContext.state.contentWidth = contentWidth;

        // if there is perpendicular overflow, the published parallel content size includes
        // the size of the perpendicular scrollbar.
        if (needsScroll && needsScroll.perpendicular) {
            if (widthShrinkWrap) {
                contentWidth += scrollbarWidth;
            }
            ownerContext[names.hasOverflowY] = true;

            // tell the component layout to set the parallel size in the dom
            ownerContext.target.componentLayout[names.setWidthInDom] = true;

            // IE8 will not create a scrollbar if there is just the *exactly correct*
            // spare space created for it. We have to force that to happen once all the
            // styles have been flushed to the DOM (see completeLayout):
            ownerContext[names.invalidateScrollY] = Ext.isIE8;
        }
        ownerContext[names.setContentWidth](contentWidth);

        return true;
    },

    calculatePerpendicular: function(ownerContext, names, plan) {
        var me = this,
            state = ownerContext.state,
            needsScroll = state.needsScroll,
            canScroll = state.canScroll,
            heightShrinkWrap = ownerContext.perpendicularSizeModel.shrinkWrap,
            targetSize = plan.targetSize,
            childItems = ownerContext.childItems,
            childItemsLength = childItems.length,
            mmax = Math.max,
            heightName = names.height,
            setHeightName = names.setHeight,
            beforeYName = names.beforeY,
            topPositionName = names.y,
            padding = me.padding,
            top = padding[beforeYName],
            availHeight = targetSize[heightName] - top - padding[names.afterY],
            align = ownerContext.boxOptions.align,
            isStretch    = align.stretch, // never true if heightShrinkWrap (see beginLayoutCycle)
            isStretchMax = align.stretchmax,
            isCenter     = align.center,
            isBottom     = align.bottom,
            constrain    = me.constrainAlign,
            maxHeight = 0,
            hasPercentageSizes = 0,
            onBeforeInvalidateChild = me.onBeforeConstrainInvalidateChild,
            onAfterInvalidateChild = me.onAfterConstrainInvalidateChild,
            scrollbarHeight = Ext.getScrollbarSize().height,
            childTop, i, childHeight, childMargins, diff, height, childContext,
            stretchMaxPartner, stretchMaxChildren, shrinkWrapParallelOverflow, 
            percentagePerpendicular;

        if (!heightShrinkWrap && !targetSize[names.gotHeight]) {
            return false;
        }

        if (isStretch || ((isCenter || isBottom) && !heightShrinkWrap)) {
            if (isNaN(availHeight)) {
                return false;
            }
        }

        // If the intention is to horizontally scroll child components, but the container is too narrow,
        // then:
        //     if we are shrinkwrapping height:
        //         Set a flag because we are going to expand the height taken by the perpendicular dimension to accommodate the scrollbar
        //     else
        //         We must allow for the parallel scrollbar to intrude into the height
        if (needsScroll && needsScroll.parallel) {
            if (heightShrinkWrap) {
                shrinkWrapParallelOverflow = true;
            } else {
                availHeight -= scrollbarHeight;
                plan.targetSize[heightName] -= scrollbarHeight;
            }
        }

        if (isStretch) {
            height = availHeight; // never heightShrinkWrap...
            maxHeight = mmax(height, ownerContext.smallestHeight);
        } else {
            for (i = 0; i < childItemsLength; i++) {
                childContext = childItems[i];
                childMargins = (childContext.marginInfo || childContext.getMarginInfo())[heightName];

                if (!(percentagePerpendicular = childContext.percentagePerpendicular)) {
                    childHeight = childContext.getProp(heightName);
                } else {
                    ++hasPercentageSizes;
                    if (heightShrinkWrap) {
                        // height %age items cannot contribute to maxHeight... they are going
                        // to be a %age of that maxHeight!
                        continue;
                    } else {
                        childHeight = percentagePerpendicular * availHeight - childMargins;
                        childHeight = childContext[names.setHeight](childHeight);
                    }
                }
                
                // Summary:
                // 1) Not shrink wrapping height, so the height is not determined by the children
                // 2) Constrain is set
                // 3) The child item is shrink wrapping
                // 4) It exceeds the max
                if (!heightShrinkWrap && constrain && childContext[names.heightModel].shrinkWrap && childHeight > availHeight) {
                    childContext.invalidate({
                        before: onBeforeInvalidateChild,
                        after: onAfterInvalidateChild,
                        layout: me,
                        childHeight: availHeight,
                        names: names
                    });
                    
                    // By invalidating the height, it could mean the width can change, so we need
                    // to recalculate in the parallel direction.
                    ownerContext.state.parallelDone = false; 
                }

                // Max perpendicular measurement (used for stretchmax) must take the min perpendicular size of each child into account in case any fall short.
                if (isNaN(maxHeight = mmax(maxHeight, childHeight + childMargins,
                                           childContext.target[names.minHeight] || 0))) {
                    return false; // heightShrinkWrap || isCenter || isStretchMax ??
                }
            }
        }

        // If there is going to be a parallel scrollbar maxHeight must include it to the outside world.
        // ie: a stretchmaxPartner, and the setContentHeight
        if (shrinkWrapParallelOverflow) {
            maxHeight += scrollbarHeight;
            ownerContext[names.hasOverflowX] = true;

            // tell the component layout to set the perpendicular size in the dom
            ownerContext.target.componentLayout[names.setHeightInDom] = true;

            // IE8 will not create a scrollbar if there is just the *exactly correct*
            // spare space created for it. We have to force that to happen once all
            // the styles have been flushed to the DOM (see completeLayout):
            ownerContext[names.invalidateScrollX] = Ext.isIE8;
        }

        // If we are associated with another box layout, grab its maxChildHeight
        // This must happen before we calculate and publish our contentHeight
        stretchMaxPartner = ownerContext.stretchMaxPartner;
        if (stretchMaxPartner) {
            // Publish maxChildHeight as soon as it has been calculated for our partner:
            ownerContext.setProp('maxChildHeight', maxHeight);
            stretchMaxChildren = stretchMaxPartner.childItems;
            // Only wait for maxChildHeight if our partner has visible items:
            if (stretchMaxChildren && stretchMaxChildren.length) {
                maxHeight = mmax(maxHeight, stretchMaxPartner.getProp('maxChildHeight'));
                if (isNaN(maxHeight)) {
                    return false;
                }
            }
        }

        ownerContext[names.setContentHeight](maxHeight + me.padding[heightName] +
                ownerContext.targetContext.getPaddingInfo()[heightName]);

        // We have to publish the contentHeight with the additional scrollbarHeight
        // to encourage our container to accommodate it, but we must remove the height
        // of the scrollbar as we go to sizing or centering the children.
        if (shrinkWrapParallelOverflow) {
            maxHeight -= scrollbarHeight;
        }
        if (maxHeight > targetSize[heightName] && canScroll && canScroll.perpendicular) {
            state.actualScroll.perpendicular = true;
        }
        plan.maxSize = maxHeight;

        if (isStretchMax) {
            height = maxHeight;
        } else if (isCenter || isBottom || hasPercentageSizes) {
            if (constrain) {
                height = heightShrinkWrap ? maxHeight : availHeight;
            } else {
                height = heightShrinkWrap ? maxHeight : mmax(availHeight, maxHeight);
            }

            // When calculating a centered position within the content box of the innerCt,
            // the width of the borders must be subtracted from the size to yield the
            // space available to center within. The publishInnerCtSize method explicitly
            // adds the border widths to the set size of the innerCt.
            height -= ownerContext.innerCtContext.getBorderInfo()[heightName];
        }

        for (i = 0; i < childItemsLength; i++) {
            childContext = childItems[i];
            childMargins = childContext.marginInfo || childContext.getMarginInfo();

            childTop = top + childMargins[beforeYName];

            if (isStretch) {
                childContext[setHeightName](height - childMargins[heightName]);
            } else {
                percentagePerpendicular = childContext.percentagePerpendicular;
                if (heightShrinkWrap && percentagePerpendicular) {
                    childMargins = childContext.marginInfo || childContext.getMarginInfo();
                    childHeight = percentagePerpendicular * height - childMargins[heightName];
                    childHeight = childContext.setHeight(childHeight);
                }

                if (isCenter) {
                    diff = height - childContext.props[heightName];
                    if (diff > 0) {
                        childTop = top + Math[me.alignRoundingMethod](diff / 2);
                    }
                } else if (isBottom) {
                    childTop = mmax(0, height - childTop - childContext.props[heightName]);
                }
            }

            childContext.setProp(topPositionName, childTop);
        }

        return true;
    },
    
    onBeforeConstrainInvalidateChild: function(childContext, options){
        // NOTE: No "this" pointer in here...
        var heightModelName = options.names.heightModel;
        if (!childContext[heightModelName].constrainedMin) {
            // if the child hit a min constraint, it needs to be at its configured size, so
            // we leave the sizeModel alone
            childContext[heightModelName] = Ext.layout.SizeModel.calculated;
        }
    },
    
    onAfterConstrainInvalidateChild: function(childContext, options){
         // NOTE: No "this" pointer in here...
        var names = options.names;

        // We use 0 here because we know the size exceeds the available size.
        // This was chosen on purpose, even for align: 'bottom', because it doesn't
        // make practical sense to place the item at the bottom and then have it overflow
        // over the top of the container, since it's not possible to scroll to it. As such,
        // we always put the component at the top to follow normal document flow.
        childContext.setProp(names.beforeY, 0);
        if (childContext[names.heightModel].calculated) {
            childContext[names.setHeight](options.childHeight);
        }
    },

    calculateStretchMax: function (ownerContext, names, plan) {
        var me = this,
            heightName = names.height,
            widthName = names.width,
            childItems = ownerContext.childItems,
            length = childItems.length,
            height = plan.maxSize,
            onBeforeStretchMaxInvalidateChild = me.onBeforeStretchMaxInvalidateChild,
            onAfterStretchMaxInvalidateChild = me.onAfterStretchMaxInvalidateChild,
            childContext, props, i, childHeight;

        for (i = 0; i < length; ++i) {
            childContext = childItems[i];

            props = childContext.props;
            childHeight = height - childContext.getMarginInfo()[heightName];

            if (childHeight !== props[heightName] ||   // if (wrong height ...
                childContext[names.heightModel].constrained) { // ...or needs invalidation)
                // When we invalidate a child, since we won't be around to size or position
                // it, we include an after callback that will be run after the invalidate
                // that will (re)do that work. The good news here is that we can read the
                // results of all that from the childContext props.
                //
                // We also include a before callback to change the sizeModel to calculated
                // prior to the layout being invoked.
                childContext.invalidate({
                    before: onBeforeStretchMaxInvalidateChild,
                    after: onAfterStretchMaxInvalidateChild,
                    layout: me,
                    // passing this data avoids a 'scope' and its Function.bind
                    childWidth: props[widthName],
                    // subtract margins from the maximum value
                    childHeight: childHeight,
                    childX: props.x,
                    childY: props.y,
                    names: names
                });
            }
        }
    },
    
    onBeforeStretchMaxInvalidateChild: function (childContext, options) {
        // NOTE: No "this" pointer in here...
        var heightModelName = options.names.heightModel;

        // Change the childItem to calculated (i.e., "set by ownerCt"). The component layout
        // of the child can course-correct (like dock layout does for a collapsed panel),
        // so we must make these changes here before that layout's beginLayoutCycle is
        // called.
        if (!childContext[heightModelName].constrainedMax) {
            // if the child hit a max constraint, it needs to be at its configured size, so
            // we leave the sizeModel alone...
            childContext[heightModelName] = Ext.layout.SizeModel.calculated;
        }
    },

    onAfterStretchMaxInvalidateChild: function (childContext, options) {
        // NOTE: No "this" pointer in here...
        var names = options.names,
            childHeight = options.childHeight,
            childWidth = options.childWidth;

        childContext.setProp('x', options.childX);
        childContext.setProp('y', options.childY);

        if (childContext[names.heightModel].calculated) {
            // We need to respect a child that is still not calculated (such as a collapsed
            // panel)...
            childContext[names.setHeight](childHeight);
        }

        if (childContext[names.widthModel].calculated) {
            childContext[names.setWidth](childWidth);
        }
    },

    completeLayout: function(ownerContext) {
        var me = this,
            names = ownerContext.boxNames,
            invalidateScrollX = ownerContext.invalidateScrollX,
            invalidateScrollY = ownerContext.invalidateScrollY,
            overflowHandler = me.overflowHandler,
            scrollRestore = ownerContext.scrollRestore,
            dom, el, overflowX, overflowY, styles, scroll, scrollable;

        if (overflowHandler) {
            overflowHandler.completeLayout(ownerContext);
        }

        if (invalidateScrollX || invalidateScrollY) {
            el = me.getTarget();
            dom = el.dom;
            styles = dom.style;

            if (invalidateScrollX) {
                // get computed style to see if we are 'auto'
                overflowX = el.getStyle('overflowX');
                if (overflowX === 'auto') {
                    // capture the inline style (if any) so we can restore it later:
                    overflowX = styles.overflowX;
                    styles.overflowX = 'scroll'; // force the scrollbar to appear
                } else {
                    invalidateScrollX = false; // no work really since not 'auto'
                }
            }

            if (invalidateScrollY) {
                // get computed style to see if we are 'auto'
                overflowY = el.getStyle('overflowY');
                if (overflowY === 'auto') {
                    // capture the inline style (if any) so we can restore it later:
                    overflowY = styles.overflowY;
                    styles.overflowY = 'scroll'; // force the scrollbar to appear
                } else {
                    invalidateScrollY = false; // no work really since not 'auto'
                }
            }

            if (invalidateScrollX || invalidateScrollY) { // if (some form of 'auto' in play)
                // force a reflow...
                dom.scrollWidth; // jshint ignore:line

                if (invalidateScrollX) {
                    styles.overflowX = overflowX; // restore inline style
                }
                if (invalidateScrollY) {
                    styles.overflowY = overflowY; // restore inline style
                }
            }
        }
        if (scrollRestore) {
            ownerContext.ownerScrollable.scrollTo(scrollRestore.x, scrollRestore.y);
        }
    },

    finishedLayout: function(ownerContext) {
        var overflowHandler = this.overflowHandler;

        if (overflowHandler) {
            overflowHandler.finishedLayout(ownerContext);
        }
        this.callParent(arguments);
    },

    getLayoutItems: function() {
        var items = this.callParent(),
            n = items.length,
            lastVisibleItem, hide, i, item, splitAfter, splitBefore, splitter;

        for (i = 0; i < n; ++i) {
            if ((item = items[i]).isSplitter) {
                continue;
            }

            splitter = item.splitter;
            
            if (item.hidden) {
                if (splitter) {
                    // hidden items always need to hide their splitter
                    if (!splitter.hidden) {
                        splitter.hidden = true;
                        if (splitter.el) {
                            splitter.el.hide();
                        }
                    }
                }
                continue;
            }

            if (splitter) {
                splitBefore = splitter.collapseTarget === 'next';
            } else { // item w/o splitter
                splitBefore = false;
            }

            hide = null;
            if (lastVisibleItem && splitAfter) {
                // the last item had a splitter after it so we can keep it and hide
                // this one if splitBefore
                if (splitAfter.hidden) {
                    splitAfter.hidden = false;
                    if (splitAfter.el) {
                        splitAfter.el.show();
                    }
                }
                if (splitBefore) {
                    hide = true;
                }
            } else if (splitBefore) {
                hide = !lastVisibleItem;
            }
            // else we have no splitter or are !splitBefore, so we defer the fate of this
            // splitter
            
            if (hide !== null && splitter.hidden !== hide) {
                splitter.hidden = hide;
                if (splitter.el) {
                    splitter.el.setVisible(!hide);
                }
            }
            
            splitAfter = !splitBefore && splitter;
            lastVisibleItem = item;
        }

        // If we ended with a visible item and a splitAfter, we need to hide the tail
        // splitter
        if (lastVisibleItem && splitAfter && !splitAfter.hidden) {
            splitAfter.hidden = true;
            if (splitAfter.el) {
                splitAfter.el.hide();
            }
        }

        return items;
    },

    getScrollerEl: function() {
        return this.innerCt;
    },

    /**
     * Inserts the splitter for a given region. A reference to the splitter is also stored
     * on the component as "splitter".
     * @private
     */
    insertSplitter: function (item, index, hidden, splitterCfg) {
        var splitter = {
                xtype: 'splitter',
                id: item.id + '-splitter',
                hidden: hidden,
                splitterFor: item,
                synthetic: true // not user-defined
            },
            at = index + ((splitterCfg.collapseTarget === 'prev') ? 1 : 0);

        splitter[this.names.height] = '100%';
        if (splitterCfg) {
            Ext.apply(splitter, splitterCfg);
        }
        item.splitter = this.owner.add(at, splitter);
    },

    publishInnerCtSize: function(ownerContext, widthOffset) {
        widthOffset = widthOffset || 0;
        
        var me = this,
            state = ownerContext.state,
            names = ownerContext.boxNames,
            heightName = names.height,
            widthName = names.width,
            align = ownerContext.boxOptions.align,
            padding = me.padding,
            plan = state.boxPlan,
            targetSize = plan.targetSize,
            height = plan.maxSize,
            needsScroll = state.needsScroll,
            innerCtContext = ownerContext.innerCtContext,
            innerCtWidth, innerCtHeight;

        // The state.canScroll check is on purpose here, all we want to know is whether we have
        // a scrollable instance, since even if UI scrolling isn't available, we may scroll it
        // programmatically
        if (ownerContext.parallelSizeModel.shrinkWrap || (plan.tooNarrow && state.canScroll)) {
            innerCtWidth = state.contentWidth - ownerContext.targetContext.getPaddingInfo()[widthName];
        } else {
            innerCtWidth = targetSize[widthName];
            if (needsScroll && needsScroll.perpendicular) {
                innerCtWidth -= Ext.getScrollbarSize()[widthName];
            }
        }
        innerCtWidth -= widthOffset;

        // Allow the other co-operating objects to know whether the columns overflow the available width.
        me.owner.tooNarrow = plan.tooNarrow;

        if (align.stretch) {
            innerCtHeight = height;
        } else {
            innerCtHeight = plan.maxSize + padding[names.beforeY] + padding[names.afterY] + innerCtContext.getBorderInfo()[heightName];

            if (!ownerContext.perpendicularSizeModel.shrinkWrap && (align.center || align.bottom)) {
                innerCtHeight = Math.max(targetSize[heightName], innerCtHeight);
            }
        }

        innerCtContext[names.setWidth](innerCtWidth);
        innerCtContext[names.setHeight](innerCtHeight);

        // Fix for an obscure webkit bug (EXTJSIV-5962) caused by the targetEl's 20000px
        // width.  We set a very large width on the targetEl at the beginning of the 
        // layout cycle to prevent any "crushing" effect on the child items, however
        // in some cases the very large width makes it possible to scroll the innerCt
        // by dragging on certain child elements. To prevent this from happening we ensure
        // that the targetEl's width is the same as the innerCt.
        // IE needs it because of its scrollIntoView bug: https://sencha.jira.com/browse/EXTJSIV-6520
        // Webkit needs it because of its mouse drag bug: https://sencha.jira.com/browse/EXTJSIV-5962
        // FF needs it because of a vertical tab bug: https://sencha.jira.com/browse/EXTJSIV-8614
        ownerContext.targetElContext.setWidth(ownerContext.innerCtContext.props.width -
                (me.vertical ? 0 : (widthOffset || 0)));

        // If unable to publish both dimensions, this layout needs to run again
        if (isNaN(innerCtWidth + innerCtHeight)) {
            me.done = false;
        }
    },

    onAdd: function (item, index) {
        var me = this,
            // Buttons will gain a split param
            split = me.enableSplitters && item.split && !item.isButton;

        me.callParent(arguments);

        if (split) {
            if (split === true) {
                split = {
                    collapseTarget: 'next'
                };
            } else if (Ext.isString(split)) {
                split = {
                    collapseTarget: split === 'before' ? 'next' : 'prev'
                };
            } else {
                split = Ext.apply({
                    collapseTarget: split.side === 'before' ? 'next' : 'prev'
                }, split);
            }

            me.insertSplitter(item, index, !!item.hidden, split);
        }
    },

    onRemove: function(comp, isDestroying){
        var me = this,
            names = me.names,
            owner = me.owner,
            splitter = comp.splitter,
            overflowHandler = me.overflowHandler,
            el;
            
        me.callParent(arguments);

        if (splitter && owner.contains(splitter)) {
            owner.doRemove(splitter, true);
            comp.splitter = null;
        }

        if (overflowHandler) {
            overflowHandler.onRemove(comp);
        }

        if (comp.layoutMarginCap === me.id) {
            delete comp.layoutMarginCap;
        }
        
        if (!owner.destroying && !isDestroying && comp.rendered) {
            // Clear top/left styles
            el = comp.getEl();
            if (el) {
                el.setStyle(names.beforeY, '');
                el.setStyle(names.beforeX, '');

                // Box layout imposes margin:0 on its child items and the layout provides margins
                // using its absolute positioning strategy. This has to be reversed on remove.
                el.setStyle('margin', '');
            }
        }
    },

    applyOverflowHandler: function(overflowHandler, oldOverflowHandler) {
        var type;

        if (typeof overflowHandler === 'string') {
            overflowHandler = {
                type: overflowHandler
            };
        }

        type = overflowHandler.type;

        if (oldOverflowHandler && oldOverflowHandler.type === overflowHandler.type) {
            delete overflowHandler.type;
            oldOverflowHandler.setConfig(overflowHandler);
            return oldOverflowHandler;
        }

        overflowHandler.layout = this;

        return Ext.Factory.boxOverflow(overflowHandler);
    },

    // Overridden method from Ext.layout.container.Container.
    // Used in the beforeLayout method to render all items into.
    getRenderTarget: function() {
        return this.targetEl;
    },

    // Overridden method from Ext.layout.container.Container.
    // Used by Container classes to insert special DOM elements which must exist in addition to the child components
    getElementTarget: function() {
        return this.innerCt;
    },

    //<debug>
    calculateChildBox: Ext.deprecated(),
    calculateChildBoxes: Ext.deprecated(),
    updateChildBoxes: Ext.deprecated(),
    //</debug>

    /**
     * @private
     */
    destroy: function() {
        var me = this;
        Ext.destroy(me.innerCt, me.overflowHandler);
        me.flexSortFn = me.innerCt = null;
        me.callParent(arguments);
    },

    getRenderData: function() {
        var data = this.callParent();

        data.targetElCls = this.targetElCls;

        return data;
    },

    updateVertical: function (vertical) {
        var me = this,
            overflowHandler = me.overflowHandler,
            owner = me.owner,
            props = me._props;

        Ext.apply(me, vertical ? props.vbox : props.hbox);

        if (overflowHandler && owner && owner.rendered) {
            overflowHandler.setVertical(vertical);
        }
    },

    _props: {
        // HBOX - this key is produced by setVertical
        'hbox': {
            direction: 'horizontal',
            oppositeDirection: 'vertical',
            horizontal: true,
            vertical: false,
            names: {
                // parallel
                beforeX: 'left',
                beforeScrollX: 'left',
                leftCap: 'Left',
                afterX: 'right',
                width: 'width',
                contentWidth: 'contentWidth',
                minWidth: 'minWidth',
                maxWidth: 'maxWidth',
                widthCap: 'Width',
                widthModel: 'widthModel',
                widthIndex: 0,
                x: 'x',
                getX: 'getX',
                setX: 'setX',
                scrollLeft: 'scrollLeft',
                overflowX: 'overflowX',
                hasOverflowX: 'hasOverflowX',
                invalidateScrollX: 'invalidateScrollX',
                parallelMargins: 'lr',

                // perpendicular
                center: 'middle',
                beforeY: 'top',
                afterY: 'bottom',
                height: 'height',
                contentHeight: 'contentHeight',
                minHeight: 'minHeight',
                maxHeight: 'maxHeight',
                heightCap: 'Height',
                heightModel: 'heightModel',
                heightIndex: 1,
                y: 'y',
                getY: 'getY',
                setY: 'setY',
                overflowY: 'overflowY',
                hasOverflowY: 'hasOverflowY',
                invalidateScrollY: 'invalidateScrollY',
                perpendicularMargins: 'tb',

                // Methods
                getWidth: 'getWidth',
                getHeight: 'getHeight',
                setWidth: 'setWidth',
                setHeight: 'setHeight',
                gotWidth: 'gotWidth',
                gotHeight: 'gotHeight',
                setContentWidth: 'setContentWidth',
                setContentHeight: 'setContentHeight',
                setWidthInDom: 'setWidthInDom',
                setHeightInDom: 'setHeightInDom',
                getScrollLeft: 'getScrollLeft',
                setScrollLeft: 'setScrollLeft',
                scrollTo: 'scrollTo'
            },

            sizePolicy: {
                flex: {
                    '': {
                        readsWidth : 0,
                        readsHeight: 1,
                        setsWidth  : 1,
                        setsHeight : 0
                    },
                    stretch: {
                        readsWidth : 0,
                        readsHeight: 0,
                        setsWidth  : 1,
                        setsHeight : 1
                    },
                    stretchmax: {
                        readsWidth : 0,
                        readsHeight: 1,
                        setsWidth  : 1,
                        setsHeight : 1
                    }
                },
                '': {
                    readsWidth : 1,
                    readsHeight: 1,
                    setsWidth  : 0,
                    setsHeight : 0
                },
                stretch: {
                    readsWidth : 1,
                    readsHeight: 0,
                    setsWidth  : 0,
                    setsHeight : 1
                },
                stretchmax: {
                    readsWidth : 1,
                    readsHeight: 1,
                    setsWidth  : 0,
                    setsHeight : 1
                }
            }
        },
        // VBOX
        'vbox': {
            direction: 'vertical',
            oppositeDirection: 'horizontal',
            horizontal: false,
            vertical: true,
            names: {
                // parallel
                beforeX: 'top',
                beforeScrollX: 'top',
                leftCap: 'Top',
                afterX: 'bottom',
                width: 'height',
                contentWidth: 'contentHeight',
                minWidth: 'minHeight',
                maxWidth: 'maxHeight',
                widthCap: 'Height',
                widthModel: 'heightModel',
                widthIndex: 1,
                x: 'y',
                getX: 'getY',
                setX: 'setY',
                scrollLeft: 'scrollTop',
                overflowX: 'overflowY',
                hasOverflowX: 'hasOverflowY',
                invalidateScrollX: 'invalidateScrollY',
                parallelMargins: 'tb',

                // perpendicular
                center: 'center',
                beforeY: 'left',
                afterY: 'right',
                height: 'width',
                contentHeight: 'contentWidth',
                minHeight: 'minWidth',
                maxHeight: 'maxWidth',
                heightCap: 'Width',
                heightModel: 'widthModel',
                heightIndex: 0,
                y: 'x',
                getY: 'getX',
                setY: 'setX',
                overflowY: 'overflowX',
                hasOverflowY: 'hasOverflowX',
                invalidateScrollY: 'invalidateScrollX',
                perpendicularMargins: 'lr',

                // Methods
                getWidth: 'getHeight',
                getHeight: 'getWidth',
                setWidth: 'setHeight',
                setHeight: 'setWidth',
                gotWidth: 'gotHeight',
                gotHeight: 'gotWidth',
                setContentWidth: 'setContentHeight',
                setContentHeight: 'setContentWidth',
                setWidthInDom: 'setHeightInDom',
                setHeightInDom: 'setWidthInDom',
                getScrollLeft: 'getScrollTop',
                setScrollLeft: 'setScrollTop',
                scrollTo: 'scrollTo'
            },

            sizePolicy: {
                flex: {
                    '': {
                        readsWidth : 1,
                        readsHeight: 0,
                        setsWidth  : 0,
                        setsHeight : 1
                    },
                    stretch: {
                        readsWidth : 0,
                        readsHeight: 0,
                        setsWidth  : 1,
                        setsHeight : 1
                    },
                    stretchmax: {
                        readsWidth : 1,
                        readsHeight: 0,
                        setsWidth  : 1,
                        setsHeight : 1
                    }
                },
                '': {
                    readsWidth : 1,
                    readsHeight: 1,
                    setsWidth  : 0,
                    setsHeight : 0
                },
                stretch: {
                    readsWidth : 0,
                    readsHeight: 1,
                    setsWidth  : 1,
                    setsHeight : 0
                },
                stretchmax: {
                    readsWidth : 1,
                    readsHeight: 1,
                    setsWidth  : 1,
                    setsHeight : 0
                }
            }
        }
    }
});
