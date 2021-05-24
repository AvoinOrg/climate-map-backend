const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')

const User = require('../db/user')
const Integration = require('../db/integration')
const { findByEmail } = require('../db/user')

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
                const ts = Math.floor(Date.now())
                const token = jwt.sign({ user: body }, secret, {
                    expiresIn: expiresIn,
                })

                return res.json({
                    token,
                    expires: ts + expiresIn * 1000,
                })
            })
        } catch (err) {
            return next(err)
        }
    })(req, res, next)
}

router.post('/signup', async (req, res, next) => {
    try {
        await User.create(req.body)
        handleLogin(req, res, next)
    } catch (err) {
        return next(err)
    }
})

router.post('/login', async (req, res, next) => {
    try {
        handleLogin(req, res, next)
    } catch (err) {
        return next(err)
    }
})

module.exports = router
