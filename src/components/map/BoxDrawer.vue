<template>
    <v-layout v-if="!data.position">
        <h3 class="ma-3 subheading ">Select position on map</h3>
    </v-layout>
    <v-layout v-else>
        <v-form class="ma-2 drawer-boxform" @submit.prevent="saveBox">
            <v-text-field v-model="data.title" label="Title" />
            <v-textarea v-model="data.description" label="Description" />
            <v-text-field v-model="data.value" type="number" label="Value" />
            <v-btn class="ml-0" type="submit" color="success">Save</v-btn>
            <v-btn v-if="data.id" color="warning" @click="deleteBox">Delete</v-btn>
        </v-form>
    </v-layout>
</template>

<script>
import { EventBus, Events } from '../../events';
export default {
    name: 'map-box-drawer',
    data() {
        return {
            mode: 'add'
        };
    },
    computed: {
        data: {
            get() {
                return this.$store.getters['drawer/data'];
            },
            set(data) {
                console.log(data);
                this.$store.dispatch('drawer/setData', data);
            }
        },
        boxMarker: {
            get() {
                return this.data.boxMarker;
            },
            set(boxMarker) {
                this.data = { boxMarker };
            }

        }
    },
    methods: {
        saveBox() {
            const newBox = Object.assign({}, this.data);
            delete newBox.boxMarker;
            if (this.data.id) {
                this.$store.dispatch('box/updateBox', newBox).then(() => {
                    EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
                });
            } else {
                this.$store.dispatch('box/addBox', newBox).then((boxRef) => {
                    console.log(boxRef);
                    this.$store.dispatch('drawer/setTitle', 'Edit box');
                    this.boxMarker.setMap(null);
                    this.$store.dispatch('drawer/setData', { id: boxRef.get().id });
                });
            }
        },
        deleteBox() {
            this.$store.dispatch('box/deleteBox', this.data).then(() => {
                this.$store.dispatch('drawer/clearData');
                EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
            });
        }
    },
    watch: {
        boxMarker: {
            deep: false,
            handler(boxMarker) {
                if (boxMarker) {
                    this.data.position = {
                        lat: boxMarker.position.lat(),
                        lng: boxMarker.position.lng()
                    };
                }
            }
        }
    },
    mounted() {
        EventBus.$on(Events.HIDE_CONTENT_IN_DRAWER, () => {
            this.$store.dispatch('drawer/clearData');
        });
    }
};
</script>

<style scoped lang="scss">
    .drawer-boxform {
        width: 100%;
    }
</style>
