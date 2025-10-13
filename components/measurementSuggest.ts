import * as BH from './apis/beehive'
import { capitalize } from 'lodash'

/**
 * measurementSuggest — CLI helper to generate a `measurement.config.ts`
 * fragment from recent beehive data.
 *
 * Usage: ts-node components/measurementSuggest.ts <VSN> <SEARCH>
 * <SEARCH> may be `sensorName` or `field=value`.
 */


/**
 * getLabel — create label from measurement series name
 *
 * @param name - full measurement series name
 * @returns object with `name` and `label` fields. ex: if name is `ambient.temp`, then label is `Temp`.
 */
const getLabel = (name: string) => ({ name, label: capitalize(name.split('.').pop()) })



async function main() {
  const args = process.argv
  if (args.length == 2) {
    console.error('Expected at least one argument!')
    process.exit(1)
  }

  const [vsn, search] = args.slice(2)

  // allow searching by `field=value` or default to `sensor=<search>`
  let field: string, query: string
  if (search.includes('=')) [field, query] = search.split('=')
  else [field, query] = ['sensor', search]

  // fetch recent data from beehive
  const data = await BH.getData({
    start: '-30d',
    filter: {
      vsn,
      [field]: query
    },
    tail: 1
  })

  // get unique series names
  const names = [...new Set(data.map(o => o.name))]

  // Format matches the shape used by measurement.config.ts
  const d = {
    [query]: {
      names: names.map(name => getLabel(name))
    }
  }

  console.log(JSON.stringify(d).slice(1, -1))
}


main()