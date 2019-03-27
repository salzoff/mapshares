const admin = require('firebase-admin');
const serviceAccount = require('../../../lively-aloe-233515-firebase-adminsdk-79rqt-63e1723c82.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lively-aloe-233515.firebaseio.com'
});
const firestore = admin.firestore();
const GeoFirestore = require('geofirestore').GeoFirestore;
const geoCollection = new GeoFirestore(firestore).collection('geoLocation');

firestore.collection('userProfile').get().then(entries => {
    entries.forEach(entry => {
        geoCollection.doc(entry.id).get().then(res => {
            if (!res.exists) {
                console.log('user', entry.id);
                const data = entry.data();
                geoCollection.doc(entry.id).set({
                    coordinates: data.lastLocation,
                    coordinatesAt: data.lastLocationAt,
                    objectType: 1,
                    ref: entry.ref
                });
            }
        });
    });
});

const now = Date.now();

firestore.collection('box').get().then(entries => {
    entries.forEach(entry => {
        geoCollection.doc(entry.id).get().then(res => {
            if (!res.exists) {
                const data = entry.data();
                geoCollection.doc(entry.id).set({
                    coordinates: data.position,
                    objectType: 2,
                    ref: entry.ref
                });
            }
        });
        entry.ref.collection('hints')
            .where('type', '==', 1)
            .orderBy('visibleFrom')
            .get().then(hints => {
                let currentHint = null;
                let nextHint = null;
                hints.forEach(hint => {
                    if (hint.data().visibleFrom.toDate().getTime() <= now) {
                        currentHint = hint;
                    } else if (nextHint === null) {
                        nextHint = hint;
                    }
                });
                if (currentHint) {
                    const data = currentHint.data();
                    geoCollection.doc(currentHint.id).get().then(res => {
                        if (!res.exists) {
                            const newEntry = {
                                coordinates: data.position,
                                distanceRange: data.distanceRange,
                                objectType: 3,
                                ref: currentHint.ref
                            };
                            if (nextHint) {
                                newEntry.visibleUntil = nextHint.data().visibleFrom;
                            }
                            geoCollection.doc(currentHint.id).set(newEntry);
                        }
                    });
                }
            });
    });
});

geoCollection.get().then(entries => {
    entries.forEach(entry => {
        const data = entry.data();
        data.ref.get().then(result => {
            if (!result.exists) {
                geoCollection.doc(entry.id).delete();
            }
            return true;
        });
    });
    return true;
});
