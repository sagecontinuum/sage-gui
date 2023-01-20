import {rest} from 'msw'
import {render, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import MockRouter from '/__mocks__/MockRouter'
import MockTheme from '/__mocks__/MockTheme'

import App from './App'

import {data, url} from '/components/apis/ecr.mocks'
import {server} from '/__mocks__/server'


beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


// todo(nc): abstract away common router mocks
jest.mock('react-router-dom', () => {
  const obj = jest.requireActual('react-router-dom')

  return ({
    ...obj,
    useParams: jest.fn().mockReturnValue({ '*': 'zelda/avian-diversity' }),
    useNavigate: () => jest.fn(),
    useLocation: () => jest.fn(),
    useHref: () => jest.fn()
  })
})

// eslint-disable-next-line react/display-name
jest.mock('./TagList', () => () => <div>some tag list</div>)


const mockRender = () => render(
  <MockTheme>
    <MockRouter>
      <App />
    </MockRouter>
  </MockTheme>
)


/**
 * the actual tests
 */

test('it loads and renders markdown as html', async () => {
  const {unmount} = mockRender()

  // not dependant on requests
  await waitFor(() => screen.getByRole('heading'))
  expect(screen.getByText('zelda / avian-diversity'))

  // dependant on requests; check markdown rendering
  await waitFor(() => screen.getByText('This is my science.'))
  expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Science')
  expect(screen.getByText('This is my science.'))

  unmount()
})

test('it displays a notice if no science description ', async () => {
  // mimic no science description
  const testData = JSON.parse(JSON.stringify(data))
  testData.versions[0].science_description = null

  const repoUrl = `${url}/repositories/${data.namespace}/${data.name}`
  server.use(
    rest.get(repoUrl, (req, res, ctx) =>
      res(ctx.json(testData))
    )
  )

  const {unmount} = mockRender()

  await waitFor(() => screen.getByRole('heading'))
  expect(screen.getByText('zelda / avian-diversity'))
  expect(screen.getByText('No science description available for this app.'))

  unmount()
})



