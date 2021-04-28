import React from 'react'
import styled from 'styled-components'

import { Link } from 'react-router-dom'

import AppActions from './AppActions'
import { formatters } from './AppList'




function Row(props) {
  const {data, onComplete} = props
  const {namespace, name, version, versions, description, time_last_updated} = data

  const verCount = versions.length

  return (
    <AppRow
      className="flex justify-between"
      to={`app/${namespace}/${name}/${version}`}
    >
      <div className="flex column">
        <h2 className="no-margin">
          {namespace} / {formatters.name(name, data)}{' '}
        </h2>

        <div className="flex">
          {formatters.repo(null, data)}

          {verCount > 1 &&
            <>&nbsp;|&nbsp;
              <span className="muted">
                {verCount} versions
              </span>
            </>
          }
        </div>

        {/*
          data.versions.length != 0 &&
          <>&nbsp;|&nbsp; <VersionTooltip versions={data.versions}/></>
        */}

        {/*
          data.permissions.length > 1 ?
          <>&nbsp;|&nbsp;{getFormatter('permissions', spec)(data.permissions)}</> : <></>
        */}

        {description && <p>{description}</p>}
      </div>


      <div className="flex column items-end">
        <div className="muted">
          Updated {formatters.time(time_last_updated)}<br/>
        </div>

        <div className="actions">
          <AppActions
            onComplete={onComplete}
            namespace={namespace}
            name={name}
            version={version}
          />
        </div>
      </div>
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
    display: none;
  }

  :hover .actions {
    display: block;
  }

  svg {
    font-size: 1em;
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
