/**
 * This relationship describes the case where any one entity of one type may relate to any
 * number of entities of another type, and also in the reverse.
 * 
 * This form of association cannot store id's in the related entities since that would
 * limit the number of related entities to one for the entity with the foreign key. Instead,
 * these relationships are typically implemented using a so-called "matrix" table. This
 * table typically has two columns to hold the id's of a pair of related entities. This
 * pair of id's is unique in the matrix table.
 * 
 * # Declaration Forms
 * 
 *      // Fully spelled out - all properties are their defaults:
 *      
 *      Ext.define('App.models.Group', {
 *          extend: 'Ext.data.Model',
 *          
 *          manyToMany: {
 *              UserGroups: {
 *                  type: 'User',
 *                  role: 'users',
 *                  field: 'userId',
 *                  right: {
 *                      field: 'groupId',
 *                      role: 'groups'
 *                  }
 *              }
 *          }
 *      });
 *
 *      // Eliminate "right" object and use boolean to indicate Group is on the
 *      // right. By default, left/right is determined by alphabetic order.
 *      
 *      Ext.define('App.models.Group', {
 *          extend: 'Ext.data.Model',
 *          
 *          manyToMany: {
 *              UserGroups: {
 *                  type: 'User',
 *                  role: 'users',
 *                  field: 'userId',
 *                  right: true
 *              }
 *          }
 *      });
 *
 *      // Eliminate object completely and rely on string to name the other type. Still
 *      // keep Group on the "right".
 *      
 *      Ext.define('App.models.Group', {
 *          extend: 'Ext.data.Model',
 *          
 *          manyToMany: {
 *              UserGroups: 'User#'   // '#' is on the side (left or right) of Group
 *          }
 *      });
 *
 *      // Remove explicit matrix name and keep Group on the "right". Generated matrixName
 *      // remains "UserGroups".
 *      
 *      Ext.define('App.models.Group', {
 *          extend: 'Ext.data.Model',
 *          
 *          manyToMany: [
 *              'User#'
 *          ]
 *      });
 *
 *      // Minimal definition but now Group is on the "left" since "Group" sorts before
 *      // "User". Generated matrixName is now "GroupUsers".
 *      
 *      Ext.define('App.models.Group', {
 *          extend: 'Ext.data.Model',
 *          
 *          manyToMany: [
 *              'User'
 *          ]
 *      });
 */
