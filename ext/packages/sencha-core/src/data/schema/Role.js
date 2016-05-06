/**
 * @private
 */
Ext.define('Ext.data.schema.Role', {
    /**
     * @property {Ext.data.schema.Association} association
     * @readonly
     */

    isRole: true,

    /**
     * @property {Boolean} left
     * @readonly
     */
    left: true,

    /**
     * @property {Boolean} owner
     * @readonly
     */
    owner: false,

    /**
     * @property {String} side
     * @readonly
     */
    side: 'left',

    /**
     * @property {Boolean} isMany
     * @readonly
     */
    isMany: false,

    /**
     * @property {Ext.Class} cls
     * The `Ext.data.Model` derived class.
     * @readonly
     */

    /**
     * @property {Ext.data.schema.Role} inverse
     * @readonly
     */

    /**
     * @property {String} type
     * The `{@link Ext.data.Model#entityName}` derived class.
     * @readonly
     */

    /**
     * @property {String} role
     * @readonly
     */

    defaultReaderType: 'json',

    _internalReadOptions: {
        recordsOnly: true,
        asRoot: true
    },

    constructor: function (association, config) {
        var me = this,
            extra = config.extra;

        Ext.apply(me, config);
        if (extra) {
            delete extra.type;
            Ext.apply(me, extra);
            delete me.extra;
        }

        me.association = association;

        // The Association's owner property starts as either "left" or "right" (a string)
        // and we promote it to a reference to the appropriate Role instance here.
        if (association.owner === me.side) {
            association.owner = me;
            me.owner = true;
        }
    },

    processUpdate: function() {
        Ext.Error.raise('Only the "many" for an association may be processed. "' + this.role + '" is not valid.');
    },

    /**
     * Exclude any locally modified records that don't belong in the store. Include locally
     * modified records that should be in the store. Also correct any foreign keys that
     * need to be updated.
     *
     * @param {Ext.data.Store} store The store.
     * @param {Ext.data.Model} associatedEntity The entity that owns the records.
     * @param {Ext.data.Model[]} records The records to check.
     * @param {Ext.data.Session} session The session holding the records
     * @return {Ext.data.Model[]} The corrected set of records.
     *
     * @private
     */
    processLoad: function(store, associatedEntity, records, session) {
        return records;
    },

    /**
     * Check whether a record belongs to any stores when it is added to the session.
     * 
     * @param {Ext.data.Session} session The session
     * @param {Ext.data.Model} record The model being added to the session
     * @private
     */
    checkMembership: Ext.emptyFn,

    /**
     * Adopt the associated items when a record is adopted.
     * @param {Ext.data.Model} record The record being adopted.
     * @param {Ext.data.Session} session The session being adopted into
     * 
     * @private
     */
    adoptAssociated: function(record, session) {
        var other = this.getAssociatedItem(record);
        if (other) {
            session.adopt(other);
        }
    },

    createAssociationStore: function (session, from, records, isComplete) {
        var me = this,
            association = me.association,
            foreignKeyName = association.getFieldName(),
            isMany = association.isManyToMany,
            storeConfig = me.storeConfig,
            id = from.getId(),
            config = {
                model: me.cls,
                role: me,
                session: session,
                associatedEntity: from,
                disableMetaChangeEvent: true,
                pageSize: null,
                remoteFilter: true,
                trackRemoved: !session
            }, store;

        if (isMany) {
            // For many-to-many associations each role has a field
            config.filters = [{
                property  : me.inverse.field, // @TODO filterProperty
                value     : id,
                exactMatch: true
            }];
        } else if (foreignKeyName) {
            config.filters = [{
                property  : foreignKeyName, // @TODO filterProperty
                value     : id,
                exactMatch: true
            }];
            config.foreignKeyName = foreignKeyName;
        }

        if (storeConfig) {
            Ext.apply(config, storeConfig);
        }

        store = Ext.Factory.store(config);
        
        me.onStoreCreate(store, session, id);

        if (foreignKeyName || (isMany && session)) {
            store.on({
                scope: me,
                add: 'onAddToMany',
                remove: 'onRemoveFromMany',
                clear: 'onRemoveFromMany'
            });
        }

        if (records) {
            store.loadData(records);
            store.complete = !!isComplete;
        }

        return store;
    },

    onStoreCreate: Ext.emptyFn,

    getAssociatedStore: function (inverseRecord, options, scope, records, isComplete) {
        // Consider the Comment entity with a ticketId to a Ticket entity. The Comment
        // is on the left (the FK holder's side) so we are implementing the guts of
        // the comments() method to load the Store of Comment entities. This trek
        // begins from a Ticket (inverseRecord).

        var me = this,
            storeName = me.getStoreName(),
            store = inverseRecord[storeName],
            load = options && options.reload,
            source = inverseRecord.$source,
            session = inverseRecord.session,
            args, i, len, raw, rec, sourceStore;

        if (!store) {
            // We want to check whether we can automatically get the store contents from the parent session.
            // For this to occur, we need to have a parent in the session, and the store needs to be created
            // and loaded with the initial dataset.
            if (!records && source) {
                source = source[storeName];
                if (source && !source.isLoading()) {
                    sourceStore = source;
                    records = [];
                    raw = source.getData().items;

                    for (i = 0, len = raw.length; i < len; ++i) {
                        rec = raw[i];
                        records.push(session.getRecord(rec.self, rec.id));
                    }
                    isComplete = true;
                }
            }
            store = me.createAssociationStore(session, inverseRecord, records, isComplete);
            store.$source = sourceStore;

            if (!records && (me.autoLoad || options)) {
                load = true;
            }

            inverseRecord[storeName] = store;
        }

        if (options) {
            // We need to trigger a load or the store is already loading. Defer
            // callbacks until that happens
            if (load || store.isLoading()) {
                store.on('load', function(store, records, success, operation) {
                    args = [store, operation];
                    scope = scope || options.scope || inverseRecord;

                    if (success) {
                        Ext.callback(options.success, scope, args);
                    } else {
                        Ext.callback(options.failure, scope, args);
                    }
                    args.push(success);
                    Ext.callback(options, scope, args);
                    Ext.callback(options.callback, scope, args);
                }, null, {single: true});
            } else {
                // Trigger straight away
                args = [store, null];
                scope = scope || options.scope || inverseRecord;

                Ext.callback(options.success, scope, args);
                args.push(true);
                Ext.callback(options, scope, args);
                Ext.callback(options.callback, scope, args);
            }
        }

        if (load && !store.isLoading()) {
            store.load();
        }

        return store;
    },
    
    /**
     * Gets the store/record associated with this role from an existing record.
     * Will only return if the value is loaded.
     * 
     * @param {Ext.data.Model} rec The record
     * 
     * @return {Ext.data.Model/Ext.data.Store} The associated item. `null` if not loaded.
     * @private
     */
    getAssociatedItem: function(rec) {
        var key = this.isMany ? this.getStoreName() : this.getInstanceName();
        return rec[key] || null;
    },

    onDrop: Ext.emptyFn,

    getReaderRoot: function() {
        var me = this;

        return me.associationKey ||
              (me.associationKey = me.association.schema.getNamer().readerRoot(me.role));
    },
    
    getReader: function() {
        var me = this,
            reader = me.reader,
            Model = me.cls,
            useSimpleAccessors = !me.associationKey,
            root = this.getReaderRoot();
            
        if (reader && !reader.isReader) {
            if (Ext.isString(reader)) {
                reader = {
                    type: reader
                };
            }
            Ext.applyIf(reader, {
                model: Model,
                rootProperty: root,
                useSimpleAccessors: useSimpleAccessors,
                type: me.defaultReaderType
            });
            reader = me.reader = Ext.createByAlias('reader.' + reader.type, reader);
        }   
        return reader; 
    },

    getInstanceName: function () {
        var me = this;
        return me.instanceName ||
               (me.instanceName = me.association.schema.getNamer().instanceName(me.role));
    },

    getOldInstanceName: function() {
        return this.oldInstanceName ||
            (this.oldInstanceName = '$old' + this.getInstanceName());
    },

    getStoreName: function () {
        var me = this;
        return me.storeName ||
               (me.storeName = me.association.schema.getNamer().storeName(me.role));
    },
    
    constructReader: function(fromReader) {
        var me = this,
            reader = me.getReader(),
            Model = me.cls,
            useSimpleAccessors = !me.associationKey,
            root = me.getReaderRoot(),
            proxyReader,
            proxy;
        
        // No reader supplied
        if (!reader) {
            proxy = Model.getProxy();
            // if the associated model has a Reader already, use that, otherwise attempt to create a sensible one
            if (proxy) {
                proxyReader = proxy.getReader();
                reader = new proxyReader.self();
                reader.copyFrom(proxyReader);
                reader.setRootProperty(root);
            } else {
                reader = new fromReader.self({
                    model: Model,
                    useSimpleAccessors: useSimpleAccessors,
                    rootProperty: root
                });
            }
            me.reader = reader;
        }
        return reader;
    },
    
    read: function (record, data, fromReader, readOptions) {
        var reader = this.constructReader(fromReader),
            root = reader.getRoot(data);

        if (root) {            
            return reader.readRecords(root, readOptions, this._internalReadOptions);
        }
    },

    getCallbackOptions: function(options, scope, defaultScope) {
        if (typeof options === 'function') {
            options = {
                callback: options,
                scope: scope || defaultScope
            };
        } else if (options) {
            options = Ext.apply({}, options);
            options.scope = scope || options.scope || defaultScope;
        }
        return options;
    },

    doGetFK: function (leftRecord, options, scope) {
        // Consider the Department entity with a managerId to a User entity. This method
        // is the guts of the getManager method that we place on the Department entity to
        // acquire a User entity. We are the "manager" role and that role describes a
        // User. This method is called, however, given a Department (leftRecord) as the
        // start of this trek.

        var me           = this,    // the "manager" role
            cls          = me.cls,  // User
            foreignKey   = me.association.getFieldName(),  // "managerId"
            instanceName = me.getInstanceName(),  // "manager"
            rightRecord  = leftRecord[instanceName], // = department.manager
            reload       = options && options.reload,
            done         = rightRecord !== undefined && !reload,
            session      = leftRecord.session,
            foreignKeyId, args;

        if (!done) {
            // We don't have the User record yet, so try to get it.

            if (session) {
                foreignKeyId = leftRecord.get(foreignKey);
                if (foreignKeyId || foreignKeyId === 0) {
                    done = session.peekRecord(cls, foreignKeyId, true) && !reload;
                    rightRecord = session.getRecord(cls, foreignKeyId, false);
                } else {
                    done = true;
                    leftRecord[instanceName] = rightRecord = null;
                }
            } else if (foreignKey) {
                // The good news is that we do indeed have a FK so we can do a load using
                // the value of the FK.

                foreignKeyId = leftRecord.get(foreignKey);
                if (!foreignKeyId && foreignKeyId !== 0) {
                    // A value of null ends that hope though... but we still need to do
                    // some callbacks perhaps.
                    done = true;
                    leftRecord[instanceName] = rightRecord = null;
                } else {
                    // foreignKeyId is the managerId from the Department (record), so
                    // make a new User, set its idProperty and load the real record via
                    // User.load method.
                    if (!rightRecord) {
                        // We may be reloading, let's check if we have one.
                        rightRecord = cls.createWithId(foreignKeyId);
                    }
                    // we are not done in this case, so don't set "done"
                }
            } else {
                // Without a FK value by which to request the User record, we cannot do
                // anything. Declare victory and get out.
                done = true;
            }
        } else if (rightRecord) {
            // If we're still loading, call load again which will handle the extra callbacks.
            done = !rightRecord.isLoading();
        }

        if (done) {
            if (options) {
                args = [rightRecord, null];
                scope = scope || options.scope || leftRecord;

                Ext.callback(options.success, scope, args);
                args.push(true);
                Ext.callback(options, scope, args);
                Ext.callback(options.callback, scope, args);
            }
        } else {
            leftRecord[instanceName] = rightRecord;
            options = me.getCallbackOptions(options, scope, leftRecord);
            rightRecord.load(options);
        }

        return rightRecord;
    },

    doSetFK: function (leftRecord, rightRecord, options, scope) {
        // Consider the Department entity with a managerId to a User entity. This method
        // is the guts of the setManager method that we place on the Department entity to
        // store the User entity. We are the "manager" role and that role describes a
        // User. This method is called, however, given a Department (record) and the User
        // (value).

        var me = this,
            foreignKey = me.association.getFieldName(),  // "managerId"
            instanceName = me.getInstanceName(),  // "manager"
            current = leftRecord[instanceName],
            inverse = me.inverse,
            inverseSetter = inverse.setterName,  // setManagerDepartment for User
            session = leftRecord.session,
            modified, oldInstanceName;

        if (rightRecord && rightRecord.isEntity) {
            if (current !== rightRecord) {
                oldInstanceName = me.getOldInstanceName();
                leftRecord[oldInstanceName] = current;
                leftRecord[instanceName] = rightRecord;
                if (current && current.isEntity) {
                    current[inverse.getInstanceName()] = undefined;
                }
                if (foreignKey) {
                    leftRecord.set(foreignKey, rightRecord.getId());
                }
                delete leftRecord[oldInstanceName];

                if (inverseSetter) {
                    // Because the rightRecord has a reference back to the leftRecord
                    // we pass on to its setter (if there is one). We've already set
                    // the value on this side so we won't recurse back-and-forth.
                    rightRecord[inverseSetter](leftRecord);
                }
            }
        } else {
            // The value we received could just be the id of the rightRecord so we just
            // need to set the FK accordingly and cleanup any cached references.

            //<debug>
            if (!foreignKey) {
                Ext.Error.raise('No foreignKey specified for "' + me.association.left.role +
                    '" by ' + leftRecord.$className);
            }
            //</debug>

            modified = (leftRecord.changingKey && !inverse.isMany) || leftRecord.set(foreignKey, rightRecord);
            // set returns the modifiedFieldNames[] or null if nothing was change

            if (modified && current && current.isEntity && !current.isEqual(current.getId(), rightRecord)) {
                // If we just modified the FK value and it no longer matches the id of the
                // record we had cached (ret), remove references from *both* sides:
                leftRecord[instanceName] = undefined;
                if (!inverse.isMany) {
                    current[inverse.getInstanceName()] = undefined;
                }
            }
        }

        if (options) {
            if (Ext.isFunction(options)) {
                options = {
                    callback: options,
                    scope: scope || leftRecord
                };
            }
            return leftRecord.save(options);
        }
    }
});
