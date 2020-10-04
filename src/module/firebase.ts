import admin from 'firebase-admin'

const serviceAccount=JSON.parse(process.env.FIREBASE_CERT);

admin.initializeApp({
  credential: admin.credential.cert((serviceAccount as any))
});

export function sendCloudMessageByRegistrationToken(value:any, registrationToken:string) {
  var message = {
    data: {...value},
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
