import config from '/config'
const webOrigin = window.location.origin



class Auth {
  url: string
  user: string
  isSignedIn: boolean
  token: string
  signOutEvent: Event

  constructor() {
    this.url = config.auth
    this.user = this.getUser()
    this.isSignedIn = this.hasToken()
    this.token = this.getToken()

    // sign out of all tabs
    window.addEventListener('storage', event => {
      if (event.key !== 'sage_token')
        return

      if (event.newValue == null)
        this.signOut()
    })
  }


  private getUser() {
    return _getCookieValue('sage_username')
  }


  private getToken() {
    return _getCookieValue('sage_token')
  }


  private hasToken() {
    return _getCookieValue('sage_token') !== undefined
  }


  signIn(user: string, token: string) {
    document.cookie = `sage_username=${user};path=/`
    document.cookie = `sage_token=${token};path=/`

    // for signing out of all tabs
    window.localStorage.setItem('sage_token', token)
  }


  signOut() {
    const host = window.location.hostname
    const domain = host.includes('.') ?  `${host.slice(host.indexOf('.'))}` : host
    document.cookie = `sage_username=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
    document.cookie = `sage_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`

    window.localStorage.removeItem('sage_token')

    const signOutUrl = `${this.url}/portal-logout`
    window.location.href = `${signOutUrl}/?callback=${webOrigin}`
  }
}


// singleton
export default new Auth() as Auth


function _getCookieValue(key) {
  const match = document.cookie.split('; ')
    .find(row => row.startsWith(`${key}=`))

  if (!match)
    return undefined

  return match.split('=')[1].replace(/^"(.*)"$/, '$1')
}

