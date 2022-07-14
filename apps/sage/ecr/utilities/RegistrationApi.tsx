const express = require("express");
const { exec } = require("child_process");
const { join } = require("path");
const cors = require("cors");
const axios = require("axios");


const app = express();
const PORT = process.env.PORT || 5000;

const db = {};

//take the body of incoming POST requests and turn it into a JavaScript object
app.use(express.json());
app.use(cors())
app.use(express.static(join(__dirname, "static")));


var BH = ""
var uid = ""
app.post("/set", (req, res) => {
  uid = req.body.uid;
  BH = req.body.BH;
  db[req.body.key] = req.body.value;
  res.status(201).json({
    status: "OK",
  });

});

//pass parameter to bash script

app.get("/register", (req, res) => {
  exec(__dirname + "/register.sh " + uid + " " + BH, (err, stdout, stderr) => {
    if (err !== null) {
      return res.status(400).json({ output: null, error: err.message });
    } else {
      res.status(200).json({ output: stdout, error: null });
    }
  });

})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});

// app.get('/version', (req, res) => {
//     res.json({
//         appName: process.env.npm_package_name,
//         appVersion: process.env.npm_package_version
//       });
//   });

// app.get('/get/:key', (req, res) => {
//     res.json({ value: db[req.params.key]});
// });

// app.get('/dbinfo', (req, res) => {
//     const dbKeys = Object.keys(db);

//     const info = {
//       size: dbKeys.length
//     };

//     if ('true' === req.query.details) {
//       info.keys = dbKeys;
//     }

//     res.json(info);
//   });
