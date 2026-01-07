/* eslint-disable react/display-name */
import { Link } from 'react-router-dom'
import { styled } from '@mui/material'
import GithubIcon from '@mui/icons-material/GitHub'
import Tooltip from '@mui/material/Tooltip'

import * as utils from '/components/utils/units'

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
      <Link to={`../app/${row.namespace}/${row.name}`}>
        {versions.length} tag{versions.length > 1 ? 's' : ''}
      </Link>
    </Tooltip>
  )
}


export const formatters = {
  name: (name, o) => {
    return <Link to={`../app/${o.namespace}/${name}`}>{name}</Link>
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
        <GithubIcon fontSize="small"/>&nbsp;&nbsp;
        {url.slice(url.lastIndexOf('/') + 1).replace('.git', '')}
      </a>
    )
  },
  time: val => {
    return utils.msToTimeApprox(Date.now() - new Date(val).getTime())
  }
}


export const Thumb = styled('div')`
  img, svg {
    width: 125px;
    height: 125px;
    object-fit: cover;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-right: 1em;
  }

  svg {
    padding: 1em;
    filter: drop-shadow(0px 0px 0.3rem #ccc);
  }
`


export const Dot = styled('div')`
  margin: 0 10px;
  :before {
    content: "·";
  }
`