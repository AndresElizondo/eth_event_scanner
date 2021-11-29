"use strict";
const amqplib = require('amqplib');
const amqpUrl = 'amqp://rabbitmq:5672';

let connection = null;
let channel = null;

let rabbitmq = {};
module.exports = rabbitmq;


rabbitmq.setupMQ = async function() {
    connection = await amqplib.connect(amqpUrl, 'heartbeat=60');
    channel = await connection.createChannel();
}

rabbitmq.ensureQueue = async function (exchange, queue, routingKey) {
    console.log(`Ensured queue ${queue}, exchange ${exchange}, routingKey ${routingKey}`);
    await channel.bindQueue(queue, exchange, routingKey);
}

rabbitmq.sendMessage = async function(message, exchange, routingKey) {
    try {
        await channel.publish(
            exchange, routingKey,
            Buffer.from(JSON.stringify(message))
        );

    } catch(e) {
        console.error('Error in publishing message', e);
    }
}

rabbitmq.close = async function() {
    console.info('Closing channel and connection if available');
    await channel.close();
    await connection.close();
    console.info('Channel and connection closed');
}