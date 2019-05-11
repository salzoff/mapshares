<template>
    <div>
        <v-layout>
            <v-flex xs4 sm3 md2>
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
                        <v-list-tile v-if="hasPermission(permissionEnum.SHOW_USER)">
                            <v-list-tile-action>
                                <v-checkbox v-model="displayUsers" />
                            </v-list-tile-action>
                            <v-list-tile-content>Users</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-if="hasPermission(permissionEnum.SHOW_BOX_LOCATION)">
                            <v-list-tile-action>
                                <v-checkbox v-model="displayBoxes" />
                            </v-list-tile-action>
                            <v-list-tile-content>Boxes</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-if="hasPermission(permissionEnum.SHOW_HINT)">
                            <v-list-tile-action>
                                <v-checkbox v-model="displayHints" />
                            </v-list-tile-action>
                            <v-list-tile-content>Hints</v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-if="hasPermission(permissionEnum.SHOW_FOUND_BOX)">
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
                                <v-dialog v-model="showValuePrompt" width="300">
                                    <template v-slot:activator="{ on }">
                                        <v-btn icon small absolute right v-on="on"><v-icon>edit</v-icon></v-btn>{{ valuesInMap }}
                                    </template>
                                    <v-card>
                                        <v-card-title>
                                            Edit box values in map
                                        </v-card-title>
                                        <v-card-text>
                                            <v-text-field v-model="valueEditField" label="New value" type="number" />
                                            <v-btn color="primary" @click="assignNewBoxValue">Ok</v-btn>
                                            <v-btn @click="showValuePrompt = false; valueEditField = 0;">Cancel</v-btn>
                                        </v-card-text>
                                    </v-card>
                                </v-dialog>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                </v-layout>
            </v-flex>
            <v-flex xs8 sm9 md10>
                <div id="map" style="{ height: calculatedHeight + 'px' }">
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
import { permissions } from '@/helper/enums';
import { gmapApi } from 'vue2-google-maps';
const modes = {
    ADD_BOX: 1,
    EDIT_BOX: 2,
    VIEW_USER: 3
};
const mapObjectTypes = {
    USER: 1,
    VIRTUAL_BOX: 2,
    PHYSICAL_BOX: 3,
    FOUND_VIRTUAL_BOX: 4,
    FOUND_PHYSICAL_BOX: 5,
    HINT: 6
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
            distancesToPoint: {},
            showValuePrompt: false,
            valueEditField: 0
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
        },
        permissionEnum() {
            return permissions;
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
            if (this.displayUsers && this.hasPermission(permissions.SHOW_USER)) {
                const newMarker = new this.google.maps.Marker({
                    position: user.position,
                    map: this.mapApi,
                    icon: 'assets/images/icons/user.gif'
                });
                newMarker.id = user.id;
                newMarker.addListener('click', e => {
                    user.ref.get().then(userDoc => {
                        const newUser = userDoc.data();
                        newUser.id = userDoc.id;
                        newUser.lastLocationAt = newUser.lastLocationAt.toDate();
                        newUser.createdAt = newUser.createdAt.toDate();
                        newUser.lastLogin = newUser.lastLogin.toDate();
                        newUser.userRole.get().then(result => {
                            const roleData = result.data();
                            user.role = roleData.name;
                            this.mode = modes.VIEW_USER;
                            this.$store.dispatch('drawer/setTitle', 'View user');
                            this.$store.dispatch('drawer/setComponent', 'map-user-drawer');
                            this.$store.dispatch('drawer/setData', Object.assign({}, { viewedUser: newUser }));
                            EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                        });
                    });
                });
                user.marker = newMarker;
            }
            this.objects[user.id] = user;
        },
        markVirtualBox(box) {
            console.log('markVirtualBox');
            if (this.objects[box.ref.id] && this.objects[box.ref.id].marker) {
                this.objects[box.ref.id].marker.setMap(null);
            }
            if (this.displayBoxes && this.hasPermission(permissions.SHOW_BOX_LOCATION)) {
                const newMarker = new this.google.maps.Marker({
                    position: box.position,
                    map: this.mapApi,
                    icon: 'assets/images/icons/logo-virtual-klein.gif',
                    label: {
                        text: box.value.toString(),
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#555555'
                    }
                });
                newMarker.addListener('click', (e) => {
                    this.showBoxInDrawer(box, newMarker);
                });
                newMarker.id = box.ref.id;
                box.marker = newMarker;
            }
            this.objects[box.ref.id] = box;
        },
        markPhysicalBox(box) {
            if (this.objects[box.ref.id] && this.objects[box.ref.id].marker) {
                this.objects[box.ref.id].marker.setMap(null);
            }
            if (this.displayBoxes && this.hasPermission(permissions.SHOW_BOX_LOCATION)) {
                const newMarker = new this.google.maps.Marker({
                    position: box.position,
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
                    this.showBoxInDrawer(box, newMarker);
                });
                newMarker.id = box.ref.id;
                box.marker = newMarker;
            }
            this.objects[box.ref.id] = box;
        },
        markFoundBox(box) {
            if (this.objects[box.id] && this.objects[box.id].marker) {
                this.objects[box.id].marker.setMap(null);
            }
            if (this.displayFoundBoxes && this.hasPermission(permissions.SHOW_FOUND_BOX)) {
                const newMarker = new this.google.maps.Marker({
                    position: box.position,
                    map: this.mapApi,
                    icon: 'assets/images/icons/logo-found-klein.gif'
                });
                newMarker.addListener('click', (e) => {
                    this.objects[box.id].ref.get().then(newBox => {
                        this.mode = modes.EDIT_BOX;
                        this.$store.dispatch('drawer/setTitle', 'View box');
                        this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                        this.$store.dispatch('box/fetchHintsForBox', newBox.id).then(() => {
                            const newBoxData = newBox.data();
                            newBoxData.editBoxMarker = newMarker;
                            newBoxData.boxHints = this.$store.getters['box/hintsForBox'];
                            newBoxData.id = newBox.id;
                            newBoxData.foundBy.get().then(foundBy => {
                                newBoxData.foundByUser = foundBy.data().username;
                                this.$store.dispatch('drawer/setData', newBoxData);
                                EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                            });
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
            if (this.displayHints && this.hasPermission(permissions.SHOW_HINT)) {
                const newMarker = new this.google.maps.Circle({
                    center: hint.position,
                    radius: hint.distanceRange,
                    fillColor: '#1976d2',
                    strokeWidth: 0,
                    fillOpacity: 0.5,
                    map: this.mapApi
                });
                newMarker.addListener('click', () => {
                    this.showBoxInDrawer(this.objects[hint.forBox]);
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
                console.log(mapObject.objectType);
                switch (mapObject.objectType) {
                    case mapObjectTypes.USER:
                        this.markUser(mapObject);
                        break;
                    case mapObjectTypes.VIRTUAL_BOX:
                        this.markVirtualBox(mapObject);
                        break;
                    case mapObjectTypes.PHYSICAL_BOX:
                        this.markPhysicalBox(mapObject);
                        break;
                    case mapObjectTypes.HINT:
                        this.markHint(mapObject);
                        break;
                    case mapObjectTypes.FOUND_VIRTUAL_BOX:
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
        showBoxInDrawer(box, marker = null) {
            if (this.hasPermission(permissions.SHOW_BOX)) {
                box.ref.get().then(boxObject => {
                    const newBox = Object.assign({}, boxObject.data(), this.objects[box.id]);
                    this.mode = modes.EDIT_BOX;
                    this.$store.dispatch('drawer/setTitle', 'Edit box');
                    this.$store.dispatch('drawer/setComponent', 'map-box-drawer');
                    this.$store.dispatch('box/fetchHintsForBox', newBox.id).then(() => {
                        if (marker) {
                            newBox.editBoxMarker = marker;
                        }
                        newBox.boxHints = this.$store.getters['box/hintsForBox'];
                        newBox.foundBy = null;
                        newBox.foundAt = null;
                        newBox.foundByUser = null;
                        if (!newBox.images) {
                            newBox.images= [];
                        }
                        console.log(newBox);
                        this.$store.dispatch('drawer/setData', newBox);
                        EventBus.$emit(Events.SHOW_CONTENT_IN_DRAWER);
                    });
                });
            }
        },
        updateValuesInMap() {
            const bounds = this.mapApi.getBounds();
            const value = this.mapObjects
                .filter(mapObject => mapObject.objectType === mapObjectTypes.VIRTUAL_BOX)
                .filter(mapObject => bounds.contains(mapObject.position))
                .reduce((acc, val) => {
                    acc += parseInt(val.value);
                    return acc;
                }, 0);
            this.valuesInMap = value;
        },
        updateGeoQuery(force = false) {
            this.$store.dispatch('map/updateGeoQuery', {
                center: this.mapApi.getCenter(),
                zoom: this.mapApi.getZoom(),
                bounds: this.mapApi.getBounds(),
                force: force
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
        },
        assignNewBoxValue() {
            const bounds = this.mapApi.getBounds();
            this.mapObjects
                .filter(mapObject => mapObject.objectType === mapObjectTypes.VIRTUAL_BOX)
                .filter(mapObject => bounds.contains(mapObject.position))
                .forEach(box => {
                    this.$store.dispatch('box/updateBox', { id: box.id, value: this.valueEditField });
                });
            this.showValuePrompt = false;
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
                this.boxReferences = this.mapObjects.filter(mapObject => mapObject.objectType === mapObjectTypes.VIRTUAL_BOX);
                this.sortBoxReferences({ lat: center.lat(), lng: center.lng() });
                this.simulationItems = this.boxReferences.slice(0, 5);
                this.simulationListener = this.mapApi.addListener('mousemove', e => {
                    if (Date.now() - lastBoxSorting > 500) {
                        lastBoxSorting = Date.now();
                        this.sortBoxReferences({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                        const simulationItems = [];
                        const promises = [];
                        for (let i = 0, max = this.boxReferences.length >= 5 ? 5 : this.boxReferences.length; i < max; i++) {
                            this.boxReferences[i] = Object.assign(this.boxReferences[i], { distance: Math.round(this.distancesToPoint[this.boxReferences[i].id]) });
                            if (!this.boxReferences[i].title) {
                                promises.push(this.boxReferences[i].ref.get().then(boxEntry => {
                                    const boxEntryData = boxEntry.data();
                                    if (!boxEntryData.position.lat) {
                                        boxEntryData.position = {
                                            lat: boxEntryData.position.latitude,
                                            lng: boxEntryData.position.longitude
                                        };
                                    }
                                    this.boxReferences[i] = Object.assign({}, this.boxReferences[i], boxEntryData);
                                    simulationItems[i] = this.boxReferences[i];
                                }));
                            } else {
                                simulationItems[i] = this.boxReferences[i];
                            }
                        }
                        Promise.all(promises).then(() => {
                            this.simulationItems = simulationItems;
                        });
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
                this.updateGeoQuery(true);
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
