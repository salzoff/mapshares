import firebase from 'firebase';
import { GeoFirestore } from 'geofirestore';

const firestore = firebase.firestore();
const geoFirestore = new GeoFirestore(firestore);
const geoCollection = geoFirestore.collection('geoLocation');

const updateUserLocationInGeoLocation = (user) => {
    console.log('updateUser', user);
    return new Promise((resolve, reject) => {
        return geoCollection.doc(user.id).set({
            coordinates: user.lastLocation,
            coordinatesAt: user.lastLocationAt,
            objectType: 1,
            ref: user.ref
        })
            .then(() => {
                console.log('success');
                resolve();
            })
            .catch(e => {
                reject(e);
            });
    });
};

const updateBoxInGeoLocation = boxRef => {
    console.log('update ox', boxRef);
    return new Promise((resolve, reject) => {
        boxRef.get().then(box => {
            const data = box.data();
            return geoCollection.doc(boxRef.id).set({
                coordinates: data.position,
                objectType: 2,
                ref: boxRef
            }).then(() => {
                resolve();
            }).catch(e => {
                reject(e);
            });
        });
    });
};

const updateBoxHintsInGeoLocation = boxId => {
    const boxDocument = firestore.collection('box').doc(boxId);
    const hintCollection = boxDocument.collection('hints').where('type', '==', 1).orderBy('visibleFrom');
    let now = Date.now();
    console.log(hintCollection);
    hintCollection.get().then(hints => {
        let currentHint = null;
        let nextHint = null;
        let previousHint = null;
        const promises = [];
        hints.forEach(hint => {
            if (hint.data().visibleFrom.toDate().getTime() <= now) {
                currentHint = hint;
            } else if (nextHint === null) {
                nextHint = hint;
            }
            promises.push(geoCollection.doc(hint.id + 'hint').get().then(result => {
                if (result.exists) {
                    previousHint = result;
                }
            }));
        });
        console.log(previousHint ? previousHint.id : 'Null');
        console.log(currentHint.id);
        Promise.all(promises).then(function() {
            if (previousHint && previousHint.id === currentHint.id + 'hint') {
                return;
            }
            if (currentHint) {
                console.log(currentHint);
                console.log(previousHint);
                const data = currentHint.data();
                const newHint = {
                    coordinates: data.position,
                    distanceRange: data.distanceRange,
                    objectType: 3,
                    forBox: boxId,
                    ref: currentHint.ref
                };
                if (nextHint) {
                    newHint.visibleUntil = nextHint.data().visibleFrom;
                }
                geoFirestore.collection('geoLocation').doc(currentHint.id + 'hint').set(newHint);
                if (previousHint) {
                    deleteBoxHintInGeoLocation(previousHint.id);
                }
            }
        });
    });
};

const deleteBoxHintInGeoLocation = id => {
    if (!id.endsWith('hint')) {
        id += 'hint';
    }
    return geoCollection.doc(id).delete();
};

const deleteBoxInGeoLocation = id => {
    return geoCollection.doc(id).delete();
};

export {
    updateUserLocationInGeoLocation,
    updateBoxInGeoLocation,
    deleteBoxInGeoLocation,
    updateBoxHintsInGeoLocation,
    deleteBoxHintInGeoLocation
};
