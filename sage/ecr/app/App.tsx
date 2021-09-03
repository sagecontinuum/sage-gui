import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import LaunchIcon from '@material-ui/icons/LaunchRounded'
import Chip from '@material-ui/core/Chip'

import ErrorMsg from '../../ErrorMsg'
import RepoActions from '../RepoActions'

import {Tabs, Tab} from '../../../components/tabs/Tabs'
import {useProgress} from '../../../components/progress/ProgressProvider'
import Versions from './TagList'
import BeeIcon from 'url:../../../assets/bee.svg'
import { Thumb } from '../formatters'

import * as ECR from '../../apis/ecr'
import * as Auth from '../../../components/auth/auth'


import marked from 'marked/lib/marked'
import { Divider } from '@material-ui/core'



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

        console.log('data', repo)
        const latestTag = repo.versions[0]
        setLatestTag(latestTag)

        const hasSciMarkDown = !!latestTag?.science_description
        const mdPath = hasSciMarkDown ?
          latestTag?.science_description[0] : null
        console.log('mdPath', mdPath)

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
          {
            repo && latestTag.thumbnail ?
              <Thumb src={`${ECR.url}/meta-files/${latestTag.thumbnail[0]}`} /> :
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
            <Tab label="Science Overview" idx={0} />
            <Tab label="Tagged Versions" idx={1}/>
          </Tabs>
          <br/>


          {tabIndex == 0 &&
            <Science>
              {/*<img src={`${ECR.url}/meta-files/${latestTag.images[0]}`} width="500"/>*/}
              <div dangerouslySetInnerHTML={{__html: sciHtml}} />
            </Science>
          }

          {tabIndex == 0 && !sciHtml &&
            <div className="muted">
              There is no science description for this app yet.
            </div>
          }

          {tabIndex == 1 && repo.versions &&
            <Versions versions={repo.versions} />
          }
        </Main>

        <MetaSidebar>
          {latestTag?.homepage &&
            <>
              <h4>Homepage</h4>
              <p>
                <a href={latestTag?.homepage} target="_blank" rel="noreferrer">
                  {urlShortner(latestTag?.homepage)} <LaunchIcon className="external-link"/>
                </a>
              </p>
            </>
          }


          <h4>Repo</h4>
          <p>
            <a href={latestTag?.source.url} target="_blank" rel="noreferrer">
              {urlShortner(latestTag?.source.url.slice(0, 40))} <LaunchIcon className="external-link"/>
            </a>
          </p>

          {metaItem(latestTag, 'Authors')}

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

          {metaItem(latestTag, 'License')}
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
      <></>
  )
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

  h4 {
    opacity: 0.6;
    margin-bottom: 0.5em;
  }

  p { font-weight: 600; }
  .MuiChip-root { font-weight: 500; }
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

