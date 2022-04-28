import { useEffect, useState, memo } from 'react'

import styled from 'styled-components'

import Tooltip from '@mui/material/Tooltip'
import QuestionMark from '@mui/icons-material/HelpOutlineRounded'

import ErrorMsg from '../sage/ErrorMsg'
import { relTime, isOldData} from '/components/utils/units'

import { useProgress } from '/components/progress/ProgressProvider'
import * as BH from '/components/apis/beehive'
import config from '/config'
import SparkLine from './SparkLine'

const dataBrowser = config.dataBrowserURL


type Props = {
  items: {
    label: string
    query: {
      node: string
      name: string
      sensor?: string
    },
    format?: (val: string) => string
    linkParams?: (data: BH.Record) => string
  }[]
  showSparkline?: boolean
  className?: string,
}

const getStartTime = () => {
  let datetime = new Date()
  datetime.setDate(datetime.getDate() - 1)

  return new Date(datetime).toISOString()
}


export default memo(function RecentDataTable(props: Props) {
  const {items, showSparkline = true, className} = props

  const {loading, setLoading} = useProgress()
  const [recentData, setRecentData] = useState(
    items.reduce((acc, o) => ({...acc, [o.label]: {value: 'loading'}}), {})
  )
  const [sLines, setSLines] = useState(
    items.reduce((acc, o) => ({...acc, [o.label]: {value: 'loading'}}), {})
  )
  const [error, setError] = useState(null)

  const start = showSparkline ? getStartTime() : null

  useEffect(() => {
    setLoading(true)

    let proms = []
    for (const item of items) {
      const {label, query} = item


      const q = start ? {...query, start} : query
      const p = BH.getRecentRecord(q)
        .then(data => {
          const d = data.pop()
          if (!d) {
            setRecentData(prev => ({...prev, [label]: null}))
            return
          }

          setRecentData(prev => ({...prev, [label]: d}))
          setSLines(prev => ({...prev, [label]: data}))
        }).catch((err) => {
          setRecentData(prev => ({...prev, [label]: null}))
          setError(err)
        })
      proms.push(p)
    }

    Promise.allSettled(proms)
      .finally(() => setLoading(false))
  }, [items])


  return (
    <Root>
      {recentData &&
        <table className={`simple key-value ${className}`}>
          <thead>
            <tr>
              <th></th>
              <th>Latest Time</th>
              <th>Value</th>
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
                    <Tooltip title={<>{item.query.name}<br/>{item.query.sensor ? <div>{item.query.sensor}</div> : ''}<small>(click for description)</small></>} placement="left">
                      <a href={`${dataBrowser}/ontology/${item.query.name}`} target="_blank"><HelpIcon /></a>
                    </Tooltip>
                  </td>
                  <td className={isOldData(timestamp) ? 'failed font-bold nowrap' : 'muted nowrap'}>
                    {data &&
                      <Tooltip title={new Date(timestamp).toLocaleString()} placement="right">
                        <span>
                          {relTime(timestamp)}
                        </span>
                      </Tooltip>
                    }
                    {!timestamp && '-'}
                  </td>
                  <td>
                    {value == 'loading' &&
                      <span className="muted">loading...</span>
                    }
                    {(value && value != 'loading' && format) ? format(value) : (value != 'loading' && value)}
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
                        <a href={`${dataBrowser}?${linkParams(data)}`} target="_blank">
                          <SparkLine data={sLines[label]}/>
                        </a>
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

