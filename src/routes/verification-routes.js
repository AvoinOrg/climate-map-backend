const express = require('express')

const User = require('../db/user')
const HiddenLayers = require('../integrations/hidden')

const router = express.Router()

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

        await HiddenLayers.initAll(user)

        res.json({ message: 'email verified', email: user.email })
        res.status(200)
    } catch (err) {
        return next(err)
    }
})

module.exports = router
