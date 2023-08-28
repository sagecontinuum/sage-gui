import { useEffect } from 'react'
import { Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { startCase } from 'lodash'

import settings from './settings'


const mainTitle = settings.project || 'Sage'


export default function MetaRoute() {
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const path = location.pathname

  useEffect(() => {
    const hasParams = !!Object.keys(params).length,
      hasSearchParams = !![...new Set(searchParams.keys())].length

    let subTitle
    if (!(hasParams || hasSearchParams)) {
      subTitle = `${startCase(path.slice(path.lastIndexOf('/')))}`
    } else if (hasParams && !hasSearchParams) {
      subTitle = `${startCase(path.split('/')[1])} | ${Object.values(params).join(' | ')} `
    } else if (hasSearchParams) {
      subTitle =
        `${startCase(path.split('/')[1])} | ` +
        `${[...searchParams.entries()].map(([k,v]) => `${k} ${v}`).join(' | ') }`
    }

    document.title = subTitle ? `${mainTitle} - ${subTitle}` : mainTitle
  }, [path, params, searchParams])

  return (
    <>
      <Outlet />
    </>
  )
}


type MetaProps = {
  children: React.ReactNode
  title?: string
  content?: string
}

export function Meta(props: MetaProps) {

  useEffect(() => {
    document.title = `${mainTitle} - ${props.title}`
  }, [])

  return <>{props.children}</>
}