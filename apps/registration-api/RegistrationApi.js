import express from 'express'
import { exec } from 'child_process'
import cors from 'cors'
import fs from 'fs'
import tmp from 'tmp'
import archiver from 'archiver'
import regAuthCheck from './regAuthCheck.js'
import morgan from 'morgan'

const PORT = 3001
const CA_KEY = process.env.CA_PATH

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan('combined'))


app.post('/register', regAuthCheck, (req, res) => {

  const tmpObj = tmp.dirSync()
  const tmpDir = tmpObj.name

  exec(
    `/usr/bin/create-key-cert.sh -b beehive-dev -e +1d -o ${tmpDir} -c ${CA_KEY}`,
    (err) => {
      if (err) {
        return res.status(500).send({ error: 'could not run script' })
      }

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=registration.zip',
      })

      fs.readdir(tmpDir, (err, files) => {
        if (err) {
          console.error(err)
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

      // todo(SH): Delete the temp folder
      fs.rm(tmpDir, { recursive: true }, err => {
        if (err) {
          console.log(err)
          throw err
        }

        console.log(`${tmpDir} is deleted!`)
      })
    }
  )

  console.log('Registration keys successfully generated!')
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})


export default app
