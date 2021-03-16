import config from '../../../config'
const url = config.beehive

export default async function fetchStatus(data = {}) {
  let res
  try {
    res = await fetch(`${url}/query`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return res.text()
  } catch(e) {
    console.error('error:', e)
  }
}
