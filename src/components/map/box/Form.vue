<template>
    <v-form class="drawer-boxform" @submit.prevent="submit" @input="onInput()">
        <v-text-field v-model="values.title" label="Title" :error="$v.values.title.$anyError"  @input="onInput()" />
        <v-textarea v-model="values.description" label="Description"  @input="onInput" />
        <v-text-field v-model="values.value" type="number" label="Value" :error="$v.values.value.$anyError" @input="onInput()" />
        <v-layout v-if="!values.foundByUser">
            <v-btn v-if="hasPermission(permissionEnum.EDIT_BOX)" :disabled="!$v.$anyDirty || $v.$anyError" class="ml-0" type="submit" color="primary">Save</v-btn>
            <v-btn v-if="values.id && hasPermission(permissionEnum.DELETE_BOX)" color="warning" @click="deleteBox">Delete</v-btn>
            <v-spacer />
            <v-btn v-if="hasPermission(permissionEnum.FIND_BOX)" justify-right color="success" @click="markAsFound">Mark as found</v-btn>
        </v-layout>
        <v-layout row v-else>
            <v-flex xs3>
                <span class="body-2">Found by</span>
            </v-flex>
            <v-flex xs9>{{ values.foundByUser }}</v-flex>
            <v-flex xs3>
                <span class="body-2">Found at</span>
            </v-flex>
            <v-flex xs9>{{ formatDateTime(values.foundAt.toDate()) }}</v-flex>
        </v-layout>
    </v-form>
</template>

<script>
import { permissions } from '@/helper/enums';
import { required } from 'vuelidate/lib/validators';
import _merge from 'lodash/merge';
export default {
    name: 'map-box-form',
    props: {
        data: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            values: {}
        };
    },
    computed: {
        permissionEnum() {
            return permissions;
        }
    },
    methods: {
        submit() {
            this.$emit('saveBox', this.values);
        },
        deleteBox() {
            this.$emit('deleteBox');
        },
        onInput(e) {
            this.$v.$touch();
        },
        markAsFound() {
            this.$emit('markAsFound');
        }
    },
    watch: {
        data: {
            deep: true,
            handler: function (values) {
                console.log(values);
                this.values = _merge({}, values);
                this.$v.$reset();
            }
        }
    },
    created() {
        this.values = this.data;
        this.$nextTick(() => {
            this.$v.$reset();
        });
    },
    validations: {
        values: {
            title: { required },
            value: { required }
        }
    }
};
</script>
