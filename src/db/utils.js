module.exports = {
    parseRow: (rows) => {
        if (rows[0]) {
            return rows[0]
        }
        return null
    },

    valuesToUpdateString: (values, allowed) => {
        let s = ''
        let i = 2
        const vals = []

        for (v in values) {
            if (allowed.includes(v)) {
                s += `${v} = $${i}, `
                vals.push(values[v])
                i++
            }
        }

        s = s.substr(0, s.length - 2)
        q = { string: s, values: vals }

        return q
    },
}
