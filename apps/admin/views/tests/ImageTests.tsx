import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BK from '/components/apis/beekeeper'
import RecentImages from '/components/views/RecentImages'
import { Card, CardViewStyle } from '/components/layout/Layout'

// import descriptions from '/path/to/descript'
const descriptions = []

import { Autocomplete, TextField, Popper, FormControlLabel } from '@mui/material'

import { WordCloudChart } from 'chartjs-chart-wordcloud'
import Checkbox from '/components/input/Checkbox'

const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type RecentImgsProps = {
  vsns?: BK.VSN[]
}

function RecentImgs(props: RecentImgsProps) {
  const {vsns} = props

  const [nodes, setNodes] = useState<BK.VSN[]>()
  const [project] = useState('sage')

  const loader = useRef(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    BK.getRawManifests()
      .then(data => {
        const node_vsns = data
          .filter(o => o.phase == 'Deployed')
          .filter(o => vsns?.length ? vsns.includes(o.vsn) : true)
          .map(o => o.vsn)
          .reverse()
        setNodes(node_vsns)
      })
  }, [project, vsns])


  const getInfiniteEnd = (page: number) =>
    page == 1 ? ITEMS_INITIALLY : page * ITEMS_PER_PAGE


  const handleObserver = useCallback((entries) => {
    const target = entries[0]
    if (!target.isIntersecting) return

    setTimeout(() => {
      setPage(prev => prev + 1)
    })
  }, [])


  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    }
    const observer = new IntersectionObserver(handleObserver, option)
    if (loader.current) observer.observe(loader.current)
  }, [handleObserver])


  return (
    <div>
      {nodes?.slice(0, getInfiniteEnd(page)).map(vsn => {
        return (
          <Card key={vsn} className="card">
            <h3><Link to={`/node/${vsn}`}>{vsn}</Link></h3>
            <Imgs>
              <RecentImages vsn={vsn} horizontal />
            </Imgs>
          </Card>
        )
      })}
      <div ref={loader} />
    </div>
  )
}



export default function ImageTests() {

  const [vsns, setVSNs] = useState([])
  const [selected, setSelected] = useState([])
  const [wordCloud, setWordCloud] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!wordCloud)
      return

    const labels = descriptions.filter(d => d.label.length <= 20)

    new WordCloudChart(ref.current, {
      data: {
        labels: labels.map((d) => d.label),
        datasets: [
          {
            label: 'nodes',
            data: labels.map((d) => d.vsns.length)
          }
        ]
      },
      options: {
        title: {
          display: false,
          text: 'Chart.js Word Cloud'
        },
        plugins: {
          legend: {
            display: false
          }
        },
        elements: {
          word: {
            size: labels.map((d) => d.vsns.length * 10),
            padding: 4
          }
        }
      }
    })
  }, [wordCloud])


  const options = descriptions
    .map(o => ({
      id: o.label,
      label: `${o.label} (${o.vsns.length})`
    }))


  const handleFilterChange = (vals) => {
    const ids = vals.map(o => o.id)
    const descript_metas = descriptions.filter(o => ids.includes(o.label))
    const vsns = descript_metas.flatMap(o => o.vsns)

    setSelected(vals.map(o => typeof o == 'string' ? o : o.id))
    setVSNs(vsns)
  }

  return (
    <Root>
      <CardViewStyle />
      <h1>Latest Sample Images from Deployed Nodes</h1>
      <Card>
        <div className="flex items-center space-between gap">
          {!wordCloud &&
            <Autocomplete
              freeSolo={false}
              options={options}
              renderInput={(props) =>
                <TextField {...props} label="Search by Description" />}
              PopperComponent={(props) =>
                <Popper {...props} style={{zIndex: 9999}} />}
              onChange={(evt, val) => handleFilterChange(val)}
              value={selected}
              disableCloseOnSelect={true}
              multiple={true}
              isOptionEqualToValue={(opt, val) => val ? opt.id == val : false}
              limitTags={4}
              fullWidth
            />
          }
          <div>

            <FormControlLabel
              control={
                <Checkbox
                  checked={wordCloud}
                  onChange={() => setWordCloud(!wordCloud)}
                />
              }
              label="WordCloud"
            />
          </div>
        </div>

        {wordCloud &&
          <div>
            <canvas id="canvas" ref={ref}></canvas>
          </div>
        }
      </Card>
      <br/>
      <RecentImgs vsns={vsns} />
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;

  h3 { margin-top: 0; }

  .card { margin: 0 0 1rem 0; }

  canvas {
    height: 800px;
  }
`

const Imgs = styled.div`
  img {
    max-height: 325px;
  }
`