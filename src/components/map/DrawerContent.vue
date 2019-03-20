<template>
    <div>
        <v-toolbar>
            <v-toolbar-title class="headline">{{ title }}</v-toolbar-title>
            <v-spacer />
            <v-toolbar-side-icon>
                <v-icon @click="closeDrawer">clear</v-icon>
            </v-toolbar-side-icon>
        </v-toolbar>
        <component v-if="activeDrawerComponent" :is="activeDrawerComponent"></component>
    </div>
</template>

<script>
import { EventBus, Events } from '../../events';
import MapBoxDrawer from './BoxDrawer';
export default {
    name: 'map-drawer-content',
    components: { MapBoxDrawer },
    computed: {
        activeDrawerComponent() {
            return this.$store.getters['drawer/component'];
        },
        title() {
            return this.$store.getters['drawer/title'];
        }
    },
    methods: {
        closeDrawer() {
            EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
        }
    }
};
</script>
