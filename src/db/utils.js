module.exports = {
    parseRows: (rows, single = true, index = null) => {
        if (!single) {
            vals = index ? {} : []

            if (!rows || rows.length === 0) {
                return vals
            }

            for (row in rows) {
                if (index) {
                    indexVal = row[index]
                    delete row[index]
                    vals[indexVal] = row
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

    valuesToUpdateString: (values, allowed, colsBefore = 1) => {
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

    valuesToInsertString: (values, allowed, colsBefore = 1) => {
        let cols = ''
        let vars = ''
        let i = colsBefore + 1
        const vals = []

        if (colsBefore >= 1) {
            vars += ", "
            cols += ", "
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
