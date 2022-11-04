import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { startCase } from 'lodash'

function format(label: string, val: string) {
  if (label == 'project')
    return <Link to={`/nodes?project="${encodeURIComponent(val)}"`}>{val}</Link>
  else if (label == 'location')
    return <Link to={`/nodes?location="${encodeURIComponent(val)}"`}>{val}</Link>

  return typeof val == 'boolean' ?
    (val ? 'yes' : 'no'):
    ((!val || val == 'none') ? '-' : val)
}


const defaultCols = [
  'node_type',
  'project',
  'location',
  'top_camera',
  'bottom_camera',
  'left_camera',
  'right_camera',
  'shield',
  'modem',
  'modem_sim',
  'nx_agent',
  'build_date',
  'commission_date',
  'registration'
]

type Props = {
  manifest: object
  meta: object
  columns?: string[]
}

export default function ManifestTable(props: Props) {
  const {manifest, meta, columns} = props

  let cols = columns || defaultCols


  return (
    <Root>

      {manifest &&
        <table className="hor-key-value manifest">
          <thead>
            <tr className="cat-header">
              {cols
                .filter(name => name != 'registration')
                .map(name => name == 'top_camera' ?
                  <th key={name} colSpan="4">Cameras</th> :
                  <th key={name}></th>
                ).slice(0, -3)
              }
              {cols.includes('registration') &&
                <th></th>
              }
            </tr>

            <tr>
              {cols
                .filter(name => name != 'registration')
                .map(name => {
                  const label = startCase(name.replace(/_/g, ' ').replace('camera', ''))
                  return <th key={label}>{label}</th>
                })
              }
              {cols.includes('registration') &&
                <th>Registration</th>
              }
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols
                .filter(name => name != 'registration')
                .map(name => {
                  const val = manifest[name]
                  return <td key={name}>{format(name, val)}</td>
                })
              }
              {cols.includes('registration') &&
                <td>{new Date(meta?.registration_event).toLocaleString()}</td>
              }
            </tr>
          </tbody>
        </table>
      }
    </Root>
  )
}

const Root = styled.div`

`
