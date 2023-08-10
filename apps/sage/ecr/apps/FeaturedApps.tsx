import { Link } from 'react-router-dom'

import Tooltip from '@mui/material/Tooltip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import GithubIcon from '@mui/icons-material/GitHub'
import TimelineIcon from '@mui/icons-material/ViewTimelineOutlined'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Unstable_Grid2'

import { Item, Title } from '/components/layout/Layout'
import { formatters, Thumb, Dot } from '../formatters'
import BeeIcon from '/assets/bee.svg'

import { truncate } from 'lodash'

import config from '/config'
import { type AppDetails } from '/components/apis/ecr'


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
    <Grid xs={12} md={6} lg={4} xl={3}>
      <Item
        className="large-click-target flex no-margin h-full"
        onClick={handleClick}
      >
        <div>
          {thumbnail?.length ?
            <Thumb><img src={`${config.ecr}/meta-files/${thumbnail}`} /></Thumb> :
            <Thumb><BeeIcon /></Thumb>
          }
        </div>

        <div className="flex column justify-between flex-grow">
          <div className="flex justify-between">
            <Title>{formatters.name(name, data)}</Title>
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

          {description &&
            <p>{truncate(description, {length: 70})}</p>
          }

          <div className="flex muted items-center justify-between">
            <div className="flex">
              {view == 'explore' &&
                <>{namespace} <Dot /></>
              }
              <div>{verCount} tag{verCount > 1 ? 's' : ''}</div>
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

      </Item>
    </Grid>
  )
}



type Props = {
  rows: AppDetails[]
  onComplete: () => void
  view: 'explore' | 'public' | 'mine'
  onNavigate: (path: string) => void
}

export default function FeaturedApps(props: Props) {
  const {rows, ...rest} = props

  return (
    <Grid container spacing={2}>
      {rows.map((row) =>
        <AppBox key={row.id} data={row} {...rest} />
      )}
    </Grid>
  )
}


