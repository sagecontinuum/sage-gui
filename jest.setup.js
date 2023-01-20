import fetch from 'node-fetch'
import {prettyDOM as prettyPrint} from '@testing-library/react'

window.fetch = fetch
window.prettyDOM = (node) => console.log(prettyPrint(node))

jest.mock('/components/progress/ProgressProvider', () => ({
  useProgress: () => ({ loading: false, setLoading: () => true })
}))

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: () => 'do nothing' })
}))


