<template>
    <div class="mt-3">
        <v-layout row>
            <v-flex xs12>
                <h3 class="title mb-3">Hints</h3>
            </v-flex>
        </v-layout>
        <v-layout v-if="!boxHints || boxHints.length === 0" row class="mt-2 pb-3">
            <v-flex xs12>
                <v-card>
                    <v-card-text>
                        <h3 class="subheading">
                            No hints configured yet
                        </h3>
                    </v-card-text>
                    <v-btn
                        color="primary"
                        @click="addBoxHint"
                        small
                        dark
                        absolute
                        bottom
                        right
                        fab
                    >
                        <v-icon>add</v-icon>
                    </v-btn>
                </v-card>
            </v-flex>
        </v-layout>
        <template v-else>
            <v-layout v-for="(hint, index) in boxHints" :key="hint.id">
                <v-flex xs12>
                    <v-card>
                        <v-card-text>
                            <v-layout class="body-2" row v-if="!hint.editMode">
                                <template v-if="hint.type === hintTypeLocation">
                                    <v-flex xs2>Location</v-flex>
                                    <v-flex xs2>
                                        <template v-if="hint.value.distanceRange === 0">Exact</template>
                                        <template v-else>{{ hint.value.distanceRange }} m</template>
                                    </v-flex>
                                    <v-flex xs5 xs4 class="text-xs-right">{{ formatDate(hint.visibleFrom) }}</v-flex>
                                    <v-flex xs3 class="text-xs-right">
                                        <v-btn v-if="hasPermission(permissionsEnum.EDIT_HINT) && editable" small icon @click="editBoxHint(hint)"><v-icon>edit</v-icon></v-btn>
                                        <v-btn v-if="hasPermission(permissionsEnum.DELETE_HINT) && editable" small icon @click="deleteBoxHint(hint, index)"><v-icon>clear</v-icon></v-btn>
                                    </v-flex>
                                </template>
                                <template v-else-if="hint.type === hintTypeText">
                                    <v-flex xs2>Text</v-flex>
                                    <v-flex xs2>
                                        <v-tooltip bottom>
                                            <template v-slot:activator="{ on }">
                                                <span class="hint-text"  v-on="on">{{ hint.value.text }}</span>
                                            </template>
                                            <span>{{ hint.value.text }}</span>
                                        </v-tooltip>
                                    </v-flex>
                                    <v-flex xs5 xs4 class="text-xs-right">{{ formatDate(hint.visibleFrom) }}</v-flex>
                                    <v-flex xs3 class="text-xs-right">
                                        <v-btn v-if="hasPermission(permissionsEnum.EDIT_HINT) && editable" small icon @click="editBoxHint(hint)"><v-icon>edit</v-icon></v-btn>
                                        <v-btn v-if="hasPermission(permissionsEnum.DELETE_HINT) && editable" small icon @click="deleteBoxHint(hint, index)"><v-icon>clear</v-icon></v-btn>
                                    </v-flex>
                                </template>
                                <template v-else-if="hint.type === hintTypeImage">
                                    <v-flex xs2>Image</v-flex>
                                    <v-flex xs3 @click="showImage(hint)">
                                        <v-tooltip bottom>
                                            <template v-slot:activator="{ on }">
                                                <span class="hint-image" v-on="on">{{ hint.fileName }}</span>
                                            </template>
                                            <span>{{ hint.fileName }}</span>
                                        </v-tooltip>
                                        <v-btn icon small><v-icon>zoom_in</v-icon></v-btn>
                                        <light-box :images="hintLightBoxImages" ref="hintLightBox" />
                                    </v-flex>
                                    <v-flex xs4 class="text-xs-right">{{ formatDate(hint.visibleFrom) }}</v-flex>
                                    <v-flex xs3 class="text-xs-right">
                                        <v-btn v-if="hasPermission(permissionsEnum.EDIT_HINT) && editable" small icon @click="editBoxHint(hint)"><v-icon>edit</v-icon></v-btn>
                                        <v-btn v-if="hasPermission(permissionsEnum.DELETE_HINT) && editable" small icon @click="deleteBoxHint(hint, index)"><v-icon>clear</v-icon></v-btn>
                                    </v-flex>
                                </template>
                            </v-layout>
                            <template v-else>
                                <v-layout row v-if="hint.type === hintTypeLocation">
                                    <v-flex xs3>
                                        <v-select
                                            :items="hintTypeItems"
                                            label="Hint type"
                                            icon-text="text"
                                            icon-value="value"
                                            v-model="currentHint.type"
                                        />
                                    </v-flex>
                                    <v-flex xs3>
                                        <v-select
                                            :items="hintLocationRangeItems"
                                            label="Range"
                                            icon-text="text"
                                            icon-value="value"
                                            v-model="currentHint.value.distanceRange"
                                            @change="showLocationRange"
                                        />
                                    </v-flex>
                                    <v-flex xs4>
                                        <v-menu
                                            ref="menu"
                                            v-model="menu"
                                            :close-on-content-click="false"
                                            :nudge-right="40"
                                            :return-value.sync="dateString"
                                            lazy
                                            transition="scale-transition"
                                            offset-y
                                            full-width
                                            min-width="290px"
                                            v-if="currentHint.visibleFrom"
                                        >
                                            <template v-slot:activator="{ on }">
                                                <v-text-field
                                                    label="Visible from"
                                                    prepend-icon="event"
                                                    readonly
                                                    v-on="on"
                                                    v-model="formattedDate"
                                               ></v-text-field>
                                            </template>
                                            <v-date-picker v-model="dateString" no-title scrollable>
                                                <v-spacer></v-spacer>
                                                <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                                                <v-btn flat color="primary" @click="$refs.menu[0].save(dateString)">OK</v-btn>
                                            </v-date-picker>
                                        </v-menu>
                                    </v-flex>
                                    <v-flex xs2>
                                        <v-btn small icon @click="saveBoxHint(hint)" class="mt-4"><v-icon>done</v-icon></v-btn>
                                    </v-flex>
                                </v-layout>
                                <template v-else-if="hint.type === hintTypeText">
                                    <v-layout row>
                                        <v-flex xs3>
                                            <v-select
                                                :items="hintTypeItems"
                                                label="Hint type"
                                                icon-text="text"
                                                icon-value="value"
                                                v-model="currentHint.type"
                                            />
                                        </v-flex>
                                        <v-flex xs5 offset-xs3>
                                            <v-menu
                                                ref="menu"
                                                v-model="menu"
                                                :close-on-content-click="false"
                                                :nudge-right="40"
                                                :return-value.sync="dateString"
                                                lazy
                                                transition="scale-transition"
                                                offset-y
                                                full-width
                                                min-width="290px"
                                                v-if="currentHint.visibleFrom"
                                            >
                                                <template v-slot:activator="{ on }">
                                                    <v-text-field
                                                        label="Visible from"
                                                        prepend-icon="event"
                                                        readonly
                                                        v-on="on"
                                                        v-model="formattedDate"
                                                    ></v-text-field>
                                                </template>
                                                <v-date-picker v-model="dateString" no-title scrollable>
                                                    <v-spacer></v-spacer>
                                                    <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                                                    <v-btn flat color="primary" @click="$refs.menu[0].save(dateString)">OK</v-btn>
                                                </v-date-picker>
                                            </v-menu>
                                        </v-flex>
                                        <v-flex xs1>
                                            <v-btn small icon @click="saveBoxHint(hint)"><v-icon>done</v-icon></v-btn>
                                        </v-flex>
                                    </v-layout>
                                    <v-layout row>
                                        <v-flex xs12 class="full-width">
                                            <v-textarea v-model="currentHint.value.text" label="Text"></v-textarea>
                                        </v-flex>
                                    </v-layout>
                                </template>
                                <template v-else-if="hint.type === hintTypeImage">
                                    <v-layout row>
                                        <v-flex xs3>
                                            <v-select
                                                    :items="hintTypeItems"
                                                    label="Hint type"
                                                    icon-text="text"
                                                    icon-value="value"
                                                    v-model="currentHint.type"
                                            />
                                        </v-flex>
                                        <v-flex xs5 offset-xs3>
                                            <v-menu
                                                    ref="menu"
                                                    v-model="menu"
                                                    :close-on-content-click="false"
                                                    :nudge-right="40"
                                                    :return-value.sync="dateString"
                                                    lazy
                                                    transition="scale-transition"
                                                    offset-y
                                                    full-width
                                                    min-width="290px"
                                                    v-if="currentHint.visibleFrom"
                                            >
                                                <template v-slot:activator="{ on }">
                                                    <v-text-field
                                                            label="Visible from"
                                                            prepend-icon="event"
                                                            readonly
                                                            v-on="on"
                                                            v-model="formattedDate"
                                                    ></v-text-field>
                                                </template>
                                                <v-date-picker v-model="dateString" no-title scrollable>
                                                    <v-spacer></v-spacer>
                                                    <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                                                    <v-btn flat color="primary" @click="$refs.menu[0].save(dateString)">OK</v-btn>
                                                </v-date-picker>
                                            </v-menu>
                                        </v-flex>
                                        <v-flex xs1>
                                            <v-btn small icon @click="saveBoxHint(hint)"><v-icon>done</v-icon></v-btn>
                                        </v-flex>
                                    </v-layout>
                                    <v-layout row>
                                        <v-flex xs12>
                                            <file-input ref="imageInput" v-model="currentHint.image" label="Select new image..." accept="image/*" />
                                        </v-flex>
                                    </v-layout>
                                </template>
                            </template>
                        </v-card-text>
                        <v-btn
                            v-if="index === boxHints.length - 1 && hasPermission(permissionsEnum.ADD_HINT) && editable"
                            color="primary"
                            @click="addBoxHint"
                            small
                            dark
                            absolute
                            bottom
                            right
                            fab
                        >
                            <v-icon>add</v-icon>
                        </v-btn>
                    </v-card>
                </v-flex>
            </v-layout>
        </template>
        <v-layout row class="mt-2">
            <v-btn v-if="(hasPermission(permissionsEnum.ADD_HINT) || hasPermission(permissionsEnum.EDIT_HINT)) && editable" color="primary" @click="saveBoxHints" class="ml-0" :disabled="!$v.$anyDirty  || $v.$anyError || (currentHint && currentHint.editMode)">Save hints</v-btn>
        </v-layout>
    </div>
