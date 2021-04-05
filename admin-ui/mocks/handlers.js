import { rest } from 'msw'

export const handlers = [
  rest.post('/query', (req, res, ctx) => {
    return res(
      ctx.status(200),
    )
  }),
  rest.get('/test', (req, res, ctx) => {
    return res(
      ctx.status(200),
    )
  })
]