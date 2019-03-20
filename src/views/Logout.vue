<template>
    <v-container>Log out...</v-container>
</template>
<script>
import { auth } from '@/firebaseConfig';
export default {
    name: 'logout',
    created() {
        auth.signOut().then(() => {
            this.$store.dispatch('clearUserData');
        });
    }
};
</script>
