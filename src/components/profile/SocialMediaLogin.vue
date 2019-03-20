<template>
    <div>
        <h3 class="mt-3">Or use your social media credentials</h3>
        <v-layout row>
            <v-flex xs6>
                <v-btn @click="signUpWith('google')"><i class="mr-2 fab fa-google"></i>{{ activityString }} with Google</v-btn>
            </v-flex>
            <v-flex xs6>
                <v-btn @click="signUpWith('facebook')"><i class="mr-2 fab fa-facebook"></i>{{ activityString }} with Facebook</v-btn>
            </v-flex>
            <v-flex xs6>
                <v-btn @click="signUpWith('twitter')"><i class="mr-2 fab fa-twitter"></i>{{ activityString }} with Twitter</v-btn>
            </v-flex>
            <v-flex xs6>
                <v-btn @click="signUpWith('github')"><i class="mr-2 fab fa-github"></i>{{ activityString }} with Github</v-btn>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
import firebase from 'firebase';
const providers = {
    'google': new firebase.auth.GoogleAuthProvider(),
    'facebook': new firebase.auth.FacebookAuthProvider(),
    'twitter': new firebase.auth.TwitterAuthProvider(),
    'github': new firebase.auth.GithubAuthProvider()
};
export default {
    name: 'profile-social-media-login',
    props: {
        signUp: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        activityString() {
            return this.signUp ? 'Sign up' : 'Log in';
        }
    },
    methods: {
        signUpWith(provider) {
            firebase.auth().signInWithPopup(providers[provider]).then((userInfo) => {
                console.log(this);
                this.$store.dispatch('user/setCurrentUser', userInfo.user);
                this.$store.dispatch('user/fetchUserProfile').then(() => {
                    const profile = {
                        username: userInfo.user.displayName,
                        email: userInfo.user.email,
                        createdAt: new Date(),
                        lastLogin: new Date(),
                        imageUrl: userInfo.user.photoURL
                    };
                    this.$store.dispatch('user/updateUserProfile', profile).then(() => {
                        this.$router.push('/profile');
                    });
                });
            });
        }
    }
};
</script>
