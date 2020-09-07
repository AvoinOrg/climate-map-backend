const bcrypt = require('bcrypt')

const pool = require('./connection')

const parseRow = (rows) => {
    if (rows[0]) {
        return {
            email: rows[0].email,
            password: rows[0].pw
        }
    }
    throw {
        status: 404,
        message: 'user not found',
    }
}

const create = async (email, password) => {
    try {
        const con = await pool.connect()
        const hash = await bcrypt.hash(password, 10)

        res = await con.query(
            `INSERT INTO account (email, pw) VALUES($1, $2) RETURNING *`,
            [email, hash]
        )

        return parseRow(res.rows)

    } catch (e) {
        if (e.code === '23505') {
            throw {
                status: 409,
                message: 'email address already in use',
            }
        }

        throw e
    }
}

const find = async (email) => {
    try {
        const con = await pool.connect()
        res = await con.query(`SELECT * FROM account WHERE email = $1`, [email])

        return parseRow(res.rows)
    } catch (e) {
        throw e
    }
}

const save = async (next) => {
    //'this' refers to the current document about to be saved
    const user = this
    //Hash the password with a salt round of 10, the higher the rounds the more secure, but the slower
    //your application becomes.
    const hash = await bcrypt.hash(this.password, 10)
    //Replace the plain text password with the hash and then store it
    this.password = hash
    //Indicates we're done and moves on to the next middleware
    next()
}

const isValidPassword = async (user, password) => {
    console.log(user.password)
    console.log(password)
    const compare = await bcrypt.compare(password, user.password)
    return compare
}

const User = { create, find, isValidPassword }

module.exports = User
