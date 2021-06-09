const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

const REGION = process.env.SES_REGION
const SENDER = process.env.SENDER_EMAIL

const sesClient = new SESClient({ region: REGION })

const sendVerification = async (email, token) => {
    const body = `Welcome to use Avoin Map. Please click the link below to verify your account.
https://map.avoin.org/verify/${token}`

    const params = {
        Destination: {
            CcAddresses: [],
            ToAddresses: [email],
        },
        Message: {
            Body: {
                // Html: {
                //     Charset: 'UTF-8',
                //     Data: 'HTML_FORMAT_BODY',
                // },
                Text: {
                    Charset: 'UTF-8',
                    Data: body,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Welcome to Avoin Map',
            },
        },
        Source: SENDER,
        ReplyToAddresses: [],
    }

    try {
        const data = await sesClient.send(new SendEmailCommand(params))
        return data
    } catch (err) {
        throw err
    }
}

const Email = { sendVerification }

module.exports = Email
