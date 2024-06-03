

// other art: https://developers.google.com/web/updates/2017/09/abortable-fetch
export function abortableFetch(request, opts) {
  const controller = new AbortController()
  const signal = controller.signal

  return {
    abort: () => controller.abort(),
    ready: fetch(request, { ...opts, signal })
  }
}


export function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


export function handleDjangoErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.detail)
  })
}