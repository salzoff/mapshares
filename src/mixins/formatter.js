import moment from 'moment';
export default {
    methods: {
        formatDateTime (dateTime) {
            return moment(dateTime).format('lll');
        },
        formatDate (dateTime) {
            return moment(dateTime).format('ll');
        }
    }
};
