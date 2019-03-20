import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import * as fb from './firebaseConfig';
import '@fortawesome/fontawesome-free/js/all';
import './config';
import authMixin from '@/mixins/authMixin';
import * as VueGoogleMaps from 'vue2-google-maps';

Vue.use(VueGoogleMaps, {
    load: {
        key: 'AIzaSyAQgnykziSrXxoEcqAiQirbK-amboOxbQ4',
        autobindAllEvents: true
    }
});

Vue.mixin(authMixin);

Vue.config.productionTip = true;

// handle page reloads
let app;
fb.auth.onAuthStateChanged(user => {
    if (!app) {
        app = new Vue({
            router,
            store,
            render: h => h(App)
        }).$mount('#app');
    }
});
