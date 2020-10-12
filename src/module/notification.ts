import {sendEmail} from './gmail';
import firebase from './firebase';
import {EnumOrderStatus, EnumNotificationType} from '../definition/enum';
import {T_ORDER_CONTACT_TYPE} from '../definition/type';

const _emphasis = (type:EnumNotificationType, msg:string) => {
  switch(type) {
    case EnumNotificationType.EMAIL:
      return `<em>${msg}</em>`;
    default:
      return msg;
  }
}

const _genMessage = (type:EnumNotificationType, orderId:string, status:EnumOrderStatus) => {
  switch(status) {
    case EnumOrderStatus.READY:
      return `Your ${_emphasis(type, orderId)} is ready for pick up, please go to the respective counter to pick it up.`
    case EnumOrderStatus.TAKEN:
      return `Your ${_emphasis(type, orderId)} is taken.`
    case EnumOrderStatus.UNREADY:
      return `Apologies, your ${_emphasis(type, orderId)} that was supposed to be picked up is currently cancelled.`
  }
}

export const userNotifier = async(partnerId:string, orderId:string, status:EnumOrderStatus, contactType:EnumNotificationType, contactInfo:string) => {
  switch(contactType) {
    case EnumNotificationType.PUSH_NOTIFICATION:
      const pusherMessage = {
        "orderId": orderId,
        "status": status,
        "partnerId": partnerId
      }
      firebase.sendCloudMessageByRegistrationToken(
        pusherMessage, contactInfo,
        `Order ${orderId} is ${status}`,
        _genMessage(EnumNotificationType.PUSH_NOTIFICATION, orderId, status)
      );
      break;
    case EnumNotificationType.EMAIL:
      const subject = `Order ${orderId} is ${status}`;
      const emailMessage = _genMessage(EnumNotificationType.EMAIL, orderId, status);
      const recipientTo = contactInfo;
      sendEmail(process.env.GMAIL_USER_EMAIL , process.env.GMAIL_PASSWORD, recipientTo, subject, emailMessage);
      break;
  }
};
