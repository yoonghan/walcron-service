"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runKafkaConsumer = exports.runKafkaProducer = exports.createKafkaConf = void 0;
const kafkajs_1 = __importDefault(require("kafkajs"));
function _getTopic(prefix) { return `${prefix}default`; }
function createKafkaConf(brokerList, username, password) {
    const config = {
        clientId: 'my-app',
        brokers: brokerList,
        ssl: true,
        connectionTimeout: 10000,
        sasl: {
            mechanism: 'scram-sha-256',
            username: username,
            password: password
        }
    };
    return new kafkajs_1.default.Kafka(config);
}
exports.createKafkaConf = createKafkaConf;
async function runKafkaProducer(kafkaClient, prefix) {
    const producer = kafkaClient.producer();
    await producer.connect();
    const writer = (msg) => {
        producer.send({
            topic: _getTopic(prefix),
            messages: [{ value: msg }]
        });
    };
    return writer;
}
exports.runKafkaProducer = runKafkaProducer;
async function runKafkaConsumer(kafkaClient, prefix, groupId, writer) {
    //Kafka guarantees that a message is only read by a single consumer in the group.
    const consumer = kafkaClient.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic: _getTopic(prefix) });
    const disconnect = () => {
        console.log('disconnect');
        consumer.close(true, () => { });
    };
    const _consumeMessage = () => {
        consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                writer(message.value.toString());
            },
        });
    };
    _consumeMessage();
    return disconnect;
}
exports.runKafkaConsumer = runKafkaConsumer;
