import React from 'react'
import Tooltip from '@mui/material/Tooltip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

type Props = {
  isBuilding: boolean
  buildResult: string
  buildUrl: string
}

export default function BuildIndicator(props: Props) {
  const {
    isBuilding,
    buildResult,
    buildUrl
  } = props

  return (
    <div>
      {buildUrl &&
        <>
          {isBuilding ?
            <b className="success">Building</b> :
            (buildResult == 'SUCCESS' ? <b className="success">Built</b> : <b className="failed">Failed</b>)
          }
          &nbsp;
          (<Tooltip
            title={<>Jenkins <LaunchIcon style={{fontSize: '1.1em'}}/></>}
          >
            <a href={buildUrl} onClick={evt => evt.stopPropagation()} target="_blank" rel="noreferrer">view</a>
          </Tooltip>)
        </>
      }
    </div>
  )
}


