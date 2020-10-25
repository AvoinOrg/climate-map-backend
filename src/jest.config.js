module.exports = {}
process.env = Object.assign(process.env, { POSTGRES_DB: process.env.POSTGRES_TEST_DB })
