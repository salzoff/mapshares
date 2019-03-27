<template>
    <v-container>
        <v-layout>
            <v-flex xl6 md9 sm12>
                <h2>Sign up</h2>
                <profile-form></profile-form>
            </v-flex>
        </v-layout>
        <social-media-login :signUp="true"></social-media-login>
    </v-container>
</template>

<script>
import ProfileForm from '@/components/profile/Form';
import SocialMediaLogin from '@/components/profile/SocialMediaLogin';
export default {
    name: 'signup',
    components: { ProfileForm, SocialMediaLogin }
};
</script>
