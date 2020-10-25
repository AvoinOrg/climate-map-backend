const bcrypt = require('bcrypt')

const utils = require('./utils')
const pool = require('./connection')

const create = async (values) => {
    try {
        const con = await pool.connect()
        const hash = await bcrypt.hash(values.password, 10)

        res = await con.query(
            `
            INSERT INTO user_account (email, password, name, phone_number, type) 
            VALUES($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [values.email, hash, values.name, values.phone_number, values.type]
        )

        return utils.parseRow(res.rows)
    } catch (err) {
        if (err.code === '23505') {
            throw {
                status: 409,
                message: 'email address already in use',
            }
        }

        throw err
    }
}

const findByEmail = async (email) => {
    try {
        const con = await pool.connect()
        res = await con.query(`SELECT * FROM user_account WHERE email = $1`, [
            email,
        ])

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const findById = async (id) => {
    try {
        const con = await pool.connect()
        res = await con.query(`SELECT * FROM user_account WHERE id = $1`, [id])

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const isValidPassword = async (user, password) => {
    let compare = false
    if (user) {
        compare = await bcrypt.compare(password, user.password)
    }
    return compare
}

const User = { create, findByEmail, findById, isValidPassword }

module.exports = User
