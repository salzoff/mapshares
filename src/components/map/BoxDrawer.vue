<template>
    <v-container>
        <v-layout v-if="!data.position">
            <h3 class="subheading ">Select position on map</h3>
        </v-layout>
        <v-layout v-else>
            <map-box-form :data="formData" @saveBox="saveBox" @deleteBox="deleteBox" @markAsFound="markAsFound" />
        </v-layout>
        <map-box-hints
            v-if="boxId"
            :mapApi="mapApi"
            :google="google"
            :hints="boxHints"
            :editBoxMarker="editBoxMarker"
            @saveBoxHints="saveBoxHints"
            @deleteBoxHint="deleteBoxHint"
        ></map-box-hints>
    </v-container>
</template>

<script>
import { EventBus, Events } from '../../events';
import _difference from 'lodash/difference';
import _pick from 'lodash/pick';
import MapBoxForm from '@/components/map/box/Form.vue';
import MapBoxHints from '@/components/map/box/Hints.vue';
export default {
    name: 'map-box-drawer',
    components: { MapBoxForm, MapBoxHints },
    data() {
        return {
            currentHint: null,
            mapApi: null,
            google: null
        };
    },
    computed: {
        data: {
            get() {
                return this.$store.getters['drawer/data'];
            },
            set(data) {
                this.$store.dispatch('drawer/setData', data);
            }
        },
        formData() {
            return _pick(this.data, ['title', 'description', 'value', 'image', 'imageName', 'id']);
        },
        boxMarker: {
            get() {
                return this.data.boxMarker;
            },
            set(boxMarker) {
                this.data = { boxMarker };
            }
        },
        boxHintsInStore() {
            return this.$store.getters['box/hintsForBox'];
        },
        editBoxMarker() {
            return this.data.editBoxMarker;
        },
        boxId() {
            return this.data.id;
        },
        boxHints: {
            get() {
                const boxHints = this.data.boxHints;
                if (!boxHints) {
                    return [];
                } else {
                    return boxHints;
                }
            },
            set(boxHints) {
                this.data = { boxHints };
            }
        }
    },
    methods: {
        saveBox(data) {
            console.log('saveBox', data);
            this.data = data;
            const newBox = Object.assign({}, this.data);
            delete newBox.boxMarker;
            if (this.data.id) {
                this.$store.dispatch('box/updateBox', newBox).then(() => {
                    EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
                });
            } else {
                this.$store.dispatch('box/addBox', newBox).then((boxRef) => {
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
        },
        markAsFound() {
            console.log('found');
        },
        saveBoxHints() {
            if (this.currentHint) {
                this.saveBoxHint(this.currentHint);
            }
            this.$store.dispatch('box/saveBoxHints', this.data).then(() => {
                this.boxHints = this.boxHints.filter(hint => hint.id);
            });
        },
        deleteBoxHint(boxHint, index = null) {
            if (boxHint.id) {
                this.$store.dispatch('box/deleteBoxHint', {
                    id: this.data.id,
                    boxHint
                });
            }
            this.boxHints.splice(index, 1);
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
        },
        boxId() {
            this.currentHint = null;
        },
        boxHintsInStore(hintsInStore) {
            const hintIds = hintsInStore.map(hint => hint.id);
            const foundIds = [];
            const newBoxHints = Array.from(this.boxHints);
            newBoxHints.forEach((hint, index) => {
                if (hint.id) {
                    let hintInStore = hintsInStore.find(hintInStore => hintInStore.id === hint.id);
                    if (!hintInStore) {
                        newBoxHints.splice(index, 1);
                    } else {
                        newBoxHints[index] = hintInStore;
                    }
                }
                foundIds.push(hint.id);
            });
            _difference(hintIds, foundIds).forEach(hintId => {
                newBoxHints.push(hintsInStore.find(hint => hint.id === hintId));
            });
            this.boxHints = newBoxHints;
        }
    },
    mounted() {
        EventBus.$on(Events.HIDE_CONTENT_IN_DRAWER, () => {
            this.$store.dispatch('drawer/clearData');
        });
        if (this.$store.getters['map/getMapApi']) {
            this.mapApi = this.$store.getters['map/getMapApi'];
            this.google = this.$store.getters['map/getGoogle'];
        } else {
            EventBus.$on(Events.MAP_API_LOADED, () => {
                this.mapApi = this.$store.getters['map/getMapApi'];
                this.google = this.$store.getters['map/getGoogle'];
            });
        }
    }
};
</script>

<style scoped lang="scss">
    .drawer-boxform {
        width: 100%;
    }
</style>
