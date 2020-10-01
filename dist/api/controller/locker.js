"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//This is a project for lockers
const const_1 = require("../../module/const");
const pusher_1 = require("../../module/pusher");
const airtable_1 = require("../../module/airtable");
const kafka_1 = require("../../module/kafka");
const { PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CHANNEL_NAME_TWICE, PUSHER_CLUSTER_TWICE } = process.env;
const pusher = pusher_1.createPusher(PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CLUSTER_TWICE);
const { KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID } = process.env;
const kafkaConf = kafka_1.createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);
const { AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE } = process.env;
const airtable = airtable_1.connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
const locker = {
    monitor: async function (req, res) {
        const _writer = (res) => (message) => {
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
        const reader = await kafka_1.runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer(res));
        res.send('done');
    },
    invokeMonitor: async function (req, res) {
        const _createMessage = (message) => {
            message.triggerTime = new Date().toISOString();
            return JSON.stringify(message);
        };
        const writer = await kafka_1.runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
        writer(_createMessage(req.body));
        res.send('done');
    }
};
exports.default = locker;
