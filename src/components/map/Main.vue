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
                        @zoom_changed="updateZoom"
                        @idle="sync"
                        @init="updateGeoQuery"
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
    ADD_BOX: 1,
    EDIT_BOX: 2,
    VIEW_USER: 3
};
const mapObjectTypes = {
    USER: 1,
    BOX: 2,
    HINT: 3
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
            reportedZoom: 15,
            calculatedHeight: 0,
            mode: 0,
            mapApi: null,
            boxMarkers: {},
            objects: {}
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
        rangeCircle() {
            return this.drawerData.rangeCircle;
        },
        mapObjects() {
            return this.$store.getters['map/mapObjects'];
        }
    },
    methods: {
        updateCenter (latLng) {
            this.reportedCenter = {
                lat: latLng.lat(),
                lng: latLng.lng()
            };
            this.$store.dispatch('map/updateGeoQuery', {
                center: latLng,
                zoom: this.mapApi.getZoom(),
                bounds: this.mapApi.getBounds()
            });
        },
        updateZoom(zoom) {
            this.reportedZoom = zoom;
            this.$store.dispatch('map/updateGeoQuery', {
                center: this.mapApi.getCenter(),
                zoom: zoom,
                bounds: this.mapApi.getBounds()
            });
        },
        sync () {
            this.center = this.reportedCenter;
            this.zoom = this.reportedZoom;
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
        markUser(user) {
            if (user.id === this.currentUser.uid) {
                return;
            }
            if (this.objects[user.id]) {
                this.objects[user.id].marker.setMap(null);
            }
            const newMarker = new this.google.maps.Marker({
                position: {
                    lat: user.lastLocation.lat,
                    lng: user.lastLocation.lng
                },
                map: this.mapApi,
                icon: 'assets/images/icons/user.gif'
            });
            newMarker.id = user.id;
            newMarker.addListener('click', e => {
                this.mode = modes.VIEW_USER;
                this.$store.dispatch('drawer/setTitle', 'View user');
                this.$store.dispatch('drawer/setComponent', 'map-user-drawer');
                this.$store.dispatch('drawer/setData', Object.assign({}, user, {
                    viewedUser: user
                }));
                EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
            });
            user.marker = newMarker;
            this.objects[user.id] = user;
        },
        markBox(box) {
            if (this.objects[box.id]) {
                this.objects[box.id].marker.setMap(null);
            }

            const newMarker = new this.google.maps.Marker({
                position: {
                    lat: box.position.lat,
                    lng: box.position.lng
                },
                map: this.mapApi,
                icon: 'assets/images/icons/logo-klein.gif',
                label: {
                    text: box.value.toString(),
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#f1f1f1'
                }
            });
            newMarker.addListener('click', (e) => {
                const newBox = this.objects[box.id];
                this.mode = modes.EDIT_BOX;
                this.$store.dispatch('drawer/setTitle', 'Edit box');
                this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                this.$store.dispatch('box/fetchHintsForBox', newBox.id).then(() => {
                    this.$store.dispatch('drawer/setData', Object.assign(newBox, {
                        editBoxMarker: newMarker,
                        boxHints: this.$store.getters['box/hintsForBox']
                    }));
                });
                EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
            });
            if (box.marker) {
                box.marker.setMap(null);
            }
            newMarker.id = box.id;
            box.marker = newMarker;
            this.objects[box.id] = box;
        },
        markHint(hint) {
            if (this.objects[hint.id]) {
                this.objects[hint.id].marker.setMap(null);
            }
            const newMarker = new this.google.maps.Circle({
                center: hint.position,
                radius: hint.distanceRange,
                fillColor: '#1976d2',
                strokeWidth: 0,
                fillOpacity: 0.5,
                map: this.mapApi
            });
            if (hint.marker) {
                hint.marker.setMap(null);
            }
            newMarker.id = hint.id;
            hint.marker = newMarker;
            this.objects[hint.id] = hint;
        },
        setHintLabels() {
            this.mapObjects.filter(mapObject => mapObject.objectType === 3).forEach(mapObject => {
                if (mapObject.forBox && this.objects[mapObject.forBox] && this.objects[mapObject.forBox].marker) {
                    this.objects[mapObject.forBox].marker.setLabel({
                        text: mapObject.distanceRange.toString(),
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#fff'
                    });
                }
            });
        },
        updateMapObjects(mapObjects) {
            const objectsInMap = [];
            mapObjects.forEach(mapObject => {
                objectsInMap.push(mapObject.id);
                switch (mapObject.objectType) {
                    case mapObjectTypes.USER:
                        this.markUser(mapObject);
                        break;
                    case mapObjectTypes.BOX:
                        this.markBox(mapObject);
                        break;
                    case mapObjectTypes.HINT:
                        this.markHint(mapObject);
                        break;
                    default:
                        break;
                }
            });
            const markedObjects = Object.keys(this.objects);
            _difference(markedObjects, objectsInMap).forEach(objectId => {
                if (this.objects[objectId] && this.objects[objectId].marker) {
                    this.objects[objectId].marker.setMap(null);
                }
                delete this.mapObjects[objectId];
            });
        },
        updateGeoQuery() {
            this.$store.dispatch('map/updateGeoQuery', {
                center: this.mapApi.getCenter(),
                zoom: this.mapApi.getZoom(),
                bounds: this.mapApi.getBounds()
            });
        }
    },
    watch: {
        rangeCircle: {
            deep: false,
            handler: function(circle) {
                if (circle) {
                    circle.setMap(this.mapApi);
                }
            }
        },
        mapObjects(mapObjects) {
            this.updateMapObjects(mapObjects);
        }
    },
    mounted () {
        this.$set(this, 'calculatedHeight', window.innerHeight - 70);
        this.moveToUserPosition();
        this.$refs.mapRef.$mapPromise.then((map) => {
            this.mapApi = map;
            this.$store.commit('map/SET_MAP_API', map);
            this.$store.commit('map/SET_GOOGLE', this.google);
            const listener = this.mapApi.addListener('tilesloaded', e => {
                this.updateGeoQuery();
                this.google.maps.event.removeListener(listener);
            });
            EventBus.$emit(Events.MAP_API_LOADED);
        });
        EventBus.$on(Events.HIDE_CONTENT_IN_DRAWER, () => {
            if (this.drawerData.boxMarker) {
                this.drawerData.boxMarker.setMap(null);
                this.drawerData = { boxMarker: null };
            }
            if (this.drawerData.rangeCircle) {
                this.drawerData.rangeCircle.setMap(null);
                this.drawerData = { rangeCircle: null };
            }
            if (this.drawerData.editBoxMarker) {
                this.drawerData = { editBoxMarker: null };
            }
            this.mode = 0;
        });
    }
};
</script>

<style scoped lang="scss">
    #map {
        width: 100%;
    }
</style>
