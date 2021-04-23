import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/DeleteOutline'
import PublicIcon from '@material-ui/icons/PublicRounded'
import ShareIcon from '@material-ui/icons/PersonAdd'
import Divider from '@material-ui/core/Divider'

import { App } from '../apis/ecr'


// todo: optimize?
const getFormatter = (id, spec) =>
  spec.filter(obj => obj.id == id)[0].format



function Row(props) {
  const {data, spec} = props
  const {namespace, name, version, details} = data


  return (
    <AppRow
      className="flex column"
      to={`app/${namespace}/${name}/${version}`}
    >
      <div>
        <h2 className="no-margin">
          {namespace} / {getFormatter('name', spec)(name, data)}{' '}
          <small className="muted">{version}</small>
        </h2>
      </div>

      <div className="flex row">
        {/*getFormatter('repo', spec)(null, data)*/}
        {/*data.versions.length != 0 &&
          <>&nbsp;|&nbsp; <VersionTooltip versions={data.versions}/></>
        */}

        {/*data.permissions.length > 1 ?
          <>&nbsp;|&nbsp;{getFormatter('permissions', spec)(data.permissions)}</> : <></>
        */}
      </div>

      description will go here
      {/*details.description &&
        <p>{details.description}</p>
      */}

      <div className="controls flex">
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
    position: absolute;
    right: 10px;
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
  columns: object[]  // todo: type
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
  const {rows, columns, ...rest} = props

  return (
    <Root>
      <HR />
      <Rows>
        {rows.map((row) =>
          <Row key={row.id} data={row} spec={columns} {...rest} />
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
