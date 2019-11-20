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

const addNumber = (request, response) => {
  let number = request.body.number
  let twiml = new MessagingResponse;
  pool.query('SELECT * FROM phone_numbers WHERE number = $1', [number], (error, results) => {
    if(error) {
      throw error;
    }

    // Adds number if it doesn't exist in the database
    if(results.rows == 0) {
      pool.query('INSERT INTO phone_numbers (number, text) VALUES ($1, $2)', [number, true], (error, results) => {
        if(error) {
          throw error;
        }
      const client = require('twilio')(config.accountSid,config.authToken);
      // Twilio API Call
      client.api.messages
        .create({
          body: "You are now subscribed to funtext",
          to: number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`Added Number: ${number}`);
        })
      response.status(201).send(twiml.toString(`Added Number: ${number}`));
      })
    } else {
      const client = require('twilio')(config.accountSid,config.authToken)

      // Twilio API Call
      client.api.messages
        .create({
          body: "You are already subscribed to Funtext, you will receieve a text in the morning at 9 AM. Text unsubscribe to stop.",
          to: number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`Number: ${number} already exists`);
        })
    }
  })
  response.status(201).json("ok");
}

const createUser = (request, response) => {
  // Get number from twilio request
  const number = request.body.From;
  let message = request.body.Body;
  let twiml = new MessagingResponse;
  message = message.toLowerCase().trim();

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
      const client = require('twilio')(config.accountSid,config.authToken)

      // Twilio API Call
      client.api.messages
        .create({
          body: "You are now subscribed to funtext",
          to: number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`Added Number: ${number}`);
        })
      response.status(201).send(twiml.toString(`Added Number: ${number}`));
      })
    } else if(message === 'unsubscribe') {
      pool.query('DELETE FROM phone_numbers WHERE number = $1', [number], (error, results) => {
        const client = require('twilio')(config.accountSid,config.authToken)
        // Twilio API Call
        client.api.messages
          .create({
            body: "You are now unsubscribed to funtext",
            to: number,
            from: config.sendingNumber
          }).then((data) => {
            console.log(`${number} unsubscribed`);
          })
          response.status(202).send(twiml.toString(`Number: ${number} already exists`));
        });
    } else {
      const client = require('twilio')(config.accountSid,config.authToken)

      // Twilio API Call
      client.api.messages
        .create({
          body: "You are already subscribed to Funtext, you will receieve a text in the morning at 9 AM. Text unsubscribe to stop.",
          to: number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`Number: ${number} already exists`);
        })
      // Response must be sent in the form of twiml format otherwise it raises an error on the Twilio API
      response.status(200).send(twiml.toString(`Number: ${number} already exists`));
    }
  })
}

// API Call for sending Images
const getURL = (request, response) => {
    let imageOfTheDay = '';
    let finalPath = '';
    let date = new Date();
    let month = date.getMonth()+1;
    let day = date.getDate();
    let directoryPath = `images/${month}/${day}`;
  
    fs.readdir(directoryPath,(error,dir) => {
      for(const img of dir) {
        if(img.includes('.jpg') || img.includes('.png')) {
          imageOfTheDay = `images/${month}/${day}/${img}`;
          finalPath = path.join(__dirname, imageOfTheDay)
      }
    }
    // Express only accepts Absolute paths
    response.status(200).sendFile(finalPath)
  })
}

const textAll = (request, response) => {
  pool.query('SELECT * FROM phone_numbers', (error, results) => {
    if (error) {
      throw error
    }

    results.rows.forEach((person) => {
      const client = require('twilio')(config.accountSid,config.authToken)

      // mediaUrl must be a URL, does not accept local paths
      // Localhost, 127.0.0.1 are prohibited by Twilio API
      // Create a random number so Twilio API doesn't cache image files and deliver old images
      let randomnum = Math.floor((Math.random() * 1000000) + 1); 
      client.api.messages
        .create({
          body: "Text unsubscribe to stop.",
          mediaUrl: [`http://40.87.61.103:1289/getURL/${randomnum}`],
          to: person.number,
          from: config.sendingNumber
        }).then((data) => {
          console.log(`${person.number} texted`)
        }).catch((err) => {
          console.log(`${person.number} could not be texted`)
          console.log(err)
        });
    })
    response.status(200).send("Sent text Messages")
  })
}

module.exports = {
  getUsers,
  createUser,
  addNumber,
  textAll,
  getURL
}