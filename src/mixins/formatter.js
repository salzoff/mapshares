import moment from 'moment';
export default {
    methods: {
        formatDateTime (dateTime) {
            return moment(dateTime).format('lll');
        },
        formatDate (dateTime) {
            return moment(dateTime).format('ll');
        },
        capitalize (text) {
            return text.substring(0, 1).toUpperCase() + text.substring(1);
        }
    }
};
