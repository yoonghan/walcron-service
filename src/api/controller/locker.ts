//This is a project for lockers
import publishsubscribe from "./publishsubscribe";
import persistance from "./persistance";
import order from "./order";
import {mockResponseApi} from "./_genericapi";

const locker = {
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
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
    if(req.body.state === 'lock') {
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
  }
};

export default locker;
