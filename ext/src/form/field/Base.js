/**
 * Base class for form fields that provides default event handling, rendering, and other common functionality
 * needed by all form field types. Utilizes the {@link Ext.form.field.Field} mixin for value handling and validation,
 * and the {@link Ext.form.Labelable} mixin to provide label and error message display.
 *
 * In most cases you will want to use a subclass, such as {@link Ext.form.field.Text} or {@link Ext.form.field.Checkbox},
 * rather than creating instances of this class directly. However if you are implementing a custom form field,
 * using this as the parent class is recommended.
 *
 * # Values and Conversions
 *
 * Because Base implements the Field mixin, it has a main value that can be initialized with the
 * {@link #value} config and manipulated via the {@link #getValue} and {@link #setValue} methods. This main
 * value can be one of many data types appropriate to the current field, for instance a {@link Ext.form.field.Date Date}
 * field would use a JavaScript Date object as its value type. However, because the field is rendered as a HTML
 * input, this value data type can not always be directly used in the rendered field.
 *
 * Therefore Base introduces the concept of a "raw value". This is the value of the rendered HTML input field,
 * and is normally a String. The {@link #getRawValue} and {@link #setRawValue} methods can be used to directly
 * work with the raw value, though it is recommended to use getValue and setValue in most cases.
 *
 * Conversion back and forth between the main value and the raw value is handled by the {@link #valueToRaw} and
 * {@link #rawToValue} methods. If you are implementing a subclass that uses a non-String value data type, you
 * should override these methods to handle the conversion.
 *
 * # Rendering
 *
 * The content of the field body is defined by the {@link #fieldSubTpl} XTemplate, with its argument data
 * created by the {@link #getSubTplData} method. Override this template and/or method to create custom
 * field renderings.
 */
