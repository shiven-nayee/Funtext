require('dotenv').config()

const config = require('./config');
const fs = require('fs')
let path = require('path')
const MessagingResponse = require('twilio').twiml.MessagingResponse
const isProduction = process.env.NODE_ENV === 'production'
const { Pool } = require('pg')
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: isProduction,
})

const getUsers = (request, response) => {
  pool.query('SELECT * FROM phone_numbers', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createUser = (request, response) => {
  // Get number from twilio request
  const number = request.body.From;
  let message = request.body.Body;
  let twiml = new MessagingResponse;
  message = message.toLowerCase().trim();
  console.log(number);
  console.log(message);

  // Check if number exists already
  pool.query('SELECT * FROM phone_numbers WHERE number = $1', [number], (error, results) => {
    if(error) {
      throw error;
    }

    // Adds number if it isn't found in the database
    if(results.rows == 0) {
      pool.query('INSERT INTO phone_numbers (number, text) VALUES ($1, $2)', [number, true], (error, results) => {
      if(error) {
        throw error;
      }
      console.log(`Added Number: ${number}`);
      response.status(201).send(twiml.toString(`Added Number: ${number}`));
      })
    } else if(message === 'unsubscribe') {
      pool.query('DELETE FROM phone_numbers WHERE number = $1', [number], (error, results) => {
        console.log(`${number} unsubscribed`);
        response.status(202).send(twiml.toString(`Number: ${number} already exists`));
      });
    } else {
      console.log(`Number: ${number} already exists`);
      response.status(200).send(twiml.toString(`Number: ${number} already exists`));
    }
  })
}

async function getIMG() {
  
}

const getURL = (request, response) => {
    let imageOfTheDay = '';
    let finalPath = '';
    let date = new Date();
    let month = date.getMonth()+1;
    let day = date.getDate();
    let directoryPath = `images/${month}/${day}`;
  
    fs.readdir(directoryPath,(error,dir) => {
      console.log(dir)
      for(const img of dir) {
        if(img.includes('.jpg') || img.includes('.png')) {
          imageOfTheDay = `images/${month}/${day}/${img}`;
          finalPath = path.join(__dirname, imageOfTheDay)
      }
    }
    console.log(imageOfTheDay)
    response.status(200).sendFile(finalPath)
  })
}

const textAll = (request, response) => {
  pool.query('SELECT * FROM phone_numbers', (error, results) => {
    if (error) {
      throw error
    }
    console.log(results.rows)

    results.rows.forEach((person) => {
      console.log(person.number)
      const client = require('twilio')(config.accountSid,config.authToken)
      client.api.messages
        .create({
          body: "TEST",
          mediaUrl: ['http://97610877.ngrok.io/getURL'],
          to: person.number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`${person.number} texted`)
        }).catch((err) => {
          console.log('Administrator could not be notified')
          console.log(err)
        });
    })
    response.status(200)
  })
}

const sms = (request, response) => {
  // Being creating the message
  const twiml = new MessagingResponse()

  // Text message
  const msg = twiml.message('YEET')

  // Multimedia Message
  msg.media('https://external-preview.redd.it/LCP7CiYJArZmiLjLisnuZi5UaT26lIDXseXuldfcY00.jpg?auto=webp&s=012b0bc88dade2d008dda364fbc46b4680a93f7a')

  // Server response and send via twilio
  response.writeHead(200, {'Content-type': 'text/xml'})
  response.end(twiml.toString())
}

module.exports = {
  getUsers,
  createUser,
  sms,
  textAll,
  getURL
}