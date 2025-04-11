/**
 * simple helper to render an object once it's ready (uploaded)
 */

import { useEffect, useState } from 'react'
import * as BH from '/components/apis/beehive'

type Props = {
  url: string
  retry?: boolean
}

export default function ObjectRenderer(props: Props) {
  const {url, retry} = props

  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!url || !retry) return

    BH.retryHead(url)
      .then(res => {
        setReady(true)
      }).catch(() => {
        // todo: fallback gracefully
      })
  }, [])

  return (
    <>
      {!retry && <img src={url} />}
      {ready && <img src={url} />}
      {retry && !ready && 'loading...'}
    </>
  )
}