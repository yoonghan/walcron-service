import admin from 'firebase-admin'
import serviceAccount from '../../.data/locker-firebase.json'

const firebase = (function() {
  function initialize() {
    admin.initializeApp({
      credential: admin.credential.cert((serviceAccount as any))
    });
  }

  initialize();

  return {
    sendCloudMessageByRegistrationToken: function(value:any, registrationToken:string, title:string, body:string) {
      var message = {
        data: {...value},
        notification: {
          title: title,
          body: body
        },
        webpush: {
          fcmOptions: {
            link: process.env.NOTIFICATION_OPEN_URL
          }
        },
        token: registrationToken
      };
      admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    }
  }
})();

export default firebase;
