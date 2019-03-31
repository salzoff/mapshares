let updateInterval;

const startLocationUpdater = (store) => {
    if (navigator['geolocation']) {
        updateInterval = setInterval(() => {
            if (navigator['geolocation']) {
                navigator.geolocation.getCurrentPosition(position => {
                    store.dispatch('user/updateUserPosition', { lat: position.coords.latitude, lng: position.coords.longitude });
                });
            }
        }, 120000);
        navigator.geolocation.getCurrentPosition(position => {
            store.dispatch('user/updateUserPosition', { lat: position.coords.latitude, lng: position.coords.longitude });
        });
    }
};

const stopLocationUpdater = () => {
    clearInterval(updateInterval);
};

export {
    startLocationUpdater,
    stopLocationUpdater
};
