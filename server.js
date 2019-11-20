const http = require('http')
const express = require('express')
const schedule = require('node-schedule')
const bodyParser = require('body-parser')
const controller = require('./controller')
const cors = require('cors');
const app = express()
const port = 1289;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(cors());

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

// After processing the requests from the server the parameters will go here
app.get('/numbers', controller.getUsers)
app.get('/textAll', controller.textAll)
app.get('/getURL', controller.getURL)
app.get('/getURL/:random', controller.getURL)
app.post('/addNumber', controller.addNumber)
app.post('/newnumber', controller.createUser)
app.post('/sms', controller.createUser)

// Node Scheduler
// Schedule parameter Second / Minute / Hour / Day of Month / Month / Day of Week
// Make sure to set 'Second' parameter otherwise it will continue to run for the whole minute
const morningText = schedule.scheduleJob('0 0 14 * * *', () => {
  http.get('http://localhost:1289/textAll')
})

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})