# Sencha Touch AMF

Sencha Touch AMF is an implementation of the [Action Message Format](http://en.wikipedia.org/wiki/Action_Message_Format) (AMF and AMFX) protocols for use with the Sencha Touch Ext.direct class. AMF 
is a compact binary format used by Adobe Flash/Flex to serialize ActionScript
object graphs.  AMF is typically used to encode messages that are sent between
an Adobe Flash client and a remote service.  AMF is only a serialization
technology, not a transport, so AMF encoded binary data can be used with any
transport such as HTTP or HTTPS.

You can use the AmfRemotingProvider to make remote method invocation (RMI) calls 
to a server, or as a way to provide APIs for a Direct Store to connect a data 
source to a ListView or DataView.

For more information, please see the documentation for `Ext.direct.AmfRemotingProvider`.

**Note:** Sencha AMF is only distributed as part of [Sencha Touch Bundle](http://www.sencha.com/products/touch-bundle/) and [Sencha Complete](http://www.sencha.com/products/complete).

## Requiring AMF

The AMF class is not part of the core Sencha Touch framework, rather it is distributed as a package. As such, AMF is not immediately available for use within your Touch application and needs to be added as a required package. 

Requiring the AMF package is a simple 3-step procedure

1. Edit your application's **app.json** file and add the `sencha-amf` package to the requires section:

    <code>
        requires: [ 'sencha-amf' ]
    </code>

2. If not already present, add the following property to the file **.sencha/app/sencha.cfg**:
    
    <code>
        framework.packages.dir=${framework.dir}/packages
    </code>

3. Refresh your application:

    sencha app refresh 

The AMF classes are now available for use within your application.

