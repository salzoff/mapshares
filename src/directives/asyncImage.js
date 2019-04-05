import Vue from 'vue';
import { storage } from '@/firebaseConfig';

Vue.directive('async-storage-image', {
    bind: (el, binding) => {
        const fileRef = storage.ref().child(binding.value);
        fileRef.getDownloadURL().then(url => {
            el.setAttribute('src', url);
        });
    }
});
