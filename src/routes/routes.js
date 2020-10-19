const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')

const User = require('../db/user')

const router = express.Router()

const secret = process.env.JWT_SECRET

const handleLogin = async (req, res, next) => {
    passport.authenticate('login', async (err, user) => {
        try {
            if (err) {
                return next(err)
            }

            req.login(user, { session: false }, async (err) => {
                if (err) {
                    return next(err)
                }
                const expiresIn = 86400

                const body = { id: user.id }
                const token = jwt.sign(
                    { user: body, ts: Math.floor(Date.now() / 1000) },
                    secret,
                    {
                        expiresIn: expiresIn,
                    }
                )

                return res.json({
                    token: 'Bearer ' + token,
                    expires: expiresIn,
                })
            })
        } catch (err) {
            return next(err)
        }
    })(req, res, next)
}

router.post('/signup', async (req, res, next) => {
    try {
        await User.save(req.body)
    } catch (err) {
        return next(err)
    }
    handleLogin(req, res, next)
})

router.post('/login', async (req, res, next) => {
    handleLogin(req, res, next)
})

module.exports = router
