/**
 * The Editor class is used to provide inline editing for elements on the page. The editor
 * is backed by a {@link Ext.form.field.Field} that will be displayed to edit the underlying content.
 * The editor is a floating Component, when the editor is shown it is automatically aligned to
 * display over the top of the bound element it is editing. The Editor contains several options
 * for how to handle key presses:
 *
 * - {@link #completeOnEnter}
 * - {@link #cancelOnEsc}
 * - {@link #swallowKeys}
 *
 * It also has options for how to use the value once the editor has been activated:
 *
 * - {@link #revertInvalid}
 * - {@link #ignoreNoChange}
 * - {@link #updateEl}
 *
 * Sample usage:
 * 
 *     @example
 *     var form = Ext.create('Ext.form.Panel', {
 *         renderTo: Ext.getBody(),
 *         width: 380,
 *         height: 400,
 *         title: 'User Details',
 *         bodyPadding: 10,
 *         items: [{
 *             html: 'Double-Click on the header title, this, or the field label to edit',
 *             height:30
 *         },{
 *             fieldLabel: 'First Name',
 *             name: 'firstname',
 *             xtype: 'textfield'
 *         }]
 *     });
 *     
 *     var editor = new Ext.Editor({
 *         // update the innerHTML of the bound element 
 *         // when editing completes
 *         updateEl: true,
 *         alignment: 'l-l',
 *         autoSize: {
 *             width: 'boundEl'
 *         },
 *         field: {
 *             xtype: 'textfield'
 *         }
 *     });
 *     
 *     form.header.getTitle().textEl.on('dblclick', function(e, t) {
 *         editor.startEdit(t);
 *     });
 *     
 *     form.getTargetEl().on('dblclick', function(e, t) {
 *         editor.startEdit(t);
 *         // Manually focus, since clicking on the label will focus the text field
 *         editor.field.focus(50, true);
 *     });
 *
 * {@img Ext.Editor/Ext.Editor.png Ext.Editor component}
 *
 */
