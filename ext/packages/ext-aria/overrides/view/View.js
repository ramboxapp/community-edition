/** */
Ext.define('Ext.aria.view.View', {
    override: 'Ext.view.View',

    initComponent: function() {
        var me = this,
            selModel;
        
        me.callParent();

        selModel = me.getSelectionModel();
        
        selModel.on({
            scope: me,
            select: me.ariaSelect,
            deselect: me.ariaDeselect
        });
        
        me.on({
            scope: me,
            refresh: me.ariaInitViewItems,
            itemadd: me.ariaItemAdd,
            itemremove: me.ariaItemRemove
        });
    },

    ariaGetRenderAttributes: function() {
        var me = this,
            attrs, mode;
        
        attrs = me.callParent();
        mode  = me.getSelectionModel().getSelectionMode();

        if (mode !== 'SINGLE') {
            attrs['aria-multiselectable'] = true;
        }

        if (me.title) {
            attrs['aria-label'] = me.title;
        }
        
        return attrs;
    },
    
    // For Views, we have to apply ARIA attributes to the list items
    // post factum, because we have no control over the template
    // that is used to create the items.
    ariaInitViewItems: function() {
        var me = this,
            updateSize = me.pageSize || me.store.buffered,
            pos = me.store.requestStart + 1,
            nodes, node, size, i, len;

        nodes = me.getNodes();
        size  = me.store.getTotalCount();

        for (i = 0, len = nodes.length; i < len; i++) {
            node = nodes[i];
            
            if (!node.id) {
                node.setAttribute('id', Ext.id());
            }
            
            node.setAttribute('role', me.itemAriaRole);
            node.setAttribute('aria-selected', false);

            if (updateSize) {
                node.setAttribute('aria-setsize', size);
                node.setAttribute('aria-posinset', pos + i);
            }
        }
    },

    ariaSelect: function(selModel, record) {
        var me = this,
            node;
        
        node = me.getNode(record);
        
        if (node) {
            node.setAttribute('aria-selected', true);
        
            me.ariaUpdate({ 'aria-activedescendant': node.id });
        }
    },

    ariaDeselect: function(selModel, record) {
        var me = this,
            node;
        
        node = me.getNode(record);
        
        if (node) {
            node.removeAttribute('aria-selected');
        
            me.ariaUpdate({ 'aria-activedescendant': undefined });
        }
    },

    ariaItemRemove: function(records, index, nodes) {
        if (!nodes) {
            return;
        }
        
        var me = this,
            ariaSelected, i, len;
        
        ariaSelected = me.el.getAttribute('aria-activedescendant');
        
        for (i = 0, len = nodes.length; i < len; i++) {
            if (ariaSelected === nodes[i].id) {
                me.ariaUpdate({ 'aria-activedescendant': undefined });
                
                break;
            }
        }
    },

    ariaItemAdd: function(records, index, nodes) {
        this.ariaInitViewItems(records, index, nodes);
    },

    setTitle: function(title) {
        var me = this;
        
        me.title = title;
        me.ariaUpdate({ 'aria-label': title });
    }
});
