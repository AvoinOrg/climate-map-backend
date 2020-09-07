const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const JWTstrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const User = require('../db/user')

passport.use(
    'signup',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await User.create(email, password)
                return done(null, user)
            } catch (e) {
                return done(e)
            }
        }
    )
)

passport.use(
    'login',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await User.find(email)
                const validate = await User.isValidPassword(user, password)
                if (!validate) {
                    return done({ status: 401, message: 'invalid password' })
                }
                return done(null, user, { message: 'logged in successfully' })
            } catch (e) {
                done(e)
            }
        }
    )
)

passport.use(
    new JWTstrategy(
        {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJWT.fromBodyField('token'),
        },
        async (token, done) => {
            try {
                return done(null, token.user)
            } catch (e) {
                done(e)
            }
        }
    )
)
