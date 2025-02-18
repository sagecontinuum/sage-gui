import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { FormControlLabel, Button, Tooltip, RadioGroup, FormLabel, FormControl } from '@mui/material'
import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import AutoIcon from '@mui/icons-material/AutoFixHighOutlined'

import * as BK from '/components/apis/beekeeper'
import * as DA from './description-api'
import Radio from '/components/input/Radio'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { Sidebar, Top, Controls, Divider } from '/components/layout/Layout'
import { bytesToSizeSI } from '/components/utils/units'

import Filter from '/apps/sage/common/FacetFilter'

import { WordCloudChart } from 'chartjs-chart-wordcloud'
import ErrorMsg from '/apps/sage/ErrorMsg'
import BoundingBoxOverlay from './BoundingBoxOverlay'
import Checkbox from '/components/input/Checkbox'

const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type Model = {
  name: string
  file: string
  date: string
}

const DATASETS: Model[] = [{
  name: 'Florence-2-Large:0.77B | hugging face',
  file: 'summary-florence-2-5-2025.json',
  date: '2-05-2025'
}, {
  name: 'llama3.2-vision | ollama',
  file: 'summary-llama3.2-vision-2-13-2025.json',
  date: '2-13-2025'
}, /* {
  name: 'Moondream2 | ollama',
  file: 'summary-moondream2-ollama-2-13-2025.json',
  date: '2-13-2025'
}, */ {
  name: 'LLaVa:7b | ollama',
  file: 'summary-llava7b-4-11-2024.json',
  date: '4-11-2024'
}, {
  name: 'LLaVa:34b | ollama',
  file: 'summary-llava34b-4-11-2024.json',
  date: '4-11-2024'
}, /* {
  name: 'bakllava:7b',
  file: 'summary-bakllava7b-4-11-2024.json',
  date: '4-11-2024'
},{
  name: 'LLaVa:34b (legacy)',
  file: 'summary-llava34b-3-21-2024.json',
  date: '3-21-2024'
} */
]


/*

const box = {
  top: 50,
  left: 30,
  width: 100,
  height: 150,
};

// Usage
<BoundingBoxOverlay imageUrl="path/to/your/image.jpg" box={box} />
*/


type ImageProps = {
  title: string
  url: string
  size: number
  showBoxes: boolean
  bbox: DA.BBox
  originalWidth: number
  originalHeight: number
}

