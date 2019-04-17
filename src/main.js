import Vue from 'vue';
import './plugins/vuetify';
import Vuelidate from 'vuelidate';
import 'vue-image-lightbox/dist/vue-image-lightbox.min.css';
import VueLazyLoad from 'vue-lazyload';
import * as VueGoogleMaps from 'vue2-google-maps';
import * as fb from './firebaseConfig';
import '@fortawesome/fontawesome-free/js/all';

import router from './router';
import store from './store';
import './config';

import authMixin from '@/mixins/auth';
import formatterMixin from '@/mixins/formatter';
import storageMixin from '@/mixins/storage';

import '@/directives/asyncImage';

import App from './App.vue';

Vue.use(Vuelidate);
Vue.use(VueLazyLoad);

Vue.use(VueGoogleMaps, {
    load: {
        key: 'AIzaSyAQgnykziSrXxoEcqAiQirbK-amboOxbQ4',
        autobindAllEvents: true,
        libraries: 'geometry, places'
    }
});

Vue.mixin(authMixin);
Vue.mixin(formatterMixin);
Vue.mixin(storageMixin);

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
