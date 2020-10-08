import {EnumAirtables, connectAirtable}  from '../../module/airtable';
import {EnumOrderStatus, EnumLockStatus} from '../../definition/enum';

const persistence = (function () {
  function initialize() {
    const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
    return connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
  }

  const airtable = initialize();

  return {
    createOrder: async function(req, res) {
      try {
        await airtable.create(EnumAirtables.ORDER, [
          airtable.buildOrder(
              req.body.order_id,
              req.params.businesspartnerid,
              req.body.contact_type,
              req.body.contact_info,
              EnumOrderStatus.ORDER_PLACED
            )
        ]);
        res.json({'status': 'ok'});
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    logCreateOrUpdateOrder: async function(req, res) {
      try {
        await airtable.create(EnumAirtables.ORDER_LOG, [
          airtable.buildOrderLog(
              req.body.order_id,
              req.params.businesspartnerid,
              req.body.state,
              req.body.trigger_datetime
            )
        ]);
        res.json({'status': 'ok'});
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    updateUserToken: async function(req, res) {
      try {
        airtable.updateRepresentativeToken(req.params.userid, req.body.token)
        .then(() => {
          res.json({'status': 'ok'});
        })
        .catch((err) => {
          res.json({'status': 'error'});
        })
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    findRepresentativeInfo: async function(req, res) {
      const {userid} = req.params;
      try {
        const representativeInfo = await airtable.findRepresentativeInfo(userid);
        res.json({'status': 'ok', 'contactinfo': representativeInfo})
      }
      catch(err) {
        console.log(err, 'err');
        res.json({'status': 'fail'});
      }
    },
    findRepresentativeOrders: async function(req, res) {
      const {userid} = req.params;
      try {
        const orders = await airtable.findRepresentativeOrders(userid);
        res.json({'status': 'ok', 'orders': orders})
      }
      catch(err) {
        console.log(err, 'err');
        res.json({'status': 'fail'});
      }
    },
    getAvailableOrders: async function(req, res) {
      const {partnerid} = req.params;
      try {
        const orders = await airtable.getAvailableOrders(partnerid);
        res.json({'status': 'ok', 'orders': orders})
      }
      catch(err) {
        console.log(err, 'err');
        res.json({'status': 'fail'});
      }
    },
    getLockStatus: async function(req, res) {
      const {partnerid} = req.params;
      try {
        const locks = await airtable.getCurrentLockStatuses(partnerid)
        res.json({'status': 'ok', 'locks': locks})
      }
      catch(err) {
        console.log(err, 'err');
        res.json({'status': 'fail'});
      }
    },
    logLock: async function(req, res) {
      try {
        await airtable.create(EnumAirtables.LOCK_LOG, [
          airtable.buildLockLog(
              req.body.order_id,
              req.params.businesspartnerid,
              req.body.locker_id,
              req.body.state,
              req.body.trigger_datetime
            )
        ]);
        res.json({'status': 'ok'});
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    updateOrder: async function(req, res) {
      try {
        await airtable.updateOrder(req.params.partnerid, req.body.order_id, req.body.state);
        res.json({'status': 'ok'});
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    updateLock: async function(req, res) {
      try {
        await airtable.updateLock(req.body.locker_id, req.params.partnerid, req.body.order_id, req.body.state);
        res.json({'status': 'ok'});
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    },
    getContactInformation: async function(req, res) {
      try {
        const contactInformation:any = await airtable.findContactInformation(req.params.partnerid, req.body.order_id);
        res.json({'status': 'ok', 'contact':
          {
            contact_info: contactInformation.contactInfo,
            contact_type: contactInformation.contactType
          }
        });
      }
      catch (err) {
        res.json({'status': 'fail'});
      }
    }
  }
})();

export default persistence;
