import { useEffect, useState, memo } from 'react'
import { Link } from 'react-router-dom'

import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import ZoomInIcon from '@mui/icons-material/ZoomInRounded'

import ErrorMsg from '/apps/sage/ErrorMsg'
import { relativeTime, isOldData } from '/components/utils/units'

import { useProgress } from '/components/progress/ProgressProvider'
import * as BH from '/components/apis/beehive'

import SparkLine from '/components/viz/SparkLine'

import { shortUnits } from '/components/measurement.config'


// import { subDays } from 'date-fns'
// todo(nc): use computed static start time
// const getStartTime = () =>
//  subDays(new Date(), 1).toISOString()


type SparkLine = {timestamp: string, value: number}[]


const getClassName = (timestamp, inactive) =>
  inactive ? 'inactive font-bold nowrap' :
    (isOldData(timestamp) ? 'failed font-bold nowrap' : 'muted nowrap')


const renderValue = (value, format, meta, item) => {
  if (value == 'loading')
    return <span className="muted">loading...</span>
  else if (value != 'loading' && format)
    return format(value as number)
  else if (value == null)
    return <span className="muted">n/a</span>
  return `${value}${shortUnits[meta.units] || meta.units || item.units || ''}`
}


type Props = {
  title?: string
  previewLabel?: string
  items: {
    label: string
    query: {
      vsn?: string
      name: string
      sensor?: string
    },
    format?: (val: number) => string
    linkParams?: (data: BH.Record) => string
    units?: string
  }[]
  showSparkline?: boolean
  className?: string
  inactive?: boolean
}


export default memo(function RecentDataTable(props: Props) {
  const {title, previewLabel, items, showSparkline = true, className, inactive = false} = props

  const {setLoading} = useProgress()
  const [recentData, setRecentData] = useState<{[name: string]: BH.Record}>(
    items.reduce((acc, o) => ({...acc, [o.query.name]: {value: 'loading'}}), {})
  )
  const [sparkLines, setSparkLines] = useState<{[name: string]: BH.Record[]}>({})

  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    const proms = []
    for (const item of items) {
      const {query} = item
      const {name} = query

      const p = BH.getRecentRecord(query)
        .then(data => {
          // take latest record for latest value
          const d = data.pop()
          if (!d) {
            // find for latest record
            const q = {...query, tail: 1, start: '-999y'}
            BH.getRecentRecord(q)
              .then(data => {
                const d = data.pop()
                if (!d) {
                  setRecentData(prev => ({...prev, [name]: null}))
                  return
                }

                setRecentData(prev => ({...prev, [name]: d}))
              }).catch((err) => {
                setRecentData(prev => ({...prev, [name]: null}))
                setError(err)
              })
            return
          }

          setRecentData(prev => ({...prev, [name]: d}))
          setSparkLines(prev => ({...prev, [name]: data}))
        }).catch((err) => {
          setRecentData(prev => ({...prev, [name]: null}))
          setError(err)
        })
      proms.push(p)
    }

    Promise.allSettled(proms)
      .finally(() => setLoading(false))
  }, [])


  return (
    <Root>
      {recentData &&
        <table className={`simple key-value ${className}`}>
          <thead>
            <tr>
              <th>{title || ''}</th>
              <th>latest time</th>
              <th>{previewLabel || 'Last 24 Hours'}</th>
              <th className="value">value</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const {query, label, format, linkParams} = item
              const {name, sensor} = query

              const data = recentData[name]
              const {value, timestamp, meta} = data || {}

              return (
                <tr key={name}>
                  <td>
                    {label || name}
                    <Tooltip
                      title={
                        <>
                          <div><code>name</code>: {name}</div>
                          {sensor && <div><code>sensor</code>: {sensor}</div>}
                          {meta?.units && <div><code>meta.units</code>: {meta.units}</div>}
                          {item.units && <div>configured units: {item.units}</div>}
                        </>
                      }
                      placement="left"
                    >
                      <Link to={`/data/ontology/${name}`}
                        target="_blank" rel="noreferrer">
                        <HelpIcon />
                      </Link>
                    </Tooltip>
                  </td>
                  <td className={getClassName(timestamp, inactive)}>
                    {data &&
                      <Tooltip title={new Date(timestamp).toLocaleString()} placement="right">
                        <span>
                          {relativeTime(timestamp)}
                        </span>
                      </Tooltip>
                    }
                    {!timestamp && '-'}
                  </td>

                  {!showSparkline &&
                    <td>
                      {data && linkParams && data.value != 'loading' &&
                        <Link to={`/query-browser?${linkParams(data)}`}>more...</Link>
                      }
                    </td>
                  }

                  {showSparkline &&
                    <td>
                      {data && linkParams && data.value != 'loading' &&
                        <SparkLineLink>
                          <Link to={`/query-browser?${linkParams(data)}`} target="_blank">
                            <SparkLine data={sparkLines[name]}/>
                            <ZoomInIcon />
                          </Link>
                        </SparkLineLink>
                      }
                    </td>
                  }
                  <td className="value">
                    {renderValue(value, format, meta, item)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      }

      {error &&
        <ErrorMsg>{error.message}</ErrorMsg>
      }
    </Root>
  )
}, (prev, next) => prev.items != next.items)

const Root = styled.div`
  thead th {
    color: #fff;
    background: #4e2a84;
    :first-child { border-radius: 4px 0 0 0; }
    :last-child { border-radius: 0px 4px 0 0; }
  }

  table thead th:not(:first-child) {
    color: #e9dbff;
  }

  .value {
    text-align: right;
  }
`

const HelpIcon = styled(InfoIcon)`
  position: absolute;
  width: 12px;
  top: 0;
  color: #1c8cc9;
`

const SparkLineLink = styled.div`
  &:hover canvas {
    background-color: rgba(0, 0, 0, .3);
  }

  .MuiSvgIcon-root {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    color: #f2f2f2;
    display: none;
  }

  &:hover .MuiSvgIcon-root {
    display: block;
  }
`


type EmptyTableProps = {
  title: string
  content?: string | JSX.Element
}

export function EmptyTable(props: EmptyTableProps) {
  const {title, content} = props
  return (
    <Root>
      <table className={`simple key-value`}>
        <thead>
          <tr>
            <th>{title}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <span className="muted text-center">
                {content || 'Not available'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Root>
  )
}
