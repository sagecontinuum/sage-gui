import { handleErrors } from '/components/fetch-utils'
import { FetchRollupProps, parseData } from './Data'

export default function fetchMockRollup(props: FetchRollupProps) {
  return fetch('http://127.0.0.1:8080/scripts/last-30d-april-26-2022.json')
    .then(handleErrors)
    .then(res => res.json())
    .then(d => {
      const data = parseData({data: d, ...props})
      return {rawData: d, data}
    })
}