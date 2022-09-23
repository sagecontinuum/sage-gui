import fs from 'node:fs/promises'
import YAML from 'yaml'

const dirPath = './apps/sage/jobs/test-job-data/'

const files = await fs.readdir(dirPath)

// merge job data
const byJob = {}
for (const fName of files) {
  const data = await fs.readFile(`${dirPath}/${fName}`, 'utf-8')
  const obj = YAML.parse(data)

  byJob[obj.name] = obj
}

// write to file
fs.writeFile(`./apps/sage/jobs/jobs.json`, JSON.stringify(byJob))
