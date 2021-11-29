"use strict";
const mysql = require('mysql');

const dbHost = process.env.MYSQLDB_HOST;
const dbUser = process.env.MYSQLDB_USER;
const dbPass = process.env.MYSQL_ROOT_PASSWORD;
const dbName = process.env.MYSQLDB_DATABASE;

let con = null;

let mysqldb = {};
module.exports = mysqldb;


mysqldb.createConnection = async function() {
    con = mysql.createConnection({
        host: dbHost,
        database :dbName,
        user: dbUser,
        password: dbPass,
    });

    await con.connect();
    console.log("Connected to DB.");
}

mysqldb.insertData = async function(data, tableName) {
    let keys = "";
    let values = "";

    for (const key of Object.keys(data)) {
        const val = data[key];
        keys += `, ${key}`;
        values += `, "${val}"`;
    }

    keys = keys.substring(2);
    values = values.substring(2);

    const sql = `INSERT INTO ${tableName} (${keys}) VALUES (${values})`;
    await con.query(sql);
}