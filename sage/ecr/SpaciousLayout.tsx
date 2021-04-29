import React from 'react'
import styled from 'styled-components'

import PublicIcon from '@material-ui/icons/PublicRounded'
import SharedIcon from '@material-ui/icons/PeopleAltRounded'
import { Link } from 'react-router-dom'

import AppActions from './AppActions'
import { formatters } from './AppList'




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
      className="flex justify-between"
      to={`app/${namespace}/${name}/${version}`}
    >
      <div className="flex column">
        <div className="flex items-center">
          <h2 className="no-margin">
            {namespace} / {formatters.name(name, data)}{' '}
          </h2>
          &nbsp;
          {isShared && <SharedIcon />}
        </div>

        <div className="flex">
          {formatters.repo(null, data)}
        </div>

        {description && <p>{description}</p>}
      </div>


      <div className="flex column items-end">

        <div className="flex muted items-center">
          <div className="flex items-center">
            {isPublic && <>&nbsp;<PublicIcon /> <span>public</span>&nbsp;|&nbsp;</>}
            {verCount} tag{verCount > 1 ? 's' : ''}&nbsp;|&nbsp;
          </div>

          <div>
            Updated {formatters.time(time_last_updated)}
          </div>
        </div>

        <div className="actions">
          <AppActions
            namespace={namespace}
            name={name}
            version={version}
            isPublic={isPublic}
            onComplete={onComplete}
          />
        </div>
      </div>
    </AppRow>
  )
}

const AppRow = styled(Link)`
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
    display: none;
  }

  :hover .actions {
    display: block;
  }
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
