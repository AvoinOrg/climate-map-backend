const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const JWTstrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const User = require('../db/user')

passport.use(
    'login',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email, password, done) => {
            try {
                const user = await User.findByEmail(email)
                const validate = await User.isValidPassword(user, password)

                if (!validate) {
                    return done({
                        status: 401,
                        message: 'invalid username or password',
                    })
                }
                return done(null, user, { message: 'logged in successfully' })
            } catch (err) {
                if (err.status === 404) {
                    return done({
                        status: 401,
                        message: 'invalid username or password',
                    })
                }
                done(err)
            }
        }
    )
)

passport.use(
    'loginJWT',
    new JWTstrategy(
        {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJWT.fromUrlQueryParameter('token'),
        },
        async (token, done) => {
            try {
                return done(null, token.user)
            } catch (err) {
                done(err)
            }
        }
    )
)

passport.use(
    'verificationJWT',
    new JWTstrategy(
        {
            secretOrKey: process.env.JWT_VERIFICATION_SECRET,
            jwtFromRequest: ExtractJWT.fromUrlQueryParameter('token'),
        },
        async (token, done) => {
            try {
                return done(null, token.user)
            } catch (err) {
                done(err)
            }
        }
    )
)
