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
    phone_number: '+358 2739556',
    account_type: 'supporter',
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

it('fetching profile with token works', async (done) => {
    const res = await request.get('/user/profile').query({ token })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe(user.name)
    expect(res.body.email).toBe(user.email)
    expect(res.body.phone_number).toBe(user.phone_number)
    expect(res.body.account_type).toBe(user.account_type)
    done()
})

it('fetching profile with wrong token fails', async (done) => {
    const res = await request.get('/user/profile').query({ token: 'asdf' })
    expect(res.status).toBe(401)
    expect(res.body.name).not.toBeDefined()
    expect(res.body.email).not.toBeDefined()
    expect(res.body.phone_number).not.toBeDefined()
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

it('updating user password works', async (done) => {
    const newPassword = 'ggasdfasg'
    let res = await request.put('/user/profile').query({ token }).send({
        password: user.password,
        new_password: newPassword,
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

it('fetching user integrations with token works', async (done) => {
    const res = await request.get('/user/integrations').query({ token })
    expect(res.status).toBe(200)
    expect(res.body.metsaan_state).toBe(-1)
    expect(res.body.vipu_state).toBe(-1)
    done()
})

it('updating user integrations works', async (done) => {
    const res = await request
        .put('/user/integrations')
        .query({ token })
        .send({ metsaan_state: 0, vipu_state: 0 })
    expect(res.status).toBe(200)
    expect(res.body.metsaan_state).toBe(0)
    expect(res.body.metsaan_state).toBe(0)
    done()
})

it('fetching vipu authentication link works', async (done) => {
    const res = await request
        .post('/user/integrations/vipu/init')
        .query({ token })
    expect(res.status).toBe(200)
    expect(res.body.integration_link).toBeDefined()
    done()
})

it('vipu authentication status works', async (done) => {
    const res = await request
        .get('/user/integrations/vipu/status')
        .query({ token })
    expect(res.status).toBe(200)
    expect(res.body.integration_status).toBe(0)
    done()
})
