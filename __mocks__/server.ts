import { setupServer } from 'msw/node'
import { handlers } from '../components/apis/ecr.mocks'

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers)