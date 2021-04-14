const xml2js = require('xml2js')
const axios = require('axios')
const util = require('util')
const ogr2ogr = require('ogr2ogr')
const fs = require('fs')
const { pipeline } = require('stream/promises')

const opengateUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.OPENGATE_URL
        : process.env.OPENGATE_TEST_URL

const wfsUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.WFS_URL
        : process.env.WFS_TEST_URL

const features = [
    { name: 'mavi:PELTOLOHKO', path: 'peltolohko.geojson' },
    { name: 'mavi:KASVULOHKOGEOMETRIA', path: 'kasvulohkogeometria.geojson' },
]

const statuses = {}
const vetumaIds = {}

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
        statuses[userId] = 'initialized'

        return link
    } catch (err) {
        throw err
    }
}

const opengateInit = async () => {
    var data = `<?xml version="1.0" ?>
        \n<!DOCTYPE viesti PUBLIC "-//MMM//DTD Autentikointiviesti 1.1//FI" "${opengateUrl}/viesti_1_1.dtd">
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
        if (statuses[userId] === 'initialized') {
            const data = await opengateCheck(vetumaIds[userId])

            parsed = await parseXml(data)
            const done = parsed['viesti']['$']['valmis']
            if (done === 'true' && statuses[userId] === 'initialized') {
                delete vetumaIds[userId]
                importFields(userId, data)
                statuses[userId] = 'authenticated'
            }
        }

        return statuses[userId]
    } catch (err) {
        statuses[userId] = 'error'
        return 'error'
    }
}

const opengateCheck = async (vetumaId) => {
    const data = `<?xml version="1.0" ?>
    \n<!DOCTYPE viesti PUBLIC "-//MMM//DTD Autentikointiviesti 1.2//FI" "${opengateUrl}/viesti_1_2.dtd">
    \n<viesti valmis="false" versio="1.2">
    \n    <data nimi="VETUMAISTUNTOID" arvo="${vetumaId}"/>
    \n    <data nimi="KIRJAUTUMISTYYPPI" arvo="WEB-ERILLIS"/>
    \n    <data nimi="PALVELUID" arvo="TUKISOV_AS"/>
    \n    <data nimi="KIELI" arvo="fi.FI"/>
    \n</viesti>`

    const config = {
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

const getFeature = async (wfsUrl, sessionId, featureName, path) => {
    const data = await fetchData(wfsUrl, sessionId, featureName)

    await pipeline(
        ogr2ogr(data)
            .format('GeoJSON')
            .options(['-s_srs', 'EPSG:3067', '-t_srs', 'EPSG:4326'])
            .stream(),
        async (stream) => {
            stream.pipe(fs.createWriteStream(path))
        }
    )
}

const importFields = async (userId, data) => {
    try {
        const wfsData = await registerWfs(data)
        const parsed = await parseXml(wfsData)

        const sessionId = parsed['turvattu-paikkatieto']['istuntokoodi'][0]
        const wfsUrl = parsed['turvattu-paikkatieto']['palvelu'].find(
            (el) => el['$']['tyyppi'] === 'WFS'
        )['_']

        const path = '/data/' + userId
        if (!fs.existsSync(path)) {
            await fs.promises.mkdir(path, { recursive: true })
        }

        await Promise.all([
            features.map((feature) => {
                getFeature(
                    wfsUrl,
                    sessionId,
                    feature.name,
                    `${path}/${feature.path}`
                )
            }),
        ])

        statuses[userId] = 'imported'
    } catch (err) {
        statuses[userId] = 'error'
        console.error(err)
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

const removeData = async (userId) => {
    const path = '/data/' + userId + '/'

    for (feature of features) {
        try {
            fs.unlinkSync(path + feature.path)
        } catch (err) {
            if (err.code != "ENOENT") {
                throw (err)
            }
        }
    }
}

module.exports = { initAuth, checkAuth, removeData }
