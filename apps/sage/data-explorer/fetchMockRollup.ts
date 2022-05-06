import { handleErrors } from '/components/fetch-utils'
import { groupBy } from 'lodash'



export default function fetchMockRollup({byVersion = false, groupName = 'meta.vsn'}) {
  return fetch('http://127.0.0.1:8080/scripts/last-30d-april-26-2022.json')
    .then(handleErrors)
    .then(res => res.json())
    .then(data => data.map(o => {
      const { plugin } = o.meta
      return {
        ...o,
        timestamp: o.timestamp.split('+')[0]+'Z',
        meta: {
          ...o.meta,
          plugin: byVersion ? plugin : plugin.split(':')[0]
        }
      }
    }))
    .then(d => groupBy(d, groupName))
}