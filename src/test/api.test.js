const supertest = require('supertest')
const fs = require('fs')
const { Client } = require('pg')

const app = require('../server') // Link to your server file
const request = supertest(app)

const createTableQuery = fs
    .readFileSync('/sql_scripts/create_table.sql')
    .toString()
const dropTableQuery = fs.readFileSync('/sql_scripts/drop_table.sql').toString()

let token = ''

beforeAll(async () => {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    })
    await client.connect()

    // await client.query(dropTableQuery, (err, res) => {
    //     client.end()
    // })
    await client.query(dropTableQuery)
    await client.query(createTableQuery)
    await client.end()
})

const user = {
    email: 'asdf@asdf.com',
    password: 'asdfg1234',
    name: 'Tero Testington',
    phoneNumber: '+358 2739556',
    accountType: 'supporter',
}

it('404 works', async (done) => {
    const res = await request.get('/asdasdafssfasf')
    expect(res.status).toBe(404)
    done()
})

it('signup works', async (done) => {
    const res = await request.post('/signup').send(user)
    expect(res.status).toBe(200)
    expect(res.body.expires).toBeDefined()
    expect(res.body.token).toBeDefined()
    done()
})

it('signup with existing email fails', async (done) => {
    const res = await request.post('/signup').send(user)
    expect(res.status).toBe(409)
    expect(res.body.expires).not.toBeDefined()
    expect(res.body.token).not.toBeDefined()
    done()
})

it('login works', async (done) => {
    const res = await request
        .post('/login')
        .send({ email: user.email, password: user.password })
    expect(res.status).toBe(200)
    expect(res.body.expires).toBeDefined()
    expect(res.body.token).toBeDefined()
    token = res.body.token
    done()
})

it('login with wrong password fails', async (done) => {
    const res = await request
        .post('/login')
        .send({ email: user.email, password: 'asdasd' })
    expect(res.status).toBe(401)
    expect(res.body.expires).not.toBeDefined()
    expect(res.body.token).not.toBeDefined()
    done()
})

it('login with wrong email fails', async (done) => {
    const res = await request
        .post('/login')
        .send({ email: 'abc@ggg.com', password: user.password })
    expect(res.status).toBe(401)
    expect(res.body.expires).not.toBeDefined()
    expect(res.body.token).not.toBeDefined()
    done()
})

it('fetching profile with token works', async (done) => {
    const res = await request.get('/user/profile').query({ token })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe(user.name)
    expect(res.body.email).toBe(user.email)
    expect(res.body.phoneNumber).toBe(user.phoneNumber)
    expect(res.body.accountType).toBe(user.accountType)
    done()
})

it('fetching profile with wrong token fails', async (done) => {
    const res = await request.get('/user/profile').query({ token: 'asdf' })
    expect(res.status).toBe(401)
    expect(res.body.name).not.toBeDefined()
    expect(res.body.email).not.toBeDefined()
    expect(res.body.phoneNumber).not.toBeDefined()
    done()
})

it('updating user profile works', async (done) => {
    user.email = 'dd@gg.com'
    user.name = 'Bur Bo'
    const res = await request
        .put('/user/profile')
        .query({ token })
        .send({ email: user.email, name: user.name, password: user.password })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe(user.name)
    expect(res.body.email).toBe(user.email)
    done()
})

it('updating user funnel state works', async (done) => {
    const res = await request
        .put('/user/profile')
        .query({ token })
        .send({ funnelState: 2 })

    expect(res.status).toBe(200)
    expect(res.body.funnelState).toBe(2)
    done()
})

it('updating user password works', async (done) => {
    const newPassword = 'ggasdfasg'
    let res = await request.put('/user/profile').query({ token }).send({
        password: user.password,
        newPassword,
    })
    expect(res.status).toBe(200)

    res = await request
        .post('/login')
        .send({ email: user.email, password: newPassword })

    expect(res.status).toBe(200)
    expect(res.body.expires).toBeDefined()
    expect(res.body.token).toBeDefined()
    done()
})

it('fetching empty user integrations with token works', async (done) => {
    const res = await request.get('/user/integration').query({ token })
    expect(res.status).toBe(200)

    expect(res.body).toStrictEqual({})
    done()
})

it('fetching an empty user integration with token works', async (done) => {
    const res = await request.get('/user/integration/vipu').query({ token })
    expect(res.status).toBe(404)
    done()
})

it('adding vipu integration works', async (done) => {
    const data = { asdf: 'asdf' }
    const res = await request
        .post('/user/integration/vipu')
        .query({ token })
        .send({ integrationData: data })
    expect(res.status).toBe(200)
    expect(res.body.integrationData).toStrictEqual(data)
    done()
})

it('fetching user integrations with token works', async (done) => {
    const res = await request.get('/user/integration').query({ token })
    expect(res.status).toBe(200)
    expect(res.body.vipu).toBeDefined()
    done()
})

it('adding a second vipu integration fails', async (done) => {
    const data = { asdf: 'asdf' }
    const res = await request
        .post('/user/integration/vipu')
        .query({ token })
        .send({ integrationStatus: 1, integrationData: data })
    expect(res.status).toBe(409)
    done()
})

it('updating user integration works', async (done) => {
    const data = { asdf: 'asdf' }
    const res = await request
        .put('/user/integration/vipu')
        .query({ token })
        .send({ integrationStatus: 'integrated', integrationData: data })
    expect(res.status).toBe(200)
    expect(res.body.integrationStatus).toBe('integrated')
    expect(res.body.integrationData).toStrictEqual(data)
    done()
})

it('initiating vipu authentication link works', async (done) => {
    const res = await request
        .post('/user/integration/vipu/auth')
        .query({ token })
    expect(res.status).toBe(200)
    expect(res.body.authLink).toBeDefined()
    done()
})

it('vipu authentication status works', async (done) => {
    const res = await request
        .get('/user/integration/vipu/auth')
        .query({ token })
    expect(res.status).toBe(200)
    expect(res.body.authStatus).toBe('initialized')
    done()
})

it('vipu data deletion works', async (done) => {
    const res = await request.delete('/user/integration/vipu').query({ token })
    expect(res.status).toBe(200)
    done()
})

it('vipu data deletion returns 404 without integration', async (done) => {
    const res = await request.delete('/user/integration/vipu').query({ token })
    expect(res.status).toBe(404)
    done()
})
