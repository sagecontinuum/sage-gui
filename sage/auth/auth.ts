
import user from '../../testToken'


export function signIn() {
  document.cookie = `username=${user.name};path=/`
  document.cookie = `token=${user.token};path=/`
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

