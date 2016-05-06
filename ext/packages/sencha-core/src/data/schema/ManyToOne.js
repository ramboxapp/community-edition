/**
 * This type of association describes the case where one entity is referenced by zero or
 * more other entities typically using a "foreign key" field.
 * 
 * The way this is defined is for one entity to have a field that holds the unique id (also
 * known as "Primary Key" or, more specifically, as the {@link Ext.data.Model#idProperty}
 * field) of the related entity. These fields have a {@link Ext.data.field.Field#reference}
 * in their definition. The value in the `reference` field of an entity instance holds the
 * value of the id of the related entity instance. Since many entities can hold the same
 * value in a `reference` field, this allows many entities to reference one entity.
 * OrderItem has a foreign key to Order.
 * 
 *      OrderItem -> Order
 * 
 * OrderItem is on the "left" and Order is on the "right". This is because the owner of
 * the foreign key is always on the "left". Many OrderItems refer to one Order. The
 * default name of this association would be "Order_OrderItems".
 * 
 *      var Order_OrderItems = {
 *          name: 'Order_OrderItems',
 *          owner: Order_OrderItems.right,
 *          left: {
 *              cls: OrderItem,
 *              type: 'OrderItem',
 *              association: Order_OrderItems,
 *              left: true,
 *              owner: false,
 *              autoLoad: true,
 *              isMany: true,
 *              inverse: Order_OrderItems.right,
 *              role: 'orderItems'
 *          },
 *          right: {
 *              cls: Order,
 *              type: 'Order',
 *              association: Order_OrderItems,
 *              left: false,
 *              owner: true,
 *              autoLoad: true,
 *              isMany: false,
 *              inverse: Order_OrderItems.left,
 *              role: 'order'
 *          }
 *      };
 *      
 *      OrderItem.associations.order = Order_OrderItems.left;
 *      Order.associations.orderItems = Order_OrderItems.right;
 */
