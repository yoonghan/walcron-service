import {runKafkaConsumer, createKafkaConf} from '../module/kafka';
import {IOrderMessage, ILockMessage} from '../api/controller/publishsubscribe';
import {mockResponseApi} from '../api/controller/_genericapi';
import notification from '../api/controller/notification';
import persistance from '../api/controller/persistance';
import {EnumOrderStatus} from '../definition/enum';

const {KAFKA_LOCK_BROKERS, KAFKA_LOCK_USERNAME, KAFKA_LOCK_PASSWORD, KAFKA_LOCK_TOPIC_PREFIX, KAFKA_LOCK_GROUP_ID} = process.env;
const kafkaLockConf = createKafkaConf(KAFKA_LOCK_BROKERS.split(','), KAFKA_LOCK_USERNAME, KAFKA_LOCK_PASSWORD);

const {KAFKA_ORDER_BROKERS, KAFKA_ORDER_USERNAME, KAFKA_ORDER_PASSWORD, KAFKA_ORDER_TOPIC_PREFIX, KAFKA_ORDER_GROUP_ID} = process.env;
const kafkaOrderConf = createKafkaConf(KAFKA_ORDER_BROKERS.split(','), KAFKA_ORDER_USERNAME, KAFKA_ORDER_PASSWORD);

async function startKafkaOrderMonitor(){
  const _writer = () => async (message:string) => {
    try{
      const messageInJson:IOrderMessage = JSON.parse(message) as IOrderMessage;
      switch(messageInJson.state) {
        case EnumOrderStatus.ORDER_PLACED:
          {
            const req = {
              body: {
                order_id: messageInJson.orderId,
                contact_type: messageInJson.contactType,
                contact_info: messageInJson.contactInfo,
                state: messageInJson.state,
                trigger_datetime: messageInJson.triggerTime
              },
              params: {
                partnerid: messageInJson.partnerId,
                businesspartnerid: messageInJson.businessPartnerId
              }
            }
            await persistance.createOrder(req, mockResponseApi());
            persistance.logCreateOrUpdateOrder(req, mockResponseApi());
            notification.notifyOrderEvent({
              body: {
                order_id: messageInJson.orderId,
                status: messageInJson.state
              }
            }, mockResponseApi());
          }
          break;
        case EnumOrderStatus.UNREADY:
          {
            const req = {
              body: {
                order_id: messageInJson.orderId,
                state: "Order Placed",
                trigger_datetime: messageInJson.triggerTime
              },
              params: {
                partnerid: messageInJson.partnerId,
                businesspartnerid: messageInJson.businessPartnerId
              }
            }
            await persistance.updateOrder(req, mockResponseApi());
            persistance.logCreateOrUpdateOrder(req, mockResponseApi());
            const contactInformationResponse = mockResponseApi();
            await persistance.getContactInformation(req, contactInformationResponse);

            notification.notifyOrderEvent({
              body: {
                order_id: messageInJson.orderId,
                status: "Misplaced",
                contact_type: contactInformationResponse.getJson().contact.contact_type,
                contact_info: contactInformationResponse.getJson().contact.contact_info
              },
              params: {
                partnerid: messageInJson.partnerId,
                businesspartnerid: messageInJson.businessPartnerId
              }
            }, mockResponseApi());
          }
          break;
        case EnumOrderStatus.READY:
        case EnumOrderStatus.TAKEN:
          {
            const req = {
              body: {
                order_id: messageInJson.orderId,
                state: messageInJson.state,
                trigger_datetime: messageInJson.triggerTime
              },
              params: {
                partnerid: messageInJson.partnerId,
                businesspartnerid: messageInJson.businessPartnerId
              }
            }

            await persistance.updateOrder(req, mockResponseApi());
            persistance.logCreateOrUpdateOrder(req, mockResponseApi());
            const contactInformationResponse = mockResponseApi();
            await persistance.getContactInformation(req, contactInformationResponse);

            notification.notifyOrderEvent({
              body: {
                order_id: messageInJson.orderId,
                status: messageInJson.state,
                contact_type: contactInformationResponse.getJson().contact.contact_type,
                contact_info: contactInformationResponse.getJson().contact.contact_info
              },
              params: {
                partnerid: messageInJson.partnerId,
                businesspartnerid: messageInJson.businessPartnerId
              }
            }, mockResponseApi());
        }
        break;
      }
    }
    catch(err) {
      //skip
      console.error(err, 'writer');
    }
  };

  runKafkaConsumer(kafkaOrderConf, KAFKA_ORDER_TOPIC_PREFIX, KAFKA_ORDER_GROUP_ID, _writer());
  console.log("kafka order consumer and writer will run in background - forever!");
}

async function startKafkaLockMonitor(){
  const _writer = () => async (message:string) => {
    try{
      const messageInJson:ILockMessage = JSON.parse(message) as ILockMessage;

      for(let lockerIdx=0; lockerIdx < messageInJson.lockerIds.length; lockerIdx++) {
        const req = {
          body: {
            origin: messageInJson.origin,
            order_id: messageInJson.orderId,
            locker_id: messageInJson.lockerIds[lockerIdx],
            state: messageInJson.state,
            trigger_datetime: messageInJson.triggerTime
          },
          params: {
            partnerid: messageInJson.partnerId,
            businesspartnerid: messageInJson.businessPartnerId
          }
        };
        await persistance.updateLock(req, mockResponseApi());
        persistance.logLock(req, mockResponseApi());
        notification.notifyLockEvent({
          body: {
            orderId: messageInJson.orderId,
            lockerId: messageInJson.lockerIds[lockerIdx],
            state: messageInJson.state
          }
        }, mockResponseApi());
      }
    }
    catch(err) {
      //skip
      console.error(err, 'writer');
    }
  };

  runKafkaConsumer(kafkaLockConf, KAFKA_LOCK_TOPIC_PREFIX, KAFKA_LOCK_GROUP_ID, _writer());

  console.log("kafka lock consumer and writer will run in background - forever!");
}

//Run services.
module.exports = function() {
  startKafkaLockMonitor();
  startKafkaOrderMonitor();
}
