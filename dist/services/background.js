"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafka_1 = require("../module/kafka");
const pusher_1 = require("../module/pusher");
const airtable_1 = require("../module/airtable");
const const_1 = require("../module/const");
const { KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID } = process.env;
const kafkaConf = kafka_1.createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);
const { PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CHANNEL_NAME_TWICE, PUSHER_CLUSTER_TWICE } = process.env;
const pusher = pusher_1.createPusher(PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CLUSTER_TWICE);
const { AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE } = process.env;
const airtable = airtable_1.connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
async function startKafkaMonitor() {
    const _writer = () => (message) => {
        try {
            const messageInJson = JSON.parse(message);
            airtable.create(airtable_1.EnumAirtables.LOCK_LOG, [
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
        catch (err) {
            //skip
        }
        pusher.trigger(`${const_1.PUSHER.channel_prefix}${PUSHER_CHANNEL_NAME_TWICE}`, `${const_1.PUSHER.event}`, {
            "message": message
        }, () => { });
    };
    kafka_1.runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer());
    console.log("kafka consumer will run in background - forever!");
}
//Run services.
module.exports = function () {
    startKafkaMonitor();
};
