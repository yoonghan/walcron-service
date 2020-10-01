"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//This is a project for lockers
const kafka_1 = require("../../module/kafka");
const { KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID } = process.env;
const kafkaConf = kafka_1.createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);
let kafkaWriter = undefined;
const locker = {
    monitor: async function (req, res) {
        res.json({ 'status': 'initiated reader' });
    },
    invokeMonitor: async function (req, res) {
        const _createMessage = (message) => {
            message.triggerTime = new Date().toISOString();
            return JSON.stringify(message);
        };
        if (typeof kafkaWriter === 'undefined') {
            console.log('created kafka writer');
            kafkaWriter = await kafka_1.runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
        }
        kafkaWriter(_createMessage(req.body));
        res.json({ 'status': 'initiated writer' });
    }
};
exports.default = locker;
