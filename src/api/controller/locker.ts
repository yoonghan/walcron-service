//This is a project for lockers
import {userNotifier} from '../../module/notification';
import {runKafkaProducer, createKafkaConf} from '../../module/kafka';
import {connectAirtable, EnumAirtables, EnumOrderStatus} from '../../module/airtable';

const {KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID} = process.env;
const kafkaConf = createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);

let kafkaWriter:any = undefined;


const locker = {
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
  },
  trigger: async function(req, res) {
    const partnerId = req.params.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const _createMessage = (message) => {
      message.partnerId = partnerId;
      message.businessPartnerId = businessPartnerId;
      message.triggerTime = new Date().toISOString();
      return JSON.stringify(message);
    }

    if(typeof kafkaWriter === 'undefined'){
      console.log('created kafka writer');
      kafkaWriter = await runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
    }

    kafkaWriter(_createMessage(req.body));


    res.json({'status': 'initiated writer'});
  },
  placeOrder: async function(req, res){
    const orderId = req.body.order_id;
    const contactType = req.body.contact_type;
    const contactInfo = req.body.contact_info;
    const partnerId = req.body.partnerid;
    const businessPartnerId = req.params.businesspartnerid;

    const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
    const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);

    airtable.create(EnumAirtables.ORDER, [
      airtable.buildOrder(
          orderId,
          businessPartnerId,
          contactType,
          contactInfo,
          EnumOrderStatus.ORDER_PLACED
        )
    ], function(err, records) {
      if (err) {
        res.status(400).json({'status': err.message});
      }
      res.json({'status': 'ok'});

      userNotifier(airtable, partnerId, orderId, EnumOrderStatus.ORDER_PLACED, contactType, contactInfo);
    });
  },
  getAvailOrders: async function(req, res) {
    const partnerId = req.params.partnerid;

    const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
    const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
    try {
      const orders = await airtable.getAvailableOrders(partnerId);

      res.json({'status': 'ok', 'orders': orders })
    }
    catch(err) {
      res.status(404).json({'status': 'no records'});
    }
  },
  updateUserNotification: async function(req, res) {
    const userId = req.params.userid;
    const pushNotificationToken = req.body.push_notification_token;
    const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
    const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);

    try {
      const orders = await airtable.updateRepresentativeToken(userId, pushNotificationToken);

      res.json({'status': 'ok'})
    }
    catch(err) {
      res.status(404).json({'status': 'fail'});
    }
  },
  getUserOrders: async function(req, res) {
    const userId = req.params.userid;
    const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
    const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
    try {
      const orders = await airtable.findRepresentativeOrders(userId);

      res.json({'status': 'ok', 'orders': orders})
    }
    catch(err) {
      console.log(err, 'err');
      res.status(404).json({'status': 'fail'});
    }
  }
};

export default locker;
