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
Object.defineProperty(exports, "__esModule", { value: true });
//This is a project for lockers
const kafka_1 = require("../../module/kafka");
const { KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID } = process.env;
const kafkaConf = kafka_1.createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);
const locker = {
    monitor: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const _writer = (res) => (msg) => { console.log(msg); };
            const reader = yield kafka_1.runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer(res));
            res.send('done');
        });
    },
    invokeMonitor: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = yield kafka_1.runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
            writer('test sample');
            res.send('done');
        });
    }
};
exports.default = locker;