Ext.define('Ext.form.field.Base', {
    extend: 'Ext.Component',
    mixins: [
        'Ext.form.Labelable',
        'Ext.form.field.Field'
    ],
    xtype: 'field',
    alternateClassName: ['Ext.form.Field', 'Ext.form.BaseField'],
    requires: [
        'Ext.util.DelayedTask',
        'Ext.XTemplate'
    ],
    
    focusable: true,
    shrinkWrap: true,

    /**
     * @cfg {Ext.XTemplate} fieldSubTpl
     * The content of the field body is defined by this config option.
     * @private
     */
    fieldSubTpl: [ // note: {id} here is really {inputId}, but {cmpId} is available
        '<input id="{id}" data-ref="inputEl" type="{type}" role="{role}" {inputAttrTpl}',
            ' size="1"', // allows inputs to fully respect CSS widths across all browsers
            '<tpl if="name"> name="{name}"</tpl>',
            '<tpl if="value"> value="{[Ext.util.Format.htmlEncode(values.value)]}"</tpl>',
            '<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
            '{%if (values.maxLength !== undefined){%} maxlength="{maxLength}"{%}%}',
            '<tpl if="readOnly"> readonly="readonly"</tpl>',
            '<tpl if="disabled"> disabled="disabled"</tpl>',
            '<tpl if="tabIdx != null"> tabindex="{tabIdx}"</tpl>',
            '<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
        ' class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off"/>',
        {
            disableFormats: true
        }
    ],

    defaultBindProperty: 'value',

    subTplInsertions: [
        /**
         * @cfg {String/Array/Ext.XTemplate} inputAttrTpl
         * An optional string or `XTemplate` configuration to insert in the field markup
         * inside the input element (as attributes). If an `XTemplate` is used, the component's
         * {@link #getSubTplData subTpl data} serves as the context.
         */
        'inputAttrTpl'
    ],

    childEls: [
        /**
         * @property {Ext.dom.Element} inputEl
         * The input Element for this Field. Only available after the field has been rendered.
         */
        'inputEl'
    ],

    /**
     * @cfg {String} name
     * The name of the field. This is used as the parameter name when including the field value
     * in a {@link Ext.form.Basic#submit form submit()}. If no name is configured, it falls back to the {@link #inputId}.
     * To prevent the field from being included in the form submit, set {@link #submitValue} to false.
     */

    /**
     * @cfg {String} inputType
     * The type attribute for input fields -- e.g. radio, text, password, file. The extended types
     * supported by HTML5 inputs (url, email, etc.) may also be used, though using them will cause older browsers to
     * fall back to 'text'.
     *
     * The type 'password' must be used to render that field type currently -- there is no separate Ext component for
     * that. You can use {@link Ext.form.field.File} which creates a custom-rendered file upload field, but if you want
     * a plain unstyled file input you can use a Base with inputType:'file'.
     */
    inputType: 'text',

    /**
     * @cfg {Boolean} isTextInput
     * `true` if this field renders as a text input.
     *
     * @private
     * @since 5.0.1
     */
    isTextInput: true,

    /**
     * @cfg {Number} tabIndex
     * 
     * Sets a DOM tabIndex for this field. tabIndex may be set to `-1` in order to remove
     * the field from the tab rotation.
     * 
     * **Note:** tabIndex only applies to fields that are rendered.  It does not effect 
     * fields built via applyTo
     */

    //<locale>
    /**
     * @cfg {String} invalidText
     * The error text to use when marking a field invalid and no message is provided
     */
    invalidText : 'The value in this field is invalid',
    //</locale>

    /**
     * @cfg {String} [fieldCls='x-form-field']
     * The default CSS class for the field input
     */
    fieldCls : Ext.baseCSSPrefix + 'form-field',

    /**
     * @cfg {String} fieldStyle
     * Optional CSS style(s) to be applied to the {@link #inputEl field input element}. Should be a valid argument to
     * {@link Ext.dom.Element#applyStyles}. Defaults to undefined. See also the {@link #setFieldStyle} method for changing
     * the style after initialization.
     */

    /**
     * @cfg {String} [focusCls='x-form-focus']
     * The CSS class to use when the field receives focus
     */
    focusCls: 'form-focus',

    /**
     * @cfg {String} dirtyCls
     * The CSS class to use when the field value {@link #isDirty is dirty}.
     */
    dirtyCls : Ext.baseCSSPrefix + 'form-dirty',

    /**
     * @cfg {String[]} checkChangeEvents
     * A list of event names that will be listened for on the field's {@link #inputEl input element}, which will cause
     * the field's value to be checked for changes. If a change is detected, the {@link #change change event} will be
     * fired, followed by validation if the {@link #validateOnChange} option is enabled.
     *
     * Defaults to ['change', 'propertychange', 'keyup'] in Internet Explorer, and ['change', 'input', 'textInput', 'keyup',
     * 'dragdrop'] in other browsers. This catches all the ways that field values can be changed in most supported
     * browsers; the only known exceptions at the time of writing are:
     *
     *   - Safari 3.2 and older: cut/paste in textareas via the context menu, and dragging text into textareas
     *   - Opera 10 and 11: dragging text into text fields and textareas, and cut via the context menu in text fields
     *     and textareas
     *   - Opera 9: Same as Opera 10 and 11, plus paste from context menu in text fields and textareas
     *
     * If you need to guarantee on-the-fly change notifications including these edge cases, you can call the
     * {@link #checkChange} method on a repeating interval, e.g. using {@link Ext.TaskManager}, or if the field is within
     * a {@link Ext.form.Panel}, you can use the FormPanel's {@link Ext.form.Panel#pollForChanges} configuration to set up
     * such a task automatically.
     */
    checkChangeEvents: Ext.isIE && (!document.documentMode || document.documentMode <= 9) ?
                        ['change', 'propertychange', 'keyup'] :
                        ['change', 'input', 'textInput', 'keyup', 'dragdrop'],
     // While input is supported in IE9, we use attachEvent for events, so we need to fall back here
                        
    ignoreChangeRe: /data\-errorqtip|style\.|className/,   

    /**
     * @cfg {Number} checkChangeBuffer
     * Defines a timeout in milliseconds for buffering {@link #checkChangeEvents} that fire in rapid succession.
     * Defaults to 50 milliseconds.
     */
    checkChangeBuffer: 50,

    liquidLayout: true,

    /**
     * @cfg {Boolean} readOnly
     * true to mark the field as readOnly in HTML.
     */
    readOnly: false,

    /**
     * @cfg {String} readOnlyCls
     * The CSS class applied to the component's main element when it is {@link #readOnly}.
     */
    readOnlyCls: Ext.baseCSSPrefix + 'form-readonly',

    /**
     * @cfg {String} inputId
     * The id that will be given to the generated input DOM element. Defaults to an automatically generated id. If you
     * configure this manually, you must make sure it is unique in the document.
     */

    /**
     * @cfg {Boolean} validateOnBlur
     * Whether the field should validate when it loses focus. This will cause fields to be validated
     * as the user steps through the fields in the form regardless of whether they are making changes to those fields
     * along the way. See also {@link #validateOnChange}.
     */
    validateOnBlur: true,

    // private
    hasFocus : false,

    baseCls: Ext.baseCSSPrefix + 'field',

    fieldBodyCls: Ext.baseCSSPrefix + 'field-body',

    maskOnDisable: false,
    
    // Instructs the layout to stretch the inputEl to 100% width when laying
    // out under fixed conditions. Defaults to true for all fields except check/radio
    // Doesn't seem worth it to introduce a whole new layout class just for this flag
    stretchInputElFixed: true,

    /**
     * @event specialkey
     * Fires when any key related to navigation (arrows, tab, enter, esc, etc.) is pressed. To handle other keys
     * see {@link Ext.util.KeyMap}. You can check {@link Ext.event.Event#getKey} to determine which key was
     * pressed. For example:
     *
     *     var form = new Ext.form.Panel({
     *         ...
     *         items: [{
     *                 fieldLabel: 'Field 1',
     *                 name: 'field1',
     *                 allowBlank: false
     *             },{
     *                 fieldLabel: 'Field 2',
     *                 name: 'field2',
     *                 listeners: {
     *                     specialkey: function(field, e){
     *                         // e.HOME, e.END, e.PAGE_UP, e.PAGE_DOWN,
     *                         // e.TAB, e.ESC, arrow keys: e.LEFT, e.RIGHT, e.UP, e.DOWN
     *                         if (e.{@link Ext.event.Event#getKey getKey()} == e.ENTER) {
     *                             var form = field.up('form').getForm();
     *                             form.submit();
     *                         }
     *                     }
     *                 }
     *             }
     *         ],
     *         ...
     *     });
     *
     * @param {Ext.form.field.Base} this
     * @param {Ext.event.Event} e The event object
     */

    /**
     * @event writeablechange
     * Fires when this field changes its read-only status.
     * @param {Ext.form.field.Base} this
     * @param {Boolean} Read only flag
     */

    // private
    initComponent : function() {
        var me = this;

        me.callParent();

        me.subTplData = me.subTplData || {};

        // Init mixins
        me.initLabelable();
        me.initField();

        // Default name to inputId
        if (!me.name) {
            me.name = me.getInputId();
        }
        // Add to protoEl before render
        if (me.readOnly) {
            me.addCls(me.readOnlyCls);
        }
        
        me.addCls(Ext.baseCSSPrefix + 'form-type-' + me.inputType);
    },

    /**
     * Returns the input id for this field. If none was specified via the {@link #inputId} config, then an id will be
     * automatically generated.
     */
    getInputId: function() {
        return this.inputId || (this.inputId = this.id + '-inputEl');
    },

    /**
     * Creates and returns the data object to be used when rendering the {@link #fieldSubTpl}.
     * @return {Object} The template data
     * @template
     */
    getSubTplData: function(fieldData) {
        var me = this,
            type = me.inputType,
            inputId = me.getInputId(),
            data;

        data = Ext.apply({
            ui: me.ui,
            id: inputId,
            cmpId: me.id,
            name: me.name || inputId,
            disabled: me.disabled,
            readOnly: me.readOnly,
            value: me.getRawValue(),
            type: type,
            fieldCls: me.fieldCls,
            fieldStyle: me.getFieldStyle(),
            childElCls: fieldData.childElCls,
            tabIdx: me.tabIndex,
            inputCls: me.inputCls,
            typeCls: Ext.baseCSSPrefix + 'form-' + (me.isTextInput ? 'text' : type),
            role: me.ariaRole
        }, me.subTplData);

        me.getInsertionRenderData(data, me.subTplInsertions);

        return data;
    },

    /**
     * Gets the markup to be inserted into the outer template's bodyEl. For fields this is the actual input element.
     * @protected
     */
    getSubTplMarkup: function(fieldData) {
        var me = this,
            data = me.getSubTplData(fieldData),
            preSubTpl = me.getTpl('preSubTpl'),
            postSubTpl = me.getTpl('postSubTpl'),
            markup = '';

        if (preSubTpl) {
            markup += preSubTpl.apply(data);
        }

        markup += me.getTpl('fieldSubTpl').apply(data);

        if (postSubTpl) {
            markup += postSubTpl.apply(data);
        }

        return markup;
    },

    initRenderData: function() {
        return Ext.applyIf(this.callParent(), this.getLabelableRenderData());
    },

    /**
     * Set the {@link #fieldStyle CSS style} of the {@link #inputEl field input element}.
     * @param {String/Object/Function} style The style(s) to apply. Should be a valid argument to {@link
     * Ext.dom.Element#applyStyles}.
     */
    setFieldStyle: function(style) {
        var me = this,
            inputEl = me.inputEl;
        if (inputEl) {
            inputEl.applyStyles(style);
        }
        me.fieldStyle = style;
    },

    getFieldStyle: function() {
        var style = this.fieldStyle;
        return Ext.isObject(style) ? Ext.DomHelper.generateStyles(style, null, true) : style || '';
    },

    // private
    onRender: function() {
        // This noOptimize can be removed after SDKTOOLS-946 is fixed
        // @noOptimize.callParent
        this.callParent(arguments);
        this.mixins.labelable.self.initTip();
        this.renderActiveError();
    },

    onFocusLeave: function(e) {
        this.callParent([e]);
        this.completeEdit();
    },

    /**
     * @protected
     * Called when focus leaves this input field.
     * Used to postprocess raw values and perform conversion and validation.
     */
    completeEdit: Ext.emptyFn,

    isFileUpload: function() {
        return this.inputType === 'file';
    },

    // private override to use getSubmitValue() as a convenience
    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            }
        }
        return data;
    },

    /**
     * Returns the value that would be included in a standard form submit for this field. This will be combined with the
     * field's name to form a name=value pair in the {@link #getSubmitData submitted parameters}. If an empty string is
     * returned then just the name= will be submitted; if null is returned then nothing will be submitted.
     *
     * Note that the value returned will have been {@link #processRawValue processed} but may or may not have been
     * successfully {@link #validate validated}.
     *
     * @return {String} The value to be submitted, or null.
     */
    getSubmitValue: function() {
        return this.processRawValue(this.getRawValue());
    },

    /**
     * Returns the raw value of the field, without performing any normalization, conversion, or validation. To get a
     * normalized and converted value see {@link #getValue}.
     * @return {String} value The raw String value of the field
     */
    getRawValue: function() {
        var me = this,
            v = (me.inputEl ? me.inputEl.getValue() : Ext.valueFrom(me.rawValue, ''));
        me.rawValue = v;
        return v;
    },

    /**
     * Sets the field's raw value directly, bypassing {@link #valueToRaw value conversion}, change detection, and
     * validation. To set the value with these additional inspections see {@link #setValue}.
     * @param {Object} value The value to set
     * @return {Object} value The field value that is set
     */
    setRawValue: function(value) {
        var me = this,
            rawValue = me.rawValue;

        if (!me.transformRawValue.$nullFn) {
            value = me.transformRawValue(value);
        }

        value = Ext.valueFrom(value, '');

        // We always need to go ahead with the set if valueContainsPlaceholder
        // TODO: Remobve this when IE8 retires and we can use HTML5 placeholder everywhere.
        if (rawValue === undefined || rawValue !== value || me.valueContainsPlaceholder) {
            me.rawValue = value;

            // Some Field subclasses may not render an inputEl
            if (me.inputEl) {
                me.bindChangeEvents(false);
                me.inputEl.dom.value = value;
                me.bindChangeEvents(true);
            }

            if (me.rendered && me.reference) {
                me.publishState('rawValue', value);
            }
        }

        return value;
    },
    
    /**
     * Transform the raw value before it is set
     * @protected
     * @param {Object} value The value
     * @return {Object} The value to set
     */
    transformRawValue: Ext.identityFn,

    /**
     * Converts a mixed-type value to a raw representation suitable for displaying in the field. This allows controlling
     * how value objects passed to {@link #setValue} are shown to the user, including localization. For instance, for a
     * {@link Ext.form.field.Date}, this would control how a Date object passed to {@link #setValue} would be converted
     * to a String for display in the field.
     *
     * See {@link #rawToValue} for the opposite conversion.
     *
     * The base implementation simply does a standard toString conversion, and converts {@link Ext#isEmpty empty values}
     * to an empty string.
     *
     * @param {Object} value The mixed-type value to convert to the raw representation.
     * @return {Object} The converted raw value.
     */
    valueToRaw: function(value) {
        return '' + Ext.valueFrom(value, '');
    },

    /**
     * Converts a raw input field value into a mixed-type value that is suitable for this particular field type. This
     * allows controlling the normalization and conversion of user-entered values into field-type-appropriate values,
     * e.g. a Date object for {@link Ext.form.field.Date}, and is invoked by {@link #getValue}.
     *
     * It is up to individual implementations to decide how to handle raw values that cannot be successfully converted
     * to the desired object type.
     *
     * See {@link #valueToRaw} for the opposite conversion.
     *
     * The base implementation does no conversion, returning the raw value untouched.
     *
     * @param {Object} rawValue
     * @return {Object} The converted value.
     * @method
     */
    rawToValue: Ext.identityFn,

    /**
     * Performs any necessary manipulation of a raw field value to prepare it for {@link #rawToValue conversion} and/or
     * {@link #validate validation}, for instance stripping out ignored characters. In the base implementation it does
     * nothing; individual subclasses may override this as needed.
     *
     * @param {Object} value The unprocessed string value
     * @return {Object} The processed string value
     * @method
     */
    processRawValue: Ext.identityFn,

    /**
     * Returns the current data value of the field. The type of value returned is particular to the type of the
     * particular field (e.g. a Date object for {@link Ext.form.field.Date}), as the result of calling {@link #rawToValue} on
     * the field's {@link #processRawValue processed} String value. To return the raw String value, see {@link #getRawValue}.
     * @return {Object} value The field value
     */
    getValue: function() {
        var me = this,
            val = me.rawToValue(me.processRawValue(me.getRawValue()));
        me.value = val;
        return val;
    },

    /**
     * Sets a data value into the field and runs the change detection and validation. To set the value directly
     * without these inspections see {@link #setRawValue}.
     * @param {Object} value The value to set
     * @return {Ext.form.field.Field} this
     */
    setValue: function(value) {
        var me = this;
        me.setRawValue(me.valueToRaw(value));
        return me.mixins.field.setValue.call(me, value);
    },

    onBoxReady: function() {
        var me = this;
        me.callParent(arguments);
        
        if (me.setReadOnlyOnBoxReady) {
            me.setReadOnly(me.readOnly);
        }
            
    },

    //private
    onDisable: function() {
        var me = this,
            inputEl = me.inputEl;
            
        me.callParent();
        if (inputEl) {
            inputEl.dom.disabled = true;
            if (me.hasActiveError()) {
                // clear invalid state since the field is now disabled
                me.clearInvalid();
                me.hadErrorOnDisable = true;
            }
        }

        // Disabled fields always validate to true, so if
        // wasValid is false, the state will have changed, but
        // we only want to do so if we have a previous wasValid value
        if (me.wasValid === false) {
            me.checkValidityChange(true);
        }
    },

    //private
    onEnable: function() {
        var me = this,
            inputEl = me.inputEl,
            mark = me.preventMark,
            valid;
            
        me.callParent();
        if (inputEl) {
            inputEl.dom.disabled = false;
        }

        if (me.wasValid !== undefined) {
            me.forceValidation = true;
            me.preventMark = !me.hadErrorOnDisable;
            valid = me.isValid();
            me.forceValidation = false;
            me.preventMark = mark;
            me.checkValidityChange(valid);
        }
        delete me.hadErrorOnDisable;
    },

    /**
     * Sets the read only state of this field.
     * @param {Boolean} readOnly Whether the field should be read only.
     */
    setReadOnly: function(readOnly) {
        var me = this,
            inputEl = me.inputEl,
            old = me.readOnly;

        readOnly = !!readOnly;
        me[readOnly ? 'addCls' : 'removeCls'](me.readOnlyCls);
        me.readOnly = readOnly;
        if (inputEl) {
            inputEl.dom.readOnly = readOnly;
        } else if (me.rendering) {
            me.setReadOnlyOnBoxReady = true;
        }
        if (readOnly !== old) {
            me.fireEvent('writeablechange', me, readOnly);
        }
    },

    // private
    fireKey: function(e){
        if(e.isSpecialKey()){
            this.fireEvent('specialkey', this, e);
        }
    },

    // private
    initEvents : function(){
        var me = this,
            inputEl = me.inputEl,
            onFieldMutation = me.onFieldMutation,
            events = me.checkChangeEvents,
            len = events.length,
            i, event;

        if (inputEl) {
            me.mon(inputEl, Ext.supports.SpecialKeyDownRepeat ? 'keydown' : 'keypress', me.fireKey,  me);

            for (i = 0; i < len; ++i) {
                event = events[i];
                if (event === 'propertychange') {
                    me.usesPropertychange = true;
                }
                if (event === 'textInput') {
                    me.usesTextInput = true;
                }
                me.mon(inputEl, event, onFieldMutation, me);
            }
        }
        me.callParent();
    },

    /*
     * @private
     * Called when some event (See the checkChangeEvents property) mutates the input field.
     * We react to changes.
     *
     * Subclasses may provide an inplementation which may perform other tasks (eg ComboBox value matching)
     * before calling the checkChange method.
     */
    onFieldMutation: function(e) {
        // When using propertychange, we want to skip out on various values, since they won't cause
        // the underlying value to change.
        var me = this,
            task = me.checkChangeTask;

        if (!me.readOnly && !(e.type === 'propertychange' && me.ignoreChangeRe.test(e.browserEvent.propertyName))) {
            if (!task) {
                me.checkChangeTask = task = new Ext.util.DelayedTask(me.doCheckChangeTask, me);
            }
            if (!me.bindNotifyListener) {
                // We continually create/destroy the listener as needed (see doCheckChangeTask) because we're listening
                // to a global event, so we don't want the event to be triggered unless absolutely necessary. In this case,
                // we only need to fix the value when we have a pending change to check.
                me.bindNotifyListener = Ext.on('beforebindnotify', me.onBeforeNotify, me, {destroyable: true});
            }
            task.delay(me.checkChangeBuffer);
        }
    },

    doCheckChangeTask: function() {
        var bindNotifyListener = this.bindNotifyListener;

        if (bindNotifyListener) {
            bindNotifyListener.destroy();
            this.bindNotifyListener = null;
        }
        this.checkChange();
    },

    publishValue: function () {
        var me = this;

        if (me.rendered && !me.getErrors().length) {
            me.publishState('value', me.getValue());
        }
    },

    /**
     * @private Called when the field's dirty state changes. Adds/removes the {@link #dirtyCls} on the main element.
     * @param {Boolean} isDirty
     */
    onDirtyChange: function (isDirty) {
        var me = this;

        me[isDirty ? 'addCls' : 'removeCls'](me.dirtyCls);

        if (me.rendered && me.reference) {
            me.publishState('dirty', isDirty);
        }
    },

    /**
     * Returns whether or not the field value is currently valid by {@link #getErrors validating} the
     * {@link #processRawValue processed raw value} of the field. **Note**: {@link #disabled} fields are
     * always treated as valid.
     *
     * @return {Boolean} True if the value is valid, else false
     */
    isValid: function() {
        var me = this,
            disabled = me.disabled,
            validate = me.forceValidation || !disabled;
            
        return validate ? me.validateValue(me.processRawValue(me.getRawValue())) : disabled;
    },

    /**
     * Uses {@link #getErrors} to build an array of validation errors. If any errors are found, they are passed to
     * {@link #markInvalid} and false is returned, otherwise true is returned.
     *
     * Previously, subclasses were invited to provide an implementation of this to process validations - from 3.2
     * onwards {@link #getErrors} should be overridden instead.
     *
     * @param {Object} value The value to validate
     * @return {Boolean} True if all validations passed, false if one or more failed
     */
    validateValue: function(value) {
        var me = this,
            errors = me.getErrors(value),
            isValid = Ext.isEmpty(errors);

        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            } else {
                me.markInvalid(errors);
            }
        }

        return isValid;
    },

    /**
     * @inheritdoc Ext.form.field.Field#markInvalid
     */
    markInvalid : function(errors) {
        // Save the message and fire the 'invalid' event
        var me = this,
            oldMsg = me.getActiveError(),
            active;
            
        me.setActiveErrors(Ext.Array.from(errors));
        active = me.getActiveError();
        if (oldMsg !== active) {
            me.setError(active);
        }
    },

    /**
     * Clear any invalid styles/messages for this field.
     *
     * **Note**: this method does not cause the Field's {@link #validate} or {@link #isValid} methods to return `true`
     * if the value does not _pass_ validation. So simply clearing a field's errors will not necessarily allow
     * submission of forms submitted with the {@link Ext.form.action.Submit#clientValidation} option set.
     */
    clearInvalid : function() {
        // Clear the message and fire the 'valid' event
        var me = this,
            hadError = me.hasActiveError();

        delete me.hadErrorOnDisable;
            
        me.unsetActiveError();
        if (hadError) {
            me.setError('');
        }
    },
    
    /**
     * Set the current error state
     * @private
     * @param {String} error The error message to set
     */
    setError: function(error){
        var me = this,
            msgTarget = me.msgTarget,
            prop;
            
        if (me.rendered) {
            if (msgTarget === 'title' || msgTarget === 'qtip') {
                prop = msgTarget === 'qtip' ? 'data-errorqtip' : 'title';
                me.getActionEl().dom.setAttribute(prop, error || '');
            } else {
                me.updateLayout();
            }
        }
    },

    /**
     * @private Overrides the method from the Ext.form.Labelable mixin to also add the invalidCls to the inputEl,
     * as that is required for proper styling in IE with nested fields (due to lack of child selector)
     */
    renderActiveError: function() {
        var me = this,
            hasError = me.hasActiveError(),
            invalidCls = me.invalidCls + '-field';

        if (me.inputEl) {
            // Add/remove invalid class
            me.inputEl[hasError ? 'addCls' : 'removeCls']([
                invalidCls, invalidCls + '-' + me.ui
            ]);
        }
        me.mixins.labelable.renderActiveError.call(me);
    },

    beforeDestroy: function() {
        var me = this,
            task = me.checkChangeTask;

        if (task) {
            task.cancel();
        }
        me.checkChangeTask = me.bindNotifyListener = Ext.destroy(me.bindNotifyListener);
        me.callParent();
    },

    privates: {
        applyBind: function (bind, currentBindings) {
            var me = this,
                valueBinding = currentBindings && currentBindings.value,
                bindings, newValueBind;

            bindings = me.callParent([ bind, currentBindings ]);

            newValueBind = bindings.value;
            me.hasBindingValue = !!newValueBind;

            if (newValueBind !== valueBinding && me.getInherited().modelValidation) {
                me.updateValueBinding(bindings);
            }

            return bindings;
        },

        applyRenderSelectors: function() {
            var me = this;

            me.callParent();

            // If the inputId config is not specified then normal childEls will pick up
            // our inputEl. Otherwise we need to get it now.
            if (!me.inputEl) {
                me.inputEl = me.el.getById(me.getInputId());
            }
        },

        // These 2 events trigger when setting the value programmatically in IE.
        // propertychange for older browsers, textInput for IE10+. Here we 
        bindChangeEvents: function(active) {
            var method = active ? 'resumeEvent' : 'suspendEvent',
                inputEl = this.inputEl;

            if (this.usesPropertychange) {
                inputEl[method]('propertychange');
            }

            if (this.usesTextInput) {
                inputEl[method]('textInput');
            }
        },

        getActionEl: function() {
            return this.inputEl || this.el;
        },

        getFocusEl: function() {
            return this.inputEl;
        },

        initRenderTpl: function() {
            var me = this;
            if (!me.hasOwnProperty('renderTpl')) {
                me.renderTpl = me.getTpl('labelableRenderTpl');
            }
            return me.callParent();
        },

        onBeforeNotify: function() {
            // This event is fired before the scheduler fires off any bindings.
            // If we happen to be in the state where we are pending a state change check,
            // force it to flush here so that we have the correct state in the viewmodel before
            // the bindings trigger, otherwise we may get an old value pushed into the field before
            // it runs the check.
            this.checkChangeTask.cancel();
            this.checkChange();
        },

        updateValueBinding: function (bindings) {
            var me = this,
                newBinding = bindings.value,
                fieldBinding = bindings.$fieldBinding;

            if (fieldBinding) {
                fieldBinding.destroy();
                bindings.$fieldBinding = null;
            }

            if (newBinding && newBinding.bindValidationField) {
                me.fieldBinding = newBinding.bindValidationField('setValidationField', me);
            }
        }
    },
    
    deprecated: {
        "5": {
            methods: {
                doComponentLayout: function() {
                    // In IE if propertychange is one of the checkChangeEvents, we need to remove
                    // the listener prior to layout and re-add it after, to prevent it from firing
                    // needlessly for attribute and style changes applied to the inputEl.
                    this.bindChangeEvents(false);
                    this.callParent(arguments);
                    this.bindChangeEvents(true);
                }
            }
        }
    }
});
