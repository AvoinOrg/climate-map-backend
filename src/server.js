const express = require('express');
const { Pool } = require('pg')

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

const app = express();
app.get('*', (req, res) => {
    pool.connect().then(client => {
        client.query('select * from account', []).then(result => {
          console.log('hello from', result.rows[0].email)
          res.status(200).end()
        })
        .catch(e => {
          console.error('query error', e.message, e.stack)
          res.status(500).end()
        })
      })
});

const port = 8080

app.listen(8080, err => {
    if (err) {
        throw err;
    }
    console.log("> Ready on http://localhost:" + port);
})