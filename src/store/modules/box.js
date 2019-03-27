import _merge from 'lodash/merge';
import { boxCollection, userProfileCollection, storage } from '@/firebaseConfig';
import firebase from 'firebase';
import { GeoFirestore } from 'geofirestore';
import { updateBoxInGeoLocation, deleteBoxInGeoLocation, updateBoxHintsInGeoLocation, deleteBoxHintInGeoLocation } from '../../helper/geofirestore';
const db = firebase.firestore();
const geoFirestore = new GeoFirestore(db);
const geoRef = geoFirestore.collection('geoLocation');

const mergeSnapshotDataWithId = snapshot => {
    return Object.assign(snapshot.data(), {
        id: snapshot.id
    });
};

const state = {
    boxesInMap: [],
    boxesCreatedByUser: [],
    boxesFoundByUser: [],
    hintsForBox: []
};

const mutations = {
    SET_BOXES_IN_MAP (state, payload) {
        state.boxesInMap = payload;
    },
    SET_BOXES_CREATED_BY_USER (state, payload) {
        state.boxesCreatedByUser = payload;
    },
    SET_BOXES_FOUND_BY_USER (state, payload) {
        state.boxesFoundByUser = payload;
    },
    SET_HINTS_FOR_BOX (state, payload) {
        state.hintsForBox = payload;
    },
    CLEAR_DATA (state) {
        state.data = {
            boxesInMap: [],
            boxesCreatedByUser: [],
            boxesFoundByUser: [],
            hintsForBox: []
        };
    }
};

let unsubscribeBoxesInMap;
let unsubscribeBoxesCreatedByUser;
let unsubscribeBoxesFoundByUser;
let unsubscribeHintsForBox;

