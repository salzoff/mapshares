<template>
    <div>
        <v-layout v-if="!box || !hintsForBox.length === 0">Loading...</v-layout>
        <template v-else>
            <v-layout row>
                <v-flex xs12>
                    <h2 class="mb-2 headline">Details for box {{ box.id }}</h2>
                </v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12>
                    <box-images :box="box" class="mt-2 mb-2" />
                </v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12 md8 class="title mt-2">Title</v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12 md8 class="mt-2">{{ box.title }}</v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12 md8 class="title mt-2">Description</v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs12 md8 class="mt-2">{{ box.description ? box.description : 'none' }}</v-flex>
            </v-layout>
            <v-flex xs12 md8 row class="title mt-2">Value: {{ box.value }}</v-flex>
            <box-hints :hints="hintsForBox" />
        </template>
    </div>
</template>

<script>
import BoxHints from './Hints';
import BoxImages from './Images';
export default {
    name: 'box-details',
    components: { BoxHints, BoxImages },
    props: {
        id: {
            type: String,
            required: true
        }
    },
    computed: {
        box() {
            return this.$store.getters['box/detailViewBox'];
        },
        hintsForBox() {
            return this.$store.getters['box/hintsForBox'];
        }
    },
    methods: {
        fetchDetailViewBox() {
            this.$store.dispatch('box/fetchBoxForDetailView', this.id);
        },
        fetchHints() {
            this.$store.dispatch('box/fetchHintsForBox', this.id);
        }
    },
    watch: {
        id() {
            this.fetchDetailViewBox();
        }
    },
    mounted() {
        this.fetchDetailViewBox();
        this.fetchHints();
    }
};
</script>
