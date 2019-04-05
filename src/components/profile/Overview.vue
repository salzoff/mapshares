<template>
    <div class="full-width">
        <v-layout row>
            <v-flex xs12>
                <img class="user-image" v-if="imageUrl" :src="imageUrl" />
                <template v-else>
                    <strong>No image available</strong>
                </template>
            </v-flex>
        </v-layout>
        <v-layout row class="mt-2" v-if="editMode">
            <v-flex xs12>
                <file-input ref="imageInput" v-model="image" label="Select new image..." accept="image/*" />
                <v-btn :disabled="image === null" @click="saveImage" class="ml-0">Save image</v-btn>
            </v-flex>
        </v-layout>
        <div v-if="profile.role" class="subheading mt-2">{{ capitalize(profile.role) }}</div>
        <h3 class="mt-3">Profile data</h3>
        <v-layout row class="mt-2">
            <v-flex md3 xs12 class="body-2">Email</v-flex>
            <v-flex md3 xs12>{{ profile.email }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Username</v-flex>
            <v-flex md3 xs12>{{ profile.username }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">First name</v-flex>
            <v-flex md3 xs12>{{ profile.firstName }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Name</v-flex>
            <v-flex md3 xs12>{{ profile.name }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Homepage</v-flex>
            <v-flex md3 xs12>{{ profile.homepage }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Last login</v-flex>
            <v-flex md3 xs12>{{ formatDateTime(profile.lastLogin) }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Last location at</v-flex>
            <v-flex md3 xs12>{{ formatDateTime(profile.lastLocationAt) }}</v-flex>
        </v-layout>
        <v-layout row class="mt-1">
            <v-flex md3 xs12 class="body-2">Created at</v-flex>
            <v-flex md3 xs12>{{ formatDate(profile.createdAt) }}</v-flex>
        </v-layout>
        <v-layout row v-if="editMode">
            <v-flex xs12>
                <v-btn class="mt-2 ml-0" @click="editProfile">Edit data</v-btn>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
import FileInput from '@/components/common/FileInput.vue';
import { storage } from '@/firebaseConfig';
export default {
    name: 'profile-overview',
    components: { FileInput },
    props: {
        profile: {
            type: Object,
            required: true
        },
        editMode: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            image: null,
            imageUrl: ''
        };
    },
    methods: {
        saveImage() {
            const imageRef = storage.ref().child(`profileImages/${this.currentUserProfile.username}`);
            imageRef.put(this.image).then(() => {
                this.$store.dispatch('user/updateUserProfile', {
                    imageUrl: imageRef.fullPath
                });
                this.profile.imageUrl = imageRef.fullPath;
                this.updateImageUrl();
                this.$refs.imageInput.reset();
                this.image = null;
            });
        },
        updateImageUrl() {
            if (!this.profile.imageUrl || this.profile.imageUrl.startsWith(('http'))) {
                this.imageUrl = this.profile.imageUrl;
                return;
            }
            const imageRef = storage.ref().child(this.profile.imageUrl);
            imageRef.getDownloadURL().then(url => {
                this.imageUrl = url;
            });
        },
        editProfile() {
            this.$router.push({ name: 'editprofile' });
        }
    },
    watch: {
        profile() {
            this.updateImageUrl();
        }
    },
    mounted() {
        this.updateImageUrl();
    }
};
</script>

<style scoped lang="scss">
    .user-image {
        max-width: 200px;
        max-height: 200px;
    }
    .full-width {
        width: 100%;
    }
</style>
