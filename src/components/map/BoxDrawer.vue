<template>
    <v-container>
        <v-layout v-if="!data.position">
            <h3 class="subheading ">Select position on map</h3>
        </v-layout>
        <template v-else>
            <v-layout row>
                <v-flex xs12>
                    <v-carousel v-if="imageUrls.length > 0" height="200" class="mt-2 mb-3">
                        <v-carousel-item
                            v-for="(imageUrl, index) in imageUrls"
                            :key="index"
                            :src="imageUrl.imageUrl"
                    ></v-carousel-item>
                    </v-carousel>
                </v-flex>
            </v-layout>
            <map-box-form :data="formData" @saveBox="saveBox" @deleteBox="deleteBox" @markAsFound="markAsFound" />
        </template>
        <map-box-hints
            v-if="boxId"
            :mapApi="mapApi"
            :google="google"
            :hints="boxHints"
            :editBoxMarker="editBoxMarker"
            :boxPosition="data.position"
            :editable="!formData.foundByUser"
            @saveBoxHints="saveBoxHints"
            @deleteBoxHint="deleteBoxHint"
        ></map-box-hints>
        <v-layout row v-if="data.id">
            <v-flex xs12 class="text-xs-center">
                <v-btn color="primary" @click="openBoxPage">Open box page</v-btn>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
import { EventBus, Events } from '../../events';
import { functions } from '@/firebaseConfig';
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
            google: null,
            imageUrls: []
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
            return _pick(this.data, ['title', 'description', 'value', 'image', 'imageName', 'id', 'foundAt', 'foundByUser', 'isPhysical']);
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
            const markBoxAsFound = functions.httpsCallable('markBoxAsFound');
            markBoxAsFound({ id: this.data.id }).then((res) => {
                // console.log(res)
            }).catch(e => {
                console.error(e);
            });
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
        },
        openBoxPage() {
            this.$router.push({
                name: 'boxdetails',
                params: { id: this.boxId }
            });
            EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
        },
        loadImages() {
            const imageUrls = [];
            if (!this.data.images) {
                this.imageUrls = imageUrls;
                return;
            }
            Promise.all(this.data.images.map(image => {
                return this.createFileUrl(image).then(imageUrl => {
                    imageUrls.push({
                        image,
                        imageUrl
                    });
                });
            })).then(() => {
                this.imageUrls = imageUrls;
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
        },
        boxId() {
            this.currentHint = null;
            this.loadImages();
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
