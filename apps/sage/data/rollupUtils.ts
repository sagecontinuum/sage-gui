
import {groupBy, sumBy} from 'lodash'
import startOfDay from 'date-fns/startOfDay'
import * as BH from '/components/apis/beehive'


export type FetchRollupProps = {
  versions?: boolean
  groupName?: string
  time?: 'hourly' | 'daily'
  start?: Date
  end?: Date
  vsn?: string    // for single node views
  plugin?: string // for single app views
}

export function fetchRollup(props: FetchRollupProps) {
  const {start, end, vsn, plugin} = props
  return BH.getPluginCounts({start, end, vsn, plugin})
    .then(d => {
      const data = parseData({data: d, ...props})
      return {rawData: d, data}
    })
}

export function fetchUploadRollup(props: FetchRollupProps) {
  const {start, end, vsn, plugin} = props
  return BH.getMediaCounts({start, end, vsn, plugin})
    .then(d => {
      const data = parseUploadData({data: d, ...props})
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

  // remove versions if needed
  if (!versions) {
    d = d.map(o => {
      const { plugin: p } = o.meta

      const isIP = /\d+\.\d+\.\d+\.\d+:\d+/.test(p)
      const plugin = isIP ? p.slice(p.indexOf('/') + 1).split(':')[0] : p.split(':')[0]

      return {
        ...o,
        meta: {
          ...o.meta,
          plugin,
          origPluginName: p
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



export function parseUploadData(props: ParseDataProps) {
  const {
    data,
    versions = false,
    groupName = 'meta.vsn',
    time = 'hourly'
  } = props

  let d = data

  const hourlyByVsn = groupBy(d, groupName)

  if (time == 'hourly') {
    const hourly = Object.keys(hourlyByVsn).reduce((acc, vsn) => ({
      ...acc,
      [vsn]: groupBy(hourlyByVsn[vsn], 'meta.task')
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
export function hourlyToDailyRollup(hourlyByVSN: HourlyToDailyProps) : ByVSNDailyMap {
  const daily = {}

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
    const byDay = {}
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

export const getPluginStats = () =>
  BH.getPluginCounts({start: '-1y', tail: 1})
    .then(d => {
      const byPlugin = groupBy(d, 'meta.plugin')
      return byPlugin
    })



