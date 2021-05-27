/* eslint-disable react/display-name */
import React from 'react'
import { Link } from 'react-router-dom'
import GithubIcon from '@material-ui/icons/GitHub'
import Tooltip from '@material-ui/core/Tooltip'

import * as utils from '../../components/utils/units'

type VerTooltipProps = {
  row: object
}

function VersionTooltip(props: VerTooltipProps) {
  const {row} = props

  const versions = row.versions

  return (
    <Tooltip
      arrow
      title={
        <>
          <div>Tags:</div>
          {versions.map(ver => <div key={ver}>{ver}</div>)}
        </>
      }
    >
      <Link to={`app/${row.namespace}/${row.name}`}>
        {versions.length} tag{versions.length > 1 ? 's' : ''}
      </Link>
    </Tooltip>
  )
}


export const formatters = {
  name: (name, o) => {
    return <Link to={`app/${o.namespace}/${name}`}>{name}</Link>
  },
  versions: (versions, row) => {
    if (!versions?.length) return '-'

    return (
      <>
        {versions[versions?.length - 1].version}{' '}
        <VersionTooltip row={row}/>
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

