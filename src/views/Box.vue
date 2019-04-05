<template>
    <v-container>
        <box-details :id="id" />
    </v-container>
</template>

<script>
import BoxDetails from '@/components/box/Details';
export default {
    name: 'box-view',
    components: { BoxDetails },
    props: {
        id: {
            type: String,
            required: true
        }
    }
};
</script>
