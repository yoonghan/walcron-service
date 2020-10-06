
import {userNotifier} from '../module/notification';
import {runKafkaConsumer, createKafkaConf} from '../module/kafka';
import {pushPusherMessage} from '../module/pusher';
import {connectAirtable, EnumAirtables, EnumOrderStatus} from '../module/airtable';
import {PUSHER} from '../module/const';

const {KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID} = process.env;
const kafkaConf = createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);

const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);

async function startKafkaMonitor(){
  const _writer = () => async (message:string) => {
    try{
      const messageInJson = JSON.parse(message);

      airtable.create(EnumAirtables.LOCK_LOG, [
        airtable.buildLockLog(
            messageInJson.orderId,
            messageInJson.businessPartnerId,
            messageInJson.lockerid,
            messageInJson.state,
            messageInJson.triggerTime
          )
      ]);

      if(messageInJson.state === 'lock') {
        try{
          const response = await airtable.updateOrder(messageInJson.partnerId, messageInJson.orderId, EnumOrderStatus.READY);

          userNotifier(airtable, messageInJson.partnerId, messageInJson.orderId, EnumOrderStatus.READY, (response as any).contactType, (response as any).contactInfo);
        }
        catch(err) {
          console.error('error');
        }
      }
      else {
        airtable.updateOrder(messageInJson.partnerId, messageInJson.orderId, EnumOrderStatus.ORDER_PLACED);
      }
    }
    catch(err) {
      //skip
      console.error(err, 'writer');
    }

    pushPusherMessage(PUSHER.lockEvent, message);
  };

  runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer());

  console.log("kafka consumer and writer will run in background - forever!");
}

//Run services.
module.exports = function() {
  startKafkaMonitor();
}
