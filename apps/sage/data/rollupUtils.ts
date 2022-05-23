
import {groupBy, sumBy} from 'lodash'
import startOfDay from 'date-fns/startOfDay'
import * as BH from '/components/apis/beehive'


export type FetchRollupProps = {
  versions?: boolean
  groupName?: string
  time?: 'hourly' | 'daily'
  start?: Date
  end?: Date
  vsn?: string  // for single node views
}

export function fetchRollup(props: FetchRollupProps) {
  const {start, end, vsn} = props
  return BH.getPluginCounts({start, end, vsn})
    .then(d => {
      const data = parseData({data: d, ...props})
      return {rawData: d, data}
    })
}


type ParseDataProps = {data: BH.Record[]} & FetchRollupProps

export function parseData(props: ParseDataProps) {
  const {
    data,
    versions = false,
    groupName = 'meta.vsn',
    time = 'hourly'
  } = props

  let d = data

  if (!versions) {
    d = d.map(o => {
      const { plugin } = o.meta
      return {
        ...o,
        meta: {
          ...o.meta,
          plugin: plugin.split(':')[0]
        }
      }
    })
  }

  const hourlyByVsn = groupBy(d, groupName)

  if (time == 'hourly') {
    const hourly = Object.keys(hourlyByVsn).reduce((acc, vsn) => ({
      ...acc,
      [vsn]: groupBy(hourlyByVsn[vsn], 'meta.plugin')
    }), {})

    return hourly
  } else if (time == 'daily') {
    return hourlyToDailyRollup(hourlyByVsn)
  }

  throw `parseData: grain='${time}' not valid`
}





type HourlyToDailyProps = {
  [vsn: string]: BH.Record[]
}

type ByVSNDailyMap = {
  [vsn: string]: {
    [plugin: string]: BH.Record[]
  }
}

// todo(nc): write test and refactor
function hourlyToDailyRollup(hourlyByVSN: HourlyToDailyProps) : ByVSNDailyMap {
  let daily = {}

  // for each vsn
  for (const vsn of Object.keys(hourlyByVSN)) {
    const items = hourlyByVSN[vsn]
    const byPlugin = groupBy(items, 'meta.plugin')

    // convert byBlugin (of hour recrods) to byDay for each
    const byPluginHourly = Object.keys(byPlugin).reduce((acc, plugin) => {
      const items = byPlugin[plugin]
      return {
        ...acc,
        [plugin]: groupBy(items, (o) => startOfDay(new Date(o.timestamp)).toISOString() )
      }
    }, {})

    // convert byPluginHoursly to byDay (summing up each hour count)
    let byDay = {}
    for (const [plugin, hourlyObjs] of Object.entries(byPluginHourly)) {
      const daily = Object.entries(hourlyObjs).map(([day, objs]) => {
        // here we just take the first object since all objects have the same meta
        // we only need to update the timestamp and value now
        const o = objs[0]
        return {
          ...o,
          timestamp: day,
          value: sumBy(objs, 'value'),
        }
      })

      byDay[plugin] = daily
    }

    daily[vsn] = byDay
  }

  return daily
}

export {
  hourlyToDailyRollup
}