/**
 * @private
 */
Ext.define('Ext.grid.header.DropZone', {
    extend: 'Ext.dd.DropZone',
    colHeaderCls: Ext.baseCSSPrefix + 'column-header',
    proxyOffsets: [-4, -9],

    constructor: function(headerCt) {
        var me = this;

        me.headerCt = headerCt;
        me.ddGroup = me.getDDGroup();
        me.autoGroup = true;
        me.callParent([headerCt.el]);
    },

    destroy: function () {
        this.callParent();
        Ext.destroy(this.topIndicator, this.bottomIndicator);
    },

    getDDGroup: function() {
        return 'header-dd-zone-' + this.headerCt.up('[scrollerOwner]').id;
    },

    getTargetFromEvent : function(e){
        return e.getTarget('.' + this.colHeaderCls);
    },

    getTopIndicator: function() {
        if (!this.topIndicator) {
            this.topIndicator = Ext.getBody().createChild({
                role: 'presentation',
                cls: Ext.baseCSSPrefix + "col-move-top",
                //<debug>
                // tell the spec runner to ignore this element when checking if the dom is clean
                "data-sticky": true,
                //</debug>
                html: "&#160;"
            });
            this.indicatorXOffset = Math.floor((this.topIndicator.dom.offsetWidth + 1) / 2);
        }
        return this.topIndicator;
    },

    getBottomIndicator: function() {
        if (!this.bottomIndicator) {
            this.bottomIndicator = Ext.getBody().createChild({
                role: 'presentation',
                cls: Ext.baseCSSPrefix + "col-move-bottom",
                //<debug>
                // tell the spec runner to ignore this element when checking if the dom is clean
                "data-sticky": true,
                //</debug>
                html: "&#160;"
            });
        }
        return this.bottomIndicator;
    },

    getLocation: function(e, t) {
        var x      = e.getXY()[0],
            region = Ext.fly(t).getRegion(),
            pos;

        if ((region.right - x) <= (region.right - region.left) / 2) {
            pos = "after";
        } else {
            pos = "before";
        }
        return {
            pos: pos,
            header: Ext.getCmp(t.id),
            node: t
        };
    },

    positionIndicator: function(data, node, e){
        var me = this,
            dragHeader   = data.header,
            dropLocation = me.getLocation(e, node),
            targetHeader = dropLocation.header,
            pos          = dropLocation.pos,
            nextHd,
            prevHd,
            topIndicator, bottomIndicator, topAnchor, bottomAnchor,
            topXY, bottomXY, headerCtEl, minX, maxX,
            allDropZones, ln, i, dropZone;

        // Avoid expensive CQ lookups and DOM calculations if dropPosition has not changed
        if (targetHeader === me.lastTargetHeader && pos === me.lastDropPos) {
            return;
        }
        nextHd       = dragHeader.nextSibling('gridcolumn:not([hidden])');
        prevHd       = dragHeader.previousSibling('gridcolumn:not([hidden])');
        me.lastTargetHeader = targetHeader;
        me.lastDropPos = pos;

        // Cannot drag to before non-draggable start column
        if (!targetHeader.draggable && pos === 'before' && targetHeader.getIndex() === 0) {
            return false;
        }

        data.dropLocation = dropLocation;

        if ((dragHeader !== targetHeader) &&
            ((pos === "before" && nextHd !== targetHeader) ||
            (pos === "after" && prevHd !== targetHeader)) &&
            !targetHeader.isDescendantOf(dragHeader)) {

            // As we move in between different DropZones that are in the same
            // group (such as the case when in a locked grid), invalidateDrop
            // on the other dropZones.
            allDropZones = Ext.dd.DragDropManager.getRelated(me);
            ln = allDropZones.length;
            i  = 0;

            for (; i < ln; i++) {
                dropZone = allDropZones[i];
                if (dropZone !== me && dropZone.invalidateDrop) {
                    dropZone.invalidateDrop();
                }
            }

            me.valid = true;
            topIndicator = me.getTopIndicator();
            bottomIndicator = me.getBottomIndicator();
            if (pos === 'before') {
                topAnchor = 'bc-tl';
                bottomAnchor = 'tc-bl';
            } else {
                topAnchor = 'bc-tr';
                bottomAnchor = 'tc-br';
            }

            // Calculate arrow positions. Offset them to align exactly with column border line
            topXY = topIndicator.getAlignToXY(targetHeader.el, topAnchor);
            bottomXY = bottomIndicator.getAlignToXY(targetHeader.el, bottomAnchor);

            // constrain the indicators to the viewable section
            headerCtEl = me.headerCt.el;
            minX = headerCtEl.getX() - me.indicatorXOffset;
            maxX = headerCtEl.getX() + headerCtEl.getWidth();

            topXY[0] = Ext.Number.constrain(topXY[0], minX, maxX);
            bottomXY[0] = Ext.Number.constrain(bottomXY[0], minX, maxX);

            // position and show indicators
            topIndicator.setXY(topXY);
            bottomIndicator.setXY(bottomXY);
            topIndicator.show();
            bottomIndicator.show();

        // invalidate drop operation and hide indicators
        } else {
            me.invalidateDrop();
        }
    },

    invalidateDrop: function() {
        this.valid = false;
        this.hideIndicators();
    },

    onNodeOver: function(node, dragZone, e, data) {
        var me = this,
            from = data.header,
            doPosition,
            to,
            fromPanel,
            toPanel;

        if (data.header.el.dom === node) {
            doPosition = false;
        } else {
            data.isLock = data.isUnlock = data.crossPanel = false;
            to = me.getLocation(e, node).header;

            // Dragging within the same container - always valid
            doPosition = (from.ownerCt === to.ownerCt);

            // If from different containers, and they are not sealed, then continue checking
            if (!doPosition && (!from.ownerCt.sealed && !to.ownerCt.sealed)) {

                doPosition = true;
                fromPanel = from.up('tablepanel');
                toPanel = to.up('tablepanel');
                if (fromPanel !== toPanel) {
                    data.crossPanel = true;

                    // If it's a lock operation, check that it's allowable.
                    data.isLock   = toPanel.isLocked && !fromPanel.isLocked;
                    data.isUnlock = !toPanel.isLocked && fromPanel.isLocked;
                    if ((data.isUnlock && from.lockable === false) || (data.isLock && !from.isLockable())) {
                        doPosition = false;
                    }
                }
            }
        }

        if (doPosition) {
            me.positionIndicator(data, node, e);
        } else {
            me.valid = false;
        }
        return me.valid ? me.dropAllowed : me.dropNotAllowed;
    },

    hideIndicators: function() {
        var me = this;

        me.getTopIndicator().hide();
        me.getBottomIndicator().hide();
        me.lastTargetHeader = me.lastDropPos = null;
    },

    onNodeOut: function() {
        this.hideIndicators();
    },

    // @private
    // Used to determine the move position for the view's data columns for nested headers at any level.
    getNestedHeader: function (header, first) {
        var items = header.items,
            pos;

        if (header.isGroupHeader && items.length) {
            pos = !first ? 'first' : 'last';
            header = this.getNestedHeader(items[pos](), first);
        }

        return header;
    },

    onNodeDrop: function(node, dragZone, e, data) {
        // Note that dropLocation.pos refers to whether the header is dropped before or after the target node!
        if (!this.valid) {
            return;
        }
        
        var me = this,
            dragHeader = data.header,
            dropLocation = data.dropLocation,
            dropPosition = dropLocation.pos,
            targetHeader = dropLocation.header,
            fromCt = dragHeader.ownerCt,
            fromCtRoot =  fromCt.getRootHeaderCt(),
            toCt = targetHeader.ownerCt,
            // Use the full column manager here, the indices we want are for moving the actual items in the container.
            // The HeaderContainer translates this to visible columns for informing the view and firing events.
            visibleColumnManager = me.headerCt.visibleColumnManager,
            visibleFromIdx = visibleColumnManager.getHeaderIndex(dragHeader),
            visibleToIdx, colsToMove, moveMethod, scrollerOwner, savedWidth;

        // If we are dragging in between two HeaderContainers that have had the lockable mixin injected we will lock/unlock
        // headers in between sections, and then continue with another execution of onNodeDrop to ensure the header is
        // dropped into the correct group.
        if (data.isLock || data.isUnlock) {
            scrollerOwner = fromCt.up('[scrollerOwner]');
            visibleToIdx = toCt.items.indexOf(targetHeader);

            if (dropPosition === 'after') {
                visibleToIdx++;
            }

            if (data.isLock) {
                scrollerOwner.lock(dragHeader, visibleToIdx, toCt);
            } else {
                scrollerOwner.unlock(dragHeader, visibleToIdx, toCt);
            }
        }
        // This is a drop within the same HeaderContainer.
        else {
            // For the after position, we need to update the visibleToIdx index. In case it's nested in one or more
            // grouped headers, we need to get the last header (or the first, depending on the dropPosition) in the
            // items collection for the most deeply-nested header, whether it be first or last in the collection.
            // This will yield the header index in the visibleColumnManager, which will correctly maintain a list
            // of all the headers.
            visibleToIdx = dropPosition === 'after' ?
                // Get the last header in the most deeply-nested header group and add one.
                visibleColumnManager.getHeaderIndex(me.getNestedHeader(targetHeader, 1)) + 1 :
                // Get the first header in the most deeply-nested header group.
                visibleColumnManager.getHeaderIndex(me.getNestedHeader(targetHeader, 0));

            me.invalidateDrop();
            // Cache the width here, we need to get it before we removed it from the DOM
            savedWidth = dragHeader.getWidth();

            // Suspend layouts while we sort all this out.
            Ext.suspendLayouts();

            // When removing and then adding, the owning gridpanel will be informed of column mutation twice
            // Both remove and add handling inform the owning grid.
            // The isDDMoveInGrid flag will prevent the remove operation from doing this.
            // See Ext.grid.header.Container#onRemove.
            fromCt.isDDMoveInGrid = toCt.isDDMoveInGrid = !data.crossPanel;

            // ***Move the headers***
            //
            // If both drag and target headers are groupHeaders, we have to check and see if they are nested, i.e.,
            // there are multiple stacked group headers with only subheaders at the lowest level:
            //
            //           +-----------------------------------+
            //           |               Group 1             |
            //           |-----------------------------------|
            //           |               Group 2             |
            //   other   |-----------------------------------|   other
            //  headers  |               Group 3             |  headers
            //           |-----------------------------------|
            //           | Field3 | Field4 | Field5 | Field6 |
            //           |===================================|
            //           |               view                |
            //           +-----------------------------------+
            //
            // In these cases, we need to mark the groupHeader that is the ownerCt of the targetHeader and then only
            // remove the headers up until that (removal of headers is recursive and assumes that any header with no
            // children can be safely removed, which is not a safe assumption).
            // See Ext.grid.header.Container#onRemove.
            if (dragHeader.isGroupHeader && targetHeader.isGroupHeader) {
                dragHeader.setNestedParent(targetHeader);
            }

            // We only need to be concerned with moving the dragHeader component before or after the targetHeader
            // component rather than trying to pass indices, which is too ambiguous and could refer to any
            // collection at any level of (grouped) header containers.
            if (dropPosition === 'before') {
                targetHeader.insertNestedHeader(dragHeader);
            } else {
                // Capitalize the first letter. This will call either ct.moveAfter() or ct.moveBefore().
                moveMethod = 'move' + dropPosition.charAt(0).toUpperCase() + dropPosition.substr(1);
                toCt[moveMethod](dragHeader, targetHeader);
            }

            // ***Move the view data columns***
            // Refresh the view if it's not the last header in a group. If it is the last header, we don't need
            // to refresh the view as the headers and the corrresponding data columns will already be correctly
            // aligned (think of the group header sitting directly atop the last header in the group).
            // Also, it's not necessary to refresh the view if the indices are the same.
            if (visibleToIdx >= 0 && !(targetHeader.isGroupHeader && !targetHeader.items.length) && visibleFromIdx !== visibleToIdx) {
                colsToMove = dragHeader.isGroupHeader ?
                    dragHeader.query(':not([hidden]):not([isGroupHeader])').length :
                    1;

                // We need to adjust the visibleToIdx when both of the following conditions are met:
                //   1. The drag is forward, i.e., the dragHeader is being dragged to the right.
                //   2. There is more than one column being dragged, i.e., an entire group.
                if ((visibleFromIdx <= visibleToIdx) && colsToMove > 1) {
                    visibleToIdx -= colsToMove;
                }

                // It's necessary to lookup the ancestor grid of the grouped header b/c the header could be
                // nested at any level.
                toCt.getRootHeaderCt().grid.view.moveColumn(visibleFromIdx, visibleToIdx, colsToMove);
            }

            // We need to always fire a columnmove event. Check for an .ownerCt first in case this is a
            // grouped header.
            fromCtRoot.fireEvent('columnmove', fromCt, dragHeader, visibleFromIdx, visibleToIdx);

            fromCt.isDDMoveInGrid = toCt.isDDMoveInGrid = false;

            // Group headers skrinkwrap their child headers.
            // Therefore a child header may not flex; it must contribute a fixed width.
            // But we restore the flex value when moving back into the main header container
            //
            // Note that we don't need to save the flex if coming from another group header b/c it couldn't
            // have had one!
            if (toCt.isGroupHeader && !fromCt.isGroupHeader) {
                // Adjust the width of the "to" group header only if we dragged in from somewhere else.
                // If not within the same container.
                if (fromCt !== toCt) {
                    dragHeader.savedFlex = dragHeader.flex;
                    delete dragHeader.flex;
                    dragHeader.width = savedWidth;
                }
            } else if (!fromCt.isGroupHeader) {
                if (dragHeader.savedFlex) {
                    dragHeader.flex = dragHeader.savedFlex;
                    delete dragHeader.width;
                }
            }

            Ext.resumeLayouts(true);
            // Ext.grid.header.Container will handle the removal of empty groups, don't handle it here.
        }
    }
});
