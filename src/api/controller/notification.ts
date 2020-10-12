//This is a project for orders
import {createPusher, pushPusherMessage} from "../../module/pusher";
import {mockResponseApi} from "./_genericapi";
import {PUSHER} from "../../module/const";
import {userNotifier} from "../../module/notification";
import {EnumOrderStatus, EnumNotificationType} from "../../definition/enum";
import {T_ORDER_CONTACT_TYPE} from "../../definition/type";

const notification = (function() {

  function initializePusher() {
    const {PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CHANNEL_NAME_TWICE, PUSHER_CLUSTER_TWICE} = process.env;
    return createPusher(PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CLUSTER_TWICE);
  }

  const pusher = initializePusher();

  return {
    notifyOrderEvent: function(req, res) {
      switch(req.body.status) {
        case EnumOrderStatus.ORDER_PLACED:
          pushPusherMessage(pusher, PUSHER.orderEvent, JSON.stringify(req.body));
          break;
        default:
          const {order_id, status, contact_type, contact_info} = req.body;
          const _contactType = contact_type as EnumNotificationType;
          userNotifier(req.params.partnerid, order_id, status, _contactType, contact_info);
          break;
      }

      res.json({"status": "ok"})
    },
    notifyLockEvent: function(req, res) {
      pushPusherMessage(pusher, PUSHER.lockEvent, JSON.stringify(req.body));
      res.json({"status": "ok"})
    }
  }
})();

export default notification;
