import {test, describe} from '@jest/globals'
import request from 'supertest'

import app from './RegistrationApi'

// required for service
const authURL = process.env.authURL
const tokenInfoPassword = process.env.tokenInfoPassword

if (!authURL) {
  console.error('Must provide "authURL" env variable to run tests')
  return
}

if (!tokenInfoPassword) {
  console.error('Must provide "tokenInfoPassword" env variable to run tests')
  return
}

// required to run all tests
const USER_TOKEN = process.env.USER_TOKEN
console.log('Running tests with "USER_TOKEN" env variable:', USER_TOKEN)


describe('GET /register', () => {

  test('fails with no token', (done) => {
    request(app)
      .get('/register')
      .expect('Content-Type', /json/)
      .expect(401, {
        message: 'no authorization header provided'
      }, done)
  })

  test('fails invalid format', (done) => {
    request(app)
      .get('/register')
      .set('Authorization', 'some_fake_token')
      .expect(401, {
        message: 'Authorization string format not valid'
      }, done)
  })

  test('fails on bad token', (done) => {
    request(app)
      .get('/register')
      .set('Authorization', 'sage fake_token_xyz')
      .expect(410, {
        error: 'token not found'
      }, done)
  })

  test('passes with user token', (done) => {
    if (!USER_TOKEN) {
      console.warn('[skipped]: passes with user token')
      done()
      return
    }

    request(app)
      .get('/register')
      .set('Authorization', `sage ${USER_TOKEN}`)
      .expect(200, {
        error: 'success' // todo: mock CA_PATH and ssh keys?
      }, done)
  })

})

