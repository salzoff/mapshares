<template>
    <div style="position: relative">
        <v-carousel v-if="imageUrls.length > 0">
            <v-carousel-item
                v-for="(imageUrl, index) in imageUrls"
                :key="index"
                :src="imageUrl.imageUrl"
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
                    Edit box images
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
import { storage } from '@/firebaseConfig';
import _differenceWith from 'lodash/differenceWith';

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
            if (!this.box.images) {
                this.imageUrls = imageUrls;
                return;
            }
            Promise.all(this.box.images.map(image => {
                return this.createFileUrl(image).then(imageUrl => {
                    imageUrls.push({
                        image,
                        imageUrl
                    });
                });
            })).then(() => {
                this.imageUrls = imageUrls;
            });
        },
        saveImages(images) {
            this.imageUrls = images;
            this.showEditModal = false;
            for (let i = 0; i < images.length; i++) {
                if (images[i].image instanceof File) {
                    const imageRef = storage.ref().child(`boxImages/${this.box.id}/${images[i].image.name}`);
                    imageRef.put(images[i].image);
                    images[i] = {
                        image: `boxImages/${this.box.id}/${images[i].image.name}`,
                        imageUrl: this.createFileUrl(`boxImages/${this.box.id}/${images[i].image.name}`)
                    };
                }
            }
            const imagesToDelete = _differenceWith(this.box.images, images, (imageA, imageB) => {
                return imageA === imageB.image;
            });
            imagesToDelete.forEach(image => {
                storage.ref().child(image).delete();
            });
            this.$store.dispatch('box/updateBox', Object.assign(this.box, { images: images.map(image => image.image) }));
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
