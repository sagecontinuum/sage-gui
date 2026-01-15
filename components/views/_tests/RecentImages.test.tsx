import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {render, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import RecentImages from './RecentImages'

import config from '../../config'
const url = config.beehive

const mockImageData = {
  camera: {
    timestamp: new Date().toISOString(),
    size: 1024000,
    value: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    meta: {
      task: 'camera-task',
      node: 'WTST',
      plugin: 'plugin-camera'
    }
  }
}

const mockProgressData = {
  camera: 100,
  total: 150
}

const server = setupServer(
  rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
    return res(ctx.json(mockImageData))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('displays recent images for cameras', async () => {
  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByRole('img'))
  
  expect(screen.getByRole('img')).toBeInTheDocument()
  expect(screen.getByText('camera')).toBeInTheDocument()
  expect(screen.getByText('View more...')).toBeInTheDocument()

  unmount()
})

test('shows download button with file size', async () => {
  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByText('1.00 MB'))
  
  expect(screen.getByText('1.00 MB')).toBeInTheDocument()
  expect(screen.getByRole('link', {name: /download/i})).toBeInTheDocument()

  unmount()
})

test('displays warning for old images', async () => {
  const oldImageData = {
    camera: {
      ...mockImageData.camera,
      timestamp: '2022-01-01T00:00:00Z'
    }
  }

  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(ctx.json(oldImageData))
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByRole('img'))
  
  expect(screen.getByRole('img')).toBeInTheDocument()
  expect(screen.getByTestId('warning-icon')).toBeInTheDocument()

  unmount()
})

test('shows no images message when no images available', async () => {
  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(ctx.json({}))
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByText('No recent images available'))
  
  expect(screen.getByText('No recent images available')).toBeInTheDocument()

  unmount()
})

test('displays loading progress during search', async () => {
  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(
        ctx.delay(100),
        ctx.json(mockImageData)
      )
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByText(/Searching/i))
  
  expect(screen.getByText(/Searching/i)).toBeInTheDocument()

  unmount()
})

test('handles multiple cameras', async () => {
  const multiCameraData = {
    camera: {
      timestamp: new Date().toISOString(),
      size: 1024000,
      value: 'data:image/jpeg;base64,test1',
      meta: { task: 'camera-task', node: 'WTST' }
    },
    camera2: {
      timestamp: new Date().toISOString(),
      size: 2048000,
      value: 'data:image/jpeg;base64,test2',
      meta: { task: 'camera2-task', node: 'WTST' }
    }
  }

  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(ctx.json(multiCameraData))
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera', 'camera2']} 
    />
  )

  await waitFor(() => screen.getAllByRole('img'))
  
  expect(screen.getAllByRole('img')).toHaveLength(2)
  expect(screen.getByText('camera')).toBeInTheDocument()
  expect(screen.getByText('camera2')).toBeInTheDocument()

  unmount()
})

test('displays error message when API fails', async () => {
  const errorMessage = 'Failed to fetch images'
  
  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({error: errorMessage}))
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByText(errorMessage))
  
  expect(screen.getByText(errorMessage)).toBeInTheDocument()

  unmount()
})

test('applies horizontal layout when horizontal prop is true', async () => {
  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
      horizontal={true}
    />
  )

  await waitFor(() => screen.getByRole('img'))
  
  const container = screen.getByRole('img').closest('.horizontal')
  expect(container).toBeInTheDocument()

  unmount()
})

test('shows camera name even when no image data', async () => {
  const partialImageData = {
    camera: null
  }

  server.use(
    rest.get(`${url}/nodes/:vsn/images/recent`, (req, res, ctx) => {
      return res(ctx.json(partialImageData))
    })
  )

  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByText('camera'))
  
  expect(screen.getByText('camera')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()

  unmount()
})

test('creates correct view more link', async () => {
  const {unmount} = render(
    <RecentImages 
      vsn="WTST" 
      cameras={['camera']} 
    />
  )

  await waitFor(() => screen.getByRole('link', {name: /view more/i}))
  
  const viewMoreLink = screen.getByRole('link', {name: /view more/i})
  expect(viewMoreLink).toHaveAttribute('href', '/query-browser?type=images&tasks=camera-task&start=-12h&mimeType=image&page=0&nodes=WTST')

  unmount()
})