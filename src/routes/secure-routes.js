const express = require('express')
const fse = require('fs-extra')
const { pipeline } = require('stream/promises')

const User = require('../db/user')
const Integrations = require('../db/integrations')
const Vipu = require('../integrations/vipu')
const JSONStream = require('JSONStream')

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

router.get('/integrations', async (req, res, next) => {
    try {
        const integrations = await Integrations.findByUserId(req.user.id)
        res.json({
            vipu_state: integrations.vipu_state,
            metsaan_state: integrations.metsaan_state,
        })
    } catch (err) {
        return next(err)
    }
})

router.put('/integrations', async (req, res, next) => {
    try {
        const integrations = await Integrations.updateByUserId(
            req.user.id,
            req.body
        )
        res.json({
            vipu_state: integrations.vipu_state,
            metsaan_state: integrations.metsaan_state,
        })
    } catch (err) {
        return next(err)
    }
})

router.post('/integrations/vipu/init', async (req, res, next) => {
    try {
        const link = await Vipu.initAuth(
            req.user.id,
            req.params.integration_type
        )
        res.json({
            integration_link: link,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/integrations/vipu/status', async (req, res, next) => {
    try {
        const status = await Vipu.checkAuth(req.user.id)

        if (status === 2) {
            await Integrations.updateByUserId(req.user.id, { vipu_state: 1 })
        }

        res.json({
            integration_status: status,
        })
    } catch (err) {
        return next(err)
    }
})

router.get('/data', async (req, res, next) => {
    try {
        await pipeline(
            fse.createReadStream('/data/' + req.user.id + '/' + req.query.file),
            async (data) => {
                data.pipe(JSONStream.parse()).pipe(res)
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