const actions = {
    fetchBoxes: ({ state, rootState, dispatch }) => {
        dispatch('fetchBoxesInMap');
        dispatch('fetchBoxesCreatedByUser');
        dispatch('fetchBoxesFoundByUser');
    },
    fetchBoxesInMap: ({ state, commit }, payload) => {
        unsubscribeBoxesInMap = boxCollection.onSnapshot(result => {
            commit('SET_BOXES_IN_MAP', result.docs.map(mergeSnapshotDataWithId));
        });
    },
    fetchBoxesCreatedByUser: ({ state, rootState, commit }) => {
        unsubscribeBoxesCreatedByUser = boxCollection.where('createdBy', '==', userProfileCollection.doc(rootState.user.currentUser.uid)).onSnapshot(result => {
            commit('SET_BOXES_CREATED_BY_USER', result.docs.map(mergeSnapshotDataWithId));
        });
    },
    fetchBoxesFoundByUser: ({ state, rootState, commit }) => {
        unsubscribeBoxesFoundByUser = boxCollection.where('FoundBy', '==', rootState.user.currentUser.uid).onSnapshot(result => {
            commit('SET_BOXES_CREATED_BY_USER', result.docs.map(mergeSnapshotDataWithId));
        });
    },
    fetchHintsForBox: ({ commit }, payload) => {
        return new Promise(resolve => {
            unsubscribeHintsForBox = boxCollection.doc(payload).collection('hints').orderBy('visibleFrom').onSnapshot(result => {
                let boxHints = result.docs.map(mergeSnapshotDataWithId);
                boxHints = boxHints.map(boxHint => {
                    switch (boxHint.type) {
                        case 1:
                            boxHint.value = {
                                distanceRange: boxHint.distanceRange,
                                position: {
                                    lat: boxHint.position.latitude,
                                    lng: boxHint.position.longitude
                                }
                            };
                            delete boxHint.distanceRange;
                            delete boxHint.position;
                            break;
                        case 2:
                            boxHint.value = {
                                text: boxHint.text
                            };
                            delete boxHint.text;
                            break;
                        default:
                            break;
                    }
                    boxHint.visibleFrom = boxHint.visibleFrom.toDate();
                    return boxHint;
                });
                commit('SET_HINTS_FOR_BOX', boxHints);
                resolve();
            });
        });
    },
    addBox: ({ rootState }, payload) => {
        const newBox = Object.assign({}, payload, {
            createdBy: userProfileCollection.doc(rootState.user.currentUser.uid),
            createdAt: new Date(),
            position: new firebase.firestore.GeoPoint(payload.position.lat, payload.position.lng)
        });
        return boxCollection.add(newBox).then(boxRef => {
            userProfileCollection.doc(rootState.user.currentUser.uid).update({
                createdBoxes: firebase.firestore.FieldValue.arrayUnion(boxRef)
            });
            console.log(boxRef);
            updateBoxInGeoLocation(boxRef);
            return boxRef;
        });
    },
    updateBox: ({ state }, payload) => {
        delete payload.boxHints;
        delete payload.editBoxMarker;
        delete payload.marker;
        payload.position = new firebase.firestore.GeoPoint(payload.position.lat, payload.position.lng);
        return boxCollection.doc(payload.id).update(payload).then(boxRef => {
            updateBoxInGeoLocation(boxCollection.doc(payload.id));
        });
    },
    deleteBox: ({ rootState }, payload) => {
        const boxRef = boxCollection.doc(payload.id);
        userProfileCollection.doc(payload.createdBy.id).update({
            createdBoxes: firebase.firestore.FieldValue.arrayRemove(boxRef)
        });
        return boxRef.delete().then(() => {
            deleteBoxInGeoLocation(payload.id);
        });
    },
    saveBoxHints: ({ state }, payload) => {
        const hintCollection = boxCollection.doc(payload.id).collection('hints');
        const batch = db.batch();
        payload.boxHints.forEach(boxHint => {
            const newBoxHint = _merge({}, boxHint, boxHint.value);
            delete newBoxHint.value;
            switch (newBoxHint.type) {
                case 1:
                    newBoxHint.position = new firebase.firestore.GeoPoint(newBoxHint.position.lat, newBoxHint.position.lng);
                    break;
                case 3:
                    newBoxHint.fileName = newBoxHint.image.name;
                    if (!newBoxHint.id) {
                        newBoxHint.id = hintCollection.doc().id;
                    }
                    const imageRef = storage.ref().child(`boxHintImages/${newBoxHint.id}`);
                    const tmpHint = Object.assign({}, { image: newBoxHint.image });
                    imageRef.put(tmpHint.image);
                    delete newBoxHint.image;
                    break;
                default:
                    break;
            }
            batch.set(hintCollection.doc(), newBoxHint);
        });
        return batch.commit().then(() => {
            updateBoxHintsInGeoLocation(payload.id);
        });
    },
    deleteBoxHint({ state }, payload) {
        return boxCollection.doc(payload.id).collection('hints').doc(payload.boxHint.id).delete().then(() => {
            deleteBoxHintInGeoLocation(payload.boxHint.id);
        });
    },
    clearData: ({ commit }) => {
        unsubscribeBoxesInMap();
        unsubscribeBoxesCreatedByUser();
        unsubscribeBoxesFoundByUser();
        unsubscribeHintsForBox();
        commit('CLEAR_DATA');
    }
};

const updateCache = () => {
    const now = Date.now();
    db.collection('box').get().then(entries => {
        entries.forEach(entry => {
            geoRef.doc(entry.id).get().then(res => {
                if (!res.exists) {
                    const data = entry.data();
                    geoRef.doc(entry.id).set({
                        coordinates: data.position,
                        objectType: 2,
                        ref: entry.ref
                    });
                }
            });
            entry.ref.collection('hints')
                .where('type', '==', 1)
                .orderBy('visibleFrom')
                .get().then(hints => {
                    let currentHint = null;
                    let nextHint = null;
                    hints.forEach(hint => {
                        if (hint.data().visibleFrom.toDate().getTime() <= now) {
                            currentHint = hint;
                        } else if (nextHint === null) {
                            nextHint = hint;
                        }
                    });
                    if (currentHint) {
                        const data = currentHint.data();
                        geoRef.doc(currentHint.id).get().then(res => {
                            if (!res.exists) {
                                const newEntry = {
                                    coordinates: data.position,
                                    distanceRange: data.distanceRange,
                                    objectType: 3,
                                    ref: currentHint.ref
                                };
                                if (nextHint) {
                                    newEntry.visibleUntil = nextHint.data().visibleFrom;
                                }
                                geoRef.doc(currentHint.id).set(newEntry);
                            }
                        });
                    }
                });
        });
    });
};

const getters = {
    boxesInMap: state => state.boxesInMap,
    boxesCreatedByUser: state => state.boxesCreatedByUser,
    boxesFoundByUser: state => state.boxesFoundByUser,
    hintsForBox: state => state.hintsForBox
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
