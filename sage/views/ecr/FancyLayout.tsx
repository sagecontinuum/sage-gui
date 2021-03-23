import React from 'react'
import styled from 'styled-components'
import { VersionTooltip } from './AppList'



// todo: optimize!
const getFormatter = (id, spec) =>
  spec.filter(obj => obj.id == id)[0].format



function Row(props) {
  const {data, spec} = props
  const {namespace, name, version, details} = data

  return (
    <AppRow className="flex column">
      <div>
        <h2 className="no-margin">
          {namespace} / {getFormatter('name', spec)(name, data)}{' '}
          <small className="muted">{version}</small>
        </h2>
      </div>

      <div className="flex row">
        {getFormatter('repo', spec)(null, data)}
        {data.versions.length != 0 &&
          <>&nbsp;|&nbsp; <VersionTooltip versions={data.versions}/></>
        }
        {data.permissions.length > 1 ?
          <>&nbsp;|&nbsp;{getFormatter('permissions', spec)(data.permissions)}</> : <></>
        }
      </div>

      <p>
        {details.description}
      </p>
    </AppRow>
  )
}

const AppRow = styled.div`
  margin-bottom: 20px;

  svg {
    font-size: 1em;
  }
`



type Props = {
  columns: object[]  // todo: type
  rows: {[key: string]: any}
}

export default function FancyLayout(props: Props) {
  const {columns, rows} = props

  return (
    <Root>
      <Divider />
      <Rows>
        {rows.map(row => {
          return (
            <Row key={row.details.id} spec={columns} data={row} />
          )
        })}
      </Rows>
    </Root>
  )
}

const Root = styled.div`
  margin-top: 1em;
`

const Divider = styled.hr`
   border-top: 1px solid #ccc;
`

const Rows = styled.div`
  margin-top: 1em;
`
