const express = require('express')
const fs = require('fs')
const { pipeline } = require('stream/promises')

const User = require('../db/user')
const Integration = require('../db/integration')
const Vipu = require('../integrations/vipu')

const router = express.Router()

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
        const integration = await Integration.findByUserId(req.user.id)

        res.json(integration)
    } catch (err) {
        return next(err)
    }
})

router.put('/integration/:integrationType', async (req, res, next) => {
    try {
        const oldIntegration = await Integration.findByUserIdAndType(
            req.user.id,
            req.params.integrationType
        )

        const integration = await Integration.updateByUserIdAndType(
            req.user.id,
            req.params.integrationType,
            req.body
        )
        res.json(integration)
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
            if (oldIntegration.integration_status === 'integrated') {
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

router.post('/integration/:integrationType', async (req, res, next) => {
    try {
        integration = await Integration.create(
            req.user.id,
            req.params.integrationType,
            req.body
        )

        res.json(integration)
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

        res.json(integration)
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
