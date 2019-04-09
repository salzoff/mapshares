<template>
    <div style="position: relative">
        <v-carousel>
            <v-carousel-item
                v-for="(imageUrl, index) in imageUrls"
                :key="index"
                :src="imageUrl"
            ></v-carousel-item>
        </v-carousel>
        <v-dialog v-model="showEditModal" width="800">
            <template v-slot:activator="{ on }">
                <v-btn
                    v-if="hasPermission(permissionsEnum.EDIT_BOX)"
                    color="primary"
                    small
                    dark
                    absolute
                    bottom
                    right
                    fab
                    v-on="on"
                    class="edit-images"
                ><v-icon>edit</v-icon></v-btn>
            </template>
            <v-card>
                <v-card-title
                    class="headline grey lighten-2"
                    primary-title
                >
                    Edit box images (tbc)
                </v-card-title>
                <v-card-text>
                    <gallery-editor :images="imageUrls" @save="saveImages" @cancel="cancel" />
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { permissions } from '@/helper/enums';
import GalleryEditor from '../common/GalleryEditor';

export default {
    name: 'box-images',
    components: { GalleryEditor },
    props: {
        box: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            imageUrls: [],
            showEditModal: false
        };
    },
    computed: {
        permissionsEnum() {
            return permissions;
        }
    },
    methods: {
        loadImages() {
            const imageUrls = [];
            Promise.all(this.box.images.map(image => {
                return this.createFileUrl(image).then(imageUrl => {
                    imageUrls.push(imageUrl);
                });
            })).then(() => {
                this.imageUrls = imageUrls;
            });
        },
        saveImages(images) {
            this.imageUrls = images;
            this.showEditModal = false;
            this.$store.dispatch('box/updateBox', Object.assign(this.box, { images }));
            console.log('test');
        },
        cancel() {
            this.showEditModal = false;
        }
    },
    watch: {
        box: function(box) {
            this.loadImages();
        }
    },
    mounted() {
        this.loadImages();
    },
    beforeRouteLeave() {
        this.imageUrls = [];
    }
};
</script>

<style scoped lang="scss">
    .edit-images {
        bottom: 5px !important;
    }
</style>
