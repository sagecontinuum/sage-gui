import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BK from '/components/apis/beekeeper'
import * as DA from './description-api'
import { Card, CardViewStyle } from '/components/layout/Layout'

import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import { Autocomplete, TextField, Popper, FormControlLabel, Button } from '@mui/material'

import { WordCloudChart } from 'chartjs-chart-wordcloud'
import Checkbox from '/components/input/Checkbox'


const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type ImageProps = {
  title: string
  path: string
}

function Image(props: ImageProps) {
  const {title, path} = props

  const epochTime = path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('-'))
  const timestamp = new Date(epochTime / 1000).toLocaleString()

  return (
    <ImageRoot>
      <h3><Link to={`/node/${title}`}>{title}</Link></h3>
      <img src={path} />
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>{timestamp}</div>
        </div>
        <Button startIcon={<DownloadIcon />} size="small" href={path}>
          Download
        </Button>
      </div>
    </ImageRoot>
  )
}

const ImageRoot = styled.div`
  img {
    max-width: 350px;
  }
`


type Description = {
  label: string
  vsns: BK.VSN[]
  paths: string[]
  text_was_extracted?: boolean
}

type ImagesProps = {
  descriptions: Description[]
}

function Images(props: ImagesProps) {
  const {descriptions} = props

  const loader = useRef(null)
  const [page, setPage] = useState(1)


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
      {descriptions?.slice(0, getInfiniteEnd(page)).map(description => {
        const {label, vsns, paths} = description

        return (
          <Card key={label} className="card">
            <h2 className="flex justify-between no-margin">
              {label}
              <small className="muted">{vsns.length} node{vsns.length > 1 ? 's' : ''}</small>
            </h2>
            <div className="flex gap flex-wrap">
              {paths.map((path, i) =>
                <Image path={path} title={vsns[i]} key={path} />
              )}
            </div>
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
  const [descriptions, setDescriptions] = useState([])
  const [options, setOptions] = useState([])
  const [wordCloud, setWordCloud] = useState(false)
  const ref = useRef()


  useEffect(() => {
    DA.getDescriptions()
      .then(data => {
        setDescriptions(data)

        const options = data
          .map(o => ({
            id: o.label,
            label: o.label,
            count: o.vsns.length
          }))
        setOptions(options)
      })
  }, [])


  useEffect(() => {
    if (!options || !wordCloud)
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
        // @ts-ignore
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
  }, [options, wordCloud])


  const handleFilterChange = (vals) => {
    const ids = vals.map(o => o.id)
    const descript_metas = descriptions.filter(o => ids.includes(o.label))
    const vsns = descript_metas.flatMap(o => o.vsns)

    const selected = vals.map(o => typeof o == 'string' ? o : o.id)
    console.log('selected', selected)
    setSelected(selected)
    setVSNs(vsns)
  }


  const filtered = selected.length  ?
    descriptions.filter(obj => selected.includes(obj.label)) : descriptions

  return (
    <Root>
      <CardViewStyle />
      <h1>LLM Generated Descriptions</h1>
      <Card>
        <div className="flex items-center space-between gap">
          {!wordCloud &&
            <Autocomplete
              freeSolo={false}
              options={options}
              renderInput={(props) =>
                <TextField {...props} label="Search descriptions..." />}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <div >
                    <Checkbox checked={selected}/>
                    {option.label}{' '}
                    <span className="muted">
                      ({option.count} node{option.count > 1 ? 's' : ''})
                    </span>
                  </div>
                </li>
              )}
              PopperComponent={(props) =>
                <Popper {...props} style={{zIndex: 9999}} />}
              onChange={(evt, val) => handleFilterChange(val)}
              value={selected}
              disableCloseOnSelect={true}
              multiple={true}
              isOptionEqualToValue={(opt, val) => val ? opt.id == val : false}
              limitTags={4}
              sx={{width: 500}}
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
      <Images descriptions={filtered}/>
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;

  .card { margin: 1rem 0; }

  canvas {
    height: 800px;
  }

`
