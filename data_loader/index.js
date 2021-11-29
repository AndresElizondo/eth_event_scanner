"use strict";
const {readConfig} = require('./source/utils.js');
const mq_consumer = require('./source/mq_consumer.js');
const mysqldb = require('./source/mysql.js');

async function upload(data, tableName) {
    await mysqldb.insertData(data, tableName);
    console.log(`Inserted 1 record to ${tableName}`);
}

async function createConsumer(config, callback) {
    const exchange = config.exchange;
    const queue = config.queue;
    const tableName = config.tableName;
    const ABI2TableMap = config.ABI2TableMap;

    await mq_consumer.eventConsumer(exchange, queue, tableName, callback, ABI2TableMap);
}

async function main(){
    const fullConfig = readConfig('config.json');
    await mq_consumer.setupMQ();
    await mysqldb.createConnection();

    for (let config of fullConfig){
        await createConsumer(config, upload);
    }
}

main();