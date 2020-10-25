const express = require('express')

const User = require('../db/user')
const Integrations = require('../db/integrations')

const router = express.Router()

router.get('/profile', async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.json({
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
    })
})

router.get('/integrations', async (req, res, next) => {
    let integrations = await Integrations.findByUserId(req.user.id)
    if (!integrations) {
        integrations = await Integrations.create({user_id: req.user.id})
    }
    res.json({
        has_vipu: integrations.has_vipu,
        has_metsaan: integrations.has_metsaan,
    })
})

module.exports = router
