const fs = require('fs')

const hiddenDataDir = process.env.HIDDEN_DATA_DIR

const hiddenLayerPath =
    process.env.NODE_ENV === 'test'
        ? 'hidden_layers.json.example'
        : 'hidden_layers.json'

const hiddenLayers = JSON.parse(fs.readFileSync(hiddenLayerPath))
const Integration = require('../db/integration')

const searchLayers = (domain) => {
    const integrations = []
    const d = domain.toLowerCase()

    for (const layer in hiddenLayers) {
        if (hiddenLayers[layer].allowedDomains.includes(d)) {
            integrations.push(layer)
        }
    }

    return integrations
}

const initData = async (layer, userId) => {
    let path = '/data/' + userId

    if (!fs.existsSync(path)) {
        await fs.promises.mkdir(path, { recursive: true })
    }

    path += '/'

    await Promise.all(
        hiddenLayers[layer].dirNames.map(async (dirName) => {
            try {
                await fs.promises.symlink(
                    hiddenDataDir + '/' + dirName,
                    path + dirName
                )
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    throw err
                }
            }
        })
    )
}

const removeData = async (layer, userId) => {
    const path = '/data/' + userId + '/'

    await Promise.all(
        hiddenLayers[layer].dirNames.map(async (dirName) => {
            try {
                fs.unlinkSync(path + dirName)
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err
                }
            }
        })
    )
}

const initAll = async (user, existingIntegrations = {}) => {
    const domain = user.email.split('@')[1]
    const integrations = searchLayers(domain)

    let updateCount = 0

    await Promise.allSettled(
        integrations.map(async (integration) => {
            if (!existingIntegrations[integration]) {
                try {
                    await Integration.create(user.id, integration)
                    await initData(integration, user.id)
                    await Integration.updateByUserIdAndType(
                        user.id,
                        integration,
                        {
                            integration_status: 'integrated',
                        }
                    )

                    updateCount++
                } catch (err) {
                    if (!err.status || err.status !== 409) {
                        console.error(err)
                    }
                }
            }
        })
    )

    return updateCount
}

module.exports = { initData, removeData, initAll }
