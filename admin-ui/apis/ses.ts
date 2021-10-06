import config from '../../config'
const url = config.ses


function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


function get(endpoint: string) {
  return fetch(endpoint)
    .then(handleErrors)
    .then(res => res.json())
}



type State = {
  value: number
  timestamp: string
  meta: {
    severity: string
  }
}


export type GroupedByPlugin = {
  [pluginName: string]: State[]
}

export type LatestState = {
  [nodeId: string]: State[]
}



export function getGroupedByPlugin(nodeId: string) : Promise<GroupedByPlugin> {
  return get(`${url}/${nodeId}/by_plugin.json`)
}



export function getLatestStatus() : Promise<LatestState>{
  return get(`${url}/latest-status.json`)
}
