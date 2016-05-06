/**
 * A Ext.mixin.Observable subclass that is provided for backward compatibility.
 * Applications should avoid using this class, and use Ext.mixin.Observable instead.
 */
Ext.define('Ext.util.Observable', {
    extend: 'Ext.mixin.Observable',

    // The constructor of Ext.util.Observable instances processes the config object by
    // calling Ext.apply(this, config); instead of this.initConfig(config);
    $applyConfigs: true
}, function(Observable) {
    var Super = Ext.mixin.Observable;

    /**
     * @method releaseCapture
     * @static
     * @inheritdoc Ext.mixin.Observable#releaseCapture
     */
    Observable.releaseCapture = Super.releaseCapture;

    /**
     * @method capture
     * @static
     * @inheritdoc Ext.mixin.Observable#capture
     */
    Observable.capture = Super.capture;

    // private
    Observable.captureArgs = Super.captureArgs;

    /**
     * @method observe
     * @static
     * @inheritdoc Ext.mixin.Observable#observe
     */
    Observable.observe = Observable.observeClass = Super.observe;
});
