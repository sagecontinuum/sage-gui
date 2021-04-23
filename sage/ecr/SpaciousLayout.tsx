import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/DeleteOutline'
import PublicIcon from '@material-ui/icons/PublicRounded'
import ShareIcon from '@material-ui/icons/PersonAdd'

import { App } from '../apis/ecr'
import { formatters } from './AppList'


function Row(props) {
  const {data} = props
  const {namespace, name, version, description, time_last_updated} = data


  return (
    <AppRow
      className="flex justify-between"
      to={`app/${namespace}/${name}/${version}`}
    >
      <div className="flex column">
        <h2 className="no-margin">
          {namespace} / {formatters.name(name, data)}{' '}
          <small className="muted">{version}</small>
        </h2>

        {formatters.repo(null, data)}
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
          {formatters.time(time_last_updated)}
        </div>

        <div className="controls">
          <IconButton
            onClick={evt => props.onShare(evt, {namespace, repo: name, version})}
          >
            <ShareIcon />
          </IconButton>
          <IconButton
            onClick={evt => props.onMakePublic(evt, {namespace, repo: name, version})}
          >
            <PublicIcon />
          </IconButton>
          <IconButton
            style={{color: '#912341'}}
            onClick={evt => props.onDelete(evt, {namespace, repo: name, version})}
          >
            <DeleteIcon />
          </IconButton>
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

  .controls {
    display: none;
  }

  :hover .controls {
    display: block;
  }

  svg {
    font-size: 1em;
  }
`



type Props = {
  rows: {[key: string]: any}
  onDelete: (
    event: React.MouseEvent,
    app: App
  ) => void
  onShare: (
    event: React.MouseEvent,
    app: App
  ) => void
  onMakePublic: (
    event: React.MouseEvent,
    app: App
  ) => void
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
