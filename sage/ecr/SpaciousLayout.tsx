import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { VersionTooltip } from './AppList'



// todo: optimize?
const getFormatter = (id, spec) =>
  spec.filter(obj => obj.id == id)[0].format



function Row(props) {
  const {data, spec} = props
  const {namespace, name, version, details} = data

  return (
    <AppRow className="flex column" to={`app/${namespace}/${name}/${version}`}>
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
  }

  :hover {
    border: 1px solid rgb(28, 140, 201);

  }
  svg {
    font-size: 1em;
  }
`



type Props = {
  columns: object[]  // todo: type
  rows: {[key: string]: any}
}

export default function SpaciousLayout(props: Props) {
  const {columns, rows} = props

  return (
    <Root>
      <Divider />
      <Rows>
        {rows.map((row, i) => {
          return (
            <>
              <Row key={row.id} spec={columns} data={row} />
            </>
          )
        })}
      </Rows>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 1em;
`

const Divider = styled.div`
   border-top: 1px solid #ddd;
`

const Rows = styled.div`
  margin-top: 1em;
`