Ext.define('Ext.data.schema.ManyToOne', {
    extend: 'Ext.data.schema.Association',

    isManyToOne: true,

    isToOne: true,

    kind: 'many-to-one',

    Left: Ext.define(null, {
        extend: 'Ext.data.schema.Role',

        isMany: true,

        onDrop: function(rightRecord, session) {
            var me = this,
                store = me.getAssociatedItem(rightRecord),
                leftRecords, len, i, refs, id;

            if (store) {
                // Removing will cause the foreign key to be set to null.
                leftRecords = store.removeAll();
                if (leftRecords && me.inverse.owner) {
                    // If we're a child, we need to destroy all the "tickets"
                    for (i = 0, len = leftRecords.length; i < len; ++i) {
                        leftRecords[i].drop();
                    }
                }

                store.destroy();
                rightRecord[me.getStoreName()] = null;
            } else if (session) {
                leftRecords = session.getRefs(rightRecord, me);
                if (leftRecords) {
                    for (id in leftRecords) {
                        leftRecords[id].drop();
                    }
                }
            }
        },

        processUpdate: function(session, associationData) {
            var me = this,
                entityType = me.inverse.cls,
                items = associationData.R,
                id, rightRecord, store, leftRecords;

            if (items) {
                for (id in items) {
                    rightRecord = session.peekRecord(entityType, id);
                    if (rightRecord) {
                        leftRecords = session.getEntityList(me.cls, items[id]);
                        store = me.getAssociatedItem(rightRecord);
                        if (store) {
                            store.loadData(leftRecords);
                            store.complete = true;
                        } else {
                            // We don't have a store. Create it and add the records.
                            rightRecord[me.getterName](null, null, leftRecords);
                        }
                    } else {
                        session.onInvalidAssociationEntity(entityType, id);
                    }
                }
            }
        },

        findRecords: function(session, rightRecord, leftRecords, allowInfer) {
            var ret = leftRecords,
                refs = session.getRefs(rightRecord, this, true),
                field = this.association.field,
                fieldName = field.name,
                leftRecord, id, i, len, seen;

            if (!rightRecord.phantom) {
                ret = [];
                if (refs || allowInfer) {
                    if (leftRecords) {
                        seen = {};
                        // Loop over the records returned by the server and
                        // check they all still belong. If the session doesn't have any prior knowledge
                        // and we're allowed to infer the parent id (via nested loading), only do so if
                        // we explicitly have an id specified
                        for (i = 0, len = leftRecords.length; i < len; ++i) {
                            leftRecord = leftRecords[i];
                            id = leftRecord.id;
                            if (refs && refs[id]) {
                                ret.push(leftRecord);
                            } else if (allowInfer && leftRecord.data[fieldName] === undefined) {
                                ret.push(leftRecord);
                                leftRecord.data[fieldName] = rightRecord.id;
                                session.updateReference(leftRecord, field, rightRecord.id, undefined);
                            }
                            seen[id] = true;
                        }
                    }

                    // Loop over the expected set and include any missing records.
                    if (refs) {
                        for (id in refs) {
                            if (!seen || !seen[id]) {
                                ret.push(refs[id]);
                            }
                        }
                    }
                }
            }
            return ret;
        },

        processLoad: function(store, rightRecord, leftRecords, session) {
            var ret = leftRecords;

            if (session) {
                ret = this.findRecords(session, rightRecord, leftRecords);
            }
            this.onLoadMany(rightRecord, ret, session);
            return ret;
        },

        adoptAssociated: function(rightRecord, session) {
            var store = this.getAssociatedItem(rightRecord),
                leftRecords, i, len;
            if (store) {
                store.setSession(session);
                leftRecords = store.getData().items;
                for (i = 0, len = leftRecords.length; i < len; ++i) {
                    session.adopt(leftRecords[i]);
                }
            }
        },

        createGetter: function() {
            var me = this;
            return function (options, scope, leftRecords) {
                // 'this' refers to the Model instance inside this function
                var session = this.session,
                    hadRecords = !!leftRecords;

                if (session) {
                    // allowInfer is true here because the only time we get records passed
                    // here is via nested loading
                    leftRecords = me.findRecords(session, this, leftRecords, true);
                    if (!hadRecords && (!leftRecords || !leftRecords.length)) {
                        leftRecords = null;
                    }
                }
                return me.getAssociatedStore(this, options, scope, leftRecords, hadRecords);
            };
        },

        createSetter: null, // no setter for an isMany side

        onAddToMany: function (store, leftRecords) {
            this.syncFK(leftRecords, store.getAssociatedEntity(), false);
        },

        onLoadMany: function(rightRecord, leftRecords, session) {
            var instanceName = this.inverse.getInstanceName(),
                id = rightRecord.getId(),
                field = this.association.field,
                i, len, leftRecord, oldId, data, name;

            if (field) {
                for (i = 0, len = leftRecords.length; i < len; ++i) {
                    leftRecord = leftRecords[i];
                    leftRecord[instanceName] = rightRecord;
                    if (field) {
                        name = field.name;
                        data = leftRecord.data;
                        oldId = data[name];
                        if (oldId !== id) {
                            data[name] = id;
                            if (session) {
                                session.updateReference(leftRecord, field, id, oldId);
                            }
                        }
                    }
                }
            }
        },

        onRemoveFromMany: function (store, leftRecords) {
            this.syncFK(leftRecords, store.getAssociatedEntity(), true);
        },

        read: function(rightRecord, node, fromReader, readOptions) {
            var me = this,
                // We use the inverse role here since we're setting ourselves
                // on the other record
                instanceName = me.inverse.getInstanceName(),
                leftRecords = me.callParent([rightRecord, node, fromReader, readOptions]),
                store, len, i;
            
            if (leftRecords) {
                // Create the store and dump the data
                store = rightRecord[me.getterName](null, null, leftRecords);
                // Inline associations should *not* arrive on the "data" object:
                delete rightRecord.data[me.role];

                leftRecords = store.getData().items;

                for (i = 0, len = leftRecords.length; i < len; ++i) {
                    leftRecords[i][instanceName] = rightRecord;
                }
            }
        },

        syncFK: function (leftRecords, rightRecord, clearing) {
            // We are called to set things like the FK (ticketId) of an array of Comment
            // entities. The best way to do that is call the setter on the Comment to set
            // the Ticket. Since we are setting the Ticket, the name of that setter is on
            // our inverse role.

            var foreignKeyName = this.association.getFieldName(),
                inverse = this.inverse,
                setter = inverse.setterName, // setTicket
                instanceName = inverse.getInstanceName(),
                i = leftRecords.length,
                id = rightRecord.getId(),
                different, leftRecord, val;

            while (i-- > 0) {
                leftRecord = leftRecords[i];
                different = !leftRecord.isEqual(id, leftRecord.get(foreignKeyName));

                val = clearing ? null : rightRecord;
                if (different !== clearing) {
                    // clearing === true
                    //      different === true  :: leave alone (not associated anymore)
                    //   ** different === false :: null the value (no longer associated)
                    //
                    // clearing === false
                    //   ** different === true  :: set the value (now associated)
                    //      different === false :: leave alone (already associated)
                    //
                    leftRecord.changingKey = true;
                    leftRecord[setter](val);
                    leftRecord.changingKey = false;
                } else {
                    // Ensure we set the instance, we may only have the key
                    leftRecord[instanceName] = val;
                }
            }
        }
    }),

    Right: Ext.define(null, {
        extend: 'Ext.data.schema.Role',

        left: false,
        side: 'right',

        onDrop: function(leftRecord, session) {
            // By virtue of being dropped, this record will be removed
            // from any stores it belonged to. The only case we have
            // to worry about is if we have a session but were not yet
            // part of any stores, so we need to clear the foreign key.
            var field = this.association.field;
            if (field) {
                leftRecord.set(field.name, null);
            }
            leftRecord[this.getInstanceName()] = null;
        },

        createGetter: function() {
            // As the target of the FK (say "ticket" for the Comment entity) this
            // getter is responsible for getting the entity referenced by the FK value.
            var me = this;

            return function (options, scope) {
                // 'this' refers to the Comment instance inside this function
                return me.doGetFK(this, options, scope);
            };
        },
        
        createSetter: function() {
            var me = this;

            return function (rightRecord, options, scope) {
                // 'this' refers to the Comment instance inside this function
                return me.doSetFK(this, rightRecord, options, scope);
            };
        },

        checkMembership: function(session, leftRecord) {
            var field = this.association.field,
                store;

            store = this.getSessionStore(session, leftRecord.get(field.name));
            // Check we're not in the middle of an add to the store.
            if (store && !store.contains(leftRecord)) {
                store.add(leftRecord);
            }
        },

        onValueChange: function(leftRecord, session, newValue, oldValue) {
            // If we have a session, we may be able to find the new store this belongs to
            // If not, the best we can do is to remove the record from the associated store/s.
            var me = this,
                instanceName = me.getInstanceName(),
                cls = me.cls,
                hasNewValue,
                joined, store, i, len, associated, rightRecord;

            if (!leftRecord.changingKey) {
                hasNewValue = newValue || newValue === 0;
                if (!hasNewValue) {
                    leftRecord[instanceName] = null;
                }
                if (session) {
                    // Find the store that holds this record and remove it if possible.
                    store = me.getSessionStore(session, oldValue);
                    if (store) {
                        store.remove(leftRecord);
                    }
                    // If we have a new value, try and find it and push it into the new store.
                    if (hasNewValue) {
                        store = me.getSessionStore(session, newValue);
                        if (store && !store.isLoading()) {
                            store.add(leftRecord);
                        }
                        if (cls) {
                            rightRecord = session.peekRecord(cls, newValue);
                        }
                        // Setting to undefined is important so that we can load the record later.
                        leftRecord[instanceName] = rightRecord || undefined;
                    }
                } else {
                    joined = leftRecord.joined;
                    if (joined) {
                        for (i = 0, len = joined.length; i < len; ++i) {
                            store = joined[i];
                            if (store.isStore) {
                                associated = store.getAssociatedEntity();
                                if (associated && associated.self === me.cls && associated.getId() === oldValue) {
                                    store.remove(leftRecord);
                                }
                            }
                        }
                    }
                }
            }

            if (me.owner && newValue === null) {
                me.association.schema.queueKeyCheck(leftRecord, me);
            }
        },

        checkKeyForDrop: function(leftRecord) {
            var field = this.association.field;
            if (leftRecord.get(field.name) === null) {
                leftRecord.drop();
            }
        },

        getSessionStore: function(session, value) {
            // May not have the cls loaded yet
            var cls = this.cls,
                rec;

            if (cls) {
                rec = session.peekRecord(cls, value);

                if (rec) {
                    return this.inverse.getAssociatedItem(rec);
                }
            }
        },
        
        read: function(leftRecord, node, fromReader, readOptions) {
            var rightRecords = this.callParent([leftRecord, node, fromReader, readOptions]),
                rightRecord;

            if (rightRecords) {
                rightRecord = rightRecords[0];
                if (rightRecord) {
                    leftRecord[this.getInstanceName()] = rightRecord;
                    delete leftRecord.data[this.role];
                }
            }
        }
    })
});
