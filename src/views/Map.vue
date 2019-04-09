<template>
    <map-main></map-main>
</template>
<script>
import MapMain from '@/components/map/Main';
import { EventBus, Events } from '../events';

export default {
    name: 'map-view',
    components: {
        MapMain
    },
    beforeRouteLeave: (from, to, next) => {
        EventBus.$emit(Events.HIDE_CONTENT_IN_DRAWER);
        next();
    }
};
</script>
