import { useState, useEffect, useRef, memo} from 'react'
import styled from 'styled-components'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { chain, groupBy, maxBy, minBy, sumBy } from 'lodash'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { vsnToDisplayStr } from '/components/views/nodes/nodeFormatters'

import {
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Radio,
  RadioGroup
} from '@mui/material'
import Checkbox from '/components/input/Checkbox'

import Button from '@mui/material/Button'

import * as d3 from 'd3'

import { Chart as ChartJS,
  Tooltip,
  Legend,
  LineController,
  BarController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  BarElement,
  CategoryScale,
  Title,
  Decimation,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'

import { shortUnits } from '/components/measurement.config'

import type { ChartOpts } from './charts'


ChartJS.register(
  Tooltip, Legend, LineController, BarController, LineElement, PointElement,
  LinearScale, TimeScale, CategoryScale, BarElement, Title, Decimation, zoomPlugin
)


// data will be downsampled at this amount or more
export const DOWNSAMPLE_THRESHOLD = 10000



const lineConfig = {
  type: 'line',
  options: {
    animation: false,
    parsing: false,
    interaction: {
      mode: 'nearest',
      intersect: false
    },
    scales: {
      x: {
        type: 'time'
      }
    },
    plugins: {
      decimation: {
        enabled: true,
        threshold: DOWNSAMPLE_THRESHOLD,
        algorithm: 'lttb'
      },
      zoom: {
        pan: {
          enabled: true,
          modifierKey: 'ctrl'
        },
        zoom: {
          drag: {
            enabled: true,
          },
          mode: 'x',
          onZoomComplete: () => { /* do nothing? */ }
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''

            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              const {y, meta} = context.parsed
              label += `${y} ${shortUnits[meta.units] || meta.units || ''}`
            }
            return label
          }
        }
      }
    }
  }
}

const barConfig = {
  type: 'bar',
  scales: {
    y: {
      display: true,
      min: 0
    }
  }
}

const histogramConfig =  {
  type: 'bar',
  options: {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Bins'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Frequency'
        }
      }
    }
  }
}


export function getLineDatasets(records: BH.Record[], opts: ChartOpts, siteIDs?: BK.SiteIDs) {
  const datasets = []

  const byName = groupBy(records, 'name')

  let idx = 0
  Object.keys(byName).forEach((name) => {
    const namedData = byName[name]
    const grouped = groupBy(namedData, o => {
      const {sensor, zone, deviceName, vsn} = o.meta

      const node = siteIDs ? vsnToDisplayStr(vsn, siteIDs[vsn]) : vsn
      if (sensor && zone) {
        return `${node}; ${sensor}; ${zone}`
      } else if (sensor) {
        return `${node}; ${sensor}`
      } else if (deviceName) {
        return `${node}; ${deviceName};`
      } else {
        return node
      }
    })

    const hasGroup = Object.keys(grouped)[0] != 'undefined'

    Object.keys(grouped)
      .forEach((key) => {
        const d = grouped[key].map(o => ({
          x: new Date(o.timestamp).getTime(),
          y: o.value,
          meta: o.meta
        })).sort((a, b) => a.x - b.x)


        datasets.push({
          label: name + (hasGroup ? `; ${key}` : ''),
          data: d,
          pointRadius: opts.showPoints ? 3 : 0,
          showLine: opts.showLines,
          borderColor: schemeCategory10[idx % 10],
          borderWidth: 1,
        })

        idx += 1
      })
  })

  return datasets
}


function getCountData(records: BH.Record[]) {
  const items = chain(records)
    .countBy('name')
    .map((val, key) => ({
      name: key,
      value: val
    }))
    .sortBy('value')
    .reverse()
    .value()

  const labels = items.map(o => o.name)
  const data = items.map(o => o.value)

  return {
    labels: labels,
    datasets: [{
      label: 'frequency',
      data,
      backgroundColor: labels.map((_, i) => schemeCategory10[i % 10])
    }]
  }
}


function getSumData(records: BH.Record[]) {
  const items = chain(records)
    .groupBy('name')
    .map((objs, key) => ({
      name: key,
      value: sumBy(objs, 'value')
    }))
    .sortBy('value')
    .reverse()
    .value()

  const labels = items.map(o => o.name)
  const data = items.map(o => o.value)

  return {
    labels: labels,
    datasets: [{
      label: 'sums',
      data,
      backgroundColor: labels.map((_, i) => schemeCategory10[i % 10])
    }]
  }
}

