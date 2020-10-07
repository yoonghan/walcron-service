import {sendEmail} from './gmail';
import firebase from './firebase';
import {EnumOrderStatus} from './airtable';

export const userNotifier = async(partnerId:string, orderId:string, status:EnumOrderStatus, contactType:string, contactInfo:string) => {
  switch(contactType) {
    case 'Push Notification':
      const pusherMessage = {
        "orderId": orderId,
        "status": status,
        "partnerId": partnerId
      }
      firebase.sendCloudMessageByRegistrationToken(pusherMessage, contactInfo, `Order ${orderId} is ${status}`, `Your ${orderId} is ${status} for pick up, please go to the respective counter to pick it up.`);
      break;
    case 'Email':
      const subject = `Order ${orderId} is ${status}`;
      const emailMessage = `Your <em>${orderId}</em> is <em>${status}</em> for pick up, please go to the respective counter to pick it up.`;
      const recipientTo = contactInfo;
      sendEmail(process.env.GMAIL_USER_EMAIL , process.env.GMAIL_PASSWORD, recipientTo, subject, emailMessage);
      break;
  }
};
