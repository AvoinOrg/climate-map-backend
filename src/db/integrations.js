const utils = require('./utils')
const pool = require('./connection')

const updateableCols = ['vipu_state', 'metsaan_state']

const create = async (values) => {
    try {
        res = await pool.query(
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
        res = await pool.query(
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
        res = await pool.query(
            `UPDATE user_integrations SET ${q.string} WHERE user_account_id = $1 RETURNING *`,
            [userId].concat(q.values)
        )

        return utils.parseRow(res.rows)
    } catch (err) {
        throw err
    }
}

const user_integrations = { create, findByUserId, updateByUserId }

module.exports = user_integrations
