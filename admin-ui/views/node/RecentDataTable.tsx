import { useEffect, useState } from 'react'

import Tooltip from '@mui/material/Tooltip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import { isOldData } from './RecentData'
import { relTime } from '../../../components/utils/units'

import * as BH from '../../apis/beehive'
import config from '../../../config'
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
}



export default function RecentDataTable(props: Props) {
  const {items} = props

  const [recentData, setRecentData] = useState({})


  useEffect(() => {
    for (const item of items) {
      const {label, query} = item

      BH.getRecentRecord(query)
        .then(data => {
          if (!data) {
            setRecentData(prev => ({...prev, [label]: null}))
            return
          }

          setRecentData(prev => ({...prev, [label]: data}))
        }).catch(() => {
          setRecentData(prev => ({...prev, [label]: null}))
        })
    }
  }, [items])


  return (
    <>
      {recentData &&
        <table className="simple key-value">
          <thead>
            <tr><th></th><th>Time</th><th>Value</th></tr>
            </thead>
          <tbody>
            {items.map(item => {
              const {label, format, linkParams} = item

              const data = recentData[label]
              const {value, timestamp} = data || {}

              return (
                <tr key={label}>
                  <td>{label}</td>
                  <td>
                    {data &&
                      <Tooltip title={new Date(timestamp).toLocaleString()} placement="right">
                        <span className={isOldData(timestamp) ? 'failed font-bold' : 'muted'}>
                          {relTime(timestamp)}
                        </span>
                      </Tooltip>
                    }
                  </td>
                  <td>
                    {value !== null && format ? format(value) : value}
                    {value == null &&
                      <span className="muted">Not available</span>
                    }
                  </td>
                  <td>
                    {data && linkParams &&
                      <a href={`${dataBrowser}?${linkParams(data)}`}>more...</a>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      }
    </>
  )
}

