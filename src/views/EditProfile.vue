<template>
    <v-container>
        <h2>Edit profile</h2>
        <profile-form></profile-form>
    </v-container>
</template>

<script>
import ProfileForm from '@/components/profile/Form';
export default {
    name: 'edit-profile',
    components: { ProfileForm },
    props: {
        uid: {
            type: String
        }
    }

};
</script>
