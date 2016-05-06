/**
 * @class Ext.data.writer.Xml
 * This class is used to write {@link Ext.data.Model} data to the server in an XML format.
 * The {@link #documentRoot} property is used to specify the root element in the XML document.
 * The {@link #record} option is used to specify the element name for each record that will make up the XML document.
 */
Ext.define('Ext.data.writer.Xml', {
    
    /* Begin Definitions */
    
    extend: 'Ext.data.writer.Writer',
    alternateClassName: 'Ext.data.XmlWriter',
    
    alias: 'writer.xml',
    
    /* End Definitions */
    
    config: {
        /**
         * @cfg {String} documentRoot The name of the root element of the document. Defaults to <tt>'xmlData'</tt>.
         * If there is more than 1 record and the root is not specified, the default document root will still be used
         * to ensure a valid XML document is created.
         *
         * If the {@link #record} mapping includes a root element name, eg: "SystemInfo>Operation", and
         * the selector includes the root element name, then you must configure this as `false`
         */
        documentRoot: 'xmlData',
        
        /**
         * @cfg {String} defaultDocumentRoot The root to be used if {@link #documentRoot} is empty and a root is required
         * to form a valid XML document.
         */
        defaultDocumentRoot: 'xmlData',
    
        /**
         * @cfg {String} header A header to use in the XML document (such as setting the encoding or version).
         * Defaults to <tt>''</tt>.
         */
        header: '',
    
        /**
         * @cfg {String} record The name of the node to use for each record. Defaults to
         * the owning {@link Ext.data.proxy.Proxy Proxy}'s {@link Ext.data.reader.Xml Reader}'s
         * {@link Ext.data.reader.Xml#record} setting, or `'record'`.
         */
        record: 'record'
    },

    // To break simple XPath selectors like "SystemInfo>SystemName" into ["SystemInfo", "SystemName"]
    selectorRe: /[^>\s]+/g,

    //inherit docs
    writeRecords: function(request, data) {
        var me = this,
            xml = [],
            i = 0,
            len = data.length,
            root = me.getDocumentRoot(),
            recordName = me.getRecord(),

            // Convert eg 'Items>Item' into ['Items', 'Item']
            record = recordName.match(this.selectorRe),
            recLen = record.length,

            // Need a containing element if there are multiple data records and
            // it's not a compound record selector
            needsRoot = data.length !== 1 && recLen === 1,
            transform;
            
        transform = this.getTransform();
        if (transform) {
            data = transform(data, request);
        }
        
        // may not exist
        xml.push(me.getHeader() || '');
        
        if (!root && needsRoot) {
            root = me.getDefaultDocumentRoot();
        }

        // May not exist if configured as false, and the record selector is rooted, eg "Items>Item"
        if (root) {
            xml.push('<', root, '>');
        }

        // Output record nodes' wrapping, eg "<Items>" from record "Items>Item"->["Items", "Item"]
        for (i = 0; i < recLen - 1; i++) {
            xml.push('<', record[i], '>');
        }
        recordName = record[i];
        for (i = 0; i < len; ++i) {
            this.objectToElement(recordName, data[i], xml);
        }
        
        // Close record nodes' wrapping, eg "</Items>" from record "Items>Item"->["Items", "Item"]
        for (i = recLen - 2; i > -1; i--) {
            xml.push('</', record[i], '>');
        }
        if (root) {
            xml.push('</', root, '>');
        }
            
        request.setXmlData(xml.join(''));
        return request;
    },

    /**
     * Serializes an object to XML.
     * Properties will be serialized as child elements unless their first character is `'@'`
     *
     * For example:
     *
     *    myWriter.objectToElement('SystemComponent', {
     *        "@SystemNumber": '10118795',
     *        "SystemInfo>SystemName": 'Phase Noise Measurement System',
     *        AssetId: 'DE3208',
     *        AgilentModel: 'E5505A',
     *        SerialNumber: 'US44101357',
     *    }, []).join('');
     *
     * becomes
     *
     *    <SystemComponent SystemNumber="10118795">
     *      <SystemInfo>
     *          <SystemName>Phase Noise Measurement System</SystemName>
     *      </SystemInfo>
     *      <AssetId>DE3208</AssetId>
     *      <AgilentModel>E5505A</AgilentModel>
     *      <SerialNumber>US44101357</SerialNumber>
     *    </SystemComponent>
     *    
     * @param {String} name The element name for the object.
     * @param {Object} o The object to serialize.
     * @param {Array} [output] The array into which to serialize the object.
     * @return {undefined}
     */
    objectToElement: function(name, o, output) {
        var key,
            datum,
            subOutput = [],
            subKeys,
            subKeyLen,
            i,
            subObject,
            subObjects,
            lastObject,
            lastKey;

        if (!output) {
            output = [];
        }

        // Open the record node, eg "<Item"
        // Stop there because some child properties may be attributes.
        output.push('<', name);
        for (key in o) {
            datum = o[key];

            // Attribute node
            if (key[0] === '@') {
                output.push(' ', key.substr(1), '="', datum, '"');
            }
            // Child element node
            else {
                // Object properties become child elements
                if (typeof datum === 'object') {
                    this.objectToElement(key, datum, subOutput);
                } else {
                    // Is it a selector?
                    subKeys = key.match(this.selectorRe);

                    // key was eg "foo > bar".
                    // Ensure looks like contains {foo: {bar: {}}}
                    if ((subKeyLen = subKeys.length) > 1) {
                        subObjects = subObjects || {};
                        for (subObject = subObjects, i = 0; i < subKeyLen; i++) {
                            lastObject = subObject;
                            lastKey = subKeys[i];
                            subObject = subObject[lastKey] || (subObject[lastKey] = {});
                        }
                        // lastObject is now the bar property in the above example
                        lastObject[lastKey] = datum;
                    } else {
                        subOutput.push('<', key, '>', datum, '</', key, '>');
                    }
                }
            }
        }
        output.push('>');
        output.push.apply(output, subOutput);

        // Output any embedded nodes that were specified by child element mappings like "SystemInfo>SystemName"
        if (subObjects) {
            for (key in subObjects) {
                datum = subObjects[key];
                this.objectToElement(key, datum, output);
            }
        }

        // Close the record node, eg "</Item>"
        output.push('</', name, '>');

        return output;
    }
});
