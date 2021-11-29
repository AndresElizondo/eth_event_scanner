"use strict";
const {readConfig} = require('./source/utils.js')
const web3Tools = require('./source/web3.js')
const rabbitmq = require('./source/rabbitmq.js')

const INFURA_KEY = process.env.INFURA_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

function dataCallback(event, exchange, routingKey){
    rabbitmq.sendMessage(event, exchange, routingKey)
}

async function createListener(config, callback){
    const address = config.contractAddress;
    const eventType = config.eventType;
    const filters = config.filters ?? {};
    const exchange = config.exchange;
    const queue = config.queue;
    const routingKey = config.mq_routing_key;

    await rabbitmq.ensureQueue(exchange, queue, routingKey)
    await web3Tools.eventListener(address, eventType, filters, callback, exchange, routingKey)
}

async function main(){
    const fullConfig = readConfig('config.json')
    web3Tools.setup_web3(INFURA_KEY, ETHERSCAN_API_KEY)
    await rabbitmq.setupMQ()

    for (let config of fullConfig){
        await createListener(config, dataCallback)
    }
}

main();