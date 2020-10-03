"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCloudMessageByRegistrationToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const locker_firebase_json_1 = __importDefault(require("../.private/locker-firebase.json"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(locker_firebase_json_1.default)
});
function sendCloudMessageByRegistrationToken(value, registrationToken) {
    var message = {
        data: { ...value },
        token: registrationToken
    };
    firebase_admin_1.default.messaging().send(message)
        .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
        .catch((error) => {
        console.log('Error sending message:', error);
    });
}
exports.sendCloudMessageByRegistrationToken = sendCloudMessageByRegistrationToken;
