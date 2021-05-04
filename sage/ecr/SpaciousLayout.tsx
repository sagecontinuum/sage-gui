import React from 'react'
import styled from 'styled-components'

import Divider from '@material-ui/core/Divider'
import Tooltip from '@material-ui/core/Tooltip'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import PublicIcon from '@material-ui/icons/PublicRounded'
import SharedIcon from '@material-ui/icons/PeopleAltRounded'
import GithubIcon from '@material-ui/icons/GitHub'
import { Link } from 'react-router-dom'

import RepoActions from './RepoActions'
import { formatters } from './formatters'


const VertDivide = () =>
  <Divider orientation="vertical" style={{margin: '8px' }} flexItem/>


function Row(props) {
  const {data, onComplete} = props
  const {
    namespace,
    name,
    version,
    versions,
    isPublic,
    isShared,
    description,
    time_last_updated
  } = data

  const verCount = versions.length

  return (
    <AppRow
      className="flex column justify-between"
      to={`app/${namespace}/${name}/${version}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Repo>
            {namespace} / {formatters.name(name, data)}{' '}
          </Repo>
          &nbsp;
          <div className="muted">{isShared && <SharedIcon />}</div>
        </div>

        <div className="flex column items-end muted">
          <div className="flex items-center details">
            {isPublic &&
              <>
                <div className="flex items-center">
                  <PublicIcon />&nbsp;<span>public</span>
                </div>
                <VertDivide />
              </>
            }
            <div>
              {verCount} tag{verCount > 1 ? 's' : ''}
            </div>
            <VertDivide />
            <div>
              Updated {formatters.time(time_last_updated)}
            </div>

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
        </div>

      </div>

      {description && <p>{description}</p>}
    </AppRow>
  )
}

const AppRow = styled(Link)`
  position: relative;
  margin: 20px 0;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 2px;
  box-shadow: 0px 0px 1px 1px #f8f8f8;
  color: initial;

  :hover {
    text-decoration: none;
    border: 1px solid rgb(28, 140, 201);
  }

  .actions {
    position: absolute;
    display: none;
    bottom: .5rem;
    right: .6rem;
  }

  :hover .actions {
    display: block;
  }

  :hover .details {
    // display: none;
  }
`

const Repo = styled.div`
  font-size: 1.5em;
  font-weight: 800;
`




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
