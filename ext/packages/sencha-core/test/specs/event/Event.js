describe("Ext.event.Event", function() {
    var E = Ext.event.Event,
        e;
    
    function makeKeyEvent(config) {
        e = new E(Ext.apply({
            type: 'keydown'
        }, config));
        
        return e;
    }
    
    describe("isNavKeyPress", function() {
        var suite, i, len,
            suites = [{
                name: 'Arrow keys',
                isScrollable: true,
                keys: [
                    { name: 'PageUp', code: E.PAGE_UP },
                    { name: 'PageDown', code: E.PAGE_DOWN },
                    { name: 'Home', code: E.HOME },
                    { name: 'End', code: E.END },
                    { name: 'Left', code: E.LEFT },
                    { name: 'Up', code: E.UP },
                    { name: 'Right', code: E.RIGHT },
                    { name: 'Down', code: E.DOWN }
                ]
            }, {
                name: 'Enter/Tab/Esc',
                isScrollable: false,
                keys: [
                    { name: 'Enter', code: E.ENTER },
                    { name: 'Tab', code: E.TAB },
                    { name: 'Esc', code: E.ESC }
                ]
            }];
        
        function createSuite(name, keys, isScrollable) {
            describe(name, function() {
                var key, keyName, keyCode, i, len;
                
                for (i = 0, len = keys.length; i < len; i++) {
                    keyName = keys[i].name;
                    keyCode = keys[i].code;
                    
                    describe(keyName, function() {
                        beforeEach(function() {
                            makeKeyEvent({
                                keyCode: keyCode
                            });
                        });
                        
                        it("should return true w/ !scrollableOnly", function() {
                            expect(e.isNavKeyPress()).toBe(true);
                        });
                    
                        it("should return " + isScrollable + " w/ scrollableOnly", function() {
                            expect(e.isNavKeyPress(true)).toBe(isScrollable);
                        });
                    });
                }
            });
        }
        
        for (i = 0, len = suites.length; i < len; i++) {
            suite = suites[i];
            
            createSuite(suite.name, suite.keys, suite.isScrollable);
        }
    });
});
