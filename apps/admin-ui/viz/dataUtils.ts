

type BinningData = { timestamp: string }[][]

export function getMetricBins(data: BinningData, toNow = true) {
  // note we assume the data is sorted already
  const startValues = data.map(a => new Date(a[0].timestamp).getTime() )
  const endValues = data.map(a => new Date(a[a.length - 1].timestamp).getTime() )
  const start = Math.min(...startValues)
  const end = toNow ? new Date().getTime() : Math.max(...endValues)

  const bins = getHours(new Date(start), new Date(end))

  return bins
}


function getHours(startDate, endDate) {
  const dates = []
  let nextDate = new Date(startDate)
  nextDate.setHours(nextDate.getHours(), 0, 0, 0)
  while (nextDate < endDate) {
    dates.push(nextDate)
    nextDate = new Date(nextDate)
    nextDate.setHours(nextDate.getHours() + 1, 0, 0, 0)
  }

  return dates
}


