/** */
Ext.define('Ext.aria.window.MessageBox', {
    override: 'Ext.window.MessageBox',
    
    requires: [
        'Ext.aria.window.Window',
        'Ext.aria.form.field.Text',
        'Ext.aria.form.field.TextArea',
        'Ext.aria.form.field.Display',
        'Ext.aria.button.Button'
    ]
});
