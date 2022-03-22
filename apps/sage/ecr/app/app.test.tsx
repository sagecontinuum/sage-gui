import {rest} from 'msw'
import {render, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import MockTheme from '../../../__mocks__/MockTheme'

import App from './App'

import {data, url} from '../../../components/apis/ecr.mocks'
import {server} from '../../../__mocks__/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


jest.mock('react-router-dom', () => {
  const obj = jest.requireActual('react-router-dom')

  return ({
    ...obj,
    useParams: jest.fn().mockReturnValue({ path: 'zelda/avian-diversity' }),
  })
})

jest.mock('~/components/progress/ProgressProvider', () => ({
  useProgress: () => ({ loading: false, setLoading: () => true })
}))

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: () => 'do nothing' })
}))

jest.mock('./TagList', () => () => <div>some tag list</div>)



test('it loads and displays markdown', async () => {
  const {unmount} = render(
    <MockTheme>
      <App />
    </MockTheme>
  )

  // not dependant on requests
  await waitFor(() => screen.getByRole('heading'))
  expect(screen.getByText('zelda / avian-diversity'))

  // dependant on requests; check markdown rendering
  await waitFor(() => screen.getByText('This is my science.'))
  expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Science')
  expect(screen.getByText('This is my science.'))

  unmount()
})



test('it displays tags view if no markdown', async () => {
  // mimic no science description
  let testData = JSON.parse(JSON.stringify(data))
  testData.versions[0].science_description = null

  const repoUrl = `${url}/repositories/${data.namespace}/${data.name}`
  server.use(
    rest.get(repoUrl, (req, res, ctx) =>
      res(ctx.json(testData))
    )
  )

  const {unmount} = render(
    <MockTheme>
      <App />
    </MockTheme>
  )

  await waitFor(() => screen.getByRole('heading'))
  expect(screen.getByText('zelda / avian-diversity'))

  await waitFor(() => screen.getByText('some tag list'))
  expect(screen.getByText('some tag list'))

  unmount()
})


