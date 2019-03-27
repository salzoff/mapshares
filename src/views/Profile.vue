<template>
    <v-container>
        <template v-if="currentUserProfile">
            <h2 class="mb-2">Profile of {{ currentUserProfile.username }}</h2>
            <profile-overview :profile="currentUserProfile" :editMode="true"></profile-overview>
        </template>
        <template v-else>
            <div>Loading profile...</div>
        </template>
    </v-container>
</template>

<script>
import ProfileOverview from '@/components/profile/Overview';
export default {
    name: 'profile',
    components: { ProfileOverview }
};
</script>
