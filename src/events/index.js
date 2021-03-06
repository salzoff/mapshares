import Vue from 'vue';
const EventBus = new Vue();

const Events = {
    SHOW_CONTENT_IN_DRAWER: 'show-content-in-drawer',
    HIDE_CONTENT_IN_DRAWER: 'hide-content-in-drawer',
    MAP_API_LOADED: 'map-api-loaded'
};

export {
    EventBus,
    Events
};
