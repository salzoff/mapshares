import Vue from 'vue';
import './plugins/vuetify';
import Vuelidate from 'vuelidate';
import App from './App.vue';
import router from './router';
import store from './store';
import * as fb from './firebaseConfig';
import '@fortawesome/fontawesome-free/js/all';
import './config';
import authMixin from '@/mixins/auth';
import formatterMixin from '@/mixins/formatter';
import * as VueGoogleMaps from 'vue2-google-maps';
import 'vue-image-lightbox/dist/vue-image-lightbox.min.css';
import VueLazyLoad from 'vue-lazyload';

Vue.use(Vuelidate);
Vue.use(VueLazyLoad);

Vue.use(VueGoogleMaps, {
    load: {
        key: 'AIzaSyAQgnykziSrXxoEcqAiQirbK-amboOxbQ4',
        autobindAllEvents: true,
        libraries: 'geometry'
    }
});

Vue.mixin(authMixin);
Vue.mixin(formatterMixin);

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
