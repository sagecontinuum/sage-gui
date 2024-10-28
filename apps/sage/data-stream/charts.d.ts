
export type ChartOpts = {
    showLines: boolean
    showPoints: boolean
    type?: 'timeseries' | 'frequency' | 'sum' | 'histogram' // default: timeseries
    binBy?: HistogramArgs['binBy']                          // default: value
    thresholds?: HistogramArgs['thresholds']                 // default: 20
  }

