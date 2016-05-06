describe("Ext.data.writer.Xml", function(){
    var writer, buildWriter, makeOperation, buildRecords, Article, simpleData = {
        id: 1,
        title: 'Article 1',
        body: 'content1'
    }, recContent = '<record><id>1</id><title>Article 1</title><body>content1</body></record>',
       simpleXml = '<xmlData>' + recContent + '</xmlData>';
    
    beforeEach(function(){
        Ext.ClassManager.enableNamespaceParseCache = false; 
        buildWriter = function(cfg){
            cfg = Ext.apply({
                writeAllFields: true
            }, cfg);

            writer = new Ext.data.writer.Xml(cfg);
        };
        
        Article = Ext.define('spec.Article', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'id',    type: 'int'},
                {name: 'title', type: 'string'},
                {name: 'body',  type: 'string', writeName: 'content'}
            ]
        });
        
        buildRecords = function(recs){
            var out = [];
            Ext.each(recs, function(data){
                out.push(new Article(data));
            });
            return out;
        };
        
        makeOperation = function(records) {
            return new Ext.data.operation.Create({
                records: records
            });
        };
    });
    
    afterEach(function(){
        writer = buildWriter = buildRecords = makeOperation = null;
        Ext.ClassManager.enableNamespaceParseCache = true; 
        Ext.data.Model.schema.clear();
        Ext.undefine('spec.Article');
    });
    
    describe("initialization", function(){
        it("should default documentRoot to xmlData", function(){
            buildWriter();
            expect(writer.getDocumentRoot()).toBe('xmlData');
        });
        
        it("should default header to ''", function(){
            buildWriter();
            expect(writer.getHeader()).toBe('');
        });
        
        it("should default record to record", function(){
            buildWriter();
            expect(writer.getRecord()).toBe('record');
        });
    });
    
    describe("header", function(){
        it("should not push a header if one is not specified", function(){
            buildWriter();
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            expect(request.getXmlData()).toBe(simpleXml);
        });
        
        it("should append any header", function(){
            buildWriter({
                header: 'foo'
            });
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            expect(request.getXmlData()).toBe('foo' + simpleXml);
        });
    });
    
    describe("root", function(){
        it("should include the root by default", function(){
            buildWriter();
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            expect(request.getXmlData()).toBe(simpleXml);
        });
        
        it("should use any custom root specified", function(){
            buildWriter({
                documentRoot: 'customRoot'
            });
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            expect(request.getXmlData()).toBe(simpleXml.replace(/xmlData/g, 'customRoot'));
        });
        
        it("should exclude the root if the root is empty and there's 1 record", function(){
            buildWriter({
                documentRoot: ''
            });
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            expect(request.getXmlData()).toBe(recContent);
        });
        
        it("should force the defaultDocumentRoot if root is empty and there's more than 1 record", function(){
            buildWriter({
                documentRoot: ''
            });
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData, {
                    id: 2,
                    title: 'Article 2',
                    body: 'content2'
                }]))
            }));
            var content = [
                '<xmlData>',
                recContent,
                recContent.replace(/1/g, '2'),
                '</xmlData>'
            ];
            expect(request.getXmlData()).toBe(content.join(''));
        });
        
        it("should respect a custom defaultDocumentRoot", function(){
            buildWriter({
                documentRoot: '',
                defaultDocumentRoot: 'otherRoot'
            });
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData, {
                        id: 2,
                        title: 'Article 2',
                        body: 'content2'
                    }]))   
            }));
            var content = [
                '<otherRoot>',
                recContent,
                recContent.replace(/1/g, '2'),
                '</otherRoot>'
            ];
            expect(request.getXmlData()).toBe(content.join(''));
        });
    });
    
    describe("transform", function(){
        it("should invoke the transform function", function(){
            var transformFn = function(data) {
                return [{
                    id: 10,
                    title: 'Article 10',
                    body: 'content10'
                }];
            };
            
            buildWriter({
                transform: transformFn
            });
            
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            
            var expectedXml = "<xmlData><record><id>10</id><title>Article 10</title><body>content10</body></record></xmlData>";
            expect(request.getXmlData()).not.toBe(simpleXml);
            expect(request.getXmlData()).toEqual(expectedXml);
        });
        
        it("should invoke the transform function with the specified scope", function(){
            var mockScope = {};
            var transformFn = function(data) {
                expect(this).toEqual(mockScope);
                return [{
                    id: 10,
                    title: 'Article 10',
                    body: 'content10'
                }];
            };
            
            buildWriter({
                transform: {
                    fn: transformFn,
                    scope: mockScope
                }
            });
            
            var request = writer.write(new Ext.data.Request({
                operation: makeOperation(buildRecords([simpleData]))
            }));
            
            var expectedXml = "<xmlData><record><id>10</id><title>Article 10</title><body>content10</body></record></xmlData>";
            expect(request.getXmlData()).not.toBe(simpleXml);
            expect(request.getXmlData()).toEqual(expectedXml);
        });
    });

    describe('Nested XML', function() {
        it('should rebuild fully nested XML from mappings if nameProperty: "mapping" is used', function() {
            var Model = Ext.define('', {
                extend: 'Ext.data.Model',
                fields: [{
                    name: 'systemNumber', mapping: '@SystemNumber'
                }, {
                    name: 'systemName', mapping: 'SystemName'
                }, {
                    name: 'assetId', mapping: 'SystemMaster>AssetId'
                }, {
                    name: 'agilentModel', mapping: 'SystemMaster>AgilentModel'
                }, {
                    name: 'serialNumber', mapping: 'SystemMaster>SerialNumber'
                }, {
                    name: 'OCN', mapping: 'SystemMaster>OCN'
                }]
            }),
            
            // The compound record path means that a <SystemCatalog> element will wrap
            // the sequence of <SystemInfo> elements, so we do not need a documentRoot
            // so that must be false.
            writer = new Ext.data.writer.Xml({
                record: 'SystemCatalog>SystemInfo',
                writeRecordId: false,
                documentRoot: false,
                writeAllFields: true,
                nameProperty: 'mapping'
            }),
            records = [
                new Model({
                    systemNumber: '10118795',
                    systemName: 'Phase Noise Measurement System',
                    assetId: 'DE3208',
                    agilentModel : 'E5505A',
                    serialNumber: 'US44101357',
                    OCN: 'DES-0653'
                }),
                new Model({
                    systemNumber: '73645514',
                    systemName: 'Positronic Discombobulator',
                    assetId: 'PD123456',
                    agilentModel : 'X1234Z',
                    serialNumber: 'US12345678',
                    OCN: 'FOO-1234'
                })
            ],
            request = writer.write(new Ext.data.Request({
                operation: makeOperation(records)
            }));

            // Should recreate nested XML as per field mappings
            expect(request.getXmlData()).toBe(
                '<SystemCatalog>' +
                    '<SystemInfo SystemNumber="10118795">' +
                        '<SystemName>Phase Noise Measurement System</SystemName>' +
                        '<SystemMaster>' +
                            '<AssetId>DE3208</AssetId>' +
                            '<AgilentModel>E5505A</AgilentModel>' +
                            '<SerialNumber>US44101357</SerialNumber>' +
                            '<OCN>DES-0653</OCN>' +
                        '</SystemMaster>' +
                    '</SystemInfo>' +
                    '<SystemInfo SystemNumber="73645514">' +
                        '<SystemName>Positronic Discombobulator</SystemName>' +
                        '<SystemMaster>' +
                            '<AssetId>PD123456</AssetId>' +
                            '<AgilentModel>X1234Z</AgilentModel>' +
                            '<SerialNumber>US12345678</SerialNumber>' +
                            '<OCN>FOO-1234</OCN>' +
                        '</SystemMaster>' +
                    '</SystemInfo>' +
                '</SystemCatalog>'
            );
        });
    });
});
