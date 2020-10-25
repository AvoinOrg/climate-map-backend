const express = require('express')
const passport = require('passport')
const bodyParser = require('body-parser')

require('./auth/auth')
const routes = require('./routes/routes')
const secureRoutes = require('./routes/secure-routes')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
})

app.use('/', routes)
app.use('/user', passport.authenticate('jwt', { session: false }), secureRoutes)

app.get('*', (req, res) => {
    res.status(404)
    res.json({ error: 'not found' })
})

app.use((err, req, res, next) => {
    !err.status && console.log(err)
    res.status(err.status || 500)
    res.json({ error: err })
})

module.exports = app
