const express = require('express')
const passport = require('passport')
const cors = require('cors')

require('./utils/auth')
const routes = require('./routes/routes')
const userRoutes = require('./routes/user-routes')
const verificationRoutes = require('./routes/verification-routes')

const app = express().use("*", cors())

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//     )
//     res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS')
//     next()
// })

app.use('/', routes)
app.use('/user', passport.authenticate('loginJWT', { session: false }), userRoutes)
app.use('/verify', passport.authenticate('verificationJWT', { session: false }), verificationRoutes)

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
