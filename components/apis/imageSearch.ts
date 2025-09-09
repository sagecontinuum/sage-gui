import config from '/config'
const { imageSearch: ENDPOINT } = config

export async function submitImageSearch(query: string): Promise<string> {
  const payload = { data: [query] }
  const response = await fetch(`${ENDPOINT}/gradio_api/call/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`POST failed: ${await response.text()}`)
  }
  const data = await response.json()

  const eventId = data.event_id
  if (!eventId) {
    throw new Error(`No event_id in response: ${JSON.stringify(data)}`)
  }
  return eventId
}

export async function streamImageSearchResults(eventId: string): Promise<string> {
  const resultsUrl = `${ENDPOINT}/gradio_api/call/search/${eventId}`
  const response = await fetch(resultsUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream'
    },
    signal: AbortSignal.timeout(120000) // 120 seconds
  })
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let jsonData = null
  let buffer = ''
  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    const value = result.value
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // Keep incomplete line for next chunk
    for (const line of lines) {
      if (line.startsWith('data:')) {
        jsonData = line.slice(5).trim()
      }
    }
  }
  if (!jsonData) {
    throw new Error('No data received from SSE stream.')
  }
  return jsonData
}
