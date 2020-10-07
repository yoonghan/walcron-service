//This is a project for orders
import publishsubscribe from "./publishsubscribe";
import persistance from "./persistance";
import {mockResponseApi} from "./_genericapi";

const order = {
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
  },
  unreadyOrder: async function(req, res) {
    const orderId = req.body.order_id;
    const partnerId = req.params.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const orderReq = {
      body: {
        order_id: orderId,
        state: 'Unready'
      },
      params: {
        partnerid: partnerId,
        businesspartnerid: businessPartnerId
      }
    }

    publishsubscribe.writeOrder(orderReq, mockResponseApi());

    res.json({'status': 'unready order'});
  },
  readyOrder: async function(req, res) {
    const orderId = req.body.order_id;
    const partnerId = req.params.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const orderReq = {
      body: {
        order_id: orderId,
        state: 'Ready'
      },
      params: {
        partnerid: partnerId,
        businesspartnerid: businessPartnerId
      }
    }

    publishsubscribe.writeOrder(orderReq, mockResponseApi());

    res.json({'status': 'ready order'});
  },
  placeOrder: async function(req, res) {
    const orderId = req.body.order_id;
    const contactType = req.body.contact_type;
    const contactInfo = req.body.contact_info;
    const partnerId = req.params.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const orderReq = {
      body: {
        order_id: orderId,
        contact_type: contactType,
        contact_info: contactInfo,
        state: 'Order Placed'
      },
      params: {
        partnerid: partnerId,
        businesspartnerid: businessPartnerId
      }
    }

    publishsubscribe.writeOrder(orderReq, mockResponseApi());

    res.json({'status': 'initiated order'});
  },
  getAvailableOrders: async function(req, res) {
    const partnerId = req.params.partnerid;
    const request = {
      params: {
        partnerid: partnerId
      }
    };

    try {
      const response = mockResponseApi();
      await persistance.getAvailableOrders(request, response);
      res.json({'status': 'ok', 'orders': response.getJson().orders });
    } catch(err) {
      res.status(404).json({'status': 'no records'});
    }
  },
  getUserOrders: async function(req, res) {
    const userId = req.params.userid;
    const request = {
      params: {
        userid: userId
      }
    };
    try {
      const response = mockResponseApi();
      await persistance.findRepresentativeOrders(request, response);
      res.json({'status': 'ok', 'orders': response.getJson() });
    } catch(err) {
      res.status(404).json({'status': 'no records'});
    }
  }
};

export default order;
