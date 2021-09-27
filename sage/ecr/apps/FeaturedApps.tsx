import React from 'react'
import styled from 'styled-components'

import Tooltip from '@material-ui/core/Tooltip'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import PublicIcon from '@material-ui/icons/PublicRounded'
import GithubIcon from '@material-ui/icons/GitHub'

import { Item, Title } from '../../common/Layout'
import { formatters, Thumb, Dot } from '../formatters'
import BeeIcon from 'url:../../../assets/bee.svg'

import config from '../../../config'



export const featuredApps = [
  'seanshahkarami/plugin-iio',
  'seanshahkarami/motion-detector',
  'seanshahkarami/raingauge',
  'iperezx/smoke-detection',
  'seanshahkarami/raingauge',
  'seonghapark/cloudcover-unet',
  'seonghapark/solarirradiance-unet',
  'waggle/bird-song-classifier',
]



type Props = {
  rows: {[key: string]: any}
  onComplete: () => void
  view: 'explore' | 'public' | 'mine'
  onNavigate: (path: string) => void
}

export default function FeaturedApps(props: Props) {
  let {rows, ...rest} = props

  rows = rows.filter(row => featuredApps.includes(`${row.namespace}/${row.name}`))

  return (
    <Root>
      {rows.map((row) =>
        <AppBox key={row.id} data={row} {...rest} className="app-box" />
      )}
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  content: "";
  flex: auto;

  > div {
    width: 32%;
    margin: 0 1px 15px 1px;
  }

  .thumbnail, .placeholder {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 1200px) {
    > div {
      width: 48%;
    }
  }
`



function AppBox(props) {
  const {data, view, onNavigate} = props

  const {
    namespace,
    name,
    versions,
    isPublic,
    description,
    time_last_updated,
    thumbnail
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
      className="flex column justify-between large-click-target"
      onClick={handleClick}
    >

      <div className="flex justify-between">
        <div className="flex">
          <div>
            {thumbnail?.length ?
              <Thumb className="thumbnail" src={`${config.ecr}/meta-files/${thumbnail}`} /> :
              <Thumb className="placeholder" src={BeeIcon} />
            }
          </div>

          <div className="flex column justify-around">
            <Title>{formatters.name(name, data)}</Title>

            {description &&
              <p>{description}</p>
            }
          </div>
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


      <div className="flex muted">
        {view == 'explore' &&
          <>
            {namespace}
            <Dot />
          </>
        }
        {view != 'explore' && isPublic &&
          <>
            <div className="flex items-center">
              <PublicIcon fontSize="small" />&nbsp;<span>public</span>
            </div>
            <Dot />
          </>
        }
        <div>{verCount} tag{verCount > 1 ? 's' : ''}</div>
        <Dot />
        <div>Updated {formatters.time(time_last_updated)}</div>
      </div>

    </Item>
  )
}



