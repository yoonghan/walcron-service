"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runKafkaConsumer = exports.runKafkaProducer = exports.createKafkaConf = void 0;
`use strict`;
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
function runKafkaProducer(kafkaClient, prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafkaClient.producer();
        yield producer.connect();
        const writer = (msg) => {
            producer.send({
                topic: _getTopic(prefix),
                messages: [{ value: msg }]
            });
        };
        return writer;
    });
}
exports.runKafkaProducer = runKafkaProducer;
function runKafkaConsumer(kafkaClient, prefix, groupId, writer) {
    return __awaiter(this, void 0, void 0, function* () {
        //Kafka guarantees that a message is only read by a single consumer in the group.
        const consumer = kafkaClient.consumer({ groupId });
        yield consumer.connect();
        yield consumer.subscribe({ topic: _getTopic(prefix) });
        const disconnect = () => {
            consumer.close(true, () => { });
        };
        const _consumeMessage = () => {
            consumer.run({
                eachMessage: ({ topic, partition, message }) => __awaiter(this, void 0, void 0, function* () {
                    // console.log({
                    //     key: message.key.toString(),
                    //     value: message.value.toString(),
                    //     headers: message.headers,
                    // })
                    console.log(message.value.toString(), 'message');
                }),
            });
        };
        _consumeMessage();
        return disconnect;
    });
}
exports.runKafkaConsumer = runKafkaConsumer;
