import express from "express";
import { exec } from "child_process";
import cors from "cors";
import fs from "fs";
import tmp from "tmp";
import archiver from  "archiver";
import regAuthCheck from "./regAuthCheck.js";

const PORT = 3001;
const CA_KEY = '/add/CA/key/path';

const app = express();
app.use(express.json());
app.use(cors());


app.get("/register", regAuthCheck, (req, res) => {
  const tmpObj = tmp.dirSync();
  const tmpDir = tmpObj.name;

  exec(
    `/usr/bin/create-key-cert.sh -b beehive-dev -e +1d -o ${tmpDir} -c ${CA_KEY}`,
    (err, stdout, stderr) => {
      if (err !== null) {
<<<<<<< HEAD
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
=======
        return res.status(400).json({ error: err.message })
      } else {
        if (err) throw err

        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-disposition': 'attachment; filename=registration.zip',
        })

        fs.readdir(tmpDir, (err, files) => {
          if (err !== null) {
            console.log(err.message)
          } else {
            const zipArchiver = archiver('zip')
            zipArchiver.pipe(res)

            files.forEach((file) => {
              zipArchiver.append(fs.createReadStream(tmpDir + '/' + file), {
                name: file,
              })
            })

            zipArchiver.finalize()
          }
        })
>>>>>>> 82fe1beca73f97a8384fa453eef7a98a0ca353f0



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
<<<<<<< HEAD
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
=======
  )
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})
>>>>>>> 82fe1beca73f97a8384fa453eef7a98a0ca353f0
