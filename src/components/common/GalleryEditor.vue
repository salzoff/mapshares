<template>
    <div>
        <v-item-group>
            <v-layout wrap grid-list-md>
                <draggable v-model="editableImages" draggable=".drag-item" class="layout">
                    <v-item v-for="(imageUrl, index) in editableImages" :key="index" class="drag-item ma-1">
                        <v-flex xs3 style="position: relative">
                            <v-btn fab small dark absolute @click="deleteImage(index)"><v-icon>close</v-icon></v-btn>
                            <v-img :src="imageUrl.imageUrl" />
                        </v-flex>
                    </v-item>
                </draggable>
            </v-layout>
            <v-layout row>
                <v-flex xs 12>
                    <file-input ref="imageInput" @input="addImage" label="Add image..." accept="image/*" />
                </v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12 class="text-xs-right">
                    <v-btn color="primary" @click="$emit('save', editableImages)">Save</v-btn>
                    <v-btn @click="$emit('cancel')">Close</v-btn>
                </v-flex>
            </v-layout>
        </v-item-group>
    </div>
</template>

<script>
import draggable from 'vuedraggable';
import FileInput from '@/components/common/FileInput';
export default {
    name: 'gallery-editor',
    components: { draggable, FileInput },
    data() {
        return {
            editableImages: []
        };
    },
    props: {
        images: {
            type: Array,
            required: true
        }
    },
    watch: {
        images: function(images) {
            this.editableImages = Array.from(images);
        }
    },
    methods: {
        addImage(image) {
            console.log(image);
            console.log(this.$refs.imageInput.$el);
            this.editableImages.push({ image: image, imageUrl: URL.createObjectURL(image) });
            this.$refs.imageInput.$el.querySelector('input').value = null;
        },
        deleteImage(index) {
            this.editableImages = this.editableImages.slice(0, index).concat(this.editableImages.slice(index + 1));
        }
    },
    mounted() {
        this.editableImages = Array.from(this.images);
    }
};
</script>

<style scoped lang="scss">
    .drag-item {
        cursor: grab;
    }
    .drag-item .v-btn {
        font-size: 8px;
        width: 26px;
        height: 26px;
        top: 5px;
        right: 5px;
    }
    .drag-item:active {
        cursor: grabbing;
    }
</style>
