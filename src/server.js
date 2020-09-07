const express = require('express')
const passport = require('passport')
const bodyParser = require('body-parser')

require('./auth/auth')
const routes = require('./routes/routes')
const secureRoutes = require('./routes/secure-routes')

const app = express()
const port = 8080

app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', routes)
app.use('/user', passport.authenticate('jwt', { session: false }), secureRoutes)

app.get('*', (req, res) => {
    console.log('catch')
    res.status(404)
    res.json({ error: 'not found' })
})

app.use((err, req, res, next) => {
    console.log(err)
    res.status(err.status || 500)
    res.json({ error: err })
})

app.listen(8080, () => {
    console.log('here!')
    console.log('> Ready on http://localhost:' + port)
})
