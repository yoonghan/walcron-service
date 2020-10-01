var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const kafka = require('./kafka');
const app = express();
const serverHost = process.env.HOST || 'localhost';
const serverPort = process.env.PORT || 3000;
const kafkaConf = kafka.createKafkaConf(['omnibus-01.srvs.cloudkafka.com:9094', 'omnibus-03.srvs.cloudkafka.com:9094', 'omnibus-02.srvs.cloudkafka.com:9094'], 'lagqk8fj', 'I-iMfKwePGx5pMFYOP7Gk15APbpduL68');
app.post('/api/monitor', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const writer = yield kafka.withKafkaProducer(kafkaConf, 'lagqk8fj-');
    writer('test sample');
    res.send('done');
}));
app.get('/api/monitor', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const _writer = (res) => (msg) => { console.log(msg); };
    const reader = yield kafka.withKafkaConsumer(kafkaConf, 'lagqk8fj-', '2', _writer(res));
    res.send('done');
}));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(serverPort, () => {
    console.log(`Example app listening at http://${serverHost}:${serverPort}`);
});
