"use strict";
const Web3 = require('web3'); 
const client = require('node-rest-client-promise').Client();

let INFURA_KEY = null;
let ETHERSCAN_API_KEY = null;
let web3 = null;

let web3Tools = {};
module.exports = web3Tools;


web3Tools.setup_web3 = function (infura_key, etherscan_api_key) {
    INFURA_KEY = infura_key;
    ETHERSCAN_API_KEY = etherscan_api_key;
    web3 = new Web3('wss://mainnet.infura.io/ws/v3/' + INFURA_KEY);
}

async function getContractAbi(etherescan_url) {
    const etherescan_response = await client.getPromise(etherescan_url);
    const CONTRACT_ABI = JSON.parse(etherescan_response.data.result);
    return CONTRACT_ABI;
}

web3Tools.eventListener = async function(contract_address, eventType, filters, data_callback, exchange, routingKey) {
    const etherescan_url = `http://api.etherscan.io/api?module=contract&action=getabi&address=${contract_address}&apikey=${ETHERSCAN_API_KEY}`;
    const CONTRACT_ABI = await getContractAbi(etherescan_url);
    const contract = new web3.eth.Contract(CONTRACT_ABI, contract_address);
    
    console.log(`Starting listener for ${eventType} events for contract ${contract_address} with filters ${JSON.stringify(filters)}`);
    contract.events[eventType]({
        filter: filters ?? {}
    })
    .on('data', (event) => {
        console.log(`Found tx for contract ${contract_address}`);
        data_callback(event, exchange, routingKey);
    })
    .on('error', console.error);
}