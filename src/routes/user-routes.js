const express = require('express')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const jwt = require('jsonwebtoken')

const User = require('../db/user')
const Integration = require('../db/integration')
const Vipu = require('../integrations/vipu')
const Email = require('../utils/email.js')
const HiddenLayers = require('../integrations/hidden')

const router = express.Router()
const hiddenLayers = JSON.parse(fs.readFileSync('hidden_layers.json'))

const verificationSecret = process.env.JWT_VERIFICATION_SECRET

router.get('/profile', async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)

        res.json({
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            accountType: user.accountType,
            funnelState: user.funnelState,
            emailVerified: user.emailVerified,
        })
    } catch (err) {
        return next(err)
    }
})

router.put('/profile', async (req, res, next) => {
    try {
        const user = await User.updateById(req.user.id, req.body)
        res.json({
            email: user.email,
            name: user.name,
            phoneNumber: user.phoneNumber,
            accountType: user.accountType,
            funnelState: user.funnelState,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/integration', async (req, res, next) => {
    try {
        let integrations = await Integration.findByUserId(req.user.id)
        const user = await User.findById(req.user.id)

        if (user.emailVerified) {
            const updateCount = await HiddenLayers.initAll(user, integrations)

            if (updateCount > 0) {
                integrations = await Integration.findByUserId(req.user.id)
            }
        }

        const data = {}

        for (const key of Object.keys(integrations)) {
            const integration = {}
            integration.integrationType = integrations[key].integrationType
            integration.integrationStatus = integrations[key].integrationStatus
            integration.integrationData = integrations[key].integrationData

            data[key] = integration
        }

        res.json(data)
    } catch (err) {
        return next(err)
    }
})

router.put('/integration/:integrationType', async (req, res, next) => {
    try {
        await Integration.findByUserIdAndType(
            req.user.id,
            req.params.integrationType
        )

        const integration = await Integration.updateByUserIdAndType(
            req.user.id,
            req.params.integrationType,
            req.body
        )

        const data = {}
        data.integrationType = integration.integrationType
        data.integrationStatus = integration.integrationStatus
        data.integrationData = integration.integrationData

        res.json(data)
    } catch (err) {
        return next(err)
    }
})

router.delete('/integration/:integrationType', async (req, res, next) => {
    try {
        const oldIntegration = await Integration.findByUserIdAndType(
            req.user.id,
            req.params.integrationType
        )

        if (!oldIntegration) {
            res.status(404)
        }

        if (req.params.integrationType === 'vipu') {
            if (oldIntegration.integrationStatus === 'integrated') {
                await Vipu.removeData(req.user.id)
            }
        }

        await Integration.deleteByUserIdAndType(
            req.user.id,
            req.params.integrationType
        )

        res.status(200)
        res.json({ message: 'deleted' })
    } catch (err) {
        return next(err)
    }
})

router.post('/verify', async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        if (user) {
            const expiresIn = 86400

            const body = { email: user.email }
            const ts = Math.floor(Date.now())
            const token = jwt.sign({ user: body }, verificationSecret, {
                expiresIn: expiresIn,
            })

            await Email.sendVerification(user.email, token)

            res.status(200)
            res.json({ message: 'verification email sent' })
        }
    } catch (err) {
        return next(err)
    }
})

router.post('/integration/:integrationType', async (req, res, next) => {
    for (const layer in hiddenLayers) {
        if (layer === req.params.integrationType) {
            res.status(403)
        }
    }

    try {
        integration = await Integration.create(
            req.user.id,
            req.params.integrationType,
            req.body
        )

        const data = {}
        data.integrationType = integration.integrationType
        data.integrationStatus = integration.integrationStatus
        data.integrationData = integration.integrationData

        res.status(200)
        res.json(data)
    } catch (err) {
        return next(err)
    }
})

router.get('/integration/:integrationType', async (req, res, next) => {
    try {
        const integration = await Integration.findByUserIdAndType(
            req.user.id,
            req.params.integrationType
        )

        const data = {}
        data.integrationType = integration.integrationType
        data.integrationStatus = integration.integrationStatus
        data.integrationData = integration.integrationData

        res.json(data)
    } catch (err) {
        return next(err)
    }
})

router.post('/integration/vipu/auth', async (req, res, next) => {
    try {
        const link = await Vipu.initAuth(req.user.id)
        res.json({
            authLink: link,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/integration/vipu/auth', async (req, res, next) => {
    try {
        const status = await Vipu.checkAuth(req.user.id)

        if (status === 'imported') {
            await Integration.updateByUserIdAndType(req.user.id, 'vipu', {
                integrationStatus: 'integrated',
            })
        }

        res.json({
            authStatus: status,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/data', async (req, res, next) => {
    try {
        await pipeline(
            fs.createReadStream('/data/' + req.user.id + '/' + req.query.file),
            async (data) => {
                data.pipe(res)
            }
        )
    } catch (err) {
        if (err.code && err.code === 'ENOENT') {
            return next({ status: 404, message: 'not found' })
        }
        return next(err)
    }
})

module.exports = router
