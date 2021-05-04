
import test from '../../testToken'

export const user = test.user
export const token = test.token
export const owner_id = test.owner_id


export function signIn() {
  document.cookie = `username=${user};path=/`
  document.cookie = `token=${token};path=/`
  return true
}


export function isSignedIn() {
  return _checkCookie()
}


export function signOut() {
  document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
}


function _checkCookie() {
  return document.cookie.split(';').some(item => item.includes('username='))
}

