# eth_event_scanner
This project listens for events in the Ethereum blockchain and registers them in a local DB.


## Description
The project consists of 5 components:
1. listener
2. rabbitmq
3. data_loader
4. mysqldb
5. adminer

### 1. listener
This component listens on Web3 for new events on the ethereum chain. It then sends events to the RabbitMQ server.
This component can be configured by the file `./eth_listener/config.json`. Here you can specify which contract and events to listen to.

NOTE: This component creates RabbitMQ bindings (exchange -> queue -> routing key) if they don't exist already.

### 2. rabbitmq
A basic RabbitMQ server. This is used to loosely couple the `listener` from the `data_loader`, allowing for multiple data_loaders if need be.

### 3. data_loader
This component listens for new data on a RabbitMQ queue to then process it and insert it into the DB.
The behaviour of this component is configurable through the config file `./data_loader/config.json`.
Here you can configure which queue to listen to, how to process data and which table to insert the data into.

NOTE: This component creates RabbitMQ exchanges and queues if they don't exist already.

### 4. mysqldb
Simple MySQL DB Server.
Tables were configured manually using `adminer` and based on the ABI for the transactions we're listening for.

### 5. adminer
Simple Adminer container.
Allows for configuring and queueing the DB.


## How to run:
First we need some working directory setup:
```
mkdir -p ~/.docker-conf/mysql
mkdir -p ~/.docker-conf/rabbitmq
```
Then, create DB and tables by using the sample `eth_tx.sql.gz` file.

First, start the MySQL and Adminer
```
sudo docker-compose up mysqldb adminer
```
Then login with the credentials on `.mysql_env`.
Go into `Import` and select the `eth_tx.sql.gz` file and click on `Execute`.
This will create the DB `eth_tx` along with the tables `uniswap_tx_swap` and `uniswap_tx_transfer`.

Now, you can stop the DB and Adminer on the terminal by presing `Ctrl + C`

Finally, to start all components, run:
```
sudo docker-compose up
```

## How to add a new contract/event:
Adding a new contract/event consists of three steps:
1. Create config entry in config file for eth_listener.
2. Create config entry in config file for data_loader.
3. Creating DB table based on event ABI

### 1. Creating eth_listener config
The config file for `eth_listener` has the following structure:
```
[
  {
    "contractAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "eventType": "Transfer",
    "filters": {},
    "exchange": "uniswap.tx",
    "queue": "uniswap.tx.transfer",
    "mq_routing_key": "uniswap.tx.transfer"
  }
]
```

The first three fields are for the web3 connector. Here you can specify which contract and event to listen to. Optional filters are also enabled, so you can filter events by indexed attributes.

The last three events are regarding the RabbitMQ server. For this you can define which `exchange` and `queue` to use. The `mq_routing_key` will create a binding for this configuration. All messages matching this listener will be sent to the corresponding queue.

To continue, we first need to capture one of the responses for this event.
For this, make sure the `docker-compose.yaml` file sets the `listener` to use your new config file.
```
sudo docker-compose build listener
sudo docker-compose up listener
```
TODO: this part is messy, since `data_loader` needs to create the exchange and queue, but we haven't set it up yet.

The event response looks like:
```
{
	"removed":false,
	"logIndex":387,
	"transactionIndex":196,
	"transactionHash":"0x01a18bd126ce780ccf3c7472a030d6d913ea5addb8d113b957c9913d6d1889f7",
	"blockHash":"0x63b88f2f8c6a62ad1990185035c503f3cd3e9271f8f944309c1a7dedc94c6dc5",
	"blockNumber":13709632,
	"address":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
	"id":"log_0f70433c",
	"returnValues": {
		"0":"0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
		"1":"0xfffAE4A0F4AC251F4705717cD24CaDcCc9f33E06",
		"2":"185000000000000000",
		"src":"0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
		"dst":"0xfffAE4A0F4AC251F4705717cD24CaDcCc9f33E06",
		"wad":"185000000000000000"
	},
	"event":"Transfer",
	"signature":"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	"raw": {
		"data":"0x0000000000000000000000000000000000000000000000000291408513728000",
		"topics":[
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			"0x000000000000000000000000d9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
			"0x000000000000000000000000fffae4a0f4ac251f4705717cd24cadccc9f33e06"
		]
	}
}
```

NOTE: The `exchange` and `queue` don't need to be created manually. They are created in the next step.

### 2. Creating the data_loader config
The config file for `data_loader` has the following structure:
```
[
  {
    "exchange": "uniswap.tx",
    "queue": "uniswap.tx.transfer",
    "tableName": "uniswap_tx_transfer",
    "ABI2TableMap": {
      "txhash": "transactionHash",
      "contractAddress": "address",
      "blockNumber": "blockNumber",
      "event": "event",
      "signature": "signature",
      "sender": "returnValues.src",
      "recipient": "returnValues.dst",
      "total": "returnValues.wad"
    }
  }
]
```

The first two fields will allow the `data_loader` to create the corresponding `exchange` and `queue` in the RabbitMQ server (if they don't exist already).
This config will tell the `data_loader` which query to listen for data.
The `tableName` and`ABI2TableMap` fields tell the `data_loader` where and how to insert the data.

The `ABI2TableMap` field consists of fields like: `table_column_name : event_response_attribute_path`.
For example, if we had the response saved in the variable `response` and we wanted to access the `sender` attribute, we'd do:

```
let response = get_event_response();

let sender = response.returnValues.sender;
console.log('sender', sender);
```
The value for `event_response_attribute_path` would be `returnValues.sender`.
The value for `table_column_name` just indicates where we want to insert the value.

### 3. Creating DB table
First, get the event ABI and check which attributes are relevant for you.
Create table on adminer `http://localhost:8080` with respective datatypes.
Remember to include fields like `transactionHash` or `blockNumber` that are not part of the ABI, but part of the event response.

We want to create the table:
```
txhash -> text
contractAddress -> text
blockNumber -> bigint(20)
event -> text
signature -> text
sender -> text
recipient -> text
total -> double
```
Where only the last four fields are part of the ABI, the rest belong to the event data.

### All done, now test
To run your new changes, run:
```
sudo docker-compose up
```

## NOTES
Two config files are provided for the `listener`, `./eth_listener/config.json` and `./eth_listener/config_dual.json`.
The first listens only for Uniswap Swap events. The second one also listens for WETH Transfer events.
A single config file is provided for the `data_loader`, this works for both transactions types.
To change the config files used to run, modify the `volumes` in the `docker-compose.yaml` file.

Additionally, two `.env` files are needed for web3 credentials and DB credentials info.
This should be shared with you via email.

## Future Work
- Improve component code quality and modularity
- Add resilience to listener and data_loader modules to tolerate failed DB & RabbitMQ connections.
- Minify the data inserted to DB based on what's strictly necessary. (Mainly for WETH Transfer events)
- Allow for simpler configuration of multiple listener and data_loader modules for deployment in a distributed environment.
- Upgrade DB to something more robust and fitting based on intented use.
- Add tools for back-filling event data on startup (based on what's already on DB).
