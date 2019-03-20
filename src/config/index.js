import Vue from 'vue';
import config from './config';

const configPlugin = {
    install: (Vue, pluginConfig) => {
        Vue.prototype.$config = config;
    }
};

Vue.use(configPlugin);

export default configPlugin;
