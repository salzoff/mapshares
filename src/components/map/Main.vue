<template>
    <div>
        <v-layout>
            <v-flex xs2>
                <v-list>
                    <v-list-tile  @click="moveToUserPosition" class="map-action-item">
                        <v-list-tile-action><v-icon>person_pin</v-icon></v-list-tile-action>
                        <v-list-tile-content>Your location</v-list-tile-content>
                    </v-list-tile>
                    <v-list-tile @click="addBox" class="map-action-item">
                        <v-list-tile-action><v-icon>add_location</v-icon></v-list-tile-action>
                        <v-list-tile-content>Add box</v-list-tile-content>
                    </v-list-tile>
                </v-list>
            </v-flex>
            <v-flex xs10>
                <div id="map" :style="{ height: calculatedHeight + 'px' }">
                    <gmap-map
                        :center="center"
                        @center_changed="updateCenter"
                        @idle="sync"
                        :zoom="zoom"
                        style="width: 100%; height: 100%"
                        @click="handleMapClick"
                        ref="mapRef"
                    >
                        <gmap-marker
                            v-if="!isFetchingInitialUserProfile"
                            :position="userPosition"
                            :clickable="true"
                            :draggable="true"
                        />
                    </gmap-map>
                </div>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
import _difference from 'lodash/difference';
import { EventBus, Events } from '../../events';
import { gmapApi } from 'vue2-google-maps';
const modes = {
    ADD_BOX: 1
};
export default {
    name: 'map-main',
    data () {
        return {
            center: {
                lat: 10,
                lng: 40
            },
            reportedCenter: {
                lat: 10,
                lng: 40
            },
            zoom: 15,
            calculatedHeight: 0,
            mode: 0,
            mapApi: null,
            boxMarkers: {}
        };
    },
    computed: {
        google: gmapApi,
        userPosition() {
            return {
                lat: this.currentUserProfile.lastLocation.latitude,
                lng: this.currentUserProfile.lastLocation.longitude
            };
        },
        drawerData: {
            get() {
                return this.$store.getters['drawer/data'];
            },
            set(data) {
                this.$store.dispatch('drawer/setData', data);
            }
        },
        boxesInMap() {
            return this.$store.getters['box/boxesInMap'];
        }
    },
    methods: {
        updateCenter (latLng) {
            this.reportedCenter = {
                lat: latLng.lat(),
                lng: latLng.lng()
            };
        },
        sync () {
            this.center = this.reportedCenter;
        },
        moveToUserPosition() {
            this.center = this.userPosition;
            this.reportedCenter = Object.assign({}, this.center);
        },
        addBox() {
            this.$store.dispatch(('drawer/clearData'));
            this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
            this.$store.dispatch('drawer/setTitle', 'Add box');
            EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
            this.mode = modes.ADD_BOX;
        },
        handleMapClick(e) {
            switch (this.mode) {
                case modes.ADD_BOX:
                    const boxMarker = new this.google.maps.Marker({
                        position: e.latLng,
                        map: this.mapApi
                    });
                    if (this.drawerData.boxMarker) {
                        this.drawerData.boxMarker.setMap(null);
                    }
                    this.drawerData = { boxMarker };
                    this.drawerData = {
                        title: '',
                        description: '',
                        value: 0,
                        image: null
                    };
                    break;
                default:
                    break;
            }
        },
        markBoxes(boxes) {
            const foundBoxes = [];
            boxes.forEach(box => {
                foundBoxes.push(box.id);
                if (!this.boxMarkers[box.id]) {
                    const newMarker = new this.google.maps.Marker({
                        position: {
                            lat: box.position.latitude,
                            lng: box.position.longitude
                        },
                        map: this.mapApi,
                        icon: 'assets/images/icons/logo-klein.gif'
                    });
                    newMarker.addListener('click', () => {
                        this.$store.dispatch('drawer/setTitle', 'Edit box');
                        this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                        this.$store.dispatch('drawer/setData', Object.assign(box, { boxMarker: newMarker }));
                        EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                    });
                    this.boxMarkers[box.id] = newMarker;
                }
            });
            _difference(Object.keys(this.boxMarkers), foundBoxes).forEach(key => {
                this.boxMarkers[key].setMap(null);
                delete this.boxMarkers[key];
            });
        }
    },
    watch: {
        boxesInMap(boxes) {
            this.markBoxes(boxes);
        }
    },
    mounted () {
        this.$set(this, 'calculatedHeight', window.innerHeight - 70);
        this.moveToUserPosition();
        this.$refs.mapRef.$mapPromise.then((map) => {
            this.mapApi = map;
            this.markBoxes(this.boxesInMap);
        });
        EventBus.$on(Events.HIDE_CONTENT_IN_DRAWER, () => {
            if (this.drawerData.boxMarker) {
                this.drawerData.boxMarker.setMap(null);
            }
        });
    }
};
</script>

<style scoped lang="scss">
    #map {
        width: 100%;
    }
</style>
