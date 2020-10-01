//This is a project for lockers
import {runKafkaProducer, createKafkaConf} from '../../module/kafka';

const {KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID} = process.env;
const kafkaConf = createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);

let kafkaWriter:any = undefined;

const locker = {
  monitor: async function(req, res){
    res.json({'status': 'initiated reader'});
  },
  invokeMonitor: async function(req, res){
    const _createMessage = (message) => {
      message.triggerTime = new Date().toISOString();
      return JSON.stringify(message);
    }

    if(typeof kafkaWriter === 'undefined'){
      console.log('created kafka writer');
      kafkaWriter = await runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
    }

    kafkaWriter(_createMessage(req.body));
    
    res.json({'status': 'initiated writer'});
  }
};

export default locker;