// todo: internationalize
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const getBinLabels = (bins, binBy: HistogramArgs['binBy']) => {
  if (binBy == 'value')
    return bins.map(({x0, x1}) => `${x0} - ${x1}`)
  else if (binBy == 'hour')
    return bins.map(({x0, x1}) => `${x0 < 10 ? '0' : ''}${x0}:00 - ${x1}:00`)
  else if (binBy == 'day')
    return bins.map((bin) => days[bin.x0])
  else if (binBy == 'month')
    return bins.map((bin) => months[bin.x0])
  else if (binBy == 'dayOfYear')
    return bins.map(({x1}) => `${x1 + 1}`) // starting index of 1
  else if (binBy == 'time')
    return bins.map(({x0}) =>
      `${x0.toLocaleDateString()} ${x0.toLocaleTimeString()}`
      // - ${x1.toLocaleDateString()} ${x1.toLocaleTimeString()}`
    )
  else {
    alert(`Note: binBy option "${binBy}" is not recognized.`)
    return bins.map(({x0, x1}) => `${x0} - ${x1}`)
  }
}

function thresholdTime(n) {
  return (data, min, max) => {
    return d3.scaleUtc().domain([min, max]).ticks(n)
  }
}


function daysIntoYear(date: Date) {
  return (
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000
}


const timeAgg = {
  hour: (date: Date) => date.getHours(),
  day: (date: Date) => date.getDay(),
  dayOfYear: (date: Date) => daysIntoYear(date),
  month: (date: Date) => date.getMonth(),
}

const timeUpper = {
  hour: 24,
  day: 7,
  dayOfYear: 366,
  month: 12
}


type HistogramArgs = {
  data: BH.Record[]
  key?: string
  binBy?: 'value' | 'hour' | 'day' | 'month' | 'dayOfYear' | 'time'
  thresholds?: number
}

function getHistogramData(args: HistogramArgs) {
  const {data, binBy = 'value'} = args

  const thresholds = args.thresholds || 20
  let bins
  if (binBy == 'value') {
    const key = 'value'
    const min = Number(minBy(data, key)[key])
    const max = Number(maxBy(data, key)[key])
    bins = d3.bin()
      .value(d => d[key])
      .domain([min, max])
      .thresholds(thresholds)(data)
  } else if (binBy == 'time') {
    bins = d3.bin()
      .value(d => new Date(d['timestamp']))
      .thresholds(thresholdTime(thresholds))(data)
  } else {
    bins = d3.bin()
      .value(d => timeAgg[binBy](new Date(d['timestamp'])))
      .domain([0, timeUpper[binBy]])
      .thresholds(timeUpper[binBy])(data)
  }

  const counts = bins.map(bin => bin.length)

  return {
    labels: getBinLabels(bins, binBy),
    datasets: [{
      label: 'Count',
      data: counts,
      backgroundColor: schemeCategory10[0]
    }]
  }
}



type Props = {
  data: BH.Record[]
  chartOpts: ChartOpts
  siteIDs: BK.SiteIDs
  onChange?: (opts: ChartOpts) => void
}

export default memo(function TimeSeries(props: Props) {
  const {data, chartOpts: opts, siteIDs, onChange} = props

  const chartRef = useRef()
  const [chart, setChart] = useState(null)
  const [disableDownsampling, setDisableDownsampling] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    const {type} = opts

    let datasets
    if (type == 'frequency')
      datasets = getCountData(data)
    else if (type == 'sum')
      datasets = getSumData(data)
    else if (type == 'histogram') {
      const {binBy, thresholds} = opts
      datasets = getHistogramData({data, binBy, thresholds})
    } else
      datasets = getLineDatasets(data, opts, siteIDs)


    let config
    if (type == 'frequency') {
      config = {
        ...barConfig,
        data: {...datasets}
      }
    } else if (type == 'sum') {
      config = {
        ...barConfig,
        data: {...datasets}
      }
    } else if (type == 'histogram') {
      config = {
        ...histogramConfig,
        data: {...datasets}
      }
    } else {
      lineConfig.options.plugins.decimation.enabled = !disableDownsampling
      lineConfig.options.plugins.zoom.zoom.onZoomComplete = () => setIsZoomed(true)
      config = {
        ...lineConfig,
        data: { datasets }
      }
    }

    if (chart) {
      chart.destroy()
    }

    const c = new ChartJS(chartRef.current, config)
    setChart(c)
  }, [data, opts, disableDownsampling])


  const handleOpts = (evt, option: string) => {
    const target = evt.target
    const val = evt.target.type == 'checkbox' ? target.checked : target.value
    onChange({...opts, ...{[option]: val}})
  }

  const handleZoomReset = () => {
    chart.resetZoom()
    setIsZoomed(false)
  }

  const {type, binBy = 'value', thresholds = 20} = opts

  return (
    <Root>
      <canvas ref={chartRef}></canvas>

      <Ctrls className="flex items-center justify-between">
        <div className="flex items-centern gap">
          {type == 'timeseries' && isZoomed &&
            <Button onClick={handleZoomReset} color="primary" variant="contained">
              Reset zoom
            </Button>
          }
          {type == 'timeseries' && data.length >= DOWNSAMPLE_THRESHOLD && chart &&
            <DownsampleOpts>
              <Button onClick={() => setDisableDownsampling(prev => !prev)}>
                {!disableDownsampling ? 'Disable' : 'Enable'} downsampling
              </Button>

              {!disableDownsampling &&
                <span>
                  Note: data in this chart has been downsampled
                  using <a href="http://hdl.handle.net/1946/15343"
                    target="_blank" rel="noreferrer">LTTB
                  </a>.
                </span>
              }
            </DownsampleOpts>
          }
        </div>

        <div className="flex items-center gap">
          {type == 'timeseries' &&
            <div className="flex items-center">
              <CB
                control={
                  <Checkbox
                    checked={opts.showLines}
                    onChange={(evt) => handleOpts(evt, 'showLines')}
                  />
                }
                label="lines"
              />
              <CB
                control={
                  <Checkbox
                    checked={opts.showPoints}
                    onChange={(evt) => handleOpts(evt, 'showPoints')}
                  />
                }
                label="points"
              />
            </div>
          }

          {type == 'histogram' &&
            <div className="flex items-center">

              <RadioGroup
                row
                aria-labelledby="demo-radio-buttons-group-label"
                name="radio-buttons-group"
                value={binBy || 'value'}
                onChange={(evt) => handleOpts(evt, 'binBy')}
              >
                <FormControlLabel value="value" control={<Radio />} label="By Value"/>
                <FormControlLabel value="hour" control={<Radio />} label="By Hour"/>
                <FormControlLabel value="day" control={<Radio />} label="By Day of Week" />
                {/* <FormControlLabel value="dayOfYear" control={<Radio />} label="By Day of Year" /> */}
                <FormControlLabel value="month" control={<Radio />} label="By Month" />
                <FormControlLabel value="time" control={<Radio />} label="By Time w/Thresholds" />
              </RadioGroup>


              {['value', 'time'].includes(binBy) &&
                <TextField
                  type="number"
                  placeholder="20"
                  value={thresholds}
                  onChange={(evt) => handleOpts(evt, 'thresholds')}
                  label="Thresholds"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    }
                  }}
                />
              }

            </div>
          }

          <FormControl variant="outlined">
            <InputLabel id="chart-type">Type</InputLabel>
            <Select
              labelId="chart-type"
              value={type}
              onChange={evt => handleOpts(evt, 'type')}
              label="Type"
              margin="dense"
            >
              <MenuItem value='timeseries'>Timeseries</MenuItem>
              <MenuItem value='frequency'>Frequency</MenuItem>
              <MenuItem value='sum'>Sum</MenuItem>
              <MenuItem value='histogram'>Histogram (distribution)</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Ctrls>
    </Root>
  )
}, (prev, next) =>
  prev.data === next.data &&
  JSON.stringify(prev.chartOpts) === JSON.stringify(next.chartOpts)
)


const Root = styled.div`
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 1em;
`

const DownsampleOpts = styled.div`
  button {
    margin: 0 5px 2px 0;
  }
`

const Ctrls = styled.div`
  margin-top: 1em;
`

const CB = styled(FormControlLabel)`
  .MuiFormControlLabel-label {
    font-size: 1em;
  }
`


