const utils = require('./utils')
const pool = require('./connection')

const updateableCols = ['integration_status', 'integration_data']

const create = async (userId, integrationType, values) => {
    try {
        const q = utils.valuesToInsertString(values, updateableCols, 2)
        res = await pool.query(
            `
            INSERT INTO user_integration (user_account_id, integration_type${q.cols}) 
            VALUES ($1, $2${q.vars})
            RETURNING *
            `,
            [userId, integrationType].concat(q.vals)
        )

        return utils.parseRows(res.rows)
    } catch (err) {
        if (err.code === '23505') {
            throw {
                status: 409,
                message: 'integration already exists',
            }
        }
        throw err
    }
}

const findByUserId = async (userId) => {
    try {
        res = await pool.query(
            `SELECT * FROM user_integration WHERE user_account_id = $1`,
            [userId]
        )
        
        return utils.parseRows(res.rows, false, "integration_type")
    } catch (err) {
        throw err
    }
}

const findByUserIdAndType = async (userId, integrationType) => {
    try {
        res = await pool.query(
            `SELECT * FROM user_integration WHERE user_account_id = $1 AND integration_type = $2`,
            [userId, integrationType]
        )

        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'integration not found',
            }
        }

        return utils.parseRows(res.rows)
    } catch (err) {
        throw err
    }
}

const updateByUserIdAndType = async (userId, integrationType, values) => {
    const q = utils.valuesToUpdateString(values, updateableCols, 2)
    try {
        res = await pool.query(
            `UPDATE user_integration SET ${q.vars} WHERE user_account_id = $1 AND integration_type = $2 RETURNING *`,
            [userId, integrationType].concat(q.vals)
        )

        
        if (res.rows.length === 0) {
            throw {
                status: 404,
                message: 'integration not found',
            }
        }

        return utils.parseRows(res.rows)
    } catch (err) {
        throw err
    }
}

const user_integration = { create, findByUserId, findByUserIdAndType, updateByUserIdAndType }

module.exports = user_integration
