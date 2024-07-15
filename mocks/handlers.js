/**
 * an example mock handler
 */
import { http, HttpResponse } from 'msw'

import nodes from '/mock-nodes.json'

export const handlers = [
  http.get('https://auth.sagecontinuum.org/api/v-beta/nodes/', () => {
    return HttpResponse.json(nodes)
  })
]