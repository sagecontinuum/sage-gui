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
  const [vsn, search] = args.slice(2)

  let field, query
  if (search.includes('='))
    [field, query] = search.split('=')
  else
    [field, query] = ['sensor', search]


  // fetch
  const data = await BH.getData({
    start: '-30d',
    filter: {
      vsn,
      [field]: query
    },
    tail: 1
  })


  // get unique names
  const names = [...new Set(data.map(o => o.name))]

  // measurement.config.ts format
  const d = {
    [query]: {
      names: names.map(name => getLabel(name))
    }
  }

  console.log(JSON.stringify(d).slice(1, -1))
}


main()