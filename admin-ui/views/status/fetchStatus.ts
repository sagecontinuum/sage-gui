import config from '../../../config'
const url = config.beehive

export default async function fetchStatus(data = {}) {
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
    return res.json()
  } catch(e) {
    console.error('error:', e)
  }
}
