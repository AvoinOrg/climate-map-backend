const bcrypt = require('bcrypt')

const utils = require('./utils')
const pool = require('./connection')

const updateableCols = [
    'email',
    'name',
    'password',
    'phone_number',
    'account_type',
    'funnel_state',
]

const create = async (values) => {
    try {
        const hash = await bcrypt.hash(values.password, 10)

        res = await pool.query(
            `
            INSERT INTO user_account (email, password, name, phone_number, account_type) 
            VALUES($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                values.email,
                hash,
                values.name,
                values.phoneNumber,
                values.accountType,
            ]
        )
        return utils.parseRows(res.rows)
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
        res = await pool.query(`SELECT * FROM user_account WHERE email = $1`, [
            email,
        ])

        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'user not found',
            }
        }

        return utils.parseRows(res.rows)
    } catch (err) {
        throw err
    }
}

const findById = async (id) => {
    try {
        res = await pool.query(`SELECT * FROM user_account WHERE id = $1`, [id])

        
        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'user not found',
            }
        }

        return utils.parseRows(res.rows)
    } catch (err) {
        throw err
    }
}

const updateById = async (id, values) => {
    try {
        const user = await findById(id)

        const keys = Object.keys(values)

        if (
            keys.includes('password') ||
            keys.includes('email') ||
            keys.includes('name') ||
            keys.includes('phoneNumber')
        ) {
            if (!isValidPassword(user, values.password)) {
                throw {
                    status: 409,
                    message: 'invalid password',
                }
            }
        }

        if (values.newPassword) {
            const hash = await bcrypt.hash(values.newPassword, 10)
            values.password = hash
        } else {
            delete values.password
        }

        const q = utils.valuesToUpdateString(values, updateableCols)

        res = await pool.query(
            `UPDATE user_account SET ${q.vars} WHERE id = $1 RETURNING *`,
            [id].concat(q.vals)
        )

        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'user not found',
            }
        }

        return utils.parseRows(res.rows)
    } catch (err) {
        throw err
    }
}

const setEmailVerificationById = async (id, val) => {
    try {
        res = await pool.query(
            `UPDATE user_account SET email_verified = $2 WHERE id = $1 RETURNING *`,
            [id, val]
        )

        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'user not found',
            }
        }

        return utils.parseRows(res.rows)
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

const User = { create, findByEmail, findById, updateById, isValidPassword, setEmailVerificationById }

module.exports = User
