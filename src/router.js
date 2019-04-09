import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Map from './views/Map';
import MapDrawerContent from '@/components/map/DrawerContent.vue';
import Profile from './views/Profile';
import EditProfile from './views/EditProfile';
import Login from './views/Login';
import Logout from './views/Logout';
import Signup from './views/Signup';
import BoxView from './views/Box';
import firebase from 'firebase';
import { EventBus, Events } from './events';

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '*',
            redirect: '/'
        },
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/signup',
            name: 'signup',
            component: Signup
        },
        {
            path: '/map',
            name: 'map',
            components: {
                default: Map,
                rightSideDrawer: MapDrawerContent
            },
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/logout',
            name: 'logout',
            component: Logout,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/profile',
            name: 'profile',
            component: Profile,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/editprofile/:uid?',
            name: 'editprofile',
            component: EditProfile,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/boxdetails/:id',
            name: 'boxdetails',
            component: BoxView,
            props: true,
            meta: {
                requiresAuth: true
            }
        }
    ]
});

router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(x => x.meta.requiresAuth);
    const currentUser = firebase.auth().currentUser;

    if (requiresAuth && !currentUser) {
        next('/login');
    } else if (requiresAuth && currentUser) {
        next();
    } else {
        next();
    }
});

export default router;
