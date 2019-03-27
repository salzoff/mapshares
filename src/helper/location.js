const getRandomPointWithinDistance = (latitude, longitude, maxDistance) => {
    const movement = movePoint(latitude, longitude, Math.round(Math.random() * maxDistance), Math.round(Math.random() * 360));
    return {
        lat: movement.lat,
        lng: movement.lng
    };
};

const movePoint = (latitude, longitude, distanceInMetres, bearing) => {
    const brngRad = toRadians(bearing);
    const latRad = toRadians(latitude);
    const lonRad = toRadians(longitude);
    const earthRadiusInMetres = 6371000;
    const distFrac = distanceInMetres / earthRadiusInMetres;
    const latitudeResult = Math.asin(Math.sin(latRad) * Math.cos(distFrac) + Math.cos(latRad) * Math.sin(distFrac) * Math.cos(brngRad));
    const a = Math.atan2(Math.sin(brngRad) * Math.sin(distFrac) * Math.cos(latRad), Math.cos(distFrac) - Math.sin(latRad) * Math.sin(latitudeResult));
    const longitudeResult = (lonRad + a + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    return {
        lat: toDegrees(latitudeResult),
        lng: toDegrees(longitudeResult)
    };
};

const toRadians = value => {
    /** Converts numeric degrees to radians */
    return value * (Math.PI / 180);
};

const toDegrees = value => {
    return value / (Math.PI / 180);
};

export {
    movePoint,
    getRandomPointWithinDistance
};
