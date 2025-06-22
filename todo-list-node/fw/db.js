const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');

// Verbindung zur Datenbank herstellen
async function connectDB() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connected');
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

async function executeStatement(statement, parameters) {
    let conn = await connectDB();
    const [results, fields] = await conn.query(statement, parameters);
    return results;
}

module.exports = { connectDB: connectDB, executeStatement: executeStatement };
