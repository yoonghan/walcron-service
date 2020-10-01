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
                airtable.buildLockLog(messageInJson.orderId, messageInJson.businessPartnerId, messageInJson.lockerid, messageInJson.state, messageInJson.triggerTime)
            ]);
            if (messageInJson.state === 'lock') {
                airtable.updateOrder(messageInJson.partnerId, messageInJson.orderId, airtable_1.EnumOrderStatus.READY);
            }
            else {
                airtable.updateOrder(messageInJson.partnerId, messageInJson.orderId, airtable_1.EnumOrderStatus.ORDER_PLACED);
            }
        }
        catch (err) {
            //skip
            console.error(err, 'writer');
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
