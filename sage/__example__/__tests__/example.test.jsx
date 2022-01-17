/**
 * This is some sample tests using MSW (https://mswjs.io/),
 * Testing-Library (https://testing-library.com/), and (https://jestjs.io/).
 *
 * See the example here for details:
 *  https://testing-library.com/docs/react-testing-library/example-intro
 *
 */

import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {render, fireEvent, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import 'regenerator-runtime/runtime'

import Fetch from '../Example'

const endpoint = 'https://foo.com/greeting'

const server = setupServer(
  rest.get(endpoint, (req, res, ctx) => {
    return res(ctx.json({greeting: 'hello there'}))
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


test('loads and displays greeting', async () => {
  render(<Fetch url={endpoint} />)

  fireEvent.click(screen.getByText('Load Greeting'))

  await waitFor(() => screen.getByRole('heading'))

  expect(screen.getByRole('heading')).toHaveTextContent('hello there')
  expect(screen.getByRole('button')).toBeDisabled()
})


test('handles server error', async () => {
  server.use(
    rest.get(endpoint, (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({error: 'some error msg'}))
    }),
  )

  render(<Fetch url={endpoint} />)

  fireEvent.click(screen.getByText('Load Greeting'))

  await waitFor(() => screen.getByRole('alert'))

  expect(screen.getByRole('alert')).toHaveTextContent('Oops, failed to fetch!')
  expect(screen.getByRole('button')).not.toBeDisabled()
})
