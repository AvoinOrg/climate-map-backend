const bcrypt = require('bcrypt')

const utils = require('./utils')
const pool = require('./connection')

const updateableCols = ['has_vipu', 'has_metsaan']

const create = async (values) => {
    try {
        const con = await pool.connect()
        res = await con.query(
            `
            INSERT INTO user_integrations (user_account_id) 
            VALUES ($1)
            RETURNING *
            `,
            [values.user_id]
        )

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const findByUserId = async (userId) => {
    try {
        const con = await pool.connect()
        res = await con.query(
            `SELECT * FROM user_integrations WHERE user_account_id = $1`,
            [userId]
        )

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const updateByUserId = async (userId, values) => {
    const q = utils.valuesToUpdateString(values, updateableCols)

    try {
        const con = await pool.connect()
        res = await con.query(
            `UPDATE user_integrations SET ${q.string} WHERE user_account_id = $1`,
            [userId] + q.values
        )

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const user_integrations = { create, findByUserId, updateByUserId }

module.exports = user_integrations
