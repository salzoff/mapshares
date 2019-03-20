import { boxCollection, userProfileCollection } from '@/firebaseConfig';
import firebase from 'firebase';

const mergeSnapshotDataWithId = snapshot => {
    return Object.assign(snapshot.data(), {
        id: snapshot.id
    });
};

const state = {
    boxesInMap: [],
    boxesCreatedByUser: [],
    boxesFoundByUser: []
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
    CLEAR_DATA (state) {
        state.data = {
            boxesInMap: [],
            boxesCreatedByUser: [],
            boxesFoundByUser: []
        };
    }
};

let unsubscribeBoxesInMap;
let unsubscribeBoxesCreatedByUser;
let unsubscribeBoxesFoundByUser;

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
            return boxRef;
        });
    },
    updateBox: ({ state }, payload) => {
        return boxCollection.doc(payload.id).update(payload);
    },
    deleteBox: ({ rootState }, payload) => {
        const boxRef = boxCollection.doc(payload.id);
        userProfileCollection.doc(payload.createdBy.id).update({
            createdBoxes: firebase.firestore.FieldValue.arrayRemove(boxRef)
        });
        return boxRef.delete();
    },
    clearData: ({ commit }) => {
        unsubscribeBoxesInMap();
        unsubscribeBoxesCreatedByUser();
        unsubscribeBoxesFoundByUser();
        commit('CLEAR_DATA');
    }
};

const getters = {
    boxesInMap: state => state.boxesInMap,
    boxesCreatedByUser: state => state.boxesCreatedByUser,
    boxesFoundByUser: state => state.boxesFoundByUser
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
