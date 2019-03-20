const state = {
    title: '',
    component: '',
    data: {}
};

const mutations = {
    SET_TITLE (state, payload) {
        state.title = payload;
    },
    SET_DATA (state, payload) {
        const data = Object.assign({}, state.data, payload);
        state.data = data;
    },
    CLEAR_DATA (state) {
        state.data = {};
    },
    SET_COMPONENT (state, payload) {
        state.component = payload;
    }
};

const actions = {
    setTitle ({ commit }, payload) {
        commit('SET_TITLE', payload);
    },
    setData ({ commit }, payload) {
        commit('SET_DATA', payload);
    },
    clearData ({ commit }) {
        commit('CLEAR_DATA');
    },
    setComponent ({ commit }, payload) {
        commit('SET_COMPONENT', payload);
    }
};

const getters = {
    title: state => state.title,
    data: state => state.data,
    component: state => state.component
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