function Image(props: ImageProps) {
  const {title, url, size, showBoxes, bbox, originalWidth, originalHeight} = props

  const epoch = Number(url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('-')))
  const timestamp = new Date(epoch / 1000000).toLocaleString()


  let bboxSpec
  if (showBoxes && bbox)
    bboxSpec = computeBoundingBox(bbox, originalWidth, originalHeight)


  return (
    <ImageRoot>
      <h3><Link to={`/node/${title}`}>{title}</Link></h3>
      {bboxSpec ?
        <BoundingBoxOverlay src={url} {...bboxSpec} /> :
        <img src={url} />
      }

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


interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeBoundingBox(
  [x1, y1, x2, y2]: DA.BBox,
  origWidth: number,
  origHeight: number,
  maxWidth = 350
): BoundingBox {
  const aspectRatio = origWidth / origHeight
  const newHeight = maxWidth / aspectRatio

  const scaleWidth = maxWidth / origWidth
  const scaleHeight = newHeight / origHeight

  const scaledX1 = x1 * scaleWidth
  const scaledY1 = y1 * scaleHeight
  const scaledX2 = x2 * scaleWidth
  const scaledY2 = y2 * scaleHeight

  const scaledWidth = scaledX2 - scaledX1
  const scaledHeight = scaledY2 - scaledY1

  return {
    x: scaledX1,
    y: scaledY1,
    width: scaledWidth,
    height: scaledHeight
  }
}


/*
const ImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 250px;
  height: 250px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 20px;

  & svg {
    color: #aaa;
    width: 50px;
    height: 50px;
  }
`
*/


type ImagesProps = {
  descriptions: DA.Description[]
  showBoxes?: boolean
}

function Images(props: ImagesProps) {
  const {descriptions, showBoxes} = props

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
        const {label, files, vsns, text_was_extracted, unextracted_text} = description

        return (
          <Card key={label} className="card">
            <h2 className="flex justify-between no-margin">
              <div className="flex items-center gap">
                {label} {text_was_extracted && extractedTextIcon(unextracted_text)}
              </div>
              <small className="muted">
                <Link to={`/nodes?vsn="${vsns.join('","')}"`}>
                  {pluralify(vsns, 'node')}
                </Link>
              </small>
            </h2>
            <div className="flex gap flex-wrap">
              {files.map((file) => {
                const {vsn, url, file_size, image_width, image_height, bbox} = file
                return (
                  <Image
                    key={url}
                    url={url}
                    title={vsn}
                    size={file_size}
                    bbox={bbox}
                    originalWidth={image_width}
                    originalHeight={image_height}
                    showBoxes={showBoxes}
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




const extractedTextIcon = (text: string) =>
  <Tooltip
    title={<>
      This text was extracted from a longer description.<br/><br/>
      <i>"{text}</i>"
    </>}
    placement="right"
  >
    <AutoIcon fontSize="small"/>
  </Tooltip>


type Option = {
  name: string
  label: string
  vsns: BK.VSN[]
  count: number
}

export default function ImageTests() {
  const [vsns, setVSNs] = useState<BK.VSN[]>()
  const [images, setImages] = useState<string[]>()
  const [error, setError] = useState(null)

  const [selectedModel, setSelectedModel] = useState<Model['file']>(DATASETS[0].file)
  const [showBoxes, setShowBoxes] = useState<boolean>(false)

  const [selected, setSelected] = useState([])
  const [descriptions, setDescriptions] = useState([])
  const [options, setOptions] = useState<Option[]>([])
  const [wordCloud] = useState(false)
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
            count: o.vsns.length,
            ...(o.text_was_extracted && {icon: extractedTextIcon(o.unextracted_text)})
          }))
        setOptions(options)
        updateCounts(data, selected)
      })
      .catch((err) => setError(err))
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
            <FormLabel id="model-selector"><b>Model</b></FormLabel>
            <RadioGroup
              aria-labelledby="model-selector"
              value={selectedModel}
              onChange={(evt, val) => setSelectedModel(val)}
            >
              {DATASETS.map(dataset => {
                const {file, name} = dataset
                return (
                  <FormControlLabel value={file}
                    label={<div style={{marginBottom: '2px'}}>
                      <div style={{marginBottom: '-5px'}}>
                        {name.split('|')[0]}
                      </div>
                      <small className="muted">
                        {name.split('|')[1]}
                      </small>
                    </div>}
                    control={<Radio />} key={file}
                  />
                )
              })}
            </RadioGroup>
          </FormControl>

          {selectedModel == 'summary-florence-2-5-2025.json' &&
            <FormControl>
              <br/>
              <FormLabel id="model-options"><b>Options</b></FormLabel><br/>
              <FormControlLabel
                control={
                  <>
                    <Checkbox
                      checked={showBoxes}
                      onChange={evt => setShowBoxes(evt.target.checked)}
                    />
                  </>
                }
                label={<>Show bounding boxes</>}
              />
            </FormControl>
          }

        </ModelSelector>



        <Filter
          title="Descriptions"
          checked={selected}
          onCheck={(evt, val) => handleFilter(evt, val)}
          onSelectAll={(evt, vals) => handleSelectAll(evt, vals)}
          defaultShown={25}
          showSearchBox={true}
          hideSearchIcon={true}
          data={options}
        />

      </Sidebar>

      <Main>
        <Top>
          <Controls className="flex items-center" style={{paddingLeft: 35}}>
            <div className="flex column">
              <h2 className="title no-margin">
                {DATASETS.find(o => o.file == selectedModel).name}
              </h2>
            </div>

            <Divider />
            {/* todo(nc): revise
            <FormControlLabel
              control={
                <Checkbox
                  checked={wordCloud}
                  onChange={() => setWordCloud(!wordCloud)}
                />
              }
              label="WordCloud"
            />
            */}

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
          {error &&
            <ErrorMsg>{error.message}</ErrorMsg>
          }
          {wordCloud &&
            <div>
              <canvas id="canvas" ref={ref}></canvas>
            </div>
          }
          <Images descriptions={filtered} showBoxes={showBoxes} />
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

