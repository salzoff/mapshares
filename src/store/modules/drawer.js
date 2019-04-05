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
        state.data = payload;
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
    setData ({ commit, state }, payload) {
        const newData = Object.assign({}, state.data, payload);
        Object.keys(payload).forEach(key => {
            if (payload[key] === null || typeof payload[key] === 'undefined') {
                delete newData[key];
            }
        });
        commit('SET_DATA', newData);
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
