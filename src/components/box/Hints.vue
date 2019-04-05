<template>
    <div>
        <v-layout row class="mt-4 mb-1">
            <v-flex xs12 md6>
                <h2 class="title">
                    Hints
                </h2>
            </v-flex>
        </v-layout>
        <div v-for="(hint, index) in hints" row class="mt-2" :key="index">
            <v-layout row>
                <v-flex xs12 md6>
                    <v-divider class="mb-2" />
                </v-flex>
            </v-layout>
            <v-layout row>
                <v-flex xs2 md1 class="body-2">Visible from:</v-flex>
                <v-flex xs10 md5>{{ formatDateTime(hint.visibleFrom) }}</v-flex>
            </v-layout>
            <template v-if="hint.type === boxHintTypes.LOCATION">
                <v-layout row class="mt-1">
                    <v-flex xs2 md1 class="body-2">Coordinates:</v-flex>
                    <v-flex xs10 md5>
                        {{ `Latitude: ${hint.value.position.lat}, Longitude: ${hint.value.position.lng}` }}
                    </v-flex>
                </v-layout>
                <v-layout row class="mt-1">
                    <v-flex xs2 md1 class="body-2">Range:</v-flex>
                    <v-flex xs10 md5>
                        {{ hint.value.distanceRange }} m
                    </v-flex>
                </v-layout>
            </template>
            <template v-else-if="hint.type === boxHintTypes.TEXT">
                <v-layout row class="mt-1">
                    <v-flex xs2 md1 class="body-2">Text:</v-flex>
                    <v-flex xs10 md5>{{ hint.value.text }}</v-flex>
                </v-layout>
            </template>
            <template v-else-if="hint.type === boxHintTypes.IMAGE">
                <v-layout row class="mt-1">
                    <v-flex xs2 md1 class="body-2   x">Image:</v-flex>
                    <v-flex xs10 md5>
                        <img style="max-height: 300px" v-async-storage-image="`boxHintImages/${hint.id}`" />
                    </v-flex>
                </v-layout>
            </template>
        </div>
    </div>
</template>

<script>
import { boxHintTypes } from '@/helper/enums';
export default {
    name: 'box-hints',
    props: {
        hints: {
            type: Array,
            required: true
        }
    },
    computed: {
        boxHintTypes() {
            return boxHintTypes;
        }
    }
};
</script>
