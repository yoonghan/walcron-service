import {sendEmail} from '../module/gmail';
import {sendCloudMessageByRegistrationToken} from '../module/firebase';
import {EnumOrderStatus} from '../module/airtable';

export const userNotifier = async(airtable:any, partnerId:string, orderId:string, status:EnumOrderStatus, contactType:string, contactInfo:string) => {
  if(contactType === 'Representative') {
    const {email, sms, pushertoken, preference} = await airtable.findRepresentativeInfo(contactInfo);
    contactType = preference;
    switch(preference) {
      case 'Email':
        contactInfo = email;
        break;
      case 'SMS':
        contactInfo = sms;
        break;
      case 'Push Notification':
        contactInfo = pushertoken;
        break;
    }
  }

  switch(contactType) {
    case 'Push Notification':
      const pusherMessage = {
        "orderId": orderId,
        "status": status,
        "partnerId": partnerId
      }
      sendCloudMessageByRegistrationToken(pusherMessage, contactInfo, `Order ${orderId} is ${status}`, `Your ${orderId} is ${status} for pick up, please go to the respective counter to pick it up.`);
      break;
    case 'Email':
      const subject = `Order ${orderId} is ${status}`;
      const emailMessage = `Your <em>${orderId}</em> is <em>${status}</em> for pick up, please go to the respective counter to pick it up.`;
      const recipientTo = contactInfo;
      sendEmail(process.env.GMAIL_USER_EMAIL , process.env.GMAIL_PASSWORD, recipientTo, subject, emailMessage);
      break;
  }
};
