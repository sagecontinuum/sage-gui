import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { Line, Bar } from 'react-chartjs-2'
import { chain, groupBy, countBy, sortBy, sumBy } from 'lodash'

import * as BH from '~/components/apis/beehive'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '~/components/input/Checkbox'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'


function getLineDatasets(records: BH.Record[], opts: ChartOpts) {
  const datasets = []

  const byName = groupBy(records, 'name')

  let idx = 0
  Object.keys(byName).forEach((name) => {
    const namedData = byName[name]

    const grouped = groupBy(namedData, 'sensor')
    const hasSesnors = Object.keys(grouped)[0] != 'undefined'

    Object.keys(grouped)
      .forEach((key, j) => {
        const d = grouped[key].map(o => ({
          x: new Date(o.timestamp).getTime(),
          y: o.value
        }))

        datasets.push({
          label: name + (hasSesnors ? ` - ${key}` : ''),
          data: d,
          pointRadius: opts.showPoints ? 3 : 0,
          fill: false,
          showLine: opts.showLines,
          tension: 0,
          borderColor: schemeCategory10[idx % 10]
        })

        idx += 1
      })
  })

  return datasets
}


function getCountData(records: BH.Record[], opts: ChartOpts) {
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


function getSumData(records: BH.Record[], opts: ChartOpts) {
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



type ChartOpts = {
  showLines: boolean
  showPoints: boolean
  chartType: 'timeseries' | 'frequency' | 'sum'
}

const chartOpts = {
  showLines: true,
  showPoints: false,
  chartType: 'timeseries'
}


export default function TimeSeries(props) {
  const {data} = props

  const [datasets, setDatasets] = useState<object[]>()
  const [opts, setOpts] = useState<ChartOpts>(chartOpts)


  useEffect(() => {
    let datasets
    if (opts.chartType == 'frequency')
      datasets = getCountData(data, opts)
    else if (opts.chartType == 'sum')
      datasets = getSumData(data, opts)
    else
      datasets = getLineDatasets(data, opts)

    setDatasets(datasets)
  }, [data, opts])


  const handleOpts = (evt, option: string) => {
    const target = evt.target
    const val = 'checked' in target ? target.checked : target.value
    setOpts(prev => ({...prev, [option]: val}))
  }

  return (
    <Root>
      <Chart>
        {opts.chartType == 'timeseries' && Array.isArray(datasets) &&
          <Line
            options={{
              scales: {
                xAxes: [{
                  type: 'time',
                  display: true,
                  scaleLabel: {
                    display: true
                  }
                }]
              }
            }}
            data={{
              datasets
            }}
          />
        }

        {opts.chartType == 'frequency' &&
          <Bar
            options={{
              scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
              }
            }}
            data={{
              ...datasets
            }}
          />
        }

        {opts.chartType == 'sum' &&
          <Bar
            options={{
              scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
              }
            }}
            data={{
              ...datasets
            }}
          />
        }
      </Chart>


      <div className="flex justify-end">
        {opts.chartType == 'timeseries' &&
          <>
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
          </>
        }

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
    </Root>
  )

}


const Root = styled.div`
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 1em;
`

const Chart = styled.div`

`

const CB = styled(FormControlLabel)`
  .MuiFormControlLabel-label {
    font-size: 1em;
  }

`
