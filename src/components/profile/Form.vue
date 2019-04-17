<template>
    <div>
        <v-form @submit.prevent="saveProfile">
            <v-text-field v-model="profile.username" label="Username" />
            <v-text-field v-model="profile.email" label="E-Mail" type="email" />
            <v-text-field v-model="profile.password" label="Password" type="password" v-if="!isAuthenticated" />
            <v-text-field v-model="profile.firstName" label="First name" />
            <v-text-field v-model="profile.name" label="Name" />
            <v-text-field v-model="profile.homepage" label="Homepage" />
            <v-btn color="success" type="submit">{{ btnCaption }}</v-btn>
        </v-form>
    </div>
</template>

<script>
import { auth } from '@/firebaseConfig';
export default {
    name: 'profile-form',
    data() {
        return {
            profile: {
                active: true,
                username: '',
                email: '',
                password: '',
                firstName: '',
                name: '',
                homepage: '',
                imageUrl: ''
            }
        };
    },
    computed: {
        btnCaption() {
            return this.isAuthenticated ? 'Update' : 'Sign up';
        }
    },
    methods: {
        saveProfile() {
            this.profile.lastLogin = new Date();
            if (!this.isAuthenticated) {
                auth.createUserWithEmailAndPassword(this.profile.email, this.profile.password)
                    .then((userInfo) => {
                        this.$store.dispatch('user/setCurrentUser', userInfo.user);
                        this.$store.dispatch('user/createUserProfile', {
                            id: userInfo.user.uid,
                            profile: this.profile
                        }).then(() => {
                            this.$store.dispatch('user/fetchUserProfile').then(() => {
                                this.$router.push('/profile');
                            });
                        });
                    })
                    .catch(e => {
                        console.error(e);
                    });
            } else {
                this.updateProfile();
            }
        },
        updateProfile() {
            this.$store.dispatch('user/updateUserProfile', this.profile);
            this.$router.push('/profile');
        }
    },
    created() {
        if (this.isAuthenticated) {
            Object.assign(this.profile, this.$store.getters['user/userProfile']);
        }
    }
};
</script>

<style scoped lang="scss">

</style>
