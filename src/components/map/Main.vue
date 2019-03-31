<template>
    <div>
        <v-layout>
            <v-flex xs2>
                <v-layout column fill-height>
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
                    <v-list>
                        <v-list-tile>
                            <v-list-tile-content>
                                <span class="subheading">Display</span>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-action>
                                <v-checkbox v-model="displayUsers" />
                            </v-list-tile-action>
                            <v-list-tile-content>Users</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-action>
                                <v-checkbox v-model="displayBoxes" />
                            </v-list-tile-action>
                            <v-list-tile-content>Boxes</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-action>
                                <v-checkbox v-model="displayHints" />
                            </v-list-tile-action>
                            <v-list-tile-content>Hints</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-action>
                                <v-checkbox v-model="displayFoundBoxes" />
                            </v-list-tile-action>
                            <v-list-tile-content>Found boxes</v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                    <v-list>
                        <v-list-tile>
                            <v-list-tile-action>
                                <v-checkbox v-model="simulateDistances" />
                            </v-list-tile-action>
                            <v-list-tile-content>Simulate distances</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-for="(item, index) in simulationItems" :key="item.title">
                            <v-list-tile-content>
                                {{ index + 1 }}. {{ item.title }} {{ item.distance }} m
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                    <v-spacer />
                    <v-list>
                        <v-list-tile>
                            <v-list-tile-content>
                                <strong>Values in map</strong>
                            </v-list-tile-content>
                            <v-list-tile-content>
                                {{ valuesInMap }}
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                </v-layout>
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
import { geoDistance } from '@/helper/location';
import { db } from '@/firebaseConfig';
import { gmapApi } from 'vue2-google-maps';
const modes = {
    ADD_BOX: 1,
    EDIT_BOX: 2,
    VIEW_USER: 3
};
const mapObjectTypes = {
    USER: 1,
    BOX: 2,
    HINT: 3,
    FOUND_BOX: 4
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
            objects: {},
            valuesInMap: 0,
            displayUsers: true,
            displayBoxes: true,
            displayHints: true,
            displayFoundBoxes: true,
            simulationItems: [],
            simulateDistances: false,
            simulationListener: null,
            boxReferences: [],
            distancesToPoint: {}
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
            this.updateValuesInMap();
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
            if (this.objects[user.id] && this.objects[user.id].marker) {
                this.objects[user.id].marker.setMap(null);
            }
            if (this.displayUsers) {
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
                    console.log(user);
                    user.userRole.get().then(result => {
                        const roleData = result.data();
                        user.role = roleData.name;
                        this.mode = modes.VIEW_USER;
                        this.$store.dispatch('drawer/setTitle', 'View user');
                        this.$store.dispatch('drawer/setComponent', 'map-user-drawer');
                        this.$store.dispatch('drawer/setData', Object.assign({}, user, {
                            viewedUser: user
                        }));
                        EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                    });
                });
                user.marker = newMarker;
            }
            this.objects[user.id] = user;
        },
        markBox(box) {
            if (this.objects[box.id] && this.objects[box.id].marker) {
                this.objects[box.id].marker.setMap(null);
            }
            if (this.displayBoxes) {
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
                        color: '#555555'
                    }
                });
                newMarker.addListener('click', (e) => {
                    const newBox = Object.assign({}, this.objects[box.id]);
                    console.log('boxClick', box);
                    this.mode = modes.EDIT_BOX;
                    this.$store.dispatch('drawer/setTitle', 'Edit box');
                    this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                    this.$store.dispatch('box/fetchHintsForBox', newBox.id).then(() => {
                        newBox.editBoxMarker = newMarker;
                        newBox.boxHints = this.$store.getters['box/hintsForBox'];
                        newBox.foundBy = null;
                        newBox.foundAt = null;
                        newBox.foundByUser = null;
                        console.log('listener newBox');
                        console.table(newBox);
                        this.$store.dispatch('drawer/setData', newBox);
                        EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                    });
                });
                newMarker.id = box.id;
                box.marker = newMarker;
            }
            this.objects[box.id] = box;
        },
        markFoundBox(box) {
            console.log(box);
            if (this.objects[box.id] && this.objects[box.id].marker) {
                this.objects[box.id].marker.setMap(null);
            }
            if (this.displayFoundBoxes) {
                const newMarker = new this.google.maps.Marker({
                    position: {
                        lat: box.position.lat,
                        lng: box.position.lng
                    },
                    map: this.mapApi,
                    icon: 'assets/images/icons/logo-found-klein.gif'
                });
                newMarker.addListener('click', (e) => {
                    const newBox = this.objects[box.id];
                    console.log('boxClick', box);
                    this.mode = modes.EDIT_BOX;
                    this.$store.dispatch('drawer/setTitle', 'View box');
                    this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                    this.$store.dispatch('box/fetchHintsForBox', newBox.id).then(() => {
                        newBox.editBoxMarker = newMarker;
                        newBox.boxHints = this.$store.getters['box/hintsForBox'];
                        newBox.foundBy = newBox.foundBy ? newBox.foundBy : null;
                        newBox.foundAt = newBox.foundAt ? newBox.foundAt : null;
                        newBox.foundBy.get().then(foundBy => {
                            console.log('foundBy', foundBy.data());
                            newBox.foundByUser = foundBy.data().username;
                            this.$store.dispatch('drawer/setData', newBox);
                            EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                        });
                    });
                });
                newMarker.id = box.id;
                box.marker = newMarker;
            }
            this.objects[box.id] = box;
        },
        markHint(hint) {
            if (this.objects[hint.id] && this.objects[hint.id].marker) {
                this.objects[hint.id].marker.setMap(null);
            }
            if (this.displayHints) {
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
            }
            this.objects[hint.id] = hint;
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
                    case mapObjectTypes.FOUND_BOX:
                        this.markFoundBox(mapObject);
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
            this.updateValuesInMap();
        },
        updateValuesInMap() {
            const bounds = this.mapApi.getBounds();
            const value = this.mapObjects
                .filter(mapObject => mapObject.objectType === mapObjectTypes.BOX)
                .filter(mapObject => bounds.contains(mapObject.position))
                .reduce((acc, val) => {
                    acc += parseInt(val.value);
                    return acc;
                }, 0);
            this.valuesInMap = value;
        },
        updateGeoQuery() {
            this.$store.dispatch('map/updateGeoQuery', {
                center: this.mapApi.getCenter(),
                zoom: this.mapApi.getZoom(),
                bounds: this.mapApi.getBounds()
            });
        },
        sortBoxReferences(point) {
            this.distancesToPoint = {};
            this.boxReferences = this.boxReferences.sort((boxA, boxB) => {
                if (!this.distancesToPoint[boxA.id]) {
                    this.distancesToPoint[boxA.id] = geoDistance(point, boxA.position);
                }
                if (!this.distancesToPoint[boxB.id]) {
                    this.distancesToPoint[boxB.id] = geoDistance(point, boxB.position);
                }
                return this.distancesToPoint[boxA.id] - this.distancesToPoint[boxB.id];
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
        },
        displayUsers() {
            this.updateMapObjects(this.mapObjects);
        },
        displayBoxes() {
            this.updateMapObjects(this.mapObjects);
        },
        displayHints() {
            this.updateMapObjects(this.mapObjects);
        },
        displayFoundBoxes() {
            this.updateMapObjects(this.mapObjects);
        },
        simulateDistances(value) {
            if (value) {
                let lastBoxSorting = Date.now();
                const center = this.mapApi.getCenter();
                this.boxReferences = this.mapObjects.filter(mapObject => mapObject.objectType === mapObjectTypes.BOX);
                this.sortBoxReferences({ lat: center.lat(), lng: center.lng() });
                this.simulationItems = this.boxReferences.slice(0, 5);
                this.simulationListener = this.mapApi.addListener('mousemove', e => {
                    if (Date.now() - lastBoxSorting > 500) {
                        lastBoxSorting = Date.now();
                        this.sortBoxReferences({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                        this.simulationItems = this.boxReferences.slice(0, 5).map(box => Object.assign({ distance: Math.round(this.distancesToPoint[box.id]) }, box));
                    }
                });
            } else {
                this.boxReferences = [];
                this.google.maps.event.removeListener(this.simulationListener);
                this.simulationItems = [];
            }
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
