import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {render, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {MemoryRouter, Route, Routes} from 'react-router-dom'

import NodeView from '../node/Node'

import config from '../../../config'
const bkUrl = config.beekeeper
const bhUrl = config.beehive

const mockNodeData = {
  id: '123',
  name: 'WTST',
  vsn: 'WTST',
  description: 'Test Node',
  lat: 40.7128,
  lng: -74.0060,
  hasStaticGPS: true,
  sensors: [
    {
      name: 'bme680',
      hw_model: 'BME680',
      capabilities: ['temperature', 'humidity', 'pressure', 'gas'],
      is_active: true
    },
    {
      name: 'camera',
      hw_model: 'IMX219',
      capabilities: ['camera'],
      is_active: true
    }
  ],
  computes: [
    {
      name: 'rpi',
      is_active: true
    }
  ]
}

const mockManifestData = {
  computes: [
    {
      name: 'rpi',
      zone: 'core'
    }
  ],
  sensors: [
    {
      name: 'bme680',
      scope: 'env'
    }
  ]
}

const mockBKState = {
  registration_event: {
    timestamp: '2023-01-01T00:00:00Z'
  }
}

const mockStatusData = [
  {
    timestamp: new Date().toISOString(),
    value: 'online'
  }
]

const mockGPSData = {
  lat: 40.7128,
  lon: -74.0060,
  timestamp: new Date().toISOString()
}

const mockLoraData = [
  {
    deveui: '1234567890ABCDEF',
    name: 'device1',
    rssi: -50,
    last_seen: new Date().toISOString()
  }
]

const server = setupServer(
  rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
    return res(ctx.json(mockNodeData))
  }),
  rest.get(`${bkUrl}/nodes/:vsn/manifest`, (req, res, ctx) => {
    return res(ctx.json(mockManifestData))
  }),
  rest.get(`${bkUrl}/nodes/:id/state`, (req, res, ctx) => {
    return res(ctx.json(mockBKState))
  }),
  rest.get(`${bhUrl}/nodes/:vsn/status`, (req, res, ctx) => {
    return res(ctx.json(mockStatusData))
  }),
  rest.get(`${bhUrl}/nodes/:vsn/gps`, (req, res, ctx) => {
    return res(ctx.json(mockGPSData))
  }),
  rest.get(`${bhUrl}/lorawan/rssi`, (req, res, ctx) => {
    return res(ctx.json(mockLoraData))
  }),
  rest.post(`${bhUrl}/query`, (req, res, ctx) => {
    return res(ctx.json([{
      timestamp: new Date().toISOString(),
      name: 'env.temperature',
      value: 25.5,
      meta: {
        units: '°C'
      }
    }]))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const renderWithRouter = (initialEntries = ['/nodes/WTST']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/nodes/:vsn" element={<NodeView />} />
      </Routes>
    </MemoryRouter>
  )
}

test('displays node overview information', async () => {
  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText('WTST'))

  expect(screen.getByText('WTST')).toBeInTheDocument()
  expect(screen.getByText('Test Node')).toBeInTheDocument()

  unmount()
})

test('displays sensor data tables', async () => {
  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByRole('table'))

  expect(screen.getByRole('table')).toBeInTheDocument()
  expect(screen.getByText('BME680')).toBeInTheDocument()

  unmount()
})

test('displays map when GPS data is available', async () => {
  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText('WTST'))

  const mapElement = screen.getByTestId('map') || document.querySelector('[data-testid="map"]')
  expect(mapElement).toBeInTheDocument()

  unmount()
})

test('shows LoRaWAN devices when manifest contains lorawan sensors', async () => {
  const mockNodeWithLora = {
    ...mockNodeData,
    sensors: [
      ...mockNodeData.sensors,
      {
        name: 'lorawan_device',
        hw_model: 'LORAWAN_DEVICE',
        capabilities: ['lorawan'],
        is_active: true
      }
    ]
  }

  server.use(
    rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
      return res(ctx.json(mockNodeWithLora))
    })
  )

  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText('LoRaWAN'))

  expect(screen.getByText('LoRaWAN')).toBeInTheDocument()

  unmount()
})

test('displays images section for nodes with cameras', async () => {
  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText('Images'))

  expect(screen.getByText('Images')).toBeInTheDocument()

  unmount()
})

test('shows node not found when VSN is invalid', async () => {
  server.use(
    rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
      return res(ctx.status(404), ctx.json({error: 'Not found'}))
    })
  )

  const {unmount} = renderWithRouter(['/nodes/INVALID'])

  await waitFor(() => screen.getByText(/not found/i))

  expect(screen.getByText(/not found/i)).toBeInTheDocument()

  unmount()
})

test('displays error message when API calls fail', async () => {
  server.use(
    rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({error: 'Internal server error'}))
    })
  )

  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText(/internal server error/i))

  expect(screen.getByText(/internal server error/i)).toBeInTheDocument()

  unmount()
})

test('shows inactive sensor warning for admin users', async () => {
  const mockNodeWithInactiveSensor = {
    ...mockNodeData,
    sensors: [
      {
        name: 'bme680',
        hw_model: 'BME680',
        capabilities: ['temperature', 'humidity', 'pressure', 'gas'],
        is_active: false
      }
    ]
  }

  server.use(
    rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
      return res(ctx.json(mockNodeWithInactiveSensor))
    })
  )

  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText(/inactive/i))

  expect(screen.getByText(/inactive/i)).toBeInTheDocument()

  unmount()
})

test('handles missing GPS data gracefully', async () => {
  server.use(
    rest.get(`${bhUrl}/nodes/:vsn/gps`, (req, res, ctx) => {
      return res(ctx.status(404), ctx.json({error: 'GPS not found'}))
    })
  )

  const mockNodeWithoutGPS = {
    ...mockNodeData,
    hasStaticGPS: false
  }

  server.use(
    rest.get(`${bkUrl}/nodes/:vsn`, (req, res, ctx) => {
      return res(ctx.json(mockNodeWithoutGPS))
    })
  )

  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText(/map not available/i))

  expect(screen.getByText(/map not available/i)).toBeInTheDocument()

  unmount()
})

test('displays node timeline component', async () => {
  const {unmount} = renderWithRouter()

  await waitFor(() => screen.getByText('WTST'))

  const timelineElement = screen.getByTestId('node-timeline') || document.querySelector('[data-testid="node-timeline"]')
  expect(timelineElement).toBeInTheDocument()

  unmount()
})