import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {render, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import RecentDataTable from '../RecentDataTable'

import config from '/config'
const url = config.beehive


const mockData = {
  'timestamp': new Date().toISOString(),
  'name': 'env.temperature',
  'value': 30.76,
  'meta': {
    'host': '0000dca63288face.ws-rpi',
    'job': 'sage',
    'node': '000048b02d07627c',
    'plugin': 'plugin-iio:0.4.5',
    'sensor': 'bme680',
    'task': 'iio-rpi',
    'vsn': 'WTST'
  }
}

// todo(nc): abstract mock server?
const server = setupServer(
  rest.post(`${url}/query`, (req, res, ctx) => {
    return res(ctx.json(mockData))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const items = [{
  label: 'Temperature',
  query: {
    node: '000048b02d07627c',
    name: 'env.temperature',
    sensor: 'bme680'
  },
  format: v => `${v}°C`,
  linkParams: (data) =>
    `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&start=h`
}, {
  label: 'Raingauge',
  query: {
    node: '000048b02d07627c',
    name: 'env.raingauge.event_acc'
  },
  linkParams: (data) =>
    `apps=${data.meta.plugin}&nodes=${data.meta.vsn}&names=${data.name}&start=h`
}]


test('displays the table', async () => {
  const {unmount} = render(<RecentDataTable items={items} />)

  // ensure there is table
  await waitFor(() => screen.getByRole('table'))
  expect(screen.getByRole('table'))
  expect(screen.getAllByRole('columnheader')[1]).toHaveTextContent('Time')
  expect(screen.getAllByRole('columnheader')[2]).toHaveTextContent('Value')
  expect(screen.getAllByRole('cell')[0]).toHaveTextContent('Temperature')
  expect(screen.getAllByRole('row')).toHaveLength(items.length + 1)  // + 1 for header

  // ensure tabled is updated (with formatted values)
  await waitFor(() => screen.getByText(/secs ago/))
  expect(screen.getAllByRole('cell')[1]).toHaveTextContent('secs ago')
  expect(screen.getAllByRole('cell')[2]).toHaveTextContent('30.76°C')

  unmount()
})


test('highlights old times in red', async () => {
  server.use(
    rest.post(`${url}/query`, (req, res, ctx) => {
      return res(ctx.json({...mockData, timestamp: '2022-01-19T16:20:21.555Z'}))
    })
  )

  const {unmount} = render(<RecentDataTable items={items} />)

  // ensure old time is 'failed'
  await waitFor(() => screen.getByText(/ ago/))
  expect(screen.getAllByRole('cell')[1]).toHaveClass('failed')

  unmount()
})


test('handles unavailable data', async () => {
  server.use(
    rest.post(`${url}/query`, (req, res, ctx) => {
      return res(ctx.json(null))
    }),
  )

  const {unmount} = render(<RecentDataTable items={items} />)

  await waitFor(() => screen.getByRole('table'))
  expect(screen.getByRole('table'))

  // ensure tabled is updated
  await waitFor(() => screen.getByText('Temperature'))
  expect(screen.getAllByRole('cell')[1]).toHaveTextContent('-')
  expect(screen.getAllByRole('cell')[2]).toHaveTextContent('Not available')

  unmount()
})


test('handles a error', async () => {
  const msg = 'failed to fetch'

  server.use(
    rest.post(`${url}/query`, (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({error: msg}))
    })
  )

  const {unmount} = render(<RecentDataTable items={items} />)

  await waitFor(() => screen.getByText(msg))
  expect(screen.getByText(msg))

  unmount()
})

