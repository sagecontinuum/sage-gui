import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import GithubIcon from '@mui/icons-material/GitHub'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'

import Button from '@mui/material/Button'

import { Item, Title } from '/components/layout/Layout'
import { formatters, Thumb, Dot } from '../formatters'
import BeeIcon from 'url:/assets/bee.svg'

import {truncate} from 'lodash'

import config from '/config'


function AppBox(props) {
  const {data, view, onNavigate} = props

  const {
    namespace,
    name,
    versions,
    description,
    thumbnail,
    hasRecentData
  } = data


  const verCount = versions.length

  const handleClick = (evt) => {
    if (evt.target.closest('.MuiDialog-root')) {
      // prevent navigation if using dialog
      evt.preventDefault()
      return
    }

    // if not link or button, allow navigation
    if (!evt.target.hasAttribute('href') && !evt.target.closest('.MuiButtonBase-root')) {
      onNavigate(`/apps/app/${namespace}/${name}`)
    }
  }

  return (
    <Item
      className="large-click-target col-span-12 min-[768px]:col-span-6"
      onClick={handleClick}
    >
      <div className="flex grow">

        {thumbnail?.length ?
          <Thumb className="thumbnail" src={`${config.ecr}/meta-files/${thumbnail}`} /> :
          <Thumb className="placeholder" src={BeeIcon} />
        }

        <div className="flex column justify-between grow">
          <div className="flex justify-between">
            <div>
              <Title>{formatters.name(name, data)}</Title>
            </div>
            <div>
              <Tooltip
                title={<>GitHub <LaunchIcon style={{fontSize: '1.1em'}}/></>}
                placement="top"
                className="external-link hover"
              >
                <a href={data.source.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  <GithubIcon className="text-color" />
                </a>
              </Tooltip>
            </div>
          </div>


          {description &&
          <p>{truncate(description, {length: 70})}</p>
          }

          <div className="flex muted items-center justify-between">
            <div className="flex">
              {view == 'explore' &&
              <>{namespace} <Dot /></>
              }
              <div className="whitespace-nowrap">{verCount} tag{verCount > 1 ? 's' : ''}</div>
            </div>

            {hasRecentData &&
              <Tooltip title="Recent data (from within the last year) is avaiable">
                <Button
                  component={Link}
                  to={`/apps/app/${namespace}/${name}?tab=data`}
                  className="nowrap pull-right"
                  startIcon={<TimelineIcon/>}
                >
                  data
                </Button>
              </Tooltip>
            }
          </div>

        </div>
      </div>
    </Item>
  )
}



type Props = {
  rows: {[key: string]: any}
  onComplete: () => void
  view: 'explore' | 'public' | 'mine'
  onNavigate: (path: string) => void
}

export default function FeaturedApps(props: Props) {
  const {rows, ...rest} = props

  return (
    <Root className="grid grid-cols-12 gap-4">
      {rows.map((row) =>
        <AppBox key={row.id} data={row} {...rest} />
      )}
    </Root>
  )
}

const Root = styled.div`
  > div {
    margin: 0;
  }

`



