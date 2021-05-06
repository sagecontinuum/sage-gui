


export function signIn(user: string, user_id: string, token: string) {
  document.cookie = `username=${user};path=/`
  document.cookie = `user_id=${user_id};path=/`
  document.cookie = `token=${token};path=/`
}


export function getUser() {
  return _getCookieValue('username')
}


export function getUserId() {
  return _getCookieValue('user_id')
}


export function getToken() {
  return _getCookieValue('token')
}


export function isSignedIn() {
  return _getCookieValue('user_id')
}


export function signOut() {
  document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
}


function _getCookieValue(key) {
  const match = document.cookie.split(';')
    .filter(item => item.includes(key))

  if (!match.length)
    return null

  return match[0].split('=')[1]
}