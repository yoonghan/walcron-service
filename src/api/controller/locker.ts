//This is a project for lockers
import {runKafkaConsumer, runKafkaProducer, createKafkaConf} from '../../module/kafka';

const {KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID} = process.env;
const kafkaConf = createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);

const locker = {
  monitor: async function(req, res){
    const _writer = (res) => (msg) => {console.log(msg);}
    const reader = await runKafkaConsumer(kafkaConf, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID, _writer(res));
    res.send('done');
  },
  invokeMonitor: async function(req, res){
    const writer = await runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
    writer('test sample');
    res.send('done');
  }
};

export default locker;
