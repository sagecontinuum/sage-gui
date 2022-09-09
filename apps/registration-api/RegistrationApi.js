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


app.get('/register', regAuthCheck, (req, res) => {

  const userName = req.get('User')
  const tmpObj = tmp.dirSync()
  const tmpDir = tmpObj.name

  exec(
    `/usr/bin/create-key-cert.sh -b beehive-dev -e +1d -o ${tmpDir} -c ${CA_KEY}`,
    (err) => {
      if (err) {
        let error = 'could not run script'
        console.log(error)
        return res.status(500).send({ error })
      }

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=registration.zip',
      })

      const zipArchiver = archiver('zip')
      zipArchiver.pipe(res)
      zipArchiver.directory(tmpDir, false)
      zipArchiver.finalize()

      res.on('finish', () => {
        // Delete the temp folder
        fs.rm(tmpDir, { recursive: true }, err => {
          if (err) {
            console.log(err)
            throw err
          }

          console.log(`${tmpDir} is deleted!`)
        })

      })

      console.log(`${userName} created registration keys`)
    }
  )

})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`)
})


export default app
