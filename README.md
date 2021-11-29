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
Then start all components by running:
```
sudo docker-compose up
```

## NOTES
Two config files are provided for the `listener`, `./eth_listener/config.json` and `./eth_listener/config_dual.json`.
The first listens only for Uniswap Swap events. The second one also listens for WETH Transfer events.
A single config file is provided for the `data_loader`, this works for both transactions types.

Additionally, two `.env` files are needed for web3 credentials and DB credentials info.
This should be shared with you via email.

## Future Work
- Improve component code quality and modularity
- Add resilience to listener and data_loader modules to tolerate failed DB & RabbitMQ connections.
- Minify the data inserted to DB based on what's strictly necessary. (Mainly for WETH Transfer events)
- Allow for simpler configuration of multiple listener and data_loader modules for deployment in a distributed environment.
- Upgrade DB to something more robust and fitting based on intented use.
