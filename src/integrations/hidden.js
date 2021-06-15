const fs = require('fs')

const hiddenDataDir = process.env.HIDDEN_DATA_DIR
const hiddenLayers = JSON.parse(fs.readFileSync('hidden_layers.json'))

const initData = async (layer, userId) => {
    let path = '/data/' + userId

    if (!fs.existsSync(path)) {
        await fs.promises.mkdir(path, { recursive: true })
    }

    path += '/'

    await Promise.all(
        hiddenLayers[layer].fileNames.map(async (fileName) => {
            try {
                await fs.promises.symlink(
                    hiddenDataDir + '/' + layer + '/' + fileName,
                    path + fileName
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
        hiddenLayers[layer].fileNames.map(async (fileName) => {
            try {
                fs.unlinkSync(path + fileName)
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err
                }
            }
        })
    )
}

module.exports = { initData, removeData }
