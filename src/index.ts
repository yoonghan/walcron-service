const express = require('express');
const kafka = require('./kafka');

const app = express();
const serverHost = process.env.HOST || 'localhost'
const serverPort = process.env.PORT || 3000
const kafkaConf = kafka.createKafkaConf(['omnibus-01.srvs.cloudkafka.com:9094','omnibus-03.srvs.cloudkafka.com:9094','omnibus-02.srvs.cloudkafka.com:9094'], 'lagqk8fj', 'I-iMfKwePGx5pMFYOP7Gk15APbpduL68');

app.post('/api/monitor', async (req, res) => {
  const writer = await kafka.withKafkaProducer(kafkaConf, 'lagqk8fj-');
  writer('test sample');
  res.send('done');
})

app.get('/api/monitor', async (req, res) => {
  const _writer = (res) => (msg) => {console.log(msg);}

  const reader = await kafka.withKafkaConsumer(kafkaConf, 'lagqk8fj-', '2', _writer(res));

  res.send('done');
})


app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(serverPort, () => {
  console.log(`Example app listening at http://${serverHost}:${serverPort}`)
})
