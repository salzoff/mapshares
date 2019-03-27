<template>
    <v-layout class="pa-3">
        <profile-overview :profile="data.viewedUser" />
    </v-layout>
</template>

<script>
import ProfileOverview from '@/components/profile/Overview';
export default {
    name: 'map-user-drawer',
    components: { ProfileOverview },
    computed: {
        data() {
            return this.$store.getters['drawer/data'];
        },
        viewedUser() {
            return this.data.viewedUser;
        }
    }
};
</script>
