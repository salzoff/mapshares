export default {
    computed: {
        currentUser() {
            return this.$store.getters['user/currentUser'];
        },
        currentUserProfile() {
            return this.$store.getters['user/userProfile'];
        },
        isAuthenticated() {
            return this.currentUser instanceof Object;
        },
        isFetchingInitialUserProfile() {
            return this.$store.getters['user/isFetchingInitialUserProfile'];
        },
        permissions() {
            return this.currentUserProfile.permissions;
        }
    },
    methods: {
        hasPermission(permission) {
            return this.permissions ? this.permissions.some(userPermission => userPermission === permission) : false;
        }
    }
};
