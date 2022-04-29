import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import marked from 'marked/lib/marked'
import {Tabs, Tab} from '/components/tabs/Tabs'
import MonitorIcon from '@mui/icons-material/MonitorRounded'
import WhatshotIcon from '@mui/icons-material/WhatshotRounded'
import ListIcon from '@mui/icons-material/ListRounded'

const CTRL_ROOM_PATH = 'https://raw.githubusercontent.com/sagecontinuum/sage-docs/main/projects/neon-mdp/mdp-ctrl-room-links.md'
const HISTORICAL_DATA = 'https://raw.githubusercontent.com/sagecontinuum/sage-docs/main/projects/neon-mdp/mdp-tarballs.md'

import settings from './settings'
const NODES = settings.mdpNodes

import * as BK from '/components/apis/beekeeper'

import RecentDataTable from './RecentDataTable'
import RecentData from '/apps/common/AllRecentData'
import Audio from '/components/viz/Audio'
import format from '/components/data/dataFormatter'



export default function LinkPage() {
  const {tab} = useParams()
  const [html, setHTML] = useState()
  const [dataHTML, setDataHTML] = useState()
  const [tabID, setTabID] = useState(tab || 'control')

  const [manifests, setManifests] = useState({})

  useEffect(() => {
    // custom renderer to add target="_blank"; https://github.com/markedjs/marked/issues/655
    const renderer = new marked.Renderer()
    const linkRenderer = renderer.link
    renderer.link = (href, title, text) => {
      const localLink = href.startsWith(`${location.protocol}//${location.hostname}`)
      const html = linkRenderer.call(renderer, href, title, text);
      return localLink ? html : html.replace(/^<a /, `<a target="_blank" rel="noreferrer noopener nofollow" `)
    }

    fetch(CTRL_ROOM_PATH)
      .then(res => res.text())
      .then(text => {
        text = text.replace('Neon-MDP-Wildfire Links', '')
        setHTML(marked(text, {renderer}))
      })

    fetch(HISTORICAL_DATA)
      .then(res => res.text())
      .then(text => {
        setDataHTML(marked(text, {renderer}))
      })

    for (const n of NODES) {
      const node = n.toUpperCase()
      BK.getManifest({node, by: 'vsn'})
        .then(data => {
          const node_id = data.node_id
          setManifests(prev => ({...prev, [node_id]: data}))
        })
      }
  }, [])

  return (
    <Root>
      <Tabs
        value={tabID}
        onChange={(_, idx) => setTabID(idx)}
        aria-label="tabs of data links"
      >
        <Tab
          label={<div className="flex items-center"><MonitorIcon fontSize="small" /> Control Room</div>}
          value="control"
          component={Link}
          to="/data-links/control"
          replace
        />
        <Tab
          label={<div className="flex items-center"><ListIcon fontSize="small" /> Links</div>}
          value="links"
          component={Link}
          to="/data-links/links"
          replace
        />
        <Tab
          label={<div className="flex items-center"><WhatshotIcon fontSize="small" /> Historical Data</div>}
          value="data"
          component={Link}
          to="/data-links/data"
          replace
        />
      </Tabs>
      {tabID == "control" &&
        <div>
          <div className="flex">
            {Object.keys(manifests).map(id => {
              const {vsn} = manifests[id]
              return (
                <div style={{margin: '0 10px', width: '33%'}} key={id}>
                  <h2>{vsn} Sensors</h2>
                  <RecentDataTable
                    items={format(['temp', 'es642Temp', 'humidity', 'pressure', 'raingauge', 'es642AirQuality'], vsn)}
                  />
                  <RecentData node={id} vsn={vsn} manifest={manifests[id]} noAudio noData/>
                </div>
              )
            })}
          </div>
          <div>
            <h2>Recent Audio</h2>
            {'000048B02D15C332' in manifests &&
              <Audio node={manifests['000048B02D15C332'].node_id} />
            }
          </div>
        </div>
    }
      {tabID == "links" &&
        <div className="control-room">
          <div dangerouslySetInnerHTML={{__html: html}} />
          <br/>
          <br/>
          <h2>Camera Views</h2>
          <img src="https://raw.githubusercontent.com/sagecontinuum/sage-docs/main/projects/neon-mdp/site-views.png" />
        </div>
      }

      {tabID == "data" &&
        <div className="data-table">
          <h1>Downloads</h1>
          <div dangerouslySetInnerHTML={{__html: dataHTML}} />
        </div>
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 1.5em 1em;

  .data-table table {
    width: 100%;
  }

  // to align tables
  .control-room {
    table td:first-child {
      width: 150px;
    }
    img {
      max-width: 800px;
    }
  }

  // todo(nc): generalize for ecr app docs? (an idea)
  table {
    border-collapse: collapse;
    text-align: left;
  }

  table th {
    vertical-align: bottom;
    padding: .1em .5em;
  }

  table:not(.dense) td:not(.icon) {
    padding: .5em;
  }
  table td {
    border-top: 1px solid #dee2e6;
  }

  table.table-hover tr:not(.no-hover):not(.selected):hover {
    background: #f5f5f5;
  }

  table.table-hover thead *:hover {
    background: none;
  }
`
