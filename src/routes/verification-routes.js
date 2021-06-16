const express = require('express')
const fs = require('fs')

const User = require('../db/user')
const Integration = require('../db/integration')
const HiddenLayers = require('../integrations/hidden')

const router = express.Router()
const hiddenLayers = JSON.parse(fs.readFileSync('hidden_layers.json'))

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

router.post('', async (req, res, next) => {
    try {
        const user = await User.findByEmail(req.user.email)

        if (user.emailVerified === 1) {
            res.status(409)
            res.json({
                message: 'email has already been verified',
                email: user.email,
            })
            return
        }

        await User.setEmailVerificationById(user.id, 1)

        const domain = user.email.split('@')[1]
        const integrations = searchLayers(domain)

        await Promise.allSettled(
            integrations.map(async (integration) => {
                try {
                    await Integration.create(user.id, integration)
                    await HiddenLayers.initData(integration, user.id)
                    await Integration.updateByUserIdAndType(
                        user.id,
                        integration,
                        { integration_status: 'integrated' }
                    )
                } catch (err) {
                    if (!err.status || err.status !== 409) {
                        console.error(err)
                    }
                }
            })
        )

        res.json({ message: 'email verified', email: user.email })
        res.status(200)
    } catch (err) {
        return next(err)
    }
})

module.exports = router
