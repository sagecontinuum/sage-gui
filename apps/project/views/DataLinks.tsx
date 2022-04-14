import { useEffect, useState } from 'react'
import styled from 'styled-components'
import marked from 'marked/lib/marked'
import {Tabs, Tab} from '/components/tabs/Tabs'
import MonitorIcon from '@mui/icons-material/MonitorRounded'
import WhatshotIcon from '@mui/icons-material/WhatshotRounded'

const MARKDOWN_PATH = 'https://raw.githubusercontent.com/sagecontinuum/sage-docs/main/projects/mdp-ctrl-room-links.md'




export default function LinkPage() {
  const [html, setHTML] = useState()
  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    // custom renderer to add target="_blank"; https://github.com/markedjs/marked/issues/655
    const renderer = new marked.Renderer()
    const linkRenderer = renderer.link
    renderer.link = (href, title, text) => {
      const localLink = href.startsWith(`${location.protocol}//${location.hostname}`)
      const html = linkRenderer.call(renderer, href, title, text);
      return localLink ? html : html.replace(/^<a /, `<a target="_blank" rel="noreferrer noopener nofollow" `)
    }

    fetch(MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => {
        text = text.replace('Neon-MDP-Wildfire Links', '')

        setHTML(marked(text, {renderer}))
      })

    // idon't
  }, [])

  return (
    <Root>
      <Tabs
        value={tabIndex}
        onChange={(_, idx) => setTabIndex(idx)}
        aria-label="links of data"
      >
        <Tab label={<div className="flex items-center"><MonitorIcon fontSize="small" /> Control Room Links</div>} idx={0} />
        <Tab label={<div className="flex items-center"><WhatshotIcon fontSize="small" /> Interesting Data</div>} idx={1}/>
      </Tabs>
      {tabIndex == 0 &&
        <div dangerouslySetInnerHTML={{__html: html}} />
      }
      {tabIndex == 1 &&
        <h2 className="muted flex justify-center">(There is nothing currently here)</h2>
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 1.5em 1em;
`
