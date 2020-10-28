const xml2js = require('xml2js')
const axios = require('axios')
const util = require('util')
const fse = require('fs-extra')

const opengateUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.OPENGATE_URL
        : process.env.OPENGATE_TEST_URL

const wfsUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.WFS_URL
        : process.env.WFS_TEST_URL

const statuses = {}
const vetumaIds = {}

const wfsVals = {}

const parseXml = async (data) => {
    const parser = new xml2js.Parser()
    const parsed = await util.promisify(parser.parseString.bind(parser))(data)

    return parsed
}

const initAuth = async (userId) => {
    const data = await opengateInit()

    try {
        const parser = new xml2js.Parser()
        const parsed = await util.promisify(parser.parseString.bind(parser))(
            data
        )

        const link =
            parsed['viesti']['ulkoinenkirjautuminen'][0][
                'ulkoinenkirjautuminen-url'
            ][0]['_']

        const vetumaId = parsed['viesti']['data'][0]['$']['arvo']

        vetumaIds[userId] = vetumaId
        statuses[userId] = 0

        return link
    } catch (err) {
        throw err
    }
}

const opengateInit = async () => {
    var data = `<?xml version="1.0" ?>
        \n<!DOCTYPE viesti PUBLIC "-//MMM//DTD Autentikointiviesti 1.1//FI" "http://opengate-test.mmmtike.fi/viesti_1_1.dtd">
        \n<viesti valmis="false" versio="1.2">
        \n    <data nimi="PALVELUID" arvo="TUKISOV_AS"/>
        \n    <data nimi="KIRJAUTUMISTYYPPI" arvo="WEB-ERILLIS"/>
        \n    <data nimi="KIELI" arvo="fi.FI"/>
        \n</viesti>`

    var config = {
        method: 'post',
        url: opengateUrl + '/authenticate',
        headers: {
            'Content-Type': 'text/plain',
        },
        data: data,
    }

    try {
        const res = await axios(config)
        return res.data
    } catch (err) {
        throw err
    }
}

const checkAuth = async (userId) => {
    if (!(userId in statuses)) {
        throw {
            status: 401,
            message: 'authentication not initialized',
        }
    }

    try {
        if (statuses[userId] === 0) {
            const data = await opengateCheck(vetumaIds[userId])

            parsed = await parseXml(data)

            const done = parsed['viesti']['$']['valmis']
            if (done === 'true') {
                delete vetumaIds[userId]

                importFields(userId, data)

                statuses[userId] = 1
            }
        }

        return statuses[userId]
    } catch (err) {
        throw err
    }
}

const opengateCheck = async (vetumaId) => {
    const data = `<?xml version="1.0" ?>
    \n<!DOCTYPE viesti PUBLIC "-//MMM//DTD Autentikointiviesti 1.2//FI" "https://opengate-as-testi.soke.meta2.fi/viesti_1_2.dtd">
    \n<viesti valmis="false" versio="1.2">
    \n    <data nimi="VETUMAISTUNTOID" arvo="${vetumaId}"/>
    \n    <data nimi="KIRJAUTUMISTYYPPI" arvo="WEB-ERILLIS"/>
    \n    <data nimi="PALVELUID" arvo="TUKISOV_AS"/>
    \n    <data nimi="KIELI" arvo="fi.FI"/>
    \n</viesti>`

    const config = {
        method: 'post',
        url: 'https://opengate-as-testi.soke.meta2.fi/authenticate',
        headers: {
            'Content-Type': 'text/plain',
        },
        data: data,
    }

    try {
        const res = await axios(config)

        return res.data
    } catch (err) {
        throw err
    }
}

const importFields = async (userId, data) => {
    try {
        const wfsData = await registerWfs(data)
        const parsed = await parseXml(wfsData)

        const sessionId = parsed['turvattu-paikkatieto']['istuntokoodi'][0]
        const wfsUrl = parsed['turvattu-paikkatieto']['palvelu'].find(
            (el) => el['$']['tyyppi'] === 'WFS'
        )['_']

        const fieldData = await fetchData(
            wfsUrl,
            sessionId,
            'mavi:PERUSLOHKORAJA'
        )

        const fieldString = await JSON.stringify(fieldData)

        await fse.outputJSON('/data/' + userId + '/peltolohkoraja.geojson', fieldString)

        statuses[userId] = 2
    } catch (err) {
        console.error(err)
        statuses[userId] = -1
    }
}

const registerWfs = async (data) => {
    const config = {
        method: 'post',
        url: wfsUrl + '/geoserver/register2',
        headers: {
            'Content-Type': 'text/plain',
        },
        data: data,
    }

    try {
        const res = await axios(config)

        return res.data
    } catch (err) {
        throw err
    }
}

const fetchData = async (wfsUrl, sessionId, dataType) => {
    const config = {
        method: 'get',
        url: wfsUrl,
        params: {
            service: 'WFS',
            ID: sessionId,
            request: 'GetFeature',
            typeName: dataType,
            outputFormat: 'application/json',
        },
        headers: {
            'Content-Type': 'text/plain',
        },
    }

    try {
        const res = await axios(config)

        return res.data
    } catch (err) {
        throw err
    }
}

module.exports = { initAuth, checkAuth }