const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')

const router = express.Router()

const secret = process.env.JWT_SECRET

const handleLogin = async (req, res, next, strategy) => {
    passport.authenticate(strategy, async (err, user) => {
        try {
            if (err) {
                return next(err)
            }

            req.login(user, { session: false }, async (err) => {
                if (err) {
                    return next(err)
                }
                const body = { id: user.id, email: user.email }
                const token = jwt.sign({ user: body }, secret)
                return res.json({ token })
            })
        } catch (e) {
            return next(e)
        }
    })(req, res, next)
}

router.post('/signup', async (req, res, next) => {
    handleLogin(req, res, next, 'signup')
})

router.post('/login', async (req, res, next) => {
    handleLogin(req, res, next, 'login')
})

module.exports = router
