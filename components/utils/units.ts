
export const quickRanges = {
  'custom': 'Custom range',
  '-1m': 'last minute',
  '-5m': 'last 5 mins',
  '-30m': 'last 30 mins',
  '-1h': 'last hour',
  '-12h': 'last 12 hours',
  '-1d': 'last day',
  '-2d': 'last 2 days',
  '-7d': 'last 7 days',
  '-30d': 'last 30 days [slow]',
  '-90d': 'last 90 days [very slow]'
}


export function prettyTime(secs: number) {
  if (!secs && secs != 0) return
  const days = Math.floor(secs / (24*60*60))
  const parts = new Date(secs * 1000).toISOString().slice(11, 19).split(':')

  const h = parseInt(parts[0]),
    m = parseInt(parts[1]),
    s = parseInt(parts[2])

  const time = `${days > 0 ? days + 'd ' : ''}` +
    (h > 0 ? `${h}h ` : '') +
    (m > 0 ? `${m}m ` : '') +
    (s > 0 ? `${s}s ` : '')

  return time
}


export function bytesToSizeIEC(bytes: number) {
  if (!bytes && bytes != 0) return
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']
  if (bytes == 0) return '0 Byte'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}


export function bytesToSizeSI(bytes) {
  if (!bytes && bytes != 0) return
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return (bytes / Math.pow(1000, i)).toFixed(2) + ' ' + sizes[i]
}


// https://stackoverflow.com/a/32180863
export function msToTime(ms: number) {
  if (!ms && ms != 0) return
  const secs = Number( (ms / 1000).toFixed(1))
  const mins = Number( (ms / (1000 * 60)).toFixed(1) )
  const hours = Number( (ms / (1000 * 60 * 60)).toFixed(1) )
  const days = Number( (ms / (1000 * 60 * 60 * 24)).toFixed(1) )
  if (secs < 60) return `${secs} sec${secs != 1 ? 's' : ''}  ago`
  else if (mins < 60) return mins + ' min ago'
  else if (hours < 24) return hours + ' hrs ago'
  else return days + ' days ago'
}

export function msToTimeApprox(ms: number) {
  if (!ms && ms != 0) return
  const secs = Math.floor( (ms / 1000))
  const mins = Math.floor( (ms / (1000 * 60)))
  const hours = Math.floor( (ms / (1000 * 60 * 60)))
  const days = Math.floor( (ms / (1000 * 60 * 60 * 24)))
  if (secs < 60) return `${secs} sec${secs != 1 ? 's' : ''}  ago`
  else if (mins < 60) return `${mins} min${mins != 1 ? 's' : ''} ago`
  else if (hours < 24) return `${hours} hr${hours != 1 ? 's' : ''} ago`
  else return `${days} day${days != 1 ? 's' : ''} ago`
}


export function relativeTime(val: string) {
  if (!val) return
  return msToTime(new Date().getTime() - (new Date(val).getTime()))
}


export function isOldData(timestamp, grain = 'hours', amount = 2) {
  const date = new Date(timestamp)

  let d
  if (grain == 'hours') {
    d = new Date()
    d.setHours(d.getHours() - amount)
  } else if (grain == 'minutes') {
    d = new Date()
    d.setMinutes(d.getMinutes() - amount)
  }

  return date < d
}


export function prettyList(l: string[]) {
  return l.length
    ? `${l.slice(0, -1).join(', ')} and ${l.slice(-1)}`
    : l[0]
}
