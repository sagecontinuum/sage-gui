const express = require("express");
const { exec } = require("child_process");
const { join } = require("path");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
var async = require("async");
const tmp = require("tmp");
const archiver = require("archiver");

const app = express();
const PORT = process.env.PORT || 5000;

//take the body of incoming POST requests and turn it into a JavaScript object
app.use(express.json());
app.use(cors());
app.use(express.static(join(__dirname, "static")));

var BH = "";
var uid = "";
app.post("/set", (req, res) => {
  uid = req.body.uid;
  BH = req.body.BH;
  res.status(201).json({
    status: "OK",
  });
});

app.get("/register", (req, res) => {
  let tmpDir = "";
  const tmpobj = tmp.dirSync();
  tmpDir = tmpobj.name;

  exec(
    __dirname + "/create-key-cert.sh" + " -b " + BH.trim() + " -e +1d -n -o " + tmpDir,
    (err, stdout, stderr) => {
      if (err !== null) {
        return res.status(400).json({ output: null, error: err.message });
      } else {
        if (err) throw err;

        //wrapping key files in tmpDir to a zip file
        const output = fs.createWriteStream('/Users/sammi9070/Downloads/registration.zip');
        const zipArchiver = archiver('zip');
        

        //append each file in the temp folder to the zip file
        fs.readdir(tmpDir, (err, files) => {
          if (err !== null) {
            console.log(err.message);
          } else {
            files.forEach((file) => {
              zipArchiver.append(fs.createReadStream(tmpDir + "/" + file), {'name': file});
            });
            zipArchiver.pipe(output);
            zipArchiver.finalize();
            res.status(200).json({output: "success"});
          }
        });

        // //Delete the temp folder
        // fs.readdir(tmpDir, (err, files) => {
        //   if (err) throw err;
        //   for (const file of files) {
        //     fs.unlink(tmpDir + "/" + file, err => {
        //       if (err) throw err;
        //     });
        //   }
        // });


      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
