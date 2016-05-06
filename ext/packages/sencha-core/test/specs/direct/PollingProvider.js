describe("Ext.direct.PollingProvider", function() {
    var provider, remotingProvider;
    
    function createProvider(config) {
        config = Ext.apply({}, config , {
            url: '/foo',
            baseParams: { foo: 'bar' }
        });
        
        provider = new Ext.direct.PollingProvider(config);
    }
    
    function makeSpy(name) {
        var directCfg = spec.DirectSpecs[name].directCfg,
            spy = spyOn(spec.DirectSpecs, name);

        spy.directCfg = directCfg;
        
        return spy;
    }
    
    function gutEvent(event) {
        return {
            type: event.type,
            name: event.name,
            data: event.data
        }
    }
    
    beforeEach(function() {
        remotingProvider = Ext.direct.Manager.addProvider({
            type: 'remoting',
            url: '/bar',
            'namespace': 'spec',
            actions: {
                DirectSpecs: [{
                    name: 'pollFn',
                    params: ['foo']
                }]
            }
        });

        createProvider();
    });
    
    afterEach(function() {
        if (provider) {
            provider.disconnect();
            provider.destroy();
            provider = null;
        }
        
        if (remotingProvider) {
            remotingProvider.disconnect();
            remotingProvider.destroy();
            remotingProvider = null;
        }
        
        Ext.direct.Manager.clearAllMethods();
        
        window.spec = null;
        
        Ext.util.TaskManager.stopAll();
    });
    
    describe("construction", function() {
        it("should create pollTask", function() {
            expect(provider.pollTask.isTask).toBe(true);
        });
        
        it("should not start pollTask", function() {
            expect(provider.pollTask.stopped).toBe(true);
        });
    });
    
    describe("should handle connect:", function() {
        beforeEach(function() {
            spyOn(provider, 'runPoll').andReturn();
        });
        
        it("starts poll task", function() {
            provider.connect();
            
            expect(provider.pollTask.pending).toBe(true);
        });
        
        it("fires 'connect' event", function() {
            var handler = jasmine.createSpy('connect handler');
            
            provider.on('connect', handler);
            provider.connect();
            
            expect(handler).toHaveBeenCalled();
        });
        
        describe("polling with direct fn", function() {
            it("should warn when url is a function", function() {
                var spy = spyOn(Ext.log, 'warn');
                
                provider.url = Ext.emptyFn;
                
                provider.connect();
                
                expect(spy).toHaveBeenCalledWith(
                    'Using a function for url is deprecated, use pollFn instead.'
                );
            });
            
            it("should resolve string pollFn", function() {
                provider.pollFn = 'spec.DirectSpecs.pollFn';
                
                provider.connect();
                
                expect(provider.pollFn).toBe(spec.DirectSpecs.pollFn);
            });
        });
    });
    
    describe("should handle disconnect:", function() {
        beforeEach(function() {
            spyOn(provider, 'runPoll').andReturn();
            
            provider.connect();
        });
        
        it("stops polling task", function() {
            provider.disconnect();
            
            expect(provider.pollTask.stopped).toBe(true);
        });
        
        it("fires 'disconnect' event", function() {
            var handler = jasmine.createSpy('disconnect handler');
            
            provider.on('disconnect', handler);
            provider.disconnect();
            
            expect(handler).toHaveBeenCalled();
        });
    });
    
    describe("should handle polling:", function() {
        beforeEach(function() {
            spyOn(Ext.Ajax, 'request').andReturn();
            
            provider.connect();
        });
        
        it("should fire 'beforepoll' event", function() {
            var handler = jasmine.createSpy('beforepoll handler');
            
            provider.on('beforepoll', handler);
            provider.runPoll();
            
            expect(handler).toHaveBeenCalled();
        });
        
        it("should make Ajax request if url is a string", function() {
            provider.runPoll();
            
            expect(Ext.Ajax.request).toHaveBeenCalledWith({
                url: '/foo',
                params: { foo: 'bar' },
                scope: provider,
                callback: provider.onData
            });
        });
        
        it("should fire 'poll' event", function() {
            var handler = jasmine.createSpy('poll handler');
            
            provider.on('poll', handler);
            provider.runPoll();
            
            expect(handler).toHaveBeenCalled();
        });
        
        describe("direct functions", function() {
            var pollFn;
            
            beforeEach(function() {
                pollFn = makeSpy('pollFn');
                
                // Deprecation warning is expected
                spyOn(Ext.log, 'warn');
                
                provider = null;
            });
            
            afterEach(function() {
                provider.disconnect();
            });
            
            describe("url as function", function() {
                beforeEach(function() {
                    createProvider({
                        url: pollFn,
                        baseParams: undefined
                    });
            
                    provider.connect();
                });
            
                it("runs url() without baseParams by default", function() {
                    provider.runPoll();
                
                    var args = pollFn.mostRecentCall.args;
                
                    expect(args[0]).toEqual({});
                });
            
                it("runs url() with baseParams when it is defined", function() {
                    provider.baseParams = { foo: 'bar' };
                
                    provider.runPoll();
                
                    var args = pollFn.mostRecentCall.args;
                
                    expect(args[0]).toEqual({ foo: 'bar' });
                });
            });
        
            describe("pollFn", function() {
                beforeEach(function() {
                    createProvider({
                        pollFn: pollFn,
                        url: undefined,
                        baseParams: undefined
                    });
                    
                    provider.connect();
                });
                
                it("runs pollFn without baseParams by default", function() {
                    provider.runPoll();
                    
                    var args = pollFn.mostRecentCall.args;
                    
                    expect(args[0]).toEqual({});
                });
                
                it("runs pollFn with baseParams with it is defined", function() {
                    provider.baseParams = { bar: 'baz' };
                    
                    provider.runPoll();
                    
                    var args = pollFn.mostRecentCall.args;
                    
                    expect(args[0]).toEqual({ bar: 'baz' });
                });
            });
        });
    });
    
    describe("getInterval", function() {
        it("should return default interval", function() {
            expect(provider.getInterval()).toBe(3000);
        });
        
        it("should return actual pollTask interval", function() {
            provider.pollTask.interval = 5000;
            
            expect(provider.getInterval()).toBe(5000);
        });
    });
    
    describe("setInterval", function() {
        it("should raise error when interval is too short", function() {
            expect(function() {
                provider.setInterval(10);
            }).toThrow(
                'Attempting to configure PollProvider ' + provider.id +
                ' with interval that is less than 100ms.'
            );
        });
        
        it("should set new interval config", function() {
            provider.setInterval(5000);
            
            expect(provider.interval).toBe(5000);
        });
        
        it("should set pollTask interval", function() {
            provider.setInterval(10000);
            
            expect(provider.pollTask.interval).toBe(10000);
        });
        
        it("should restart pollTask if connected", function() {
            provider.connect();
            
            spyOn(provider.pollTask, 'restart');
            
            provider.setInterval(15000);
            
            expect(provider.pollTask.restart).toHaveBeenCalled();
        });
    });
    
    describe("Ajax responses", function() {
        var handler;
        
        beforeEach(function() {
            handler = jasmine.createSpy('data handler');
            provider.on('data', handler);
        });
        
        it("fires exception when poll is unsuccessful", function() {
            provider.onData({}, false, { foo: 'bar' });
            
            var args = handler.argsForCall[0],
                ex   = new Ext.direct.ExceptionEvent({
                    data: null,
                    code: Ext.direct.Manager.exceptions.TRANSPORT,
                    message: 'Unable to connect to the server.',
                    xhr: { foo: 'bar' }
                });
            
            expect(args[1]).toEqual(ex);
        });
        
        it("doesn't fire 'data' event when dataset is empty", function() {
            spyOn(provider, 'createEvents').andCallThrough();
            
            provider.onData({}, true, {});
            
            expect(provider.createEvents).toHaveBeenCalled();
            // AND
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("fires 'data' event when dataset contains events", function() {
            var Event = Ext.direct.Event,
                eventData = [{
                    type: 'event',
                    name: 'foo',
                    data: { foo: 'bar' }
                }, {
                    type: 'event',
                    name: 'bar',
                    data: null
                }, {
                    type: 'event',
                    name: 'baz',
                    data: ['foo', 'bar']
                }, {
                    type: 'event',
                    name: 'qux',
                    data: 'plugh'
                }],
                events, result;

            provider.onData({}, true, { responseText: Ext.encode(eventData) });
            
            events = Ext.Array.map(eventData, function(i) {
                return new Event(i);
            });
            
            result = Ext.Array.map(handler.argsForCall, function(i) {
                return i[1];
            });
            
            expect(result).toEqual(events);
        });
    });
    
    describe("Ajax errors", function() {
        var handler;
        
        beforeEach(function() {
            handler = jasmine.createSpy('data handler');
            provider.on('data', handler);
        });
        
        it("doesn't break on undefined response", function() {
            provider.onData({}, true, { responseText: undefined });
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("doesn't break on null response", function() {
            provider.onData({}, true, { responseText: null });
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("doesn't break on empty string response", function() {
            provider.onData({}, true, { responseText: '' });
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("doesn't break on empty dataset returned", function() {
            provider.onData({}, true, { responseText: Ext.JSON.encode([]) });
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("raises exception on garbled json response", function() {
            // Suppress console error and dump
            spyOn(Ext, 'log');
            
            provider.onData({}, true, { responseText: 'invalid json' });
            
            var args = handler.argsForCall[0][1],
                xcpt = {
                    code: args.code,
                    message: args.message
                };
            
            expect(xcpt).toEqual({
                code: Ext.direct.Manager.exceptions.PARSE,
                message: "Error parsing json response: \n\n Ext.JSON.decode(): You're trying to decode an invalid JSON String: invalid json"
            });
        });
        
        it("raises exception on invalid payload data", function() {
            provider.onData({}, true, { responseText: Ext.JSON.encode({ foo: 'bar' }) });
            
            var args = handler.argsForCall[0][1],
                xcpt = {
                    code: args.code,
                    message: args.message
                };
            
            expect(xcpt).toEqual({
                code: Ext.direct.Manager.exceptions.DATA,
                message: 'Invalid data: event type is not specified'
            });
        });
        
        it("lets returned exception pass through", function() {
            var ex = {
                    type: 'exception',
                    message: 'Fubar'
                },
                data = Ext.JSON.encode(ex);
            
            provider.onData({}, true, { responseText: data });
            
            var args = handler.argsForCall[0][1],
                xcpt = {
                    type: args.type,
                    message: args.message
                };
            
            expect(handler.argsForCall.length).toBe(1);
            // AND
            expect(xcpt).toEqual(ex);
        });
    });
    
    describe("pollFn responses", function() {
        var handler, pollFn;
        
        beforeEach(function() {
            provider.url = undefined;
            provider.pollFn = 'spec.DirectSpecs.pollFn';
            
            pollFn  = makeSpy('pollFn');
            handler = jasmine.createSpy('handler');
            provider.on('data', handler);
            
            provider.connect();
        });
        
        afterEach(function() {
            provider.disconnect();
        });
        
        it("doesn't fire data event when dataset is empty", function() {
            spyOn(provider, 'createEvents').andCallThrough();
            
            pollFn.andCallFake(function(params, cb, scope) {
                cb.call(scope, null, null, true);
            });
            
            provider.runPoll();
            
            expect(provider.createEvents).toHaveBeenCalled();
            // AND
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("should fire single event", function() {
            pollFn.andCallFake(function(params, cb, scope) {
                cb.call(scope, {
                    type: 'event',
                    name: 'blerg',
                    data: params
                }, {}, true);
            });
            
            provider.runPoll();
            
            var args = handler.mostRecentCall.args;
            
            var event = gutEvent(args[1]);
            
            expect(event).toEqual({
                type: 'event',
                name: 'blerg',
                data: { foo: 'bar' }
            });
        });
        
        it("should fire multiple events", function() {
            pollFn.andCallFake(function(params, cb, scope) {
                var result = [],
                    event;
                
                for (var i = 1; i < 4; i++) {
                    event = {
                        type: 'event',
                        name: 'blam' + i,
                        data: params
                    };
                    
                    result.push(event);
                }
                    
                cb.call(scope, result, {}, true);
            });
            
            provider.runPoll();
            
            var result = Ext.Array.map(handler.argsForCall, function(item) {
                return gutEvent(item[1]);
            });
            
            expect(result).toEqual([
                { type: 'event', name: 'blam1', data: { foo: 'bar' } },
                { type: 'event', name: 'blam2', data: { foo: 'bar' } },
                { type: 'event', name: 'blam3', data: { foo: 'bar' } }
            ]);
        });
    });
});
