/* eslint-disable react/display-name */
import React from 'react'
import { Link } from 'react-router-dom'
import GithubIcon from '@material-ui/icons/GitHub'
import Tooltip from '@material-ui/core/Tooltip'

import * as utils from '../../components/utils/units'

type VerTooltipProps = {
  versions: {version: string}[]
}

function VersionTooltip(props: VerTooltipProps) {
  const {versions} = props

  return (
    <Tooltip
      arrow
      title={
        <>
          <div>Versions:</div>
          {versions.map(ver => <div key={ver}>{ver}</div>)}
        </>
      }
    >
      <a>{versions.length} version{versions.length > 1 ? 's' : ''}</a>
    </Tooltip>
  )
}


export const formatters = {
  name: (name, o) => {
    return <Link to={`app/${o.namespace}/${name}`}>{name}</Link>
  },
  versions: (versions) => {
    if (!versions?.length) return '-'

    return (
      <>
        {versions[versions?.length - 1].version}{' '}
        <VersionTooltip versions={versions}/>
      </>
    )
  },
  repo: (_, {source}) => {
    const {url} = source

    if (!url) return <></>

    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center">
        <GithubIcon fontSize="small" className="text-color" />&nbsp;
        {url.slice(url.lastIndexOf('/') + 1).replace('.git', '')}
      </a>
    )
  },
  time: val => {
    return utils.msToTimeApprox(Date.now() - new Date(val).getTime())
  }
}

