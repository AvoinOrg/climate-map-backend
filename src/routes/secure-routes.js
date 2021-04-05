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
            phone_number: user.phone_number,
            account_type: user.account_type,
            funnel_state: user.funnel_state,
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
            phone_number: user.phone_number,
            account_type: user.account_type,
            funnel_state: user.funnel_state,
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

        if (req.params.integrationType === 'vipu') {
            if (oldIntegration.integration_status === 1) {
                Vipu.removeData(req.user.id)
            }
        }

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
        const link = await Vipu.initAuth(
            req.user.id
        )
        res.json({
            auth_link: link,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/integration/vipu/auth', async (req, res, next) => {
    try {
        const status = await Vipu.checkAuth(req.user.id)

        if (status === 2) {
            await Integration.updateByUserId(req.user.id, "vipu", { integration_status: 1 })
        }

        res.json({
            auth_status: status,
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