Ext.define('Ext.data.schema.ManyToMany', {
    extend: 'Ext.data.schema.Association',
    
    isManyToMany: true,

    isToMany: true,

    kind: 'many-to-many',

    Left: Ext.define(null, {
        extend: 'Ext.data.schema.Role',

        isMany: true,

        digitRe: /^\d+$/,

        findRecords: function(session, rightRecord, leftRecords) {
            var slice = session.getMatrixSlice(this.inverse, rightRecord.id),
                members = slice.members,
                ret = [], 
                cls = this.cls,
                seen, i, len, id, member, leftRecord;

            if (leftRecords) {
                seen = {};
                // Loop over the records returned by the server and
                // check they all still belong
                for (i = 0, len = leftRecords.length; i < len; ++i) {
                    leftRecord = leftRecords[i];
                    id = leftRecord.id;
                    member = members[id];
                    if (!(member && member[2] === -1)) {
                        ret.push(leftRecord);
                    }
                    seen[id] = true;
                }
            }

            // Loop over the expected set and include any missing records.
            for (id in members) {
                member = members[id];
                if (!seen || !seen[id] && (member && member[2] !== -1)) {
                    leftRecord = session.peekRecord(cls, id);
                    if (leftRecord) {
                        ret.push(leftRecord);
                    }
                }
            }
            return ret;
        },

        processLoad: function(store, rightRecord, leftRecords, session) {
            var ret = leftRecords;
            if (session) {
                ret = this.findRecords(session, rightRecord, leftRecords);
                this.onAddToMany(store, ret, true);
            }
            return ret;
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
            me.processMatrixBlock(session, associationData.C, 1);
            me.processMatrixBlock(session, associationData.D, -1);
        },

        checkMembership: function(session, rightRecord) {
            var matrix = session.getMatrix(this.association, true),
                side, entityType, inverse, slice, slices,
                id, members, member, leftRecord, store;

            if (!matrix) {
                return;
            }

            side = this.left ? matrix.right : matrix.left;
            entityType = side.inverse.role.cls;
            inverse = this.inverse;
            slices = side.slices;
                

            if (slices) {
                slice = slices[rightRecord.id];
                if (slice) {
                    members = slice.members;
                    for (id in members) {
                        member = members[id];
                        if (member[2] !== -1) {
                            // Do we have the record in the session? If so, do we also have the store?
                            leftRecord = session.peekRecord(entityType, id);
                            if (leftRecord) {
                                store = inverse.getAssociatedItem(leftRecord);
                                if (store) {
                                    store.matrixUpdate = 1;
                                    store.add(rightRecord);
                                    store.matrixUpdate = 0;
                                }
                            }
                        }
                    }
                }
            }
        },

        onStoreCreate: function(store, session, id) {
            var me = this,
                matrix;

            if (session) {
                // If we are creating a store of say Groups in a UserGroups matrix, we want
                // to traverse the inverse side of the matrix (Users) because the id we have
                // is that of the User to which these Groups are associated.
                matrix = session.getMatrixSlice(me.inverse, id);

                matrix.attach(store);
                matrix.notify = me.onMatrixUpdate;
                matrix.scope = me;


            }
        },

        processMatrixBlock: function(session, leftKeys, state) {
            var inverse = this.inverse,
                digitRe = this.digitRe,
                slice, id;

            if (leftKeys) {
                for (id in leftKeys) {
                    // We may not have the record available to pull out the id, so the best we can
                    // do here is try to detect a number id.
                    if (digitRe.test(id)) {
                        id = parseInt(id, 10);
                    }
                    slice = session.getMatrixSlice(inverse, id);
                    slice.update(leftKeys[id], state);
                }
            }
        },

        createGetter: function() {
            var me = this;

            return function (options, scope, leftRecords) {
                // 'this' refers to the Model instance inside this function
                var session = this.session,
                    hadRecords;

                if (session) {
                    hadRecords = !!leftRecords;
                    leftRecords = me.findRecords(session, this, leftRecords);
                    if (!hadRecords && !leftRecords.length) {
                        leftRecords = null;
                    }
                }
                return me.getAssociatedStore(this, options, scope, leftRecords, hadRecords);
            };
        },

        /*
         * This method is called when records are added to the association store. If this
         * is happening as a side-effect of the underlying matrix update, we skip telling
         * the matrix what it already knows. Otherwise we need to tell the matrix of the
         * changes on this side so that they can be reflected on the other side.
         */
        onAddToMany: function (store, leftRecords, load) {
            if (!store.matrixUpdate) {
                store.matrixUpdate = 1;
                // By default the "load" param is really the index, but we call this manually in a few
                // spots to indicate it's a default load
                store.matrix.update(leftRecords, load === true ? 0 : 1);
                store.matrixUpdate = 0;
            }
        },

        /*
         * This method is called when records are removed from the association store. The
         * same logic applies here as in onAddToMany with respect to the update that may
         * or may not be taking place on the underlying matrix.
         */
        onRemoveFromMany: function (store, records) {
            if (!store.matrixUpdate) {
                store.matrixUpdate = 1;
                store.matrix.update(records, -1);
                store.matrixUpdate = 0;
            }
        },

        read: function(rightRecord, node, fromReader, readOptions) {
            var me = this,
                leftRecords = me.callParent([rightRecord, node, fromReader, readOptions]);
            
            if (leftRecords) {
                // Create the store and dump the data
                rightRecord[me.getterName](null, null, leftRecords);
                // Inline associations should *not* arrive on the "data" object:
                delete rightRecord.data[me.role];
            }
            
        },

        onMatrixUpdate: function (matrixSlice, id, state) {
            var store = matrixSlice.store,
                index, leftRecord, entry;

            if (store && !store.loading && !store.matrixUpdate) {
                store.matrixUpdate = 1;

                index = store.indexOfId(id);
                if (state < 0) {
                    if (index >= 0) {
                        store.remove([ index ]);
                    }
                } else if (index < 0) {
                    entry = store.getSession().getEntry(this.type, id);
                    leftRecord = entry && entry.record;

                    if (leftRecord) {
                        store.add(leftRecord);
                    }
                }

                store.matrixUpdate = 0;
            }
        },

        adoptAssociated: function(record, session) {
            var store = this.getAssociatedItem(record),
                records, i, len;

            if (store) {
                store.setSession(session);
                this.onStoreCreate(store, session, record.getId());
                records = store.getData().items;
                for (i = 0, len = records.length; i < len; ++i) {
                    session.adopt(records[i]);
                }
            }
        }
    },
    function () {
        var Left = this; // Left is created but ManyToMany may not yet be created

        Ext.ClassManager.onCreated(function () {
            Ext.data.schema.ManyToMany.prototype.Right = Ext.define(null, {
                extend: Left,
                left: false,
                side: 'right'
            });
        }, null, 'Ext.data.schema.ManyToMany');
    })
});
