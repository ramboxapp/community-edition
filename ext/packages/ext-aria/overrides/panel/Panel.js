/** */
Ext.define('Ext.aria.panel.Panel', {
    override: 'Ext.panel.Panel',
    
    closeText: 'Close Panel',
    collapseText: 'Collapse Panel',
    expandText: 'Expand Panel',
    untitledText: 'Untitled Panel',
    
    onBoxReady: function() {
        var me = this,
            Event = Ext.event.Event,
            collapseTool = me.collapseTool,
            header, tools, i, len;
        
        me.callParent();
        
        if (collapseTool) {
            collapseTool.ariaUpdate({
                'aria-label': me.collapsed ? me.expandText : me.collapseText
            });
            
            collapseTool.ariaAddKeyMap({
                key: [ Event.ENTER, Event.SPACE ],
                handler: me.toggleCollapse,
                scope: me
            });
        }

        if (me.closable) {
            toolBtn = me.down('tool[type=close]');
            
            if (toolBtn) {
                toolBtn.ariaUpdate({
                    'aria-label': me.closeText
                });
            
                toolBtn.ariaAddKeyMap({
                    key: [ Event.ENTER, Event.SPACE ],
                    handler: me.close,
                    scope: me
                });
            }
        }
        
        header = me.getHeader();
    },
    
    setTitle: function(newTitle) {
        var me = this;
        
        me.callParent(arguments);
        me.ariaUpdate({ 'aria-label': newTitle });
    },
    
    createReExpander: function(direction, defaults) {
        var me = this,
            Event = Ext.event.Event,
            opposite, result, tool;
        
        opposite = me.getOppositeDirection(direction);
        result   = me.callParent(arguments);
        tool     = result.down('tool[type=expand-' + opposite + ']');
        
        if (tool) {
            tool.on('boxready', function() {
                tool.ariaUpdate({
                    'aria-label': me.collapsed ? me.expandText : me.collapseText
                });
            
                tool.ariaAddKeyMap({
                    key: [ Event.ENTER, Event.SPACE ],
                    handler: me.toggleCollapse,
                    scope: me
                });
            }, { single: true });
        }
        
        return result;
    },
    
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        
        attrs = me.callParent();

        if (me.collapsible) {
            attrs['aria-expanded'] = !me.collapsed;
        }
        
        return attrs;
    },
    
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            newAttrs = {},
            attrs, toolBtn, textEl;
        
        attrs = me.callParent(arguments);

        if (me.ariaRole === 'presentation' ) {
            return attrs;
        }
        
        if (me.title) {
            textEl = me.ariaGetTitleTextEl();

            if (textEl) {
                newAttrs = { 'aria-labelledby': textEl.id };
            }
            else {
                newAttrs = { 'aria-label': me.title };
            }
        }
        else if (me.ariaLabel) {
            newAttrs = { 'aria-label': me.ariaLabel };
        }

        Ext.apply(attrs, newAttrs);
        
        return attrs;
    },
    
    ariaGetTitleTextEl: function() {
        var header = this.header;
        
        return header && header.titleCmp && header.titleCmp.textEl || null;
    },

    afterExpand: function() {
        var me = this;
        
        me.callParent(arguments);
        
        me.ariaUpdate({ 'aria-expanded': true });
        
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), { 'aria-label': me.collapseText });
        }
    },

    afterCollapse: function() {
        var me = this;
        
        me.callParent(arguments);
        
        me.ariaUpdate({ 'aria-expanded': false });
        
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), { 'aria-label': me.expandText });
        }
    }
});
