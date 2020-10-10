//This is a project for lockers
import publishsubscribe from "./publishsubscribe";
import persistance from "./persistance";
import order from "./order";
import {mockResponseApi} from "./_genericapi";
import {EnumLockStatus} from "../../definition/enum";

const locker = {
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
  },
  getPin: async function(req, res) {
    const orderId = req.body.order_id;
    const partnerId = req.body.partner_id;
    const userid= req.params.userid;
    const origin = req.params.env;

    const unlockReq = {
      body: {
        origin: origin,
        order_id: orderId
      },
      params: {
        partnerid: partnerId
      }
    }

    const lockResponse = mockResponseApi();
    await persistance.getLockerInformation(unlockReq, lockResponse);
    const lockResponseInJson = lockResponse.getJson();
    if(lockResponseInJson.info) {
      res.json({'status': 'ok', 'info': lockResponseInJson.info})
    }
    else {
      res.status(400).json({'status': 'fail'})
    }
  },
  triggerUnlock: async function(req, res) {
    const orderId = req.body.order_id;
    const partnerId = req.body.partner_id;
    const pin = req.body.pin;
    const userid= req.params.userid;
    const origin = req.params.env;

    const unlockReq = {
      body: {
        origin: origin,
        order_id: orderId
      },
      params: {
        partnerid: partnerId
      }
    }

    const orderInformationResponse = mockResponseApi();
    await persistance.getOrderInformation(unlockReq, orderInformationResponse);
    const orderInformationResponseInJson = orderInformationResponse.getJson();

    if(
      orderInformationResponseInJson.info.contact_type === 'Representative'
      && orderInformationResponseInJson.info.contact_info === userid) {
        const lockResponse = mockResponseApi();
        await persistance.getLockerInformation(unlockReq, lockResponse);
        const lockResponseInJson = lockResponse.getJson();
        if(lockResponseInJson.info && lockResponseInJson.info.pin === pin) {
          const lockReq = {
            body: {
              origin: origin,
              order_id: orderId,
              locker_id: lockResponseInJson.info.locker_id,
              state: EnumLockStatus.UNLOCK
            },
            params: {
              partnerid: partnerId,
              businesspartnerid: lockResponseInJson.info.business_partner_id
            }
          }
          publishsubscribe.writeLock(lockReq, mockResponseApi());
          res.json({'status': 'ok'})
        }
        else {
          res.status(401).json({'status': 'fail'});
        }
    }
    else {
      res.status(400).json({'status': 'fail'});
    }
  },
  trigger: async function(req, res) {
    const partnerId = req.params.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const lockReq = {
      body: {
        origin: req.body.origin,
        order_id: req.body.order_id,
        locker_id: req.body.locker_id,
        state: req.body.state
      },
      params: {
        partnerid: partnerId,
        businesspartnerid: businessPartnerId
      }
    }

    const orderReq = {
      body: {
        origin: req.body.origin,
        order_id: req.body.order_id
      },
      params: {
        partnerid: partnerId,
        businesspartnerid: businessPartnerId
      }
    }

    publishsubscribe.writeLock(lockReq, mockResponseApi());
    if(req.body.state === EnumLockStatus.LOCK) {
      order.readyOrder(orderReq, mockResponseApi());
    }
    else {
      order.unreadyOrder(orderReq, mockResponseApi());
    }

    res.json({'status': 'initiated lock'});
  },
  updateUserNotification: async function(req, res) {
    const userReq = {
      body: {
        token: req.body.push_notification_token
      },
      params: {
        userid: req.params.userid
      }
    }

    try {
      await persistance.updateUserToken(userReq, mockResponseApi());
      res.json({'status': 'ok'})
    }
    catch(err) {
      res.status(400).json({'status': 'fail'});
    }
  },
  getLockState: async function(req, res) {
    const lockReq = {
      params: {
        partnerid: req.params.partnerid,
        businesspartnerid: req.params.businesspartnerid
      }
    }
    try {
      const response = mockResponseApi();
      await persistance.getLockStatus(lockReq, response);
      res.json({'status': 'ok', 'locks': response.getJson().locks })
    }
    catch(err) {
      res.status(400).json({'status': 'fail'});
    }

  }
};

export default locker;
