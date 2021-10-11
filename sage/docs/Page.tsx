import React, { useEffect, useState } from 'react'
import {NavLink, useParams} from 'react-router-dom'
import styled from 'styled-components'
import EditIcon from '@mui/icons-material/Edit'

import marked from 'marked/lib/marked'

const githubUrl = 'https://github.com'


const index = [{
  title: 'About Sage',
  docs: [{
    title: 'Overview',
    url: `${githubUrl}/sagecontinuum/sage/blob/master/README.md`,
  }, {
    title: 'Architecture Overview',
    url: `${githubUrl}/sagecontinuum/sage/blob/master/architecture_overview.md`
  }, {
    title: 'User Interaction',
    url: `${githubUrl}/sagecontinuum/sage/blob/master/user_interaction.md`
  }],
}, {
  title: 'Developer Getting Started',
  docs: [{
    title: 'Hello World Plugin',
    url: `${githubUrl}/waggle-sensor/plugin-helloworld-ml/blob/master/README.md`
  }, {
    title: 'Writing a Plugin',
    url: `${githubUrl}/waggle-sensor/pywaggle/blob/main/docs/writing-a-plugin.md`,
  }]
}]



function getSrcUrl(url: string) {
  url = url.replace('github.com', 'raw.githubusercontent.com')
  const parts = url.split('/')
  const src = `${parts.slice(0, 5).join('/')}/${parts.slice(6).join('/')}`
  return src
}


// todo(nc): support relative paths?
function convertAttrPaths(doc: Document, tagName: string, attrName: string, url: string) {
  Array.from(doc.getElementsByTagName(tagName)).forEach(ele => {
    const attr = ele.getAttribute(attrName)
    if (attr.includes('https://')) {
      return
    } else if (attr.slice(0, 2) == './') {
      const repo = url.slice(0, url.lastIndexOf('/'))
      ele.setAttribute(attrName, `${repo}/${attr.slice(2)}`)
    } else if (attr.slice(0, 1) == '/') {
      const repo = url.slice(0, url.lastIndexOf('/'))
      ele.setAttribute(attrName, `${repo}/${attr.slice(1)}`)
    } else if (!['.', '/'].includes(attr.charAt(0))) {
      const repo = url.slice(0, url.lastIndexOf('/'))
      ele.setAttribute(attrName, `${repo}/${attr}`)
    } else {
      throw `Could not parse tag ${tagName} attribute ${attrName} path: ${attr}`
    }
  })

  return doc
}



function replaceImgSrcs(markdown: string, url: string, editUrl: string) {
  const htmlString = marked(markdown)

  const parser = new DOMParser()
  let doc = parser.parseFromString(`<html>${htmlString}</html>`, 'text/html')

  doc = convertAttrPaths(doc, 'img', 'src', url)
  doc = convertAttrPaths(doc, 'a', 'href', editUrl)

  return doc.children[0].innerHTML
}



export default function Page() {
  const {page} = useParams()

  const [editLink, setEditLink] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const title = page.replace(/\-/g, ' ')
    const editLink = index
      .reduce((acc, section) => [...acc, ...section.docs], [])
      .filter(o => o.title == title)[0].url

    const srcUrl = getSrcUrl(editLink)
    setEditLink(editLink)

    fetch(srcUrl)
      .then(res => res.text())
      .then(data => setData(replaceImgSrcs(data, srcUrl, editLink)) )
  }, [page])

  return (
    <Root>
      <Sidebar>
        <h2>Documentation</h2>

        {index.map(section => {
          const {title, docs} = section

          const entries = docs.map(({title}) =>
            <li key={title}><NavLink to={`/docs/${title.replace(/ /g, '-')}`}>{title}</NavLink></li>
          )

          return (
            <div key={title}>
              <h4>{title}</h4>
              <ul>{entries}</ul>
            </div>
          )
        })}
      </Sidebar>

      {data &&
        <PageRoot
          dangerouslySetInnerHTML={{__html: data }}>
        </PageRoot>
      }

      {editLink &&
        <a href={editLink} className="github-link flex items-center" target="_blank"  rel="noreferrer">
          <EditIcon fontSize="small"/> Edit on GitHub
        </a>
      }
    </Root>
  );
}


const Root = styled.div`
  display: flex;
  position: relative;

  .github-link {
    position: absolute;
    top: 1.5em;
    right: 3.5em;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  .active { font-weight: bold; }
  .active:hover { text-decoration: none; }

  img {
    width: 100%;
  }
`
const Sidebar = styled.div`
  padding: 50px 20px;
  width: 15rem;

  a { margin-left: 10px; }
`

const PageRoot = styled.div`
  padding: 35px 50px;
  font-size: 1.1em;
  max-width: calc(100% - 15rem);

  pre {
    background: #f8f8f8;
    border-radius: 5px;
    border: 1px solid #bbb;
    overflow-x: scroll;
    padding: 10px;
  }
`


