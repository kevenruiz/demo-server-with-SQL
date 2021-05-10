/* eslint-disable no-console */
// import dependencies
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import client from './client.js';

// make an express app
const app = express();

// allow our server to be called from any website
app.use(cors());
// read JSON from body of request when indicated by Content-Type
app.use(express.json());
// enhanced logging
app.use(morgan('dev'));

// heartbeat route
app.get('/', (req, res) => {
  res.send('Famous Cats API');
});

/*** API Routes ***/

// auth

app.post('/api/auth/signup', async (req, res) => {
  try {
    const user = req.body;
    const data = await client.query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email; 
    `, [user.name, user.email, user.password]);

    res.json(data.rows[0]);
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });      
  }
});

// cats
app.post('/api/cats', async (req, res) => {
  try {
    const cat = req.body;

    const data = await client.query(`
      INSERT INTO cats (name, type, url, year, lives, is_sidekick, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, type, url, year, 
        lives, is_sidekick as "isSidekick",
        user_id as "userId";
    `, [
      cat.name, cat.type, cat.url, cat.year, 
      cat.lives, cat.isSidekick, 1
    ]);

    res.json(data.rows[0]);
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });      
  }
});

app.put('/api/cats/:id', async (req, res) => {
  try {
    const cat = req.body;

    const data = await client.query(`
      UPDATE  cats 
        SET   name = $1, type = $2, url = $3, 
              year = $4, lives = $5, is_sidekick = $6
      WHERE   id = $7
      RETURNING id, name, type, url, year, lives, 
              is_sidekick as "isSidekick", user_id as "userId";
    `, [cat.name, cat.type, cat.url, cat.year, cat.lives, cat.isSidekick, req.params.id]);

    res.json(data.rows[0]);
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });      
  }
});


app.delete('/api/cats/:id', async (req, res) => {
  try {
    const data = await client.query(`
      DELETE FROM  cats 
      WHERE id = $1
      RETURNING id, name, type, url, year, 
        lives, is_sidekick as "isSidekick",
        user_id as "userId";    
    `, [req.params.id]);

    res.json(data.rows[0]); 
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });  
  }
});

app.get('/api/cats', async (req, res) => {
  // use SQL query to get data...
  try {
    const data = await client.query(`
      SELECT  c.id, c.name, type, url, year, lives,
              is_sidekick as "isSidekick",
              user_id as "userId",
              u.name as "userName"
      FROM    cats c
      JOIN    users u
      ON      c.user_id = u.id;
    `);

    // send back the data
    res.json(data.rows); 
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });  
  }
});

app.get('/api/cats/:id', async (req, res) => {
  // use SQL query to get data...
  try {
    const data = await client.query(`
      SELECT  c.id, c.name, type, url, year, lives,
              is_sidekick as "isSidekick",
              user_id as "userId",
              u.name as "userName"
      FROM    cats c
      JOIN    users u
      ON      c.user_id = u.id
      WHERE   c.id = $1;
    `, [req.params.id]);

    // send back the data
    res.json(data.rows[0] || null); 
  }
  catch(err) {
    console.log(err);
    res.status(500).json({ error: err.message });  
  }
});

export default app;