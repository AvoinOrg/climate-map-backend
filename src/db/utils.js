const _ = require('lodash')

const keysToCamelCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map((v) => keysToCamelCase(v))
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [_.camelCase(key)]: keysToCamelCase(obj[key]),
            }),
            {}
        )
    }
    return obj
}

const keysToSnakeCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map((v) => keysToSnakeCase(v))
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [_.snakeCase(key)]: keysToSnakeCase(obj[key]),
            }),
            {}
        )
    }
    return obj
}

module.exports = {
    parseRows: (snakeRows, single = true, index = null) => {
        const rows = keysToCamelCase(snakeRows)

        if (!single) {
            vals = index ? {} : []

            if (!rows || rows.length === 0) {
                return vals
            }

            for (const i in rows) {
                if (index) {
                    const indexVal = rows[i][index]
                    delete rows[i][index]
                    vals[indexVal] = rows[i]
                } else {
                    vals.append(row)
                }
            }

            return vals
        } else {
            if (rows && rows[0]) {
                return rows[0]
            }
        }
        return null
    },

    valuesToUpdateString: (camelValues, allowed, colsBefore = 1) => {
        const values = keysToSnakeCase(camelValues)

        let vars = ''
        let i = colsBefore + 1
        const vals = []

        for (v in values) {
            if (allowed.includes(v)) {
                vars += `${v} = $${i}, `
                vals.push(values[v])
                i++
            }
        }

        vars = vars.substr(0, vars.length - 2)
        q = { vars, vals }

        return q
    },

    valuesToInsertString: (camelValues, allowed, colsBefore = 1) => {
        const values = keysToSnakeCase(camelValues)
        let cols = ''
        let vars = ''
        let i = colsBefore + 1
        const vals = []

        if (colsBefore >= 1) {
            vars += ', '
            cols += ', '
        }

        for (v in values) {
            if (allowed.includes(v)) {
                cols += `${v}, `
                vars += `$${i}, `
                vals.push(values[v])
                i++
            }
        }

        cols = cols.substr(0, cols.length - 2)
        vars = vars.substr(0, vars.length - 2)
        q = { cols, vars, vals }

        return q
    },
}