Ext.define('Ext.Editor', {
    extend: 'Ext.container.Container',
    xtype: 'editor',

    requires: ['Ext.layout.container.Editor'],

    layout: 'editor',

    /**
    * @cfg {Ext.form.field.Field} field
    * The Field object (or descendant) or config object for field
    */

    /**
     * @cfg {Boolean} allowBlur
     * True to {@link #completeEdit complete the editing process} if in edit mode when focus exits from this Editor's hierarchy.
     */
    allowBlur: true,

    /**
     * @cfg {Boolean/Object} autoSize
     * True for the editor to automatically adopt the size of the underlying field. Otherwise, an object
     * can be passed to indicate where to get each dimension. The available properties are 'boundEl' and
     * 'field'. If a dimension is not specified, it will use the underlying height/width specified on
     * the editor object.
     * Examples:
     *
     *     autoSize: true // The editor will be sized to the height/width of the field
     *
     *     height: 21,
     *     autoSize: {
     *         width: 'boundEl' // The width will be determined by the width of the boundEl, the height from the editor (21)
     *     }
     *
     *     autoSize: {
     *         width: 'field', // Width from the field
     *         height: 'boundEl' // Height from the boundEl
     *     }
     */

    /**
     * @cfg {Boolean} revertInvalid
     * True to automatically revert the field value and cancel the edit when the user completes an edit and the field
     * validation fails
     */
    revertInvalid: true,

    /**
     * @cfg {Boolean} [ignoreNoChange=false]
     * True to skip the edit completion process (no save, no events fired) if the user completes an edit and
     * the value has not changed.  Applies only to string values - edits for other data types
     * will never be ignored.
     */

    /**
     * @cfg {Boolean} [hideEl=true]
     * False to keep the bound element visible while the editor is displayed
     */

    /**
     * @cfg {Object} value
     * The data value of the underlying field
     */
    value : '',

    /**
     * @cfg {String} alignment
     * The position to align to (see {@link Ext.util.Positionable#alignTo} for more details).
     */
    alignment: 'c-c?',

    /**
     * @cfg {Number[]} offsets
     * The offsets to use when aligning (see {@link Ext.util.Positionable#alignTo} for more details.
     */
    offsets: [0, 0],

    /**
     * @cfg {Boolean/String} shadow
     * "sides" for sides/bottom only, "frame" for 4-way shadow, and "drop" for bottom-right shadow.
     */
    shadow : 'frame',

    /**
     * @cfg {Boolean} constrain
     * True to constrain the editor to the viewport
     */
    constrain : false,

    /**
     * @cfg {Boolean} swallowKeys
     * Handle the keydown/keypress events so they don't propagate
     */
    swallowKeys : true,

    /**
     * @cfg {Boolean} completeOnEnter
     * True to complete the edit when the enter key is pressed.
     */
    completeOnEnter : true,

    /**
     * @cfg {Boolean} cancelOnEsc
     * True to cancel the edit when the escape key is pressed.
     */
    cancelOnEsc : true,

    /**
     * @cfg {Boolean} updateEl
     * True to update the innerHTML of the bound element when the update completes
     */
    updateEl : false,

    // Do not participate in the ZIndexManager's focus switching operations.
    // When an editor is hidden, the ZIndexManager will not automatically activate
    // the last visible floater on the stack.
    focusOnToFront: false,

    /**
     * @cfg {String/HTMLElement/Ext.dom.Element} [parentEl=document.body]
     * An element to render to.
     */

    baseCls: Ext.baseCSSPrefix + 'editor',

    /**
     * @property {Boolean} editing
     * True if this editor is currently active.
     * @readonly
     */
    editing: false,

    /**
     * @event beforestartedit
     * Fires when editing is initiated, but before the value changes.  Editing can be canceled by returning
     * false from the handler of this event.
     * @param {Ext.Editor} this
     * @param {Ext.dom.Element} boundEl The underlying element bound to this editor
     * @param {Object} value The field value being set
     */

    /**
     * @event startedit
     * Fires when this editor is displayed
     * @param {Ext.Editor} this
     * @param {Ext.dom.Element} boundEl The underlying element bound to this editor
     * @param {Object} value The starting field value
     */

    /**
     * @event beforecomplete
     * Fires after a change has been made to the field, but before the change is reflected in the underlying
     * field.  Saving the change to the field can be canceled by returning false from the handler of this event.
     * Note that if the value has not changed and ignoreNoChange = true, the editing will still end but this
     * event will not fire since no edit actually occurred.
     * @param {Ext.Editor} this
     * @param {Object} value The current field value
     * @param {Object} startValue The original field value
     */

    /**
     * @event complete
     * Fires after editing is complete and any changed value has been written to the underlying field.
     * @param {Ext.Editor} this
     * @param {Object} value The current field value
     * @param {Object} startValue The original field value
     */

    /**
     * @event canceledit
     * Fires after editing has been canceled and the editor's value has been reset.
     * @param {Ext.Editor} this
     * @param {Object} value The user-entered field value that was discarded
     * @param {Object} startValue The original field value that was set back into the editor after cancel
     */

    /**
     * @event specialkey
     * Fires when any key related to navigation (arrows, tab, enter, esc, etc.) is pressed.  You can check
     * {@link Ext.event.Event#getKey} to determine which key was pressed.
     * @param {Ext.Editor} this
     * @param {Ext.form.field.Field} field The field attached to this editor
     * @param {Ext.event.Event} event The event object
     */
    
    preventDefaultAlign: true,
    specialKeyDelay: 1,

    initComponent: function() {
        var me = this,
            field = me.field = Ext.ComponentManager.create(me.field || {}, 'textfield');

        field.msgTarget = field.msgTarget || 'qtip';
        me.mon(field, {
            scope: me,
            specialkey: me.onSpecialKey
        });

        if (field.grow) {
            me.mon(field, 'autosize', me.onFieldAutosize,  me, {delay: 1});
        }
        me.floating = {
            constrain: me.constrain
        };
        me.items = field;

        me.callParent(arguments);
    },

    onAdded: function (container) {
        // Editors are floaters and shouldn't have an ownerCt, so use ownerCmp as
        // the upward link.
        this.ownerCmp = container;
    },

    // private
    onFieldAutosize: function(){
        this.updateLayout();
    },

    // private
    afterRender: function(ct, position) {
        var me = this,
            field = me.field,
            inputEl = field.inputEl;

        me.callParent(arguments);

        // Ensure the field doesn't get submitted as part of any form
        if (inputEl) {
            inputEl.dom.name = '';
            if (me.swallowKeys) {
                inputEl.swallowEvent([
                    'keypress', // *** Opera
                    'keydown'   // *** all other browsers
                ]);
            }
        }
    },

    // private
    onSpecialKey: function(field, event) {
        var me = this,
            key = event.getKey(),
            complete = me.completeOnEnter && key === event.ENTER,
            cancel = me.cancelOnEsc && key === event.ESC,
            task = me.specialKeyTask;

        if (complete || cancel) {
            event.stopEvent();
            if (!task) {
                me.specialKeyTask = task = new Ext.util.DelayedTask();
            }
            // Must defer this slightly to prevent exiting edit mode before the field's own
            // key nav can handle the enter key, e.g. selecting an item in a combobox list
            task.delay(me.specialKeyDelay, complete ? me.completeEdit : me.cancelEdit, me);
            //<debug>
            // Makes unit testing easier
            if (me.specialKeyDelay === 0) {
                task.cancel();
                if (complete) {
                    me.completeEdit();
                } else {
                    me.cancelEdit();
                }
            }
            //</debug>
        }

        me.fireEvent('specialkey', me, field, event);
    },

    /**
     * Starts the editing process and shows the editor.
     * @param {String/HTMLElement/Ext.dom.Element} el The element to edit
     * @param {String} value (optional) A value to initialize the editor with. If a value is not provided, it defaults
      * to the innerHTML of el.
     */
    startEdit: function(el, value) {
        var me = this,
            field = me.field,
            dom, ownerCt, renderTo;

        me.completeEdit();
        me.boundEl = Ext.get(el);
        dom = me.boundEl.dom;
        value = Ext.isDefined(value) ? value : Ext.String.trim(dom.textContent || dom.innerText || dom.innerHTML);

        if (me.fireEvent('beforestartedit', me, me.boundEl, value) !== false) {
            // If NOT configured with a renderTo, render to the ownerCt's element
            // Being floating, we do not need to use the actual layout's target.
            // Indeed, it's better if we do not so that we do not interfere with layout's child management.
            Ext.suspendLayouts();
            if (!me.rendered) {
                ownerCt = me.ownerCt;
                renderTo = me.renderTo || (ownerCt && ownerCt.getEl()) || Ext.getBody();
                Ext.fly(renderTo).position();
                me.renderTo = renderTo;
            }

            me.startValue = value;
            me.show();
            me.realign(true);

            // temporarily suspend events on field to prevent the "change" event from firing when resetOriginalValue() and setValue() are called
            field.suspendEvents();
            field.setValue(value);
            field.resetOriginalValue();
            field.resumeEvents();
            field.focus(field.selectOnFocus ? true : [Number.MAX_VALUE]);
            if (field.autoSize) {
                field.autoSize();
            }
            Ext.resumeLayouts(true);
            me.toggleBoundEl(false);
            me.editing = true;
        }
    },

    /**
     * Realigns the editor to the bound field based on the current alignment config value.
     * @param {Boolean} autoSize (optional) True to size the field to the dimensions of the bound element.
     */
    realign: function(autoSize) {
        var me = this;
        if (autoSize === true) {
            me.updateLayout();
        }
        me.alignTo(me.boundEl, me.alignment, me.offsets);
    },

    /**
     * Ends the editing process, persists the changed value to the underlying field, and hides the editor.
     * @param {Boolean} [remainVisible=false] Override the default behavior and keep the editor visible after edit
     */
    completeEdit: function(remainVisible) {
        var me = this,
            field = me.field,
            startValue = me.startValue,
            value;

        if (!me.editing) {
            return;
        }

        // Assert combo values first
        if (field.assertValue) {
            field.assertValue();
        }

        value = me.getValue();
        if (!field.isValid()) {
            if (me.revertInvalid !== false) {
                me.cancelEdit(remainVisible);
            }
            return;
        }

        if (me.ignoreNoChange && !field.didValueChange(value, startValue)) {
            me.onEditComplete(remainVisible);
            return;
        }

        if (me.fireEvent('beforecomplete', me, value, startValue) !== false) {
            // Grab the value again, may have changed in beforecomplete
            value = me.getValue();
            if (me.updateEl && me.boundEl) {
                me.boundEl.setHtml(value);
            }
            me.onEditComplete(remainVisible);
            me.fireEvent('complete', me, value, startValue);
        }
    },

    // private
    onShow: function() {
        var me = this;

        me.callParent(arguments);
        me.fireEvent('startedit', me, me.boundEl, me.startValue);
    },

    /**
     * Cancels the editing process and hides the editor without persisting any changes.  The field value will be
     * reverted to the original starting value.
     * @param {Boolean} [remainVisible=false] Override the default behavior and keep the editor visible after cancel
     */
    cancelEdit: function(remainVisible) {
        var me = this,
            startValue = me.startValue,
            field = me.field,
            value;

        if (me.editing) {
            if (field) {
                value = me.editedValue = me.getValue();
                // temporarily suspend events on field to prevent the "change" event from firing when setValue() is called
                field.suspendEvents();
                me.setValue(startValue);
                field.resumeEvents();
            }
            me.onEditComplete(remainVisible);
            me.fireEvent('canceledit', me, value, startValue);
            delete me.editedValue;
        }
    },

    // private
    onEditComplete: function(remainVisible) {
        this.editing = false;
        if (remainVisible !== true) {
            this.hide();
            this.toggleBoundEl(true);
        }
    },

    // private
    onFocusLeave: function(e) {
        var me = this;

        // selectSameEditor flag allows the same editor to be started without onFieldBlur firing on itself
        if (me.allowBlur === true && me.editing && me.selectSameEditor !== true) {
            this.completeEdit();
        }
        this.callParent([e]);
    },

    // private
    onHide: function() {
        var me = this,
            field = me.field;

        if (me.editing) {
            me.completeEdit();
        }
        else if (field.collapse) {
            field.collapse();
        }
        me.callParent(arguments);
    },

    /**
     * Gets the data value of the editor
     * @return {Object} The data value
     */
    getValue: function() {
        return this.field.getValue();
    },

    /**
     * Sets the data value of the editor
     * @param {Object} value Any valid value supported by the underlying field
     */
    setValue: function(value) {
        this.field.setValue(value);
    },

    toggleBoundEl: function(visible) {
        if (this.hideEl !== false) {
            this.boundEl.setVisible(visible);
        }
    },

    beforeDestroy: function () {
        var me = this,
            task = me.specialKeyTask;

        if (task) {
            task.cancel();
        }

        me.specialKeyTask = me.field = me.boundEl = Ext.destroy(me.field);
        me.callParent(arguments);
    }
});
