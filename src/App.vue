<template>
    <v-app>
        <v-toolbar app>
            <v-toolbar-title class="headline text-uppercase">
                <span>MapShares</span>
                <span class="font-weight-light v-toolbar__subtitle ml-1">Geocaching</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn flat>
                    <router-link to="/">Home</router-link>
                </v-btn>
                <template v-if="isAuthenticated">
                    <v-btn flat>
                        <router-link to="/map">Map</router-link>
                    </v-btn>
                    <v-btn flat>
                        <router-link to="/profile">Profile</router-link>
                    </v-btn>
                    <v-btn flat>
                        <router-link to="/logout">Logout</router-link>
                    </v-btn>
                </template>
                <template v-else>
                    <v-btn flat>
                        <router-link to="/login">Login</router-link>
                    </v-btn>
                    <v-btn flat>
                        <router-link to="/signup">Sign up</router-link>
                    </v-btn>
                </template>
            </v-toolbar-items>
        </v-toolbar>
        <v-navigation-drawer hide-overlay disable-resize-watcher stateless app right v-model="showDrawer" width="550">
            <router-view name="rightSideDrawer"></router-view>
        </v-navigation-drawer>
        <v-content>
            <template v-if="isAuthenticated && isFetchingInitialUserProfile">
                Fetching user profile...
            </template>
            <template v-else>
                <router-view></router-view>
            </template>
        </v-content>
    </v-app>
</template>

<script>
import { EventBus, Events } from './events';
export default {
    name: 'App',
    data () {
        return {
            showDrawer: false
        };
    },
    mounted() {
        EventBus.$on(Events.SHOW_CONTENT_IN_DRAWER, () => {
            if (!this.showDrawer) {
                this.showDrawer = true;
            }
        });
        EventBus.$on(Events.HIDE_CONTENT_IN_DRAWER, () => {
            this.showDrawer = false;
        });
    }
};
</script>

<style scoped lang="scss">
    .v-toolbar__subtitle {
        text-transform: uppercase;
    }
</style>
