import { storage } from '@/firebaseConfig';
export default {
    methods: {
        createFileUrl(file) {
            const fileRef = storage.ref().child(file);
            return fileRef.getDownloadURL().catch(e => {
                console.error(e);
            });
        }
    }
};
