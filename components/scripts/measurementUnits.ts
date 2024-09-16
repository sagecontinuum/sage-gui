import * as BH from '../apis/beehive'



async function main() {
  // fetch
  const data = await BH.getData({
    start: '-1d',
    tail: 1,
    filter: {
      units: '.*'
    }
  })

  const unitList = [...new Set(data.map(o => o.meta['unit']))]
  const unitsList = [...new Set(data.map(o => o.meta.units))]

  console.log('unitList', unitList)
  console.log('unitsList', unitsList)
}


main()