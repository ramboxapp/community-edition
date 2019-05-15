/**
 * Per default scrolling the tab bar moves the tabs 20 pixels.
 * To improve the usability of the tab bar this value is increased for Rambox-OS.
 * Also animations are enabled, so the user understands what's going on.
 */
Ext.define('Rambox.overrides.layout.container.boxOverflow.Scroller', {
	override: 'Ext.layout.container.boxOverflow.Scroller',

	scrollIncrement: 250,
	wheelIncrement: 50,

	animateScroll: true,
	scrollDuration: 250,

	/**
	 * In difference to the overridden function this one enables scroll animations.
	 *
	 * @private
	 * Scrolls to the left by the configured amount
	 */
	scrollLeft() {
		this.scrollBy(-this.scrollIncrement);
	},

	/**
	 * In difference to the overridden function this one enables scroll animations.
	 *
	 * @private
	 * Scrolls to the right by the configured amount
	 */
	scrollRight() {
		this.scrollBy(this.scrollIncrement);
	}
});