</template>

<script>
import { getRandomPointWithinDistance } from '@/helper/location';
import { permissions, boxHintTypes } from '@/helper/enums';
import { storage } from '@/firebaseConfig';
import FileInput from '@/components/common/FileInput.vue';
import LightBox from 'vue-image-lightbox';
import moment from 'moment';

export default {
    name: 'map-box-hints',
    props: {
        hints: {
            type: Array,
            required: true
        },
        editBoxMarker: {
            type: Object
        },
        mapApi: {
            type: Object,
            default: () => {}
        },
        google: {
            type: Object,
            default: () => {}
        },
        editable: {
            type: Boolean,
            default: true
        }
    },
    components: { FileInput, LightBox },
    computed: {
        hintTypeItems() {
            return [
                { text: 'Location', value: boxHintTypes.LOCATION },
                { text: 'Text', value: boxHintTypes.TEXT },
                { text: 'Image', value: boxHintTypes.IMAGE }
            ];
        },
        dateString: {
            get() {
                return this.currentHint.visibleFrom.toISOString();
            },
            set(dateString) {
                this.currentHint.visibleFrom = moment(dateString).toDate();
            }
        },
        formattedDate() {
            return this.formatDate(this.currentHint.visibleFrom);
        },
        hintTypeLocation() {
            return boxHintTypes.LOCATION;
        },
        hintTypeText() {
            return boxHintTypes.TEXT;
        },
        hintTypeImage() {
            return boxHintTypes.IMAGE;
        },
        hintLocationRangeItems() {
            return [
                { text: 'Exact', value: 0 },
                { text: '50 m', value: 50 },
                { text: '75 m', value: 75 },
                { text: '100 m', value: 100 },
                { text: '150 m', value: 150 },
                { text: '200 m', value: 200 },
                { text: '250 m', value: 250 },
                { text: '500 m', value: 500 },
                { text: '1000 m', value: 1000 },
                { text: '2000 m', value: 2000 },
                { text: '3000 m', value: 3000 }
            ];
        },
        permissionsEnum() {
            return permissions;
        }
    },
    data() {
        return {
            boxHints: [],
            currentHint: null,
            rangeCircle: null,
            menu: false,
            enlargeImage: false,
            currentImageUrl: '',
            hintLightBoxImages: []
        };
    },
    methods: {
        saveBoxHints() {
            this.$emit('saveBoxHints', this.boxHints);
        },
        addBoxHint() {
            const boxHints = this.boxHints;
            boxHints.push({
                type: boxHintTypes.LOCATION,
                value: {
                    distanceRange: 0,
                    position: {
                        lat: this.editBoxMarker.position.lat(),
                        lng: this.editBoxMarker.position.lng()
                    }
                },
                visibleFrom: new Date(),
                editMode: true
            });
            this.$v.$reset();
            this.boxHints = boxHints;
            this.currentHint = this.boxHints[this.boxHints.length - 1];
        },
        editBoxHint(boxHint) {
            if (this.currentHint) {
                delete this.currentHint.editMode;
            }
            this.$set(boxHint, 'editMode', true);
            this.$set(this, 'currentHint', boxHint);
        },
        deleteBoxHint(boxHint, index) {
            this.$emit('deleteBoxHint', boxHint, index);
        },
        saveBoxHint(boxHint) {
            delete this.currentHint.editMode;
            if (boxHint.type === boxHintTypes.IMAGE) {
                boxHint.fileName = boxHint.image.name;
            }
            this.currentHint = null;
            this.$v.$touch();
        },
        showLocationRange(range, location = null) {
            let rangeCircle;
            this.removeOldRangeCircle();
            if (range > 0) {
                const newPoint = location === null
                    ? getRandomPointWithinDistance(this.currentHint.value.position.lat, this.currentHint.value.position.lng, range)
                    : location;
                rangeCircle = new this.google.maps.Circle({
                    center: newPoint,
                    radius: range,
                    fillColor: '#1976d2',
                    strokeWidth: 0,
                    fillOpacity: 0.5,
                    map: this.mapApi
                });
            } else {
                const newPoint = location === null
                    ? this.currentHint.value.position
                    : location;
                rangeCircle = new this.google.maps.Marker({
                    position: newPoint,
                    map: this.mapApi
                });
            }
            this.rangeCircle = rangeCircle;
        },
        removeOldRangeCircle() {
            if (this.rangeCircle) {
                this.rangeCircle.setMap(null);
                this.rangeCircle = null;
            }
        },
        saveDate(date) {
            this.currentHint.visibleFrom = moment(this.dateString).toDate();
        },
        showImage(hint) {
            this.createFileUrl('boxHintImages/' + hint.id).then(url => {
                this.hintLightBoxImages = [{ src: url }];
                this.$refs.hintLightBox[0].showImage(0);
            });
        }
    },
    watch: {
        hints: {
            deep: true,
            handler: function(boxHints) {
                this.boxHints = boxHints;
                this.removeOldRangeCircle();
                this.$v.$reset();
            }
        },
        currentHint: {
            deep: true,
            handler: function(hint) {
                this.removeOldRangeCircle();
                if (hint && typeof hint.value.distanceRange !== 'undefined' && hint.value.position) {
                    this.showLocationRange(hint.value.distanceRange, hint.value.position);
                }
                this.currentImageUrl = '';
                if (hint.type === boxHintTypes.IMAGE && hint.id) {
                    this.createImageUrl(hint).then(url => {
                        this.currentImageUrl = url;
                    });
                }
            }
        }
    },
    mounted() {
        this.boxHints = this.hints;
        this.$v.$reset();
    },
    validations: {
        boxHints: {
            required: true,
            minLength: 1
        }
    }
};
</script>

<style scoped lang="scss">
    .hint-text {
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
    }
    .hint-image {
        max-width: calc(100% - 44px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
    }
    .full-width {
        width: 100%;
    }

    .hover-image-container {
        text-align: center;
        position: relative;
        display: block;
    }

    .hover-image-large {
        z-index: 1030;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        padding: 5px;
        border: 1px solid #ccc;
        background-color: #fff;
        transition: all .3s ease-out 0s;
    }
    .image-large-enter, .image-large-leave-to {
        opacity: 0;
        transform: translateX(-50%) translateY(-50%) scale(0.5);
    }
    .image-large-enter-to {
        opacity: 1;
        transform: translateX(-50%) translateY(-50%) scale(1);
    }
</style>
