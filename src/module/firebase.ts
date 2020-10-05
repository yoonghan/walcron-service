import admin from 'firebase-admin'
import serviceAccount from '../../.data/locker-firebase.json'

admin.initializeApp({
  credential: admin.credential.cert((serviceAccount as any))
});

export function sendCloudMessageByRegistrationToken(value:any, registrationToken:string, title:string, body:string) {
  var message = {
    data: {...value},
    notification: {
      title: title,
      body: body
    },
    webpush: {
      fcmOptions: {
        link: "https://app.walcron.com/locker"
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
