Ext.apply(Ext.form.field.VTypes, {
	daterange(val, field) {
		const date = field.parseDate(val);

		if (!date) {
			return false;
		}
		if (field.startDateField && (!this.dateRangeMax || (date.getTime() !== this.dateRangeMax.getTime()))) {
			const start = field.up('form').down('#' + field.startDateField);
			start.setMaxValue(date);
			start.validate();
			this.dateRangeMax = date;
		} else if (field.endDateField && (!this.dateRangeMin || (date.getTime() !== this.dateRangeMin.getTime()))) {
			const end = field.up('form').down('#' + field.endDateField);
			end.setMinValue(date);
			end.validate();
			this.dateRangeMin = date;
		}
		/*
		* Always return true since we're only using this vtype to set the
		* min/max allowed values (these are tested for after the vtype test)
		*/
		return true;
	},

	daterangeText: 'Start date must be less than end date',

	password(val, field) {
		if (field.initialPassField) {
			const pwd = field.up('form').down('#' + field.initialPassField);
			return (val === pwd.getValue());
		}
		return true;
	},

	passwordText: 'Passwords do not match'
});
