Ext.define('Ext.rtl.form.field.FileButton', {
    override: 'Ext.form.field.FileButton',

    createFileInput : function(isTemporary) {
        var me = this;
        me.fileInputEl = me.el.createChild({
            name: me.inputName,
            id: !isTemporary ? me.id + '-fileInputEl' : undefined,
            cls: me.inputCls + ' ' + (me.getInherited().rtl ? Ext.baseCSSPrefix + 'rtl' : ''),
            tag: 'input',
            type: 'file',
            size: 1,
            role: 'button'
        });

        // We place focus and blur listeners on fileInputEl to activate Button's
        // focus and blur style treatment
        me.fileInputEl.on({
            scope: me,
            change: me.fireChange,
            focus: me.onFocus,
            blur: me.onBlur
        });
    }
});
