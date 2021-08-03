import React from 'react'
import styled from 'styled-components'

import Divider from '@material-ui/core/Divider'
import Tooltip from '@material-ui/core/Tooltip'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import PublicIcon from '@material-ui/icons/PublicRounded'
import SharedIcon from '@material-ui/icons/PeopleAltRounded'
import GithubIcon from '@material-ui/icons/GitHub'

import { Item, Title } from '../common/Layout'
import RepoActions from './RepoActions'
import { formatters } from './formatters'
import BuildIndicator from './common/BuildIndicator'

import * as Auth from '../../components/auth/auth'

const isSignedIn = Auth.isSignedIn()


type Props = {
  rows: {[key: string]: any}
  onComplete: () => void
}

export default function SpaciousLayout(props: Props) {
  const {rows, ...rest} = props

  return (
    <Root>
      <HR />
      <Rows>
        {rows.map((row) =>
          <Row key={row.id} data={row} {...rest} />
        )}
      </Rows>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 1em;
`

const HR = styled.div`
  border-top: 1px solid #ddd;
`

const Rows = styled.div`
  margin-top: 1em;
`




const VertDivide = () =>
  <Divider orientation="vertical" style={{margin: '8px' }} flexItem/>


function Row(props) {
  const {data, view, onComplete, onNavigate} = props

  const {
    namespace,
    name,
    version,
    versions,
    isPublic,
    isShared,
    description,
    time_last_updated,
    isBuilding,
    buildResult,
    buildUrl
  } = data

  const verCount = versions.length

  const handleClick = (evt) => {
    if (evt.target.closest('.MuiDialog-root')) {
      // prevent navigation if using dialog
      evt.preventDefault()
    }
  }

    if (!evt.target.hasAttribute('href')) {
      onNavigate(`/apps/app/${namespace}/${name}`)
    }

  return (
    <Item
      className="flex column justify-between"
      to={`app/${namespace}/${name}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Title>
            {namespace} / {formatters.name(name, data)}{' '}
          </Title>
          &nbsp;
          <div className="muted">{isShared && <SharedIcon />}</div>
        </div>

        <div className="flex column items-end muted">
          <div className="flex items-center details">
            <BuildIndicator buildUrl={buildUrl} isBuilding={isBuilding} buildResult={buildResult} />
            {buildUrl && <VertDivide />}

            {isPublic &&
              <>
                <div className="flex items-center">
                  <PublicIcon fontSize="small" />&nbsp;<span>public</span>
                </div>
                <VertDivide />
              </>
            }

            <div>{verCount} tag{verCount > 1 ? 's' : ''}</div>

            <VertDivide />

            <div>Updated {formatters.time(time_last_updated)}</div>

            <VertDivide />

            <span className="external-link hover">
              <Tooltip
                title={<>GitHub <LaunchIcon style={{fontSize: '1.1em'}}/></>}
                placement="top"
              >
                <a href={data.source.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  <GithubIcon className="text-color" />
                </a>
              </Tooltip>
            </span>
          </div>

          {isSignedIn &&
            <div className="actions">
              <RepoActions
                namespace={namespace}
                name={name}
                version={version}
                isPublic={isPublic}
                onComplete={onComplete}
                versionCount={versions.length}
              />
            </div>
          }
        </div>

      </div>

      {description && <p>{description}</p>}
    </Item>
  )
}
