require('dotenv').config()

// Configuration for Twilio API
var cfg = {}
cfg.accountSid = process.env.TWILIO_ACCOUNT
cfg.authToken = process.env.TWILIO_AUTH_TOKEN
cfg.sendingNumber = process.env.TWILIO_SEND_FROM

module.exports = cfg