import * as BH from './apis/beehive'
import { capitalize } from 'lodash'

const getLabel = (name: string) =>
  ({name, label: capitalize(name.split('.').pop())})




async function main() {
  const args = process.argv
  if (args.length == 2) {
    console.error('Expected at least one argument!')
    process.exit(1)
  }

  // get args
  const [vsn, sensor] = args.slice(2)


  // fetch
  const data = await BH.getData({
    start: '-30d',
    filter: {
      vsn,
      sensor
    },
    tail: 1
  })


  // get unique names
  const names = [...new Set(data.map(o => o.name))]

  // measurement.config.ts format
  const d = {
    [sensor]: {
      names: names.map(name => getLabel(name))
    }
  }

  console.log(JSON.stringify(d, null, 2))
}


main()