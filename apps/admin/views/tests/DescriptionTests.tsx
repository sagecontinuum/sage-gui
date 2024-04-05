import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { Autocomplete, TextField, Popper, FormControlLabel, Button } from '@mui/material'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'

import * as BK from '/components/apis/beekeeper'
import * as DA from './description-api'
import Checkbox from '/components/input/Checkbox'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { bytesToSizeSI } from '/components/utils/units'

import { WordCloudChart } from 'chartjs-chart-wordcloud'


const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type ImageProps = {
  title: string
  url: string
  size: number
}

function Image(props: ImageProps) {
  const {title, url, size} = props

  const epoch = Number(url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('-')))
  const timestamp = new Date(epoch / 1000000).toLocaleString()

  return (
    <ImageRoot>
      <h3><Link to={`/node/${title}`}>{title}</Link></h3>
      <img src={url} />
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>{timestamp}</div>
        </div>
        <Button startIcon={<DownloadIcon />} size="small" href={url}>
          {bytesToSizeSI(size)}
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


type ImagesProps = {
  descriptions: DA.Description[]
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
        const {label, vsns, urls, file_sizes} = description

        return (
          <Card key={label} className="card">
            <h2 className="flex justify-between no-margin">
              {label}
              <small className="muted">
                <Link to={`/nodes?vsn="${vsns.join('","')}"`}>
                  {pluralify(vsns, 'node')}
                </Link>
              </small>
            </h2>
            <div className="flex gap flex-wrap">
              {urls.map((url, i) =>
                <Image url={url} title={vsns[i]} size={file_sizes[i]} key={url} />
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
  const [vsns, setVSNs] = useState<BK.VSN[]>()
  const [images, setImages] = useState<string[]>()

  const [selected, setSelected] = useState([])
  const [descriptions, setDescriptions] = useState([])
  const [options, setOptions] = useState([])
  const [wordCloud, setWordCloud] = useState(false)
  const ref = useRef()


  useEffect(() => {
    DA.getDescriptions()
      .then(data => {
        // sort?
        // data = data.sort((a, b) => b.vsns.length - a.vsns.length)
        setDescriptions(data)

        const options = data
          .map(o => ({
            id: o.label,
            label: o.label,
            vsns: o.vsns
          }))
        setOptions(options)

        updateCounts(data)
      })
  }, [])


  useEffect(() => {
    if (!options || !wordCloud || !descriptions)
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
          text: 'Word Cloud'
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
  }, [options, wordCloud, descriptions])


  const handleFilterChange = (vals) => {
    const selected = vals.map(o => typeof o == 'string' ? o : o.id)
    setSelected(selected)
    updateCounts(descriptions, selected)
  }

  const updateCounts = (descriptions: DA.Description[], selected?: string[]) => {
    console.log('here', selected, selected?.length)
    if (selected?.length) {
      console.log('HERE@')
      const descript_metas = descriptions.filter(o => selected.includes(o.label))
      setVSNs([...new Set(descript_metas.flatMap(o => o.vsns))])
      setImages([...new Set(descript_metas.flatMap(o => o.urls))])
    } else {
      console.log('all counts', descriptions)
      setVSNs([...new Set(descriptions.flatMap(o => o.vsns))])
      setImages([...new Set(descriptions.flatMap(o => o.urls))])
    }
  }


  const filtered = selected.length  ?
    descriptions.filter(obj => selected.includes(obj.label)) : descriptions

  return (
    <Root>
      <CardViewStyle />
      <h1>Descriptions Generated with LLaVA:34b</h1>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex gap">
            <Autocomplete
              freeSolo={false}
              options={options}
              renderInput={(props) =>
                <TextField {...props} label="Search descriptions..." />}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <div>
                    <Checkbox checked={selected}/>
                    {option.label}{' '}
                    <span className="muted">
                      ({pluralify(option.vsns, 'node')})
                    </span>
                  </div>
                </li>
              )}
              PopperComponent={(props) =>
                <Popper {...props} style={{zIndex: 9999}} sx={{width: 500}}/>}
              onChange={(evt, val) => handleFilterChange(val)}
              value={selected}
              disableCloseOnSelect={true}
              multiple={true}
              isOptionEqualToValue={(opt, val) => val ? opt.id == val : false}
              limitTags={4}
              sx={{width: 500}}
            />
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

          {images && vsns &&
            <div className="flex gap">
              {pluralify(images, 'image')}
              <Link to={`/nodes?vsn="${vsns.join('","')}"`}>
                {pluralify(vsns, 'node')}
              </Link>
            </div>
          }
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


const pluralify = (items: any[], name: string) =>
  <>{items?.length} {name}{items?.length > 1 ? 's' : ''}</>

