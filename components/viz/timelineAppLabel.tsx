import { Link } from 'react-router-dom'
import { Tooltip } from '@mui/material'

import * as ECR from '/components/apis/ecr'


export default function appLabel(label: string, ecrAppList: ECR.App[]) : JSX.Element {
  const path = label.replace('registry.sagecontinuum.org/', '')
  const shortened = label.slice(label.lastIndexOf('/') + 1 )

  if (!ECR.repoIsPublic(ecrAppList, path))
    return (
      <Tooltip title={label} placement="right">
        <span>{shortened}</span>
      </Tooltip>
    )

  return (
    <Tooltip title={<>{path}<br/>(click for details)</>} placement="right">
      <Link to={`/apps/app/${path}`} key={label}>
        {shortened}
      </Link>
    </Tooltip>
  )
}
