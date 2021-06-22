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
let verificationToken = ''

const user = {
    email: 'asdf@asdf.com',
    password: 'asdfg1234',
    name: 'Tero Testington',
    phoneNumber: '+358 2739556',
    accountType: 'supporter',
}

const createClient = () => {
    return new Client({
        host: process.env.POSTGRES_HOST,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
        query_timeout: 1000,
    })
}

const client = createClient()
client.connect()

beforeAll(async () => {
    // await client.query(dropTableQuery, (err, res) => {
    //     client.end()
    // })
    await client.query(dropTableQuery)
    await client.query(createTableQuery)
})

afterAll(async () => {
    await client.query(`SELECT * FROM user_account WHERE email = $1`, [
        user.email,
    ])
    const id = res.rows[0].user_account_id
    await client.end()

    fs.rmdirSync('/data/' + id, { recursive: true })
})

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
    user.email = 'dd@test.test'
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

it('mock verification email sending works', async (done) => {
    const consoleSpy = jest.spyOn(console, 'debug')
    const res = await request.post('/user/verify').query({ token })
    expect(res.status).toBe(200)

    // find token sent to email so that the account can be verified
    for (const a of consoleSpy.mock.calls) {
        const parts = a[0].split(': ')
        if (parts[0] === 'email token') {
            expect(parts[1].length).toBeGreaterThan(0)

            verificationToken = parts[1]
            break
        }
    }
    done()
})

it('email verification works', async (done) => {
    const res = await request
        .post('/verify')
        .query({ token: verificationToken })

    expect(res.status).toBe(200)
    done()
})

it('fetch new integrations after verification work', async (done) => {
    const res = await request.get('/user/integration').query({ token })

    expect(res.status).toBe(200)
    expect(res.body['hidden-layer'].integrationStatus).toBe('integrated')
    expect(res.body['another-hidden-layer'].integrationStatus).toBe(
        'integrated'
    )
    done()
})

it('fetching hidden integration data works', async (done) => {
    const res = await request
        .get('/user/data')
        .query({ token, file: 'some-data/stuff.geojson' })

    expect(res.status).toBe(200)
    done()
})

it('fetching hidden integration data from a nested folder works', async (done) => {
    const res = await request
        .get('/user/data')
        .query({ token, file: 'test-layer-xyz/0/0/0.png' })

    expect(res.status).toBe(200)
    done()
})
