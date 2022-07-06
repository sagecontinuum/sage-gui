console.log('Server-side code running');

const express = require('express');
const app = express();
//listen on port 3000
const PORT = process.env.PORT || 5000;
const db = {};

//take the body of incoming POST requests and turn it into a JavaScript object
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});


app.get('/api', (req, res) => {
    res.json({
        appName: process.env.npm_package_name,
        appVersion: process.env.npm_package_version
      });
  });


app.post('api', (req, res) => {
    db[req.body.key] = req.body.value;
    res.status(201).json({ 
        status: 'OK' 
      });
})

app.get('/get/:key', (req, res) => {
    res.json({ value: db[req.params.key]});
});

app.get('/dbinfo', (req, res) => {
    const dbKeys = Object.keys(db);
  
    const info = {
      size: dbKeys.length
    };
  
    if ('true' === req.query.details) {
      info.keys = dbKeys;
    }
  
    res.json(info);
  });


