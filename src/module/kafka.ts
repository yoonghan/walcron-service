`use strict`
import Kafka from 'kafkajs';

function _getTopic(prefix:string) { return `${prefix}default`}

export function createKafkaConf (
  brokerList: Array<string>,
  username: string,
  password: string
) {
  const config = {
    clientId: 'my-app',
    brokers: brokerList,
    ssl: true,
    connectionTimeout: 10000,
    sasl: {
      mechanism: ('scram-sha-256' as any),
      username: username,
      password: password
    }
  };
  return new Kafka.Kafka(config);
}

export async function runKafkaProducer(kafkaClient:any, prefix:string) {
  const producer = kafkaClient.producer();
  await producer.connect();

  const writer = (msg:string) => {
    producer.send(
      {
        topic: _getTopic(prefix),
        messages: [{value: msg}]
      }
    );
  }

  return writer;
}

export async function runKafkaConsumer(kafkaClient:any, prefix:string, groupId:string, writer:(msg:string) => void) {
  //Kafka guarantees that a message is only read by a single consumer in the group.
  const consumer = kafkaClient.consumer({groupId});
  await consumer.connect();
  await consumer.subscribe({topic: _getTopic(prefix)});

  const disconnect = () => {
    consumer.close(true, () => {});
  }

  const _consumeMessage = () => {
    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // console.log({
        //     key: message.key.toString(),
        //     value: message.value.toString(),
        //     headers: message.headers,
        // })
        console.log(message.value.toString(), 'message');
      },
    })
  }

  _consumeMessage();

  return disconnect;
}
