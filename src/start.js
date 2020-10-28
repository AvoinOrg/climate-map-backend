const app = require('./server')

app.listen(8080, () => {
    console.log('> Ready on http://localhost:' + 8080)
})
