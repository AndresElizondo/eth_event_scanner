"use strict";
const amqplib = require('amqplib');
const amqpUrl = 'amqp://rabbitmq:5672';

let connection = null;
let channel = null;

let mq_consumer = {};
module.exports = mq_consumer;


mq_consumer.setupMQ = async function() {
    connection = await amqplib.connect(amqpUrl, 'heartbeat=60');
    channel = await connection.createChannel();
    console.log('Connected to MQ server.');
}

async function ensureConfig(exchange, queue) {
    await channel.assertExchange(exchange, 'direct', {durable: true});
    await channel.assertQueue(queue, {durable: true});
    console.log(`Ensured exchange ${exchange} and queue ${queue}`);
}

mq_consumer.eventConsumer = async function(exchange, queue, tableName, callback, ABI2TableMap) {
    try {
        console.log(`Starting consumer for queue ${queue} inserting data into table ${tableName}`);
        await ensureConfig(exchange, queue);

        channel.consume(queue, function(msg) {
            if (msg == null) {
                return;
            }
            console.log(msg.content.toString());
            channel.ack(msg);

            const data = JSON.parse(msg.content);
            const res = parseEvent(data, ABI2TableMap);
            callback(res, tableName);
        });
    } catch{console.warn};
}

mq_consumer.close = async function() {
    await channel.close();
    await connection.close();
    console.info('Channel and connection closed');
}

function extractAttribute(data, attr_path) {
    const attrs = attr_path.split(".");
    for (const attr of attrs){
        data = data[attr];
    }
    return data;
}

function parseEvent(event, ABI2TableMap) {
    let newData = {};

    const attributes = Object.keys(ABI2TableMap);
    for (const attr of attributes){
        const attr_path = ABI2TableMap[attr];

        const val = extractAttribute(event, attr_path);
        newData[attr] = val;
    }
    return newData;
}
