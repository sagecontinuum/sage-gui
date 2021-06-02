import config from '../../config'
export const url = config.auth


export function signIn(user: string, user_id: string, token: string) {
  document.cookie = `sage_username=${user};path=/`
  document.cookie = `sage_uuid=${user_id};path=/`
  document.cookie = `sage_token=${token};path=/`
}


export function getUser() {
  return _getCookieValue('sage_username')
}


export function getUserId() {
  return _getCookieValue('sage_uuid')
}


export function getToken() {
  return _getCookieValue('sage_token')
}


export function isSignedIn() {
  return _getCookieValue('sage_token') !== undefined
}


export function signOut() {
  const host = window.location.hostname
  const domain = host.includes('.') ?  `${host.slice(host.indexOf('.'))}` : host
  document.cookie = `sage_username=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
  document.cookie = `sage_uuid=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
  document.cookie = `sage_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
  document.cookie = `sage_token_exp=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
}


function _getCookieValue(key) {
  const match = document.cookie.split('; ')
    .find(row => row.startsWith(`${key}=`))

  if (!match)
    return undefined

  return match.split('=')[1].replace(/^"(.*)"$/, '$1')
}