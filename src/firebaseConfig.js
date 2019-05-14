import firebase from 'firebase';
import 'firebase/firestore';
import 'firebase/functions';
import config from '../firebaseProjectSettings.json';
// firebase init goes here
firebase.initializeApp(config);

// firebase utils
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const currentUser = auth.currentUser;
const functions = firebase.functions();

// firebase collections
const userProfileCollection = db.collection('userProfile');
const userRolesCollection = db.collection('userRoles');
const boxCollection = db.collection('box');

export {
    db,
    auth,
    storage,
    functions,
    currentUser,
    userProfileCollection,
    userRolesCollection,
    boxCollection
};
