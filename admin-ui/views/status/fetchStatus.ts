import config from '../../../config'
const url = config.beehive

export default async function fetchStatus(data = {}) {
  const res = await fetch(`${url}/query`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  const text = await res.text()

  if (!text)
    return null

  const metrics = text.trim()
    .split('\n')
    .map(str => JSON.parse(str))

  return metrics
}
