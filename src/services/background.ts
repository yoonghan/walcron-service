import {runKafkaConsumer, createKafkaConf} from '../module/kafka';
import {createPusher} from '../module/pusher';
import {connectAirtable, EnumAirtables} from '../module/airtable';
import {PUSHER} from '../module/const';

const {KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID} = process.env;
const kafkaConf = createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);

const {PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CHANNEL_NAME_TWICE, PUSHER_CLUSTER_TWICE} = process.env;
const pusher = createPusher(PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CLUSTER_TWICE);

const {AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE} = process.env;
const airtable = connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);

async function startKafkaMonitor(){
  const _writer = () => (message) => {
    try{
      const messageInJson = JSON.parse(message);
      airtable.create(EnumAirtables.LOCK_LOG, [
        {
          "fields": {
            "Order Id": messageInJson.orderId,
            "Business Partner Id": [messageInJson.businessPartnerId],
            "Locker Id": messageInJson.lockerid,
            "Status": messageInJson.state,
            "Trigger DateTime": messageInJson.triggerTime
          }
        }
      ]);
    }
    catch(err) {
      //skip
    }

    pusher.trigger(
      `${PUSHER.channel_prefix}${PUSHER_CHANNEL_NAME_TWICE}`,
      `${PUSHER.event}`,
      {
        "message": message
      },
      () => {}
    );
  };

  runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer());

  console.log("kafka consumer will run in background - forever!");
}

//Run services.
module.exports = function() {
  startKafkaMonitor();
}
