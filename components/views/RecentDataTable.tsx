import { useEffect, useState, memo } from 'react'

import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import QuestionMark from '@mui/icons-material/HelpOutlineRounded'
import ZoomInIcon from '@mui/icons-material/ZoomInRounded'

import ErrorMsg from '../../apps/sage/ErrorMsg'
import { relativeTime, isOldData} from '/components/utils/units'

import { useProgress } from '/components/progress/ProgressProvider'
import * as BH from '/components/apis/beehive'
import config from '/config'
import SparkLine from '/components/viz/SparkLine'

const dataBrowser = config.dataBrowserURL


type Props = {
  items: {
    label: string
    query: {
      node?: string // todo(nc): remove; only allow vsns
      vsn?: string
      name: string
      sensor?: string
    },
    format?: (val: string) => string
    linkParams?: (data: BH.Record) => string
  }[]
  showSparkline?: boolean
  className?: string
}

const getStartTime = () => {
  const datetime = new Date()
  datetime.setDate(datetime.getDate() - 1)

  return new Date(datetime).toISOString()
}


export default memo(function RecentDataTable(props: Props) {
  const {items, showSparkline = true, className} = props

  const {setLoading} = useProgress()
  const [recentData, setRecentData] = useState(
    items.reduce((acc, o) => ({...acc, [o.label]: {value: 'loading'}}), {})
  )
  const [sparkLines, setSparkLines] = useState(
    items.reduce((acc, o) => ({...acc, [o.label]: {value: 'loading'}}), {})
  )
  const [error, setError] = useState(null)

  const start = showSparkline ? getStartTime() : null

  useEffect(() => {
    setLoading(true)

    const proms = []
    for (const item of items) {
      const {label, query} = item

      const q = start ? {...query, start} : query
      const p = BH.getRecentRecord(q)
        .then(data => {
          // take latest record for latest value
          const d = data.pop()
          if (!d) {
            setRecentData(prev => ({...prev, [label]: null}))
            return
          }

          setRecentData(prev => ({...prev, [label]: d}))
          setSparkLines(prev => ({...prev, [label]: data}))
        }).catch((err) => {
          setRecentData(prev => ({...prev, [label]: null}))
          setError(err)
        })
      proms.push(p)
    }

    Promise.allSettled(proms)
      .finally(() => setLoading(false))
  }, [items])


  // this is a somewhat crude deeper search for latest data,
  // once other queries are completely finished
  useEffect(() => {
    // stop searching if there's an error
    if (error)
      return

    // if actually all done
    const stillLoading = (Object.values(recentData) || []).filter(o => o?.value == 'loading').length
    if (stillLoading) return

    // if no missing data, we are done
    const noUnavailData = Object.values(recentData).filter(o => o != null).length
    if (noUnavailData)
      return

    // kick off tail searching search
    setLoading(true)
    const proms = []
    for (const item of items) {
      const {label, query} = item

      if (recentData[label] != null)
        continue

      const q = {...query, tail: 1, start: '-999y'}
      const p = BH.getRecentRecord(q)
        .then(data => {
          const d = data.pop()
          if (!d) {
            setRecentData(prev => ({...prev, [label]: null}))
            return
          }

          setRecentData(prev => ({...prev, [label]: d}))
        }).catch((err) => {
          setRecentData(prev => ({...prev, [label]: null}))
          setError(err)
        })
      proms.push(p)
    }

    Promise.allSettled(proms)
      .finally(() => setLoading(false))
  }, [recentData, error])


  return (
    <Root>
      {recentData &&
        <table className={`simple key-value ${className}`}>
          <thead>
            <tr>
              <th></th>
              <th>Latest Time</th>
              <th>Value</th>
              <th>Last 24 Hours</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const {label, format, linkParams} = item

              const data = recentData[label]
              const {value, timestamp} = data || {}

              return (
                <tr key={label}>
                  <td>
                    {label}
                    <Tooltip
                      title={<>{item.query.name}<br/>
                        {item.query.sensor ?
                          <div>{item.query.sensor}</div> : ''}
                        <small>(click for description)</small></>}
                      placement="left"
                    >
                      <a  href={`/data/ontology/${item.query.name}`}
                        target="_blank" rel="noreferrer">
                        <HelpIcon />
                      </a>
                    </Tooltip>
                  </td>
                  <td className={isOldData(timestamp) ? 'failed font-bold nowrap' : 'muted nowrap'}>
                    {data &&
                      <Tooltip title={new Date(timestamp).toLocaleString()} placement="right">
                        <span>
                          {relativeTime(timestamp)}
                        </span>
                      </Tooltip>
                    }
                    {!timestamp && '-'}
                  </td>
                  <td>
                    {value == 'loading' &&
                      <span className="muted">loading...</span>
                    }
                    {(value && value != 'loading' && format)
                      ? format(value) : (value != 'loading' && value)
                    }
                    {value == null &&
                      <span className="muted">Not available</span>
                    }
                  </td>
                  {!showSparkline &&
                    <td>
                      {data && linkParams && data.value != 'loading' &&
                        <a href={`${dataBrowser}?${linkParams(data)}`}>more...</a>
                      }
                    </td>
                  }

                  {showSparkline &&
                    <td>
                      {data && linkParams && data.value != 'loading' &&
                        <SparkLineLink href={`${dataBrowser}?${linkParams(data)}`} target="_blank">
                          <SparkLine data={sparkLines[label]}/>
                          <ZoomInIcon />
                        </SparkLineLink>
                      }
                    </td>
                  }
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

`

const HelpIcon = styled(QuestionMark)`
  position: absolute;
  width: 12px;
  top: 0;
  color: #1c8cc9;
`

const SparkLineLink = styled.a`
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

