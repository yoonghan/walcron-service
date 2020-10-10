import {runKafkaProducer, createKafkaConf} from '../../module/kafka';

export interface IOrderMessage {
  orderId: string;
  contactType?: string;
  contactInfo?: string;
  partnerId: string;
  businessPartnerId: string;
  state: string;
  triggerTime: string;
}

export interface ILockMessage {
  origin: string;
  orderId: string;
  businessPartnerId: string;
  partnerId: string;
  lockerIds: Array<string>;
  state: string;
  triggerTime: string;
}

const publishsubscribe = (function () {

  const {KAFKA_LOCK_BROKERS, KAFKA_LOCK_USERNAME, KAFKA_LOCK_PASSWORD, KAFKA_LOCK_TOPIC_PREFIX} = process.env;
  const {KAFKA_ORDER_BROKERS, KAFKA_ORDER_USERNAME, KAFKA_ORDER_PASSWORD, KAFKA_ORDER_TOPIC_PREFIX} = process.env;

  async function initializeLock() {
    const kafkaLockConf = createKafkaConf(KAFKA_LOCK_BROKERS.split(','), KAFKA_LOCK_USERNAME, KAFKA_LOCK_PASSWORD);
    kafkaLockWriter = await runKafkaProducer(kafkaLockConf, KAFKA_LOCK_TOPIC_PREFIX);
  }

  async function initializeOrder() {
    const kafkaOrderConf = createKafkaConf(KAFKA_ORDER_BROKERS.split(','), KAFKA_ORDER_USERNAME, KAFKA_ORDER_PASSWORD);
    kafkaOrderWriter = await runKafkaProducer(kafkaOrderConf, KAFKA_ORDER_TOPIC_PREFIX);
  }

  let kafkaLockWriter;
  let kafkaOrderWriter;
  initializeLock();
  initializeOrder();

  const _generateLockKey = (lockerId:string, orderId:string, partnerId:string) => (`${lockerId}-${orderId}-${partnerId}`)
  const _generateOrderKey = (orderId:string, partnerId:string) => (`${orderId}-${partnerId}`)

  return {
    writeLock: async function(req, res) {
      if(typeof kafkaLockWriter === 'undefined'){
        console.error('No persistence lock writer');
        res.json({'status': 'fail'});
      }
      else {
        const lockerIds = req.body.locker_id? [req.body.locker_id]: req.body.locker_ids;

        const message:ILockMessage = {
          origin: req.body.origin,
          orderId: req.body.order_id,
          lockerIds: lockerIds,
          state: req.body.state,
          partnerId: req.params.partnerid,
          businessPartnerId: req.params.businesspartnerid,
          triggerTime: new Date().toISOString()
        }
        kafkaLockWriter(
          _generateLockKey(req.body.locker_id, req.body.order_id, req.params.partnerid),
          JSON.stringify(message));
        res.json({'status': 'ok'});
      }
    },
    writeOrder: async function(req, res) {
      if(typeof kafkaOrderWriter === 'undefined'){
        console.error('No persistence order writer');
        res.json({'status': 'fail'});
      }
      else {
        const message:IOrderMessage = {
          orderId: req.body.order_id,
          contactType: req.body.contact_type,
          contactInfo: req.body.contact_info,
          state: req.body.state,
          partnerId: req.params.partnerid,
          businessPartnerId: req.params.businesspartnerid,
          triggerTime: new Date().toISOString()
        }
        kafkaOrderWriter(_generateOrderKey(req.body.order_id, req.params.partnerid), JSON.stringify(message));
        res.json({'status': 'ok'});
      }
    }
  }
})()

export default publishsubscribe;
