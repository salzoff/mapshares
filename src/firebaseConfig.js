import firebase from 'firebase';
import 'firebase/firestore';
import 'firebase/functions';

// firebase init goes here
const config = {
    apiKey: 'AIzaSyDqHeavSoFvMB0VtZDBMfqNwC1VLW7A2PY',
    authDomain: 'lively-aloe-233515.firebaseapp.com',
    databaseURL: 'https://lively-aloe-233515.firebaseio.com',
    projectId: 'lively-aloe-233515',
    storageBucket: 'lively-aloe-233515.appspot.com',
    messagingSenderId: '606237866833'
};
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
