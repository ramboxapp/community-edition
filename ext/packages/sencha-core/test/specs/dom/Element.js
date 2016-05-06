describe("Ext.dom.Element", function() {
    describe("instantiation", function() {
        var element, domEl;

        beforeEach(function() {
            domEl = document.createElement('div');
            document.body.appendChild(domEl);
        });

        afterEach(function() {
            var el = Ext.cache[domEl.id];

            if (el) {
                el.destroy();
            } else {
                document.body.removeChild(domEl);
            }
        });

        it("should set dom element id if it hasn't already one", function() {
            element = new Ext.dom.Element(domEl);

            expect(domEl.id).toBeDefined();
        });

        it("should not set dom element id if it has already one", function() {
            var id = Ext.id();

            domEl.id = id;
            element = new Ext.dom.Element(domEl);

            expect(domEl.id).toEqual(id);
        });

        it("should set dom property to dom element", function() {
            element = new Ext.dom.Element(domEl);

            expect(element.dom).toBe(domEl);
        });

        it("should set id property to dom id", function() {
            var id = Ext.id();

            domEl.id = id;
            element = new Ext.dom.Element(domEl);

            expect(element.id).toEqual(id);
        });

        it("should find a dom element if a string corresponding to it's id is passed as first argument", function() {
            var id = Ext.id();

            domEl.id = id;

            element = new Ext.dom.Element(id);

            expect(element.dom).toBe(domEl);
        });

        it("should throw error if the Element has an invalid id", function() {
            function expectError(id) {
                var dom = document.createElement('div');
                dom.id = id;
                document.body.appendChild(dom);
                expect(function() {
                    new Ext.Element(dom);
                }).toThrow('Invalid Element "id": "' + id + '"');
                document.body.removeChild(dom);
            }
            expectError('.abcdef');
            expectError('0a...');
            expectError('12345');
            expectError('.abc-def');
            expectError('<12345/>');
            expectError('1<>234.567');
        });
    });

    function describeMethods(fly) {
        describe('methods (using ' + (fly ? 'Ext.fly()' : 'new Ext.dom.Element()') + ')', function(){
            var domEl, element;

            function addElement(tag) {
                domEl = document.createElement(tag || 'div');
                document.body.appendChild(domEl);
                return fly ? Ext.fly(domEl) : Ext.get(domEl);
            }
            
            afterEach(function() {
                if (element) {
                    // Prevent console warnings
                    spyOn(Ext.Logger, 'warn');
                    element.destroy();
                    element = null;
                }
            });

            describe("classes", function() {
                describe("addCls", function() {
                    beforeEach(function() {
                        element = addElement();
                        domEl = element.dom;
                    });

                    it("should not throw an exception when className is null", function() {
                        expect(function() {
                            element.addCls(null);
                        }).not.toThrow();
                    });

                    describe("return type", function() {
                        it("should return the element when the class is null", function() {
                            expect(element.addCls(null)).toBe(element);
                        });

                        it("should return the element when the class is a string", function() {
                            expect(element.addCls('foo')).toBe(element);
                        });

                        it("should return the element when the class is an array", function() {
                            expect(element.addCls(['foo', 'bar'])).toBe(element);
                        });
                    });

                    describe("argument types", function() {
                        describe("with a string", function() {
                            describe("without spaces", function() {
                                it("should add a class to the element", function() {
                                    element.addCls('foo');
                                    expect(domEl.className).toBe('foo');
                                });

                                it("should add a class when another class already exists", function() {
                                    domEl.className = 'foo';
                                    element.addCls('bar');
                                    expect(domEl.className).toBe('foo bar');
                                });

                                it("should not duplicate the class if it exists on the element", function() {
                                    domEl.className = 'foo';
                                    element.addCls('foo');
                                    expect(domEl.className).toBe('foo');
                                });

                                describe("prefix & suffix", function() {
                                    describe("prefix only", function() {
                                        it("should attach the prefix to the class", function() {
                                            element.addCls('foo', 'a');
                                            expect(domEl.className).toBe('a-foo');
                                        });

                                        it("should use the prefix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo', 'a');
                                            expect(domEl.className).toBe('foo a-foo');
                                        });
                                    });

                                    describe("suffix only", function() {
                                        it("should attach the suffix to the class", function() {
                                            element.addCls('foo', null, 'b');
                                            expect(domEl.className).toBe('foo-b');
                                        });

                                        it("should use the suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo', null, 'b');
                                            expect(domEl.className).toBe('foo foo-b');
                                        });
                                    });

                                    describe("prefix and suffix", function() {
                                        it("should attach the prefix & suffix to the class", function() {
                                            element.addCls('foo', 'a', 'b');
                                            expect(domEl.className).toBe('a-foo-b');
                                        });

                                        it("should use the prefix & suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo', 'a', 'b');
                                            expect(domEl.className).toBe('foo a-foo-b');
                                        });
                                    });
                                });
                            });

                            describe("with spaces", function() {
                                it("should split class names by string and add them separately", function() {
                                    element.addCls('foo bar');
                                    expect(domEl.className).toBe('foo bar');
                                });

                                it("should split by multiple spaces", function() {
                                    element.addCls('foo    bar           baz');
                                    expect(domEl.className).toBe('foo bar baz');
                                });

                                it("should trim leading spaces", function() {
                                    expect(element.addCls('     foo bar'));
                                    expect(domEl.className).toBe('foo bar');
                                });

                                it("should trim trailing spaces", function() {
                                    expect(element.addCls('foo bar           '));
                                    expect(domEl.className).toBe('foo bar');
                                });

                                it("should only add new classes to the element", function() {
                                    element.dom.className = 'bar';
                                    element.addCls('foo bar');
                                    expect(domEl.className).toBe('bar foo');  
                                });

                                describe("prefix & suffix", function() {
                                    describe("prefix only", function() {
                                        it("should attach the prefix to the class", function() {
                                            element.addCls('foo bar', 'a');
                                            expect(domEl.className).toBe('a-foo a-bar');
                                        });

                                        it("should use the prefix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo bar', 'a');
                                            expect(domEl.className).toBe('foo a-foo a-bar');
                                        });
                                    });

                                    describe("suffix only", function() {
                                        it("should attach the suffix to the class", function() {
                                            element.addCls('foo bar', null, 'b');
                                            expect(domEl.className).toBe('foo-b bar-b');
                                        });

                                        it("should use the suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo bar', null, 'b');
                                            expect(domEl.className).toBe('foo foo-b bar-b');
                                        });
                                    });

                                    describe("prefix and suffix", function() {
                                        it("should attach the prefix & suffix to the class", function() {
                                            element.addCls('foo bar', 'a', 'b');
                                            expect(domEl.className).toBe('a-foo-b a-bar-b');
                                        });

                                        it("should use the prefix & suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.addCls('foo bar', 'a', 'b');
                                            expect(domEl.className).toBe('foo a-foo-b a-bar-b');
                                        });
                                    });
                                });
                            });
                        });

                        describe("with an array", function() {
                            it("should add all classes to the element", function() {
                                element.addCls(['foo', 'bar']);
                                expect(domEl.className).toBe('foo bar');
                            });

                            it("should only add new classes to the element", function() {
                                element.dom.className = 'bar';
                                element.addCls(['foo', 'bar']);
                                expect(domEl.className).toBe('bar foo');  
                            });

                            describe("prefix & suffix", function() {
                                describe("prefix only", function() {
                                    it("should attach the prefix to the class", function() {
                                        element.addCls(['foo', 'bar'], 'a');
                                        expect(domEl.className).toBe('a-foo a-bar');
                                    });

                                    it("should use the prefix when comparing if the class exists", function() {
                                        domEl.className = 'foo';
                                        element.addCls(['foo', 'bar'], 'a');
                                        expect(domEl.className).toBe('foo a-foo a-bar');
                                    });
                                });

                                describe("suffix only", function() {
                                    it("should attach the suffix to the class", function() {
                                        element.addCls(['foo', 'bar'], null, 'b');
                                        expect(domEl.className).toBe('foo-b bar-b');
                                    });

                                    it("should use the suffix when comparing if the class exists", function() {
                                        domEl.className = 'foo';
                                        element.addCls(['foo', 'bar'], null, 'b');
                                        expect(domEl.className).toBe('foo foo-b bar-b');
                                    });
                                });

                                describe("prefix and suffix", function() {
                                    it("should attach the prefix & suffix to the class", function() {
                                        element.addCls(['foo', 'bar'], 'a', 'b');
                                        expect(domEl.className).toBe('a-foo-b a-bar-b');
                                    });

                                    it("should use the prefix & suffix when comparing if the class exists", function() {
                                        domEl.className = 'foo';
                                        element.addCls(['foo', 'bar'], 'a', 'b');
                                        expect(domEl.className).toBe('foo a-foo-b a-bar-b');
                                    });
                                });
                            });
                        });
                    });

                    describe("matching", function() {
                        it("should not match a leading substring as an existing class", function() {
                            domEl.className = 'foobar';
                            element.addCls('foo');
                            expect(domEl.className).toBe('foobar foo');
                        });

                        it("should not match a trailing substring as an existing class", function() {
                            domEl.className = 'barfoo';
                            element.addCls('foo');
                            expect(domEl.className).toBe('barfoo foo');
                        });

                        it("should not match a substring as an existing class", function() {
                            domEl.className = 'xfooy';
                            element.addCls('foo');
                            expect(domEl.className).toBe('xfooy foo');
                        });
                    });
                });

                describe("removeCls", function() {
                    beforeEach(function() {
                        element = addElement();
                        domEl = element.dom;
                    });

                    it("should not throw an exception when className is null", function() {
                        expect(function() {
                            element.removeCls(null);
                        }).not.toThrow();
                    });

                    describe("return type", function() {
                        it("should return the element when the class is null", function() {
                            expect(element.removeCls(null)).toBe(element);
                        });

                        it("should return the element when the class is a string", function() {
                            expect(element.removeCls('foo')).toBe(element);
                        });

                        it("should return the element when the class is an array", function() {
                            expect(element.removeCls(['foo', 'bar'])).toBe(element);
                        });
                    });

                    describe("argument types", function() {
                        describe("with a string", function() {
                            describe("without spaces", function() {
                                it("should remove a class from the element", function() {
                                    domEl.className = 'foo bar';
                                    element.removeCls('foo');
                                    expect(domEl.className).toBe('bar');
                                });

                                it("should do nothing when the class is empty", function() {
                                    domEl.className = '';
                                    element.removeCls('bar');
                                    expect(domEl.className).toBe('');
                                });

                                it("should only remove the specified class", function() {
                                    domEl.className = 'foo bar baz';
                                    element.removeCls('bar');
                                    expect(domEl.className).toBe('foo baz');
                                });

                                describe("prefix & suffix", function() {
                                    describe("prefix only", function() {
                                        it("should attacj the prefix to the class", function() {
                                            domEl.className = 'a-foo'
                                            element.removeCls('foo', 'a');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the prefix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.removeCls('foo', 'a');
                                            expect(domEl.className).toBe('foo');
                                        });
                                    });

                                    describe("suffix only", function() {
                                        it("should attach the suffix to the class", function() {
                                            domEl.className = 'foo-b';
                                            element.removeCls('foo', null, 'b');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.removeCls('foo', null, 'b');
                                            expect(domEl.className).toBe('foo');
                                        });
                                    });

                                    describe("prefix and suffix", function() {
                                        it("should attach the prefix & suffix to the class", function() {
                                            domEl.className = 'a-foo-b';
                                            element.removeCls('foo', 'a', 'b');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the prefix & suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo';
                                            element.removeCls('foo', 'a', 'b');
                                            expect(domEl.className).toBe('foo');
                                        });
                                    });
                                });
                            });

                            describe("with spaces", function() {
                                it("should split class names by string and remove them separately", function() {
                                    domEl.className = 'bar foo';
                                    element.removeCls('foo bar');
                                    expect(domEl.className).toBe('');
                                });

                                it("should split by multiple spaces", function() {
                                    domEl.className = 'foo bar baz';
                                    element.removeCls('foo    bar           baz');
                                    expect(domEl.className).toBe('');
                                });

                                it("should trim leading spaces", function() {
                                    domEl.className = 'foo bar baz';
                                    expect(element.removeCls('     foo bar'));
                                    expect(domEl.className).toBe('baz');
                                });

                                it("should trim trailing spaces", function() {
                                    domEl.className = 'foo bar baz';
                                    expect(element.removeCls('foo bar           '));
                                    expect(domEl.className).toBe('baz');
                                });

                                it("should only remove matching classes to the element", function() {
                                    element.dom.className = 'foo bar baz';
                                    element.removeCls('foo');
                                    expect(domEl.className).toBe('bar baz');  
                                });

                                describe("prefix & suffix", function() {
                                    describe("prefix only", function() {
                                        it("should attach the prefix to the class", function() {
                                            domEl.className = 'a-foo a-bar';
                                            element.removeCls('foo bar', 'a');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the prefix when comparing if the class exists", function() {
                                            domEl.className = 'a-foo bar';
                                            element.removeCls('foo bar', 'a');
                                            expect(domEl.className).toBe('bar');
                                        });
                                    });

                                    describe("suffix only", function() {
                                        it("should attach the suffix to the class", function() {
                                            domEl.className = 'foo-b bar-b';
                                            element.removeCls('foo bar', null, 'b');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo-b bar';
                                            element.removeCls('foo bar', null, 'b');
                                            expect(domEl.className).toBe('bar');
                                        });
                                    });

                                    describe("prefix and suffix", function() {
                                        it("should attach the prefix & suffix to the class", function() {
                                            domEl.className = 'a-foo-b a-bar-b';
                                            element.removeCls('foo bar', 'a', 'b');
                                            expect(domEl.className).toBe('');
                                        });

                                        it("should use the prefix & suffix when comparing if the class exists", function() {
                                            domEl.className = 'foo a-bar-b';
                                            element.removeCls('foo bar', 'a', 'b');
                                            expect(domEl.className).toBe('foo');
                                        });
                                    });
                                });
                            });
                        });

                        describe("with an array", function() {
                            it("should remove all classes from the element", function() {
                                domEl.className = 'foo bar baz';
                                element.removeCls(['foo', 'bar']);
                                expect(domEl.className).toBe('baz');
                            });

                            it("should only remove specified classes from the element", function() {
                                domEl.className = 'foo bar baz';
                                element.removeCls(['foo', 'baz']);
                                expect(domEl.className).toBe('bar');  
                            });

                            describe("prefix & suffix", function() {
                                describe("prefix only", function() {
                                    it("should attach the prefix to the class", function() {
                                        domEl.className = 'a-foo a-bar';
                                        element.removeCls(['foo', 'bar'], 'a');
                                        expect(domEl.className).toBe('');
                                    });

                                    it("should use the prefix when comparing if the class exists", function() {
                                        domEl.className = 'a-foo bar';
                                        element.removeCls(['foo', 'bar'], 'a');
                                        expect(domEl.className).toBe('bar');
                                    });
                                });

                                describe("suffix only", function() {
                                    it("should attach the suffix to the class", function() {
                                        domEl.className = 'foo-b bar-b';
                                        element.removeCls(['foo', 'bar'], null, 'b');
                                        expect(domEl.className).toBe('');
                                    });

                                    it("should use the suffix when comparing if the class exists", function() {
                                        domEl.className = 'foo-b bar';
                                        element.removeCls(['foo', 'bar'], null, 'b');
                                        expect(domEl.className).toBe('bar');
                                    });
                                });

                                describe("prefix and suffix", function() {
                                    it("should attach the prefix & suffix to the class", function() {
                                        domEl.className = 'a-foo-b a-bar-b';
                                        element.removeCls(['foo', 'bar'], 'a', 'b');
                                        expect(domEl.className).toBe('');
                                    });

                                    it("should use the prefix & suffix when comparing if the class exists", function() {
                                        domEl.className = 'foo a-bar-b';
                                        element.removeCls(['foo', 'bar'], 'a', 'b');
                                        expect(domEl.className).toBe('foo');
                                    });
                                });
                            });
                        });
                    });

                    describe("matching", function() {
                        it("should not match a leading substring as an existing class", function() {
                            domEl.className = 'foobar';
                            element.removeCls('foo');
                            expect(domEl.className).toBe('foobar');
                        });

                        it("should not match a trailing substring as an existing class", function() {
                            domEl.className = 'barfoo';
                            element.removeCls('foo');
                            expect(domEl.className).toBe('barfoo');
                        });

                        it("should not match a substring as an existing class", function() {
                            domEl.className = 'xfooy';
                            element.removeCls('foo');
                            expect(domEl.className).toBe('xfooy');
                        });
                    });
                });

                describe("setCls", function() {
                    beforeEach(function() {
                        element = addElement();
                        domEl = element.dom;
                        domEl.className = 'some cls';
                    });

                    describe("argument types", function() {
                        describe("with a string", function() {
                            describe("without spaces", function() {
                                it("should set the className", function() {
                                    element.setCls('foo');
                                    expect(domEl.className).toBe('foo');
                                });
                            });

                            describe("with spaces", function() {
                                it("should split on spaces", function() {
                                    element.setCls('foo bar baz');
                                    expect(domEl.className).toBe('foo bar baz');
                                });
                            });
                        });

                        describe("with an array", function() {
                            it("should set all classes", function() {
                                element.setCls(['foo', 'bar', 'baz']);
                                expect(domEl.className).toBe('foo bar baz');
                            });
                        });
                    });
                });

                describe("hasCls", function() {
                    beforeEach(function() {
                        element = addElement();
                        domEl = element.dom;
                    });

                    it("should match if the class name is the first item", function() {
                        domEl.className = 'foo bar baz';
                        expect(element.hasCls('foo')).toBe(true);
                    });

                    it("should match if the class name is the last item", function() {
                        domEl.className = 'foo bar baz';
                        expect(element.hasCls('baz')).toBe(true);
                    });

                    it("should match if the class name is a middle item", function() {
                        domEl.className = 'foo bar baz qux';
                        expect(element.hasCls('baz')).toBe(true);
                    });

                    it("should match if there is only 1 class name", function() {
                        domEl.className = 'foo';
                        expect(element.hasCls('foo')).toBe(true);
                    });

                    it("should not match if there is only 1 class that is not the same", function() {
                        domEl.className = 'foo';
                        expect(element.hasCls('bar')).toBe(false);
                    });

                    it("should not match if none of the classes match", function() {
                        domEl.className = 'foo bar baz';
                        expect(element.hasCls('asdf')).toBe(false);
                    });

                    it("should not match a leading substring", function() {
                        domEl.className = 'foobar';
                        expect(element.hasCls('foo')).toBe(false);
                    });

                    it("should not match a trailing substring", function() {
                        domEl.className = 'barfoo';
                        expect(element.hasCls('foo')).toBe(false);
                    });

                    it("should not match a substring as an existing class", function() {
                        domEl.className = 'xfooy';
                        expect(element.hasCls('foo')).toBe(false);
                    });

                    it("should be able to match when there's a class that matches both the class & a leading subtring", function() {
                        domEl.className = 'foobar foo';
                        expect(element.hasCls('foo')).toBe(true);
                    });

                    it("should be able to match when there's a class that matches both the class & a trailing subtring", function() {
                        domEl.className = 'barfoo foo';
                        expect(element.hasCls('foo')).toBe(true);
                    });

                    it("should be able to match when there's a class that matches both the class & a subtring", function() {
                        domEl.className = 'xfooy foo';
                        expect(element.hasCls('foo')).toBe(true);
                    });
                });
            });

            describe("set", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("should call Ext.core.DomHelper.applyStyles if object passed as first argument has style property", function() {
                    var style = {width:'100px'};

                    spyOn(element, "applyStyles");

                    element.set({style: style});

                    expect(element.applyStyles).toHaveBeenCalledWith(style);
                });

                it("should set dom element className if object passed as first argument has cls property", function() {
                    var cls = "x-test-class";

                    element.set({cls: cls});

                    expect(element.dom.className).toEqual(cls);
                });

                it("should use setAttribute by default", function() {
                    spyOn(element.dom, "setAttribute");

                    element.set({align: "center"});

                    expect(element.dom.setAttribute).toHaveBeenCalledWith("align", "center");
                });

                it("should be able to use expandos", function() {
                    spyOn(element.dom, "setAttribute");

                    element.set({align: "center"}, false);


                    expect(element.dom.align).toEqual("center");
                });

            });

            describe("is", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("Returns true if this element matches the passed simple selector", function() {
                    element.set({cls: "x-test-class"});

                    expect(element.is("div.x-test-class")).toBe(true);
                });
            });

            describe("focus", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("should focus dom element", function() {
                    spyOn(element.dom, "focus");

                    element.focus();

                    expect(element.dom.focus).toHaveBeenCalled();
                });

                it("should be able to defer dom element focus", function() {
                    spyOn(element.dom, "focus");
                    element.focus(1);

                    waitsFor(function(){
                        return element.dom.focus.calls.length === 1;
                    }, "element.dom.focus was never called");

                    runs(function() {
                        expect(element.dom.focus).toHaveBeenCalled();
                    });
                });

                it("should ignore any exception", function() {
                    element.dom.focus = function() {
                        throw "error";
                    };

                    expect(element.focus.bind(element)).not.toThrow("error");
                });
            });

            describe("blur", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("should blur dom element", function() {
                    spyOn(element.dom, "blur");

                    element.blur();

                    expect(element.dom.blur).toHaveBeenCalled();
                });


                it("should ignore any exception", function() {
                    element.dom.blur = function() {
                        throw "error";
                    };

                    expect(element.blur.bind(element)).not.toThrow("error");
                });
            });

            describe("getValue", function() {
                beforeEach(function() {
                    element = addElement('div');
                    element.dom.value = "10";
                });

                it("should return the dom value", function() {
                    expect(element.getValue()).toEqual("10");
                });

                it("should return the dom value as Number", function() {
                    expect(element.getValue(true)).toEqual(10);
                });
            });

            describe("listeners", function() {
                var options;

                beforeEach(function() {
                    options = {delay: 10};
                });

                xdescribe('deprecated (EventManager)', function() {
                    describe("addListener", function() {
                        beforeEach(function() {
                            element = addElement('div');
                        });

                        it("should call Ext.EventManager.on", function() {
                            spyOn(Ext.EventManager, "on");

                            element.addListener("click", Ext.emptyFn, fakeScope, options);

                            expect(Ext.EventManager.on).toHaveBeenCalledWith(element, "click", Ext.emptyFn, fakeScope, options);
                        });
                    });

                    describe("removeListener", function() {
                        beforeEach(function() {
                            element = addElement('div');
                        });

                        it("should call Ext.EventManager.un", function() {
                            spyOn(Ext.EventManager, "un");

                            element.removeListener("click", Ext.emptyFn, fakeScope);

                            expect(Ext.EventManager.un).toHaveBeenCalledWith(element, "click", Ext.emptyFn, fakeScope);
                        });
                    });

                    describe("removeAllListener", function() {
                        beforeEach(function() {
                            element = addElement('div');
                        });

                        it("should call Ext.EventManager.removeAll", function() {
                            spyOn(Ext.EventManager, "removeAll");

                            element.removeAllListeners();

                            expect(Ext.EventManager.removeAll).toHaveBeenCalledWith(element.dom);
                        });
                    });

                    describe("purgeAllListener", function() {
                        it("should call Ext.EventManager.purgeElement", function() {
                            element = addElement('div');
                            spyOn(Ext.EventManager, "purgeElement");

                            element.purgeAllListeners();

                            expect(Ext.EventManager.purgeElement).toHaveBeenCalledWith(element);
                        });
                        
                        // https://sencha.jira.com/browse/EXTJSIV-6713
                        it("should work with images", function() {
                            element = addElement('img');
                            
                            expect(function() { element.purgeAllListeners(); }).not.toThrow();
                            element.destroy();
                        });
                    });
                });
            });

            describe("addUnits", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("should return an empty string if size passed is an empty string", function() {
                    expect(element.addUnits("")).toEqual("");
                });

                it("should return auto if size passed is 'auto' string", function() {
                    expect(element.addUnits("auto")).toEqual("auto");
                });

                it("should return an empty string if size passed is undefined", function() {
                    expect(element.addUnits(undefined)).toEqual("");
                });

                it("should return an empty string if size passed is null", function() {
                    expect(element.addUnits(null)).toEqual("");
                });
            });

            describe("destroy", function() {
                var id, dom;
                
                beforeEach(function() {
                    element = addElement('div');
                    id = element.id;
                    dom = element.dom;
                });

                beforeEach(function() {
                    element.destroy();
                });

                it("should remove dom property", function() {
                    expect(element.dom).toBe(null);
                });

                it("should should remove the cache entry", function() {
                    expect(id in Ext.cache).toBe(false);
                });

                it("should remove the element from the dom", function() {
                    expect(dom.parentNode).toBeNull();
                });
            });

            describe("hover", function() {
                var overFn, outFn, options;
                beforeEach(function() {
                    element = addElement('div');
                    overFn = function() {
                        return 1;
                    };

                    outFn = function() {
                        return 2;
                    };

                    options = {
                        foo: true
                    };

                    spyOn(element, "on");
                });

                describe("mouseenter event", function() {
                    it("should add a listener on mouseenter", function() {
                        element.hover(overFn, outFn, fakeScope, options);

                        expect(element.on).toHaveBeenCalledWith("mouseenter", overFn, fakeScope, options);
                    });

                    it("should set scope to element.dom if it is not passed in arguments", function() {
                        element.hover(overFn, outFn, null, options);

                        expect(element.on).toHaveBeenCalledWith("mouseenter", overFn, element.dom, options);
                    });
                });

                describe("mouseleave event", function() {
                    it("should add a listener on mouseleave", function() {
                        element.hover(overFn, outFn, fakeScope, options);

                        expect(element.on).toHaveBeenCalledWith("mouseleave", outFn, fakeScope, options);
                    });

                    it("should set scope to element.dom if it is not passed in arguments", function() {
                        element.hover(overFn, outFn, null, options);

                        expect(element.on).toHaveBeenCalledWith("mouseleave", outFn, element.dom, options);
                    });
                });
            });

            describe("contains", function() {
                /**
                 * TODO: Removed tests for now, need to reinstate once the refactoring is done.
                 */
            });

            describe("mask", function() {
                // Note the following specs have been disabled for IE 6 because of failures in the eye
                // run that could not be reproduced.  They always passed locally in the test runner.
                // The comments have been left to show the unique differences needed to get these to
                // run in IE 6.
                describe("masking the body el", function () {
                    var cmp, maskEl, dom, scrollHeight, scrollWidth;

                    function createCmp(height) {
                        cmp = new Ext.Component({
                            height: height || 200,
                            renderTo: Ext.getBody()
                        });

                        maskEl = Ext.getBody().mask({msg: "Tom Sawyer"});

                        dom = document.body;
                        scrollHeight = dom.scrollHeight;
                        scrollWidth = dom.scrollWidth;
                    }

                    afterEach(function () {
                        Ext.removeNode(maskEl.dom.nextSibling);
                        Ext.removeNode(maskEl.dom);
                        Ext.destroy(cmp, maskEl);

                        cmp = maskEl = dom = scrollHeight = scrollWidth = null;
                    });
                });

            });

            xdescribe("deprecated 5.0", function() {
                describe("getAttributeNS", function() {
                    beforeEach(function() {
                        element = addElement('div');
                    });

                    it("should call element getAttribute", function() {
                        spyOn(element, "getAttribute");

                        element.getAttributeNS("ns1", "align");

                        expect(element.getAttribute).toHaveBeenCalledWith("align", "ns1");
                    });
                });
            });

            describe("getAttribute", function() {
                var element2, element3;
                beforeEach(function() {
                    element = addElement('div');
                    element2 = Ext.getBody().createChild({tag: "div"});


                    if (element.dom.setAttribute) {
                        element.dom.setAttribute("qtip", "bar");
                        element2.dom.setAttribute("ext:qtip", "foo");
                    } else {
                        element.dom["qtip"] = "bar";
                        element2.dom["ext:qtip"] = "foo";
                    }

                    if (element.dom.setAttributeNS) {
                        element3 = Ext.getBody().createChild({tag: "div"});
                        element3.dom.setAttributeNS("ext", "qtip", "foobar");
                    }
                });

                afterEach(function() {
                    element2.destroy();
                    if (element3) {
                        element3.destroy();
                    }
                });

                describe("without namespace", function() {
                    it("should return the attribute value if it exists", function() {
                        expect(element.getAttribute("qtip")).toEqual("bar");
                    });

                    it("should return null if the attribute does not exist", function() {
                        expect(element.getAttribute("nothing")).toBeNull();
                    });
                });

                describe("with namespace", function() {
                    it("should return null on a non-namespaced attribute", function() {
                        expect(element.getAttribute("qtip", "ext")).toBeNull();
                    });

                    it("should return null if the attribute belong to another namespace", function() {
                        expect(element2.getAttribute("qtip", "nothing")).toBeNull();
                    });

                    it("should return the attribute value if it belongs to the namespace", function() {
                        if (element3) {
                            expect(element3.getAttribute("qtip", "ext")).toEqual("foobar");
                        }
                    });

                    it("should handle xml namespace", function() {
                        expect(element2.getAttribute("qtip", "ext")).toEqual("foo");
                    });
                });
            });
            
            describe("getAttributes", function() {
                it("should return an empty object for element with no attributes", function() {
                    var empty = document.createElement('div');
                    
                    var attrs = Ext.fly(empty).getAttributes();
                    
                    expect(attrs).toEqual({});
                    
                    Ext.fly(empty).destroy();
                });
                
                it("should return all attributes", function() {
                    var el = Ext.getBody().createChild({
                        tag: 'div',
                        foo: 42
                    });
                    
                    var attrs = el.getAttributes();
                    
                    expect(attrs).toEqual({
                        foo: '42',
                        id: el.id
                    });
                    
                    el.destroy();
                });
            });

            describe("update", function() {
                beforeEach(function() {
                    element = addElement('div');
                    element.dom.innerHTML = "hello world";
                });

                it("should update dom element innerHTML", function() {
                    element.update("foobar");

                    expect(element.dom).hasHTML("foobar");
                });

                it("should return element", function() {
                    expect(element.update("foobar")).toBe(element);
                });
            });

            describe("prototype aliases", function() {
                beforeEach(function() {
                    element = addElement('div');
                });

                it("should aliases addListener with on", function() {
                    expect(typeof(element.on)).toEqual('function');
                });

                it("should aliases removeListener with un", function() {
                    expect(typeof(element.un)).toEqual('function');
                });

                it("should aliases removeAllListeners with clearListeners", function() {
                    expect(typeof(element.clearListeners)).toEqual('function');
                });
            });

            describe("visibilityMode", function(){
                beforeEach(function() {
                    element = addElement('div');
                });

                it('must be able to setVisibilityMode and getVisibilityMode', function(){
                    element.setVisibilityMode(Ext.dom.Element.DISPLAY);
                    expect(element.getVisibilityMode()).toBe(Ext.dom.Element.DISPLAY);
                    
                    element.setVisibilityMode(Ext.dom.Element.VISIBILITY);
                    expect(element.getVisibilityMode()).toBe(Ext.dom.Element.VISIBILITY);
                });
                
                it("should retain visibilityMode on flyweights", function(){
                    Ext.fly(element.dom).setVisibilityMode(Ext.dom.Element.DISPLAY);
                    expect(Ext.fly(element.dom).getVisibilityMode()).toBe(Ext.dom.Element.DISPLAY);    
                });
            });

            describe("visibility", function(){
                var child, grandChild,
                    modes = [Ext.dom.Element.DISPLAY, Ext.dom.Element.VISIBILITY];

                beforeEach(function() {
                    element = addElement('div');
                    child = element.createChild({tag: "div"});
                    if (child) {
                        child.setVisible(true);
                        grandChild = child.createChild({tag: "div"});
                        if (grandChild) {
                            grandChild.setVisible(true);
                        }
                    }
                });

                afterEach(function() {
                    if (grandChild) {
                        grandChild.destroy();
                    }
                    if (child) {
                        child.destroy();
                    }
                });

                it("should toggle the visibility of the element itself", function(){
                    for (var i in modes) {
                        element.setVisibilityMode(modes[i]);

                        element.setVisible(false);
                        expect(element.isVisible(false)).toBe(false);

                        element.setVisible(true);
                        expect(element.isVisible(false)).toBe(true);                    
                    }
                });

                it("should toggle the 'deep' visibility of the grand-child", function(){
                    for (var i in modes) {
                        element.setVisibilityMode(modes[i]);

                        element.setVisible(false);
                        expect(grandChild.isVisible(true)).toBe(false);

                        element.setVisible(true);
                        expect(grandChild.isVisible(true)).toBe(true);
                    }
                });
            });

            describe("getMargin", function() {
                beforeEach(function() {
                    element = addElement('div');
                    element.setStyle({
                        marginTop: '1px',
                        marginRight: '11px',
                        marginBottom: '21px',
                        marginLeft: '31px'
                    });
                });

                function clearMargins() {
                    element.dom.style.marginTop = '';
                    element.dom.style.marginRight = '';
                    element.dom.style.marginBottom = '';
                    element.dom.style.marginLeft = '';
                }

                describe("with sides", function() {
                    it("should return the top", function() {
                        expect(element.getMargin('t')).toBe(1);
                    });

                    it("should return the right", function() {
                        expect(element.getMargin('r')).toBe(11);
                    });

                    it("should return the bottom", function() {
                        expect(element.getMargin('b')).toBe(21);
                    });

                    it("should return the left", function() {
                        expect(element.getMargin('l')).toBe(31);
                    });

                    it("should return the sum of the vertical margins", function() {
                        expect(element.getMargin('tb')).toBe(22);
                    });

                    it("should return the sum of the horizontal margins", function() {
                        expect(element.getMargin('lr')).toBe(42);
                    });

                    it("should return the sum of all margins", function() {
                        expect(element.getMargin('trbl')).toBe(64);
                    });

                    it("should coerce missing margins to 0", function() {
                        clearMargins();
                        expect(element.getMargin('t')).toBe(0);
                        expect(element.getMargin('r')).toBe(0);
                        expect(element.getMargin('b')).toBe(0);
                        expect(element.getMargin('l')).toBe(0);
                        expect(element.getMargin('tb')).toBe(0);
                        expect(element.getMargin('lr')).toBe(0);
                    });
                });

                describe("with no sides", function() {
                    it("should return the margins with each margin name & shortcut", function() {
                        expect(element.getMargin()).toEqual({
                            t: 1,
                            top: 1,
                            r: 11,
                            right: 11,
                            b: 21,
                            bottom: 21,
                            l: 31,
                            left: 31
                        });
                    });

                    it("should coerce missing margins to 0", function() {
                        clearMargins();
                        expect(element.getMargin()).toEqual({
                            t: 0,
                            top: 0,
                            r: 0,
                            right: 0,
                            b: 0,
                            bottom: 0,
                            l: 0,
                            left: 0
                        });
                    });
                });
            });

            if (!fly) {
                describe("setVertical", function() {
                    beforeEach(function() {
                        var styleSheet = document.styleSheets[0],
                            selector = '.vert',
                            props = [
                                    '-webkit-transform: rotate(90deg);',
                                    '-moz-transform: rotate(90deg);',
                                    '-o-transform: rotate(90deg);',	
                                    'transform: rotate(90deg);',
                                    'filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1);'
                            ].join('');
                        if (styleSheet.insertRule) {
                            styleSheet.insertRule(selector + '{' + props + '}', 1);
                        } else {
                            // IE8
                            styleSheet.addRule(selector, props);
                        }
                        element = addElement('div');
                        element.setWidth(100);
                        element.setHeight(30);
                        element.setVertical(90, 'vert');
                    });

                    afterEach(function() {
                        var styleSheet = document.styleSheets[0];
                        if (styleSheet.deleteRule) {
                  
                            styleSheet.deleteRule(1);
                        } else {
                            // IE8
                            styleSheet.removeRule(styleSheet.rules.length - 1); 
                        }
                    });

                    it("should add the css class", function() {
                        expect(element.hasCls('vert')).toBe(true);
                    });

                    it("should get the width using getWidth()", function() {
                        expect(element.getWidth()).toBe(30);
                    });

                    it("should get the width using getStyle('width')", function() {
                        expect(element.getStyle('width')).toBe('30px');
                    });

                    it("should get the height using getHeight", function() {
                        expect(element.getHeight()).toBe(100);
                    });

                    it("should get the height using getStyle('height')", function() {
                        expect(element.getStyle('height')).toBe('100px');
                    });

                    it("should set the width using setWidth()", function() {
                        element.setWidth(200);
                        expect(element.getWidth()).toBe(200);
                    });

                    it("should set the width using setStyle('width')", function() {
                        element.setStyle('width', '200px');
                        expect(element.getWidth()).toBe(200);
                    });

                    it("should set the height using setHeight()", function() {
                        element.setHeight(200);
                        expect(element.getHeight()).toBe(200);
                    });

                    it("should set the height using setStyle('height')", function() {
                        element.setStyle('height', '200px');
                        expect(element.getHeight()).toBe(200);
                    });

                    describe("setHorizontal", function() {
                        beforeEach(function() {
                            element.setHorizontal();
                        });

                        it("should remove the css class", function() {
                            expect(element.hasCls('vert')).toBe(false);
                        });

                        it("should get the width using getWidth()", function() {
                            expect(element.getWidth()).toBe(100);
                        });

                        it("should get the width using getStyle('width')", function() {
                            expect(element.getStyle('width')).toBe('100px');
                        });

                        it("should get the height using getHeight", function() {
                            expect(element.getHeight()).toBe(30);
                        });

                        it("should get the height using getStyle('height')", function() {
                            expect(element.getStyle('height')).toBe('30px');
                        });

                        it("should set the width using setWidth()", function() {
                            element.setWidth(200);
                            expect(element.getWidth()).toBe(200);
                        });

                        it("should set the width using setStyle('width')", function() {
                            element.setStyle('width', '200px');
                            expect(element.getWidth()).toBe(200);
                        });

                        it("should set the height using setHeight()", function() {
                            element.setHeight(200);
                            expect(element.getHeight()).toBe(200);
                        });

                        it("should set the height using setStyle('height')", function() {
                            element.setStyle('height', '200px');
                            expect(element.getHeight()).toBe(200);
                        });
                    });
                });
            }
        });
    }

    describeMethods();
    describeMethods(true);

    describe("class methods", function() {
        var element, element2, domEl, domEl2, id;

        beforeEach(function() {
            element = Ext.getBody().createChild({tag: "div"});
            domEl = element.dom;

            id = Ext.id();
            domEl2 = document.createElement("div");
            domEl2.id = id;
            document.body.appendChild(domEl2);
        });

        afterEach(function() {
            // Prevent console warnings
            spyOn(Ext.Logger, 'warn');
            element.destroy();
            if (element2) {
                element2.destroy();
            }
            if (domEl2 && domEl2.parentNode === document.body) {
                document.body.removeChild(domEl2);
            }
        });

        describe("get", function() {
            describe("alias", function() {
                it("should alias Ext.dom.Element.get with Ext.get", function() {
                    spyOn(Ext.dom.Element, 'get');
                    Ext.get();
                    expect(Ext.dom.Element.get).toHaveBeenCalled();
                });
            });

            describe("passing string id as first argument", function() {
                describe("with a dom element which is not already encapsulated", function() {
                    it("should return a new Ext.dom.Element", function() {
                        element2 = Ext.get(id);

                        expect(element2 instanceof Ext.dom.Element).toBe(true);
                    });

                    it("should encapsulate the dom element in the Ext.dom.Element", function() {
                        element2 = Ext.get(id);

                        expect(element2.dom).toBe(domEl2);
                    });

                    it("should add element to Ext.cache", function() {
                        element2 = Ext.get(id);
                        expect(Ext.cache[id] === element2);
                    });
                });

                describe("with a dom element which is already encapsulated", function() {
                    it("should return the corresponding Ext.Element", function() {
                        expect(Ext.get(domEl)).toBe(element);
                    });
                });
            });

            describe("passing dom element as first argument", function() {
                describe("with a dom element which is not already encapsulated", function() {
                    it("should return a new Ext.dom.Element", function() {
                        element2 = Ext.get(domEl2);

                        expect(element2 instanceof Ext.dom.Element).toBe(true);
                    });

                    it("should encapsulate the dom element in the Ext.dom.Element", function() {
                        element2 = Ext.get(domEl2);

                        expect(element2.dom).toBe(domEl2);
                    });

                    it("should add element to Ext.cache", function() {
                        expect(Ext.cache[domEl2.id] === domEl2);
                    });
                });

                describe("with a dom element which is already encapsulated", function() {
                    it("should return the corresponding Ext.Element", function() {
                        expect(Ext.get(domEl.id)).toBe(element);
                    });
                });
            });

            describe("passing an Ext.dom.Element as first argument", function() {
                it("should return Ext.dom.Element", function() {
                    expect(Ext.get(element)).toBe(element);
                });
            });
            
            describe("passing a Ext.dom.FlyWeight as first argument", function() {
                it("should return Ext.dom.Element", function() {
                    var result = Ext.get(Ext.fly(domEl));
                    expect(result).toBe(element);
                    expect(result.isFly).toBeUndefined();
                    
                });
            });

            describe("passing a CompositeElement as first argument", function() {
                var compositeElement;

                beforeEach(function() {
                    compositeElement = Ext.select("div");
                });

                it("should return Ext.dom.Element", function() {
                    expect(Ext.get(compositeElement)).toBe(compositeElement);
                });
            });

            describe("passing an array as first argument", function() {
                it("should call Ext.dom.Element.select", function() {
                    var arr = [domEl, domEl2];
                    spyOn(Ext.dom.Element, "select");

                    Ext.get(arr);

                    expect(Ext.dom.Element.select).toHaveBeenCalledWith(arr);
                });
            });

            describe("passing document as first argument", function() {
                it("should return an Ext.dom.Element", function() {
                    expect(Ext.get(document) instanceof Ext.dom.Element).toBe(true);
                });

                xit("should return a bogus Ext.dom.Element", function() {
                    expect(Ext.get(document).id).not.toBeDefined();
                });

                it("should return an Ext.dom.Element that encapsulate document", function() {
                    expect(Ext.get(document).dom).toBe(document);
                });
            });

            it("should not wrap a documentFragment", function() {
                var dom = document.createDocumentFragment(),
                    el = Ext.get(dom);

                expect(el).toBe(null);
            });

            it("should wrap the window object", function() {
                var dom = window,
                    el = Ext.get(dom);

                expect(el instanceof Ext.dom.Element).toBe(true);
                expect(el.dom).toBe(dom);
            });

            it("should wrap the document object", function() {
                var dom = document,
                    el = Ext.get(dom);

                expect(el instanceof Ext.dom.Element).toBe(true);
                expect(el.dom).toBe(dom);
            });

            describe("document and window within iframe", function() {
                var iframe, el;

                beforeEach(function() {
                    iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);

                    waitsFor(function() {
                        return !!iframe.contentWindow.document.body;
                    });
                });

                afterEach(function() {
                    document.body.removeChild(iframe);
                    el.destroy();
                });

                it("should wrap an iframe's window object", function() {
                    var dom = iframe.contentWindow;

                    el = Ext.get(dom);

                    expect(el instanceof Ext.dom.Element).toBe(true);
                    expect(el.dom).toBe(dom);
                });

                it("should wrap an iframe's document object", function() {
                    var dom = iframe.contentWindow.document;

                    el = Ext.get(dom);

                    expect(el instanceof Ext.dom.Element).toBe(true);
                    expect(el.dom).toBe(dom);
                });
            });

            it("should not wrap a text node", function() {
                expect(Ext.get(document.createTextNode(('foo')))).toBe(null);
            });
        });

        xdescribe("garbageCollector", function() {

        });

        describe("fly", function() {
            var flyWeight;

            beforeEach(function() {
                spyOn(Ext, "getDom").andCallThrough();

            });

            describe('use strict', function () {
                var backup;

                //TODO - See if there is a cheap enough way to avoid this replacement
                //TODO - Oddly enough even if we wrap Ext.fly it throws an error trying
                //TODO - to use Ext.fly.caller but the caller is the wrapper not the
                //TODO - strict mode function (perhaps the JIT has removed the "useless"
                //TODO - wrapper function).
                beforeEach(function () {
                    Ext.fly = (function (oldFly) {
                        backup = oldFly;
                        return function (dom, named) {
                            return oldFly(dom, named || '_global');
                        };
                    }(Ext.fly));
                });

                afterEach(function () {
                    Ext.fly = backup;
                });

                it('should work when called by strict mode function', function () {
                    'use strict';
                    var f = Ext.fly(domEl2);
                });
            });

            describe("global flyweight", function() {
                beforeEach(function() {
                    flyWeight = Ext.fly(domEl2);
                });

                it("should return an Ext.dom.Element.Fly", function() {
                    expect(flyWeight instanceof Ext.dom.Fly).toBe(true);
                });

                it("should not cache a dom element", function() {
                    expect(Ext.cache[domEl2.id]).toBeUndefined();
                });

                it("should call Ext.getDom", function() {
                    expect(Ext.getDom).toHaveBeenCalledWith(domEl2);
                });
            });

            describe("named reusable flyweight", function() {
                beforeEach(function() {
                    flyWeight = Ext.fly(domEl2, "myflyweight");
                });

                it("should return an Ext.dom.Element.Flyweight", function() {
                    expect(flyWeight instanceof Ext.dom.Fly).toBe(true);
                });

                it("should not cache a dom element", function() {
                    expect(Ext.cache[domEl2.id]).toBeUndefined();
                });

                it("should call Ext.getDom", function() {
                    expect(Ext.getDom).toHaveBeenCalledWith(domEl2);
                });
            });

            it("should wrap a documentFragment", function() {
                var dom = document.createDocumentFragment(),
                    el = Ext.fly(dom);

                expect(el instanceof Ext.dom.Fly).toBe(true);
                expect(el.dom).toBe(dom);
            });

            it("should wrap the window object", function() {
                var dom = window,
                    el = Ext.fly(dom);

                expect(el instanceof Ext.dom.Element).toBe(true);
                expect(el.dom).toBe(dom);
            });

            it("should wrap the document object", function() {
                var dom = document,
                    el = Ext.fly(dom);

                expect(el instanceof Ext.dom.Element).toBe(true);
                expect(el.dom).toBe(dom);
            });

            describe("document and window within iframe", function() {
                var iframe;

                beforeEach(function() {
                    iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                });

                afterEach(function() {
                    document.body.removeChild(iframe);
                });

                it("should wrap an iframe's window object", function() {
                    var dom = iframe.contentWindow,
                        el = Ext.fly(dom);

                    expect(el instanceof Ext.dom.Fly).toBe(true);
                    expect(el.dom).toBe(dom);
                });

                it("should wrap an iframe's document object", function() {
                    var dom = iframe.contentWindow.document,
                        el = Ext.fly(dom);

                    expect(el instanceof Ext.dom.Fly).toBe(true);
                    expect(el.dom).toBe(dom);

                });
            });

            it("should not wrap a text node", function() {
                expect(Ext.fly(document.createTextNode(('foo')))).toBe(null);
            });
        });

        describe("aliases", function() {
            it("should aliases Ext.dom.Element.get with Ext.get", function() {
                spyOn(Ext.dom.Element, 'get');
                Ext.get();
                expect(Ext.dom.Element.get).toHaveBeenCalled();
            });

            it("should aliases Ext.fly with Ext.Element.fly", function() {
                spyOn(Ext, 'fly');
                Ext.Element.fly();
                expect(Ext.fly).toHaveBeenCalled();
            });
        });
    });
    
    describe("getXY", function(){
        var unAttached;
        beforeEach(function(){
            unAttached = document.createElement('div');
        });
        it("should not throw when reading unattached element", function(){
            Ext.fly(unAttached).getXY();
        });
    });

    describe("Ext", function() {
        // these specs have to live here instead of in sencha-core, because they test
        // the result of passing a Ext.Element instance to Ext.isElement() or Ext.isTextNode.
        it("should return false when an Ext.Element instance is passed to Ext.isElement", function() {
           expect(Ext.isElement(Ext.getBody())).toBe(false);
        });

        it("should return false when an Ext.Element instance is passed to Ext.isTextNode", function() {
           expect(Ext.isTextNode(Ext.getBody())).toBe(false);
        });
    });

    describe("Ext.isGarbage", function() {
        it("should return false if the element is the window", function() {
            expect(Ext.isGarbage(window)).toBe(false);
        });

        it("should return false if the element is the document", function() {
            expect(Ext.isGarbage(document)).toBe(false);
        });

        it("should return false if the element is the documentElement", function() {
            expect(Ext.isGarbage(document.documentElement)).toBe(false);
        });

        it("should return false if the element is in the DOM", function() {
            var el = Ext.getBody().createChild();
            expect(Ext.isGarbage(el.dom)).toBe(false);
            el.destroy();
        });

        it("should return true if the element is not in the DOM", function() {
            expect(Ext.isGarbage(document.createElement('div'))).toBe(true);
        });

        it("should return false if the element is in the detached body", function() {
            var el = Ext.getDetachedBody().createChild();
            expect(Ext.isGarbage(el.dom)).toBe(false);
            el.destroy();
        });

        it("should return false if the element is in the dom and the cache contains an element with the same id", function() {
            // EXTJS-13702
            var el = Ext.getBody().createChild({
                id: 'foo'
            });

            document.body.removeChild(el.dom);

            el = Ext.getBody().createChild({
                id: 'foo'
            });

            expect(Ext.isGarbage(el.dom)).toBe(false);

            el.destroy();
        });

    });

    describe("shim", function() {
        var element;

        beforeEach(function() {
            element = Ext.getBody().createChild({
                style: 'position:absolute;left:250px;top:150px;width:200px;height:100px;'
            });
        });

        afterEach(function() {
            if (!element.isDestroyed) {
                element.destroy();
            }
        });

        function expectBox(x, y, w, h) {
            var box = element.shim.el.getBox();

            expect(box.x).toBe(x);
            expect(box.y).toBe(y);
            expect(box.width).toBe(w);
            expect(box.height).toBe(h);
        }

        it("should not have a shim by default", function() {
            expect(element.shim).toBeUndefined();
        });

        it("should create a shim", function() {
            element.enableShim();

            expect(element.shim instanceof Ext.dom.Shim).toBe(true);
        });

        it("should show the shim upon creation", function() {
            element.enableShim();

            expect(element.shim.el.isVisible()).toBe(true);
        });

        it("should insert the shim as the previousSibling of its target", function() {
            element.enableShim();

            expect(element.dom.previousSibling).toBe(element.shim.el.dom);
        });

        it("should be an iframe", function() {
            element.enableShim();

            expect(element.shim.el.dom.tagName).toBe('IFRAME');
        });

        it("should have a CSS class of 'x-shim'", function() {
            element.enableShim();

            expect(element.shim.el).toHaveCls('x-shim');
        });

        it("should have a role of 'presentation'", function() {
            element.enableShim();

            expect(element.shim.el.dom.getAttribute('role')).toBe('presentation');
        });

        it("should have frameBorder: '0' on the iframe", function() {
            element.enableShim();

            expect(element.shim.el.dom.getAttribute('frameBorder')).toBe('0');
        });

        it("should set the iframe's src to Ext.SSL_SECURE_URL", function() {
            element.enableShim();

            expect(element.shim.el.dom.getAttribute('src')).toBe(Ext.SSL_SECURE_URL);
        });

        it("should have a tabindex of '-1'", function() {
            // tabIndex of -1 ensures that the iframe is not focusable by the user
            element.enableShim();

            expect(element.shim.el.dom.getAttribute('tabindex')).toBe('-1');
        });

        it("should not show the shim if the element is not visible", function() {
            element.hide();

            element.enableShim();

            expect(element.shim.el).toBeUndefined();
        });

        it("should not show the shim upon creation if ths isVisible parameter is false", function() {
            // private api used by components to avoid an isVisible check
            element.enableShim(null, false);

            expect(element.shim.el).toBeUndefined();
        });

        it("should hide the shim when the element is destroyed", function() {
            element.enableShim();

            var shim = element.shim,
                shimEl = shim.el;

            element.destroy();

            expect(shim.el).toBeNull();
            expect(shimEl.isVisible()).toBe(false);
            // should NOT destroy the shim - it is returned to the pool
            expect(shimEl.isDestroyed).toBeFalsy();
        });

        it("should use DISPLAY visibilityMode for the shim", function() {
            element.enableShim();

            expect(element.shim.el.getVisibilityMode()).toBe(Ext.Element.DISPLAY);
        });

        it("should allow fixed positioning to be configured", function() {
            element.enableShim({
                fixed: true
            });

            expect(element.shim.el.getStyle('position')).toBe('fixed');
        });

        it("should set the z-index of the shim when the z-index of the element is set", function() {
            element.enableShim();

            element.setZIndex(174);

            expect(parseInt(element.shim.el.getStyle('z-index'), 10)).toBe(174);
        });

        it("should align the shim to the target element", function() {
            element.enableShim();

            expectBox(250, 150, 200, 100);
        });

        it("should realign the shim using passed coordinates", function() {
            element.enableShim();

            element.shim.realign(25, 50, 75, 85);

            expectBox(25, 50, 75, 85);
        });

        it("should realign the shim in response to setLeft()", function() {
            element.enableShim();

            element.setLeft(300);

            expectBox(300, 150, 200, 100);
        });

        it("should realign the shim in response to setTop()", function() {
            element.enableShim();

            element.setTop(300);

            expectBox(250, 300, 200, 100);
        });

        it("should realign the shim in response to setLocalX()", function() {
            element.enableShim();

            element.setLocalX(300);

            expectBox(300, 150, 200, 100);
        });

        it("should realign the shim in response to setLocalY()", function() {
            element.enableShim();

            element.setLocalY(300);

            expectBox(250, 300, 200, 100);
        });

        it("should realign the shim in response to setLocalXY()", function() {
            element.enableShim();

            element.setLocalXY(300, 400);

            expectBox(300, 400, 200, 100);
        });

        it("should realign the shim in response to setX()", function() {
            element.enableShim();

            element.setX(300);

            expectBox(300, 150, 200, 100);
        });

        it("should realign the shim in response to setY()", function() {
            element.enableShim();

            element.setY(300);

            expectBox(250, 300, 200, 100);
        });

        it("should realign the shim in response to setXY()", function() {
            element.enableShim();

            element.setXY([300, 400]);

            expectBox(300, 400, 200, 100);
        });

        it("should realign the shim in response to setWidth()", function() {
            element.enableShim();

            element.setWidth(400);

            expectBox(250, 150, 400, 100);
        });

        it("should realign the shim in response to setHeight()", function() {
            element.enableShim();

            element.setHeight(400);

            expectBox(250, 150, 200, 400);
        });

        it("should realign the shim in response to setSize()", function() {
            element.enableShim();

            element.setSize(450, 550);

            expectBox(250, 150, 450, 550);
        });

        it("should realign the shim in response to setBox()", function() {
            element.enableShim();

            element.setBox({
                x: 300,
                y: 400,
                width: 500,
                height: 600
            });

            expectBox(300, 400, 500, 600);
        });

        it("should disable the shim", function() {
            element.enableShim();

            var shimEl = element.shim.el;

            element.disableShim();

            expect(element.shim.el).toBeNull();
            expect(shimEl.isVisible()).toBe(false);
        });

        it("should re-enable the shim after disabling", function() {
            element.enableShim();

            element.disableShim();

            element.enableShim();

            expect(element.shim.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should realign the shim when re-enabling if the target el was moved", function() {
            element.enableShim();

            element.disableShim();

            element.setXY([500, 450]);
            element.setSize(50, 60);

            element.enableShim();

            expectBox(500, 450, 50, 60);
        });

        it("should hide the shim when the target element is hidden", function() {
            element.enableShim();

            var shim = element.shim,
                shimEl = shim.el;

            element.hide();

            expect(shim.el).toBeNull();
            expect(shimEl.isVisible()).toBe(false);
        });

        it("should show and realign the shim when the target element is shown", function() {
            element.hide();

            element.enableShim();

            element.show();

            expect(element.shim.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should hide the shim when the target element is hidden using setDisplayed", function() {
            element.enableShim();

            var shim = element.shim,
                shimEl = shim.el;

            element.setDisplayed(false);

            expect(shim.el).toBeNull();
            expect(shimEl.isVisible()).toBe(false);
        });

        it("should show and realign the shim when the target element is shown using setDisplayed", function() {
            element.setDisplayed(false);

            element.enableShim();

            element.setDisplayed(true);

            expect(element.shim.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should disable the shim when disableShim is called", function() {
            element.enableShim();

            var shimEl = element.shim.el;

            expect(element.shim.disabled).toBe(false);
            expect(element.shim.el.isVisible()).toBe(true);

            element.disableShim();

            expect(element.shim.disabled).toBe(true);
            expect(shimEl.isVisible()).toBe(false);
            expect(element.shim.el).toBeNull();
        });

        it("should enable a disabled shim when enableShim is called", function() {
            element.enableShim();
            element.disableShim();
            element.enableShim();

            expect(element.shim.disabled).toBe(false);
            expect(element.shim.el.isVisible()).toBe(true);
        });

        it("should realign a disabled shim when it is re-enabled", function() {
            element.enableShim();
            element.disableShim();

            // move the element while shim is disabled to make sure it re-aligns correctly
            element.setXY([575, 325]);
            element.setSize(250, 315);

            element.enableShim();

            expectBox(575, 325, 250, 315);
        });

        it("should not attempt to hide a disabled shim when the element is hidden", function() {
            element.enableShim();
            element.disableShim();

            spyOn(element.shim, 'hide').andCallThrough();

            element.hide();

            expect(element.shim.hide).not.toHaveBeenCalled();
        });

        it("should not show a disabled shim when the element is shown", function() {
            element.enableShim();

            element.hide();

            element.disableShim();

            element.show();

            expect(element.shim.el).toBeNull();
            expect(element.shim.disabled).toBe(true);
        });
    });

    describe("shadow", function() {
        var offsets = {
                // offsets for the default 'drop' shadow
                x: 4,
                y: 4,
                w: -4,
                h: -4
            },
            element;

        beforeEach(function() {
            this.addMatchers({
                toBeWithin: function(deviation, value) {
                    var actual = this.actual;

                    if (deviation > 0) {
                        return actual >= (value - deviation) && actual <= (value + deviation);
                    } else {
                        return actual >= (value + deviation) && actual <= (value - deviation);
                    }
                }
            });
            element = Ext.getBody().createChild({
                style: 'position:absolute;left:250px;top:150px;width:200px;height:100px;'
            });
        });

        afterEach(function() {
            if (!element.isDestroyed) {
                element.destroy();
            }
        });

        function expectBox(x, y, w, h) {
            var box = element.shadow.el.getBox();

            expect(box.x).toBe(x + offsets.x);
            expect(box.y).toBe(y + offsets.y);
            expect(box.width).toBeWithin(1, w + offsets.w);
            expect(box.height).toBe(h + offsets.h);
        }

        it("should not have a shadow by default", function() {
            expect(element.shadow).toBeUndefined();
        });

        it("should create a shadow", function() {
            element.enableShadow();

            expect(element.shadow instanceof Ext.dom.Shadow).toBe(true);
        });

        it("should show the shadow upon creation", function() {
            element.enableShadow();

            expect(element.shadow.el.isVisible()).toBe(true);
        });

        it("should insert the shadow as the previousSibling of its target", function() {
            element.enableShadow();

            expect(element.dom.previousSibling).toBe(element.shadow.el.dom);
        });

        it("should have the correct CSS class", function() {
            element.enableShadow();

            expect(element.shadow.el).toHaveCls(
                Ext.supports.CSS3BoxShadow ? 'x-css-shadow' : 'x-ie-shadow'
            );
        });

        it("should have a role of 'presentation'", function() {
            element.enableShadow();

            expect(element.shadow.el.dom.getAttribute('role')).toBe('presentation');
        });

        it("should not show the shadow if the element is not visible", function() {
            element.hide();

            element.enableShadow();

            expect(element.shadow.el).toBeUndefined();
        });

        it("should not show the shadow upon creation if ths isVisible parameter is false", function() {
            // private api used by components to avoid an isVisible check
            element.enableShadow(null, false);

            expect(element.shadow.el).toBeUndefined();
        });

        it("should hide the shadow when the element is destroyed", function() {
            element.enableShadow();

            var shadow = element.shadow,
                shadowEl = shadow.el;

            element.destroy();

            expect(shadow.el).toBeNull();
            expect(shadowEl.isVisible()).toBe(false);
            // should NOT destroy the shadow - it is returned to the pool
            expect(shadowEl.isDestroyed).toBeFalsy();
        });

        it("should use DISPLAY visibilityMode for the shadow", function() {
            element.enableShadow();

            expect(element.shadow.el.getVisibilityMode()).toBe(Ext.Element.DISPLAY);
        });

        it("should allow fixed positioning to be configured", function() {
            element.enableShadow({
                fixed: true
            });

            expect(element.shadow.el.getStyle('position')).toBe('fixed');
        });

        it("should set the z-index of the shadow when the z-index of the element is set", function() {
            element.enableShadow();

            element.setZIndex(174);

            expect(parseInt(element.shadow.el.getStyle('z-index'), 10)).toBe(174);
        });

        it("should set the shadow's offset", function() {
            element.enableShadow({
                offset: 10
            });

            expect(element.shadow.offset).toBe(10);
        });

        it("should set the shadow's mode", function() {
            element.enableShadow({
                mode: 'drop'
            });

            expect(element.shadow.mode).toBe('drop');
        });

        it("should align the shadow to the target element", function() {
            element.enableShadow();

            expectBox(250, 150, 200, 100);
        });

        it("should realign the shadow using passed coordinates", function() {
            element.enableShadow();

            element.shadow.realign(25, 50, 75, 85);

            expectBox(25, 50, 75, 85);
        });

        it("should realign the shadow in response to setLeft()", function() {
            element.enableShadow();

            element.setLeft(300);

            expectBox(300, 150, 200, 100);
        });

        it("should not constrain the shadow when the element left position is < 0", function() {
            element.enableShadow();
            element.setLeft(-100);
            expectBox(-100, 150, 200, 100);
        });

        it("should realign the shadow in response to setTop()", function() {
            element.enableShadow();

            element.setTop(300);

            expectBox(250, 300, 200, 100);
        });

        it("should not constrain the shadow when the element top position is < 0", function() {
            element.enableShadow();
            element.setTop(-100);
            expectBox(250, -100, 200, 100);
        });

        it("should realign the shadow in response to setLocalX()", function() {
            element.enableShadow();

            element.setLocalX(300);

            expectBox(300, 150, 200, 100);
        });

        it("should realign the shadow in response to setLocalY()", function() {
            element.enableShadow();

            element.setLocalY(300);

            expectBox(250, 300, 200, 100);
        });

        it("should realign the shadow in response to setLocalXY()", function() {
            element.enableShadow();

            element.setLocalXY(300, 400);

            expectBox(300, 400, 200, 100);
        });

        it("should realign the shadow in response to setX()", function() {
            element.enableShadow();

            element.setX(300);

            expectBox(300, 150, 200, 100);
        });

        it("should realign the shadow in response to setY()", function() {
            element.enableShadow();

            element.setY(300);

            expectBox(250, 300, 200, 100);
        });

        it("should realign the shadow in response to setXY()", function() {
            element.enableShadow();

            element.setXY([300, 400]);

            expectBox(300, 400, 200, 100);
        });

        it("should realign the shadow in response to setWidth()", function() {
            element.enableShadow();

            element.setWidth(400);

            expectBox(250, 150, 400, 100);
        });

        it("should realign the shadow in response to setHeight()", function() {
            element.enableShadow();

            element.setHeight(400);

            expectBox(250, 150, 200, 400);
        });

        it("should realign the shadow in response to setSize()", function() {
            element.enableShadow();

            element.setSize(450, 550);

            expectBox(250, 150, 450, 550);
        });

        it("should realign the shadow in response to setBox()", function() {
            element.enableShadow();

            element.setBox({
                x: 300,
                y: 400,
                width: 500,
                height: 600
            });

            expectBox(300, 400, 500, 600);
        });

        it("should disable the shadow", function() {
            element.enableShadow();

            var shadowEl = element.shadow.el;

            element.disableShadow();

            expect(element.shadow.el).toBeNull();
            expect(shadowEl.isVisible()).toBe(false);
        });

        it("should re-enable the shadow after disabling", function() {
            element.enableShadow();

            element.disableShadow();

            element.enableShadow();

            expect(element.shadow.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should realign the shadow when re-enabling if the target el was moved", function() {
            element.enableShadow();

            element.disableShadow();

            element.setXY([500, 450]);
            element.setSize(50, 60);

            element.enableShadow();

            expectBox(500, 450, 50, 60);
        });

        it("should hide the shadow when the target element is hidden", function() {
            element.enableShadow();

            var shadow = element.shadow,
                shadowEl = shadow.el;

            element.hide();

            expect(shadow.el).toBeNull();
            expect(shadowEl.isVisible()).toBe(false);
        });

        it("should show and realign the shadow when the target element is shown", function() {
            element.hide();

            element.enableShadow();

            element.show();

            expect(element.shadow.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should hide the shadow when the target element is hidden using setDisplayed", function() {
            element.enableShadow();

            var shadow = element.shadow,
                shadowEl = shadow.el;

            element.setDisplayed(false);

            expect(shadow.el).toBeNull();
            expect(shadowEl.isVisible()).toBe(false);
        });

        it("should show and realign the shadow when the target element is shown using setDisplayed", function() {
            element.setDisplayed(false);

            element.enableShadow();

            element.setDisplayed(true);

            expect(element.shadow.el.isVisible()).toBe(true);
            expectBox(250, 150, 200, 100);
        });

        it("should disable the shadow when disableShadow is called", function() {
            element.enableShadow();

            var shadow = element.shadow.el;

            expect(element.shadow.disabled).toBe(false);
            expect(element.shadow.el.isVisible()).toBe(true);

            element.disableShadow();

            expect(element.shadow.disabled).toBe(true);
            expect(shadow.isVisible()).toBe(false);
            expect(element.shadow.el).toBeNull();
        });

        it("should enable a disabled shadow when enableShadow is called", function() {
            element.enableShadow();
            element.disableShadow();
            element.enableShadow();

            expect(element.shadow.disabled).toBe(false);
            expect(element.shadow.el.isVisible()).toBe(true);
        });

        it("should realign a disabled shadow when it is re-enabled", function() {
            element.enableShadow();
            element.disableShadow();

            // move the element while shadow is disabled to make sure it re-aligns correctly
            element.setXY([575, 325]);
            element.setSize(250, 315);

            element.enableShadow();

            expectBox(575, 325, 250, 315);
        });

        it("should not attempt to hide a disabled shadow when the element is hidden", function() {
            element.enableShadow();
            element.disableShadow();

            spyOn(element.shadow, 'hide').andCallThrough();

            element.hide();

            expect(element.shadow.hide).not.toHaveBeenCalled();
        });

        it("should not show a disabled shadow when the element is shown", function() {
            element.enableShadow();

            element.hide();

            element.disableShadow();

            element.show();

            expect(element.shadow.el).toBeNull();
            expect(element.shadow.disabled).toBe(true);
        });

        (Ext.supports.Opacity ? it : xit)("should set the opacity of the shadow when the opacity of the element is changed", function() {
            element.enableShadow();

            element.setStyle('opacity', '0.5');

            expect(element.shadow.el.getStyle('opacity')).toBe('0.5');
        });

        describe("animate:false (default)", function() {
            it("should hide the shadow during setWidth animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setWidth(400, {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 400, 100);
                });
            });

            it("should hide the shadow during setHeight animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setHeight(500, {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 200, 500);
                });
            });

            it("should hide the shadow during setSize animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setSize(500, 400, {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 500, 400);
                });
            });

            it("should hide the shadow during setX animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setX(300, {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(300, 150, 200, 100);
                });
            });

            it("should hide the shadow during setY animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setY(350, {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 350, 200, 100);
                });
            });

            it("should hide the shadow during setXY animation", function() {
                var animationDone = false,
                    shadow, shadowEl;

                element.enableShadow();

                shadow = element.shadow;
                shadowEl = shadow.el;

                expect(shadowEl.isVisible()).toBe(true);

                element.setXY([350, 400], {
                    duration: 200,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return !shadow.el && !shadowEl.isVisible();
                }, "Shadow was never hidden", 150);

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(350, 400, 200, 100);
                });
            });

            describe("with disabled shadow", function() {
                it("should not show the shadow after setWidth animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setWidth(400, {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });

                it("should not show the shadow after setHeight animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setHeight(400, {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });

                it("should not show the shadow after setSize animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setSize(400, 500, {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });

                it("should not show the shadow after setX animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setX(300, {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });

                it("should not show the shadow after setY animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setY(300, {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });

                it("should not show the shadow after setXY animation", function() {
                    var animationDone = false;

                    element.enableShadow();
                    element.disableShadow();

                    spyOn(element.shadow, 'show').andCallThrough();

                    element.setXY([400, 350], {
                        duration: 10,
                        listeners: {
                            afteranimate: function() {
                                animationDone = true;
                            }
                        }
                    });

                    waitsFor(function() {
                        return animationDone;
                    }, "Animation never completed", 100);

                    runs(function() {
                        expect(element.shadow.show).not.toHaveBeenCalled();
                        expect(element.shadow.el).toBeNull();
                    });
                });
            });
        });

        describe("animate:true", function() {
            it("should not hide the shadow during setWidth animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setWidth(400, {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 400, 100);
                });
            });

            it("should not hide the shadow during setHeight animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setHeight(500, {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 200, 500);
                });
            });

            it("should not hide the shadow during setSize animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setSize(500, 400, {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 150, 500, 400);
                });
            });

            it("should not hide the shadow during setX animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setX(300, {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(300, 150, 200, 100);
                });
            });

            it("should not hide the shadow during setY animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setY(350, {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(250, 350, 200, 100);
                });
            });

            it("should not hide the shadow during setXY animation", function() {
                var animationDone = false;

                element.enableShadow({
                    animate: true
                });

                spyOn(element.shadow, 'hide').andCallThrough();

                expect(element.shadow.el.isVisible()).toBe(true);

                element.setXY([350, 400], {
                    duration: 50,
                    listeners: {
                        afteranimate: function() {
                            animationDone = true;
                        }
                    }
                });

                waitsFor(function() {
                    return animationDone;
                }, "Animation never completed", 300);

                runs(function() {
                    expect(element.shadow.hide).not.toHaveBeenCalled();
                    expect(element.shadow.el.isVisible()).toBe(true);
                    expectBox(350, 400, 200, 100);
                });
            });
        });
    });

    describe("shim and shadow together", function() {
        var element;

        beforeEach(function() {
            element = Ext.getBody().createChild({
                style: 'position:absolute;left:250px;top:150px;width:200px;height:100px;'
            });
        });

        afterEach(function() {
            element.destroy();
        });

        function expectShimBox(x, y, w, h) {
            var box = element.shim.el.getBox();

            expect(box.x).toBe(x);
            expect(box.y).toBe(y);
            expect(box.width).toBe(w);
            expect(box.height).toBe(h);
        }

        it("should place the shim before the shadow in the dom if the shadow was created first", function() {
            element.enableShadow();
            element.enableShim();

            expect(element.prev()).toBe(element.shadow.el);
            expect(element.shadow.el.prev()).toBe(element.shim.el);
        });

        it("should place the shim before the shadow in the dom if the shim was created first", function() {
            element.enableShim();
            element.enableShadow();

            expect(element.prev()).toBe(element.shadow.el);
            expect(element.shadow.el.prev()).toBe(element.shim.el);
        });

        it("should have the correct dom order after hiding and showing the shim", function() {
            element.enableShim();
            element.enableShadow();

            element.shim.hide();

            // reset the pool to make sure we're pulling a fresh element out of the pool
            // and not reusing the existing element that's already in the right order
            element.shim.getPool().reset();

            element.shim.show();

            expect(element.prev()).toBe(element.shadow.el);
            expect(element.shadow.el.prev()).toBe(element.shim.el);
        });

        it("should have the correct dom order after hiding and showing the shadow", function() {
            element.enableShim();
            element.enableShadow();

            element.shadow.hide();

            // reset the pool to make sure we're pulling a fresh element out of the pool
            // and not reusing the existing element that's already in the right order
            element.shadow.getPool().reset();

            element.shadow.show();

            expect(element.prev()).toBe(element.shadow.el);
            expect(element.shadow.el.prev()).toBe(element.shim.el);
        });

        it("should size the shim to include the target and shadow with mode=='drop'", function() {
            element.enableShim();
            element.enableShadow({
                mode: 'drop',
                offset: 30
            });

            expectShimBox(250, 150, 230, 130);
        });

        it("should size the shim to include the target and shadow with mode=='sides'", function() {
            element.enableShadow({
                mode: 'sides',
                offset: 30
            });
            element.enableShim();

            expectShimBox(220, 150, 260, 130);
        });

        it("should size the shim to include the target and shadow with mode=='frame'", function() {
            element.enableShim();
            element.enableShadow({
                mode: 'frame',
                offset: 30
            });

            expectShimBox(220, 120, 260, 160);
        });

        it("should size the shim to include the target and shadow with mode=='bottom'", function() {
            element.enableShadow({
                mode: 'bottom',
                offset: 30
            });
            element.enableShim();

            expectShimBox(220, 150, 260, 130);
        });
    });

    describe("using flyweights", function() {
        it("should be able to remove a class using a fly when the className is modified directly", function() {
            var el = document.createElement('div');
            Ext.fly(el).addCls(['foo', 'bar', 'baz']);
            el.className += ' asdf';
            Ext.fly(el).removeCls('asdf');
            expect(el.className.indexOf('asdf')).toBe(-1);
        });

        it("should be able to check a class exists using a fly when the className is modified directly", function() {
            var el = document.createElement('div');
            Ext.fly(el).addCls(['foo', 'bar', 'baz']);
            el.className += ' asdf';
            expect(Ext.fly(el).hasCls('asdf')).toBe(true);
        });
    });

    describe("events", function() {
        function makeSuite(delegated) {

            describe("element " + (delegated ? "(with delegated listeners)" : "(with direct listeners)"), function() {
                var element, handler, handler2, scope, args, child, child2, grandchild;

                function addListener(opt) {
                    element.addListener(Ext.apply({
                        click: handler,
                        delegated: delegated,
                        translate: false
                    }, opt));
                }

                function removeListener(opt) {
                    element.removeListener(Ext.apply({
                        click: handler
                    }, opt));
                }

                function fire(el, eventName) {
                    jasmine.fireMouseEvent(el || element, eventName || 'click');
                }

                beforeEach(function() {
                    handler = jasmine.createSpy();
                    handler.andCallFake(function() {
                        scope = this;
                        args = arguments;
                    });
                    handler2 = jasmine.createSpy();

                    element = Ext.getBody().createChild({
                        id: 'parent',
                        cn: [
                            {
                                id: 'child',
                                cls: 'child',
                                cn: { id: 'grandchild', cls: 'grandchild' }
                            },
                            {
                                id: 'child2'
                            }
                        ]
                    });

                    child = document.getElementById('child');
                    child2 = document.getElementById('child2');
                    grandchild = document.getElementById('grandchild');
                });

                afterEach(function() {
                    element.destroy();
                });

                describe("addListener", function() {
                    it("should handle an event", function() {
                        addListener();
                        fire();
                        expect(handler.callCount).toBe(1);
                        expect(args[0] instanceof Ext.event.Event).toBe(true);
                        expect(args[1]).toBe(element.dom);
                        expect(args[2]).toEqual({
                            click: handler,
                            delegated: delegated,
                            translate: false
                        });
                        expect(scope).toBe(element);
                    });

                    it("should handle an event that bubbled from a descendant element", function() {
                        addListener();
                        fire(grandchild);
                        expect(handler.callCount).toBe(1);
                        expect(args[0] instanceof Ext.event.Event).toBe(true);
                        expect(args[1]).toBe(grandchild);
                        expect(args[2]).toEqual({
                            click: handler,
                            delegated: delegated,
                            translate: false
                        });
                        expect(scope).toBe(element);
                    });

                    it("should attach multiple handlers to the same event", function() {
                        addListener();
                        addListener({ click: handler2 });
                        fire();
                        expect(handler.callCount).toBe(1);
                        expect(handler2.callCount).toBe(1);
                    });

                    it("should call the event handler with the correct scope when the scope option is used", function() {
                        var obj = {};

                        addListener({ scope: obj });
                        fire();
                        expect(scope).toBe(obj);
                    });

                    it("should call the handler multiple times if the event fires more than once", function() {
                        addListener();
                        fire();
                        fire();
                        fire();
                        expect(handler.callCount).toBe(3);
                    });

                    it("should remove a single listener after the first fire", function() {
                        addListener({ single: true });
                        fire();
                        expect(handler.callCount).toBe(1);
                        // fire again
                        fire();
                        // still 1
                        expect(handler.callCount).toBe(1);
                    });

                    it("should delay the listener", function() {
                        addListener({ delay: 150 });
                        fire();
                        waits(100);
                        runs(function() {
                            expect(handler).not.toHaveBeenCalled();
                        });
                        waits(100);
                        runs(function() {
                            expect(handler).toHaveBeenCalled();
                        });
                    });

                    it("should buffer the listener", function() {
                        addListener({ buffer: 150 });
                        fire();
                        waits(100);
                        runs(function() {
                            expect(handler).not.toHaveBeenCalled();
                            fire();
                        });
                        waits(100);
                        runs(function() {
                            expect(handler).not.toHaveBeenCalled();
                        });
                        waits(100);
                        runs(function() {
                            expect(handler).toHaveBeenCalled();
                        });
                    });

                    it("should attach listeners with a delegate selector", function() {
                        addListener({ delegate: '.grandchild' });
                        fire(child);
                        expect(handler).not.toHaveBeenCalled();
                        fire(grandchild);
                        expect(handler).toHaveBeenCalled();
                    });

                    it("should attach listeners with a descendant delegate selector as a direct child", function() {
                        addListener({ delegate: '.child' });
                        fire(child2);
                        expect(handler).not.toHaveBeenCalled();
                        fire(child);
                        expect(handler).toHaveBeenCalled();
                    });

                    it("should attach listeners with a direct child delegate selector", function() {
                        addListener({ delegate: '> .child' });
                        fire(child2);
                        expect(handler).not.toHaveBeenCalled();
                        fire(child);
                        expect(handler).toHaveBeenCalled();
                    });

                    it("should pass the target as the delegate item when the event occurs in a child and leave the event target untouched", function() {
                        addListener({delegate: '.child'});
                        fire(grandchild);
                        expect(handler).toHaveBeenCalled();
                        expect(handler.mostRecentCall.args[0].target).toBe(grandchild);
                        expect(handler.mostRecentCall.args[1]).toBe(child);
                    });

                    describe("propagation", function() {
                        var results;

                        beforeEach(function() {
                            results = [];
                            grandchild = Ext.get('grandchild');
                            child = Ext.get('child');
                        });

                        afterEach(function() {
                            grandchild.destroy();
                            child.destroy();
                        });

                        it("should fire bubble listeners in bottom-up order", function() {
                            element.on({
                                click: function() {
                                    results.push(1);
                                }
                            });

                            child.on({
                                click: function() {
                                    results.push(2);
                                }
                            });

                            grandchild.on({
                                click: function() {
                                    results.push(3);
                                }
                            });

                            fire(grandchild);

                            expect(results).toEqual([3, 2, 1]);
                        });

                        it("should fire capture listeners in top-down order", function() {
                            element.on({
                                click: function() {
                                    results.push(1);
                                },
                                capture: true
                            });

                            child.on({
                                click: function() {
                                    results.push(2);
                                },
                                capture: true
                            });

                            grandchild.on({
                                click: function() {
                                    results.push(3);
                                },
                                capture: true
                            });

                            fire(grandchild);

                            expect(results).toEqual([1, 2, 3]);
                        });

                        it("should stop bubbling when stopPropagation is called", function() {
                            element.on({
                                click: handler
                            });

                            grandchild.on({
                                click: function(e) {
                                    e.stopPropagation();
                                }
                            });

                            fire(grandchild);

                            expect(handler).not.toHaveBeenCalled();
                        });

                        it("should stop propagating when stopPropagation is called during the capture phase", function() {
                            element.on({
                                click: function(e) {
                                    e.stopPropagation();
                                },
                                capture: true
                            });

                            grandchild.on({
                                click: handler,
                                capture: true
                            });

                            fire(grandchild);

                            expect(handler).not.toHaveBeenCalled();
                        });

                        it("should skip the entire bubble phase if stopPropagation is called during the capture phase", function() {
                            element.on({
                                click: function(e) {
                                    e.stopPropagation();
                                },
                                capture: true
                            });

                            element.on({
                                click: handler
                            });

                            grandchild.on({
                                click: handler2
                            });

                            fire(grandchild);

                            expect(handler).not.toHaveBeenCalled();
                            expect(handler2).not.toHaveBeenCalled();
                        });

                        it("should propagate to elements that were not in the cache when propagation began", function() {
                            // https://sencha.jira.com/browse/EXTJS-15953
                            var parent = Ext.getBody().createChild({ cn: [{}] }, null, true),
                                child = parent.firstChild,
                                parentFired = false;

                            Ext.get(child).on('click', function() {
                                // Calling Ext.get() will add the parent element to the cache for the first time.
                                Ext.get(parent).on('click', function() {
                                    parentFired = true;
                                });
                            });

                            jasmine.fireMouseEvent(child, 'click');

                            expect(parentFired).toBe(true);

                            Ext.get(parent).destroy();
                        })
                    });
                });

                describe("removeListener", function() {
                    it("should remove the event listener", function() {
                        addListener();
                        removeListener();
                        fire();
                        expect(handler).not.toHaveBeenCalled();
                    });

                    it("should remove the event listener with scope", function() {
                        var scope = {};
                        addListener({ scope: scope });
                        removeListener({ scope: scope });
                        fire();
                        expect(handler).not.toHaveBeenCalled();
                    });

                    it("should remove multiple handlers from the same event", function() {
                        addListener();
                        addListener({ click: handler2 });
                        removeListener();
                        fire();
                        expect(handler).not.toHaveBeenCalled();
                        expect(handler2.callCount).toBe(1);
                        removeListener({ click: handler2 });
                        fire();
                        expect(handler2.callCount).toBe(1);
                    });


                    it("should remove a single event listener", function() {
                        addListener({ single: true });
                        removeListener();
                        fire();
                        expect(handler).not.toHaveBeenCalled();
                    });

                    it("should remove a delayed event listener", function() {
                        addListener({ delay: 50 });
                        removeListener();
                        fire();
                        waits(100);
                        runs(function() {
                            expect(handler).not.toHaveBeenCalled();
                        });
                    });

                    it("should remove a buffered event listener", function() {
                        addListener({ buffer: 50 });
                        removeListener();
                        fire();
                        waits(100);
                        runs(function() {
                            expect(handler).not.toHaveBeenCalled();
                        });
                    });

                    it("should remove listeners with a delegate selector", function() {
                        addListener({ delegate: '.grandchild' });
                        removeListener();
                        fire(grandchild);
                        expect(handler).not.toHaveBeenCalled();
                    });

                    it("should remove a capture listener", function() {
                        addListener({ capture: true });
                        removeListener();
                        fire(grandchild);
                        expect(handler).not.toHaveBeenCalled();
                    });

                    it("should remove a translated listener", function() {
                        var eventMap = Ext.Element.prototype.eventMap;

                        eventMap.foo = 'click';

                        element.addListener({ foo: handler });
                        element.removeListener({ foo: handler });
                        fire(grandchild);
                        expect(handler).not.toHaveBeenCalled();

                        delete eventMap.foo;
                    });
                });

                describe("clearListeners", function() {
                    it("should remove all the listeners", function() {
                        var handler3 = jasmine.createSpy(),
                            handler4 = jasmine.createSpy();

                        element.on({
                            click: handler
                        });

                        element.on({
                            click: handler2,
                            delegate: '.grandchild'
                        });

                        element.on({
                            click: handler3,
                            capture: true
                        });

                        element.on({
                            click: handler4
                        });

                        element.clearListeners();

                        fire(grandchild);

                        expect(handler).not.toHaveBeenCalled();
                        expect(handler2).not.toHaveBeenCalled();
                        expect(handler3).not.toHaveBeenCalled();
                        expect(handler4).not.toHaveBeenCalled();
                    });
                });
            });
        }

        makeSuite(true);
        makeSuite(false);

        describe("Event Normalization", function() {
            var target, fire, events, secondaryEvents, listeners;

            beforeEach(function() {
                target = Ext.getBody().createChild();

                listeners = {
                    mousedown: jasmine.createSpy(),
                    mousemove: jasmine.createSpy(),
                    mouseup: jasmine.createSpy(),
                    touchstart: jasmine.createSpy(),
                    touchmove: jasmine.createSpy(),
                    touchend: jasmine.createSpy(),
                    pointerdown: jasmine.createSpy(),
                    pointermove: jasmine.createSpy(),
                    pointerup: jasmine.createSpy()
                };

                target.on(listeners);
            });

            afterEach(function() {
                target.destroy();
            });

            if (Ext.supports.PointerEvents) {
                events = {
                    start: 'pointerdown',
                    move: 'pointermove',
                    end: 'pointerup'
                };

                fire = function(type) {
                    jasmine.firePointerEvent(target, events[type]);
                };
            } else if (Ext.supports.MSPointerEvents) {
                events = {
                    start: 'MSPointerDown',
                    move: 'MSPointerMove',
                    end: 'MSPointerUp'
                };

                fire = function(type) {
                    jasmine.firePointerEvent(target, events[type]);
                };
            } else if (Ext.supports.TouchEvents) {
                events = {
                    start: 'touchstart',
                    move: 'touchmove',
                    end: 'touchend'
                };

                secondaryEvents = {
                    start: 'mousedown',
                    move: 'mousemove',
                    end: 'mouseup'
                };

                fire = function(type, secondary) {
                    if (secondary) {
                        jasmine.fireMouseEvent(target, secondaryEvents[type], 100, 100);
                    } else {
                        jasmine.fireTouchEvent(target, events[type], [{ pageX: 1, pageY: 1 }]);
                    }
                };
            } else {
                events = {
                    start: 'mousedown',
                    move: 'mousemove',
                    end: 'mouseup'
                };

                fire = function(type) {
                    jasmine.fireMouseEvent(target, events[type]);
                };
            }

            it("should fire start events", function() {
                fire('start');
                expect(listeners.pointerdown.callCount).toBe(1);
                expect(listeners.touchstart.callCount).toBe(1);
                expect(listeners.mousedown.callCount).toBe(1);
                expect(listeners.pointerdown.mostRecentCall.args[0].type).toBe('pointerdown');
                expect(listeners.touchstart.mostRecentCall.args[0].type).toBe('touchstart');
                expect(listeners.mousedown.mostRecentCall.args[0].type).toBe('mousedown');
            });

            it("should fire move events", function() {
                fire('move');
                expect(listeners.pointermove.callCount).toBe(1);
                expect(listeners.touchmove.callCount).toBe(1);
                expect(listeners.mousemove.callCount).toBe(1);
                expect(listeners.pointermove.mostRecentCall.args[0].type).toBe('pointermove');
                expect(listeners.touchmove.mostRecentCall.args[0].type).toBe('touchmove');
                expect(listeners.mousemove.mostRecentCall.args[0].type).toBe('mousemove');
            });

            it("should fire end events", function() {
                fire('end');
                expect(listeners.pointerup.callCount).toBe(1);
                expect(listeners.touchend.callCount).toBe(1);
                expect(listeners.mouseup.callCount).toBe(1);
                expect(listeners.pointerup.mostRecentCall.args[0].type).toBe('pointerup');
                expect(listeners.touchend.mostRecentCall.args[0].type).toBe('touchend');
                expect(listeners.mouseup.mostRecentCall.args[0].type).toBe('mouseup');
            });

            if (Ext.supports.TouchEvents && Ext.isWebKit && Ext.os.is.Desktop) {
                // Touch Enabled webkit on windows 8 fires both mouse and touch events We already
                // tested the touch events above, so make sure mouse events/ work as well.

                it("should fire secondary start events", function() {
                    fire('start', true);
                    expect(listeners.pointerdown.callCount).toBe(1);
                    expect(listeners.touchstart.callCount).toBe(1);
                    expect(listeners.mousedown.callCount).toBe(1);
                    expect(listeners.pointerdown.mostRecentCall.args[0].type).toBe('pointerdown');
                    expect(listeners.touchstart.mostRecentCall.args[0].type).toBe('touchstart');
                    expect(listeners.mousedown.mostRecentCall.args[0].type).toBe('mousedown');
                });

                it("should fire secondary move events", function() {
                    fire('move', true);
                    expect(listeners.pointermove.callCount).toBe(1);
                    expect(listeners.touchmove.callCount).toBe(1);
                    expect(listeners.mousemove.callCount).toBe(1);
                    expect(listeners.pointermove.mostRecentCall.args[0].type).toBe('pointermove');
                    expect(listeners.touchmove.mostRecentCall.args[0].type).toBe('touchmove');
                    expect(listeners.mousemove.mostRecentCall.args[0].type).toBe('mousemove');
                });

                it("should fire secondary end events", function() {
                    fire('end', true);
                    expect(listeners.pointerup.callCount).toBe(1);
                    expect(listeners.touchend.callCount).toBe(1);
                    expect(listeners.mouseup.callCount).toBe(1);
                    expect(listeners.pointerup.mostRecentCall.args[0].type).toBe('pointerup');
                    expect(listeners.touchend.mostRecentCall.args[0].type).toBe('touchend');
                    expect(listeners.mouseup.mostRecentCall.args[0].type).toBe('mouseup');
                });
            }
        });

        describe("delegates event order", function() {
            var root, spy;

            function doClick(el) {
                jasmine.fireMouseEvent(el, 'click');
            }

            beforeEach(function() {
                spy = jasmine.createSpy();
            });

            afterEach(function() {
                root = spy = Ext.destroy(root);
            });

            it("should fire an event when the event target matches the selector", function() {
                root = Ext.getBody().createChild({
                    children: [{
                        cls: 'foo'
                    }]
                });
                root.on('click', spy, null, {delegate: '.foo'});
                doClick(root.first());
                expect(spy.callCount).toBe(1);
            });

            it("should not fire an event when the event target doesn't match the selector", function() {
                root = Ext.getBody().createChild({
                    children: [{
                        cls: 'foo'
                    }]
                });
                root.on('click', spy, null, {delegate: '.bar'});
                doClick(root.first());
                expect(spy).not.toHaveBeenCalled();
            });

            it("should have the element that triggered the event as the event target", function() {
                root = Ext.getBody().createChild({
                    children: [{
                        cls: 'foo',
                        children: [{
                            cls: 'bar'
                        }]
                    }]
                });
                var bar = root.down('.bar').dom;
                root.on('click', spy, null, {delegate: '.foo'});
                doClick(bar);
                expect(spy.mostRecentCall.args[0].target).toBe(bar);
            });

            it("should pass the delegate target as the second parameter", function() {
                root = Ext.getBody().createChild({
                    children: [{
                        cls: 'foo',
                        children: [{
                            cls: 'bar'
                        }]
                    }]
                });
                var bar = root.down('.bar').dom,
                    foo = root.down('.foo').dom;

                root.on('click', spy, null, {delegate: '.foo'});
                doClick(bar);
                expect(spy.mostRecentCall.args[1]).toBe(foo);
            });

            describe("event order", function() {
                it("should fire delegate events at the 'level' of the root", function() {
                    root = Ext.getBody().createChild({
                        children: [{
                            cls: 'foo',
                            children: [{
                                cls: 'bar',
                                children: [{
                                    cls: 'baz'
                                }]
                            }]
                        }]
                    });

                    var foo = root.down('.foo'),
                        bar = root.down('.bar'),
                        baz = root.down('.baz'),
                        order = [];

                    root.on('click', function() { order.push('baz'); }, null, {delegate: '.baz'});
                    bar.on('click', function() { order.push('bar'); });
                    foo.on('click', function() { order.push('foo'); });

                    doClick(baz.dom);
                    expect(order).toEqual(['bar', 'foo', 'baz']);
                });

                it("should fire delegate events in DOM order", function() {
                    root = Ext.getBody().createChild({
                        id: 'root',
                        children: [{
                            id: 'child1',
                            children: [{
                                id: 'child1_1',
                                children: [{
                                    cls: 'foo'
                                }]
                            }, {
                                cls: 'foo'
                            }]
                        }, {
                            id: 'child2',
                            children: [{
                                cls: 'foo'
                            }]
                        }, {
                            cls: 'foo'
                        }]
                    });

                    var child1 = Ext.get('child1'),
                        child2 = Ext.get('child2'),
                        child1_1 = Ext.get('child1_1'),
                        order = [];


                    root.on('click', function() { order.push('root'); }, null, {delegate: '.foo'});
                    child1.on('click', function() { order.push('child1'); }, null, {delegate: '.foo'});
                    child1_1.on('click', function() { order.push('child1_1'); }, null, {delegate: '.foo'});
                    child2.on('click', function() { order.push('child2'); }, null, {delegate: '.foo'});

                    doClick(child1_1.down('.foo', true), 'click');
                    expect(order).toEqual(['child1_1', 'child1', 'root']);
                    Ext.destroy(child1_1, child1, child2);
                });
            });
        });

        describe('listener arguments', function() {
            it('should fire an event with the correct signature on every element in the bubble stack', function() {
                https://sencha.jira.com/browse/EXTJS-15735
                var c1 = Ext.getBody().appendChild({
                        id: 'c1',
                        cn: {
                            id: 'c2',
                            cn: {
                                id: 'c3',
                                cn: {
                                    id: 'c4'
                                }
                            }
                        }
                    }),
                    c2 = Ext.get(c1.dom.firstChild),
                    c3 = Ext.get(c2.dom.firstChild),
                    c4 = Ext.get(c3.dom.firstChild),
                    c1opts = { el: c1 },
                    c2opts = { el: c2 },
                    c3opts = { el: c3 },
                    c4opts = { el: c4 },
                    argLen;

                c1.on('click', function(e, t, o) {
                    // Arg list must be same length as at start of bubble
                    expect(arguments.length).toBe(argLen);
                    // Element DOM event signature is event, target, options
                    expect(e.$className).toBe("Ext.event.Event");
                    expect(t).toBe(c4.dom);
                    expect(o.el === c1).toBe(true);
                }, null, c1opts);
                c2.on('click', function(e, t, o) {
                    expect(arguments.length).toBe(argLen);
                    expect(e.$className).toBe("Ext.event.Event");
                    expect(t).toBe(c4.dom);
                    expect(o.el === c2).toBe(true);
                }, null, c2opts);
                c3.on('click', function(e, t, o) {
                    expect(arguments.length).toBe(argLen);
                    expect(e.$className).toBe("Ext.event.Event");
                    expect(t).toBe(c4.dom);
                    expect(o.el === c3).toBe(true);
                }, null, c3opts);
                c4.on('click', function(e, t, o) {
                    // Arguments length should be the same in all listeners as it bubbles
                    argLen = arguments.length;

                    expect(e.$className).toBe("Ext.event.Event");
                    expect(t).toBe(c4.dom);
                    expect(o.el === c4).toBe(true);
                }, null, c4opts);
                jasmine.fireMouseEvent(c4, 'click');

                c1.destroy();
            });
        });

        it("should fire delegated, non-delegated, capture and bubble events in the correct order", function() {
            var parent = Ext.getBody().createChild({
                    cn: [{
                        id: 'child',
                        cn: [{
                            id: 'grandchild'
                        }]
                    }]
                }),
                child = Ext.get('child'),
                grandchild = Ext.get('grandchild'),
                result = [];

            parent.on({
                mousedown: function() {
                    result.push('p');
                }
            });

            parent.on({
                mousedown: function() {
                    result.push('pc');
                },
                capture: true
            });

            parent.on({
                mousedown: function() {
                    result.push('pd');
                },
                delegated: false
            });

            parent.on({
                mousedown: function() {
                    result.push('pdc');
                },
                delegated: false,
                capture: true
            });

            child.on({
                mousedown: function() {
                    result.push('c');
                }
            });

            child.on({
                mousedown: function() {
                    result.push('cc');
                },
                capture: true
            });

            child.on({
                mousedown: function() {
                    result.push('cd');
                },
                delegated: false
            });

            child.on({
                mousedown: function() {
                    result.push('cdc');
                },
                delegated: false,
                capture: true
            });

            grandchild.on({
                mousedown: function() {
                    result.push('g');
                }
            });

            grandchild.on({
                mousedown: function() {
                    result.push('gc');
                },
                capture: true
            });

            grandchild.on({
                mousedown: function() {
                    result.push('gdc');
                },
                delegated: false,
                capture: true
            });

            grandchild.on({
                mousedown: function() {
                    result.push('gd');
                },
                delegated: false
            });

            jasmine.fireMouseEvent(grandchild, 'mousedown');

            if (Ext.isIE9m) {
                // Since we don't support "direct capture" on IE9m the order is a bit different
                expect(result).toEqual(['gd', 'gdc', 'cdc', 'cd', 'pdc', 'pd', 'pc', 'cc', 'gc', 'g', 'c', 'p'])
            } else {
                expect(result).toEqual(['pdc', 'cdc', 'gdc', 'gd', 'cd', 'pd', 'pc', 'cc', 'gc', 'g', 'c', 'p'])
            }

            parent.destroy();
        });

        it("should lowercase the event name before adding it to hasListeners", function() {
            var el = Ext.getBody().createChild({});

            el.on('foO', 'onFoo');
            expect(el.hasListeners.foO).toBeUndefined();
            expect(el.hasListeners.foo).toBe(1);

            el.destroy();
        });

        it("should translate the event name before adding it to hasListeners", function() {
            var el = Ext.getBody().createChild({});

            el.eventMap = {
                click: 'tap'
            };

            el.on('click', 'onClick');
            expect(el.hasListeners.click).toBeUndefined();
            expect(el.hasListeners.tap).toBe(1);

            el.destroy();
        });

        it("should translate and lowercase the event name before adding it to hasListeners", function() {
            var el = Ext.getBody().createChild({});

            el.eventMap = {
                click: 'tap'
            };

            el.on('cLicK', 'onClick');
            expect(el.hasListeners.cLicK).toBeUndefined();
            expect(el.hasListeners.click).toBeUndefined();
            expect(el.hasListeners.tap).toBe(1);

            el.destroy();
        });

        it("should fire a translated event", function() {
            var el = Ext.getBody().createChild({}),
                handler = jasmine.createSpy();

            el.eventMap = {
                click: 'tap'
            };

            el.on('click', handler);
            jasmine.fireMouseEvent(el, 'mousedown');
            jasmine.fireMouseEvent(el, 'mouseup');
            expect(handler).toHaveBeenCalled();

            el.destroy();
        });

        it("should fire a lowercased event", function() {
            var el = Ext.getBody().createChild({}),
                handler = jasmine.createSpy();

            el.on('cLicK', handler);
            jasmine.fireMouseEvent(el, 'click');
            expect(handler).toHaveBeenCalled();

            el.destroy();
        });

        it("should fire a translated and lowercased event", function() {
            var el = Ext.getBody().createChild({}),
                handler = jasmine.createSpy();

            el.eventMap = {
                click: 'tap'
            };

            el.on('cLicK', handler);
            jasmine.fireMouseEvent(el, 'mousedown');
            jasmine.fireMouseEvent(el, 'mouseup');
            expect(handler).toHaveBeenCalled();

            el.destroy();
        });

        describe("options", function() {
            var el;

            beforeEach(function() {
                el = Ext.getBody().createChild({});
            });

            afterEach(function() {
                el.destroy();
                el = null;
            });

            it("should call preventDefault if the preventDefault option is passed", function() {
                var spy = spyOn(Ext.event.Event.prototype, 'preventDefault');

                el.on('click', function() {}, null, {preventDefault: true});
                jasmine.fireMouseEvent(el, 'click');
                expect(spy.callCount).toBe(1);
            });

            it("should call stopPropagation if the stopPropagation option is passed", function() {
                var spy = spyOn(Ext.event.Event.prototype, 'stopPropagation');

                el.on('click', function() {}, null, {stopPropagation: true});
                jasmine.fireMouseEvent(el, 'click');
                expect(spy.callCount).toBe(1);
            });

            it("should call stopEvent if the stopEvent option is passed", function() {
                var spy = spyOn(Ext.event.Event.prototype, 'stopEvent');

                el.on('click', function() {}, null, {stopEvent: true});
                jasmine.fireMouseEvent(el, 'click');
                expect(spy.callCount).toBe(1);
            });
        });
    });

}, "/src/dom/Element.js");
