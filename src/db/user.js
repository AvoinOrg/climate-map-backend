const bcrypt = require('bcrypt')

const pool = require('./connection')

const parseRow = (rows) => {
    if (rows[0]) {
        return {
            email: rows[0].email,
            password: rows[0].pw,
        }
    }
    return null
}

const save = async (values) => {
    try {
        const con = await pool.connect()
        const hash = await bcrypt.hash(values.password, 10)

        res = await con.query(
            `
            INSERT INTO account (email, pw, name, phone_number) 
            VALUES($1, $2, $3, $4)
            RETURNING *
            `,
            [
                values.email,
                hash,
                values.name ? values.name : null,
                values.phoneNumber ? values.phoneNumber : values.phoneNumber,
            ]
        )

        return parseRow(res.rows)
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

const find = async (email) => {
    try {
        const con = await pool.connect()
        res = await con.query(`SELECT * FROM account WHERE email = $1`, [email])

        return parseRow(res.rows)
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

const User = { save, find, isValidPassword }

module.exports = User
