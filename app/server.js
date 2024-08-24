const express = require('express');
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const DB_USER = process.env.MONGO_DB_USERNAME;
const DB_PASSWORD = process.env.MONGO_DB_PWD;

let mongoUrlLocal = `mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017`;
let mongoUrlDocker = `mongodb://${DB_USER}:${DB_PASSWORD}@mongodb`;

const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const databaseName = "my-db";

let dbClient;

// Connect to MongoDB once and reuse the client
MongoClient.connect(mongoUrlDocker, mongoClientOptions)
  .then(client => {
    dbClient = client;
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/profile-picture', (req, res) => {
  fs.readFile(path.join(__dirname, 'images/profile-1.jpg'), (err, img) => {
    if (err) {
      res.status(500).send('Error reading image file');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  });
});

app.post('/update-profile', (req, res) => {
  const userObj = req.body;
  userObj['userid'] = 1;

  if (!dbClient) {
    res.status(500).send('Database not connected');
    return;
  }

  const db = dbClient.db(databaseName);
  const myquery = { userid: 1 };
  const newvalues = { $set: userObj };

  db.collection('users').updateOne(myquery, newvalues, { upsert: true }, (err, result) => {
    if (err) {
      res.status(500).send('Error updating profile');
      return;
    }
    res.send(userObj);
  });
});

app.get('/get-profile', (req, res) => {
  if (!dbClient) {
    res.status(500).send('Database not connected');
    return;
  }

  const db = dbClient.db(databaseName);
  const myquery = { userid: 1 };

  db.collection('users').findOne(myquery, (err, result) => {
    if (err) {
      res.status(500).send('Error fetching profile');
      return;
    }
    res.send(result || {});
  });
});

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});
