describe("Ext.direct.Provider", function() {
    var provider, connectSpy, disconnectSpy;
    
    function makeProvider(config) {
        provider = new Ext.direct.Provider(config);
        
        return provider;
    }
    
    beforeEach(function() {
        makeProvider();
        
        spyOn(provider, 'doConnect');
        spyOn(provider, 'doDisconnect');
        
        connectSpy = jasmine.createSpy('connect');
        disconnectSpy = jasmine.createSpy('disconnect');
        
        provider.on('connect', connectSpy);
        provider.on('disconnect', disconnectSpy);
    });
    
    afterEach(function() {
        if (provider) {
            provider.destroy();
        }
        
        Ext.direct.Manager.clearAllMethods();
        
        provider = connectSpy = disconnectSpy = null;
    });
    
    describe("ids", function() {
        it("should auto-assign id when not configured with one", function() {
            expect(/^provider-/.test(provider.id)).toBe(true);
        });
        
        it("should not assign auto id when configured", function() {
            provider.destroy();
            
            makeProvider({ id: 'foo' });
            
            expect(provider.id).toBe('foo');
        });
    });
    
    describe("destroy", function() {
        var destroySpy;
        
        beforeEach(function() {
            spyOn(provider, 'disconnect').andCallThrough();
            
            provider.destroy();
        });
        
        it("should disconnect when called first time", function() {
            expect(provider.disconnect).toHaveBeenCalled();
        });
        
        it("should force disconnect", function() {
            var args = provider.disconnect.mostRecentCall.args;
            
            expect(args[0]).toBe(true);
        });
        
        it("should set isDestroyed flag", function() {
            expect(provider.isDestroyed).toBe(true);
        });
        
        it("should not disconnect when called more than once", function() {
            provider.destroy();
            
            expect(provider.disconnect.callCount).toBe(1);
        });
    });
    
    describe("isConnected", function() {
        it("should return false when subscribers === 0", function() {
            expect(provider.isConnected()).toBe(false);
        });
        
        it("should return true when subscribers > 0", function() {
            provider.subscribers = 1;
            
            expect(provider.isConnected()).toBe(true);
        });
    });
    
    describe("connect", function() {
        describe("first time", function() {
            beforeEach(function() {
                provider.connect();
            });
            
            it("should call doConnect", function() {
                expect(provider.doConnect).toHaveBeenCalled();
            });
            
            it("should fire connect event", function() {
                expect(connectSpy).toHaveBeenCalled();
            });
            
            it("should increment subscribers", function() {
                expect(provider.subscribers).toBe(1);
            });
        });
        
        describe("after first time", function() {
            beforeEach(function() {
                provider.subscribers = 1;
                provider.connect();
            });
            
            it("should not call doConnect", function() {
                expect(provider.doConnect).not.toHaveBeenCalled();
            });
            
            it("should not fire connect event", function() {
                expect(connectSpy).not.toHaveBeenCalled();
            });
            
            it("should increment subscribers", function() {
                expect(provider.subscribers).toBe(2);
            });
        });
    });
    
    describe("disconnect", function() {
        describe("when subscribers == 2", function() {
            beforeEach(function() {
                provider.subscribers = 2;
            });
            
            describe("not forced", function() {
                beforeEach(function() {
                    provider.disconnect();
                });
                
                it("should not call doDisconnect", function() {
                    expect(provider.doDisconnect).not.toHaveBeenCalled();
                });
            
                it("should not fire disconnect event", function() {
                    expect(disconnectSpy).not.toHaveBeenCalled();
                });
            
                it("should decrement subscribers", function() {
                    expect(provider.subscribers).toBe(1);
                });
            });
            
            describe("forced", function() {
                beforeEach(function() {
                    provider.disconnect(true);
                });
                
                it("should call doDisconnect", function() {
                    expect(provider.doDisconnect).toHaveBeenCalled();
                });
                
                it("should fire disconnect event", function() {
                    expect(disconnectSpy).toHaveBeenCalled();
                });
                
                it("should reset subscribers to 0", function() {
                    expect(provider.subscribers).toBe(0);
                });
            });
        });
        
        describe("when subscribers == 1", function() {
            beforeEach(function() {
                provider.subscribers = 1;
                provider.disconnect();
            });
            
            it("should call doDisconnect", function() {
                expect(provider.doDisconnect).toHaveBeenCalled();
            });
            
            it("should fire disconnect event", function() {
                expect(disconnectSpy).toHaveBeenCalled();
            });
            
            it("should decrement subscribers", function() {
                expect(provider.subscribers).toBe(0);
            });
        });
        
        describe("when subscribers == 0", function() {
            beforeEach(function() {
                provider.disconnect();
            });
            
            it("should not call doDisconnect", function() {
                expect(provider.doDisconnect).not.toHaveBeenCalled();
            });
            
            it("should not fire disconnect event", function() {
                expect(disconnectSpy).not.toHaveBeenCalled();
            });
            
            it("should not decrement subscribers", function() {
                expect(provider.subscribers).toBe(0);
            });
        });
    });
});
