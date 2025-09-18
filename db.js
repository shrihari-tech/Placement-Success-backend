const mysql = require('mysql2/promise');  
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: process.env.WAITFORCONNECTION === 'true',
    connectionLimit: parseInt(process.env.CONNECTIONLIMIT) || 10,
    queueLimit: parseInt(process.env.QUEUELIMIT) || 0
})

module.exports = pool;