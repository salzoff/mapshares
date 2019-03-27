<template>
    <v-form class="drawer-boxform" @submit.prevent="submit" @input="onInput()">
        <v-text-field v-model="values.title" label="Title" :error="$v.values.title.$anyError"  @input="onInput()" />
        <v-textarea v-model="values.description" label="Description"  @input="onInput" />
        <v-text-field v-model="values.value" type="number" label="Value" :error="$v.values.value.$anyError" @input="onInput()" />
        <v-btn :disabled="!$v.$anyDirty || $v.$anyError" class="ml-0" type="submit" color="primary">Save</v-btn>
        <v-btn v-if="values.id" color="warning" @click="deleteBox">Delete</v-btn>
    </v-form>
</template>

<script>
import { required } from 'vuelidate/lib/validators';
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
    methods: {
        submit() {
            this.$emit('saveBox', this.values);
        },
        deleteBox() {
            this.$emit('deleteBox');
        },
        onInput(e) {
            this.$v.$touch();
        }
    },
    watch: {
        data: {
            deep: true,
            handler: function (values) {
                this.values = values;
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
