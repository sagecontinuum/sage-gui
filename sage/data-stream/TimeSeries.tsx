import { useState, useEffect } from 'react'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { Line } from 'react-chartjs-2'
import { groupBy } from 'lodash'

import * as BH from '~/components/apis/beehive'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '~/components/input/Checkbox'


function getChartDatasets(data: BH.Record[], showPoints: boolean) {
  const datasets = []

  const byName = groupBy(data, 'name')

  let idx = 0
  Object.keys(byName).forEach((name, i) => {
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
          pointRadius: showPoints ? 3 : 0,
          fill: false,
          showLine: false,
          tension: 0,
          borderColor: schemeCategory10[idx % 10]
        })

        idx += 1
      })
  })

  return datasets
}


export default function TimeSeries(props) {
  const {data} = props

  const [datasets, setDatasets] = useState<object[]>()
  const [showPoints, setShowPoints] = useState(false)


  useEffect(() => {
    const datasets = getChartDatasets(data, showPoints)
    setDatasets(datasets)
  }, [data, showPoints])

  return (
    <div>
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
      <FormControlLabel
        control={
          <Checkbox
            checked={showPoints}
            onChange={(evt) => setShowPoints(evt.target.checked)}
          />
        }
        label="show points"
      />
    </div>
  )

}

