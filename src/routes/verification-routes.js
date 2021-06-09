const express = require('express')

const User = require('../db/user')

const router = express.Router()

router.post('', async (req, res, next) => {
    try {
        const user = await User.findByEmail(req.user.email)

        if (user.emailVerified === 1) {
            res.status(409)
            res.json({ message: 'email has already been verified', email: user.email })
        }

        await User.setEmailVerificationById(user.id, 1)

        res.status(200)
        res.json({ message: 'email verified', email: user.email })
    } catch (err) {
        return next(err)
    }
})

module.exports = router
