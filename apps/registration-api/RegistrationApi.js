const express = require("express");
const { exec } = require("child_process");
const { join } = require("path");
const cors = require("cors");
const fs = require("fs");
const tmp = require("tmp");
const archiver = require("archiver");

const app = express();
const PORT = process.env.PORT || 5000;

//take the body of incoming POST requests and turn it into a JavaScript object
app.use(express.json());
app.use(cors());
app.use(express.static(join(__dirname, "static")));

app.get("/register", (req, res) => {
  const tmpObj = tmp.dirSync();
  const tmpDir = tmpObj.name;

  exec(
    `/usr/bin/create-key-cert.sh -b beehive-dev -e +1d -o ${tmpDir} -c ${__dirname}/beekeeper-keys/certca/beekeeper_ca_key`,
    (err, stdout, stderr) => {
      if (err !== null) {
        return res.status(400).json({ error: err.message });
      } else {
        if (err) throw err;

        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-disposition": "attachment; filename=registration.zip",
        });

        fs.readdir(tmpDir, (err, files) => {
          if (err !== null) {
            console.log(err.message);
          } else {
            const zipArchiver = archiver("zip");
            zipArchiver.pipe(res);

            files.forEach((file) => {
              zipArchiver.append(fs.createReadStream(tmpDir + "/" + file), {
                name: file,
              });
            });

            zipArchiver.finalize();

          }
        });



        // todo(SH): Delete the temp folder
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
