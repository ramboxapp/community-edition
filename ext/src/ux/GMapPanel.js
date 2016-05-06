/**
 * @author Shea Frederick
 *
 * The GMap Panel UX extends `Ext.panel.Panel` in order to display Google Maps.
 *
 * It is important to note that you must include the following Google Maps API above bootstrap.js in your 
 * application's index.html file (or equivilant).
 *
 *     <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3&sensor=false"></script>
 *
 * It is important to note that due to the Google Maps loader, you cannot currently include
 * the above JS resource in the Cmd generated app.json file.  Doing so interferes with the loading of
 * Ext JS and Google Maps. 
 *
 * The following example creates a window containing a GMap Panel.  In this case, the center 
 * is set as geoCodeAddr, which is a string that Google translates into longitude and latitude.
 * 
 *     var mapwin = Ext.create('Ext.Window', {
 *         layout: 'fit',
 *         title: 'GMap Window',
 *         width: 450,
 *         height: 250,
 *         items: {
 *             xtype: 'gmappanel',
 *             gmapType: 'map',
 *             center: {
 *                 geoCodeAddr: "221B Baker Street",
 *                 marker: {
 *                     title: 'Holmes Home'
 *                 }
 *             },
 *             mapOptions : {
 *                 mapTypeId: google.maps.MapTypeId.ROADMAP
 *             }
 *         }
 *     }).show();
 * 
 */
Ext.define('Ext.ux.GMapPanel', {
    extend: 'Ext.panel.Panel',
    
    alias: 'widget.gmappanel',
    
    requires: ['Ext.window.MessageBox'],
    
    initComponent : function(){
        Ext.applyIf(this,{
            plain: true,
            gmapType: 'map',
            border: false
        });
        
        this.callParent();        
    },
    
    onBoxReady : function(){
        var center = this.center;
        this.callParent(arguments);       
        
        if (center) {
            if (center.geoCodeAddr) {
                this.lookupCode(center.geoCodeAddr, center.marker);
            } else {
                this.createMap(center);
            }
        } else {
            Ext.Error.raise('center is required');
        }
              
    },
    
    createMap: function(center, marker) {
        var options = Ext.apply({}, this.mapOptions);
        
        options = Ext.applyIf(options, {
            zoom: 14,
            center: center,
            mapTypeId: google.maps.MapTypeId.HYBRID
        });
        this.gmap = new google.maps.Map(this.body.dom, options);
        if (marker) {
            this.addMarker(Ext.applyIf(marker, {
                position: center
            }));
        }
        
        Ext.each(this.markers, this.addMarker, this);
        this.fireEvent('mapready', this, this.gmap);
    },
    
    addMarker: function(marker) {
        marker = Ext.apply({
            map: this.gmap
        }, marker);
        
        if (!marker.position) {
            marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        }
        var o =  new google.maps.Marker(marker);
        Ext.Object.each(marker.listeners, function(name, fn){
            google.maps.event.addListener(o, name, fn);    
        });
        return o;
    },
    
    lookupCode : function(addr, marker) {
        this.geocoder = new google.maps.Geocoder();
        this.geocoder.geocode({
            address: addr
        }, Ext.Function.bind(this.onLookupComplete, this, [marker], true));
    },
    
    onLookupComplete: function(data, response, marker){
        if (response != 'OK') {
            Ext.MessageBox.alert('Error', 'An error occured: "' + response + '"');
            return;
        }
        this.createMap(data[0].geometry.location, marker);
    },
    
    afterComponentLayout : function(w, h){
        this.callParent(arguments);
        this.redraw();
    },
    
    redraw: function(){
        var map = this.gmap;
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    }
 
});
