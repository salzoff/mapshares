<template>
    <div>
        <v-text-field
            :label="label"
            @click="pickFile"
            prepend-icon="attach_file"
            v-model="fileName"
        />
        <input
            type="file"
            style="display: none"
            ref="fileInput"
            :accept="accept"
            @change="onFilePicked"
        />
    </div>
</template>

<script>
export default {
    name: 'common-file-input',
    props: {
        label: {
            type: String,
            default: 'Select file'
        },
        accept: {
            type: String,
            default: '*/*'
        }
    },
    data() {
        return {
            file: null,
            fileName: ''
        };
    },
    methods: {
        pickFile() {
            this.$refs.fileInput.click();
        },
        onFilePicked(e) {
            const files = e.target.files;
            if (files[0] !== undefined) {
                this.fileName = files[0].name;
                if (this.fileName.lastIndexOf('.') <= 0) {
                    return;
                }
                const fr = new FileReader();
                fr.readAsDataURL(files[0]);
                fr.addEventListener('load', (e) => {
                    this.file = files[0]; // this is an image file that can be sent to server...
                    this.$emit('input', this.file);
                });
            } else {
                this.fileName = '';
                this.file = '';
            }
        },
        reset() {
            this.file = null;
            this.fileName = '';
        }
    }
};
</script>
