import { GeoFirestore } from 'geofirestore';
import firebase from 'firebase';

const firestoreRef = firebase.firestore();
const geoFirestore = new GeoFirestore(firestoreRef);
const geoRef = geoFirestore.collection('geoLocation');
let query = null;
let queryTimestamp = null;

const state = {
    mapApi: null,
    google: null,
    queryCenter: null,
    queryDistance: null,
    mapObjects: [],
    mapQuery: null
};

const mutations = {
    SET_MAP_API (state, payload) {
        this.state.map.mapApi = payload;
    },
    SET_GOOGLE (state, payload) {
        this.state.map.google = payload;
    },
    SET_QUERY_CENTER (state, payload) {
        state.queryCenter = payload;
    },
    SET_QUERY_DISTANCE (state, payload) {
        state.queryDistance = payload;
    },
    SET_MAP_OBJECTS (state, payload) {
        state.mapObjects = payload;
    }
};

let unbindGeoQueryListener;

const actions = {
    updateGeoQuery: ({ commit, state }, payload) => {
        if (Date.now() - queryTimestamp > 2000) {
            let queryDistance;
            let distanceFromQueryCenter;
            let computedDistance;
            if (state.queryCenter && state.queryDistance) {
                distanceFromQueryCenter = state.google.maps.geometry.spherical.computeDistanceBetween(payload.center, state.queryCenter);
                if (distanceFromQueryCenter < state.queryDistance / 2) {
                    return;
                }
            }
            queryDistance = state.google.maps.geometry.spherical.computeDistanceBetween(payload.bounds.getNorthEast(), payload.bounds.getSouthWest()) / 2;
            computedDistance = queryDistance * (payload.zoom * 0.5);
            if (unbindGeoQueryListener) {
                unbindGeoQueryListener();
            }
            queryTimestamp = Date.now();
            query = geoRef.near({
                center: new firebase.firestore.GeoPoint(payload.center.lat(), payload.center.lng()),
                radius: computedDistance
            });
            unbindGeoQueryListener = query.onSnapshot(result => {
                const mapObjects = [];
                return Promise.all(result.docs.map(entry => {
                    const entryData = entry.data();
                    return entryData.ref.get().then(objectEntry => {
                        try {
                            const newObject = Object.assign(objectEntry.data(), {
                                objectType: entryData.objectType,
                                id: objectEntry.id,
                                ref: entryData.ref
                            });
                            switch (entryData.objectType) {
                                case 1:
                                    newObject.lastLocation = {
                                        lat: newObject.lastLocation.latitude,
                                        lng: newObject.lastLocation.longitude
                                    };
                                    newObject.lastLocationAt = newObject.lastLocationAt.toDate();
                                    newObject.createdAt = newObject.createdAt.toDate();
                                    newObject.lastLogin = newObject.lastLogin.toDate();
                                    break;
                                case 2:
                                    newObject.position = {
                                        lat: newObject.position.latitude,
                                        lng: newObject.position.longitude
                                    };
                                    break;
                                case 3:
                                    newObject.position = {
                                        lat: newObject.position.latitude,
                                        lng: newObject.position.longitude
                                    };
                                    newObject.forBox = entryData.forBox;
                                    break;
                                case 4:
                                    newObject.position = {
                                        lat: newObject.position.latitude,
                                        lng: newObject.position.longitude
                                    };
                                    break;
                            }
                            mapObjects.push(newObject);
                        } catch (e) {
                            console.log(e.stack, entry.id);
                        }
                    });
                })).then(objectEntries => {
                    commit('SET_MAP_OBJECTS', mapObjects);
                });
            });
            commit('SET_QUERY_CENTER', payload.center);
            commit('SET_QUERY_DISTANCE', computedDistance);
        }
    }
};

const getters = {
    getMapApi: state => state.mapApi,
    getGoogle: state => state.google,
    mapObjects: state => state.mapObjects
};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
