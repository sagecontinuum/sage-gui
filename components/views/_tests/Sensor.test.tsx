import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import Sensor from '../sensor/Sensor'

import config from '../../../config'
const url = config.beekeeper

// Mock the providers to avoid complex async issues
jest.mock('/components/progress/ProgressProvider', () => ({
  useProgress: () => ({ setLoading: jest.fn(), loading: false })
}))

jest.mock('/components/auth/PermissionProvider', () => ({
  useIsSuper: () => true,
  PermissionProvider: ({ children }) => children
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom') as any,
  useParams: () => ({ name: 'BME680' }),
  useLocation: () => ({ pathname: '/sensors/BME680' })
}))

const mockSensorData = {
  name: 'BME680',
  hardware: 'BME680',
  hw_model: 'BME680',
  hw_version: '1.0',
  sw_version: '2.0',
  manufacturer: 'Bosch',
  description: '# BME680 Sensor',
  datasheet: 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme680-ds001.pdf',
  capabilities: ['temperature', 'humidity', 'pressure', 'gas'],
  nodeCount: 5
}

const mockAllSensors = [
  {
    name: 'BME680',
    capabilities: ['temperature', 'humidity', 'pressure', 'gas']
  }
]

const server = setupServer(
  rest.get(`${url}/sensors/:name`, (req, res, ctx) => {
    return res(ctx.json(mockSensorData))
  }),
  rest.get(`${url}/sensors`, (req, res, ctx) => {
    return res(ctx.json(mockAllSensors))
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('renders sensor component without crashing', () => {
  const {unmount} = render(<Sensor />)
  unmount()
})

test('renders sensor information', () => {
  const {unmount} = render(<Sensor />)

  expect(screen.getByText('Bosch')).toBeInTheDocument()
  expect(screen.getByText('BME680')).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()

  unmount()
})

test('renders capabilities', () => {
  const {unmount} = render(<Sensor />)

  expect(screen.getByText('temperature')).toBeInTheDocument()
  expect(screen.getByText('humidity')).toBeInTheDocument()
  expect(screen.getByText('pressure')).toBeInTheDocument()
  expect(screen.getByText('gas')).toBeInTheDocument()

  unmount()
})

test('renders datasheet link', () => {
  const {unmount} = render(<Sensor />)

  const datasheetLink = screen.getByRole('link', {name: /datasheet/i})
  expect(datasheetLink).toHaveAttribute('href', mockSensorData.datasheet)

  unmount()
})

test('shows edit button', () => {
  const {unmount} = render(<Sensor />)

  expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()

  unmount()
})

test('renders description', () => {
  const {unmount} = render(<Sensor />)

  expect(screen.getByText('BME680 Sensor')).toBeInTheDocument()

  unmount()
})