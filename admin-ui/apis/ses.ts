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


export function getGroupByPlugin(nodeId: string) {
  return get(`${url}/${nodeId}/by_plugin.json`)
}


export function getLatestStatus(nodeId: string) {
  return get(`${url}/${nodeId}/latest.json`)
}


export function getAllLatestStatus(nodeIds) {
  const proms = nodeIds.map(id => get(`${url}/${id}/latest.json`))

  return Promise.all(proms)
    .then(data => {
      console.log('data', data)
    })
}
