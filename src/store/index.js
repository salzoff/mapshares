import Vue from 'vue';
import Vuex from 'vuex';
import userModule from './modules/user';
import drawerModule from './modules/drawer';
import boxModule from './modules/box';
import mapModule from './modules/map';
import { startLocationUpdater, stopLocationUpdater } from './locationUpdater';
import { auth } from '@/firebaseConfig';
Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        user: userModule,
        drawer: drawerModule,
        box: boxModule,
        map: mapModule
    },
    actions: {
        clearUserData: (context) => {
            context.dispatch('user/clearUserData');
            context.dispatch('box/clearData');
        }
    }
});

auth.onAuthStateChanged(user => {
    stopLocationUpdater();
    if (user) {
        store.dispatch('user/setCurrentUser', user);
        store.dispatch('user/fetchUserProfile').then(() => {
            store.dispatch('box/fetchBoxes');
            startLocationUpdater(store);
        });
    }
});

export default store;
