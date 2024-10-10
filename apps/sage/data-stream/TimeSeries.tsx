import { useState, useEffect, useRef, memo} from 'react'
import styled from 'styled-components'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { chain, groupBy, sumBy } from 'lodash'

import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'
import { vsnToDisplayStr } from '/components/views/nodes/nodeFormatters'

import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '/components/input/Checkbox'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'

import Button from '@mui/material/Button'

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


export type ChartOpts = {
  showLines: boolean
  showPoints: boolean
  chartType?: 'timeseries' | 'frequency' | 'sum'
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
    let datasets
    if (opts.chartType == 'frequency')
      datasets = getCountData(data)
    else if (opts.chartType == 'sum')
      datasets = getSumData(data)
    else
      datasets = getLineDatasets(data, opts, siteIDs)

    let config
    if (opts.chartType == 'frequency') {
      config = {
        ...barConfig,
        data: {...datasets}
      }
    } else if (opts.chartType == 'sum') {
      config = {
        ...barConfig,
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
    const val = 'checked' in target ? target.checked : target.value
    onChange({...opts, ...{[option]: val}})
  }

  const handleZoomReset = () => {
    chart.resetZoom()
    setIsZoomed(false)
  }

  return (
    <Root>
      <canvas ref={chartRef}></canvas>

      <Ctrls className="flex items-center justify-between">
        <div className="flex items-centern gap">
          {opts.chartType == 'timeseries' && isZoomed &&
            <Button onClick={handleZoomReset} color="primary" variant="contained">
              Reset zoom
            </Button>
          }
          {data.length >= DOWNSAMPLE_THRESHOLD && chart &&
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

        <div className="flex items-center">
          <div>
            {opts.chartType == 'timeseries' &&
              <CB
                control={
                  <Checkbox
                    checked={opts.showLines}
                    onChange={(evt) => handleOpts(evt, 'showLines')}
                  />
                }
                label="lines"
              />
            }
            {opts.chartType == 'timeseries' &&
              <CB
                control={
                  <Checkbox
                    checked={opts.showPoints}
                    onChange={(evt) => handleOpts(evt, 'showPoints')}
                  />
                }
                label="points"
              />
            }
          </div>

          <FormControl variant="outlined">
            <InputLabel id="chart-type">Type</InputLabel>
            <Select
              labelId="chart-type"
              value={opts.chartType}
              onChange={evt => handleOpts(evt, 'chartType')}
              label="Type"
              margin="dense"
            >
              <MenuItem value='timeseries'>Timeseries</MenuItem>
              <MenuItem value='frequency'>Frequency</MenuItem>
              <MenuItem value='sum'>Sum</MenuItem>
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


