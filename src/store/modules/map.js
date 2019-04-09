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
        if (Date.now() - queryTimestamp > 2000 || queryTimestamp === null) {
            let queryDistance;
            let distanceFromQueryCenter;
            let computedDistance;
            if (state.queryCenter && state.queryDistance && !payload.force) {
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
                    try {
                        const newObject = Object.assign(entryData, {
                            id: entryData.ref.id,
                            position: {
                                lat: entryData.coordinates.latitude,
                                lng: entryData.coordinates.longitude
                            },
                            value: entryData.value ? entryData.value : 0
                        });
                        newObject.forBox = entryData.forBox ? entryData.forBox : null;
                        mapObjects.push(newObject);
                    } catch (e) {
                        console.log(e.stack, entry.id);
                    }
                })).then(() => {
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
