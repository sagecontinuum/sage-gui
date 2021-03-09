import config from '../../../config'
const url = config.beehive

export default async function fetchStatus(data = {}) {
  console.log('data', data)

  let res
  try {
    res = await fetch(`${url}/query`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  } catch(e) {
    console.log('e', e)

  }

//  const json = await response.json()
  console.log('res', res.json())
  return res.json()
}
