/**
 *
 */
Ext.define('Ext.form.field.FileButton', {
    extend: 'Ext.button.Button',
    alias: 'widget.filebutton',
    
    childEls: [
        'fileInputEl'
    ],
    
    inputCls: Ext.baseCSSPrefix + 'form-file-input',
    
    cls: Ext.baseCSSPrefix + 'form-file-btn',
    
    preventDefault: false,
    
    // Button element *looks* focused but it should never really receive focus itself,
    // and with it being a <div></div> we don't need to render tabindex attribute at all
    tabIndex: null,

    autoEl: {
        tag: 'div',
        unselectable: 'on'
    },
    
    /*
     * This <input type="file"/> element is placed above the button element to intercept
     * mouse clicks, as well as receive focus. This is the only way to make browser file input
     * dialog open on user action, and populate the file input value when file(s) are selected.
     * The tabIndex value here comes from the template arguments generated in getTemplateArgs
     * method below; it is copied from the owner FileInput's tabIndex property.
     */
    afterTpl: [
        '<input id="{id}-fileInputEl" data-ref="fileInputEl" class="{childElCls} {inputCls}" ',
            'type="file" size="1" name="{inputName}" role="{role}" ',
            '<tpl if="tabIndex != null">tabindex="{tabIndex}"</tpl>',
        '>'
    ],

    // private
    getAfterMarkup: function(values) {
        return this.getTpl('afterTpl').apply(values);
    },
    
    getTemplateArgs: function(){
        var args = this.callParent();
        args.inputCls = this.inputCls;
        args.inputName = this.inputName;
        args.tabIndex = this.ownerCt.tabIndex;
        return args;
    },
    
    afterRender: function(){
        var me = this;
        
        me.callParent(arguments);
        
        // We place focus and blur listeners on fileInputEl to activate Button's
        // focus and blur style treatment
        me.fileInputEl.on({
            scope: me,
            change: me.fireChange,
            focus: me.onFileFocus,
            blur: me.onFileBlur
        });
    },
    
    fireChange: function(e){
        this.fireEvent('change', this, e, this.fileInputEl.dom.value);
    },
    
    /**
     * @private
     * Creates the file input element. It is inserted into the trigger button component, made
     * invisible, and floated on top of the button's other content so that it will receive the
     * button's clicks.
     */
    createFileInput : function(isTemporary) {
        var me = this,
            fileInputEl = me.fileInputEl = me.el.createChild({
                name: me.inputName,
                id: !isTemporary ? me.id + '-fileInputEl' : undefined,
                cls: me.inputCls,
                tag: 'input',
                type: 'file',
                size: 1,
                role: 'button'
            });

        // This is our focusEl
        fileInputEl.dom.setAttribute(Ext.Component.componentIdAttribute, me.id);
        
        // We place focus and blur listeners on fileInputEl to activate Button's
        // focus and blur style treatment
        fileInputEl.on({
            scope: me,
            change: me.fireChange,
            focus: me.onFileFocus,
            blur: me.onFileBlur
        });
    },

    onFileFocus: function(e) {
        var ownerCt = this.ownerCt;
        
        if (!this.hasFocus) {
            this.onFocus(e);
        }
        
        if (ownerCt && !ownerCt.hasFocus) {
            ownerCt.onFocus(e);
        }
    },

    onFileBlur: function(e) {
        var ownerCt = this.ownerCt;
        
        if (this.hasFocus) {
            this.onBlur(e);
        }
        
        if (ownerCt && ownerCt.hasFocus) {
            ownerCt.onBlur(e);
        }
    },
    
    reset: function(remove) {
        // We do not add listeners to focusEls now.
        // The Focus event publisher calls into Components on focus and blur
        var me = this;
        if (remove) {
            me.fileInputEl.destroy();
        }
        me.createFileInput(!remove);
    },
    
    restoreInput: function(el) {
        // We do not add listeners to focusEls now.
        // The Focus event publisher calls into Components on focus and blur
        var me = this;
        me.fileInputEl.destroy();
        el = Ext.get(el);
        me.el.appendChild(el);
        me.fileInputEl = el;
    },
    
    onDisable: function(){
        this.callParent();
        this.fileInputEl.dom.disabled = true;
    },

    onEnable : function() {
        this.callParent();
        this.fileInputEl.dom.disabled = false;
    },
    
    privates: {
        getFocusEl: function() {
            return this.fileInputEl;
        },
        
        getFocusClsEl: function() {
            return this.el;
        }
    }
});
