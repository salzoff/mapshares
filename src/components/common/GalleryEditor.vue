<template>
    <div>
        <v-item-group>
            <v-layout wrap grid-list-md>
                <draggable v-model="editableImages" draggable=".drag-item" class="layout">
                    <v-item v-for="(imageUrl, index) in editableImages" :key="index" class="drag-item ma-1">
                        <v-flex xs3>
                            <v-img :src="imageUrl" />
                        </v-flex>
                    </v-item>
                </draggable>
            </v-layout>
            <v-layout row>
                <v-flex xs12 class="text-xs-right">
                    <!--v-btn color="primary" @click="$emit('save', editableImages)">Save</v-btn-->
                    <v-btn @click="$emit('cancel')">Cancel</v-btn>
                </v-flex>
            </v-layout>
        </v-item-group>
    </div>
</template>

<script>
import draggable from 'vuedraggable';
export default {
    name: 'gallery-editor',
    components: { draggable },
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
            this.editableImages = images;
        }
    },
    mounted() {
        this.editableImages = this.images;
    }
};
</script>

<style scoped lang="scss">

</style>
