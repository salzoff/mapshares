import firebase from 'firebase';
import { userProfileCollection } from '@/firebaseConfig';
import { updateUserLocationInGeoLocation } from '../../helper/geofirestore';

const state = {
    currentUser: null,
    userProfile: null,
    fetchingUserProfile: false
};

const mutations = {
    SET_CURRENT_USER (state, payload) {
        state.currentUser = payload;
        // persistanceData.set(state);
    },
    SET_USER_PROFILE (state, payload) {
        state.userProfile = payload;
        // persistanceData.set(state);
    },
    SET_FETCHING_INITIAL_USER_PROFILE (state, payload) {
        state.fetchingUserProfile = payload;
    },
    CLEAR (state) {
        state.userProfile = null;
        state.currentUser = null;
        // persistanceData.set(state);
    }
};

let unsubscribeUserProfileCollection;

const actions = {
    setCurrentUser: ({ commit, dispatch }, payload) => {
        commit('SET_CURRENT_USER', payload);
        unsubscribeUserProfileCollection = userProfileCollection.doc(payload.uid).onSnapshot((result) => {
            dispatch('fetchUserProfile');
        });
    },
    updateUserProfile: ({ commit, state }, payload) => {
        delete payload.password;
        const userProfile = Object.assign({}, state.userProfile, payload);
        commit('SET_USER_PROFILE', userProfile);
        if (state.userProfile.lastLocation) {
            updateUserLocationInGeoLocation(Object.assign(state.userProfile, { id: state.currentUser.uid }));
        }
        return userProfileCollection.doc(state.currentUser.uid).set(userProfile);
    },
    updateUserPosition: ({ dispatch }, payload) => {
        dispatch('updateUserProfile', {
            lastLocation: new firebase.firestore.GeoPoint(payload.lat, payload.lng),
            lastLocationAt: new Date()
        });
    },
    fetchUserProfile: ({ commit, state }) => {
        if (!state.userProfile) {
            commit('SET_FETCHING_INITIAL_USER_PROFILE', true);
        }
        return userProfileCollection.doc(state.currentUser.uid).get().then(response => {
            const data = response.data();
            commit('SET_USER_PROFILE', Object.assign(response.data(), {
                ref: response.ref,
                lastLocationAt: data.lastLocationAt ? data.lastLocationAt.toDate() : new Date(),
                createdAt: data.createdAt.toDate(),
                lastLogin: data.lastLogin.toDate()
            }));
            commit('SET_FETCHING_INITIAL_USER_PROFILE', false);
        });
    },
    clearUserData: ({ commit }) => {
        unsubscribeUserProfileCollection();
        commit('CLEAR');
    }
};

const getters = {
    currentUser: state => {
        return state.currentUser;
    },
    userProfile: state => state.userProfile,
    isFetchingInitialUserProfile: state => state.fetchingUserProfile
};

export default {
    state,
    mutations,
    actions,
    getters,
    namespaced: true
};