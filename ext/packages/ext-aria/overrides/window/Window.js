/** */
Ext.define('Ext.aria.window.Window', {
    override: 'Ext.window.Window',
    
    requires: [
        'Ext.aria.panel.Panel',
        'Ext.util.ComponentDragger',
        'Ext.util.Region',
        'Ext.EventManager',
        'Ext.aria.FocusManager'
    ],  
    
    closeText: 'Close Window',
    moveText: 'Move Window',
    resizeText: 'Resize Window',
    
    deltaMove: 10,
    deltaResize: 10,

    initComponent: function() {
        var me = this,
            tools = me.tools;
        
        // Add buttons to move and resize the window,
        // unless it's a Toast
        if (!tools) {
            me.tools = tools = [];
        }
        
        //TODO: Create new tools
        if (!me.isToast) {
            tools.unshift(
                {
                    type: 'resize',
                    tooltip: me.resizeText
                },
                {
                    type: 'move',
                    tooltip: me.moveText
                }
            );
        }
        
        me.callParent();
    },
    
    onBoxReady: function() {
        var me = this,
            EO = Ext.event.Event,
            toolBtn;
        
        me.callParent();
        
        if (me.isToast) {
            return;
        }
        
        if (me.draggable) {
            toolBtn = me.down('tool[type=move]');
            
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), { 'aria-label': me.moveText });
            
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [EO.UP, EO.DOWN, EO.LEFT, EO.RIGHT],
                    handler: me.moveWindow,
                    scope: me
                });
            }
        }
        
        if (me.resizable) {
            toolBtn = me.down('tool[type=resize]');
            
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), { 'aria-label': me.resizeText });
            
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [EO.UP, EO.DOWN, EO.LEFT, EO.RIGHT],
                    handler: me.resizeWindow,
                    scope: me
                });
            }
        }
    },

    onEsc: function(k, e) {
        var me = this;
        
        if (e.within(me.el)) {
            e.stopEvent();
            me.close();
        }
    },

    onShow: function() {
        var me = this;
        
        me.callParent(arguments);
        
        Ext.aria.FocusManager.addWindow(me);
    },
    
    afterHide: function() {
        var me = this;
        
        Ext.aria.FocusManager.removeWindow(me);
        
        me.callParent(arguments);
    },
        
    moveWindow: function(keyCode, e) {
       var me = this,
           delta = me.deltaMove,
           pos = me.getPosition(),
           EO = Ext.event.Event;

        switch (keyCode) {
            case EO.RIGHT:
                pos[0] += delta;
                break;
            case EO.LEFT:
                pos[0] -= delta;
                break;
            case EO.UP:
                pos[1] -= delta;
                break;
            case EO.DOWN:
                pos[1] += delta;
                break;
        }
        
        me.setPagePosition(pos);
        e.stopEvent();
    },
    
    resizeWindow: function(keyCode, e) {
       var me = this,
           delta = me.deltaResize,
           width = me.getWidth(),
           height = me.getHeight(),
           EO = Ext.event.Event;

        switch (keyCode) {
            case EO.RIGHT:
                width += delta;
                break;
            case EO.LEFT:
                width -= delta;
                break;
            case EO.UP:
                height -= delta;
                break;
            case EO.DOWN:
                height += delta;
                break;
        }
        
        me.setSize(width, height);
        e.stopEvent();
    }
});
