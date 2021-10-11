import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import ScienceIcon from '@mui/icons-material/BarChartRounded'
import TagIcon from '@mui/icons-material/LocalOfferOutlined'
import Chip from '@mui/material/Chip'

import ErrorMsg from '../../ErrorMsg'
import RepoActions from '../RepoActions'

import {Tabs, Tab} from '../../../components/tabs/Tabs'
import {useProgress} from '../../../components/progress/ProgressProvider'
import Versions from './TagList'
import BeeIcon from 'url:../../../assets/bee.svg'
import GitIcon from 'url:../../../assets/git.svg'
import LinkIcon from 'url:../../../assets/link.svg'
import { Thumb } from '../formatters'

import * as ECR from '../../apis/ecr'
import * as Auth from '../../../components/auth/auth'


import marked from 'marked/lib/marked'
import Divider from '@mui/material/Divider'



export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.Repo>(null)
  const [latestTag, setLatestTag] = useState(null)
  const [isPublic, setIsPublic] = useState(null)
  const [sciHtml, setSciHtml] = useState(null)

  const [error, setError] = useState(null)

  const [tabIndex, setTabIndex] = useState(0)


  useEffect(() => {

    const [namespace, name ] = path.split('/')

    setLoading(true)
    ECR.getRepo({namespace, name})
      .then((repo) => {
        setRepo(repo)

        const latestTag = repo.versions[0]
        setLatestTag(latestTag)

        const hasSciMarkDown = !!latestTag?.science_description
        const mdPath = hasSciMarkDown ?
          latestTag?.science_description : null

        if (mdPath) {
          fetch(`${ECR.url}/meta-files/${mdPath}`)
            .then(res => res.text())
            .then(text => setSciHtml(marked(text)))
        } else {
          // if no description, we'll only have the tagged versions tab
          setTabIndex(1)
        }
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [path, setLoading])



  const handleActionComplete = () => {
    // todo: implement
  }

  if (loading || !repo) return <></>

  return (
    <Root>
      <div className="flex justify-between">
        <div className="flex">
          {repo && latestTag.thumbnail ?
            <Thumb src={`${ECR.url}/meta-files/${latestTag.thumbnail}`} /> :
            <Thumb className="placeholder" src={BeeIcon} />
          }

          <div className="flex column">
            <div style={{fontSize: '2em', fontWeight: 'bold'}}>
              {repo.namespace} / {repo.name}
            </div>

            <p>{latestTag?.description}</p>
          </div>
        </div>


        {Auth.isSignedIn() &&
          <div className="actions">
            <RepoActions
              namespace={repo.namespace}
              name={repo.name}
              condensed={false}
              onComplete={handleActionComplete}
              versionCount={repo.versions.length}
              isPublic={isPublic}
            />
          </div>
        }
      </div>

      <HR />

      {error &&
        <ErrorMsg>{error || {}}</ErrorMsg>
      }

      <Details className="flex">
        <Main>
          <Tabs
            value={tabIndex}
            onChange={(_, idx) => setTabIndex(idx)}
            aria-label="App details tabs"
          >
            <Tab label={<div className="flex items-center"><ScienceIcon /> Science Overview</div>} idx={0} />
            <Tab label={<div className="flex items-center"><TagIcon fontSize="small"/> Tagged Versions ({repo.versions.length})</div>} idx={1}/>
          </Tabs>
          <br/>


          {tabIndex == 0 &&
            <Science>
              <div dangerouslySetInnerHTML={{__html: sciHtml}} />
            </Science>
          }

          {tabIndex == 0 && !sciHtml &&
            <div className="muted">
              No science description available for this app.
            </div>
          }

          {tabIndex == 1 && repo.versions &&
            <Versions versions={repo.versions} />
          }
        </Main>

        <MetaSidebar>
          {latestTag.images && <SciImage src={`${ECR.url}/meta-files/${latestTag.images[0]}`} />}

          <h4>Repository</h4>
          <p>
            <a href={latestTag?.source.url} target="_blank" rel="noreferrer" className="flex">
              <img src={GitIcon} className="icon"/> {' '}
              {urlShortner(latestTag?.source.url.slice(0, 40))}
            </a>
          </p>

          {latestTag?.homepage &&
            <>
              <h4>Homepage</h4>
              <p>
                <a href={latestTag?.homepage} className="flex">
                  <img src={LinkIcon} width="15" className="icon" /> {' '}
                  {urlShortner(latestTag?.homepage)}
                </a>
              </p>
            </>
          }

          {latestTag?.authors &&
            <>
              <h4>Authors</h4>
              <p>
                {latestTag?.authors.split(',').map(auth =>
                  <div key={auth}>{auth.split('<')[0]}</div>
                )}
              </p>
            </>
          }

          {latestTag?.keywords &&
            <>
              <h4>Keywords</h4>
              <Keywords>
                {latestTag?.keywords.split(',').map(keyword =>
                  <Chip key={keyword} label={keyword} variant="outlined" size="small"/>
                )}
              </Keywords>
            </>
          }

          <h4>License</h4>
          {getLicense(latestTag.license)}

          {metaItem(latestTag, 'Funding')}
          {metaItem(latestTag, 'Collaborators')}
        </MetaSidebar>
      </Details>
    </Root>
  )
}



const urlShortner = (url) =>
  `${url.slice(0, 40).replace('https://', '')}...`


const metaItem = (data, label) => {
  const key = label.toLowerCase()

  return (
    data[key]?.length ?
      <div>
        <h4>{label}</h4>
        <p>{data[key]}</p>
      </div> :
      <div>
        <h4>{label}</h4>
        <p className="muted not-found">None submitted</p>
      </div>
  )
}


// todo(nc): support more badges
const getLicense = license => {
  if (!license)
    return <p className="muted not-found">None submitted</p>

  const text = license.toLowerCase()
  let img, a
  if (text.includes('mit'))
    [img, a] = [`License-MIT-yellow.svg`, 'licenses/MIT']
  else if (text.includes('bsd') && text.includes('3'))
    [img, a] = [`License-BSD%203--Clause-blue.svg`, 'licenses/BSD-3-Clause']
  else if (text.includes('apache') && text.includes('2'))
    [img, a] = [`License-Apache%202.0-yellowgreen.svg`, 'licenses/Apache-2.0']
  else if (text.includes('gnu') && text.includes('3'))
    [img, a] = [`License-GPLv3-blue.svg`, 'licenses/gpl-3.0']

  if (a) {
    return (
      <p>
        <a href={`https://opensource.org/${a}`}>
          <img src={`https://img.shields.io/badge/${img}`} alt={license}/>
        </a>
      </p>
    )
  }

  return <p>{license}</p>
}


const Root = styled.div`
  padding: 20px 0px;
`

const HR = styled(Divider)`
  margin: 2em 0 0 0;
`

const Details = styled.div`
`

const MetaSidebar = styled.div`
  margin: 0 0 0 4em;
  min-width: 300px;
  max-width: 300px;

  h4 {
    opacity: 0.6;
    margin-bottom: 0.5em;
  }

  p {
    margin: .5em 2px 1.5em 4px;
    font-weight: 600;
    .icon {
      margin-right: .3em;
    }
  }

  .not-found {
    font-weight: 400;
  }

  .MuiChip-root { font-weight: 500; }
`

const SciImage = styled.img`
  margin-top: 1em;
  width: 100%;
`

const Main = styled.div`
  width: 100%;
`

const Science = styled.div`
  position: relative;
  width: 100%;
`

const Keywords = styled.p`

  div {
    margin: 2px;
  }
`

