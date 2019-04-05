<template>
    <v-container>
        <v-layout>
            <v-flex xl6 md9 sm12>
                <h2 class="headline mb-2">Log In</h2>
                <v-form @submit.prevent="login">
                    <v-text-field v-model.trim="email" label="E-Mail"></v-text-field>
                    <v-text-field v-model.trim="password" type="password" label="Password"></v-text-field>
                    <v-btn color="success" type="submit">Log in</v-btn>
                </v-form>
            </v-flex>
        </v-layout>
        <social-media-login></social-media-login>
    </v-container>
</template>
<script>
import { auth } from '@/firebaseConfig';
import SocialMediaLogin from '@/components/profile/SocialMediaLogin.vue';

export default {
    name: 'login',
    components: { SocialMediaLogin },
    data () {
        return {
            email: '',
            password: ''
        };
    },
    methods: {
        login () {
            auth.signInWithEmailAndPassword(this.email, this.password).then(userInfo => {
                this.$store.dispatch('user/setCurrentUser', userInfo.user);
                this.$store.dispatch('user/fetchUserProfile').then(() => {
                    this.$store.dispatch('user/updateUserProfile', {
                        lastLogin: new Date()
                    }).then(() => {
                        this.$router.push('/profile');
                    });
                });
            }).catch(err => {
                console.log(err);
            });
        }
    }
};
</script>
