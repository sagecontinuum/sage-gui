import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { FormControlLabel, Button, Tooltip, RadioGroup, FormLabel, FormControl } from '@mui/material'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import AutoIcon from '@mui/icons-material/AutoFixHighOutlined'

import * as BK from '/components/apis/beekeeper'
import * as DA from './description-api'
import Checkbox from '/components/input/Checkbox'
import Radio from '/components/input/Radio'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { Sidebar, Top, Controls, Divider } from '/components/layout/Layout'
import { bytesToSizeSI } from '/components/utils/units'

import Filter from '/apps/sage/common/FacetFilter'

import { WordCloudChart } from 'chartjs-chart-wordcloud'

const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type Model = {
  name: string
  file: string
  date: string
}

const DATASETS: Model[] = [{
  name: 'LLaVa:7b',
  file: 'summary-llava7b-4-11-2024.json',
  date: '4-11-2024'
}, {
  name: 'LLaVa:34b',
  file: 'summary-llava34b-3-21-2024.json',
  date: '3-21-2024'
}]


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
        const {label, files, vsns, text_was_extracted} = description

        return (
          <Card key={label} className="card">
            <h2 className="flex justify-between no-margin">
              <div className="flex items-center gap">
                {label} {text_was_extracted &&
                  <Tooltip title="This text was extracted from a longer description">
                    <AutoIcon />
                  </Tooltip>
                }
              </div>
              <small className="muted">
                <Link to={`/nodes?vsn="${vsns.join('","')}"`}>
                  {pluralify(vsns, 'node')}
                </Link>
              </small>
            </h2>
            <div className="flex gap flex-wrap">
              {files.map(file => {
                const {vsn, url, file_size} = file
                return (
                  <Image
                    key={url}
                    url={url}
                    title={vsn}
                    size={file_size}
                  />
                )
              }
              )}
            </div>
          </Card>
        )
      })}
      <div ref={loader} />
    </div>
  )
}


type Option = {
  name: string
  label: string
  vsns: BK.VSN[]
  count: number
}

export default function ImageTests() {
  const [vsns, setVSNs] = useState<BK.VSN[]>()
  const [images, setImages] = useState<string[]>()

  const [selectedModel, setSelectedModel] = useState<Model['file']>(DATASETS[0].file)

  const [selected, setSelected] = useState([])
  const [descriptions, setDescriptions] = useState([])
  const [options, setOptions] = useState<Option[]>([])
  const [wordCloud, setWordCloud] = useState(false)
  const ref = useRef()


  useEffect(() => {
    DA.getDescriptions(selectedModel)
      .then(data => {
        // sort?
        // data = data.sort((a, b) => b.vsns.length - a.vsns.length)
        setDescriptions(data)

        const options = data
          .map(o => ({
            id: o.label,
            name: o.label,
            label: o.label,
            vsns: o.vsns,
            count: o.vsns.length
          }))
        setOptions(options)

        updateCounts(data)
      })
  }, [selectedModel])


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


  const handleFilter = (evt, val) => {
    const checked = evt.target.checked

    setSelected(prev => {
      const selected = checked ? [...prev, val] : prev.filter(v => v !== val)
      updateCounts(descriptions, selected)
      return selected
    })
  }

  const handleSelectAll = (evt, vals) => {
    const checked = evt.target.checked
    setSelected(checked ? vals : [])
  }

  const updateCounts = (descriptions: DA.Description[], selected?: string[]) => {
    if (selected?.length) {
      const descript_metas = descriptions.filter(o => selected.includes(o.label))
      setVSNs([...new Set(descript_metas.flatMap(o => o.vsns))])
      setImages([...new Set(descript_metas.flatMap(o => o.files.flatMap(o => o.url)))])
    } else {
      setVSNs([...new Set(descriptions.flatMap(o => o.vsns))])
      setImages([...new Set(descriptions.flatMap(o => o.files.flatMap(o => o.url)))])
    }
  }

  const filtered = selected.length  ?
    descriptions.filter(obj => selected.includes(obj.label)) : descriptions


  return (
    <Root className="flex">
      <CardViewStyle />

      <Sidebar width="250px" style={{padding: '10px 0 100px 0'}}>
        <ModelSelector>
          <FormControl>
            <FormLabel id="model-selector"><b>LLM Model:</b></FormLabel>
            <RadioGroup
              aria-labelledby="model-selector"
              value={selectedModel}
              onChange={(evt, val) => setSelectedModel(val)}
            >
              <FormControlLabel value={DATASETS[0].file} label={DATASETS[0].name} control={<Radio />}  />
              <FormControlLabel value={DATASETS[1].file} label={DATASETS[1].name} control={<Radio />} />
            </RadioGroup>
          </FormControl>
        </ModelSelector>

        <Filter
          title="Descriptions"
          checked={selected}
          onCheck={(evt, val) => handleFilter(evt, val)}
          onSelectAll={(evt, vals) => handleSelectAll(evt, vals)}
          defaultShown={25}
          data={options}
        />
      </Sidebar>

      <Main>
        <Top>
          <Controls className="flex items-center" style={{paddingLeft: 35}}>
            <div className="flex column">
              <h2 className="title no-margin">LLaVA:34b</h2>
            </div>

            <Divider />

            <FormControlLabel
              control={
                <Checkbox
                  checked={wordCloud}
                  onChange={() => setWordCloud(!wordCloud)}
                />
              }
              label="WordCloud"
            />

            <div className="flex-grow">
              {images && vsns &&
                <div className="flex gap">
                  {pluralify(images, 'image')}
                  <Link to={`/nodes?vsn="${vsns.join('","')}"`}>
                    {pluralify(vsns, 'node')}
                  </Link>
                </div>
              }
            </div>
          </Controls>
        </Top>

        <ImageListing>
          {wordCloud &&
            <div>
              <canvas id="canvas" ref={ref}></canvas>
            </div>
          }
          <Images descriptions={filtered}/>
        </ImageListing>
      </Main>
    </Root>
  )
}


const Root = styled.div`
  .card { margin: 1rem 0; }

  canvas {
    height: 800px;
    width: calc(100% - 300px);
  }
`

const Main = styled.div`
  width: 100%;
`

const ImageListing = styled.div`
  margin: 0 20px;
`

const ModelSelector = styled.div`
  padding: 20px;
`

const pluralify = (items: any[], name: string) =>
  <>{items?.length} {name}{items?.length > 1 ? 's' : ''}</>

